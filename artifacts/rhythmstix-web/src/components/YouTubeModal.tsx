import { useState, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Maximize2, Minimize2 } from "lucide-react";

interface YouTubeModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface FullscreenDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void>;
}

interface FullscreenElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void>;
}

function YouTubeModalOverlay({ videoId, isOpen, onClose }: YouTubeModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      const doc = document as FullscreenDocument;
      const inFs = !!(document.fullscreenElement || doc.webkitFullscreenElement);
      if (e.key === "Escape" && !inFs) onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    const onFsChange = () => {
      const doc = document as FullscreenDocument;
      setIsFullscreen(!!(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    document.addEventListener("webkitfullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.removeEventListener("webkitfullscreenchange", onFsChange);
    };
  }, []);

  // Reset fullscreen state when modal closes
  useEffect(() => {
    if (!isOpen && isFullscreen) {
      const doc = document as FullscreenDocument;
      const exit = document.exitFullscreen?.bind(document) || doc.webkitExitFullscreen?.bind(doc);
      exit?.().catch(() => {});
    }
  }, [isOpen, isFullscreen]);

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
    } catch {
      // Browser refused fullscreen — silently ignore.
    }
  }, []);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div
            ref={containerRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className={
              isFullscreen
                ? "relative z-10 w-screen h-screen bg-black"
                : "relative z-10 w-full max-w-5xl aspect-video max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-black"
            }
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              key={videoId}
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title="Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex items-center gap-2 z-10">
              <button
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </button>
              <button
                onClick={onClose}
                aria-label="Close video"
                title="Close"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface YouTubeThumbnailProps {
  videoId: string;
  className?: string;
}

export function YouTubeThumbnail({ videoId, className = "" }: YouTubeThumbnailProps) {
  const [isOpen, setIsOpen] = useState(false);
  const hasAspect = /aspect-/.test(className);

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        aria-label="Play video"
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border border-border block ${hasAspect ? "" : "aspect-video w-full"} ${className}`}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.3 }}
      >
        <img
          src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
          alt="Video thumbnail"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            if (!img.dataset.fallback) {
              img.dataset.fallback = "1";
              img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
            }
          }}
        />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <motion.div
            className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-red-600 flex items-center justify-center shadow-lg"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Play className="w-7 h-7 sm:w-10 sm:h-10 text-white fill-white ml-1" />
          </motion.div>
        </div>
      </motion.button>
      <YouTubeModalOverlay videoId={videoId} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

export function useYouTubeModal() {
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const openVideo = useCallback((videoId: string) => {
    setActiveVideoId(videoId);
  }, []);

  const closeVideo = useCallback(() => {
    setActiveVideoId(null);
  }, []);

  return { activeVideoId, openVideo, closeVideo };
}

export { YouTubeModalOverlay };
