import { pgTable, text, serial, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";

// ---- Legacy tables (kept for backfill / migration source) ----
export const linkedinPostsTable = pgTable("linkedin_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  url: text("url").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type LinkedinPost = typeof linkedinPostsTable.$inferSelect;

export const twitterPostsTable = pgTable("twitter_posts", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  url: text("url").notNull(),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TwitterPost = typeof twitterPostsTable.$inferSelect;

// ---- New unified social posts ----
// platform: 'youtube' | 'facebook' | 'linkedin' | 'twitter'
// externalId: platform-native id (videoId, fb post id, or `manual-{n}` for hand-entered)
export const socialPostsTable = pgTable(
  "social_posts",
  {
    id: serial("id").primaryKey(),
    platform: text("platform").notNull(),
    externalId: text("external_id").notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
    url: text("url").notNull(),
    thumbnail: text("thumbnail"),
    publishedAt: timestamp("published_at").defaultNow().notNull(),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => ({
    platformExtUq: uniqueIndex("social_posts_platform_ext_uq").on(t.platform, t.externalId),
  }),
);

export type SocialPost = typeof socialPostsTable.$inferSelect;

// Per-platform feed configuration. platform is the primary key.
export const socialFeedsTable = pgTable("social_feeds", {
  platform: text("platform").primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  lastSyncedAt: timestamp("last_synced_at"),
  lastSyncStatus: text("last_sync_status"), // 'ok' | 'error' | null
  lastSyncMessage: text("last_sync_message"),
});

export type SocialFeed = typeof socialFeedsTable.$inferSelect;
