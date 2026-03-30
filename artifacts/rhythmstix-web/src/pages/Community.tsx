import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Community() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Community Forum</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Join the Rhythmstix community — share ideas, ask questions, and connect with other educators.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl overflow-hidden border border-border bg-card"
          >
            <iframe
              src="https://www.rhythmstix.co.uk/community/"
              title="Rhythmstix Community Forum"
              className="w-full border-0"
              style={{ minHeight: "800px" }}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-center"
          >
            <p className="text-muted-foreground text-sm mb-3">
              Having trouble viewing the forum? Open it directly on the Rhythmstix website.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://www.rhythmstix.co.uk/community/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Forum in New Tab
                <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
              </a>
            </Button>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
