import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { forumCategoriesTable, forumTopicsTable, forumRepliesTable } from "@workspace/db/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

router.get("/forum/categories", async (_req: Request, res: Response) => {
  const categories = await db
    .select({
      id: forumCategoriesTable.id,
      name: forumCategoriesTable.name,
      description: forumCategoriesTable.description,
      sortOrder: forumCategoriesTable.sortOrder,
      createdAt: forumCategoriesTable.createdAt,
      topicCount: sql<number>`(SELECT COUNT(*) FROM forum_topics WHERE category_id = ${forumCategoriesTable.id})`.as("topic_count"),
      lastActivity: sql<string>`(SELECT MAX(created_at) FROM forum_topics WHERE category_id = ${forumCategoriesTable.id})`.as("last_activity"),
    })
    .from(forumCategoriesTable)
    .orderBy(asc(forumCategoriesTable.sortOrder));
  res.json(categories);
});

router.post("/forum/categories", requireAdmin, async (req: Request, res: Response) => {
  const { name, description, sortOrder } = req.body;
  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  const [category] = await db.insert(forumCategoriesTable).values({
    name,
    description: description || "",
    sortOrder: sortOrder ?? 0,
  }).returning();
  res.json(category);
});

router.put("/forum/categories/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, description, sortOrder } = req.body;
  const [updated] = await db.update(forumCategoriesTable)
    .set({ name, description, sortOrder })
    .where(eq(forumCategoriesTable.id, id))
    .returning();
  res.json(updated);
});

router.delete("/forum/categories/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(forumRepliesTable).where(
    sql`${forumRepliesTable.topicId} IN (SELECT id FROM forum_topics WHERE category_id = ${id})`
  );
  await db.delete(forumTopicsTable).where(eq(forumTopicsTable.categoryId, id));
  await db.delete(forumCategoriesTable).where(eq(forumCategoriesTable.id, id));
  res.json({ success: true });
});

router.get("/forum/topics", async (req: Request, res: Response) => {
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
  let query = db
    .select({
      id: forumTopicsTable.id,
      categoryId: forumTopicsTable.categoryId,
      title: forumTopicsTable.title,
      authorName: forumTopicsTable.authorName,
      content: forumTopicsTable.content,
      isPinned: forumTopicsTable.isPinned,
      isLocked: forumTopicsTable.isLocked,
      createdAt: forumTopicsTable.createdAt,
      updatedAt: forumTopicsTable.updatedAt,
      replyCount: sql<number>`(SELECT COUNT(*) FROM forum_replies WHERE topic_id = ${forumTopicsTable.id})`.as("reply_count"),
    })
    .from(forumTopicsTable)
    .$dynamic();

  if (categoryId) {
    query = query.where(eq(forumTopicsTable.categoryId, categoryId));
  }

  const topics = await query.orderBy(desc(forumTopicsTable.isPinned), desc(forumTopicsTable.updatedAt));
  res.json(topics);
});

router.get("/forum/topics/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const [topic] = await db.select().from(forumTopicsTable).where(eq(forumTopicsTable.id, id));
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }
  const replies = await db.select().from(forumRepliesTable)
    .where(eq(forumRepliesTable.topicId, id))
    .orderBy(asc(forumRepliesTable.createdAt));
  res.json({ topic, replies });
});

router.post("/forum/topics", async (req: Request, res: Response) => {
  const { getUserFromRequest, isAdminRequest } = await import("../lib/jwt");
  const isAdmin = isAdminRequest(req);
  const user = getUserFromRequest(req);

  const { categoryId, title, content, authorName } = req.body;
  if (!categoryId || !title || !content) {
    res.status(400).json({ error: "categoryId, title, and content are required" });
    return;
  }

  const name = isAdmin ? "Admin" : (authorName || user?.firstName || "Anonymous");
  const email = user?.email || "";

  const [topic] = await db.insert(forumTopicsTable).values({
    categoryId,
    title,
    content,
    authorName: name,
    authorEmail: email,
  }).returning();
  res.json(topic);
});

router.put("/forum/topics/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { isPinned, isLocked, title, content } = req.body;
  const updates: any = { updatedAt: new Date() };
  if (isPinned !== undefined) updates.isPinned = isPinned;
  if (isLocked !== undefined) updates.isLocked = isLocked;
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;

  const [updated] = await db.update(forumTopicsTable)
    .set(updates)
    .where(eq(forumTopicsTable.id, id))
    .returning();
  res.json(updated);
});

router.delete("/forum/topics/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(forumRepliesTable).where(eq(forumRepliesTable.topicId, id));
  await db.delete(forumTopicsTable).where(eq(forumTopicsTable.id, id));
  res.json({ success: true });
});

router.post("/forum/replies", async (req: Request, res: Response) => {
  const { getUserFromRequest, isAdminRequest } = await import("../lib/jwt");
  const isAdmin = isAdminRequest(req);
  const user = getUserFromRequest(req);

  const { topicId, content, authorName } = req.body;
  if (!topicId || !content) {
    res.status(400).json({ error: "topicId and content are required" });
    return;
  }

  const [topic] = await db.select().from(forumTopicsTable).where(eq(forumTopicsTable.id, topicId));
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }
  if (topic.isLocked && !isAdmin) {
    res.status(403).json({ error: "This topic is locked" });
    return;
  }

  const name = isAdmin ? "Admin" : (authorName || user?.firstName || "Anonymous");
  const email = user?.email || "";

  const [reply] = await db.insert(forumRepliesTable).values({
    topicId,
    content,
    authorName: name,
    authorEmail: email,
  }).returning();

  await db.update(forumTopicsTable)
    .set({ updatedAt: new Date() })
    .where(eq(forumTopicsTable.id, topicId));

  res.json(reply);
});

router.delete("/forum/replies/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(forumRepliesTable).where(eq(forumRepliesTable.id, id));
  res.json({ success: true });
});

export default router;
