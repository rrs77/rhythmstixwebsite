import { useParams } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWPPost, useWPMedia } from "@/hooks/use-wp";
import { decodeHtml, rewriteWPLinks } from "@/lib/wordpress";
import { WPContent } from "@/components/WPContent";
import { YouTubeThumbnail } from "@/components/YouTubeModal";
import { Loader2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

function extractFirstYouTube(html: string): string | null {
  const iframeMatch = html.match(
    /src=["'](?:https?:)?\/\/(?:www\.)?youtube(?:-nocookie)?\.com\/embed\/([a-zA-Z0-9_-]+)/
  );
  if (iframeMatch) return iframeMatch[1];

  const linkMatch = html.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
  );
  if (linkMatch) return linkMatch[1];

  return null;
}

function removeFirstYouTubeEmbed(html: string): string {
  let cleaned = html.replace(
    /<figure[^>]*class="[^"]*wp-block-embed-youtube[^"]*"[^>]*>[\s\S]*?<\/figure>/i,
    ""
  );
  if (cleaned !== html) return cleaned;

  cleaned = html.replace(
    /<iframe[^>]*src=["'][^"']*youtube[^"']*["'][^>]*><\/iframe>/i,
    ""
  );
  if (cleaned !== html) return cleaned;

  cleaned = html.replace(
    /<div[^>]*class="[^"]*wp-block-embed[^"]*"[^>]*>[\s\S]*?<\/div>\s*<\/div>/i,
    ""
  );
  return cleaned;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { data: post, isLoading, error } = useWPPost(slug || "");
  const { data: featuredMedia } = useWPMedia(post?.featured_media || 0);

  const youtubeId = useMemo(() => {
    if (!post) return null;
    return extractFirstYouTube(post.content.rendered);
  }, [post]);

  const processedContent = useMemo(() => {
    if (!post) return "";
    let html = rewriteWPLinks(post.content.rendered);
    if (youtubeId) {
      html = removeFirstYouTubeEmbed(html);
    }
    return html;
  }, [post, youtubeId]);

  const heroImage = featuredMedia?.source_url || null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="mb-6 text-muted-foreground" asChild>
            <Link href="/blog">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
          </Button>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Unable to load this post. Please try again later.</p>
            </div>
          )}
          {post && (
            <>
              <h1 className="text-4xl font-bold mb-4 text-[rgb(52,154,167)]">
                {decodeHtml(post.title.rendered)}
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                {new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
              </p>

              {youtubeId ? (
                <YouTubeThumbnail videoId={youtubeId} className="mb-8 aspect-video w-full" />
              ) : heroImage ? (
                <div className="mb-8 rounded-2xl overflow-hidden border border-border">
                  <img
                    src={heroImage}
                    alt={featuredMedia?.alt_text || decodeHtml(post.title.rendered)}
                    className="w-full h-auto"
                  />
                </div>
              ) : null}

              <WPContent
                className="wp-content prose prose-lg max-w-none"
                html={processedContent}
              />
            </>
          )}
          {!isLoading && !error && !post && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Post not found.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
