import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { productsTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

router.get("/products", async (_req: Request, res: Response) => {
  const products = await db.select().from(productsTable).orderBy(asc(productsTable.sortOrder));
  res.json(products);
});

router.post("/products", requireAdmin, async (req: Request, res: Response) => {
  const { title, description, icon, color, link, cta, sortOrder } = req.body;
  const [product] = await db.insert(productsTable).values({
    title, description, icon: icon || "ClipboardCheck", color: color || "from-blue-500 to-cyan-400",
    link, cta: cta || "Learn More", sortOrder: sortOrder || 0,
  }).returning();
  res.json(product);
});

router.put("/products/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { title, description, icon, color, link, cta, sortOrder } = req.body;
  const [product] = await db.update(productsTable).set({
    title, description, icon, color, link, cta, sortOrder, updatedAt: new Date(),
  }).where(eq(productsTable.id, id)).returning();
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json(product);
});

router.delete("/products/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.json({ success: true });
});

export default router;
