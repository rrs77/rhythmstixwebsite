import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWPPosts } from "@/hooks/use-wp";
import { decodeHtml } from "@/lib/wordpress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, ArrowRight, Shield, Eye, EyeOff, Lock, X,
  Youtube, Linkedin, FileText, Play, Plus, Trash2, ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { YouTubeModalOverlay } from "@/components/YouTubeModal";

type SourceFilter = "all" | "wordpress" | "youtube" | "linkedin";

interface UnifiedPost {
  id: string;
  source: "wordpress" | "youtube" | "linkedin";
  title: string;
  excerpt: string;
  date: string;
  slug?: string;
  videoId?: string;
  thumbnail?: string;
  url?: string;
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

function useHiddenSocial() {
  return useQuery({
    queryKey: ["hidden-social"],
    queryFn: async () => {
      const res = await fetch("/api/social/hidden", { credentials: "include" });
      return res.json() as Promise<string[]>;
    },
    staleTime: 30 * 1000,
  });
}

function useYouTubeVideos() {
  return useQuery({
    queryKey: ["youtube-videos"],
    queryFn: async () => {
      const res = await fetch("/api/social/youtube");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

function useLinkedinPosts() {
  return useQuery({
    queryKey: ["linkedin-posts"],
    queryFn: async () => {
      const res = await fetch("/api/social/linkedin");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&hellip;/g, "...").replace(/&nbsp;/g, " ").trim();
}

const SOURCE_ICONS = {
  wordpress: FileText,
  youtube: Youtube,
  linkedin: Linkedin,
};

const SOURCE_COLORS = {
  wordpress: "text-blue-600 bg-blue-50",
  youtube: "text-red-600 bg-red-50",
  linkedin: "text-[#0077b5] bg-[#0077b5]/10",
};

const SOURCE_LABELS = {
  wordpress: "Blog",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

export default function BlogList() {
  const { data: wpPosts, isLoading: wpLoading } = useWPPosts(50);
  const { data: ytVideos = [], isLoading: ytLoading } = useYouTubeVideos();
  const { data: liPosts = [], isLoading: liLoading } = useLinkedinPosts();
  const { data: isAdmin } = useAdminCheck();
  const { data: hiddenWpPosts = [] } = useHiddenPosts();
  const { data: hiddenSocial = [] } = useHiddenSocial();
  const queryClient = useQueryClient();

  const [adminMode, setAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [showAddLinkedin, setShowAddLinkedin] = useState(false);
  const [liTitle, setLiTitle] = useState("");
  const [liDesc, setLiDesc] = useState("");
  const [liUrl, setLiUrl] = useState("");

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
    mutationFn: async (id: string) => {
      const current = hiddenSocial || [];
      const newHidden = current.includes(id)
        ? current.filter((h) => h !== id)
        : [...current, id];
      const res = await fetch("/api/social/hidden", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: newHidden }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return newHidden;
    },
    onSuccess: (newHidden) => {
      queryClient.setQueryData(["hidden-social"], newHidden);
    },
  });

  const addLinkedinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/social/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: liTitle, description: liDesc, url: liUrl }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-posts"] });
      setLiTitle("");
      setLiDesc("");
      setLiUrl("");
      setShowAddLinkedin(false);
    },
  });

  const deleteLinkedinMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/social/linkedin/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linkedin-posts"] });
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

    for (const v of ytVideos) {
      items.push({
        id: v.id,
        source: "youtube",
        title: v.title,
        excerpt: v.description?.substring(0, 200) || "",
        date: v.date,
        videoId: v.videoId,
        thumbnail: v.thumbnail,
        url: v.url,
      });
    }

    for (const l of liPosts) {
      items.push({
        id: l.id,
        source: "linkedin",
        title: l.title,
        excerpt: l.description?.substring(0, 200) || "",
        date: l.date,
        url: l.url,
      });
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [wpPosts, ytVideos, liPosts]);

  const isHidden = (post: UnifiedPost) => {
    if (post.source === "wordpress") {
      const wpId = parseInt(post.id.replace("wp:", ""));
      return hiddenWpPosts.includes(wpId);
    }
    return hiddenSocial.includes(post.id);
  };

  const filteredPosts = unifiedPosts.filter((p) => {
    if (!adminMode && isHidden(p)) return false;
    if (sourceFilter !== "all" && p.source !== sourceFilter) return false;
    return true;
  });

  const isLoading = wpLoading || ytLoading || liLoading;

  function handleToggleHide(post: UnifiedPost) {
    if (post.source === "wordpress") {
      const wpId = parseInt(post.id.replace("wp:", ""));
      toggleWpMutation.mutate(wpId);
    } else {
      toggleSocialMutation.mutate(post.id);
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
    const counts = { all: 0, wordpress: 0, youtube: 0, linkedin: 0 };
    for (const p of unifiedPosts) {
      if (adminMode || !isHidden(p)) {
        counts.all++;
        counts[p.source]++;
      }
    }
    return counts;
  }, [unifiedPosts, adminMode, hiddenWpPosts, hiddenSocial]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-[#3a9ca5]">Blog</h1>
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
                <strong>Admin mode:</strong> Click the eye icon on any post to show/hide it from visitors. You can also add LinkedIn posts from{" "}
                <a href="https://www.linkedin.com/in/robert-reich-storer-974449144/" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-[#2d8890]">your LinkedIn profile</a>.
              </div>
              <Button
                onClick={() => setShowAddLinkedin(!showAddLinkedin)}
                variant="outline"
                size="sm"
                className="gap-1.5 border-[#0077b5]/30 text-[#0077b5]"
              >
                <Plus className="w-3.5 h-3.5" />
                Add LinkedIn Post
              </Button>
            </div>
          )}

          <AnimatePresence>
            {showAddLinkedin && adminMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-card rounded-xl border border-[#0077b5]/20 p-5 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                      <Linkedin className="w-4 h-4 text-[#0077b5]" />
                      Add LinkedIn Post
                    </h3>
                    <button onClick={() => setShowAddLinkedin(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={liTitle}
                      onChange={(e) => setLiTitle(e.target.value)}
                      placeholder="Post title"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b5]/30"
                    />
                    <textarea
                      value={liDesc}
                      onChange={(e) => setLiDesc(e.target.value)}
                      placeholder="Description / excerpt"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b5]/30 resize-none"
                    />
                    <input
                      type="url"
                      value={liUrl}
                      onChange={(e) => setLiUrl(e.target.value)}
                      placeholder="LinkedIn post URL"
                      className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b5]/30"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => addLinkedinMutation.mutate()}
                        disabled={!liTitle.trim() || !liUrl.trim() || addLinkedinMutation.isPending}
                        className="bg-[#0077b5] hover:bg-[#005e93] text-white"
                        size="sm"
                      >
                        {addLinkedinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                        Add Post
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setShowAddLinkedin(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
            {(["all", "wordpress", "youtube", "linkedin"] as SourceFilter[]).map((filter) => {
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
                        hidden && adminMode && "opacity-50 border-dashed"
                      )}
                    >
                      {post.source === "youtube" ? (
                        <div className="flex gap-4 p-4">
                          <button
                            onClick={() => setActiveVideoId(post.videoId || null)}
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
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", sourceColor)}>
                                <SourceIcon className="w-3 h-3" />
                                {SOURCE_LABELS[post.source]}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                            </div>
                            <button
                              onClick={() => setActiveVideoId(post.videoId || null)}
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
                          <div className="flex items-center gap-2 mb-2.5">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium", sourceColor)}>
                              <SourceIcon className="w-3 h-3" />
                              {SOURCE_LABELS[post.source]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>

                          {post.source === "wordpress" ? (
                            <Link
                              href={`/post/${post.slug}`}
                              className="group block"
                            >
                              <h2 className="text-lg font-semibold mb-1.5 text-foreground group-hover:text-[#3a9ca5] transition-colors">
                                {post.title}
                              </h2>
                              <p className="text-muted-foreground text-sm line-clamp-2 mb-2.5">{post.excerpt}</p>
                              <span className="inline-flex items-center text-[#3a9ca5] text-sm font-medium">
                                Read More <ArrowRight className="w-4 h-4 ml-1" />
                              </span>
                            </Link>
                          ) : (
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group block"
                            >
                              <h2 className="text-lg font-semibold mb-1.5 text-foreground group-hover:text-[#0077b5] transition-colors">
                                {post.title}
                              </h2>
                              {post.excerpt && (
                                <p className="text-muted-foreground text-sm line-clamp-2 mb-2.5">{post.excerpt}</p>
                              )}
                              <span className="inline-flex items-center text-[#0077b5] text-sm font-medium">
                                View on LinkedIn <ExternalLink className="w-3.5 h-3.5 ml-1" />
                              </span>
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {adminMode && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                        {post.source === "linkedin" && (
                          <button
                            onClick={() => {
                              const liId = parseInt(post.id.replace("li:", ""));
                              if (confirm("Delete this LinkedIn post?")) deleteLinkedinMutation.mutate(liId);
                            }}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-all shadow-sm"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleHide(post)}
                          disabled={toggleWpMutation.isPending || toggleSocialMutation.isPending}
                          className={cn(
                            "p-2 rounded-lg transition-all shadow-sm",
                            hidden
                              ? "bg-red-100 text-red-600 hover:bg-red-200"
                              : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                          )}
                          title={hidden ? "Show this post" : "Hide this post"}
                        >
                          {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />

      {activeVideoId && (
        <YouTubeModalOverlay
          videoId={activeVideoId}
          isOpen={true}
          onClose={() => setActiveVideoId(null)}
        />
      )}
    </div>
  );
}
