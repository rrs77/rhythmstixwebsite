import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";

export interface WooImage {
  id?: number;
  src: string;
  alt?: string;
}

export interface WooCategoryRef {
  id: number;
  name: string;
  slug: string;
}

export interface WooAttribute {
  name: string;
  options: string[];
}

export const wooProductsTable = pgTable("woo_products", {
  wcId: integer("wc_id").primaryKey(),
  slug: text("slug").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull().default("simple"),
  status: text("status").notNull().default("publish"),
  price: text("price").notNull().default(""),
  regularPrice: text("regular_price").notNull().default(""),
  salePrice: text("sale_price").notNull().default(""),
  onSale: boolean("on_sale").notNull().default(false),
  purchasable: boolean("purchasable").notNull().default(true),
  downloadable: boolean("downloadable").notNull().default(false),
  virtual: boolean("virtual").notNull().default(false),
  description: text("description").notNull().default(""),
  shortDescription: text("short_description").notNull().default(""),
  permalink: text("permalink").notNull().default(""),
  stockStatus: text("stock_status").notNull().default("instock"),
  images: jsonb("images").$type<WooImage[]>().notNull().default([]),
  categories: jsonb("categories").$type<WooCategoryRef[]>().notNull().default([]),
  attributes: jsonb("attributes").$type<WooAttribute[]>().notNull().default([]),
  menuOrder: integer("menu_order").notNull().default(0),
  adminSortOrder: integer("admin_sort_order").notNull().default(0),
  hidden: boolean("hidden").notNull().default(false),
  lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type WooProduct = typeof wooProductsTable.$inferSelect;
export type InsertWooProduct = typeof wooProductsTable.$inferInsert;
