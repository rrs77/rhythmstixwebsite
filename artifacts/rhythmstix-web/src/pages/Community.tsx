import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWPPage } from "@/hooks/use-wp";
import { decodeHtml, rewriteWPLinks } from "@/lib/wordpress";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Community() {
  const { data: page, isLoading, error } = useWPPage("community");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[rgb(52,154,167)]" />
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Unable to load this page. Please try again later.</p>
            </div>
          )}

          {page && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {page.title.rendered && (
                <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[rgb(52,154,167)]">
                  {decodeHtml(page.title.rendered)}
                </h1>
              )}

              <div
                className="wp-content prose prose-lg max-w-none mb-12"
                dangerouslySetInnerHTML={{ __html: rewriteWPLinks(page.content.rendered) }}
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-[#3a9ca5]/5 to-[#4cb5bd]/10 rounded-2xl p-8 md:p-12 border border-[#3a9ca5]/20 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-[rgb(52,154,167)]">Join the Community</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              The Rhythmstix community is a place for educators to share ideas, collaborate, and grow together. Get in touch to find out more about joining.
            </p>
            <Button size="lg" className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
              <Link href="/contact">
                Get In Touch
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
