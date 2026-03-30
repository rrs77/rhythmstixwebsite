import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const RESOURCES = [
  {
    title: "Sneaky Creatures",
    subtitle: "Free Early Years Song",
    description: "A fun, interactive song designed to help early years students develop rhythm, coordination, and listening skills. Includes full backing tracks and teaching notes.",
    image: "images/sneaky-creatures.png",
    tag: "Free Resource",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
  },
  {
    title: "Guide The Way",
    subtitle: "Nativity for Years 3-6",
    description: "A complete, modern nativity package perfect for Key Stage 2. Includes script, sheet music, performance tracks, and staging suggestions.",
    image: "images/guide-the-way.png",
    tag: "Premium Package",
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30"
  }
];

export function SchoolsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Decorative bg element */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Music For Schools</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            High-quality, ready-to-use musical resources for your classroom. From early years development to full stage productions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {RESOURCES.map((resource, idx) => (
            <motion.div
              key={resource.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.2 }}
              className="group bg-card rounded-3xl overflow-hidden border border-border/50 hover:border-primary/40 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10 flex flex-col"
            >
              <div className="relative aspect-[16/9] overflow-hidden">
                <img 
                  src={`${import.meta.env.BASE_URL}${resource.image}`}
                  alt={resource.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full border backdrop-blur-md ${resource.color}`}>
                    {resource.tag}
                  </span>
                </div>
              </div>
              
              <div className="p-8 flex flex-col flex-grow">
                <h4 className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">{resource.subtitle}</h4>
                <h3 className="text-2xl font-bold mb-4 text-foreground">{resource.title}</h3>
                <p className="text-muted-foreground mb-8 flex-grow">
                  {resource.description}
                </p>
                <Button variant="outline" className="w-full sm:w-auto self-start group/btn">
                  <Download className="w-4 h-4 mr-2" />
                  Download Resource
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
