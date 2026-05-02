import { pgTable, text, serial, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const customPagesTable = pgTable("custom_pages", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  template: text("template").notNull().default("standard"),
  data: jsonb("data").notNull().default({}),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCustomPageSchema = createInsertSchema(customPagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCustomPage = z.infer<typeof insertCustomPageSchema>;
export type CustomPage = typeof customPagesTable.$inferSelect;
