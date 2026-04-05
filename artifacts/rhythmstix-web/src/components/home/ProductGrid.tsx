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
    color: "from-[#3a9ca5] to-[#2d8890]",
    link: "https://www.ccdesigner.co.uk/",
    external: true,
  },
  {
    id: "assessify",
    title: "Assessify",
    description: "AI-powered reports, customisable rubrics, and detailed analytics for any subject.",
    icon: ClipboardCheck,
    color: "from-[#2d8890] to-[#3a9ca5]",
    link: "https://assessify.rhythmstix.co.uk/",
    external: true,
  },
  {
    id: "perifeedback",
    title: "PeriFeedback",
    description: "Feedback and scheduling for peripatetic teachers and school departments.",
    icon: CalendarDays,
    color: "from-[#4cb5bd] to-[#3a9ca5]",
    link: "http://perifeedback.co.uk/",
    external: true,
  },
  {
    id: "progresspath",
    title: "ProgressPath",
    description: "Visualise student journeys and map clear progression routes.",
    icon: TrendingUp,
    color: "from-[#2d8890] to-[#3a9ca5]",
    link: "/progresspath",
  },
  {
    id: "elearning",
    title: "Teaching Portal",
    description: "Digital courses, resources, and interactive modules for modern education.",
    icon: GraduationCap,
    color: "from-[#3a9ca5] to-[#4cb5bd]",
    link: "https://app.rhythmstix.co.uk/",
    external: true,
  },
];

function ProductCard({ product, index }: { product: typeof PRODUCTS[number]; index: number }) {
  const desc = useContentValue(`product.${product.id}.desc`, product.description);
  const Wrapper = product.external ? "a" : Link;
  const wrapperProps = product.external
    ? { href: product.link, target: "_blank", rel: "noopener noreferrer" }
    : { href: product.link };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
    >
      <Wrapper
        {...(wrapperProps as any)}
        className="group block bg-card rounded-xl p-4 border border-border hover:border-[#3a9ca5]/30 hover:shadow-lg hover:shadow-[#3a9ca5]/8 hover:-translate-y-0.5 transition-all duration-200 h-full"
      >
        <div className={`w-9 h-9 rounded-lg mb-3 flex items-center justify-center bg-gradient-to-br ${product.color} shadow-sm`}>
          <product.icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-sm font-bold mb-1 text-foreground group-hover:text-[#3a9ca5] transition-colors">
          {product.title}
        </h3>
        <EditableText
          contentKey={`product.${product.id}.desc`}
          fallback={product.description}
          as="p"
          className="text-muted-foreground text-xs leading-relaxed mb-3 line-clamp-2"
        />
        <div className="flex items-center text-[#3a9ca5] text-xs font-medium">
          {product.external ? "Visit Site" : "Learn More"}
          <ArrowRight className="ml-1 w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </Wrapper>
    </motion.div>
  );
}

export function ProductGrid() {
  return (
    <section id="products" className="pt-2 pb-6 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4"
        >
          <div className="flex items-center gap-3 mb-0.5">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-[#3a9ca5] to-[#4cb5bd]" />
            <EditableText
              contentKey="products.heading"
              fallback="Our Apps & Tools"
              as="h2"
              className="text-lg md:text-xl font-bold"
            />
          </div>
          <EditableText
            contentKey="products.subheading"
            fallback="Choose a tool to get started."
            as="p"
            className="text-muted-foreground text-sm ml-4"
          />
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRODUCTS.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
