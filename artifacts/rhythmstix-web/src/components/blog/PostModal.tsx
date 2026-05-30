import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  X, Maximize2, Minimize2, Maximize, ExternalLink, EyeOff, Eye,
  Trash2, Pencil, Save, Loader2, Youtube, Linkedin, Facebook, Twitter, FileText, Newspaper, CheckCircle2,
} from "lucide-react";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WPContent } from "@/components/WPContent";
import { getPost as wpGetPost, decodeHtml } from "@/lib/wordpress";

export type PostSource = "wordpress" | "youtube" | "linkedin" | "facebook" | "twitter" | "blog";

export interface UnifiedPost {
  id: string;
  source: PostSource;
  title: string;
  excerpt: string;
  body?: string;
  date: string;
  slug?: string;
  videoId?: string;
  thumbnail?: string;
  url?: string;
  rawId?: number;
  published?: boolean;
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}
interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

const SOURCE_META: Record<PostSource, { label: string; icon: typeof Youtube; tone: string }> = {
  wordpress: { label: "Blog", icon: FileText, tone: "text-blue-600 bg-blue-50 border-blue-200" },
  youtube: { label: "YouTube", icon: Youtube, tone: "text-red-600 bg-red-50 border-red-200" },
  linkedin: { label: "LinkedIn", icon: Linkedin, tone: "text-[#0077b5] bg-[#0077b5]/10 border-[#0077b5]/20" },
  facebook: { label: "Facebook", icon: Facebook, tone: "text-[#1877f2] bg-[#1877f2]/10 border-[#1877f2]/20" },
  twitter: { label: "Twitter / X", icon: Twitter, tone: "text-sky-500 bg-sky-50 border-sky-200" },
  blog: { label: "Blog Post", icon: Newspaper, tone: "text-[#3a9ca5] bg-[#3a9ca5]/10 border-[#3a9ca5]/20" },
};

interface PostModalProps {
  post: UnifiedPost;
  isAdmin: boolean;
  hidden: boolean;
  onClose: () => void;
  onToggleHide: (post: UnifiedPost) => void;
  onDeleted?: () => void;
}

export function PostModal({ post: postProp, isAdmin, hidden, onClose, onToggleHide, onDeleted }: PostModalProps) {
  const queryClient = useQueryClient();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<"normal" | "max">("normal");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  // After a WordPress→local transfer we swap the active post in place so the modal
  // becomes the new local blog post (with rawId/source="blog") and the right save
  // mutation is used. Initialised from the prop and reset whenever the prop changes.
  const [activePost, setActivePost] = useState<UnifiedPost>(postProp);
  useEffect(() => { setActivePost(postProp); }, [postProp.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const post = activePost;
  // Snapshot of form values captured when entering edit mode; used by Cancel to revert.
  const editBaselineRef = useRef<{
    title: string; excerpt: string; body: string; url: string;
    date: string; published: boolean; thumbnail: string;
  } | null>(null);

  const meta = SOURCE_META[post.source];
  const SourceIcon = meta.icon;

  // ---- Lazy-fetch full WordPress HTML when needed ----
  const { data: wpFull, isLoading: wpLoading } = useQuery({
    queryKey: ["wp-post-modal", post.slug],
    queryFn: () => wpGetPost(post.slug || ""),
    enabled: post.source === "wordpress" && !!post.slug,
    staleTime: 5 * 60 * 1000,
  });

  // ---- Editable form state (for blog + linkedin) ----
  const initialTitle = post.title;
  const initialExcerpt = post.excerpt || "";
  const initialBody = post.body || "";
  const initialUrl = post.url || "";
  const initialDate = post.date ? post.date.slice(0, 10) : "";
  const initialPublished = post.published ?? !hidden;
  const initialThumbnail = post.thumbnail || "";

  const [fTitle, setFTitle] = useState(initialTitle);
  const [fExcerpt, setFExcerpt] = useState(initialExcerpt);
  const [fBody, setFBody] = useState(initialBody);
  const [fUrl, setFUrl] = useState(initialUrl);
  const [fDate, setFDate] = useState(initialDate);
  const [fPublished, setFPublished] = useState(initialPublished);
  const [fThumbnail, setFThumbnail] = useState(initialThumbnail);

  // Reset form when the *prop* post changes (i.e. parent opened a different post).
  // We deliberately key off `postProp.id` rather than the internal `activePost.id`
  // so the WordPress→local transfer flow — which swaps `activePost` in place and
  // immediately switches into edit mode — isn't clobbered by this reset.
  useEffect(() => {
    setFTitle(postProp.title);
    setFExcerpt(postProp.excerpt || "");
    setFBody(postProp.body || "");
    setFUrl(postProp.url || "");
    setFDate(postProp.date ? postProp.date.slice(0, 10) : "");
    setFPublished(postProp.published ?? !hidden);
    setFThumbnail(postProp.thumbnail || "");
    setEditing(false);
    setSavedAt(null);
  }, [postProp.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the visibility checkbox / derived state in sync with the latest server
  // value (e.g. after the parent refetches following a hide/show toggle) so the
  // "Visible to public" checkbox can't drift out of sync with the Hidden badge.
  // Never clobber the user's choice while they're actively editing.
  useEffect(() => {
    if (!editing) setFPublished(postProp.published ?? !hidden);
  }, [postProp.published, hidden, editing]);

  // Auto-dismiss the "Changes saved" banner after a few seconds.
  useEffect(() => {
    if (!savedAt) return;
    const t = setTimeout(() => setSavedAt(null), 3500);
    return () => clearTimeout(t);
  }, [savedAt]);

  // ---- Save mutations per source ----
  const saveBlog = useMutation({
    mutationFn: async () => {
      if (post.rawId === undefined) throw new Error("Missing id");
      const res = await fetch(`/api/blog-posts/${post.rawId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: fTitle,
          excerpt: fExcerpt,
          content: fBody,
          date: fDate ? new Date(fDate).toISOString() : new Date().toISOString(),
          published: fPublished,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      setEditing(false);
      setSavedAt(Date.now());
    },
  });

  const saveSocial = useMutation({
    mutationFn: async () => {
      if (post.rawId === undefined) throw new Error("Missing id");
      const res = await fetch(`/api/social/posts/${post.rawId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: fTitle,
          body: fBody || fExcerpt,
          url: fUrl,
          date: fDate ? new Date(fDate).toISOString() : new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-posts-all"] });
      queryClient.invalidateQueries({ queryKey: [`admin-${post.source}`] });
      setEditing(false);
      setSavedAt(Date.now());
    },
  });

  // ---- Transfer WordPress post into local blog_posts table ----
  function htmlToPlainExcerpt(html: string, max = 240): string {
    const noTags = html.replace(/<[^>]+>/g, " ");
    const decoded = noTags
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&hellip;/g, "…");
    const collapsed = decoded.replace(/\s+/g, " ").trim();
    return collapsed.length > max ? collapsed.slice(0, max).trimEnd() + "…" : collapsed;
  }

  const transferToLocal = useMutation({
    mutationFn: async () => {
      const html = wpFull?.content?.rendered;
      if (!html) throw new Error("Full post content not loaded yet — please wait.");
      const wpId = parseInt(post.id.replace("wp:", ""));
      // 1. Create a native blog post with the WP content (HTML preserved)
      const createRes = await fetch("/api/blog-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: post.title,
          excerpt: htmlToPlainExcerpt(post.excerpt || html),
          content: html,
          date: post.date,
          published: true,
        }),
      });
      if (!createRes.ok) {
        const j = await createRes.json().catch(() => ({}));
        throw new Error(j.error || "Failed to create local copy");
      }
      // 2. Hide the original WP version so it doesn't duplicate
      const hiddenRes = await fetch("/api/hidden-posts", { credentials: "include" });
      const currentHidden: number[] = hiddenRes.ok ? await hiddenRes.json() : [];
      if (Number.isFinite(wpId) && !currentHidden.includes(wpId)) {
        await fetch("/api/hidden-posts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ postIds: [...currentHidden, wpId] }),
        });
      }
      return createRes.json();
    },
    onSuccess: (created: { id: string; rawId: number; source: "blog"; title: string; excerpt: string; content: string; date: string; published: boolean }) => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["hidden-posts"] });
      // Swap the modal's active post to the newly-created local copy and drop
      // straight into edit mode with title/excerpt/body/date pre-filled.
      const newPost: UnifiedPost = {
        id: created.id,
        rawId: created.rawId,
        source: "blog",
        title: created.title,
        excerpt: created.excerpt,
        body: created.content,
        date: created.date,
        published: created.published,
      };
      setActivePost(newPost);
      const baseline = {
        title: newPost.title,
        excerpt: newPost.excerpt || "",
        body: newPost.body || "",
        url: "",
        date: newPost.date ? newPost.date.slice(0, 10) : "",
        published: newPost.published ?? true,
        thumbnail: "",
      };
      editBaselineRef.current = baseline;
      setFTitle(baseline.title);
      setFExcerpt(baseline.excerpt);
      setFBody(baseline.body);
      setFUrl(baseline.url);
      setFDate(baseline.date);
      setFPublished(baseline.published);
      setFThumbnail(baseline.thumbnail);
      setEditing(true);
    },
  });

  const deletePost = useMutation({
    mutationFn: async () => {
      if (post.source === "blog" && post.rawId !== undefined) {
        const res = await fetch(`/api/blog-posts/${post.rawId}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) throw new Error("Delete failed");
      } else if ((post.source === "linkedin" || post.source === "twitter" || post.source === "facebook") && post.rawId !== undefined) {
        const res = await fetch(`/api/social/posts/${post.rawId}`, { method: "DELETE", credentials: "include" });
        if (!res.ok) throw new Error("Delete failed");
      } else {
        throw new Error("This source can't be deleted from here.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      queryClient.invalidateQueries({ queryKey: ["social-posts-all"] });
      queryClient.invalidateQueries({ queryKey: [`admin-${post.source}`] });
      onDeleted?.();
      onClose();
    },
  });

  // ---- Keyboard + scroll lock ----
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const doc = document as FullscreenDocument;
      const inFs = !!(document.fullscreenElement || doc.webkitFullscreenElement);
      if (e.key === "Escape" && !inFs && !editing) onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose, editing]);

  // ---- Fullscreen API ----
  useEffect(() => {
    const onFs = () => {
      const doc = document as FullscreenDocument;
      setIsFullscreen(!!(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("webkitfullscreenchange", onFs);
    return () => {
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("webkitfullscreenchange", onFs);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current as FullscreenElement | null;
    if (!el) return;
    const doc = document as FullscreenDocument;
    const inFs = !!(document.fullscreenElement || doc.webkitFullscreenElement);
    try {
      if (inFs) {
        const exit = document.exitFullscreen?.bind(document) || doc.webkitExitFullscreen?.bind(doc);
        await exit?.();
      } else {
        const req = el.requestFullscreen?.bind(el) || el.webkitRequestFullscreen?.bind(el);
        await req?.();
      }
    } catch { /* ignore */ }
  }, []);

  // ---- Computed body content ----
  const wpHtml = useMemo(() => {
    if (post.source !== "wordpress") return null;
    if (wpFull?.content?.rendered) return wpFull.content.rendered;
    return null;
  }, [post.source, wpFull]);

  const isSocialEditable = post.source === "linkedin" || post.source === "twitter" || post.source === "facebook";
  const isEditable = isAdmin && (post.source === "blog" || isSocialEditable);
  const canDelete = isAdmin && (post.source === "blog" || isSocialEditable);
  const saveMutation = post.source === "blog" ? saveBlog : saveSocial;

  const sizeClass = size === "max"
    ? "max-w-6xl w-[95vw] h-[92vh]"
    : "max-w-2xl w-full max-h-[85vh]";

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => !editing && onClose()}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden",
          isFullscreen ? "w-screen h-screen max-w-none rounded-none" : sizeClass
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 py-3.5 border-b border-slate-100 shrink-0 bg-white">
          <span className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0",
            meta.tone
          )}>
            <SourceIcon className="w-3.5 h-3.5" />
            {meta.label}
          </span>
          {hidden && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
              <EyeOff className="w-3 h-3" /> Hidden
            </span>
          )}
          <span className="text-xs text-muted-foreground self-center grow truncate">
            {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </span>

          {/* Window controls */}
          <div className="flex items-center gap-1 shrink-0">
            {!isFullscreen && (
              <button
                type="button"
                onClick={() => setSize(size === "normal" ? "max" : "normal")}
                className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-muted-foreground hover:text-foreground"
                title={size === "normal" ? "Enlarge" : "Restore size"}
                aria-label={size === "normal" ? "Enlarge modal" : "Restore modal size"}
              >
                {size === "normal" ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-md hover:bg-slate-100 flex items-center justify-center text-muted-foreground hover:text-foreground"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-md bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin toolbar */}
        {isAdmin && (
          <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-100 bg-slate-50/70 shrink-0 flex-wrap">
            <button
              onClick={() => onToggleHide(post)}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors",
                hidden
                  ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
                  : "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              )}
              title={hidden ? "Show this post publicly" : "Hide from public"}
            >
              {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {hidden ? "Hidden — click to show" : "Visible — click to hide"}
            </button>

            {isEditable && !editing && (
              <button
                onClick={() => {
                  // Snapshot the current (last-saved) values into both state and a ref.
                  // The ref is what Cancel restores from.
                  const baseline = {
                    title: fTitle || post.title,
                    excerpt: fExcerpt || post.excerpt || "",
                    body: fBody || post.body || "",
                    url: fUrl || post.url || "",
                    date: fDate || (post.date ? post.date.slice(0, 10) : ""),
                    published: fPublished,
                    thumbnail: fThumbnail || post.thumbnail || "",
                  };
                  editBaselineRef.current = baseline;
                  setFTitle(baseline.title);
                  setFExcerpt(baseline.excerpt);
                  setFBody(baseline.body);
                  setFUrl(baseline.url);
                  setFDate(baseline.date);
                  setFPublished(baseline.published);
                  setFThumbnail(baseline.thumbnail);
                  setEditing(true);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border bg-[#3a9ca5]/10 border-[#3a9ca5]/30 text-[#3a9ca5] hover:bg-[#3a9ca5]/20"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            )}

            {post.source === "wordpress" && !editing && (
              <button
                onClick={() => transferToLocal.mutate()}
                disabled={transferToLocal.isPending || wpLoading || !wpFull?.content?.rendered}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border bg-[#3a9ca5]/10 border-[#3a9ca5]/30 text-[#3a9ca5] hover:bg-[#3a9ca5]/20 disabled:opacity-50"
                title="Copy this WordPress post into this site so you can edit it here. The original on rhythmstix.co.uk will be hidden from the feed (but not deleted on WordPress)."
              >
                {transferToLocal.isPending
                  ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" /> Transferring…</>)
                  : (<><Pencil className="w-3.5 h-3.5" /> Edit</>)}
              </button>
            )}

            {canDelete && (
              <button
                onClick={() => {
                  if (confirm("Delete this post permanently? This cannot be undone.")) deletePost.mutate();
                }}
                disabled={deletePost.isPending}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border bg-red-50 border-red-200 text-red-600 hover:bg-red-100 disabled:opacity-50"
              >
                {deletePost.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
            )}

            {transferToLocal.isError && (
              <span className="text-[11px] text-red-600 ml-1">
                {(transferToLocal.error as Error)?.message || "Transfer failed"}
              </span>
            )}

            {post.source === "youtube" && (
              <span className="text-[11px] text-muted-foreground italic ml-1">
                YouTube videos are edited in YouTube Studio.
              </span>
            )}
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto grow bg-white">
          {/* Edit mode */}
          {editing && isEditable ? (
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Title</label>
                <input
                  type="text"
                  value={fTitle}
                  onChange={(e) => setFTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                />
              </div>

              {post.source === "blog" && (
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Excerpt</label>
                  <textarea
                    value={fExcerpt}
                    onChange={(e) => setFExcerpt(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 resize-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                  {post.source === "blog" ? "Body" : "Description"}
                </label>
                {post.source === "blog" ? (
                  <RichTextEditor value={fBody} onChange={setFBody} minHeight={320} />
                ) : (
                  <textarea
                    value={fBody}
                    onChange={(e) => setFBody(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 resize-y leading-relaxed"
                  />
                )}
              </div>

              {isSocialEditable && (
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">
                    {post.source === "linkedin" ? "LinkedIn URL" : post.source === "twitter" ? "Tweet URL" : "Facebook URL"}
                  </label>
                  <input
                    type="url"
                    value={fUrl}
                    onChange={(e) => setFUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                  />
                </div>
              )}

              <div className="flex gap-3 items-end flex-wrap">
                <div className="flex-1 min-w-[160px]">
                  <label className="text-xs font-semibold uppercase text-muted-foreground mb-1 block">Date</label>
                  <input
                    type="date"
                    value={fDate}
                    onChange={(e) => setFDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
                  />
                </div>
                {post.source === "blog" && (
                  <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fPublished}
                      onChange={(e) => setFPublished(e.target.checked)}
                      className="accent-[#3a9ca5]"
                    />
                    Visible to public
                  </label>
                )}
              </div>

              {saveMutation.isError && (
                <p className="text-xs text-red-600">{(saveMutation.error as Error)?.message || "Save failed"}</p>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={!fTitle.trim() || saveMutation.isPending}
                  size="sm"
                  className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
                >
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  Save changes
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const b = editBaselineRef.current;
                    if (b) {
                      setFTitle(b.title);
                      setFExcerpt(b.excerpt);
                      setFBody(b.body);
                      setFUrl(b.url);
                      setFDate(b.date);
                      setFPublished(b.published);
                      setFThumbnail(b.thumbnail);
                    }
                    setEditing(false);
                  }}
                >Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              {savedAt && (
                <div className="mx-6 mt-4 flex items-center gap-2 px-3 py-2 rounded-md border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Changes saved.
                </div>
              )}
              {/* Title (read mode) — prefer locally edited values for blog posts so a just-saved
                  edit is reflected immediately, before the parent query refetches. */}
              <div className="px-6 pt-5 pb-3">
                <h2 className="text-2xl font-bold text-foreground leading-tight">
                  {decodeHtml(post.source === "blog" ? fTitle : post.title)}
                </h2>
              </div>

              {/* Embedded media */}
              {post.source === "youtube" && post.videoId && (
                <div className="px-0">
                  <div className="relative w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
                    <iframe
                      src={`https://www.youtube.com/embed/${post.videoId}?autoplay=1&rel=0`}
                      title={post.title}
                      className="absolute inset-0 w-full h-full"
                      frameBorder={0}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}

              {/* WordPress content */}
              {post.source === "wordpress" && (
                <div className="px-6 py-5">
                  {wpLoading && !wpHtml && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" /> Loading post…
                    </div>
                  )}
                  {wpHtml ? (
                    <WPContent className="wp-content prose prose-base max-w-none" html={wpHtml} />
                  ) : !wpLoading && (
                    <p className="text-sm text-foreground/85 leading-relaxed">{post.excerpt || "No content available."}</p>
                  )}
                </div>
              )}

              {/* Blog post body — renders as HTML if it contains tags (e.g. transferred WP posts), else plain text.
                  Prefer locally edited body so a just-saved RTE change is visible immediately. */}
              {post.source === "blog" && (() => {
                const body = fBody;
                const excerpt = fExcerpt || post.excerpt || "";
                return (
                  <div className="px-6 py-5">
                    {body && body.trim().length > 0 ? (
                      /<[a-z][\s\S]*>/i.test(body) ? (
                        <WPContent className="wp-content prose prose-base max-w-none" html={body} />
                      ) : (
                        <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-line">{body}</p>
                      )
                    ) : (
                      <p className="text-base text-foreground/90 leading-relaxed">{excerpt || "No additional content."}</p>
                    )}
                  </div>
                );
              })()}

              {/* LinkedIn / Twitter / Facebook body */}
              {(post.source === "linkedin" || post.source === "twitter" || post.source === "facebook") && (
                <div className="px-6 py-5">
                  {post.source === "facebook" && post.thumbnail && (
                    <img
                      src={post.thumbnail}
                      alt=""
                      className="w-full max-h-96 object-cover rounded-lg mb-4 border border-slate-200"
                    />
                  )}
                  <p className="text-base text-foreground/90 leading-relaxed whitespace-pre-line">
                    {post.body && post.body.trim().length > 0
                      ? post.body
                      : post.excerpt || "No additional content."}
                  </p>
                </div>
              )}

              {/* YouTube description */}
              {post.source === "youtube" && post.excerpt && (
                <div className="px-6 py-4">
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{post.excerpt}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer link */}
        {!editing && post.url && post.source !== "blog" && (
          <div className="px-5 py-3 border-t border-slate-100 shrink-0 flex justify-end bg-white">
            <a
              href={post.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md text-[#3a9ca5] hover:bg-[#3a9ca5]/5"
            >
              {post.source === "youtube" ? "Open on YouTube"
                : post.source === "linkedin" ? "View on LinkedIn"
                : post.source === "facebook" ? "View on Facebook"
                : post.source === "twitter" ? "View on X"
                : "Open original"}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
