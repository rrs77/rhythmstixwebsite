import { Router, type Request, type Response } from "express";
import sanitizeHtml from "sanitize-html";
import { db } from "@workspace/db";
import { blogPostsTable, siteContentTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router: ReturnType<typeof Router> = Router();

const WP_BASE = (process.env.WP_BASE_URL || "https://www.rhythmstix.co.uk").replace(/\/$/, "");

const IMPORT_SANITIZE: sanitizeHtml.IOptions = {
  allowedTags: [
    "h1", "h2", "h3", "h4", "h5", "h6",
    "p", "div", "span", "section", "article", "header", "footer", "main", "aside",
    "blockquote", "pre", "code",
    "ul", "ol", "li",
    "table", "thead", "tbody", "tfoot", "tr", "th", "td", "caption",
    "a", "strong", "em", "b", "i", "u", "s", "small", "sub", "sup", "mark",
    "br", "hr",
    "img", "figure", "figcaption", "picture", "source",
    "iframe",
  ],
  allowedAttributes: {
    "*": ["class", "id", "style", "title", "lang", "dir", "data-*", "aria-*", "role"],
    a: ["href", "name", "target", "rel"],
    img: ["src", "srcset", "alt", "width", "height", "loading", "decoding", "sizes"],
    source: ["src", "srcset", "type", "media", "sizes"],
    iframe: ["src", "width", "height", "frameborder", "allow", "allowfullscreen", "loading", "title"],
    td: ["colspan", "rowspan", "align", "valign"],
    th: ["colspan", "rowspan", "align", "valign", "scope"],
    table: ["border", "cellpadding", "cellspacing", "summary"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowedSchemesAppliedToAttributes: ["href", "src", "cite"],
  allowProtocolRelative: false,
  allowedIframeHostnames: [
    "www.youtube.com", "youtube.com", "www.youtube-nocookie.com", "youtube-nocookie.com",
    "player.vimeo.com",
  ],
};

function decodeEntities(html: string): string {
  return String(html || "")
    .replace(/&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function stripTags(html: string): string {
  return decodeEntities(String(html || "").replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}

interface WPPostRaw {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
}

function mapPost(p: typeof blogPostsTable.$inferSelect) {
  return {
    id: `blog:${p.id}`,
    rawId: p.id,
    source: "blog" as const,
    title: p.title,
    excerpt: p.excerpt,
    content: p.content,
    date: p.date.toISOString(),
    published: p.published,
  };
}

router.get("/blog-posts", async (_req: Request, res: Response) => {
  const posts = await db
    .select()
    .from(blogPostsTable)
    .where(eq(blogPostsTable.published, true))
    .orderBy(desc(blogPostsTable.date));
  res.json(posts.map(mapPost));
});

router.get("/blog-posts/all", requireAdmin, async (_req: Request, res: Response) => {
  const posts = await db.select().from(blogPostsTable).orderBy(desc(blogPostsTable.date));
  res.json(posts.map(mapPost));
});

const TITLE_MAX = 300;
const EXCERPT_MAX = 1000;
const CONTENT_MAX = 100_000;

router.post("/blog-posts", requireAdmin, async (req: Request, res: Response) => {
  const { title, excerpt, content, date, published } = req.body;
  if (!title || typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  const tTitle = String(title).trim().slice(0, TITLE_MAX);
  const tExcerpt = typeof excerpt === "string" ? excerpt.slice(0, EXCERPT_MAX) : "";
  const tContent = typeof content === "string"
    ? sanitizeHtml(content, IMPORT_SANITIZE).slice(0, CONTENT_MAX)
    : "";
  const [post] = await db
    .insert(blogPostsTable)
    .values({
      title: tTitle,
      excerpt: tExcerpt,
      content: tContent,
      date: date ? new Date(date) : new Date(),
      published: published !== false,
    })
    .returning();
  res.json(mapPost(post));
});

router.put("/blog-posts/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  const { title, excerpt, content, date, published } = req.body;
  const update: Partial<typeof blogPostsTable.$inferInsert> & { updatedAt: Date } = {
    updatedAt: new Date(),
  };
  if (title !== undefined) {
    if (typeof title !== "string" || !title.trim()) {
      res.status(400).json({ error: "title cannot be empty" });
      return;
    }
    update.title = title.trim().slice(0, TITLE_MAX);
  }
  if (excerpt !== undefined) update.excerpt = String(excerpt).slice(0, EXCERPT_MAX);
  if (content !== undefined) update.content = sanitizeHtml(String(content), IMPORT_SANITIZE).slice(0, CONTENT_MAX);
  if (date !== undefined) update.date = new Date(date);
  if (published !== undefined) update.published = !!published;

  const [post] = await db
    .update(blogPostsTable)
    .set(update)
    .where(eq(blogPostsTable.id, id))
    .returning();
  if (!post) {
    res.status(404).json({ error: "not found" });
    return;
  }
  res.json(mapPost(post));
});

router.post("/blog-posts/import-wordpress", requireAdmin, async (req: Request, res: Response) => {
  const log = req.log;
  try {
    // Load existing hidden_posts (used as the "already-imported" marker)
    const existingHiddenRow = await db
      .select()
      .from(siteContentTable)
      .where(eq(siteContentTable.key, "hidden_posts"));
    const hiddenIds: number[] = existingHiddenRow.length > 0
      ? (() => { try { return JSON.parse(existingHiddenRow[0].value); } catch { return []; } })()
      : [];
    const hiddenSet = new Set<number>(hiddenIds);

    // Paginate through WP REST
    let imported = 0;
    let skipped = 0;
    const newlyHidden: number[] = [];
    const perPage = 50;
    for (let page = 1; page <= 100; page++) {
      const url = `${WP_BASE}/wp-json/wp/v2/posts?per_page=${perPage}&page=${page}&_fields=id,date,slug,title,content,excerpt&orderby=date&order=desc`;
      const resp = await fetch(url);
      if (resp.status === 400 || resp.status === 404) break; // out of range / no more pages
      if (!resp.ok) {
        log.error({ status: resp.status, page }, "WordPress fetch failed");
        res.status(502).json({ error: `WordPress fetch failed: ${resp.status}` });
        return;
      }
      const posts = (await resp.json()) as WPPostRaw[];
      if (!Array.isArray(posts) || posts.length === 0) break;

      for (const wp of posts) {
        if (hiddenSet.has(wp.id)) { skipped++; continue; }
        const title = decodeEntities(wp.title?.rendered || "").trim().slice(0, TITLE_MAX);
        if (!title) { skipped++; continue; }
        const content = sanitizeHtml(wp.content?.rendered || "", IMPORT_SANITIZE).slice(0, CONTENT_MAX);
        const excerpt = stripTags(wp.excerpt?.rendered || "").slice(0, EXCERPT_MAX);
        const date = wp.date ? new Date(wp.date) : new Date();
        await db.insert(blogPostsTable).values({
          title,
          excerpt,
          content,
          date: isNaN(date.getTime()) ? new Date() : date,
          published: true,
        });
        hiddenSet.add(wp.id);
        newlyHidden.push(wp.id);
        imported++;
      }

      if (posts.length < perPage) break;
    }

    // Persist updated hidden_posts list
    const allHidden = Array.from(hiddenSet);
    const value = JSON.stringify(allHidden);
    if (existingHiddenRow.length > 0) {
      await db
        .update(siteContentTable)
        .set({ value, updatedAt: new Date() })
        .where(eq(siteContentTable.key, "hidden_posts"));
    } else {
      await db.insert(siteContentTable).values({ key: "hidden_posts", value });
    }

    log.info({ imported, skipped, newlyHidden: newlyHidden.length }, "WordPress import complete");
    res.json({ imported, skipped, hiddenTotal: allHidden.length });
  } catch (err) {
    log.error({ err }, "WordPress import failed");
    res.status(500).json({ error: "Import failed" });
  }
});

router.delete("/blog-posts/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "invalid id" });
    return;
  }
  await db.delete(blogPostsTable).where(eq(blogPostsTable.id, id));
  res.json({ success: true });
});

export default router;
