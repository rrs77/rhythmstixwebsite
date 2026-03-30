import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/page/about" },
  { label: "Resources", href: "/resources" },
  { label: "Community", href: "/page/community" },
  { label: "Blog", href: "/blog" },
  { label: "Shop", href: "/shop" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled
          ? "py-2 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm"
          : "py-4 bg-transparent"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-end gap-2.5 group">
            <img
              src={`${import.meta.env.BASE_URL}images/rs-monogram.svg`}
              alt="RS"
              className="h-9 w-9 object-contain transition-all duration-300"
            />
            <span className="font-extrabold text-lg tracking-tight text-foreground leading-none mb-0.5">
              rhythm<span className="text-[#2a9fa8]">stix</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
              >
                {link.label}
              </Link>
            ))}

            <Button variant="glass" size="sm" className="ml-2" asChild>
              <a
                href="https://www.rhythmstix.co.uk/my-account/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Login
              </a>
            </Button>
          </nav>

          <button
            className="md:hidden p-2 text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card/98 backdrop-blur-xl border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-6 flex flex-col gap-2">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block text-base font-medium text-foreground py-3 px-2"
                >
                  {link.label}
                </Link>
              ))}

              <Button className="mt-4 w-full" asChild>
                <a
                  href="https://www.rhythmstix.co.uk/my-account/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </a>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
