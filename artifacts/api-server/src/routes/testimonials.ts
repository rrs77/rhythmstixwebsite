import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { testimonialsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

router.get("/testimonials", async (_req: Request, res: Response) => {
  const testimonials = await db.select().from(testimonialsTable).orderBy(asc(testimonialsTable.sortOrder));
  res.json(testimonials);
});

router.post("/testimonials", requireAdmin, async (req: Request, res: Response) => {
  const { quote, author, organization, sortOrder } = req.body;
  const [testimonial] = await db.insert(testimonialsTable).values({
    quote, author, organization, sortOrder: sortOrder || 0,
  }).returning();
  res.json(testimonial);
});

router.put("/testimonials/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { quote, author, organization, sortOrder } = req.body;
  const [testimonial] = await db.update(testimonialsTable).set({
    quote, author, organization, sortOrder, updatedAt: new Date(),
  }).where(eq(testimonialsTable.id, id)).returning();
  if (!testimonial) {
    res.status(404).json({ error: "Testimonial not found" });
    return;
  }
  res.json(testimonial);
});

router.delete("/testimonials/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id));
  res.json({ success: true });
});

export default router;
