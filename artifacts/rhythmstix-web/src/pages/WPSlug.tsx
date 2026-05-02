import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getPage, getPost, decodeHtml, rewriteWPLinks } from "@/lib/wordpress";
import { WPContent } from "@/components/WPContent";
import { CustomPageRenderer, type PageTemplate, type PageData } from "@/components/CustomPageRenderer";
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

export default function WPSlug() {
  const { slug } = useParams<{ slug: string }>();
  const cleanSlug = (slug || "").replace(/\/$/, "");

  const { data, isLoading, error } = useQuery({
    queryKey: ["wp-slug", cleanSlug],
    queryFn: async () => {
      const customRes = await fetch(`/api/pages/by-slug/${encodeURIComponent(cleanSlug)}`);
      if (customRes.ok) {
        const custom = await customRes.json();
        return { type: "custom" as const, item: custom };
      }
      const page = await getPage(cleanSlug);
      if (page) return { type: "page" as const, item: page };
      const post = await getPost(cleanSlug);
      if (post) return { type: "post" as const, item: post };
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const item = data && data.type !== "custom" ? (data.item as any) : undefined;

  const processedContent = useMemo(() => {
    if (!item?.content?.rendered) return "";
    return rewriteWPLinks(highlightProducts(item.content.rendered));
  }, [item]);

  if (data?.type === "custom") {
    const custom = data.item as { title: string; template: PageTemplate; data: PageData };
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4">
            <CustomPageRenderer template={custom.template} data={{ heading: custom.title, ...custom.data }} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
          {item && (
            <>
              {item.title.rendered && (
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-[rgb(52,154,167)] mb-2">
                    {decodeHtml(item.title.rendered)}
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
          {!isLoading && !error && !item && (
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold mb-2">Page not found</h1>
              <p className="text-muted-foreground">We couldn't find a page or post at this URL.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
