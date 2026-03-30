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

export default router;
