import { useCallback, useState, useMemo, type MouseEvent } from "react";
import { useLocation } from "wouter";
import { YouTubeModalOverlay } from "@/components/YouTubeModal";
import { Play } from "lucide-react";

interface WPContentProps {
  html: string;
  className?: string;
}

function extractAllYouTubeIds(html: string): string[] {
  const ids: string[] = [];
  const regex = /src=["'](?:https?:)?\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]+)/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (!ids.includes(match[1])) ids.push(match[1]);
  }
  return ids;
}

const YT_TRIGGER_HTML = (videoId: string) =>
  `<div class="yt-modal-trigger" data-video-id="${videoId}" style="cursor:pointer;position:relative;border-radius:1rem;overflow:hidden;aspect-ratio:16/9;margin:1.5rem 0;display:block;width:100%;max-width:100%;box-sizing:border-box;">` +
  `<img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Video" loading="lazy" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;border-radius:0;margin:0;" />` +
  `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2);">` +
  `<div style="width:64px;height:64px;border-radius:50%;background:#dc2626;display:flex;align-items:center;justify-content:center;">` +
  `<svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>` +
  `</div></div></div>`;

function replaceYouTubeIframes(html: string): string {
  return html
    .replace(
      /<figure[^>]*class="[^"]*wp-block-embed[^"]*"[^>]*>[\s\S]*?(?:youtube(?:-nocookie)?\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})[\s\S]*?<\/figure>/gi,
      (_m, videoId) => YT_TRIGGER_HTML(videoId),
    )
    .replace(
      /<p>(?:\s*)<iframe[^>]*src=["'](?:https?:)?\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})[^"']*["'][^>]*>(?:<\/iframe>)?(?:\s*)<\/p>/gi,
      (_m, videoId) => YT_TRIGGER_HTML(videoId),
    )
    .replace(
      /<iframe[^>]*src=["'](?:https?:)?\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]{11})[^"']*["'][^>]*>(?:<\/iframe>)?/gi,
      (_m, videoId) => YT_TRIGGER_HTML(videoId),
    )
    .replace(
      /<p>\s*(?:https?:)?\/\/(?:www\.)?(?:youtube\.com\/watch\?(?:[^"'<\s]*&)?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})[^<]*<\/p>/gi,
      (_m, videoId) => YT_TRIGGER_HTML(videoId),
    );
}

export function WPContent({ html, className = "" }: WPContentProps) {
  const [, navigate] = useLocation();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const processedHtml = useMemo(() => replaceYouTubeIframes(html), [html]);

  const handleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    const ytTrigger = target.closest(".yt-modal-trigger") as HTMLElement | null;
    if (ytTrigger) {
      e.preventDefault();
      const videoId = ytTrigger.getAttribute("data-video-id");
      if (videoId) setActiveVideoId(videoId);
      return;
    }

    const anchor = target.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    if (/^https?:\/\/(?:www\.|cms\.)?rhythmstix\.co\.uk/i.test(href)) {
      e.preventDefault();
      const url = new URL(href);
      const path = url.pathname.replace(/\/$/, "").toLowerCase();
      navigate(path || "/");
      return;
    }

    if (href.startsWith("/") && !href.startsWith("//")) {
      e.preventDefault();
      navigate(href);
    }
  }, [navigate]);

  return (
    <>
      <div
        className={className}
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
      <YouTubeModalOverlay
        videoId={activeVideoId || ""}
        isOpen={!!activeVideoId}
        onClose={() => setActiveVideoId(null)}
      />
    </>
  );
}
