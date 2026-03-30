import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const COOKIE_KEY = "rhythmstix_cookie_consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function accept() {
    localStorage.setItem(COOKIE_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(COOKIE_KEY, "declined");
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-[100] p-4"
        >
          <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-xl p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#3a9ca5]/10 flex items-center justify-center shrink-0 mt-0.5">
                <Cookie className="w-5 h-5 text-[#3a9ca5]" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-foreground mb-1">We use cookies</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This website uses cookies to ensure you get the best experience. We use essential cookies for site functionality and optional cookies for analytics.{" "}
                  <Link href="/cookies" className="text-[#3a9ca5] underline underline-offset-2">
                    Learn more
                  </Link>
                </p>
                <div className="flex items-center gap-3">
                  <Button size="sm" className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" onClick={accept}>
                    Accept All
                  </Button>
                  <Button size="sm" variant="outline" onClick={decline}>
                    Essential Only
                  </Button>
                </div>
              </div>
              <button
                onClick={decline}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
