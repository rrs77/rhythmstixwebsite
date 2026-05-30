import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWPPosts } from "@/hooks/use-wp";
import { decodeHtml } from "@/lib/wordpress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Shield, Lock, X, Check, ArrowRight,
  Youtube, Linkedin, Facebook, Twitter, FileText, Play, Plus, EyeOff, Newspaper, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { PostModal, type UnifiedPost } from "@/components/blog/PostModal";

type SourceFilter = "all" | "wordpress" | "youtube" | "linkedin" | "facebook" | "twitter" | "blog";

interface SocialPostApi {
  id: string;
  rawId: number;
  source: "youtube" | "facebook" | "linkedin" | "twitter";
  platform: "youtube" | "facebook" | "linkedin" | "twitter";
  title: string;
  body: string;
  excerpt: string;
  url: string;
  thumbnail: string | null;
  date: string;
  hidden: boolean;
  videoId?: string;
}

function useSocialPostsAll(isAdmin: boolean) {
  return useQuery<SocialPostApi[]>({
    queryKey: ["social-posts-all", isAdmin ? "all" : "public"],
    queryFn: async () => {
      const url = isAdmin ? "/api/social/posts?includeHidden=1" : "/api/social/posts";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

function useAdminCheck() {
  return useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const res = await fetch("/api/auth/admin-check", { credentials: "include" });
      const data = await res.json();
      return data.authenticated as boolean;
    },
    staleTime: 60 * 1000,
  });
}

function useHiddenPosts() {
  return useQuery({
    queryKey: ["hidden-posts"],
    queryFn: async () => {
      const res = await fetch("/api/hidden-posts", { credentials: "include" });
      return res.json() as Promise<number[]>;
    },
    staleTime: 30 * 1000,
  });
}

interface BlogPostApi {
  id: string;
  rawId: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  published: boolean;
}

function useBlogPosts(isAdmin: boolean) {
  return useQuery<BlogPostApi[]>({
    queryKey: ["blog-posts", isAdmin ? "all" : "public"],
    queryFn: async () => {
      const url = isAdmin ? "/api/blog-posts/all" : "/api/blog-posts";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

function stripHtml(html: string): string {
  if (!html) return "";
  if (typeof document === "undefined") {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/&hellip;/g, "…")
      .replace(/&nbsp;/g, " ")
      .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
      .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;|&apos;/g, "'")
      .trim();
  }
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || div.innerText || "").replace(/\s+/g, " ").trim();
}

const SOURCE_ICONS = {
  wordpress: FileText,
  youtube: Youtube,
  linkedin: Linkedin,
  facebook: Facebook,
  twitter: Twitter,
  blog: Newspaper,
};

const SOURCE_COLORS = {
  wordpress: "text-blue-600 bg-blue-50",
  youtube: "text-red-600 bg-red-50",
  linkedin: "text-[#0077b5] bg-[#0077b5]/10",
  facebook: "text-[#1877f2] bg-[#1877f2]/10",
  twitter: "text-sky-500 bg-sky-50",
  blog: "text-[#3a9ca5] bg-[#3a9ca5]/10",
};

const SOURCE_LABELS = {
  wordpress: "Blog",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  twitter: "Twitter",
  blog: "Blog Post",
};

export default function BlogList() {
  const { data: wpPosts, isLoading: wpLoading } = useWPPosts(50);
  const { data: isAdmin } = useAdminCheck();
  const { data: socialPosts = [], isLoading: socialLoading } = useSocialPostsAll(!!isAdmin);
  const { data: hiddenWpPosts = [] } = useHiddenPosts();
  const queryClient = useQueryClient();

  const [adminMode, setAdminMode] = useState(false);
  useEffect(() => {
    if (isAdmin) setAdminMode(true);
  }, [isAdmin]);

  const { data: blogPostsRaw = [], isLoading: blogLoading } = useBlogPosts(!!isAdmin);

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("wordpress");
  const [activePost, setActivePost] = useState<UnifiedPost | null>(null);

  // Blog post create form state (edits happen inside the post modal)
  const [blogFormOpen, setBlogFormOpen] = useState(false);
  const [bpTitle, setBpTitle] = useState("");
  const [bpExcerpt, setBpExcerpt] = useState("");
  const [bpContent, setBpContent] = useState("");
  const [bpDate, setBpDate] = useState("");
  const [bpPublished, setBpPublished] = useState(true);

  function resetBlogForm() {
    setBpTitle("");
    setBpExcerpt("");
    setBpContent("");
    setBpDate("");
    setBpPublished(true);
  }

  function openCreateBlog() {
    resetBlogForm();
    setBlogFormOpen(true);
  }

  const adminLoginMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Invalid password");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-check"] });
      setShowAdminLogin(false);
      setAdminPassword("");
      setAdminError("");
      setAdminMode(true);
    },
    onError: () => setAdminError("Invalid password"),
  });

  const toggleWpMutation = useMutation({
    mutationFn: async (postId: number) => {
      const current = hiddenWpPosts || [];
      const newHidden = current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId];
      const res = await fetch("/api/hidden-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postIds: newHidden }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return newHidden;
    },
    onSuccess: (newHidden) => {
      queryClient.setQueryData(["hidden-posts"], newHidden);
    },
  });

  const toggleSocialMutation = useMutation({
    mutationFn: async ({ rawId, hidden }: { rawId: number; hidden: boolean }) => {
      const res = await fetch(`/api/social/posts/${rawId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ hidden }),
      });
      if (!res.ok) throw new Error("Failed to update");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts-all"] });
    },
  });

  const importWpMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/blog-posts/import-wordpress", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Import failed");
      }
      return res.json() as Promise<{ imported: number; skipped: number; hiddenTotal: number }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["hidden-posts"] });
      alert(`Import complete: ${data.imported} new post${data.imported === 1 ? "" : "s"} imported, ${data.skipped} skipped.`);
    },
    onError: (err: Error) => {
      alert(`Import failed: ${err.message}`);
    },
  });

  const saveBlogMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: bpTitle,
        excerpt: bpExcerpt,
        content: bpContent,
        date: bpDate ? new Date(bpDate).toISOString() : new Date().toISOString(),
        published: bpPublished,
      };
      const res = await fetch("/api/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setBlogFormOpen(false);
      resetBlogForm();
    },
  });

  const unifiedPosts: UnifiedPost[] = useMemo(() => {
    const items: UnifiedPost[] = [];

    if (wpPosts) {
      for (const p of wpPosts) {
        items.push({
          id: `wp:${p.id}`,
          source: "wordpress",
          title: decodeHtml(p.title.rendered),
          excerpt: stripHtml(p.excerpt.rendered),
          date: p.date,
          slug: p.slug,
        });
      }
    }

    for (const s of socialPosts) {
      const fullText = stripHtml(s.body || "");
      items.push({
        id: s.id,
        rawId: s.rawId,
        source: s.source,
        title: s.title || (fullText ? fullText.split(/\r?\n/)[0].slice(0, 120) : "Post"),
        excerpt: fullText.substring(0, 200),
        body: fullText,
        date: s.date,
        url: s.url,
        thumbnail: s.thumbnail || undefined,
        videoId: s.videoId,
        published: !s.hidden,
      });
    }

    for (const b of blogPostsRaw) {
      items.push({
        id: b.id,
        source: "blog",
        title: b.title,
        excerpt: b.excerpt || stripHtml(b.content).substring(0, 200),
        body: b.content,
        date: b.date,
        rawId: b.rawId,
        published: b.published,
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [wpPosts, socialPosts, blogPostsRaw]);

  const isHidden = (post: UnifiedPost) => {
    if (post.source === "wordpress") {
      const wpId = parseInt(post.id.replace("wp:", ""));
      return hiddenWpPosts.includes(wpId);
    }
    if (post.source === "blog") {
      return post.published === false;
    }
    // social posts: published=false means hidden=true
    return post.published === false;
  };

  const filteredPosts = unifiedPosts.filter((p) => {
    if (!adminMode && isHidden(p)) return false;
    if (sourceFilter !== "all" && p.source !== sourceFilter) return false;
    return true;
  });

  const isLoading = wpLoading || socialLoading || blogLoading;

  const toggleBlogPublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: number; published: boolean }) => {
      const res = await fetch(`/api/blog-posts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ published }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
    },
  });

  function handleToggleHide(post: UnifiedPost) {
    // Always toggle relative to the freshest known state for this post, not the
    // (possibly stale) object the modal handed us — otherwise repeated clicks
    // recompute the same target and the visibility never actually changes.
    const live = unifiedPosts.find((p) => p.id === post.id) ?? post;
    if (live.source === "wordpress") {
      const wpId = parseInt(live.id.replace("wp:", ""));
      toggleWpMutation.mutate(wpId);
    } else if (live.source === "blog" && live.rawId !== undefined) {
      toggleBlogPublishMutation.mutate({ id: live.rawId, published: !(live.published ?? true) });
    } else if (live.rawId !== undefined) {
      toggleSocialMutation.mutate({ rawId: live.rawId, hidden: live.published !== false });
    }
  }

  function handleAdminToggle() {
    if (isAdmin) {
      setAdminMode(!adminMode);
    } else {
      setShowAdminLogin(true);
    }
  }

  const sourceCounts = useMemo(() => {
    const counts: Record<SourceFilter, number> = { all: 0, wordpress: 0, youtube: 0, linkedin: 0, facebook: 0, twitter: 0, blog: 0 };
    for (const p of unifiedPosts) {
      if (adminMode || !isHidden(p)) {
        counts.all++;
        counts[p.source]++;
      }
    }
    return counts;
  }, [unifiedPosts, adminMode, hiddenWpPosts]);

  const hiddenCount = useMemo(() => {
    return unifiedPosts.filter((p) => isHidden(p)).length;
  }, [unifiedPosts, hiddenWpPosts]);

  // The open post must reflect the *latest* query data, not a frozen snapshot
  // captured when it was clicked. Without this, saving or toggling visibility
  // leaves the modal showing stale published/content values (e.g. the hide/show
  // toggle appears to do nothing because its `hidden` prop never updates).
  const liveActivePost = useMemo(
    () => (activePost ? unifiedPosts.find((p) => p.id === activePost.id) ?? activePost : null),
    [activePost, unifiedPosts],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">Latest Content</h1>
              <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] mt-2" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAdminToggle}
              className={cn(
                "text-xs gap-1.5",
                adminMode ? "text-[#3a9ca5]" : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              {adminMode ? "Exit Admin" : "Admin"}
            </Button>
          </div>

          {showAdminLogin && !isAdmin && (
            <div className="mb-6 bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  Admin Login
                </div>
                <button onClick={() => { setShowAdminLogin(false); setAdminError(""); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form
                onSubmit={(e) => { e.preventDefault(); adminLoginMutation.mutate(adminPassword); }}
                className="flex gap-2"
              >
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Admin password"
                  className="flex-grow px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                />
                <Button type="submit" size="sm" className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
                  Login
                </Button>
              </form>
              {adminError && <p className="text-red-500 text-xs mt-2">{adminError}</p>}
            </div>
          )}

          {adminMode && (
            <div className="mb-4 space-y-3">
              <div className="bg-[#3a9ca5]/5 border border-[#3a9ca5]/20 rounded-xl px-4 py-3 text-sm text-[#3a9ca5]">
                <strong>Admin mode:</strong> Click any post to open it in a modal where you can edit, hide, or delete it. Use <em>Add Blog Post</em> to publish a new article from scratch.
                {hiddenCount > 0 && (
                  <span className="ml-1 font-medium">({hiddenCount} post{hiddenCount !== 1 ? "s" : ""} currently hidden)</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={openCreateBlog}
                  size="sm"
                  className="gap-1.5 bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Blog Post
                </Button>
                <Button
                  onClick={() => {
                    if (confirm("Import all WordPress posts into this site? Already-imported posts will be skipped, and imported posts will be hidden from the live WordPress feed.")) {
                      importWpMutation.mutate();
                    }
                  }}
                  size="sm"
                  variant="outline"
                  disabled={importWpMutation.isPending}
                  className="gap-1.5 border-[#d4a017] text-[#d4a017] hover:bg-[#d4a017]/10"
                >
                  {importWpMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  {importWpMutation.isPending ? "Importing…" : "Import all WordPress posts"}
                </Button>
              </div>
            </div>
          )}

          <AnimatePresence>
            {blogFormOpen && adminMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-xl border border-[#3a9ca5]/30 p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Newspaper className="w-4 h-4 text-[#3a9ca5]" />
                      Add Blog Post
                    </h3>
                    <button
                      onClick={() => { setBlogFormOpen(false); resetBlogForm(); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Title</label>
                      <input
                        type="text"
                        value={bpTitle}
                        onChange={(e) => setBpTitle(e.target.value)}
                        placeholder="A short, descriptive headline"
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Excerpt (preview shown on the card)</label>
                      <textarea
                        value={bpExcerpt}
                        onChange={(e) => setBpExcerpt(e.target.value)}
                        placeholder="One or two sentences that summarise the post."
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Body</label>
                      <textarea
                        value={bpContent}
                        onChange={(e) => setBpContent(e.target.value)}
                        placeholder="Write the full post here. Line breaks are preserved."
                        rows={10}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 resize-y leading-relaxed"
                      />
                    </div>
                    <div className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Publish date</label>
                        <input
                          type="date"
                          value={bpDate}
                          onChange={(e) => setBpDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                        />
                      </div>
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={bpPublished}
                          onChange={(e) => setBpPublished(e.target.checked)}
                          className="accent-[#3a9ca5]"
                        />
                        Visible to public
                      </label>
                    </div>
                    {saveBlogMutation.isError && (
                      <p className="text-xs text-red-600">{(saveBlogMutation.error as Error)?.message || "Failed to save"}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveBlogMutation.mutate()}
                        disabled={!bpTitle.trim() || saveBlogMutation.isPending}
                        className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
                        size="sm"
                      >
                        {saveBlogMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                        Publish post
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => { setBlogFormOpen(false); resetBlogForm(); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {(["wordpress", "youtube", "linkedin", "facebook", "twitter", "all"] as SourceFilter[]).map((filter) => {
              const count = sourceCounts[filter];
              const isActive = sourceFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSourceFilter(filter)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap",
                    isActive
                      ? "bg-[#3a9ca5] text-white shadow-sm"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  {filter === "all" ? "All" : SOURCE_LABELS[filter]}
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-white/20" : "bg-background"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#3a9ca5]" />
            </div>
          )}

          {!isLoading && filteredPosts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">No posts to show.</p>
            </div>
          )}

          {filteredPosts.length > 0 && (
            <div className="grid gap-5">
              {filteredPosts.map((post, index) => {
                const hidden = isHidden(post);
                const SourceIcon = SOURCE_ICONS[post.source];
                const sourceColor = SOURCE_COLORS[post.source];

                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.04 }}
                    className="relative group/card"
                  >
                    <div
                      className={cn(
                        "bg-card rounded-2xl border border-[#3a9ca5]/10 hover:border-[#3a9ca5]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#3a9ca5]/10 overflow-hidden",
                        hidden && adminMode && "opacity-50 border-dashed border-red-300"
                      )}
                    >
                      {post.source === "youtube" ? (
                        <div className="flex gap-4 p-4">
                          <button
                            onClick={() => setActivePost(post)}
                            className="group/thumb relative shrink-0 w-44 h-24 sm:w-52 sm:h-[7.25rem] rounded-xl overflow-hidden cursor-pointer"
                          >
                            <img
                              src={`https://img.youtube.com/vi/${post.videoId}/mqdefault.jpg`}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/30 transition-colors flex items-center justify-center">
                              <div className="w-9 h-9 rounded-full bg-red-600 flex items-center justify-center shadow-md">
                                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          </button>
                          <div className="flex-grow min-w-0 py-0.5">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", sourceColor)}>
                                <SourceIcon className="w-3 h-3" />
                                {SOURCE_LABELS[post.source]}
                              </span>
                              {hidden && adminMode && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                  <EyeOff className="w-3 h-3" />
                                  Hidden
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                            <button
                              onClick={() => setActivePost(post)}
                              className="text-left group"
                            >
                              <h2 className="text-base font-semibold mb-1 text-foreground group-hover:text-[#3a9ca5] transition-colors line-clamp-2">
                                {post.title}
                              </h2>
                            </button>
                            {post.excerpt && (
                              <p className="text-muted-foreground text-xs line-clamp-2">{post.excerpt}</p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-5">
                          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", sourceColor)}>
                              <SourceIcon className="w-3 h-3" />
                              {SOURCE_LABELS[post.source]}
                            </span>
                            {hidden && adminMode && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                <EyeOff className="w-3 h-3" />
                                Hidden
                              </span>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setActivePost(post)}
                            className="group block w-full text-left"
                          >
                            <h2 className={cn(
                              "text-lg font-semibold mb-1.5 text-foreground transition-colors",
                              post.source === "linkedin" ? "group-hover:text-[#0077b5]" : "group-hover:text-[#3a9ca5]"
                            )}>
                              {post.title}
                            </h2>
                            {post.excerpt && (
                              <p className="text-muted-foreground text-sm line-clamp-2 mb-2.5">{post.excerpt}</p>
                            )}
                            <span className={cn(
                              "inline-flex items-center text-sm font-medium",
                              post.source === "linkedin" ? "text-[#0077b5]" : "text-[#3a9ca5]"
                            )}>
                              {post.source === "wordpress" ? "Read More" : "Read full post"} <ArrowRight className="w-4 h-4 ml-1" />
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      <AnimatePresence>
        {liveActivePost && (
          <PostModal
            post={liveActivePost}
            isAdmin={adminMode}
            hidden={isHidden(liveActivePost)}
            onClose={() => setActivePost(null)}
            onToggleHide={(p) => handleToggleHide(p)}
            onDeleted={() => {
              queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
              queryClient.invalidateQueries({ queryKey: ["social-posts-all"] });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
