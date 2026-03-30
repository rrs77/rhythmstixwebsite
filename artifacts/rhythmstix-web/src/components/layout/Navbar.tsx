import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Menu, X, User, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "About", href: "/page/about" },
  { label: "Resources", href: "https://app.rhythmstix.co.uk/", external: true },
  { label: "Learning Portal", href: "https://app.rhythmstix.co.uk/", external: true },
  { label: "Community", href: "/community" },
  { label: "Blog", href: "/blog", highlight: true },
  { label: "Shop", href: "/shop" },
  { label: "Contact Us", href: "/contact" },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

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
        <div className="flex items-center">
          <Link href="/" className="flex items-center group mr-8">
            <span className="font-extrabold text-xl tracking-tight">
              <span className="text-[rgb(52,154,167)]">r</span><span className="text-foreground">hythm</span><span className="text-[rgb(52,154,167)]">tix</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 mr-auto">
            {NAV_LINKS.map((link) => {
              const cls = `text-sm font-medium transition-colors ${(link as any).highlight ? "text-[rgb(52,154,167)] font-semibold" : "text-muted-foreground hover:text-primary"}`;
              return (link as any).external ? (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className={cls}>
                  {link.label}
                </Link>
              );
            })}

            <div className="ml-3 pl-3 border-l border-border">
              {isAuthenticated ? (
                <Link href="/account" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-[rgb(52,154,167)] transition-colors" title="Account">
                  <div className="w-8 h-8 rounded-full bg-[rgb(52,154,167)]/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-[rgb(52,154,167)]" />
                  </div>
                  {user?.firstName || "Account"}
                </Link>
              ) : (
                <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-[rgb(52,154,167)] transition-colors" title="Login">
                  <div className="w-8 h-8 rounded-full bg-[rgb(52,154,167)]/10 flex items-center justify-center">
                    <LogIn className="w-4 h-4 text-[rgb(52,154,167)]" />
                  </div>
                  Login
                </Link>
              )}
            </div>
          </nav>

          <button
            className="md:hidden ml-auto p-2 text-muted-foreground hover:text-foreground"
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
              {NAV_LINKS.map((link) =>
                (link as any).external ? (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-base font-medium text-foreground py-3 px-2"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-base font-medium text-foreground py-3 px-2"
                  >
                    {link.label}
                  </Link>
                )
              )}

              {isAuthenticated ? (
                <Button className="mt-4 w-full" asChild>
                  <Link
                    href="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4 mr-1.5" />
                    {user?.firstName || "Account"}
                  </Link>
                </Button>
              ) : (
                <Button className="mt-4 w-full" asChild>
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <LogIn className="w-4 h-4 mr-1.5" />
                    Login
                  </Link>
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
