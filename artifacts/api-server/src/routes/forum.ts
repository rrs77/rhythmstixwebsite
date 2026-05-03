import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { forumCategoriesTable, forumTopicsTable, forumRepliesTable } from "@workspace/db/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import { requireAdmin } from "./auth";
import { getUserFromRequest, isAdminRequest } from "../lib/jwt";

function safeAuthorName(input: unknown): string {
  if (typeof input !== "string") return "Anonymous";
  const trimmed = input.trim().slice(0, 60);
  return trimmed.length > 0 ? trimmed : "Anonymous";
}

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
  const id = parseInt(String(req.params.id));
  const { name, description, sortOrder } = req.body;
  const [updated] = await db.update(forumCategoriesTable)
    .set({ name, description, sortOrder })
    .where(eq(forumCategoriesTable.id, id))
    .returning();
  res.json(updated);
});

router.delete("/forum/categories/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
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
  const id = parseInt(String(req.params.id));
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
  const isAdmin = isAdminRequest(req);
  const user = getUserFromRequest(req);

  const { categoryId, title, content, authorName } = req.body;
  const catId = Number(categoryId);
  if (!Number.isInteger(catId) || catId <= 0 || typeof title !== "string" || typeof content !== "string") {
    res.status(400).json({ error: "categoryId (integer), title, and content are required" });
    return;
  }
  const trimmedTitle = title.trim().slice(0, 200);
  const trimmedContent = content.trim().slice(0, 20_000);
  if (!trimmedTitle || !trimmedContent) {
    res.status(400).json({ error: "title and content cannot be empty" });
    return;
  }

  const [category] = await db.select({ id: forumCategoriesTable.id })
    .from(forumCategoriesTable).where(eq(forumCategoriesTable.id, catId));
  if (!category) {
    res.status(400).json({ error: "Invalid categoryId" });
    return;
  }

  const name = isAdmin
    ? "Admin"
    : user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User"
      : safeAuthorName(authorName);
  const email = user?.email || "";

  const [topic] = await db.insert(forumTopicsTable).values({
    categoryId: catId,
    title: trimmedTitle,
    content: trimmedContent,
    authorName: name,
    authorEmail: email,
  }).returning();
  res.json(topic);
});

router.put("/forum/topics/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
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
  const id = parseInt(String(req.params.id));
  await db.delete(forumRepliesTable).where(eq(forumRepliesTable.topicId, id));
  await db.delete(forumTopicsTable).where(eq(forumTopicsTable.id, id));
  res.json({ success: true });
});

router.post("/forum/replies", async (req: Request, res: Response) => {
  const isAdmin = isAdminRequest(req);
  const user = getUserFromRequest(req);

  const { topicId, content, authorName } = req.body;
  const tid = Number(topicId);
  if (!Number.isInteger(tid) || tid <= 0 || typeof content !== "string") {
    res.status(400).json({ error: "topicId (integer) and content are required" });
    return;
  }
  const trimmedContent = content.trim().slice(0, 20_000);
  if (!trimmedContent) {
    res.status(400).json({ error: "content cannot be empty" });
    return;
  }

  const [topic] = await db.select().from(forumTopicsTable).where(eq(forumTopicsTable.id, tid));
  if (!topic) {
    res.status(404).json({ error: "Topic not found" });
    return;
  }
  if (topic.isLocked && !isAdmin) {
    res.status(403).json({ error: "This topic is locked" });
    return;
  }

  const name = isAdmin
    ? "Admin"
    : user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || "User"
      : safeAuthorName(authorName);
  const email = user?.email || "";

  const [reply] = await db.insert(forumRepliesTable).values({
    topicId: tid,
    content: trimmedContent,
    authorName: name,
    authorEmail: email,
  }).returning();

  await db.update(forumTopicsTable)
    .set({ updatedAt: new Date() })
    .where(eq(forumTopicsTable.id, tid));

  res.json(reply);
});

router.delete("/forum/replies/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  await db.delete(forumRepliesTable).where(eq(forumRepliesTable.id, id));
  res.json({ success: true });
});

export default router;
