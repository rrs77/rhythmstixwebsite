import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, User, LogIn, ShoppingCart, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useBasket } from "@/contexts/BasketContext";
import { EditableText } from "@/components/EditableText";
import { resolveInternal } from "@/lib/wp-link";
import { PortalModal } from "@/components/PortalModal";
import { useGroupedProducts } from "@/hooks/use-shop";

function isPortalLink(label: string, href: string): boolean {
  return label.trim().toLowerCase() === "portal" && /^https?:\/\//i.test(href);
}

interface NavLink {
  id: number;
  label: string;
  href: string;
  group: string;
  sortOrder: number;
  visible?: boolean;
}

const FALLBACK_LINKS: Pick<NavLink, "label" | "href">[] = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Portal", href: "https://app.rhythmstix.co.uk/" },
  { label: "Community", href: "/community" },
  { label: "Shop", href: "/shop" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
];

function isActive(linkHref: string, pathname: string): boolean {
  if (linkHref === "/") return pathname === "/";
  return pathname.startsWith(linkHref);
}

function isShopLink(label: string, href: string): boolean {
  const internal = resolveInternal(href) || href;
  return internal === "/shop" || label.trim().toLowerCase() === "shop";
}

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { count: basketCount } = useBasket();
  const [location] = useLocation();

  const { data: navLinks } = useQuery<NavLink[]>({
    queryKey: ["nav-links"],
    queryFn: async () => {
      const res = await fetch("/api/nav-links");
      if (!res.ok) throw new Error("nav links fetch failed");
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
    staleTime: 60_000,
  });

  const mainLinks = (navLinks ?? []).filter((l) => l.group === "main");
  const visibleMain = mainLinks.filter((l) => l.visible !== false);
  const links: Pick<NavLink, "label" | "href">[] = mainLinks.length > 0 ? visibleMain : FALLBACK_LINKS;

  const { data: families } = useGroupedProducts();
  const shopCategories = (families ?? []).filter((f) => !!f.categorySlug);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className={cn(
          "transition-all duration-300",
          isScrolled
            ? "py-2 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm"
            : "py-3 bg-background/70 backdrop-blur-sm"
        )}
      >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="sr-only" aria-label="Rhythmstix home">
            Rhythmstix home
          </Link>

          <nav className="hidden md:flex items-center gap-6 mr-auto">
            {links.map((link) => {
              const internal = resolveInternal(link.href);
              const ext = !internal && /^https?:\/\//i.test(link.href);
              const target = internal || link.href;
              const active = !ext && isActive(target, location);
              const cls = cn(
                "text-sm font-medium transition-colors",
                active ? "text-[#3a9ca5] font-semibold" : "text-muted-foreground hover:text-[#3a9ca5]"
              );
              if (isPortalLink(link.label, link.href)) {
                return (
                  <PortalModal key={link.label} url={link.href} title={link.label}>
                    {(open) => (
                      <button type="button" onClick={open} className={cls}>
                        {link.label}
                      </button>
                    )}
                  </PortalModal>
                );
              }
              if (!ext && isShopLink(link.label, link.href) && shopCategories.length > 0) {
                return (
                  <div key={link.label} className="flex items-center gap-1">
                    <Link href={target} className={cls}>
                      {link.label}
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        aria-label={`${link.label} categories`}
                        className={cn(
                          "p-1 rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#3a9ca5]/40",
                          active ? "text-[#3a9ca5]" : "text-muted-foreground hover:text-[#3a9ca5]"
                        )}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="min-w-[200px]">
                        {shopCategories.map((f) => (
                          <DropdownMenuItem key={f.id} asChild>
                            <Link href={`/shop?category=${encodeURIComponent(f.categorySlug as string)}`}>
                              {f.title}
                            </Link>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              }
              return ext ? (
                <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={cls}>
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} href={target} className={cls}>
                  {link.label}
                </Link>
              );
            })}

            <Link
              href="/basket"
              className="relative flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-[rgb(52,154,167)] transition-colors"
              title="Basket"
            >
              <div className="w-7 h-7 rounded-full bg-[rgb(52,154,167)]/10 flex items-center justify-center relative">
                <ShoppingCart className="w-3.5 h-3.5 text-[rgb(52,154,167)]" />
                {basketCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#3a9ca5] text-white text-[10px] font-bold flex items-center justify-center">
                    {basketCount > 99 ? "99+" : basketCount}
                  </span>
                )}
              </div>
              Basket
            </Link>

            <div className="ml-1 pl-3 border-l border-border">
              {isAuthenticated ? (
                <Link href="/account" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-[rgb(52,154,167)] transition-colors" title="Account">
                  <div className="w-7 h-7 rounded-full bg-[rgb(52,154,167)]/10 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 text-[rgb(52,154,167)]" />
                  </div>
                  {user?.firstName || "Account"}
                </Link>
              ) : (
                <Link href="/login" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-[rgb(52,154,167)] transition-colors" title="Login">
                  <div className="w-7 h-7 rounded-full bg-[rgb(52,154,167)]/10 flex items-center justify-center">
                    <LogIn className="w-3.5 h-3.5 text-[rgb(52,154,167)]" />
                  </div>
                  Login
                </Link>
              )}
            </div>
          </nav>

          <Link
            href="/basket"
            className="md:hidden ml-auto relative p-2 text-muted-foreground hover:text-[rgb(52,154,167)]"
            aria-label="Basket"
          >
            <ShoppingCart className="w-5 h-5" />
            {basketCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#3a9ca5] text-white text-[10px] font-bold flex items-center justify-center">
                {basketCount > 9 ? "9+" : basketCount}
              </span>
            )}
          </Link>
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
              {links.map((link) => {
                const internal = resolveInternal(link.href);
                const ext = !internal && /^https?:\/\//i.test(link.href);
                if (isPortalLink(link.label, link.href)) {
                  return (
                    <PortalModal key={link.label} url={link.href} title={link.label}>
                      {(open) => (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            open();
                          }}
                          className="block text-left text-base font-medium text-foreground py-3 px-2"
                        >
                          {link.label}
                        </button>
                      )}
                    </PortalModal>
                  );
                }
                if (!ext && isShopLink(link.label, link.href) && shopCategories.length > 0) {
                  return (
                    <div key={link.label} className="flex flex-col">
                      <Link
                        href={internal || link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block text-base font-medium text-foreground py-3 px-2"
                      >
                        {link.label}
                      </Link>
                      <div className="flex flex-col pl-4 border-l border-border ml-2">
                        {shopCategories.map((f) => (
                          <Link
                            key={f.id}
                            href={`/shop?category=${encodeURIComponent(f.categorySlug as string)}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block text-sm font-medium text-muted-foreground hover:text-[#3a9ca5] py-2 px-2"
                          >
                            {f.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                }
                return ext ? (
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
                    href={internal || link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block text-base font-medium text-foreground py-3 px-2"
                  >
                    {link.label}
                  </Link>
                );
              })}

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
      </div>
    </header>
  );
}
