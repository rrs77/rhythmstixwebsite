import { Router, type Request, type Response } from "express";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  wooProductsTable,
  wooProductCategorySortTable,
  type WooImage,
  type WooCategoryRef,
  type WooAttribute,
} from "@workspace/db/schema";
import { setUserCookie, type UserPayload } from "../lib/jwt";
import { requireAdmin } from "./auth";
import { logger } from "../lib/logger";

const router = Router();

const WP_SITE = (process.env.WP_BASE_URL || "https://www.rhythmstix.co.uk").replace(/\/$/, "");
const WC_BASE = `${WP_SITE}/wp-json/wc/v3`;
const WC_KEY = process.env.WC_CONSUMER_KEY;
const WC_SECRET = process.env.WC_CONSUMER_SECRET;

const WC_AUTH_HEADER = `Basic ${Buffer.from(`${WC_KEY || ""}:${WC_SECRET || ""}`).toString("base64")}`;

function wcUrl(endpoint: string, params: Record<string, string> = {}) {
  const url = new URL(`${WC_BASE}/${endpoint}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url.toString();
}

function wcFetch(endpoint: string, params: Record<string, string> = {}) {
  return fetch(wcUrl(endpoint, params), {
    headers: { Authorization: WC_AUTH_HEADER },
  });
}

const wcCache = new Map<string, { data: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000;

async function cachedWcFetch(endpoint: string, params: Record<string, string> = {}) {
  const key = `${endpoint}:${JSON.stringify(params)}`;
  const cached = wcCache.get(key);
  if (cached && Date.now() < cached.expires) {
    return cached.data;
  }
  const response = await wcFetch(endpoint, params);
  if (!response.ok) {
    throw new Error(`WC API error: ${response.status}`);
  }
  const data = await response.json();
  wcCache.set(key, { data, expires: Date.now() + CACHE_TTL });
  return data;
}

interface ProductFamily {
  id: string;
  title: string;
  description: string;
  categorySlugs: string[];
  productSlugs?: string[];
  representativeSlug: string;
  priceLabel: string;
}

const PRODUCT_FAMILIES: ProductFamily[] = [
  {
    id: "guide-the-way",
    title: "Guide The Way",
    description: "A complete KS2 musical production with songs, script, choreography, and backing tracks. Available as individual components or a full package.",
    categorySlugs: ["gtw"],
    representativeSlug: "gtw-licence-re-verse-lyric-and-dance-viewer-script-and-score-pdf-and-all-audio-files",
    priceLabel: "From £10",
  },
  {
    id: "bandlab-lets-get-started",
    title: "BandLab Let's Get Started",
    description: "A step-by-step guide to using BandLab for music creation in the classroom. Ideal for KS2/KS3 music teachers getting started with digital music-making.",
    categorySlugs: ["getstarted"],
    representativeSlug: "lgs",
    priceLabel: "£30",
  },
  {
    id: "sneaky-creatures",
    title: "Sneaky Creatures",
    description: "A free, fun song resource for early years and KS1. Includes vocal and backing track versions ready to download.",
    categorySlugs: [],
    productSlugs: ["sneaky-creatures", "sneaky-creatures-backing-track", "sneaky-creatures-with-vocals"],
    representativeSlug: "sneaky-creatures",
    priceLabel: "Free",
  },
];

// ---- WooCommerce → DB sync -----------------------------------------------
// Local DB is the source of truth for *display*; WooCommerce remains the
// source of truth for *pricing & checkout* (re-priced server-side in the
// orders endpoint). Sync on startup, every 30 min, and on-demand via admin.

const SYNC_INTERVAL_MS = 30 * 60 * 1000;
const SYNC_STALE_MS = 30 * 60 * 1000;

interface SyncResult {
  inserted: number;
  updated: number;
  removed: number;
  total: number;
  durationMs: number;
  finishedAt: string;
  complete: boolean;
}

let lastSyncResult: SyncResult | null = null;
let lastSyncError: { message: string; at: string } | null = null;
let syncInFlight: Promise<SyncResult> | null = null;

interface WcFetchAll {
  products: any[];
  complete: boolean;
}

async function fetchAllWcProducts(): Promise<WcFetchAll> {
  const all: any[] = [];
  let page = 1;
  let totalPages = 1;
  let complete = true;
  const HARD_PAGE_CAP = 50;

  while (page <= HARD_PAGE_CAP) {
    const response = await wcFetch("products", {
      per_page: "100",
      page: String(page),
      status: "publish",
      orderby: "menu_order",
      order: "asc",
    });
    if (!response.ok) {
      throw new Error(`WC products page ${page} failed: ${response.status}`);
    }
    if (page === 1) {
      const headerTotalPages = Number(response.headers.get("x-wp-totalpages") || "0");
      if (Number.isFinite(headerTotalPages) && headerTotalPages > 0) {
        totalPages = headerTotalPages;
      }
    }
    const batch = (await response.json()) as any[];
    if (!Array.isArray(batch)) break;
    all.push(...batch.filter((p) => p.type !== "variation"));
    if (page >= totalPages) break;
    if (batch.length === 0) break;
    page += 1;
  }

  // Only consider the fetch authoritative if we exhausted WordPress's reported
  // page count *without* hitting our local hard cap. Otherwise we may have
  // missed pages and must NOT use the result for delete-stale calculations.
  if (totalPages > HARD_PAGE_CAP || page > HARD_PAGE_CAP) {
    complete = false;
  }

  return { products: all, complete };
}

function mapWcProductForDb(p: any) {
  return {
    wcId: Number(p.id),
    slug: String(p.slug || ""),
    name: String(p.name || ""),
    type: String(p.type || "simple"),
    status: String(p.status || "publish"),
    price: String(p.price ?? ""),
    regularPrice: String(p.regular_price ?? ""),
    salePrice: String(p.sale_price ?? ""),
    onSale: !!p.on_sale,
    purchasable: p.purchasable !== false,
    downloadable: !!p.downloadable,
    virtual: !!p.virtual,
    description: String(p.description || ""),
    shortDescription: String(p.short_description || ""),
    permalink: String(p.permalink || ""),
    stockStatus: String(p.stock_status || "instock"),
    images: ((p.images as any[]) || []).map((img: any): WooImage => ({
      id: img.id,
      src: String(img.src || ""),
      alt: String(img.alt || ""),
    })),
    categories: ((p.categories as any[]) || []).map((c: any): WooCategoryRef => ({
      id: Number(c.id),
      name: String(c.name || ""),
      slug: String(c.slug || ""),
    })),
    attributes: ((p.attributes as any[]) || []).map((a: any): WooAttribute => ({
      name: String(a.name || ""),
      options: Array.isArray(a.options) ? a.options.map(String) : [],
    })),
    menuOrder: Number(p.menu_order ?? 0),
  };
}

async function performSync(): Promise<SyncResult> {
  if (!WC_KEY || !WC_SECRET) {
    throw new Error("WooCommerce is not configured. Set WC_CONSUMER_KEY and WC_CONSUMER_SECRET.");
  }
  const startedAt = Date.now();
  const { products: wcProducts, complete } = await fetchAllWcProducts();
  const wcIds = new Set<number>(wcProducts.map((p) => Number(p.id)));

  const existingRows = await db.select({ wcId: wooProductsTable.wcId }).from(wooProductsTable);
  const existingIds = new Set<number>(existingRows.map((r) => r.wcId));

  let inserted = 0;
  let updated = 0;
  for (const p of wcProducts) {
    const row = mapWcProductForDb(p);
    if (existingIds.has(row.wcId)) {
      // Don't overwrite the admin's local sort override on resync.
      await db
        .update(wooProductsTable)
        .set({ ...row, updatedAt: new Date(), lastSyncedAt: new Date() })
        .where(eq(wooProductsTable.wcId, row.wcId));
      updated += 1;
    } else {
      // Seed adminSortOrder from menuOrder so newly synced products land in
      // a sensible default position; admin can override later.
      await db.insert(wooProductsTable).values({ ...row, adminSortOrder: row.menuOrder });
      inserted += 1;
    }
  }

  // Only remove rows when we KNOW the fetch was complete (we exhausted every
  // page reported by X-WP-TotalPages without hitting our hard cap). Partial
  // syncs must never delete — that would silently lose products visible in
  // WooCommerce. Admins can manually hide products instead.
  let removed = 0;
  if (complete) {
    const staleIds = [...existingIds].filter((id) => !wcIds.has(id));
    if (staleIds.length > 0) {
      await db.delete(wooProductsTable).where(inArray(wooProductsTable.wcId, staleIds));
      removed = staleIds.length;
      // Also drop any per-category sort rows belonging to deleted products so
      // they can't haunt the ordering if the product is later re-created with
      // the same wcId.
      await db
        .delete(wooProductCategorySortTable)
        .where(inArray(wooProductCategorySortTable.wcId, staleIds));
    }
  } else {
    logger.warn(
      { fetched: wcProducts.length },
      "woocommerce sync incomplete (page cap reached); skipping stale-delete pass to avoid data loss",
    );
  }

  // Prune per-category sort rows whose product no longer belongs to that
  // category. Without this, a stale (wcId, categorySlug) row would survive
  // and outrank legitimate entries the next time the product was re-added
  // to that category. Scope the prune to products we actually fetched in
  // this run so an incomplete sync can't accidentally erase rows for
  // products on unfetched pages.
  const validPairs = new Set<string>();
  for (const p of wcProducts) {
    const wcId = Number(p.id);
    for (const c of (p.categories as any[]) || []) {
      if (c?.slug) validPairs.add(`${wcId}::${String(c.slug)}`);
    }
  }
  const fetchedIds = [...wcIds];
  if (fetchedIds.length > 0) {
    const existingSortRows = await db
      .select({
        wcId: wooProductCategorySortTable.wcId,
        categorySlug: wooProductCategorySortTable.categorySlug,
      })
      .from(wooProductCategorySortTable)
      .where(inArray(wooProductCategorySortTable.wcId, fetchedIds));
    const stalePairs = existingSortRows.filter(
      (r) => !validPairs.has(`${r.wcId}::${r.categorySlug}`),
    );
    for (const pair of stalePairs) {
      await db
        .delete(wooProductCategorySortTable)
        .where(
          sql`${wooProductCategorySortTable.wcId} = ${pair.wcId} AND ${wooProductCategorySortTable.categorySlug} = ${pair.categorySlug}`,
        );
    }
    if (stalePairs.length > 0) {
      logger.info(
        { pruned: stalePairs.length },
        "woocommerce sync pruned stale per-category sort rows",
      );
    }
  }

  // Bust the in-memory wcCache so /shop/categories etc. pick up changes.
  wcCache.clear();

  const result: SyncResult = {
    inserted,
    updated,
    removed,
    total: wcProducts.length,
    durationMs: Date.now() - startedAt,
    finishedAt: new Date().toISOString(),
    complete,
  };
  lastSyncResult = result;
  lastSyncError = null;
  logger.info(result, "woocommerce sync complete");
  return result;
}

async function syncWooProducts(): Promise<SyncResult> {
  if (syncInFlight) return syncInFlight;
  syncInFlight = performSync()
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      lastSyncError = { message, at: new Date().toISOString() };
      logger.error({ err }, "woocommerce sync failed");
      throw err;
    })
    .finally(() => {
      syncInFlight = null;
    });
  return syncInFlight;
}

async function maybeAutoSync(): Promise<void> {
  // Lazy refresh on read when stale. Non-blocking — don't make GET wait.
  const stale = !lastSyncResult || Date.now() - new Date(lastSyncResult.finishedAt).getTime() > SYNC_STALE_MS;
  if (stale && !syncInFlight) {
    syncWooProducts().catch(() => {
      /* errors already logged */
    });
  }
}

// One-time backfill for the adminSortOrder column. When the column was
// introduced it defaulted to 0 for every existing row, which would make
// every product collide on the same sort key. Seed any zero rows from
// menu_order so the initial admin view matches WooCommerce's order and
// reorder swaps have distinct values to work with. Idempotent: a real
// admin override of 0 only resets if menu_order is also 0 (no-op).
db.execute(
  sql`UPDATE woo_products SET admin_sort_order = menu_order WHERE admin_sort_order = 0 AND menu_order <> 0`,
).catch((err) => {
  logger.warn({ err }, "woo_products adminSortOrder backfill failed");
});

// Kick off initial sync on first import (server boot). Best-effort.
// Skipped in serverless (Vercel/Lambda): instances are ephemeral and frozen
// between requests, so setInterval never fires reliably and a boot sync would
// run outbound WooCommerce calls on every cold start. There, freshness is
// handled lazily on read via maybeAutoSync() and instantly via the
// WooCommerce product webhook.
const isServerless = Boolean(
  process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT,
);
if (!isServerless && WC_KEY && WC_SECRET) {
  setTimeout(() => {
    syncWooProducts().catch(() => {
      /* logged */
    });
  }, 2000);
  setInterval(() => {
    syncWooProducts().catch(() => {
      /* logged */
    });
  }, SYNC_INTERVAL_MS).unref();
}

// ---- Public product listing (DB-backed, hides admin-hidden products) -----

function dbRowToFlat(row: typeof wooProductsTable.$inferSelect) {
  return {
    id: row.wcId,
    name: row.name,
    slug: row.slug,
    type: row.type,
    price: row.price,
    regularPrice: row.regularPrice,
    salePrice: row.salePrice,
    onSale: row.onSale,
    downloadable: row.downloadable,
    virtual: row.virtual,
    purchasable: row.purchasable,
    description: row.shortDescription || row.description,
    permalink: row.permalink,
    images: row.images,
    categories: row.categories,
    attributes: row.attributes,
  };
}

// Build a (wcId,categorySlug) -> sortOrder lookup for the per-category overrides.
async function loadCategorySortMap(categorySlugs?: string[]): Promise<Map<string, number>> {
  const rows = categorySlugs && categorySlugs.length > 0
    ? await db
        .select()
        .from(wooProductCategorySortTable)
        .where(inArray(wooProductCategorySortTable.categorySlug, categorySlugs))
    : await db.select().from(wooProductCategorySortTable);
  const map = new Map<string, number>();
  for (const r of rows) map.set(`${r.wcId}::${r.categorySlug}`, r.sortOrder);
  return map;
}

function sortRowsForCategory<T extends { wcId: number; adminSortOrder: number; menuOrder: number; name: string }>(
  rows: T[],
  categorySlug: string,
  overrides: Map<string, number>,
): T[] {
  return [...rows].sort((a, b) => {
    // Effective sort key: per-category override when set, else the global
    // adminSortOrder. This way an override of 99 stays at position 99 — it
    // doesn't leapfrog non-overridden products with a lower global order.
    const ao = overrides.get(`${a.wcId}::${categorySlug}`);
    const bo = overrides.get(`${b.wcId}::${categorySlug}`);
    const aKey = ao ?? a.adminSortOrder;
    const bKey = bo ?? b.adminSortOrder;
    if (aKey !== bKey) return aKey - bKey;
    if (a.menuOrder !== b.menuOrder) return a.menuOrder - b.menuOrder;
    return a.name.localeCompare(b.name);
  });
}

router.get("/shop/products", async (req: Request, res: Response) => {
  try {
    maybeAutoSync();
    const category = (req.query.category as string) || "";
    const grouped = req.query.grouped === "true";

    const allRows = await db
      .select()
      .from(wooProductsTable)
      .where(eq(wooProductsTable.hidden, false))
      .orderBy(wooProductsTable.adminSortOrder, wooProductsTable.menuOrder, wooProductsTable.name);

    const filtered = category
      ? allRows.filter((r) =>
          (r.categories as WooCategoryRef[]).some((c) => c.slug === category || String(c.id) === category),
        )
      : allRows;

    // If a category filter is in play, resolve it to a real category slug —
    // accepting either slug or numeric id — and apply the per-category sort.
    if (category && !grouped) {
      const matchedSlug = filtered
        .flatMap((r) => (r.categories as WooCategoryRef[]))
        .find((c) => c.slug === category || String(c.id) === category)?.slug;
      if (matchedSlug) {
        const overrides = await loadCategorySortMap([matchedSlug]);
        const sorted = sortRowsForCategory(filtered, matchedSlug, overrides);
        res.json(sorted.map(dbRowToFlat));
        return;
      }
    }

    if (grouped) {
      // Pre-load overrides for every family categorySlug so each family can be
      // sorted independently using its own per-category positions.
      const familySlugs = Array.from(
        new Set(PRODUCT_FAMILIES.flatMap((f) => f.categorySlugs)),
      );
      const overrides = await loadCategorySortMap(familySlugs);

      const families = PRODUCT_FAMILIES.map((family) => {
        const rep = filtered.find((p) => p.slug === family.representativeSlug);
        const familyProductsRaw = family.categorySlugs.length > 0
          ? filtered.filter((p) => (p.categories as WooCategoryRef[]).some((c) => family.categorySlugs.includes(c.slug)))
          : filtered.filter((p) => family.productSlugs?.includes(p.slug));
        // For families pinned to a single category slug, sort by its per-category
        // override (falling back to global). Multi-slug families use the first slug.
        const familyProducts = family.categorySlugs.length > 0
          ? sortRowsForCategory(familyProductsRaw, family.categorySlugs[0], overrides)
          : familyProductsRaw;

        return {
          id: family.id,
          title: family.title,
          description: family.description,
          priceLabel: family.priceLabel,
          categorySlug: family.categorySlugs[0] ?? null,
          image: rep?.images?.[0] ? { src: rep.images[0].src, alt: rep.images[0].alt || "" } : null,
          products: familyProducts.map((p) => ({
            id: p.wcId,
            name: p.name,
            slug: p.slug,
            price: p.price,
            regularPrice: p.regularPrice,
            salePrice: p.salePrice,
            onSale: p.onSale,
            downloadable: p.downloadable,
            description: p.shortDescription || p.description || "",
            images: p.images,
          })),
        };
      });
      res.json(families);
      return;
    }

    res.json(filtered.map(dbRowToFlat));
  } catch (err) {
    req.log?.error({ err }, "shop products list failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ---- Admin: WooCommerce sync + visibility management --------------------

router.get("/admin/woocommerce/products", requireAdmin, async (req: Request, res: Response) => {
  const category = (req.query.category as string) || "";
  const rows = await db
    .select()
    .from(wooProductsTable)
    .orderBy(wooProductsTable.hidden, wooProductsTable.adminSortOrder, wooProductsTable.menuOrder, wooProductsTable.name);

  // Filter to the selected category (when provided) and apply per-category
  // sort overrides so the admin sees the same ordering shoppers do.
  let filtered = rows;
  let overrides: Map<string, number> = new Map();
  if (category) {
    filtered = rows.filter((r) =>
      (r.categories as WooCategoryRef[]).some((c) => c.slug === category),
    );
    overrides = await loadCategorySortMap([category]);
    // Sort hidden last, then by per-category override / global / menu_order.
    const visible = filtered.filter((r) => !r.hidden);
    const hidden = filtered.filter((r) => r.hidden);
    filtered = [
      ...sortRowsForCategory(visible, category, overrides),
      ...sortRowsForCategory(hidden, category, overrides),
    ];
  }

  res.json({
    category: category || null,
    products: filtered.map((r) => ({
      wcId: r.wcId,
      name: r.name,
      slug: r.slug,
      price: r.price,
      onSale: r.onSale,
      status: r.status,
      stockStatus: r.stockStatus,
      purchasable: r.purchasable,
      hidden: r.hidden,
      permalink: r.permalink,
      thumbnail: r.images[0]?.src ?? null,
      categories: r.categories,
      adminSortOrder: r.adminSortOrder,
      menuOrder: r.menuOrder,
      categorySortOrder: category ? overrides.get(`${r.wcId}::${category}`) ?? null : null,
      lastSyncedAt: r.lastSyncedAt.toISOString(),
    })),
    sync: {
      configured: !!(WC_KEY && WC_SECRET),
      lastResult: lastSyncResult,
      lastError: lastSyncError,
      inFlight: !!syncInFlight,
      siteUrl: WP_SITE,
    },
  });
});

router.post("/admin/woocommerce/sync", requireAdmin, async (_req: Request, res: Response) => {
  try {
    const result = await syncWooProducts();
    res.json({ success: true, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Sync failed";
    res.status(500).json({ success: false, error: message });
  }
});

router.post("/admin/woocommerce/products/swap-order", requireAdmin, async (req: Request, res: Response) => {
  // Client tells us the desired *final* order: topWcId should rank above
  // bottomWcId. We materialize the ordered list (globally OR within a single
  // category), swap the two ids, and rewrite the corresponding sort table as
  // a dense unique sequence so subsequent one-step swaps are stable even when
  // the underlying data had many ties.
  const topWcId = Number(req.body?.topWcId);
  const bottomWcId = Number(req.body?.bottomWcId);
  const rawCategory = req.body?.categorySlug;
  const categorySlug = typeof rawCategory === "string" && rawCategory.trim() ? rawCategory.trim() : null;
  if (
    !Number.isInteger(topWcId) ||
    !Number.isInteger(bottomWcId) ||
    topWcId <= 0 ||
    bottomWcId <= 0 ||
    topWcId === bottomWcId
  ) {
    res.status(400).json({ error: "topWcId and bottomWcId must be two distinct positive integer ids" });
    return;
  }
  try {
    let notFound = false;
    await db.transaction(async (tx) => {
      // Pull the ordered list of candidate ids.
      const allRows = await tx
        .select({
          wcId: wooProductsTable.wcId,
          adminSortOrder: wooProductsTable.adminSortOrder,
          menuOrder: wooProductsTable.menuOrder,
          name: wooProductsTable.name,
          categories: wooProductsTable.categories,
        })
        .from(wooProductsTable)
        .orderBy(wooProductsTable.adminSortOrder, wooProductsTable.menuOrder, wooProductsTable.name);

      let candidateRows = allRows;
      let overrides = new Map<string, number>();
      if (categorySlug) {
        candidateRows = allRows.filter((r) =>
          (r.categories as WooCategoryRef[]).some((c) => c.slug === categorySlug),
        );
        const ovRows = await tx
          .select()
          .from(wooProductCategorySortTable)
          .where(eq(wooProductCategorySortTable.categorySlug, categorySlug));
        for (const r of ovRows) overrides.set(`${r.wcId}::${categorySlug}`, r.sortOrder);
        candidateRows = sortRowsForCategory(candidateRows, categorySlug, overrides);
      }

      const ids = candidateRows.map((r) => r.wcId);
      const topIdx = ids.indexOf(topWcId);
      const bottomIdx = ids.indexOf(bottomWcId);
      if (topIdx === -1 || bottomIdx === -1) {
        notFound = true;
        return;
      }

      // Place top directly above bottom in the array, regardless of which
      // direction the user clicked. Removing the lower index first keeps
      // the higher index valid.
      const [first, second] = topIdx < bottomIdx ? [topIdx, bottomIdx] : [bottomIdx, topIdx];
      const a = ids.splice(second, 1)[0];
      const b = ids.splice(first, 1)[0];
      const [insertTop, insertBottom] = a === topWcId ? [a, b] : [b, a];
      ids.splice(first, 0, insertTop, insertBottom);

      const now = new Date();
      if (categorySlug) {
        // Rewrite a dense sequence into the per-category sort table for every
        // product currently in this category, leaving the global order alone.
        for (let i = 0; i < ids.length; i++) {
          await tx
            .insert(wooProductCategorySortTable)
            .values({ wcId: ids[i], categorySlug, sortOrder: i, updatedAt: now })
            .onConflictDoUpdate({
              target: [wooProductCategorySortTable.wcId, wooProductCategorySortTable.categorySlug],
              set: { sortOrder: i, updatedAt: now },
            });
        }
      } else {
        for (let i = 0; i < ids.length; i++) {
          await tx
            .update(wooProductsTable)
            .set({ adminSortOrder: i, updatedAt: now })
            .where(eq(wooProductsTable.wcId, ids[i]));
        }
      }
    });
    if (notFound) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    wcCache.clear();
    res.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reorder failed";
    res.status(500).json({ error: message });
  }
});

router.post("/admin/woocommerce/products/bulk-order", requireAdmin, async (req: Request, res: Response) => {
  // Client sends the desired *complete* product order as an array of wcIds.
  // When categorySlug is provided, the order applies as per-category
  // overrides (only the products in that category, written to
  // wooProductCategorySortTable). Without a category, the order rewrites
  // the global adminSortOrder. We require the submitted id set to exactly
  // match the current set of products in scope (no extras, no missing,
  // no duplicates) so a stale admin tab can't silently drop or resurrect
  // rows. Then we rewrite the relevant order column as a dense sequence.
  const orderedWcIds: unknown = req.body?.orderedWcIds;
  if (!Array.isArray(orderedWcIds) || orderedWcIds.length === 0) {
    res.status(400).json({ error: "orderedWcIds must be a non-empty array of product ids" });
    return;
  }
  const rawCategory = req.body?.categorySlug;
  const categorySlug = typeof rawCategory === "string" && rawCategory.trim() ? rawCategory.trim() : null;
  const ids: number[] = [];
  const seen = new Set<number>();
  for (const raw of orderedWcIds) {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
      res.status(400).json({ error: "orderedWcIds must contain only positive integer ids" });
      return;
    }
    if (seen.has(n)) {
      res.status(400).json({ error: "orderedWcIds must not contain duplicates" });
      return;
    }
    seen.add(n);
    ids.push(n);
  }
  try {
    let mismatch: string | null = null;
    await db.transaction(async (tx) => {
      let scopeIds: number[];
      if (categorySlug) {
        const rows = await tx
          .select({ wcId: wooProductsTable.wcId, categories: wooProductsTable.categories })
          .from(wooProductsTable);
        scopeIds = rows
          .filter((r) => Array.isArray(r.categories) && r.categories.some((c) => c.slug === categorySlug))
          .map((r) => r.wcId);
      } else {
        const rows = await tx
          .select({ wcId: wooProductsTable.wcId })
          .from(wooProductsTable);
        scopeIds = rows.map((r) => r.wcId);
      }
      const existing = new Set(scopeIds);
      if (existing.size !== ids.length) {
        mismatch = `orderedWcIds length ${ids.length} does not match product count ${existing.size} in scope`;
        return;
      }
      for (const id of ids) {
        if (!existing.has(id)) {
          mismatch = `Unknown product id ${id} for the requested scope`;
          return;
        }
      }
      const now = new Date();
      if (categorySlug) {
        // Replace this category's per-category sort overrides with the
        // dense sequence the client gave us.
        await tx
          .delete(wooProductCategorySortTable)
          .where(eq(wooProductCategorySortTable.categorySlug, categorySlug));
        for (let i = 0; i < ids.length; i++) {
          await tx.insert(wooProductCategorySortTable).values({
            wcId: ids[i],
            categorySlug,
            sortOrder: i,
            updatedAt: now,
          });
        }
      } else {
        for (let i = 0; i < ids.length; i++) {
          await tx
            .update(wooProductsTable)
            .set({ adminSortOrder: i, updatedAt: now })
            .where(eq(wooProductsTable.wcId, ids[i]));
        }
      }
    });
    if (mismatch) {
      res.status(409).json({ error: mismatch });
      return;
    }
    wcCache.clear();
    res.json({ success: true, count: ids.length });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Reorder failed";
    res.status(500).json({ error: message });
  }
});

router.post("/admin/woocommerce/products/reset-order", requireAdmin, async (req: Request, res: Response) => {
  // When a categorySlug is provided, only clear that category's per-category
  // overrides (so it falls back to the global admin/menu order). Otherwise
  // drop all global overrides and fall back to WooCommerce menu_order.
  const rawCategory = req.body?.categorySlug;
  const categorySlug = typeof rawCategory === "string" && rawCategory.trim() ? rawCategory.trim() : null;
  if (categorySlug) {
    await db
      .delete(wooProductCategorySortTable)
      .where(eq(wooProductCategorySortTable.categorySlug, categorySlug));
  } else {
    // Global reset clears every local override — both the global
    // adminSortOrder and any per-category overrides — so the catalog
    // really does fall back to WooCommerce's menu_order everywhere.
    await db
      .update(wooProductsTable)
      .set({ adminSortOrder: sql`${wooProductsTable.menuOrder}`, updatedAt: new Date() });
    await db.delete(wooProductCategorySortTable);
  }
  wcCache.clear();
  res.json({ success: true });
});

router.post("/admin/woocommerce/products/categories", requireAdmin, async (req: Request, res: Response) => {
  // Bulk-update WooCommerce product category assignments.
  //
  // Body: {
  //   wcIds:           number[]   // products to mutate (1..50)
  //   mode:            "add" | "remove" | "set"
  //   categoryIds:     number[]   // category ids to add/remove/set
  // }
  //
  // We resolve the new category set per-product against the current local DB
  // row, push it to WooCommerce (which is the source of truth for products),
  // and mirror the response into our local row immediately so the admin UI
  // and /shop see the change without waiting for the next sync. We also fire
  // a non-blocking sync so the rest of the catalog stays in step.
  if (!WC_KEY || !WC_SECRET) {
    res.status(503).json({ error: "WooCommerce credentials are not configured." });
    return;
  }
  const rawWcIds: unknown = req.body?.wcIds;
  const rawCategoryIds: unknown = req.body?.categoryIds;
  const rawMode: unknown = req.body?.mode;
  const mode = rawMode === "add" || rawMode === "remove" || rawMode === "set" ? rawMode : null;
  if (!mode) {
    res.status(400).json({ error: "mode must be one of 'add', 'remove', 'set'" });
    return;
  }
  if (!Array.isArray(rawWcIds) || rawWcIds.length === 0) {
    res.status(400).json({ error: "wcIds must be a non-empty array of product ids" });
    return;
  }
  if (rawWcIds.length > 50) {
    res.status(400).json({ error: "Too many products in a single request (max 50)" });
    return;
  }
  if (!Array.isArray(rawCategoryIds)) {
    res.status(400).json({ error: "categoryIds must be an array" });
    return;
  }
  if (mode !== "set" && rawCategoryIds.length === 0) {
    res.status(400).json({ error: "categoryIds must be a non-empty array for add/remove" });
    return;
  }
  const wcIds: number[] = [];
  const seen = new Set<number>();
  for (const raw of rawWcIds) {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
      res.status(400).json({ error: "wcIds must contain only positive integer ids" });
      return;
    }
    if (seen.has(n)) continue;
    seen.add(n);
    wcIds.push(n);
  }
  const categoryIds: number[] = [];
  const catSeen = new Set<number>();
  for (const raw of rawCategoryIds) {
    const n = Number(raw);
    if (!Number.isInteger(n) || n <= 0) {
      res.status(400).json({ error: "categoryIds must contain only positive integer ids" });
      return;
    }
    if (catSeen.has(n)) continue;
    catSeen.add(n);
    categoryIds.push(n);
  }

  const existingRows = await db
    .select()
    .from(wooProductsTable)
    .where(inArray(wooProductsTable.wcId, wcIds));
  const rowsByWcId = new Map(existingRows.map((r) => [r.wcId, r] as const));

  const updated: { wcId: number; categories: WooCategoryRef[] }[] = [];
  const failures: { wcId: number; error: string }[] = [];

  for (const wcId of wcIds) {
    const row = rowsByWcId.get(wcId);
    if (!row) {
      failures.push({ wcId, error: "Product not found locally" });
      continue;
    }
    const current = (row.categories as WooCategoryRef[]) || [];
    const currentIds = new Set(current.map((c) => c.id));
    let nextIds: Set<number>;
    if (mode === "add") {
      nextIds = new Set([...currentIds, ...categoryIds]);
    } else if (mode === "remove") {
      nextIds = new Set([...currentIds].filter((id) => !catSeen.has(id)));
    } else {
      nextIds = new Set(categoryIds);
    }
    if (nextIds.size === 0) {
      failures.push({ wcId, error: "A product must belong to at least one category" });
      continue;
    }
    // Skip the WC roundtrip when nothing actually changed.
    const sameAsCurrent =
      nextIds.size === currentIds.size && [...nextIds].every((id) => currentIds.has(id));
    if (sameAsCurrent) {
      updated.push({ wcId, categories: current });
      continue;
    }
    try {
      const wcRes = await fetch(wcUrl(`products/${wcId}`), {
        method: "PUT",
        headers: { Authorization: WC_AUTH_HEADER, "Content-Type": "application/json" },
        body: JSON.stringify({ categories: [...nextIds].map((id) => ({ id })) }),
      });
      if (!wcRes.ok) {
        const detail = await wcRes.text().catch(() => "");
        failures.push({ wcId, error: `WooCommerce rejected the update (${wcRes.status}): ${detail.slice(0, 200)}` });
        continue;
      }
      const product = (await wcRes.json()) as any;
      const mappedCategories: WooCategoryRef[] = ((product.categories as any[]) || []).map(
        (c: any) => ({
          id: Number(c.id),
          name: String(c.name || ""),
          slug: String(c.slug || ""),
        }),
      );
      await db
        .update(wooProductsTable)
        .set({ categories: mappedCategories, updatedAt: new Date(), lastSyncedAt: new Date() })
        .where(eq(wooProductsTable.wcId, wcId));
      updated.push({ wcId, categories: mappedCategories });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      failures.push({ wcId, error: message });
    }
  }

  // Bust the public shop cache so /shop reflects the new assignments
  // immediately. Trigger a background sync so the rest of the catalog stays
  // up to date — don't block the admin response on it.
  wcCache.clear();
  syncWooProducts().catch(() => {
    /* errors already logged */
  });

  // Always respond 200 with the per-item updated/failures arrays so the
  // client can surface full per-product detail. The top-level `success`
  // flag tells callers whether every item succeeded; `error` is included
  // (built from the failure list) when nothing changed so a generic
  // onError handler can still produce a useful message.
  res.status(200).json({
    success: failures.length === 0,
    updated,
    failures,
    error:
      updated.length === 0 && failures.length > 0
        ? `All ${failures.length} updates failed: ${failures
            .map((f) => `#${f.wcId}: ${f.error}`)
            .join("; ")}`
        : undefined,
  });
});

router.put("/admin/woocommerce/products/:wcId/visibility", requireAdmin, async (req: Request, res: Response) => {
  const wcId = Number(req.params.wcId);
  if (!Number.isInteger(wcId) || wcId <= 0) {
    res.status(400).json({ error: "Invalid product id" });
    return;
  }
  const hidden = !!(req.body?.hidden);
  const result = await db
    .update(wooProductsTable)
    .set({ hidden, updatedAt: new Date() })
    .where(eq(wooProductsTable.wcId, wcId))
    .returning({ wcId: wooProductsTable.wcId, hidden: wooProductsTable.hidden });
  if (result.length === 0) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  res.json({ success: true, wcId: result[0].wcId, hidden: result[0].hidden });
});

// ---- Webhook receiver (instant product sync) -----------------------------
// WooCommerce pings this endpoint when a product is created/updated/deleted.
// We verify the HMAC-SHA256 signature against WC_WEBHOOK_SECRET (the secret
// configured in the WooCommerce webhook UI), respond fast, and trigger an
// async sync so changes appear on the site within seconds instead of waiting
// up to 30 minutes for the next interval. The sync is deduped via
// syncWooProducts() so a burst of webhook events only runs one sync at a time.

const WC_WEBHOOK_SECRET = process.env.WC_WEBHOOK_SECRET || "";
const PRODUCT_TOPICS = new Set([
  "product.created",
  "product.updated",
  "product.deleted",
  "product.restored",
]);

// In-memory ring buffer of the last few webhook hits so admins can verify in
// the UI that WordPress is actually pinging this endpoint without grepping
// server logs. Process-local — fine for our scale (a handful of admin users).
interface WebhookEvent {
  id: string;
  ts: string;
  topic: string;
  ip: string;
  signatureValid: boolean;
  syncTriggered: boolean;
  status: number;
  note?: string;
}
const WEBHOOK_EVENT_LIMIT = 25;
const webhookEvents: WebhookEvent[] = [];
let webhookEventSeq = 0;
function recordWebhookEvent(ev: Omit<WebhookEvent, "id" | "ts">) {
  webhookEvents.unshift({
    id: `${Date.now()}-${++webhookEventSeq}`,
    ts: new Date().toISOString(),
    ...ev,
  });
  if (webhookEvents.length > WEBHOOK_EVENT_LIMIT) {
    webhookEvents.length = WEBHOOK_EVENT_LIMIT;
  }
}

function verifyWcSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!WC_WEBHOOK_SECRET) return false;
  if (!signatureHeader || typeof signatureHeader !== "string") return false;
  const expected = createHmac("sha256", WC_WEBHOOK_SECRET).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

router.post(
  "/webhooks/woocommerce",
  async (req: Request, res: Response) => {
    const topic = String(req.header("x-wc-webhook-topic") || "").toLowerCase();
    const signature = req.header("x-wc-webhook-signature");
    const ip = String(req.ip || req.socket.remoteAddress || "");
    // Raw bytes are stashed by the express.json verify hook in app.ts so we can
    // HMAC them. Falls back to empty buffer if the request had no JSON body
    // (e.g. the WC "ping" sent on save).
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from("");

    // WooCommerce sends a "ping" with no topic when the webhook is first
    // saved — respond 200 so the webhook stays in "active" state.
    if (!topic) {
      recordWebhookEvent({ topic: "(ping)", ip, signatureValid: false, syncTriggered: false, status: 200, note: "ping received" });
      res.status(200).json({ ok: true, message: "ping received" });
      return;
    }

    if (!verifyWcSignature(rawBody, signature)) {
      req.log?.warn({ topic }, "woocommerce webhook signature invalid");
      recordWebhookEvent({ topic, ip, signatureValid: false, syncTriggered: false, status: 401, note: WC_WEBHOOK_SECRET ? "invalid signature" : "WC_WEBHOOK_SECRET not set" });
      res.status(401).json({ error: "Invalid signature" });
      return;
    }

    if (!PRODUCT_TOPICS.has(topic)) {
      // Acknowledge but ignore non-product topics so WC doesn't retry forever.
      recordWebhookEvent({ topic, ip, signatureValid: true, syncTriggered: false, status: 200, note: "non-product topic ignored" });
      res.status(200).json({ ok: true, ignored: topic });
      return;
    }

    // Trigger sync without blocking the response — WC expects a fast 2xx.
    syncWooProducts().catch(() => {
      /* errors already logged inside syncWooProducts */
    });
    req.log?.info({ topic }, "woocommerce webhook accepted, sync triggered");
    recordWebhookEvent({ topic, ip, signatureValid: true, syncTriggered: true, status: 202 });
    res.status(202).json({ ok: true, topic, syncTriggered: true });
  },
);

router.get("/admin/woocommerce/webhook-events", requireAdmin, (_req: Request, res: Response) => {
  res.json({
    configured: !!WC_WEBHOOK_SECRET,
    events: webhookEvents,
  });
});

router.post("/admin/woocommerce/categories", requireAdmin, async (req: Request, res: Response) => {
  // Proxy to WooCommerce's POST /products/categories so admins can create
  // brand-new categories without leaving the Replit admin. Bust the in-memory
  // wcCache afterwards so the next /shop/categories and admin GET fetches
  // include the new term immediately.
  if (!WC_KEY || !WC_SECRET) {
    res.status(503).json({ error: "WooCommerce is not configured" });
    return;
  }
  const rawName = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  const rawSlug = typeof req.body?.slug === "string" ? req.body.slug.trim() : "";
  const parentRaw = req.body?.parent;
  if (!rawName) {
    res.status(400).json({ error: "Category name is required" });
    return;
  }
  if (rawName.length > 100) {
    res.status(400).json({ error: "Category name is too long (max 100 chars)" });
    return;
  }
  if (rawSlug && !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(rawSlug)) {
    res.status(400).json({ error: "Slug must be lowercase letters, numbers and hyphens" });
    return;
  }
  let parent: number | undefined;
  if (parentRaw !== undefined && parentRaw !== null && parentRaw !== "") {
    const n = Number(parentRaw);
    if (!Number.isInteger(n) || n <= 0) {
      res.status(400).json({ error: "Parent must be a positive integer category id" });
      return;
    }
    parent = n;
  }
  try {
    const payload: Record<string, unknown> = { name: rawName };
    if (rawSlug) payload.slug = rawSlug;
    if (parent !== undefined) payload.parent = parent;
    const response = await fetch(wcUrl("products/categories"), {
      method: "POST",
      headers: { Authorization: WC_AUTH_HEADER, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as any;
    if (!response.ok) {
      const message = typeof body?.message === "string" ? body.message : "Failed to create category";
      res.status(response.status).json({ error: message });
      return;
    }
    wcCache.clear();
    res.status(201).json({
      id: Number(body.id),
      name: String(body.name || ""),
      slug: String(body.slug || ""),
      count: Number(body.count ?? 0),
      image: body.image ? { src: body.image.src, alt: body.image.alt } : null,
    });
  } catch (err) {
    req.log?.error({ err }, "create woocommerce category failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/admin/woocommerce/categories/:id", requireAdmin, async (req: Request, res: Response) => {
  // Proxy to WooCommerce's PUT /products/categories/<id> so admins can rename
  // an existing term, change its slug, or move it under a different parent
  // without leaving the Replit admin. Only fields the admin actually changed
  // are forwarded; WC otherwise leaves them untouched.
  if (!WC_KEY || !WC_SECRET) {
    res.status(503).json({ error: "WooCommerce is not configured" });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Category id must be a positive integer" });
    return;
  }
  const payload: Record<string, unknown> = {};
  if (req.body?.name !== undefined) {
    const rawName = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!rawName) {
      res.status(400).json({ error: "Category name is required" });
      return;
    }
    if (rawName.length > 100) {
      res.status(400).json({ error: "Category name is too long (max 100 chars)" });
      return;
    }
    payload.name = rawName;
  }
  if (req.body?.slug !== undefined) {
    const rawSlug = typeof req.body.slug === "string" ? req.body.slug.trim() : "";
    if (!rawSlug) {
      res.status(400).json({ error: "Slug cannot be empty" });
      return;
    }
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(rawSlug)) {
      res.status(400).json({ error: "Slug must be lowercase letters, numbers and hyphens" });
      return;
    }
    payload.slug = rawSlug;
  }
  if (req.body?.parent !== undefined && req.body?.parent !== null && req.body?.parent !== "") {
    const n = Number(req.body.parent);
    if (!Number.isInteger(n) || n < 0) {
      res.status(400).json({ error: "Parent must be a non-negative integer category id" });
      return;
    }
    if (n === id) {
      res.status(400).json({ error: "A category cannot be its own parent" });
      return;
    }
    payload.parent = n;
  } else if (req.body?.parent === null || req.body?.parent === "") {
    payload.parent = 0;
  }
  if (Object.keys(payload).length === 0) {
    res.status(400).json({ error: "At least one of name, slug, or parent is required" });
    return;
  }
  try {
    const response = await fetch(wcUrl(`products/categories/${id}`), {
      method: "PUT",
      headers: { Authorization: WC_AUTH_HEADER, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = (await response.json().catch(() => ({}))) as any;
    if (!response.ok) {
      const message = typeof body?.message === "string" ? body.message : "Failed to update category";
      res.status(response.status).json({ error: message });
      return;
    }
    wcCache.clear();
    res.json({
      id: Number(body.id),
      name: String(body.name || ""),
      slug: String(body.slug || ""),
      count: Number(body.count ?? 0),
      image: body.image ? { src: body.image.src, alt: body.image.alt } : null,
    });
  } catch (err) {
    req.log?.error({ err }, "update woocommerce category failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/admin/woocommerce/categories/:id", requireAdmin, async (req: Request, res: Response) => {
  // Proxy to WooCommerce's DELETE /products/categories/<id>?force=true. WC
  // requires force=true for category deletes (no trash for terms). Products
  // assigned only to this category fall back to the default "Uncategorized"
  // term on WC's side. Bust the wcCache so the next admin/shop fetches see
  // the term gone immediately.
  if (!WC_KEY || !WC_SECRET) {
    res.status(503).json({ error: "WooCommerce is not configured" });
    return;
  }
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: "Category id must be a positive integer" });
    return;
  }
  try {
    const response = await fetch(wcUrl(`products/categories/${id}`, { force: "true" }), {
      method: "DELETE",
      headers: { Authorization: WC_AUTH_HEADER },
    });
    const body = (await response.json().catch(() => ({}))) as any;
    if (!response.ok) {
      const message = typeof body?.message === "string" ? body.message : "Failed to delete category";
      res.status(response.status).json({ error: message });
      return;
    }
    wcCache.clear();
    // Trigger a product resync in the background so any products that lost
    // this category get their `categories` arrays refreshed locally.
    syncWooProducts().catch(() => {
      /* logged */
    });
    res.json({ success: true, id });
  } catch (err) {
    req.log?.error({ err }, "delete woocommerce category failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/admin/woocommerce/categories", requireAdmin, async (_req: Request, res: Response) => {
  // Same as /shop/categories but includes categories that currently contain
  // zero products — admins need those as drop targets so they can move
  // products *into* a freshly-created (empty) category from the UI.
  try {
    const all: any[] = [];
    let page = 1;
    while (page <= 10) {
      const response = await wcFetch("products/categories", {
        per_page: "100",
        page: String(page),
        orderby: "name",
        order: "asc",
        hide_empty: "false",
      });
      if (!response.ok) {
        res.status(response.status).json({ error: "Failed to fetch categories" });
        return;
      }
      const batch = (await response.json()) as any[];
      if (!Array.isArray(batch) || batch.length === 0) break;
      all.push(...batch);
      const totalPages = Number(response.headers.get("x-wp-totalpages") || "1");
      if (page >= totalPages) break;
      page += 1;
    }
    res.json(
      all.map((c: any) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        count: c.count,
        parent: Number(c.parent ?? 0),
        image: c.image ? { src: c.image.src, alt: c.image.alt } : null,
      })),
    );
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/shop/categories", async (_req: Request, res: Response) => {
  try {
    const response = await wcFetch("products/categories", {
      per_page: "50",
      orderby: "name",
      order: "asc",
      hide_empty: "true",
    });
    if (!response.ok) {
      res.status(response.status).json({ error: "Failed to fetch categories" });
      return;
    }
    const categories = await response.json();

    const mapped = (categories as any[]).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      count: c.count,
      image: c.image ? { src: c.image.src, alt: c.image.alt } : null,
    }));

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
