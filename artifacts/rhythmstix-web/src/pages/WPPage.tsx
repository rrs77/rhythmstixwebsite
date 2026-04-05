import { useParams } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWPPage } from "@/hooks/use-wp";
import { decodeHtml, rewriteWPLinks } from "@/lib/wordpress";
import { WPContent } from "@/components/WPContent";
import { Loader2 } from "lucide-react";
import { useMemo } from "react";

const PRODUCT_NAMES = [
  "Assessify",
  "CCDesigner",
  "Creative Curriculum Designer",
  "PeriFeedback",
  "PeriPlanner",
  "ProgressPath",
  "Rhythmstix App",
  "Rhythmstix",
  "Teaching Portal",
];

function highlightProducts(html: string): string {
  const sorted = [...PRODUCT_NAMES].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(?<![<\\/\\w])\\b(${sorted.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b(?![^<]*>)`,
    'g'
  );
  return html.replace(pattern, '<strong class="product-highlight">$1</strong>');
}

export default function WPPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useWPPage(slug || "");

  const processedContent = useMemo(() => {
    if (!page?.content?.rendered) return "";
    return rewriteWPLinks(highlightProducts(page.content.rendered));
  }, [page]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Unable to load this page. Please try again later.</p>
            </div>
          )}
          {page && (
            <>
              {page.title.rendered && (
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-[rgb(52,154,167)] mb-2">
                    {decodeHtml(page.title.rendered)}
                  </h1>
                  <div className="w-20 h-1 rounded-full bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd]" />
                </div>
              )}
              <div className="rounded-2xl border border-[#3a9ca5]/10 bg-card p-6 md:p-10 shadow-sm">
                <WPContent
                  className="wp-content prose prose-lg max-w-none"
                  html={processedContent}
                />
              </div>
            </>
          )}
          {!isLoading && !error && !page && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Page not found.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
