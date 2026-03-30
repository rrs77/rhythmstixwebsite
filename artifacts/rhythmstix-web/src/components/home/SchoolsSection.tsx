import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const RESOURCES = [
  {
    title: "Sneaky Creatures",
    subtitle: "Free Early Years Song",
    description: "A fun, interactive song for early years students to develop rhythm, coordination, and listening skills.",
    image: "images/sneaky-creatures.png",
    tag: "Free Resource",
    tagColor: "bg-emerald-500 text-white",
    link: "https://www.rhythmstix.co.uk/sneaky-creatures/"
  },
  {
    title: "Guide The Way",
    subtitle: "Nativity for Years 3–6",
    description: "A complete, modern nativity package for Key Stage 2 with script, sheet music, and performance tracks.",
    image: "images/guide-the-way.png",
    tag: "Premium Package",
    tagColor: "bg-[#0e9aa7] text-white",
    link: "https://www.rhythmstix.co.uk/guide-the-way/"
  }
];

export function SchoolsSection() {
  return (
    <section className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Music For Schools</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            High-quality, ready-to-use musical resources for your classroom.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {RESOURCES.map((resource, idx) => (
            <motion.a
              key={resource.title}
              href={resource.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-[#0e9aa7]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#0e9aa7]/10 flex flex-col"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={resource.image.startsWith("http") ? resource.image : `${import.meta.env.BASE_URL}${resource.image}`}
                  alt={resource.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${resource.tagColor}`}>
                    {resource.tag}
                  </span>
                </div>
              </div>

              <div className="p-5">
                <p className="text-xs font-semibold text-[#0e9aa7] mb-1 uppercase tracking-wider">{resource.subtitle}</p>
                <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-[#0e9aa7] transition-colors">{resource.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {resource.description}
                </p>
                <span className="inline-flex items-center text-sm font-medium text-[#0e9aa7]">
                  View Resource
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                </span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  );
}
