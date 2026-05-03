import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appsTable = pgTable("apps", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  tagline: text("tagline").notNull().default(""),
  description: text("description").notNull().default(""),
  logoUrl: text("logo_url"),
  infoHref: text("info_href"),
  appUrl: text("app_url"),
  accentFrom: text("accent_from").notNull().default("#3a9ca5"),
  accentTo: text("accent_to").notNull().default("#4cb5bd"),
  badge: text("badge"),
  sortOrder: integer("sort_order").notNull().default(0),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAppSchema = createInsertSchema(appsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertApp = z.infer<typeof insertAppSchema>;
export type App = typeof appsTable.$inferSelect;
