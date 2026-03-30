import { motion } from "framer-motion";
import { 
  ClipboardCheck, 
  CalendarDays, 
  TrendingUp, 
  Smartphone, 
  GraduationCap,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const PRODUCTS = [
  {
    id: "assessify",
    title: "Assessify",
    description: "Streamlined assessment tools tailored for performing arts. Evaluate, record, and provide feedback instantly.",
    icon: ClipboardCheck,
    color: "from-blue-500 to-cyan-400",
    link: "/page/assessify",
    cta: "Open Assessify"
  },
  {
    id: "periplanner",
    title: "PeriPlanner",
    description: "The ultimate timetabling and scheduling solution for peripatetic teachers and school departments.",
    icon: CalendarDays,
    color: "from-purple-500 to-indigo-400",
    link: "/page/periplanner",
    cta: "Learn More"
  },
  {
    id: "progresspath",
    title: "ProgressPath",
    description: "Visualize student journeys. Map out clear progression routes from early years to advanced levels.",
    icon: TrendingUp,
    color: "from-emerald-500 to-teal-400",
    link: "/page/learning-platform",
    cta: "Learn More"
  },
  {
    id: "app",
    title: "Rhythmstix App",
    description: "Interactive tools, backing tracks, and resources directly in your pocket for teaching on the go.",
    icon: Smartphone,
    color: "from-orange-500 to-pink-400",
    link: "/page/learning-platform",
    cta: "Get the App"
  },
  {
    id: "elearning",
    title: "E-Learning Resources",
    description: "Comprehensive digital courses, sheet music, and interactive modules for modern music education.",
    icon: GraduationCap,
    color: "from-blue-600 to-indigo-500",
    link: "/blog",
    cta: "Browse Resources",
    wide: true
  }
];

export function ProductGrid() {
  return (
    <section id="products" className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Apps & Tools</h2>
          <p className="text-muted-foreground text-lg max-w-2xl">
            A cohesive suite of applications designed specifically to make teaching, assessing, and learning performing arts easier.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {PRODUCTS.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`group relative bg-card rounded-[16px] p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 ${
                product.wide ? 'md:col-span-2 lg:col-span-2' : ''
              }`}
            >
              <div className={`w-14 h-14 rounded-xl mb-6 flex items-center justify-center bg-gradient-to-br ${product.color} shadow-md`}>
                <product.icon className="w-7 h-7 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                {product.title}
              </h3>
              
              <p className="text-muted-foreground mb-8 line-clamp-3">
                {product.description}
              </p>
              
              <div className="mt-auto pt-4 flex items-center">
                <Button variant="ghost" className="p-0 hover:bg-transparent group/btn text-primary hover:text-accent" asChild>
                  <Link href={product.link}>
                    {product.cta}
                    <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
