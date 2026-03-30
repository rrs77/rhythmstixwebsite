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

function replaceYouTubeIframes(html: string): string {
  return html.replace(
    /<p>(?:\s*)<iframe[^>]*src=["'](?:https?:)?\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]+)[^"']*["'][^>]*>(?:<\/iframe>)?(?:\s*)<\/p>/gi,
    (_match, videoId) =>
      `<div class="yt-modal-trigger" data-video-id="${videoId}" style="cursor:pointer;position:relative;border-radius:1rem;overflow:hidden;aspect-ratio:16/9;margin-bottom:1rem;">` +
      `<img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Video" style="width:100%;height:100%;object-fit:cover;" />` +
      `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2);">` +
      `<div style="width:64px;height:64px;border-radius:50%;background:#dc2626;display:flex;align-items:center;justify-content:center;">` +
      `<svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>` +
      `</div></div></div>`
  ).replace(
    /<iframe[^>]*src=["'](?:https?:)?\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]+)[^"']*["'][^>]*>(?:<\/iframe>)?/gi,
    (_match, videoId) =>
      `<div class="yt-modal-trigger" data-video-id="${videoId}" style="cursor:pointer;position:relative;border-radius:1rem;overflow:hidden;aspect-ratio:16/9;margin-bottom:1rem;">` +
      `<img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="Video" style="width:100%;height:100%;object-fit:cover;" />` +
      `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2);">` +
      `<div style="width:64px;height:64px;border-radius:50%;background:#dc2626;display:flex;align-items:center;justify-content:center;">` +
      `<svg width="28" height="28" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>` +
      `</div></div></div>`
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
