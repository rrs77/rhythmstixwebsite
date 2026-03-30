import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { siteContentTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

router.get("/content", async (_req: Request, res: Response) => {
  const rows = await db.select().from(siteContentTable);
  const content: Record<string, string> = {};
  for (const row of rows) {
    content[row.key] = row.value;
  }
  res.json(content);
});

router.put("/content/:key", requireAdmin, async (req: Request, res: Response) => {
  const { key } = req.params;
  const { value } = req.body;
  if (typeof value !== "string") {
    res.status(400).json({ error: "value must be a string" });
    return;
  }
  const existing = await db.select().from(siteContentTable).where(eq(siteContentTable.key, key));
  if (existing.length > 0) {
    await db.update(siteContentTable).set({ value, updatedAt: new Date() }).where(eq(siteContentTable.key, key));
  } else {
    await db.insert(siteContentTable).values({ key, value });
  }
  res.json({ success: true });
});

router.get("/hidden-posts", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(siteContentTable).where(eq(siteContentTable.key, "hidden_posts"));
    const hiddenIds: number[] = rows.length > 0 ? JSON.parse(rows[0].value) : [];
    res.json(hiddenIds);
  } catch {
    res.json([]);
  }
});

router.put("/hidden-posts", requireAdmin, async (req: Request, res: Response) => {
  const { postIds } = req.body;
  if (!Array.isArray(postIds)) {
    res.status(400).json({ error: "postIds must be an array" });
    return;
  }
  const value = JSON.stringify(postIds);
  const existing = await db.select().from(siteContentTable).where(eq(siteContentTable.key, "hidden_posts"));
  if (existing.length > 0) {
    await db.update(siteContentTable).set({ value, updatedAt: new Date() }).where(eq(siteContentTable.key, "hidden_posts"));
  } else {
    await db.insert(siteContentTable).values({ key: "hidden_posts", value });
  }
  res.json({ success: true });
});

export default router;
