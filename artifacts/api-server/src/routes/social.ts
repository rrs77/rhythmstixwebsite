import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  linkedinPostsTable,
  twitterPostsTable,
  siteContentTable,
  socialPostsTable,
  socialFeedsTable,
} from "@workspace/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

const DEFAULT_YT_CHANNEL_ID = "UCooHhU7FKALUQ4CtqjDFMsw";
const PLATFORMS = ["youtube", "facebook", "linkedin", "twitter"] as const;
type Platform = (typeof PLATFORMS)[number];

const YT_AUTO_SYNC_TTL = 10 * 60 * 1000; // auto-resync YouTube on read every 10 min
let migrationRan = false;

// ---- helpers ---------------------------------------------------------------

async function getSetting(key: string, fallback: string): Promise<string> {
  try {
    const rows = await db.select().from(siteContentTable).where(eq(siteContentTable.key, key));
    return rows.length > 0 ? rows[0].value : fallback;
  } catch {
    return fallback;
  }
}

async function setSetting(key: string, value: string) {
  const existing = await db.select().from(siteContentTable).where(eq(siteContentTable.key, key));
  if (existing.length > 0) {
    await db
      .update(siteContentTable)
      .set({ value, updatedAt: new Date() })
      .where(eq(siteContentTable.key, key));
  } else {
    await db.insert(siteContentTable).values({ key, value });
  }
}

async function getFeed(platform: Platform) {
  const rows = await db.select().from(socialFeedsTable).where(eq(socialFeedsTable.platform, platform));
  if (rows.length > 0) return rows[0];
  // Lazy-create with default enabled=true
  const [created] = await db
    .insert(socialFeedsTable)
    .values({ platform, enabled: true })
    .onConflictDoNothing()
    .returning();
  if (created) return created;
  const after = await db.select().from(socialFeedsTable).where(eq(socialFeedsTable.platform, platform));
  return after[0];
}

async function getEnabledPlatforms(): Promise<Set<Platform>> {
  const rows = await db.select().from(socialFeedsTable);
  const set = new Set<Platform>();
  // default: all enabled unless explicitly disabled
  for (const p of PLATFORMS) set.add(p);
  for (const r of rows) {
    if (r.enabled === false) set.delete(r.platform as Platform);
    else set.add(r.platform as Platform);
  }
  return set;
}

// Credentials are stored in site_content under `secret.<KEY>`; env vars are
// used as fallback so existing deployments keep working.
async function getSecret(key: string): Promise<string | undefined> {
  try {
    const rows = await db
      .select()
      .from(siteContentTable)
      .where(eq(siteContentTable.key, `secret.${key}`));
    const v = rows[0]?.value?.trim();
    if (v) return v;
  } catch {
    /* fall through to env */
  }
  return process.env[key]?.trim() || undefined;
}

async function platformCredentialStatus(
  platform: Platform,
): Promise<{ configured: boolean; missing: string[] }> {
  switch (platform) {
    case "facebook": {
      const missing: string[] = [];
      if (!(await getSecret("FACEBOOK_PAGE_ID"))) missing.push("FACEBOOK_PAGE_ID");
      if (!(await getSecret("FACEBOOK_PAGE_ACCESS_TOKEN"))) missing.push("FACEBOOK_PAGE_ACCESS_TOKEN");
      return { configured: missing.length === 0, missing };
    }
    case "youtube":
      // Channel ID lives in site_content; treated as configured if set or default present.
      return { configured: true, missing: [] };
    case "linkedin":
    case "twitter":
      return { configured: true, missing: [] };
  }
}

// ---- Migration: copy legacy linkedin/twitter rows into unified table -------

const LEGACY_MIGRATION_KEY = "social_legacy_migrated_v1";

async function ensureLegacyMigration() {
  if (migrationRan) return;
  try {
    // Persistent marker so re-running the migration after admin deletions
    // doesn't resurrect deleted legacy rows.
    const marker = await db
      .select()
      .from(siteContentTable)
      .where(eq(siteContentTable.key, LEGACY_MIGRATION_KEY));
    if (marker.length > 0 && marker[0].value === "true") {
      migrationRan = true;
      return;
    }
  } catch {
    /* table may not exist yet on first boot */
  }
  migrationRan = true;
  try {
    const existingCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(socialPostsTable);
    const total = existingCount[0]?.count ?? 0;

    const li = await db.select().from(linkedinPostsTable);
    for (const p of li) {
      await db
        .insert(socialPostsTable)
        .values({
          platform: "linkedin",
          externalId: `legacy-${p.id}`,
          title: p.title,
          body: p.description ?? "",
          url: p.url,
          publishedAt: p.date,
        })
        .onConflictDoNothing();
    }
    const tw = await db.select().from(twitterPostsTable);
    for (const p of tw) {
      await db
        .insert(socialPostsTable)
        .values({
          platform: "twitter",
          externalId: `legacy-${p.id}`,
          title: "",
          body: p.text,
          url: p.url,
          publishedAt: p.date,
        })
        .onConflictDoNothing();
    }

    // Migrate hidden_social_posts JSON list (composite ids like "li:5", "tw:3", "yt:abc")
    // into hidden=true on the unified rows.
    try {
      const hiddenRows = await db
        .select()
        .from(siteContentTable)
        .where(eq(siteContentTable.key, "hidden_social_posts"));
      const hidden: string[] = hiddenRows.length > 0 ? JSON.parse(hiddenRows[0].value) : [];
      for (const cid of hidden) {
        const [prefix, rest] = cid.split(":");
        if (!rest) continue;
        if (prefix === "li") {
          await db
            .update(socialPostsTable)
            .set({ hidden: true })
            .where(
              and(
                eq(socialPostsTable.platform, "linkedin"),
                eq(socialPostsTable.externalId, `legacy-${rest}`),
              ),
            );
        } else if (prefix === "tw") {
          await db
            .update(socialPostsTable)
            .set({ hidden: true })
            .where(
              and(
                eq(socialPostsTable.platform, "twitter"),
                eq(socialPostsTable.externalId, `legacy-${rest}`),
              ),
            );
        } else if (prefix === "yt") {
          await db
            .update(socialPostsTable)
            .set({ hidden: true })
            .where(
              and(
                eq(socialPostsTable.platform, "youtube"),
                eq(socialPostsTable.externalId, rest),
              ),
            );
        }
      }
    } catch {
      /* ignore */
    }

    if (total === 0 && (li.length > 0 || tw.length > 0)) {
      // first-time migration; nothing else to do
    }

    // Persist marker so subsequent boots skip the migration entirely.
    await db
      .insert(siteContentTable)
      .values({ key: LEGACY_MIGRATION_KEY, value: "true" })
      .onConflictDoUpdate({
        target: siteContentTable.key,
        set: { value: "true", updatedAt: new Date() },
      });
  } catch (err) {
    // Don't crash the request; just log and let caller continue.
    // Keep migrationRan=true so we don't retry on every request in this process.
    // eslint-disable-next-line no-console
    console.warn("[social] legacy migration failed:", err);
  }
}

// ---- YouTube sync ----------------------------------------------------------

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

interface YtVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnail: string;
  date: string;
  url: string;
}

function parseYouTubeRSS(xml: string): YtVideo[] {
  const entries: YtVideo[] = [];
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  while ((match = entryRegex.exec(xml)) !== null) {
    const entry = match[1];
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1] || "";
    const title = entry.match(/<title>([^<]+)<\/title>/)?.[1] || "";
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1] || "";
    const descMatch = entry.match(/<media:description>([\s\S]*?)<\/media:description>/);
    const description = descMatch ? descMatch[1].trim() : "";
    const thumbnail = entry.match(/<media:thumbnail url="([^"]+)"/)?.[1] || "";
    if (!videoId) continue;
    entries.push({
      videoId,
      title: decodeXmlEntities(title),
      description: decodeXmlEntities(description),
      thumbnail,
      date: published,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }
  return entries;
}

async function syncYouTube(req: Request): Promise<{ inserted: number; updated: number; total: number }> {
  const channelId = await getSetting("youtube_channel_id", DEFAULT_YT_CHANNEL_ID);
  const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`YouTube RSS fetch failed (${response.status})`);
  }
  const xml = await response.text();
  const videos = parseYouTubeRSS(xml);
  let inserted = 0;
  let updated = 0;
  for (const v of videos) {
    const existing = await db
      .select()
      .from(socialPostsTable)
      .where(
        and(eq(socialPostsTable.platform, "youtube"), eq(socialPostsTable.externalId, v.videoId)),
      );
    if (existing.length === 0) {
      await db.insert(socialPostsTable).values({
        platform: "youtube",
        externalId: v.videoId,
        title: v.title,
        body: v.description,
        url: v.url,
        thumbnail: v.thumbnail,
        publishedAt: v.date ? new Date(v.date) : new Date(),
      });
      inserted++;
    } else {
      // refresh metadata (title/description may change in YT)
      await db
        .update(socialPostsTable)
        .set({
          title: v.title,
          body: v.description,
          thumbnail: v.thumbnail,
          updatedAt: new Date(),
        })
        .where(eq(socialPostsTable.id, existing[0].id));
      updated++;
    }
  }
  // log via req if available
  if (req && (req as any).log) {
    (req as any).log.info({ inserted, updated, total: videos.length }, "youtube sync complete");
  }
  return { inserted, updated, total: videos.length };
}

// ---- Facebook sync ---------------------------------------------------------

interface FbAttachment {
  media_type?: string;
  media?: { image?: { src?: string } };
  url?: string;
  subattachments?: { data?: FbAttachment[] };
}
interface FbPost {
  id: string;
  message?: string;
  story?: string;
  permalink_url?: string;
  created_time?: string;
  full_picture?: string;
  attachments?: { data?: FbAttachment[] };
}

async function syncFacebook(): Promise<{ inserted: number; updated: number; total: number }> {
  const pageId = await getSecret("FACEBOOK_PAGE_ID");
  const token = await getSecret("FACEBOOK_PAGE_ACCESS_TOKEN");
  if (!pageId || !token) {
    throw new Error("Facebook is not configured. Set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN in Admin → Settings.");
  }
  const fields = "id,message,story,permalink_url,created_time,full_picture,attachments{media_type,media,url}";
  const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}/posts?fields=${encodeURIComponent(fields)}&limit=25&access_token=${encodeURIComponent(token)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const txt = await response.text().catch(() => "");
    throw new Error(`Facebook Graph API error (${response.status}): ${txt.slice(0, 200)}`);
  }
  const json = (await response.json()) as { data?: FbPost[] };
  const posts = json.data || [];
  let inserted = 0;
  let updated = 0;
  for (const p of posts) {
    const message = (p.message || p.story || "").trim();
    if (!message && !p.full_picture) continue; // skip empty posts
    const permalink = p.permalink_url || `https://www.facebook.com/${p.id}`;
    const thumbnail = p.full_picture || p.attachments?.data?.[0]?.media?.image?.src || null;
    const title = message ? message.split(/\r?\n/)[0].slice(0, 120) : "Facebook post";
    const existing = await db
      .select()
      .from(socialPostsTable)
      .where(
        and(eq(socialPostsTable.platform, "facebook"), eq(socialPostsTable.externalId, p.id)),
      );
    if (existing.length === 0) {
      await db.insert(socialPostsTable).values({
        platform: "facebook",
        externalId: p.id,
        title,
        body: message,
        url: permalink,
        thumbnail,
        publishedAt: p.created_time ? new Date(p.created_time) : new Date(),
      });
      inserted++;
    } else {
      await db
        .update(socialPostsTable)
        .set({ title, body: message, thumbnail, updatedAt: new Date() })
        .where(eq(socialPostsTable.id, existing[0].id));
      updated++;
    }
  }
  return { inserted, updated, total: posts.length };
}

async function recordSync(
  platform: Platform,
  status: "ok" | "error",
  message: string | null,
) {
  await db
    .insert(socialFeedsTable)
    .values({
      platform,
      enabled: true,
      lastSyncedAt: new Date(),
      lastSyncStatus: status,
      lastSyncMessage: message,
    })
    .onConflictDoUpdate({
      target: socialFeedsTable.platform,
      set: {
        lastSyncedAt: new Date(),
        lastSyncStatus: status,
        lastSyncMessage: message,
      },
    });
}

// ---- Unified GET endpoint --------------------------------------------------

function shapePost(row: typeof socialPostsTable.$inferSelect) {
  const base = {
    id: `${row.platform === "youtube" ? "yt" : row.platform === "facebook" ? "fb" : row.platform === "linkedin" ? "li" : "tw"}:${row.externalId}`,
    rawId: row.id,
    source: row.platform as Platform,
    platform: row.platform as Platform,
    title: row.title,
    body: row.body,
    excerpt: row.body.length > 220 ? row.body.slice(0, 220).trimEnd() + "…" : row.body,
    url: row.url,
    thumbnail: row.thumbnail,
    date: row.publishedAt.toISOString(),
    hidden: row.hidden,
    videoId: row.platform === "youtube" ? row.externalId : undefined,
  };
  return base;
}

router.get("/social/posts", async (req: Request, res: Response) => {
  await ensureLegacyMigration();
  const includeHidden = String(req.query.includeHidden || "") === "1";
  const platformParam = String(req.query.platform || "").toLowerCase();
  const enabled = await getEnabledPlatforms();

  // Auto-sync YouTube if enabled & stale
  if (enabled.has("youtube")) {
    try {
      const feed = await getFeed("youtube");
      const stale =
        !feed?.lastSyncedAt ||
        Date.now() - new Date(feed.lastSyncedAt).getTime() > YT_AUTO_SYNC_TTL;
      if (stale) {
        try {
          await syncYouTube(req);
          await recordSync("youtube", "ok", null);
        } catch (e) {
          await recordSync("youtube", "error", (e as Error).message);
        }
      }
    } catch {
      /* ignore */
    }
  }

  let rows = await db
    .select()
    .from(socialPostsTable)
    .orderBy(desc(socialPostsTable.publishedAt));
  rows = rows.filter((r) => enabled.has(r.platform as Platform));
  if (!includeHidden) rows = rows.filter((r) => !r.hidden);
  if (platformParam) rows = rows.filter((r) => r.platform === platformParam);
  res.json(rows.map(shapePost));
});

// ---- Manual create ---------------------------------------------------------

router.post("/social/posts", requireAdmin, async (req: Request, res: Response) => {
  const { platform, title, body, url, thumbnail, date } = req.body as {
    platform?: string;
    title?: string;
    body?: string;
    url?: string;
    thumbnail?: string;
    date?: string;
  };
  if (!platform || !PLATFORMS.includes(platform as Platform)) {
    res.status(400).json({ error: "platform must be one of " + PLATFORMS.join(", ") });
    return;
  }
  if (platform === "youtube" || platform === "facebook") {
    res.status(400).json({ error: `${platform} posts are imported via Sync, not added manually.` });
    return;
  }
  if (!url || !(body || title)) {
    res.status(400).json({ error: "url and (title or body) are required" });
    return;
  }
  // Generate unique manual external id
  const externalId = `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const [post] = await db
    .insert(socialPostsTable)
    .values({
      platform,
      externalId,
      title: title || "",
      body: body || "",
      url,
      thumbnail: thumbnail || null,
      publishedAt: date ? new Date(date) : new Date(),
    })
    .returning();
  res.json(shapePost(post));
});

router.patch("/social/posts/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  if (!Number.isFinite(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const { title, body, url, thumbnail, date, hidden } = req.body as {
    title?: string;
    body?: string;
    url?: string;
    thumbnail?: string | null;
    date?: string;
    hidden?: boolean;
  };
  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (typeof title === "string") update.title = title;
  if (typeof body === "string") update.body = body;
  if (typeof url === "string") update.url = url;
  if (thumbnail !== undefined) update.thumbnail = thumbnail;
  if (typeof date === "string" && date) update.publishedAt = new Date(date);
  if (typeof hidden === "boolean") update.hidden = hidden;
  const [post] = await db
    .update(socialPostsTable)
    .set(update)
    .where(eq(socialPostsTable.id, id))
    .returning();
  if (!post) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(shapePost(post));
});

router.delete("/social/posts/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  await db.delete(socialPostsTable).where(eq(socialPostsTable.id, id));
  res.json({ success: true });
});

// ---- Feeds (per-platform enable/disable + sync metadata) -------------------

router.get("/social/feeds", async (_req: Request, res: Response) => {
  await ensureLegacyMigration();
  const rows = await db.select().from(socialFeedsTable);
  const map = new Map(rows.map((r) => [r.platform, r]));
  const out = await Promise.all(
    PLATFORMS.map(async (platform) => {
      const r = map.get(platform);
      const cred = await platformCredentialStatus(platform);
      return {
        platform,
        enabled: r?.enabled ?? true,
        lastSyncedAt: r?.lastSyncedAt?.toISOString() ?? null,
        lastSyncStatus: r?.lastSyncStatus ?? null,
        lastSyncMessage: r?.lastSyncMessage ?? null,
        configured: cred.configured,
        missingSecrets: cred.missing,
        autoSync: platform === "youtube" || platform === "facebook",
      };
    }),
  );
  res.json(out);
});

// ---- API credentials (Facebook, etc.) -------------------------------------
// Stored in site_content under `secret.<KEY>`. Values are never returned in
// plaintext — only a `set` boolean and a masked hint.

const MANAGED_SECRET_KEYS = ["FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN"] as const;
type ManagedSecretKey = (typeof MANAGED_SECRET_KEYS)[number];

function maskSecret(value: string | undefined): string {
  if (!value) return "";
  if (value.length <= 6) return "•".repeat(value.length);
  return `${value.slice(0, 2)}${"•".repeat(Math.max(4, value.length - 6))}${value.slice(-2)}`;
}

router.get("/social/credentials", requireAdmin, async (_req: Request, res: Response) => {
  const out: Record<string, { set: boolean; source: "db" | "env" | null; hint: string }> = {};
  for (const key of MANAGED_SECRET_KEYS) {
    const dbRows = await db
      .select()
      .from(siteContentTable)
      .where(eq(siteContentTable.key, `secret.${key}`));
    const dbValue = dbRows[0]?.value?.trim();
    const envValue = process.env[key]?.trim();
    const value = dbValue || envValue;
    out[key] = {
      set: !!value,
      source: dbValue ? "db" : envValue ? "env" : null,
      hint: maskSecret(value),
    };
  }
  res.json(out);
});

router.put("/social/credentials", requireAdmin, async (req: Request, res: Response) => {
  const body = (req.body || {}) as Record<string, unknown>;
  const updated: string[] = [];
  for (const key of MANAGED_SECRET_KEYS) {
    if (!(key in body)) continue;
    const raw = body[key];
    if (raw === null || raw === "") {
      // Delete the override (env fallback resumes if defined).
      await db
        .delete(siteContentTable)
        .where(eq(siteContentTable.key, `secret.${key}`));
      updated.push(key);
      continue;
    }
    if (typeof raw !== "string") {
      res.status(400).json({ error: `${key} must be a string` });
      return;
    }
    const value = raw.trim();
    if (!value) continue;
    await db
      .insert(siteContentTable)
      .values({ key: `secret.${key}`, value })
      .onConflictDoUpdate({
        target: siteContentTable.key,
        set: { value, updatedAt: new Date() },
      });
    updated.push(key);
  }
  res.json({ success: true, updated });
});

router.put("/social/feeds/:platform", requireAdmin, async (req: Request, res: Response) => {
  const platform = String(req.params.platform).toLowerCase();
  if (!PLATFORMS.includes(platform as Platform)) {
    res.status(400).json({ error: "Invalid platform" });
    return;
  }
  const { enabled } = req.body as { enabled?: boolean };
  if (typeof enabled !== "boolean") {
    res.status(400).json({ error: "enabled must be a boolean" });
    return;
  }
  await db
    .insert(socialFeedsTable)
    .values({ platform, enabled })
    .onConflictDoUpdate({
      target: socialFeedsTable.platform,
      set: { enabled },
    });
  res.json({ success: true });
});

// ---- Sync trigger ----------------------------------------------------------

router.post("/social/sync/:platform", requireAdmin, async (req: Request, res: Response) => {
  const platform = String(req.params.platform).toLowerCase() as Platform;
  if (!["youtube", "facebook"].includes(platform)) {
    res.status(400).json({ error: "Only youtube and facebook can be synced." });
    return;
  }
  try {
    const result = platform === "youtube" ? await syncYouTube(req) : await syncFacebook();
    await recordSync(platform, "ok", `Synced ${result.total} (${result.inserted} new)`);
    res.json({ success: true, ...result });
  } catch (e) {
    const msg = (e as Error).message || "Sync failed";
    await recordSync(platform, "error", msg);
    res.status(500).json({ error: msg });
  }
});

// ---- Settings (channel id, handles) ---------------------------------------

router.get("/social/settings", async (_req: Request, res: Response) => {
  const youtubeChannelId = await getSetting("youtube_channel_id", DEFAULT_YT_CHANNEL_ID);
  const twitterHandle = await getSetting("twitter_handle", "");
  const linkedinHandle = await getSetting("linkedin_handle", "");
  const facebookPageUrl = await getSetting("facebook_page_url", "");
  res.json({ youtubeChannelId, twitterHandle, linkedinHandle, facebookPageUrl });
});

router.put("/social/settings", requireAdmin, async (req: Request, res: Response) => {
  const { youtubeChannelId, twitterHandle, linkedinHandle, facebookPageUrl } = req.body;
  if (typeof youtubeChannelId === "string" && youtubeChannelId.trim()) {
    const old = await getSetting("youtube_channel_id", DEFAULT_YT_CHANNEL_ID);
    await setSetting("youtube_channel_id", youtubeChannelId.trim());
    if (old !== youtubeChannelId.trim()) {
      // Force re-sync next read by clearing lastSyncedAt
      await db
        .update(socialFeedsTable)
        .set({ lastSyncedAt: null })
        .where(eq(socialFeedsTable.platform, "youtube"));
    }
  }
  if (typeof twitterHandle === "string") await setSetting("twitter_handle", twitterHandle.trim());
  if (typeof linkedinHandle === "string") await setSetting("linkedin_handle", linkedinHandle.trim());
  if (typeof facebookPageUrl === "string") await setSetting("facebook_page_url", facebookPageUrl.trim());
  res.json({ success: true });
});

// ---- Backwards-compatibility shims (legacy clients/routes) ----------------
// These read from the unified table so old endpoints keep working.

router.get("/social/youtube", async (req: Request, res: Response) => {
  await ensureLegacyMigration();
  const enabled = await getEnabledPlatforms();
  if (enabled.has("youtube")) {
    try {
      const feed = await getFeed("youtube");
      const stale =
        !feed?.lastSyncedAt ||
        Date.now() - new Date(feed.lastSyncedAt).getTime() > YT_AUTO_SYNC_TTL;
      if (stale) {
        try {
          await syncYouTube(req);
          await recordSync("youtube", "ok", null);
        } catch (e) {
          await recordSync("youtube", "error", (e as Error).message);
        }
      }
    } catch {
      /* ignore */
    }
  }
  const rows = await db
    .select()
    .from(socialPostsTable)
    .where(eq(socialPostsTable.platform, "youtube"))
    .orderBy(desc(socialPostsTable.publishedAt));
  res.json(
    rows.map((r) => ({
      id: `yt:${r.externalId}`,
      source: "youtube" as const,
      videoId: r.externalId,
      title: r.title,
      description: r.body,
      thumbnail: r.thumbnail,
      date: r.publishedAt.toISOString(),
      url: r.url,
    })),
  );
});

router.get("/social/linkedin", async (_req: Request, res: Response) => {
  await ensureLegacyMigration();
  const rows = await db
    .select()
    .from(socialPostsTable)
    .where(eq(socialPostsTable.platform, "linkedin"))
    .orderBy(desc(socialPostsTable.publishedAt));
  res.json(
    rows.map((r) => ({
      id: `li:${r.id}`,
      rawId: r.id,
      source: "linkedin" as const,
      title: r.title,
      description: r.body,
      url: r.url,
      date: r.publishedAt.toISOString(),
    })),
  );
});

router.post("/social/linkedin", requireAdmin, async (req: Request, res: Response) => {
  const { title, description, url, date } = req.body;
  if (!title || !url) {
    res.status(400).json({ error: "title and url are required" });
    return;
  }
  const externalId = `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const [row] = await db
    .insert(socialPostsTable)
    .values({
      platform: "linkedin",
      externalId,
      title,
      body: description || "",
      url,
      publishedAt: date ? new Date(date) : new Date(),
    })
    .returning();
  res.json({
    id: `li:${row.id}`,
    rawId: row.id,
    title: row.title,
    description: row.body,
    url: row.url,
    date: row.publishedAt.toISOString(),
  });
});

router.put("/social/linkedin/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { title, description, url, date } = req.body;
  const [row] = await db
    .update(socialPostsTable)
    .set({
      title,
      body: description || "",
      url,
      publishedAt: date ? new Date(date) : new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(socialPostsTable.id, id), eq(socialPostsTable.platform, "linkedin")))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ id: `li:${row.id}`, title: row.title, description: row.body, url: row.url, date: row.publishedAt.toISOString() });
});

router.delete("/social/linkedin/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  await db
    .delete(socialPostsTable)
    .where(and(eq(socialPostsTable.id, id), eq(socialPostsTable.platform, "linkedin")));
  res.json({ success: true });
});

router.get("/social/twitter", async (_req: Request, res: Response) => {
  await ensureLegacyMigration();
  const rows = await db
    .select()
    .from(socialPostsTable)
    .where(eq(socialPostsTable.platform, "twitter"))
    .orderBy(desc(socialPostsTable.publishedAt));
  res.json(
    rows.map((r) => ({
      id: `tw:${r.id}`,
      rawId: r.id,
      source: "twitter" as const,
      text: r.body,
      url: r.url,
      date: r.publishedAt.toISOString(),
    })),
  );
});

router.post("/social/twitter", requireAdmin, async (req: Request, res: Response) => {
  const { text, url, date } = req.body;
  if (!text || !url) {
    res.status(400).json({ error: "text and url are required" });
    return;
  }
  const externalId = `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const [row] = await db
    .insert(socialPostsTable)
    .values({
      platform: "twitter",
      externalId,
      title: "",
      body: text,
      url,
      publishedAt: date ? new Date(date) : new Date(),
    })
    .returning();
  res.json({ id: `tw:${row.id}`, rawId: row.id, text: row.body, url: row.url, date: row.publishedAt.toISOString() });
});

router.put("/social/twitter/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { text, url, date } = req.body;
  const [row] = await db
    .update(socialPostsTable)
    .set({
      body: text,
      url,
      publishedAt: date ? new Date(date) : new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(socialPostsTable.id, id), eq(socialPostsTable.platform, "twitter")))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({ id: `tw:${row.id}`, text: row.body, url: row.url, date: row.publishedAt.toISOString() });
});

router.delete("/social/twitter/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(String(req.params.id));
  await db
    .delete(socialPostsTable)
    .where(and(eq(socialPostsTable.id, id), eq(socialPostsTable.platform, "twitter")));
  res.json({ success: true });
});

// Legacy hidden-list endpoints (composite ids).
router.get("/social/hidden", async (_req: Request, res: Response) => {
  await ensureLegacyMigration();
  const rows = await db
    .select()
    .from(socialPostsTable)
    .where(eq(socialPostsTable.hidden, true));
  const ids = rows.map((r) => {
    const prefix = r.platform === "youtube" ? "yt" : r.platform === "facebook" ? "fb" : r.platform === "linkedin" ? "li" : "tw";
    if (r.platform === "youtube" || r.platform === "facebook") return `${prefix}:${r.externalId}`;
    return `${prefix}:${r.id}`;
  });
  res.json(ids);
});

router.put("/social/hidden", requireAdmin, async (req: Request, res: Response) => {
  const { ids } = req.body as { ids?: string[] };
  if (!Array.isArray(ids)) {
    res.status(400).json({ error: "ids must be an array of strings" });
    return;
  }
  // Reset all to visible, then mark requested as hidden.
  await db.update(socialPostsTable).set({ hidden: false });
  for (const cid of ids) {
    const [prefix, rest] = cid.split(":");
    if (!rest) continue;
    if (prefix === "yt") {
      await db
        .update(socialPostsTable)
        .set({ hidden: true })
        .where(and(eq(socialPostsTable.platform, "youtube"), eq(socialPostsTable.externalId, rest)));
    } else if (prefix === "fb") {
      await db
        .update(socialPostsTable)
        .set({ hidden: true })
        .where(and(eq(socialPostsTable.platform, "facebook"), eq(socialPostsTable.externalId, rest)));
    } else if (prefix === "li" || prefix === "tw") {
      const idNum = parseInt(rest);
      if (Number.isFinite(idNum)) {
        await db
          .update(socialPostsTable)
          .set({ hidden: true })
          .where(eq(socialPostsTable.id, idNum));
      }
    }
  }
  res.json({ success: true });
});

export default router;
