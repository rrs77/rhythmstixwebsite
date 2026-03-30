import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const navLinksTable = pgTable("nav_links", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  href: text("href").notNull(),
  group: text("group").notNull().default("main"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNavLinkSchema = createInsertSchema(navLinksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNavLink = z.infer<typeof insertNavLinkSchema>;
export type NavLink = typeof navLinksTable.$inferSelect;
