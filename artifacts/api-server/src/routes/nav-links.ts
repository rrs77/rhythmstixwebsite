import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { navLinksTable } from "@workspace/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

router.get("/nav-links", async (_req: Request, res: Response) => {
  const links = await db.select().from(navLinksTable).orderBy(asc(navLinksTable.sortOrder));
  res.json(links);
});

router.post("/nav-links", requireAdmin, async (req: Request, res: Response) => {
  const { label, href, group, sortOrder } = req.body;
  const [link] = await db.insert(navLinksTable).values({
    label, href, group: group || "main", sortOrder: sortOrder || 0,
  }).returning();
  res.json(link);
});

router.put("/nav-links/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { label, href, group, sortOrder } = req.body;
  const [link] = await db.update(navLinksTable).set({
    label, href, group, sortOrder, updatedAt: new Date(),
  }).where(eq(navLinksTable.id, id)).returning();
  if (!link) {
    res.status(404).json({ error: "Nav link not found" });
    return;
  }
  res.json(link);
});

router.delete("/nav-links/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(navLinksTable).where(eq(navLinksTable.id, id));
  res.json({ success: true });
});

export default router;
