import { motion } from "framer-motion";
import { 
  CalendarDays, 
  TrendingUp, 
  GraduationCap,
  Palette,
  ClipboardCheck,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import { EditableText } from "@/components/EditableText";
import { useContentValue } from "@/hooks/use-content";

const PRODUCTS = [
  {
    id: "ccdesigner",
    title: "CCDesigner",
    description: "Plan, organise, and reuse curriculum content across EYFS, KS1, and KS2.",
    icon: Palette,
    accentFrom: "#3a9ca5",
    accentTo: "#2d8890",
    link: "/ccdesigner",
  },
  {
    id: "assessify",
    title: "Assessify",
    description: "AI-powered reports, customisable rubrics, and detailed analytics for any subject.",
    icon: ClipboardCheck,
    accentFrom: "#6366f1",
    accentTo: "#4f46e5",
    link: "/assessify",
  },
  {
    id: "perifeedback",
    title: "PeriFeedback",
    description: "Feedback and scheduling for peripatetic teachers and school departments.",
    icon: CalendarDays,
    accentFrom: "#f59e0b",
    accentTo: "#d97706",
    link: "/perifeedback",
  },
  {
    id: "progresspath",
    title: "ProgressPath",
    description: "Visualise student journeys and map clear progression routes.",
    icon: TrendingUp,
    accentFrom: "#10b981",
    accentTo: "#059669",
    link: "/progresspath",
  },
  {
    id: "elearning",
    title: "Teaching Portal",
    description: "Digital courses, resources, and interactive modules for modern education.",
    icon: GraduationCap,
    accentFrom: "#ec4899",
    accentTo: "#db2777",
    link: "/elearning",
  },
];

function ProductCard({ product, index }: { product: typeof PRODUCTS[number]; index: number }) {
  const desc = useContentValue(`product.${product.id}.desc`, product.description);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
    >
      <Link
        href={product.link}
        className="group block bg-card rounded-xl p-5 border border-border hover:border-transparent hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `linear-gradient(135deg, ${product.accentFrom}08, ${product.accentTo}05)`,
          }}
        />
        <div className="relative z-10">
          <div
            className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${product.accentFrom}, ${product.accentTo})`,
            }}
          >
            <product.icon className="w-5 h-5 text-white" />
          </div>
          <h3 className="text-sm font-bold mb-1.5 text-foreground group-hover:text-[#3a9ca5] transition-colors">
            {product.title}
          </h3>
          <EditableText
            contentKey={`product.${product.id}.desc`}
            fallback={product.description}
            as="p"
            className="text-muted-foreground text-xs leading-relaxed mb-3 line-clamp-2"
          />
          <div className="flex items-center text-[#3a9ca5] text-xs font-semibold">
            Learn More
            <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-1 transition-transform duration-200" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ProductGrid() {
  return (
    <section id="products" className="pt-1 pb-8 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-5"
        >
          <div className="flex items-center gap-3 mb-0.5">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#3a9ca5] to-[#4cb5bd]" />
            <EditableText
              contentKey="products.heading"
              fallback="Apps, Tools & Teaching Portal"
              as="h2"
              className="text-lg md:text-xl font-bold"
            />
          </div>
          <EditableText
            contentKey="products.subheading"
            fallback="From curriculum planning to ready-to-teach courses — choose where to start."
            as="p"
            className="text-muted-foreground text-sm ml-4"
          />
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {PRODUCTS.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
