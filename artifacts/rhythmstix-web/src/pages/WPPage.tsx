import { useParams } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWPPage } from "@/hooks/use-wp";
import { decodeHtml } from "@/lib/wordpress";
import { Loader2 } from "lucide-react";

export default function WPPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: page, isLoading, error } = useWPPage(slug || "");

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
                <h1 className="text-4xl font-bold mb-8 text-foreground">
                  {decodeHtml(page.title.rendered)}
                </h1>
              )}
              <div
                className="wp-content prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content.rendered }}
              />
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
