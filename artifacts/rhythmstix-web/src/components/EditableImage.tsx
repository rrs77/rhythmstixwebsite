import { useState, useRef } from "react";
import { Upload, Loader2, Trash2 } from "lucide-react";
import { useContent, useSaveContent } from "@/hooks/use-content";
import { useAdminMode } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

interface EditableImageProps {
  contentKey: string;
  fallback?: string;
  alt?: string;
  className?: string;
  /** Render this when no image (admin or public) is set. Useful for keeping a text wordmark as default. */
  emptyRender?: React.ReactNode;
}

const ACCEPT = "image/png,image/jpeg,image/webp,image/gif,image/svg+xml";

export function EditableImage({
  contentKey,
  fallback,
  alt = "",
  className,
  emptyRender,
}: EditableImageProps) {
  const { data: content } = useContent();
  const { data: isAdmin } = useAdminMode();
  const saveMutation = useSaveContent();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const url = content?.[contentKey] || fallback || "";
  const hasImage = Boolean(url);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch(
        `/api/uploads/image?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          headers: { "Content-Type": file.type },
          credentials: "include",
          body: file,
        },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Upload failed (${res.status})`);
      }
      const { url: blobUrl } = (await res.json()) as { url: string };
      await saveMutation.mutateAsync({ key: contentKey, value: blobUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function clearImage() {
    setError(null);
    await saveMutation.mutateAsync({ key: contentKey, value: "" });
  }

  // Public visitors just see the image (or the empty render).
  if (!isAdmin) {
    if (hasImage) {
      return <img src={url} alt={alt} className={className} />;
    }
    return <>{emptyRender ?? null}</>;
  }

  // Admin sees the image (or empty state) with hover controls.
  return (
    <div className="relative inline-block group">
      {hasImage ? (
        <img src={url} alt={alt} className={className} />
      ) : (
        <div
          className={cn(
            "inline-flex items-center justify-center",
            !emptyRender && "min-w-32 min-h-20 border-2 border-dashed border-[#3a9ca5]/40 rounded-xl bg-[#3a9ca5]/5 text-[#3a9ca5]/70 text-xs px-4 py-3",
            className,
          )}
        >
          {emptyRender ?? "No image"}
        </div>
      )}

      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-xl flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || saveMutation.isPending}
          className="px-2.5 py-1.5 rounded-lg bg-white text-[#3a9ca5] text-xs font-semibold shadow-lg hover:bg-[#3a9ca5] hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-60"
          title={hasImage ? "Replace image" : "Upload image"}
        >
          {uploading || saveMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {hasImage ? "Replace" : "Upload"}
        </button>
        {hasImage && (
          <button
            type="button"
            onClick={clearImage}
            disabled={uploading || saveMutation.isPending}
            className="px-2.5 py-1.5 rounded-lg bg-white text-red-600 text-xs font-semibold shadow-lg hover:bg-red-600 hover:text-white transition-colors flex items-center gap-1.5 disabled:opacity-60"
            title="Remove image"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-white px-2 py-1 rounded shadow-lg whitespace-nowrap z-10">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
