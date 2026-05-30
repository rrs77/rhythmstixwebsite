import { Router, type Request, type Response } from "express";
import sanitizeHtml from "sanitize-html";
import { db } from "@workspace/db";
import { customPagesTable } from "@workspace/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

const RICH_HTML_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
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
  allowedStyles: {
    "*": {
      "text-align": [/^.*$/],
      "color": [/^.*$/],
      "background-color": [/^.*$/],
      "font-size": [/^.*$/],
      "font-weight": [/^.*$/],
      "font-style": [/^.*$/],
      "text-decoration": [/^.*$/],
      "width": [/^.*$/],
      "max-width": [/^.*$/],
      "height": [/^.*$/],
      "margin": [/^.*$/],
      "padding": [/^.*$/],
      "border": [/^.*$/],
      "border-radius": [/^.*$/],
      "display": [/^.*$/],
      "float": [/^.*$/],
      "line-height": [/^.*$/],
    },
  },
};

function sanitizeRichHtmlData(template: string, data: unknown): unknown {
  if (template !== "richhtml" || !data || typeof data !== "object" || Array.isArray(data)) return data;
  const obj = data as Record<string, unknown>;
  if (typeof obj.body === "string") {
    return { ...obj, body: sanitizeHtml(obj.body, RICH_HTML_SANITIZE_OPTIONS) };
  }
  return data;
}

const RESERVED_SLUGS = new Set([
  "", "admin", "login", "register", "forgot-password", "account",
  "blog", "post", "page", "shop", "contact", "community", "cookies",
  "assessify", "ccdesigner", "perifeedback", "progresspath",
  "rhythmstix-app", "app", "elearning", "api",
]);

function normalizeSlug(input: string): string {
  return input.toLowerCase().trim().replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

router.get("/pages", requireAdmin, async (_req: Request, res: Response) => {
  const pages = await db.select().from(customPagesTable).orderBy(desc(customPagesTable.updatedAt));
  res.json(pages);
});

router.get("/pages/by-slug/:slug", async (req: Request, res: Response) => {
  const slug = normalizeSlug(String(req.params.slug));
  const [page] = await db.select().from(customPagesTable).where(eq(customPagesTable.slug, slug)).limit(1);
  if (!page || !page.published) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(page);
});

const ALLOWED_TEMPLATES = new Set(["standard", "cards", "features", "about", "contact", "richhtml"]);

router.post("/pages", requireAdmin, async (req: Request, res: Response) => {
  const { slug, title, template, data, published } = req.body;
  const cleanSlug = normalizeSlug(slug || title || "");
  if (!cleanSlug) {
    res.status(400).json({ error: "Slug or title is required" });
    return;
  }
  if (RESERVED_SLUGS.has(cleanSlug)) {
    res.status(400).json({ error: `Slug "${cleanSlug}" is reserved by the system. Try another.` });
    return;
  }
  const tpl = template || "standard";
  if (!ALLOWED_TEMPLATES.has(tpl)) {
    res.status(400).json({ error: `Unknown template "${tpl}".` });
    return;
  }
  if (data !== undefined && (typeof data !== "object" || Array.isArray(data) || data === null)) {
    res.status(400).json({ error: "Page data must be an object." });
    return;
  }
  const existing = await db.select().from(customPagesTable).where(eq(customPagesTable.slug, cleanSlug)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "A page with this slug already exists." });
    return;
  }
  const cleanData = sanitizeRichHtmlData(tpl, data || {});
  const [page] = await db.insert(customPagesTable).values({
    slug: cleanSlug,
    title: title || cleanSlug,
    template: tpl,
    data: cleanData as object,
    published: published !== false,
  }).returning();
  res.json(page);
});

router.put("/pages/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid page id" });
    return;
  }
  const { slug, title, template, data, published } = req.body;
  const update: any = { updatedAt: new Date() };
  if (slug !== undefined) {
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug) {
      res.status(400).json({ error: "Slug cannot be empty" });
      return;
    }
    if (RESERVED_SLUGS.has(cleanSlug)) {
      res.status(400).json({ error: `Slug "${cleanSlug}" is reserved.` });
      return;
    }
    const conflict = await db.select().from(customPagesTable)
      .where(and(eq(customPagesTable.slug, cleanSlug), ne(customPagesTable.id, id)))
      .limit(1);
    if (conflict.length > 0) {
      res.status(409).json({ error: "Another page already uses this slug." });
      return;
    }
    update.slug = cleanSlug;
  }
  if (title !== undefined) update.title = String(title);
  if (template !== undefined) {
    if (!ALLOWED_TEMPLATES.has(template)) {
      res.status(400).json({ error: `Unknown template "${template}".` });
      return;
    }
    update.template = template;
  }
  if (data !== undefined) {
    if (typeof data !== "object" || Array.isArray(data) || data === null) {
      res.status(400).json({ error: "Page data must be an object." });
      return;
    }
    update.data = data;
  }
  if (published !== undefined) update.published = !!published;

  if (update.data !== undefined) {
    let effectiveTemplate = update.template as string | undefined;
    if (!effectiveTemplate) {
      const [current] = await db.select({ template: customPagesTable.template }).from(customPagesTable).where(eq(customPagesTable.id, id)).limit(1);
      effectiveTemplate = current?.template;
    }
    if (effectiveTemplate) {
      update.data = sanitizeRichHtmlData(effectiveTemplate, update.data);
    }
  }

  const [page] = await db.update(customPagesTable).set(update).where(eq(customPagesTable.id, id)).returning();
  if (!page) {
    res.status(404).json({ error: "Page not found" });
    return;
  }
  res.json(page);
});

router.delete("/pages/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid page id" });
    return;
  }
  await db.delete(customPagesTable).where(eq(customPagesTable.id, id));
  res.json({ success: true });
});

export default router;
