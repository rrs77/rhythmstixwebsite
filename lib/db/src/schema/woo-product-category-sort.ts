import { pgTable, text, integer, primaryKey, timestamp } from "drizzle-orm/pg-core";

export const wooProductCategorySortTable = pgTable(
  "woo_product_category_sort",
  {
    wcId: integer("wc_id").notNull(),
    categorySlug: text("category_slug").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.wcId, t.categorySlug] }),
  }),
);

export type WooProductCategorySort = typeof wooProductCategorySortTable.$inferSelect;
export type InsertWooProductCategorySort = typeof wooProductCategorySortTable.$inferInsert;
