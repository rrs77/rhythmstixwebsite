import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { appsTable } from "@workspace/db/schema";
import { eq, asc, and, ne } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

function normalizeSlug(input: string): string {
  return input.toLowerCase().trim().replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-");
}

router.get("/apps", async (_req: Request, res: Response) => {
  const apps = await db.select().from(appsTable)
    .where(eq(appsTable.published, true))
    .orderBy(asc(appsTable.sortOrder), asc(appsTable.id));
  res.json(apps);
});

router.get("/apps/all", requireAdmin, async (_req: Request, res: Response) => {
  const apps = await db.select().from(appsTable).orderBy(asc(appsTable.sortOrder), asc(appsTable.id));
  res.json(apps);
});

router.post("/apps/swap-order", requireAdmin, async (req: Request, res: Response) => {
  const { idA, idB } = req.body;
  if (!Number.isFinite(idA) || !Number.isFinite(idB) || idA === idB) {
    res.status(400).json({ error: "idA and idB must be two distinct numeric ids" });
    return;
  }
  await db.transaction(async (tx) => {
    const rows = await tx.select().from(appsTable).where(eq(appsTable.id, idA));
    const rowsB = await tx.select().from(appsTable).where(eq(appsTable.id, idB));
    const a = rows[0]; const b = rowsB[0];
    if (!a || !b) throw new Error("App not found");
    await tx.update(appsTable).set({ sortOrder: b.sortOrder, updatedAt: new Date() }).where(eq(appsTable.id, a.id));
    await tx.update(appsTable).set({ sortOrder: a.sortOrder, updatedAt: new Date() }).where(eq(appsTable.id, b.id));
  });
  res.json({ success: true });
});

router.post("/apps", requireAdmin, async (req: Request, res: Response) => {
  const { slug, title, tagline, description, logoUrl, infoHref, appUrl, accentFrom, accentTo, badge, sortOrder, published } = req.body;
  if (!title || !String(title).trim()) {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  const cleanSlug = normalizeSlug(slug || title);
  if (!cleanSlug) {
    res.status(400).json({ error: "Slug could not be derived from title" });
    return;
  }
  const existing = await db.select().from(appsTable).where(eq(appsTable.slug, cleanSlug)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "An app with this slug already exists." });
    return;
  }
  const [app] = await db.insert(appsTable).values({
    slug: cleanSlug,
    title: String(title).trim(),
    tagline: tagline ?? "",
    description: description ?? "",
    logoUrl: logoUrl || null,
    infoHref: infoHref || null,
    appUrl: appUrl || null,
    accentFrom: accentFrom || "#3a9ca5",
    accentTo: accentTo || "#4cb5bd",
    badge: badge || null,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    published: published !== false,
  }).returning();
  res.json(app);
});

router.put("/apps/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const update: any = { updatedAt: new Date() };
  const { slug, title, tagline, description, logoUrl, infoHref, appUrl, accentFrom, accentTo, badge, sortOrder, published } = req.body;
  if (slug !== undefined) {
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug) {
      res.status(400).json({ error: "Slug cannot be empty" });
      return;
    }
    const conflict = await db.select().from(appsTable)
      .where(and(eq(appsTable.slug, cleanSlug), ne(appsTable.id, id)))
      .limit(1);
    if (conflict.length > 0) {
      res.status(409).json({ error: "Another app already uses this slug." });
      return;
    }
    update.slug = cleanSlug;
  }
  if (title !== undefined) update.title = String(title);
  if (tagline !== undefined) update.tagline = String(tagline);
  if (description !== undefined) update.description = String(description);
  if (logoUrl !== undefined) update.logoUrl = logoUrl || null;
  if (infoHref !== undefined) update.infoHref = infoHref || null;
  if (appUrl !== undefined) update.appUrl = appUrl || null;
  if (accentFrom !== undefined) update.accentFrom = accentFrom;
  if (accentTo !== undefined) update.accentTo = accentTo;
  if (badge !== undefined) update.badge = badge || null;
  if (sortOrder !== undefined) update.sortOrder = Number.isFinite(sortOrder) ? sortOrder : 0;
  if (published !== undefined) update.published = !!published;
  const [app] = await db.update(appsTable).set(update).where(eq(appsTable.id, id)).returning();
  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }
  res.json(app);
});

router.delete("/apps/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(appsTable).where(eq(appsTable.id, id));
  res.json({ success: true });
});

export default router;
