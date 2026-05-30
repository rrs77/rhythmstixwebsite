import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const vouchersTable = pgTable("vouchers", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountType: text("discount_type").notNull(),
  discountValue: integer("discount_value").notNull(),
  active: boolean("active").notNull().default(true),
  expiresAt: timestamp("expires_at"),
  minimumOrderValue: integer("minimum_order_value").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  publicId: text("public_id").notNull().unique(),
  status: text("status").notNull().default("pending"),
  userId: integer("user_id"),
  email: text("email").notNull(),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address1: text("address1").notNull().default(""),
  address2: text("address2").notNull().default(""),
  city: text("city").notNull().default(""),
  postcode: text("postcode").notNull().default(""),
  country: text("country").notNull().default("GB"),
  subtotal: integer("subtotal").notNull().default(0),
  voucherId: integer("voucher_id"),
  voucherCode: text("voucher_code"),
  discount: integer("discount").notNull().default(0),
  total: integer("total").notNull().default(0),
  currency: text("currency").notNull().default("GBP"),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  name: text("name").notNull(),
  unitPrice: integer("unit_price").notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: integer("line_total").notNull(),
  downloadable: boolean("downloadable").notNull().default(false),
});

export type Voucher = typeof vouchersTable.$inferSelect;
export type InsertVoucher = typeof vouchersTable.$inferInsert;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
