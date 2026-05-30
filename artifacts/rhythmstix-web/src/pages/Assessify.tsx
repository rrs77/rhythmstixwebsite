import { useEffect, useMemo } from "react";
import { Link } from "wouter";
import { Loader2, ArrowLeft, ExternalLink } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { WPContent } from "@/components/WPContent";
import { useWPPage } from "@/hooks/use-wp";
import { decodeHtml, rewriteWPLinks } from "@/lib/wordpress";

const WP_SLUG = "assessify";
const APP_URL = "https://assessify.rhythmstix.co.uk/";

export default function Assessify() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const { data: page, isLoading, error } = useWPPage(WP_SLUG);

  const html = useMemo(() => {
    if (!page?.content?.rendered) return "";
    return rewriteWPLinks(page.content.rendered);
  }, [page]);

  const title = page?.title?.rendered ? decodeHtml(page.title.rendered) : "Assessify";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Button variant="ghost" className="mb-6 text-muted-foreground" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-[#3a9ca5] mb-2">
                {title}
              </h1>
              <div className="w-20 h-1 rounded-full bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd]" />
            </div>
            <Button asChild className="bg-[#3a9ca5] hover:bg-[#2f8089] text-white">
              <a href={APP_URL} target="_blank" rel="noopener noreferrer">
                Open Assessify
                <ExternalLink className="ml-2 w-4 h-4" />
              </a>
            </Button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#3a9ca5]" />
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center">
              <p className="text-sm text-red-700">
                Couldn't load the latest content from WordPress. Please try again shortly.
              </p>
            </div>
          )}

          {page && (
            <article className="rounded-2xl border border-[#3a9ca5]/10 bg-card p-6 md:p-10 shadow-sm">
              <WPContent
                className="wp-content prose prose-lg max-w-none"
                html={html}
              />
            </article>
          )}

          {!isLoading && !error && !page && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Assessify info isn't available right now.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
