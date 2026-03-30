import { motion } from "framer-motion";
import { 
  CalendarDays, 
  TrendingUp, 
  GraduationCap,
  Palette,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";

const PRODUCTS = [
  {
    id: "ccdesigner",
    title: "CCDesigner",
    description: "Creative Curriculum Designer — plan, organise, and reuse curriculum content across EYFS, KS1, and KS2.",
    icon: Palette,
    color: "from-[#3a9ca5] to-[#2d8890]",
    link: "/ccdesigner",
    cta: "Learn More"
  },
  {
    id: "perifeedback",
    title: "PeriFeedback",
    description: "Feedback and scheduling solution for peripatetic teachers and school departments.",
    icon: CalendarDays,
    color: "from-[#4cb5bd] to-[#3a9ca5]",
    link: "/perifeedback",
    cta: "Learn More"
  },
  {
    id: "progresspath",
    title: "ProgressPath",
    description: "Visualise student journeys. Map out clear progression routes from early years to advanced levels.",
    icon: TrendingUp,
    color: "from-[#2d8890] to-[#3a9ca5]",
    link: "/progresspath",
    cta: "Learn More"
  },
  {
    id: "elearning",
    title: "E-Learning",
    description: "Comprehensive digital courses, resources, and interactive modules for modern education.",
    icon: GraduationCap,
    color: "from-[#3a9ca5] to-[#4cb5bd]",
    link: "/elearning",
    cta: "Learn More"
  }
];

export function ProductGrid() {
  return (
    <section id="products" className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Our Apps & Tools</h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            A cohesive suite of applications designed specifically to make teaching, assessing, and learning easier.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PRODUCTS.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Link
                href={product.link}
                className="group block relative bg-card rounded-2xl p-6 border border-border hover:border-[#3a9ca5]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#3a9ca5]/10 hover:-translate-y-1 h-full"
              >
                <div className={`w-12 h-12 rounded-xl mb-5 flex items-center justify-center bg-gradient-to-br ${product.color} shadow-md`}>
                  <product.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-[#3a9ca5] transition-colors">
                  {product.title}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-5 line-clamp-3">
                  {product.description}
                </p>
                
                <div className="flex items-center text-[#3a9ca5] text-sm font-medium">
                  {product.cta}
                  <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
