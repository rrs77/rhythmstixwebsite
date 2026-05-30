import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useGroupedProducts, useCategoryProducts, type ProductFamily, type ShopProduct as Product } from "@/hooks/use-shop";
import { useBasket } from "@/contexts/BasketContext";
import { Loader2, Package, ArrowRight, ArrowLeft, Music, BookOpen, Sparkles, ShoppingCart, Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearch, useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EditableText } from "@/components/EditableText";
import { useMemo, useState } from "react";

const FAMILY_ICONS: Record<string, React.ReactNode> = {
  "guide-the-way": <Music className="w-8 h-8 text-[#3a9ca5]/30" />,
  "bandlab-lets-get-started": <BookOpen className="w-8 h-8 text-[#3a9ca5]/30" />,
  "sneaky-creatures": <Sparkles className="w-8 h-8 text-[#3a9ca5]/30" />,
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

function FamilyCard({ family, index }: { family: ProductFamily; index: number }) {
  return (
    <Link href={`/shop/${family.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08 }}
        className="group bg-card rounded-xl border border-border hover:border-[#3a9ca5]/30 hover:shadow-lg hover:shadow-[#3a9ca5]/8 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col h-full cursor-pointer"
      >
        {family.image ? (
          <div className="aspect-[16/10] bg-secondary overflow-hidden">
            <img
              src={family.image.src}
              alt={family.image.alt || family.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-[16/10] bg-gradient-to-br from-[#3a9ca5]/8 to-[#3a9ca5]/3 flex items-center justify-center">
            {FAMILY_ICONS[family.id] || <Package className="w-8 h-8 text-[#3a9ca5]/20" />}
          </div>
        )}

        <div className="p-5 flex flex-col flex-grow">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-base text-foreground group-hover:text-[#3a9ca5] transition-colors">
              {family.title}
            </h3>
            <span className={cn(
              "shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap",
              family.priceLabel === "Free" ? "bg-green-100 text-green-700" : "bg-[#3a9ca5]/10 text-[#3a9ca5]"
            )}>
              {family.priceLabel}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow leading-relaxed">
            {family.description}
          </p>

          <div className="flex items-center gap-1.5 text-sm font-medium text-[#3a9ca5]">
            View Details
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

function FlatProductCard({ product, index }: { product: Product; index: number }) {
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
      familyId: "",
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
      transition={{ delay: index * 0.05 }}
      className="bg-card rounded-xl border border-border overflow-hidden flex flex-col h-full"
    >
      {product.images[0] ? (
        <div className="aspect-[16/10] bg-secondary overflow-hidden">
          <img
            src={product.images[0].src}
            alt={product.images[0].alt || product.name}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-[16/10] bg-gradient-to-br from-[#3a9ca5]/8 to-[#3a9ca5]/3 flex items-center justify-center">
          <Package className="w-8 h-8 text-[#3a9ca5]/20" />
        </div>
      )}

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-base text-foreground">{product.name}</h3>
          <span className={cn(
            "shrink-0 text-xs font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap",
            isFree ? "bg-green-100 text-green-700" : "bg-[#3a9ca5]/10 text-[#3a9ca5]"
          )}>
            {formatPrice(product.price)}
          </span>
        </div>

        {desc && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3 flex-grow leading-relaxed">
            {desc}
          </p>
        )}

        <div className="flex flex-col gap-2 mt-auto">
          <Button
            onClick={handleAdd}
            variant="outline"
            size="sm"
            className="w-full"
            disabled={inBasket}
          >
            {justAdded || inBasket ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                {inBasket ? "In basket" : "Added"}
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                Add to basket
              </>
            )}
          </Button>
          <Button
            onClick={handleBuyNow}
            size="sm"
            className="w-full bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white"
          >
            {isFree ? (
              <>
                <Download className="w-4 h-4 mr-1.5" />
                Get for free
              </>
            ) : (
              "Buy now"
            )}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function CategoryView({ categorySlug, families }: { categorySlug: string; families: ProductFamily[] | undefined }) {
  const { data: products, isLoading, error } = useCategoryProducts(categorySlug);
  const matchingFamily = families?.find((f) => f.categorySlug === categorySlug);
  const title = matchingFamily?.title || categorySlug;

  return (
    <>
      <div className="mb-6">
        <Link href="/shop">
          <a className="inline-flex items-center gap-1.5 text-sm text-[#3a9ca5] hover:underline mb-3">
            <ArrowLeft className="w-4 h-4" />
            All categories
          </a>
        </Link>
        <h1 className="text-3xl font-bold text-foreground mb-2">{title}</h1>
        {matchingFamily?.description && (
          <p className="text-base text-muted-foreground">{matchingFamily.description}</p>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#3a9ca5]" />
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">Unable to load products. Please try again later.</p>
          <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
        </div>
      )}

      {!isLoading && !error && products && products.length === 0 && (
        <div className="text-center py-20">
          <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <p className="text-muted-foreground">No products available in this category.</p>
        </div>
      )}

      {products && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p, i) => (
            <FlatProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </>
  );
}

export default function Shop() {
  const search = useSearch();
  const categoryParam = useMemo(() => {
    const params = new URLSearchParams(search);
    return params.get("category");
  }, [search]);

  const { data: families, isLoading, error } = useGroupedProducts();

  const categoryNav = useMemo(
    () => (families ?? []).filter((f) => !!f.categorySlug),
    [families],
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {categoryParam ? (
            <CategoryView categorySlug={categoryParam} families={families} />
          ) : (
            <>
              <div className="mb-8">
                <EditableText
                  contentKey="shop.heading"
                  fallback="Shop"
                  as="h1"
                  className="text-3xl font-bold text-foreground mb-2"
                />
                <EditableText
                  contentKey="shop.subheading"
                  fallback="Resources, productions, and downloadable tools to support your teaching."
                  as="p"
                  className="text-base text-muted-foreground"
                />
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Looking for our apps? Head to{" "}
                  <a href="/" className="text-[#3a9ca5] hover:underline">Apps, Tools &amp; Teaching Portal</a>{" "}
                  on the homepage.
                </p>
              </div>

              {categoryNav.length > 0 && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground mr-1">Browse by category:</span>
                  {categoryNav.map((f) => (
                    <Link key={f.id} href={`/shop?category=${encodeURIComponent(f.categorySlug as string)}`}>
                      <a className="inline-flex items-center text-sm font-medium text-[#3a9ca5] bg-[#3a9ca5]/10 hover:bg-[#3a9ca5]/20 transition-colors px-3 py-1 rounded-full">
                        {f.title}
                      </a>
                    </Link>
                  ))}
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#3a9ca5]" />
                </div>
              )}

              {error && (
                <div className="text-center py-20">
                  <p className="text-muted-foreground mb-4">Unable to load products. Please try again later.</p>
                  <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                </div>
              )}

              {!isLoading && !error && families && families.length === 0 && (
                <div className="text-center py-20">
                  <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                  <p className="text-muted-foreground">No products available at this time.</p>
                </div>
              )}

              {families && families.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {families.map((family, i) => (
                    <FamilyCard key={family.id} family={family} index={i} />
                  ))}
                </div>
              )}

              <div className="mt-12 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Looking for something else? Get in touch and we'll help.
                </p>
                <Button className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
                  <Link href="/contact">Contact Us</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
