import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const linkedinPostsTable = pgTable("linkedin_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LinkedinPost = typeof linkedinPostsTable.$inferSelect;

export const twitterPostsTable = pgTable("twitter_posts", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  url: text("url").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TwitterPost = typeof twitterPostsTable.$inferSelect;
