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
  { label: "Blog", href: "/blog", highlight: true },
  { label: "Community", href: "/community" },
  { label: "Shop", href: "/shop" },
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
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <span className="font-extrabold text-xl tracking-tight">
              <span className="text-[rgb(52,154,167)]">r</span><span className="text-foreground">hythm</span><span className="text-[rgb(52,154,167)]">tix</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`text-sm font-medium transition-colors ${(link as any).highlight ? "text-[rgb(52,154,167)] font-semibold" : "text-muted-foreground hover:text-primary"}`}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated ? (
              <Button variant="glass" size="sm" className="ml-2" asChild>
                <Link href="/account">
                  <User className="w-4 h-4 mr-1.5" />
                  {user?.firstName || "Account"}
                </Link>
              </Button>
            ) : (
              <Button variant="glass" size="sm" className="ml-2" asChild>
                <Link href="/login">
                  <LogIn className="w-4 h-4 mr-1.5" />
                  Login
                </Link>
              </Button>
            )}
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
