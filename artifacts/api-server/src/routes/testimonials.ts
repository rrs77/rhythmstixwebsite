import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { testimonialsTable } from "@workspace/db/schema";
import { eq, asc, desc, sql } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

router.get("/testimonials", async (_req: Request, res: Response) => {
  const testimonials = await db
    .select()
    .from(testimonialsTable)
    .where(eq(testimonialsTable.published, true))
    .orderBy(asc(testimonialsTable.sortOrder), asc(testimonialsTable.id));
  res.json(testimonials);
});

router.get("/testimonials/all", requireAdmin, async (_req: Request, res: Response) => {
  const testimonials = await db
    .select()
    .from(testimonialsTable)
    .orderBy(asc(testimonialsTable.sortOrder), asc(testimonialsTable.id));
  res.json(testimonials);
});

router.post("/testimonials", requireAdmin, async (req: Request, res: Response) => {
  const { quote, author, organization, app, published, sortOrder } = req.body;
  if (!quote || !author || !organization) {
    res.status(400).json({ error: "quote, author and organization are required" });
    return;
  }
  let nextSort = typeof sortOrder === "number" ? sortOrder : undefined;
  if (nextSort === undefined) {
    const [last] = await db
      .select({ sortOrder: testimonialsTable.sortOrder })
      .from(testimonialsTable)
      .orderBy(desc(testimonialsTable.sortOrder))
      .limit(1);
    nextSort = (last?.sortOrder ?? -1) + 1;
  }
  const [testimonial] = await db.insert(testimonialsTable).values({
    quote: String(quote),
    author: String(author),
    organization: String(organization),
    app: app ? String(app) : null,
    published: published === undefined ? true : !!published,
    sortOrder: nextSort,
  }).returning();
  res.json(testimonial);
});

router.put("/testimonials/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { quote, author, organization, app, published, sortOrder } = req.body;
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (quote !== undefined) update.quote = String(quote);
  if (author !== undefined) update.author = String(author);
  if (organization !== undefined) update.organization = String(organization);
  if (app !== undefined) update.app = app === null || app === "" ? null : String(app);
  if (published !== undefined) update.published = !!published;
  if (sortOrder !== undefined) update.sortOrder = Number(sortOrder) || 0;
  const [testimonial] = await db.update(testimonialsTable).set(update).where(eq(testimonialsTable.id, id)).returning();
  if (!testimonial) {
    res.status(404).json({ error: "Testimonial not found" });
    return;
  }
  res.json(testimonial);
});

router.post("/testimonials/swap-order", requireAdmin, async (req: Request, res: Response) => {
  const { idA, idB } = req.body;
  const a = parseInt(String(idA));
  const b = parseInt(String(idB));
  if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) {
    res.status(400).json({ error: "idA and idB must be two distinct numeric ids" });
    return;
  }
  await db.transaction(async (tx) => {
    const rows = await tx.select().from(testimonialsTable).where(sql`${testimonialsTable.id} in (${a}, ${b})`);
    if (rows.length !== 2) throw new Error("Both testimonials must exist");
    const ra = rows.find((r) => r.id === a)!;
    const rb = rows.find((r) => r.id === b)!;
    await tx.update(testimonialsTable).set({ sortOrder: rb.sortOrder, updatedAt: new Date() }).where(eq(testimonialsTable.id, a));
    await tx.update(testimonialsTable).set({ sortOrder: ra.sortOrder, updatedAt: new Date() }).where(eq(testimonialsTable.id, b));
  });
  res.json({ success: true });
});

router.delete("/testimonials/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
  res.json({ success: true });
});

export default router;
