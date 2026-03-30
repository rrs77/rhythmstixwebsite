import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const forumCategoriesTable = pgTable("forum_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const forumTopicsTable = pgTable("forum_topics", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  title: text("title").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull().default(""),
  content: text("content").notNull(),
  isPinned: boolean("is_pinned").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const forumRepliesTable = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  topicId: integer("topic_id").notNull(),
  authorName: text("author_name").notNull(),
  authorEmail: text("author_email").notNull().default(""),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ForumCategory = typeof forumCategoriesTable.$inferSelect;
export type ForumTopic = typeof forumTopicsTable.$inferSelect;
export type ForumReply = typeof forumRepliesTable.$inferSelect;
