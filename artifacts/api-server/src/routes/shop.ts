import { Router, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@workspace/db";
import {
  vouchersTable,
  ordersTable,
  orderItemsTable,
  wooProductsTable,
  type Voucher,
} from "@workspace/db/schema";
import { requireAdmin } from "./auth";
import { logger } from "../lib/logger";

const router = Router();

const MAX_LINE_ITEMS = 20;
const MAX_QUANTITY_PER_ITEM = 50;

const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many order attempts. Please try again later." },
});

const voucherLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many voucher attempts. Please try again later." },
});

// ---- Stripe client (lazy) ------------------------------------------------

let stripeClient: Stripe | null = null;
function getStripe(): Stripe | null {
  if (stripeClient) return stripeClient;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  stripeClient = new Stripe(key);
  return stripeClient;
}

// ---- Helpers -------------------------------------------------------------

function poundsToPence(value: string | number): number {
  const n = typeof value === "number" ? value : parseFloat(value);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

function penceToPounds(pence: number): string {
  return (pence / 100).toFixed(2);
}

function normalizeCode(raw: unknown): string {
  return String(raw || "").trim().toUpperCase();
}

function isVoucherUsable(v: Voucher, subtotalPence: number): { ok: true } | { ok: false; reason: string } {
  if (!v.active) return { ok: false, reason: "This voucher is no longer active." };
  if (v.expiresAt && new Date(v.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "This voucher has expired." };
  }
  if (v.minimumOrderValue > 0 && subtotalPence < v.minimumOrderValue) {
    return {
      ok: false,
      reason: `Minimum order of £${penceToPounds(v.minimumOrderValue)} is required for this voucher.`,
    };
  }
  if (v.discountType !== "percentage" && v.discountType !== "fixed") {
    return { ok: false, reason: "This voucher is misconfigured." };
  }
  return { ok: true };
}

function computeDiscount(v: Voucher, subtotalPence: number): number {
  if (v.discountType === "percentage") {
    const pct = Math.max(0, Math.min(100, v.discountValue));
    return Math.floor((subtotalPence * pct) / 100);
  }
  // fixed: discountValue is pence
  return Math.min(Math.max(0, v.discountValue), subtotalPence);
}

function newPublicOrderId(): string {
  // RX-XXXXXX (6 base36 chars). Collision odds negligible at our scale; DB
  // unique constraint catches the unlucky case.
  return `RX-${randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
}

function siteOrigin(req: Request): string {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "";
  return `${proto}://${host}`;
}

// ---- Public: voucher validation -----------------------------------------

router.post("/shop/vouchers/validate", voucherLimiter, async (req: Request, res: Response) => {
  try {
    const code = normalizeCode(req.body?.code);
    const subtotalPounds = Number(req.body?.subtotal);
    if (!code) {
      res.status(400).json({ error: "Voucher code is required" });
      return;
    }
    if (!Number.isFinite(subtotalPounds) || subtotalPounds < 0) {
      res.status(400).json({ error: "Invalid basket subtotal" });
      return;
    }
    const subtotalPence = Math.round(subtotalPounds * 100);

    const [voucher] = await db
      .select()
      .from(vouchersTable)
      .where(eq(vouchersTable.code, code))
      .limit(1);

    if (!voucher) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }

    const check = isVoucherUsable(voucher, subtotalPence);
    if (!check.ok) {
      res.status(400).json({ error: check.reason });
      return;
    }

    const discount = computeDiscount(voucher, subtotalPence);
    res.json({
      code: voucher.code,
      discountType: voucher.discountType,
      discountValue: voucher.discountValue,
      minimumOrderValue: voucher.minimumOrderValue,
      discount: discount / 100,
      total: Math.max(0, subtotalPence - discount) / 100,
    });
  } catch (err) {
    req.log?.error({ err }, "voucher validate failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---- Public: create order + Stripe Checkout session ---------------------

router.post("/shop/orders", orderLimiter, async (req: Request, res: Response) => {
  try {
    const { getUserFromRequest } = await import("../lib/jwt");
    const user = getUserFromRequest(req);

    const body = req.body || {};
    const rawItems: any[] = Array.isArray(body.items) && body.items.length > 0
      ? body.items
      : body.productId
      ? [{ productId: body.productId, quantity: body.quantity }]
      : [];

    if (rawItems.length === 0) {
      res.status(400).json({ error: "At least one product is required" });
      return;
    }
    if (rawItems.length > MAX_LINE_ITEMS) {
      res.status(400).json({ error: `Too many items (max ${MAX_LINE_ITEMS})` });
      return;
    }

    const items: { productId: number; quantity: number }[] = [];
    for (const it of rawItems) {
      const productId = Number(it?.productId);
      const quantity = Math.floor(Number(it?.quantity ?? 1));
      if (!Number.isInteger(productId) || productId <= 0) {
        res.status(400).json({ error: "Invalid productId in items" });
        return;
      }
      if (!Number.isFinite(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_ITEM) {
        res.status(400).json({ error: `Quantity must be between 1 and ${MAX_QUANTITY_PER_ITEM}` });
        return;
      }
      items.push({ productId, quantity });
    }

    const billing = body.billing || {};
    const billingEmail = String(billing.email || user?.email || "").trim().toLowerCase();
    if (!billingEmail) {
      res.status(400).json({ error: "Billing email is required" });
      return;
    }
    const firstName = String(billing.firstName || user?.firstName || "").trim();
    const lastName = String(billing.lastName || user?.lastName || "").trim();
    if (!firstName || !lastName) {
      res.status(400).json({ error: "First and last name are required" });
      return;
    }

    // Re-price every item server-side against the local woo_products table
    // (already kept in sync from WooCommerce). Fail closed if any product is
    // missing, hidden, or not purchasable — never silently fall through.
    const productIds = items.map((it) => it.productId);
    const products = await db
      .select()
      .from(wooProductsTable)
      .where(inArray(wooProductsTable.wcId, productIds));
    const byId = new Map(products.map((p) => [p.wcId, p]));

    const orderItems: {
      productId: number;
      name: string;
      unitPrice: number;
      quantity: number;
      lineTotal: number;
      downloadable: boolean;
    }[] = [];
    let subtotalPence = 0;
    for (const it of items) {
      const p = byId.get(it.productId);
      if (!p) {
        res.status(400).json({ error: `Product ${it.productId} is not available` });
        return;
      }
      if (p.hidden || !p.purchasable || p.status !== "publish") {
        res.status(400).json({ error: `Product ${p.name} is not purchasable` });
        return;
      }
      const unitPrice = poundsToPence(p.price);
      if (!Number.isFinite(unitPrice)) {
        res.status(400).json({ error: `Product ${p.name} has an invalid price` });
        return;
      }
      const lineTotal = unitPrice * it.quantity;
      subtotalPence += lineTotal;
      orderItems.push({
        productId: p.wcId,
        name: p.name,
        unitPrice,
        quantity: it.quantity,
        lineTotal,
        downloadable: !!p.downloadable,
      });
    }

    // Voucher (optional) — re-validate server-side; never trust client total.
    const voucherCodeInput = normalizeCode(body.voucherCode);
    let voucher: Voucher | null = null;
    let discountPence = 0;
    if (voucherCodeInput) {
      const [v] = await db
        .select()
        .from(vouchersTable)
        .where(eq(vouchersTable.code, voucherCodeInput))
        .limit(1);
      if (!v) {
        res.status(400).json({ error: "Voucher code is invalid" });
        return;
      }
      const check = isVoucherUsable(v, subtotalPence);
      if (!check.ok) {
        res.status(400).json({ error: check.reason });
        return;
      }
      voucher = v;
      discountPence = computeDiscount(v, subtotalPence);
    }

    const totalPence = Math.max(0, subtotalPence - discountPence);

    // Persist the order in 'pending' state. We commit to a public id up-front
    // so the Stripe session metadata can reference it and the success page
    // can look it up by session id later.
    const publicId = newPublicOrderId();
    const [order] = await db
      .insert(ordersTable)
      .values({
        publicId,
        status: totalPence === 0 ? "free" : "pending",
        userId: user?.id || null,
        email: billingEmail,
        firstName,
        lastName,
        phone: String(billing.phone || ""),
        address1: String(billing.address1 || ""),
        address2: String(billing.address2 || ""),
        city: String(billing.city || ""),
        postcode: String(billing.postcode || ""),
        country: String(billing.country || "GB"),
        subtotal: subtotalPence,
        voucherId: voucher?.id ?? null,
        voucherCode: voucher?.code ?? null,
        discount: discountPence,
        total: totalPence,
        currency: "GBP",
        paidAt: totalPence === 0 ? new Date() : null,
      })
      .returning();

    await db.insert(orderItemsTable).values(
      orderItems.map((it) => ({
        orderId: order.id,
        productId: it.productId,
        name: it.name,
        unitPrice: it.unitPrice,
        quantity: it.quantity,
        lineTotal: it.lineTotal,
        downloadable: it.downloadable,
      })),
    );

    // Free order — no payment needed. Skip Stripe entirely.
    if (totalPence === 0) {
      res.json({
        orderId: order.id,
        publicId: order.publicId,
        status: "free",
        total: penceToPounds(totalPence),
        currency: "GBP",
        paymentUrl: null,
        isFree: true,
      });
      return;
    }

    // Paid order — create Stripe Checkout session.
    const stripe = getStripe();
    if (!stripe) {
      await db
        .update(ordersTable)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(ordersTable.id, order.id));
      res.status(503).json({ error: "Payments are not configured. Please contact support." });
      return;
    }

    const origin = siteOrigin(req);
    let session: Stripe.Checkout.Session;
    try {
      // If a voucher was applied, mirror it as a Stripe one-time coupon so the
      // Stripe-hosted receipt shows the discount, not just a reduced price.
      let discountParam: { coupon: string }[] | undefined;
      if (voucher && discountPence > 0) {
        const couponParams: Stripe.CouponCreateParams =
          voucher.discountType === "percentage"
            ? {
                duration: "once",
                percent_off: Math.max(0, Math.min(100, voucher.discountValue)),
                name: `Voucher ${voucher.code}`,
              }
            : {
                duration: "once",
                amount_off: discountPence,
                currency: "gbp",
                name: `Voucher ${voucher.code}`,
              };
        const coupon = await stripe.coupons.create(couponParams);
        discountParam = [{ coupon: coupon.id }];
      }

      session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer_email: billingEmail,
        line_items: orderItems.map((it) => ({
          quantity: it.quantity,
          price_data: {
            currency: "gbp",
            unit_amount: it.unitPrice,
            product_data: {
              name: it.name,
            },
          },
        })),
        discounts: discountParam,
        metadata: {
          orderId: String(order.id),
          publicId: order.publicId,
        },
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/basket?stripe_cancelled=1`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Stripe checkout failed";
      logger.error({ err }, "stripe checkout session create failed");
      await db
        .update(ordersTable)
        .set({ status: "failed", updatedAt: new Date() })
        .where(eq(ordersTable.id, order.id));
      res.status(502).json({ error: message });
      return;
    }

    await db
      .update(ordersTable)
      .set({ stripeSessionId: session.id, updatedAt: new Date() })
      .where(eq(ordersTable.id, order.id));

    res.json({
      orderId: order.id,
      publicId: order.publicId,
      status: "pending",
      total: penceToPounds(totalPence),
      currency: "GBP",
      paymentUrl: session.url,
      isFree: false,
    });
  } catch (err) {
    req.log?.error({ err }, "create order failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---- Public: confirm an order after Stripe-hosted checkout --------------
// Called by the /checkout/success page. This is the synchronous fallback for
// when no Stripe webhook is configured yet — we fetch the session ourselves
// and mark the order paid if Stripe says it is. Idempotent.

router.get("/shop/orders/confirm", async (req: Request, res: Response) => {
  try {
    const sessionId = String(req.query.session_id || "").trim();
    if (!sessionId.startsWith("cs_")) {
      res.status(400).json({ error: "Invalid session id" });
      return;
    }
    const [order] = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.stripeSessionId, sessionId))
      .limit(1);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    if (order.status !== "paid") {
      const stripe = getStripe();
      if (stripe) {
        try {
          const session = await stripe.checkout.sessions.retrieve(sessionId);
          if (session.payment_status === "paid") {
            await db
              .update(ordersTable)
              .set({
                status: "paid",
                paidAt: new Date(),
                stripePaymentIntentId:
                  typeof session.payment_intent === "string"
                    ? session.payment_intent
                    : session.payment_intent?.id || null,
                updatedAt: new Date(),
              })
              .where(eq(ordersTable.id, order.id));
            order.status = "paid";
          }
        } catch (err) {
          logger.warn({ err }, "stripe session retrieve failed during confirm");
        }
      }
    }

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(eq(orderItemsTable.orderId, order.id));

    res.json({
      orderId: order.id,
      publicId: order.publicId,
      status: order.status,
      total: penceToPounds(order.total),
      subtotal: penceToPounds(order.subtotal),
      discount: penceToPounds(order.discount),
      voucherCode: order.voucherCode,
      currency: order.currency,
      email: order.email,
      items: items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        total: penceToPounds(it.lineTotal),
        downloadable: it.downloadable,
      })),
    });
  } catch (err) {
    req.log?.error({ err }, "confirm order failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---- Public: order history (logged-in users) ----------------------------

router.get("/shop/orders", async (req: Request, res: Response) => {
  try {
    const { getUserFromRequest } = await import("../lib/jwt");
    const user = getUserFromRequest(req);
    if (!user) {
      res.status(401).json({ error: "You must be logged in" });
      return;
    }

    const orders = await db
      .select()
      .from(ordersTable)
      .where(eq(ordersTable.userId, user.id))
      .orderBy(desc(ordersTable.createdAt));

    if (orders.length === 0) {
      res.json([]);
      return;
    }

    const items = await db
      .select()
      .from(orderItemsTable)
      .where(
        inArray(
          orderItemsTable.orderId,
          orders.map((o) => o.id),
        ),
      );
    const itemsByOrder = new Map<number, typeof items>();
    for (const it of items) {
      const arr = itemsByOrder.get(it.orderId) ?? [];
      arr.push(it);
      itemsByOrder.set(it.orderId, arr);
    }

    res.json(
      orders.map((o) => ({
        id: o.id,
        number: o.publicId,
        status: o.status,
        dateCreated: o.createdAt.toISOString(),
        total: penceToPounds(o.total),
        currency: o.currency,
        paymentMethod: o.total === 0 ? "free" : "Stripe",
        items: (itemsByOrder.get(o.id) || []).map((it) => ({
          id: it.id,
          name: it.name,
          quantity: it.quantity,
          total: penceToPounds(it.lineTotal),
          productId: it.productId,
        })),
        billing: {
          firstName: o.firstName,
          lastName: o.lastName,
          email: o.email,
          company: "",
        },
      })),
    );
  } catch (err) {
    req.log?.error({ err }, "list orders failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---- Stripe webhook ------------------------------------------------------

router.post("/webhooks/stripe", async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) {
    res.status(503).json({ error: "Stripe not configured" });
    return;
  }
  const sig = req.header("stripe-signature");
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (secret) {
      // Secret configured: require a verified signature, no matter the env.
      if (!sig || !rawBody) {
        logger.warn("stripe webhook rejected: missing signature or raw body");
        res.status(400).json({ error: "Missing signature" });
        return;
      }
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } else if (process.env.NODE_ENV !== "production") {
      // Dev convenience only: no secret set, no verification. Never in prod.
      logger.warn(
        "STRIPE_WEBHOOK_SECRET not set; accepting unsigned webhook (DEV ONLY).",
      );
      event = req.body as Stripe.Event;
    } else {
      logger.error(
        "STRIPE_WEBHOOK_SECRET is not set in production; rejecting webhook.",
      );
      res.status(503).json({ error: "Webhook not configured" });
      return;
    }
  } catch (err) {
    logger.warn({ err }, "stripe webhook signature verification failed");
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  async function markPaid(session: Stripe.Checkout.Session) {
    const orderIdStr = session.metadata?.orderId;
    const orderId = orderIdStr ? Number(orderIdStr) : NaN;
    if (!Number.isInteger(orderId) || orderId <= 0) return;
    await db
      .update(ordersTable)
      .set({
        status: "paid",
        paidAt: new Date(),
        stripePaymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id || null,
        updatedAt: new Date(),
      })
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.status, "pending")));
  }

  async function markTerminal(session: Stripe.Checkout.Session, status: "cancelled" | "failed") {
    const orderIdStr = session.metadata?.orderId;
    const orderId = orderIdStr ? Number(orderIdStr) : NaN;
    if (!Number.isInteger(orderId) || orderId <= 0) return;
    await db
      .update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(ordersTable.id, orderId), eq(ordersTable.status, "pending")));
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      // Card payments resolve to "paid" immediately; async methods (e.g. BACS,
      // bank transfer) stay "unpaid" here and fire async_payment_* later.
      if (session.payment_status === "paid") {
        await markPaid(session);
      }
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      await markPaid(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "checkout.session.async_payment_failed") {
      await markTerminal(event.data.object as Stripe.Checkout.Session, "failed");
    } else if (event.type === "checkout.session.expired") {
      await markTerminal(event.data.object as Stripe.Checkout.Session, "cancelled");
    }
    res.json({ received: true });
  } catch (err) {
    logger.error({ err, type: event.type }, "stripe webhook handler failed");
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

// ---- Admin: vouchers CRUD -----------------------------------------------

router.get("/admin/vouchers", requireAdmin, async (_req: Request, res: Response) => {
  const rows = await db.select().from(vouchersTable).orderBy(desc(vouchersTable.createdAt));
  res.json(
    rows.map((v) => ({
      id: v.id,
      code: v.code,
      discountType: v.discountType,
      discountValue: v.discountValue,
      active: v.active,
      expiresAt: v.expiresAt ? v.expiresAt.toISOString() : null,
      minimumOrderValue: v.minimumOrderValue,
      createdAt: v.createdAt.toISOString(),
    })),
  );
});

function parseVoucherInput(body: any, partial: boolean):
  | { ok: true; value: Partial<typeof vouchersTable.$inferInsert> }
  | { ok: false; error: string } {
  const out: Partial<typeof vouchersTable.$inferInsert> = {};

  if (!partial || body.code !== undefined) {
    const code = normalizeCode(body.code);
    if (!code || code.length > 64 || !/^[A-Z0-9_-]+$/.test(code)) {
      return { ok: false, error: "Code must be 1-64 chars: A-Z, 0-9, hyphen, underscore." };
    }
    out.code = code;
  }
  if (!partial || body.discountType !== undefined) {
    const t = String(body.discountType || "");
    if (t !== "percentage" && t !== "fixed") {
      return { ok: false, error: "discountType must be 'percentage' or 'fixed'." };
    }
    out.discountType = t;
  }
  if (!partial || body.discountValue !== undefined) {
    const type = out.discountType ?? body.discountType;
    if (type === "percentage") {
      const pct = Number(body.discountValue);
      if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
        return { ok: false, error: "Percentage must be between 1 and 100." };
      }
      out.discountValue = Math.round(pct);
    } else {
      // fixed: accept pounds from admin UI, store pence
      const pounds = Number(body.discountValue);
      if (!Number.isFinite(pounds) || pounds <= 0) {
        return { ok: false, error: "Discount amount must be greater than 0." };
      }
      out.discountValue = Math.round(pounds * 100);
    }
  }
  if (!partial || body.active !== undefined) {
    out.active = !!body.active;
  }
  if (!partial || body.expiresAt !== undefined) {
    if (body.expiresAt === null || body.expiresAt === "" || body.expiresAt === undefined) {
      out.expiresAt = null;
    } else {
      const d = new Date(body.expiresAt);
      if (Number.isNaN(d.getTime())) {
        return { ok: false, error: "expiresAt must be a valid date." };
      }
      out.expiresAt = d;
    }
  }
  if (!partial || body.minimumOrderValue !== undefined) {
    const pounds = Number(body.minimumOrderValue ?? 0);
    if (!Number.isFinite(pounds) || pounds < 0) {
      return { ok: false, error: "Minimum order value must be 0 or more." };
    }
    out.minimumOrderValue = Math.round(pounds * 100);
  }
  return { ok: true, value: out };
}

router.post("/admin/vouchers", requireAdmin, async (req: Request, res: Response) => {
  const parsed = parseVoucherInput(req.body || {}, false);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  try {
    const [row] = await db
      .insert(vouchersTable)
      .values(parsed.value as typeof vouchersTable.$inferInsert)
      .returning();
    res.status(201).json({
      id: row.id,
      code: row.code,
      discountType: row.discountType,
      discountValue: row.discountValue,
      active: row.active,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      minimumOrderValue: row.minimumOrderValue,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err: any) {
    if (String(err?.message || "").includes("vouchers_code_unique") || err?.code === "23505") {
      res.status(409).json({ error: "A voucher with that code already exists." });
      return;
    }
    req.log?.error({ err }, "create voucher failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/admin/vouchers/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = parseVoucherInput(req.body || {}, true);
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  if (Object.keys(parsed.value).length === 0) {
    res.status(400).json({ error: "No fields to update" });
    return;
  }
  try {
    const [row] = await db
      .update(vouchersTable)
      .set({ ...parsed.value, updatedAt: new Date() })
      .where(eq(vouchersTable.id, id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Voucher not found" });
      return;
    }
    res.json({
      id: row.id,
      code: row.code,
      discountType: row.discountType,
      discountValue: row.discountValue,
      active: row.active,
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      minimumOrderValue: row.minimumOrderValue,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (err: any) {
    if (String(err?.message || "").includes("vouchers_code_unique") || err?.code === "23505") {
      res.status(409).json({ error: "A voucher with that code already exists." });
      return;
    }
    req.log?.error({ err }, "update voucher failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/vouchers/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  await db.delete(vouchersTable).where(eq(vouchersTable.id, id));
  res.json({ success: true });
});

// ---- Admin: order list ---------------------------------------------------

router.get("/admin/orders", requireAdmin, async (_req: Request, res: Response) => {
  const orders = await db
    .select()
    .from(ordersTable)
    .orderBy(desc(ordersTable.createdAt))
    .limit(200);
  res.json(
    orders.map((o) => ({
      id: o.id,
      publicId: o.publicId,
      status: o.status,
      email: o.email,
      firstName: o.firstName,
      lastName: o.lastName,
      subtotal: penceToPounds(o.subtotal),
      discount: penceToPounds(o.discount),
      total: penceToPounds(o.total),
      currency: o.currency,
      voucherCode: o.voucherCode,
      createdAt: o.createdAt.toISOString(),
      paidAt: o.paidAt ? o.paidAt.toISOString() : null,
    })),
  );
});

export default router;
