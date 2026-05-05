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
  const { label, href, group, sortOrder, visible } = req.body;
  const [link] = await db.insert(navLinksTable).values({
    label, href, group: group || "main", sortOrder: sortOrder || 0,
    visible: visible === undefined ? true : Boolean(visible),
  }).returning();
  res.json(link);
});

router.put("/nav-links/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { label, href, group, sortOrder, visible } = req.body;
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (label !== undefined) patch.label = label;
  if (href !== undefined) patch.href = href;
  if (group !== undefined) patch.group = group;
  if (sortOrder !== undefined) patch.sortOrder = sortOrder;
  if (visible !== undefined) patch.visible = Boolean(visible);
  const [link] = await db.update(navLinksTable).set(patch).where(eq(navLinksTable.id, id)).returning();
  if (!link) {
    res.status(404).json({ error: "Nav link not found" });
    return;
  }
  res.json(link);
});

router.delete("/nav-links/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  await db.delete(navLinksTable).where(eq(navLinksTable.id, id));
  res.json({ success: true });
});

export default router;
