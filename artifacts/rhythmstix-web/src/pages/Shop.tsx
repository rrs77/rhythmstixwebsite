import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useShopProducts, useShopCategories, createOrder, type ShopProduct } from "@/hooks/use-shop";
import { rewriteWPLinks } from "@/lib/wordpress";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Package, Palette, ClipboardCheck, CalendarDays, GraduationCap, TrendingUp, ArrowRight, ShoppingCart, Download, X, CheckCircle2, ExternalLink, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { EditableText } from "@/components/EditableText";

const STANDALONE_APPS = [
  {
    id: "ccdesigner",
    title: "CCDesigner",
    subtitle: "Creative Curriculum Designer",
    description: "Plan, organise, and reuse curriculum content across EYFS, KS1, and KS2. A single place to design, store, and share lessons and activities.",
    icon: Palette,
    color: "from-[#3a9ca5] to-[#2d8890]",
    link: "https://www.ccdesigner.co.uk/",
    external: true,
    badge: "Web App",
    internalPage: "/ccdesigner",
  },
  {
    id: "assessify",
    title: "Assessify",
    subtitle: "Assessment Transformed",
    description: "Fair and personalised assessment for any subject. AI-powered reports, customisable rubrics, and detailed analytics — built for teachers.",
    icon: ClipboardCheck,
    color: "from-[#2d8890] to-[#3a9ca5]",
    link: "https://assessify.rhythmstix.co.uk/",
    external: true,
    badge: "Web App",
    internalPage: "/assessify",
  },
  {
    id: "perifeedback",
    title: "PeriFeedback",
    subtitle: "Feedback & Scheduling",
    description: "Purpose-built for peripatetic teachers. Log lesson feedback, manage schedules across schools, and keep everyone connected.",
    icon: CalendarDays,
    color: "from-[#4cb5bd] to-[#3a9ca5]",
    link: "http://perifeedback.co.uk/",
    external: true,
    badge: "Web App",
    internalPage: "/perifeedback",
  },
  {
    id: "progresspath",
    title: "ProgressPath",
    subtitle: "Visualise Learning Journeys",
    description: "Visualise student journeys and map clear progression routes. Track development from early years to advanced levels.",
    icon: TrendingUp,
    color: "from-[#2d8890] to-[#4cb5bd]",
    link: "/progresspath",
    external: false,
    badge: "Coming Soon",
    internalPage: "/progresspath",
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  assessify: "Assessify",
  gtw: "Guide The Way",
  getstarted: "BandLab",
  uncategorised: "Other",
};

type ShopSection = "all" | "apps" | "resources";

function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num) || num === 0) return "Free";
  return `£${num.toFixed(2)}`;
}

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

function ProductModal({ product, onClose }: { product: ShopProduct; onClose: () => void }) {
  const hasImage = product.images.length > 0;
  const priceDisplay = formatPrice(product.price);
  const isFree = priceDisplay === "Free";
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{ downloads: { name: string; url: string }[]; paymentUrl: string | null } | null>(null);
  const [orderError, setOrderError] = useState("");

  const handlePurchase = async () => {
    if (!user) {
      onClose();
      navigate("/login?redirect=/shop");
      return;
    }

    setOrdering(true);
    setOrderError("");
    try {
      const result = await createOrder(product.id);
      setOrderSuccess({
        downloads: result.downloads,
        paymentUrl: result.paymentUrl,
      });
    } catch (err: any) {
      if (err.message === "LOGIN_REQUIRED") {
        onClose();
        navigate("/login?redirect=/shop");
        return;
      }
      setOrderError(err.message || "Something went wrong. Please try again.");
    } finally {
      setOrdering(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card rounded-2xl overflow-hidden border border-border shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {hasImage && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <img
              src={product.images[0].src}
              alt={product.images[0].alt || product.name}
              className="w-full h-full object-cover"
            />
            <button
              onClick={onClose}
              className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {!hasImage && (
          <div className="relative">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground flex items-center justify-center transition-colors z-10"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="p-6">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h3 className="text-xl font-bold text-foreground">{product.name}</h3>
            <span className={cn(
              "shrink-0 text-sm font-bold px-3 py-1 rounded-full",
              isFree ? "bg-green-100 text-green-700" : "bg-[#3a9ca5]/10 text-[#3a9ca5]"
            )}>
              {priceDisplay}
            </span>
          </div>

          {product.description && (
            <div
              className="text-sm text-muted-foreground leading-relaxed mb-5 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: rewriteWPLinks(product.description) }}
            />
          )}

          {orderError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {orderError}
            </div>
          )}

          {orderSuccess ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Order placed successfully!</span>
              </div>
              {orderSuccess.downloads.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Your downloads:</p>
                  {orderSuccess.downloads.map((d, i) => (
                    <a
                      key={i}
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm font-medium text-green-800 hover:bg-green-100 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      {d.name}
                    </a>
                  ))}
                </div>
              )}
              {!isFree && orderSuccess.paymentUrl && (
                <a
                  href={orderSuccess.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white">
                    Complete Payment
                  </Button>
                </a>
              )}
              <Button variant="outline" className="w-full" onClick={onClose}>
                Close
              </Button>
            </div>
          ) : (
            <Button
              className="w-full bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white"
              onClick={handlePurchase}
              disabled={ordering}
            >
              {ordering ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : !user ? (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Log in to {isFree ? "Download" : "Purchase"}
                </>
              ) : isFree ? (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Free
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Purchase — {priceDisplay}
                </>
              )}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResourceCard({ product, onClick }: { product: ShopProduct; onClick: () => void }) {
  const hasImage = product.images.length > 0;
  const priceDisplay = formatPrice(product.price);
  const isFree = priceDisplay === "Free";

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-card rounded-lg border border-border hover:border-[#3a9ca5]/40 hover:shadow-md hover:shadow-[#3a9ca5]/5 transition-all duration-300 overflow-hidden flex h-full text-left cursor-pointer"
    >
      {hasImage ? (
        <div className="w-20 h-20 shrink-0 bg-secondary overflow-hidden">
          <img
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="w-20 h-20 shrink-0 bg-gradient-to-br from-[#3a9ca5]/8 to-[#3a9ca5]/3 flex items-center justify-center">
          <Package className="w-4 h-4 text-[#3a9ca5]/25" />
        </div>
      )}

      <div className="p-2.5 flex flex-col flex-grow min-w-0">
        <div className="flex items-start justify-between gap-1.5 mb-0.5">
          <h3 className="font-semibold text-xs text-foreground group-hover:text-[#3a9ca5] transition-colors line-clamp-1">
            {product.name}
          </h3>
          <span className={cn(
            "shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
            isFree
              ? "bg-green-100 text-green-700"
              : "bg-[#3a9ca5]/10 text-[#3a9ca5]"
          )}>
            {priceDisplay}
          </span>
        </div>

        {product.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2 flex-grow leading-relaxed">
            {stripHtml(product.description)}
          </p>
        )}

        <div className="flex items-center gap-1 text-[10px] font-medium text-[#3a9ca5] mt-1">
          <ShoppingCart className="w-2.5 h-2.5" />
          View Details
        </div>
      </div>
    </motion.button>
  );
}

function AppCard({ app, index }: { app: typeof STANDALONE_APPS[0]; index: number }) {
  const Wrapper = app.external ? "a" : Link;
  const wrapperProps = app.external
    ? { href: app.link, target: "_blank", rel: "noopener noreferrer" }
    : { href: app.internalPage };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06 }}
    >
      <Wrapper
        {...(wrapperProps as any)}
        className="group block bg-card rounded-xl border border-border hover:border-[#3a9ca5]/30 hover:shadow-lg hover:shadow-[#3a9ca5]/5 transition-all duration-300 h-full overflow-hidden"
      >
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center bg-gradient-to-br ${app.color} shadow-sm`}>
              <app.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-bold text-foreground group-hover:text-[#3a9ca5] transition-colors">
                  {app.title}
                </h3>
                <span className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full",
                  app.badge === "Coming Soon"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-[#3a9ca5]/10 text-[#3a9ca5]"
                )}>
                  {app.badge}
                </span>
              </div>
              <p className="text-xs text-[#3a9ca5] font-medium mb-1.5">{app.subtitle}</p>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {app.description}
              </p>
              <div className="flex items-center gap-4">
                <span className="flex items-center text-xs font-medium text-[#3a9ca5]">
                  {app.external ? (
                    <>
                      <ExternalLink className="mr-1 w-3 h-3" />
                      Visit Site
                    </>
                  ) : (
                    <>Learn More</>
                  )}
                  <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </Wrapper>
    </motion.div>
  );
}

export default function Shop() {
  const [activeSection, setActiveSection] = useState<ShopSection>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const { data: products, isLoading, error } = useShopProducts(selectedCategory || undefined);
  const { data: categories } = useShopCategories();

  const visibleCategories = categories?.filter((c) => c.count > 0) || [];
  const visibleProducts = products?.filter(p => p.name !== "Assessify Plan") ?? [];

  const sections: { key: ShopSection; label: string; count?: string }[] = [
    { key: "all", label: "Everything" },
    { key: "apps", label: "Standalone Apps", count: String(STANDALONE_APPS.length) },
    { key: "resources", label: "Teaching Portal Resources", count: isLoading ? "…" : String(visibleProducts.length) },
  ];

  const showApps = activeSection === "all" || activeSection === "apps";
  const showResources = activeSection === "all" || activeSection === "resources";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="mb-10">
            <EditableText
              contentKey="shop.heading"
              fallback="Shop"
              as="h1"
              className="text-4xl font-bold text-foreground mb-3"
            />
            <EditableText
              contentKey="shop.subheading"
              fallback="Apps, resources, and tools for music education."
              as="p"
              className="text-lg text-muted-foreground mb-8"
            />

            <div className="flex flex-wrap gap-2">
              {sections.map((s) => (
                <button
                  key={s.key}
                  onClick={() => { setActiveSection(s.key); setSelectedCategory(""); }}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    activeSection === s.key
                      ? "bg-[#3a9ca5] text-white shadow-sm"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {s.label}
                  {s.count && (
                    <span className="ml-1.5 opacity-70">({s.count})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {showApps && (
            <section className="mb-16">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#3a9ca5]/10">
                  <Layers className="w-4 h-4 text-[#3a9ca5]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Standalone Apps</h2>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 ml-11">
                Purpose-built tools for teaching, assessment, and curriculum planning.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {STANDALONE_APPS.map((app, index) => (
                  <AppCard key={app.id} app={app} index={index} />
                ))}
              </div>

              <div className="mt-4 ml-11">
                <Link
                  href="/elearning"
                  className="group inline-flex items-center gap-3 bg-card rounded-xl border border-border hover:border-[#3a9ca5]/30 hover:shadow-lg hover:shadow-[#3a9ca5]/5 transition-all duration-300 p-4 pr-6"
                >
                  <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-gradient-to-br from-[#3a9ca5] to-[#4cb5bd] shadow-sm">
                    <GraduationCap className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground group-hover:text-[#3a9ca5] transition-colors">
                      Teaching Portal
                    </h3>
                    <p className="text-xs text-muted-foreground">Digital courses, resources, and interactive modules</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#3a9ca5] ml-auto group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </section>
          )}

          {showResources && (
            <section>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#3a9ca5]/10">
                  <Package className="w-4 h-4 text-[#3a9ca5]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Teaching Portal Resources</h2>
                </div>
              </div>
              <p className="text-muted-foreground mb-6 ml-11">
                Downloadable resources, lesson packs, and licences for the Teaching Portal.
              </p>

              {visibleCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6 ml-11">
                  <button
                    onClick={() => setSelectedCategory("")}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                      !selectedCategory
                        ? "bg-[#3a9ca5] text-white shadow-sm"
                        : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                    )}
                  >
                    All
                  </button>
                  {visibleCategories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(String(cat.id))}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                        selectedCategory === String(cat.id)
                          ? "bg-[#3a9ca5] text-white shadow-sm"
                          : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                      )}
                    >
                      {CATEGORY_LABELS[cat.slug] || cat.name}
                      <span className="ml-1 opacity-60">({cat.count})</span>
                    </button>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-[#3a9ca5]" />
                </div>
              )}

              {error && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground mb-4">Unable to load products. Please try again later.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                  </Button>
                </div>
              )}

              {!isLoading && !error && visibleProducts.length === 0 && (
                <div className="text-center py-16">
                  <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">No products found in this category.</p>
                </div>
              )}

              {visibleProducts.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 ml-11">
                  {visibleProducts.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="h-full"
                    >
                      <ResourceCard product={product} onClick={() => setSelectedProduct(product)} />
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          )}

          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Can't find what you're looking for? Get in touch and we'll help.
            </p>
            <Button className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
              <Link href="/contact">
                Contact Us
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />

      <AnimatePresence>
        {selectedProduct && (
          <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
