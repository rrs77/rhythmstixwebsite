import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { customPagesTable } from "@workspace/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

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

const ALLOWED_TEMPLATES = new Set(["standard", "cards", "features", "about", "contact"]);

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
  const [page] = await db.insert(customPagesTable).values({
    slug: cleanSlug,
    title: title || cleanSlug,
    template: tpl,
    data: data || {},
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
