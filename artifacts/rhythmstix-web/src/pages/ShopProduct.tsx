import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useGroupedProducts, type ShopProduct as Product } from "@/hooks/use-shop";
import { useBasket } from "@/contexts/BasketContext";
import { ArrowLeft, Loader2, Package, Download, ShoppingCart, Check, Music, BookOpen, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const FAMILY_ICONS: Record<string, React.ReactNode> = {
  "guide-the-way": <Music className="w-6 h-6 text-white" />,
  "bandlab-lets-get-started": <BookOpen className="w-6 h-6 text-white" />,
  "sneaky-creatures": <Sparkles className="w-6 h-6 text-white" />,
};

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num) || num === 0) return "Free";
  return `£${num.toFixed(2)}`;
}

function ProductCard({ product, index, familyId }: { product: Product; index: number; familyId: string }) {
  const { add, items } = useBasket();
  const [, setLocation] = useLocation();
  const [justAdded, setJustAdded] = useState(false);
  const isFree = parseFloat(product.price) === 0 || !product.price;
  const desc = stripHtml(product.description);
  const inBasket = items.some((i) => i.productId === product.id);

  const handleAdd = () => {
    add({
      productId: product.id,
      name: product.name,
      price: parseFloat(product.price) || 0,
      image: product.images[0]?.src || null,
      slug: product.slug,
      familyId,
      downloadable: product.downloadable,
    });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
  };

  const handleBuyNow = () => {
    if (!inBasket) handleAdd();
    setLocation("/checkout");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-card rounded-xl border border-border hover:border-[#3a9ca5]/20 transition-all overflow-hidden"
    >
      {product.images.length > 0 && (
        <div className="aspect-[16/9] bg-secondary overflow-hidden">
          <img
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-bold text-foreground">{product.name}</h3>
          <span className={cn(
            "shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap",
            isFree ? "bg-green-100 text-green-700" : "bg-[#3a9ca5]/10 text-[#3a9ca5]"
          )}>
            {formatPrice(product.price)}
          </span>
        </div>

        {desc && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-4">
            {desc}
          </p>
        )}

        <div className="flex items-center gap-2 flex-wrap">
          {product.downloadable && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
              <Download className="w-3 h-3" />
              Digital download
            </span>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <Button
            className="w-full bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white"
            onClick={handleAdd}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Added to basket
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                {inBasket ? "Add another" : isFree ? "Add to basket" : "Add to basket"}
              </>
            )}
          </Button>
          <Button
            variant="outline"
            className="w-full border-[#3a9ca5]/30 text-[#3a9ca5] hover:bg-[#3a9ca5]/5 hover:text-[#3a9ca5]"
            onClick={handleBuyNow}
          >
            {isFree ? "Get it now" : "Buy now"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export default function ShopProduct() {
  const { familyId } = useParams<{ familyId: string }>();
  const { data: families, isLoading } = useGroupedProducts();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [familyId]);

  const family = families?.find((f) => f.id === familyId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3a9ca5]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!family) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-12">
          <div className="container mx-auto px-4 text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
            <p className="text-muted-foreground mb-6">This product family doesn't exist.</p>
            <Button asChild>
              <Link href="/shop">Back to Shop</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Button variant="ghost" className="mb-6 text-muted-foreground" asChild>
            <Link href="/shop">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Shop
            </Link>
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start gap-4 mb-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#3a9ca5] to-[#4cb5bd] shadow-md shrink-0">
                {FAMILY_ICONS[family.id] || <Package className="w-6 h-6 text-white" />}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{family.title}</h1>
                <span className={cn(
                  "inline-block mt-1 text-sm font-bold px-3 py-0.5 rounded-full",
                  family.priceLabel === "Free" ? "bg-green-100 text-green-700" : "bg-[#3a9ca5]/10 text-[#3a9ca5]"
                )}>
                  {family.priceLabel}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-2xl">
              {family.description}
            </p>
          </motion.div>

          {family.image && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8 rounded-xl overflow-hidden border border-border"
            >
              <img
                src={family.image.src}
                alt={family.image.alt || family.title}
                className="w-full h-auto max-h-80 object-cover"
              />
            </motion.div>
          )}

          {family.products.length > 0 ? (
            <>
              <h2 className="text-lg font-bold text-foreground mb-4">
                {family.products.length === 1 ? "Product" : "Available Options"}
              </h2>
              <div className={cn(
                "grid gap-5 mb-8",
                family.products.length === 1
                  ? "grid-cols-1 max-w-md"
                  : "grid-cols-1 sm:grid-cols-2"
              )}>
                {family.products.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} familyId={family.id} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No individual products available at this time.</p>
            </div>
          )}

          <div className="mt-8 text-center border-t border-border pt-8">
            <p className="text-sm text-muted-foreground mb-3">
              Need help choosing? Get in touch and we'll help you find the right option.
            </p>
            <Button className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
