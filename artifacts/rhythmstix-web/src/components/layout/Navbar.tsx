import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import {
  Menu,
  X,
  ChevronDown,
  ClipboardCheck,
  Palette,
  CalendarDays,
  TrendingUp,
  Smartphone,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const APPS = [
  {
    title: "Assessify",
    description: "Assessment tools for performing arts",
    icon: ClipboardCheck,
    color: "from-blue-500 to-cyan-400",
    href: "/page/assessify",
  },
  {
    title: "CCDesigner",
    description: "Creative curriculum planning for EYFS–KS2",
    icon: Palette,
    color: "from-rose-500 to-amber-400",
    href: "/ccdesigner",
  },
  {
    title: "PeriFeedback",
    description: "Timetabling for peripatetic teachers",
    icon: CalendarDays,
    color: "from-purple-500 to-indigo-400",
    href: "/page/perifeedback",
  },
  {
    title: "ProgressPath",
    description: "Visual student progression tracking",
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-400",
    href: "/page/learning-platform",
  },
  {
    title: "Rhythmstix App",
    description: "Interactive teaching tools on the go",
    icon: Smartphone,
    color: "from-orange-500 to-pink-400",
    href: "/page/learning-platform",
  },
  {
    title: "E-Learning",
    description: "Digital courses and music resources",
    icon: GraduationCap,
    color: "from-blue-600 to-indigo-500",
    href: "/blog",
  },
];

const NAV_LINKS = [
  { label: "About", href: "/page/about" },
  { label: "Resources", href: "/resources" },
  { label: "Community", href: "/page/community" },
  { label: "Blog", href: "/blog" },
  { label: "Shop", href: "https://www.rhythmstix.co.uk/shop/", external: true },
];

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const openDropdown = () => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setIsDropdownOpen(true);
  };

  const closeDropdown = () => {
    dropdownTimeout.current = setTimeout(() => setIsDropdownOpen(false), 150);
  };

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
          <Link href="/" className="flex items-center gap-2.5 group">
            <img
              src={`${import.meta.env.BASE_URL}images/rs-monogram.svg`}
              alt="RS"
              className="h-9 w-9 object-contain transition-all duration-300"
            />
            <span className="font-extrabold text-lg tracking-tight text-foreground">
              rhythm<span className="text-[#0e9aa7]">stix</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <div
              className="relative"
              onMouseEnter={openDropdown}
              onMouseLeave={closeDropdown}
            >
              <button
                className="flex items-center gap-1 text-sm font-medium transition-colors py-2 text-muted-foreground hover:text-primary"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                Apps
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    isDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[520px] bg-card rounded-2xl border border-border shadow-xl shadow-black/8 p-4 z-50"
                  >
                    <div className="grid grid-cols-2 gap-1">
                      {APPS.map((app) => (
                        <Link
                          key={app.title}
                          href={app.href}
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-start gap-3 p-3 rounded-xl hover:bg-secondary/60 transition-colors group/item"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${app.color} shadow-sm shrink-0`}
                          >
                            <app.icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground group-hover/item:text-primary transition-colors">
                              {app.title}
                            </p>
                            <p className="text-xs text-muted-foreground leading-snug">
                              {app.description}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-border">
                      <Link
                        href="/"
                        onClick={() => setIsDropdownOpen(false)}
                        className="block text-center text-sm text-primary font-medium hover:underline py-1"
                      >
                        View all products
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {NAV_LINKS.map((link) =>
              'external' in link && link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  href={link.href}
                  className="text-sm font-medium transition-colors text-muted-foreground hover:text-primary"
                >
                  {link.label}
                </Link>
              )
            )}

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
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Apps
              </p>
              {APPS.map((app) => (
                <Link
                  key={app.title}
                  href={app.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-secondary/60 transition-colors"
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center bg-gradient-to-br ${app.color} shadow-sm shrink-0`}
                  >
                    <app.icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {app.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.description}
                    </p>
                  </div>
                </Link>
              ))}

              <div className="border-t border-border mt-3 pt-3">
                {NAV_LINKS.map((link) =>
                  'external' in link && link.external ? (
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
              </div>

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
