import { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { linkedinPostsTable, twitterPostsTable, siteContentTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAdmin } from "./auth";

const router = Router();

const DEFAULT_YT_CHANNEL_ID = "UCooHhU7FKALUQ4CtqjDFMsw";

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
    await db.update(siteContentTable).set({ value, updatedAt: new Date() }).where(eq(siteContentTable.key, key));
  } else {
    await db.insert(siteContentTable).values({ key, value });
  }
}

let ytCache: { channelId: string; data: any[]; fetchedAt: number } | null = null;
const YT_CACHE_TTL = 10 * 60 * 1000;

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}

function parseYouTubeRSS(xml: string) {
  const entries: any[] = [];
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

    entries.push({
      id: `yt:${videoId}`,
      source: "youtube" as const,
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

router.get("/social/youtube", async (_req: Request, res: Response) => {
  try {
    const channelId = await getSetting("youtube_channel_id", DEFAULT_YT_CHANNEL_ID);
    if (ytCache && ytCache.channelId === channelId && Date.now() - ytCache.fetchedAt < YT_CACHE_TTL) {
      res.json(ytCache.data);
      return;
    }

    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const response = await fetch(url);
    if (!response.ok) {
      res.json(ytCache?.data || []);
      return;
    }
    const xml = await response.text();
    const videos = parseYouTubeRSS(xml);
    ytCache = { channelId, data: videos, fetchedAt: Date.now() };
    res.json(videos);
  } catch {
    res.json(ytCache?.data || []);
  }
});

router.get("/social/linkedin", async (_req: Request, res: Response) => {
  const posts = await db.select().from(linkedinPostsTable).orderBy(desc(linkedinPostsTable.date));
  const mapped = posts.map((p) => ({
    id: `li:${p.id}`,
    source: "linkedin" as const,
    title: p.title,
    description: p.description,
    url: p.url,
    date: p.date.toISOString(),
  }));
  res.json(mapped);
});

router.post("/social/linkedin", requireAdmin, async (req: Request, res: Response) => {
  const { title, description, url, date } = req.body;
  if (!title || !url) {
    res.status(400).json({ error: "title and url are required" });
    return;
  }
  const [post] = await db.insert(linkedinPostsTable).values({
    title,
    description: description || "",
    url,
    date: date ? new Date(date) : new Date(),
  }).returning();
  res.json(post);
});

router.put("/social/linkedin/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { title, description, url, date } = req.body;
  const [post] = await db.update(linkedinPostsTable).set({
    title,
    description: description || "",
    url,
    date: date ? new Date(date) : new Date(),
  }).where(eq(linkedinPostsTable.id, id)).returning();
  if (!post) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(post);
});

router.delete("/social/linkedin/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(linkedinPostsTable).where(eq(linkedinPostsTable.id, id));
  res.json({ success: true });
});

router.get("/social/twitter", async (_req: Request, res: Response) => {
  const posts = await db.select().from(twitterPostsTable).orderBy(desc(twitterPostsTable.date));
  const mapped = posts.map((p) => ({
    id: `tw:${p.id}`,
    source: "twitter" as const,
    text: p.text,
    url: p.url,
    date: p.date.toISOString(),
  }));
  res.json(mapped);
});

router.post("/social/twitter", requireAdmin, async (req: Request, res: Response) => {
  const { text, url, date } = req.body;
  if (!text || !url) {
    res.status(400).json({ error: "text and url are required" });
    return;
  }
  const [post] = await db.insert(twitterPostsTable).values({
    text,
    url,
    date: date ? new Date(date) : new Date(),
  }).returning();
  res.json(post);
});

router.put("/social/twitter/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  const { text, url, date } = req.body;
  const [post] = await db.update(twitterPostsTable).set({
    text,
    url,
    date: date ? new Date(date) : new Date(),
  }).where(eq(twitterPostsTable.id, id)).returning();
  if (!post) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(post);
});

router.delete("/social/twitter/:id", requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id);
  await db.delete(twitterPostsTable).where(eq(twitterPostsTable.id, id));
  res.json({ success: true });
});

router.get("/social/hidden", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(siteContentTable).where(eq(siteContentTable.key, "hidden_social_posts"));
    const hidden: string[] = rows.length > 0 ? JSON.parse(rows[0].value) : [];
    res.json(hidden);
  } catch {
    res.json([]);
  }
});

router.put("/social/hidden", requireAdmin, async (req: Request, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids)) {
    res.status(400).json({ error: "ids must be an array of strings" });
    return;
  }
  await setSetting("hidden_social_posts", JSON.stringify(ids));
  res.json({ success: true });
});

router.get("/social/settings", async (_req: Request, res: Response) => {
  const youtubeChannelId = await getSetting("youtube_channel_id", DEFAULT_YT_CHANNEL_ID);
  const twitterHandle = await getSetting("twitter_handle", "");
  const linkedinHandle = await getSetting("linkedin_handle", "");
  res.json({ youtubeChannelId, twitterHandle, linkedinHandle });
});

router.put("/social/settings", requireAdmin, async (req: Request, res: Response) => {
  const { youtubeChannelId, twitterHandle, linkedinHandle } = req.body;
  if (typeof youtubeChannelId === "string" && youtubeChannelId.trim()) {
    await setSetting("youtube_channel_id", youtubeChannelId.trim());
    ytCache = null;
  }
  if (typeof twitterHandle === "string") {
    await setSetting("twitter_handle", twitterHandle.trim());
  }
  if (typeof linkedinHandle === "string") {
    await setSetting("linkedin_handle", linkedinHandle.trim());
  }
  res.json({ success: true });
});

export default router;
