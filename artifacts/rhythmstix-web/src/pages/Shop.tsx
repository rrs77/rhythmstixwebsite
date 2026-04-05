import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useGroupedProducts, type ProductFamily } from "@/hooks/use-shop";
import { Loader2, Package, ArrowRight, Music, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EditableText } from "@/components/EditableText";

const FAMILY_ICONS: Record<string, React.ReactNode> = {
  "guide-the-way": <Music className="w-8 h-8 text-[#3a9ca5]/30" />,
  "bandlab-lets-get-started": <BookOpen className="w-8 h-8 text-[#3a9ca5]/30" />,
  "sneaky-creatures": <Sparkles className="w-8 h-8 text-[#3a9ca5]/30" />,
};

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

export default function Shop() {
  const { data: families, isLoading, error } = useGroupedProducts();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
