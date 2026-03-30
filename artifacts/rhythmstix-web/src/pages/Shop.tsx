import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useShopProducts, useShopCategories, type ShopProduct } from "@/hooks/use-shop";
import { Loader2, ExternalLink, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, string> = {
  assessify: "Assessify",
  gtw: "Guide The Way",
  getstarted: "BandLab",
  uncategorised: "Other",
};

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

function ProductCard({ product }: { product: ShopProduct }) {
  const hasImage = product.images.length > 0;
  const priceDisplay = formatPrice(product.price);
  const isFree = priceDisplay === "Free";

  return (
    <motion.a
      href={product.permalink}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-card rounded-2xl border border-border hover:border-[#0e9aa7]/40 hover:shadow-lg hover:shadow-[#0e9aa7]/5 transition-all duration-300 overflow-hidden flex flex-col"
    >
      {hasImage ? (
        <div className="aspect-[4/3] bg-secondary overflow-hidden">
          <img
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[4/3] bg-gradient-to-br from-[#0e9aa7]/10 to-[#0e9aa7]/5 flex items-center justify-center">
          <Package className="w-12 h-12 text-[#0e9aa7]/30" />
        </div>
      )}

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-foreground group-hover:text-[#0e9aa7] transition-colors line-clamp-2">
            {product.name}
          </h3>
          <span className={cn(
            "shrink-0 text-sm font-bold px-2.5 py-1 rounded-full",
            isFree
              ? "bg-green-100 text-green-700"
              : "bg-[#0e9aa7]/10 text-[#0e9aa7]"
          )}>
            {priceDisplay}
          </span>
        </div>

        {product.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow">
            {stripHtml(product.description)}
          </p>
        )}

        {product.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {product.categories.map((cat) => (
              <span
                key={cat.id}
                className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full"
              >
                {CATEGORY_LABELS[cat.slug] || cat.name}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 text-sm font-medium text-[#0e9aa7] mt-auto">
          <ShoppingCart className="w-4 h-4" />
          {isFree ? "Get it free" : "View in Shop"}
          <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </motion.a>
  );
}

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { data: products, isLoading, error } = useShopProducts(selectedCategory || undefined);
  const { data: categories } = useShopCategories();

  const visibleCategories = categories?.filter((c) => c.count > 0) || [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-10">
            <h1 className="text-4xl font-bold text-foreground mb-3">Shop</h1>
            <p className="text-lg text-muted-foreground">
              Resources, licenses, and tools for music education.
              All purchases are handled securely through our main website.
            </p>
          </div>

          {visibleCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setSelectedCategory("")}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  !selectedCategory
                    ? "bg-[#0e9aa7] text-white shadow-sm"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                )}
              >
                All Products
              </button>
              {visibleCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(String(cat.id))}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    selectedCategory === String(cat.id)
                      ? "bg-[#0e9aa7] text-white shadow-sm"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {CATEGORY_LABELS[cat.slug] || cat.name}
                  <span className="ml-1.5 opacity-60">({cat.count})</span>
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#0e9aa7]" />
            </div>
          )}

          {error && (
            <div className="text-center py-20">
              <p className="text-muted-foreground mb-4">Unable to load products. Please try again later.</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          )}

          {products && products.length === 0 && (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">No products found in this category.</p>
            </div>
          )}

          {products && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product, i) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </div>
          )}

          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Looking for something specific? Visit our full shop for the complete catalogue.
            </p>
            <Button className="bg-[#0e9aa7] hover:bg-[#12b5c4] text-white" asChild>
              <a href="https://www.rhythmstix.co.uk/shop/" target="_blank" rel="noopener noreferrer">
                Visit Full Shop
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
