import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const ELEARNING_RESOURCES = [
  {
    title: "BandLab — Let's Get Started",
    subtitle: "Music Production",
    description: "Dive into music production with our comprehensive starter guide for BandLab. Perfect for classroom integration or independent student learning. Master the basics of recording, mixing, and creating loops. Includes step-by-step video tutorials, downloadable lesson plans, and interactive quizzes.",
    image: "images/bandlab-cover.png",
    tag: "E-Learning",
    tagColor: "bg-[#3a9ca5] text-white",
  },
];

type Resource = typeof ELEARNING_RESOURCES[number];

function ResourceModal({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card rounded-2xl overflow-hidden border border-border shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={resource.image.startsWith("http") ? resource.image : `${import.meta.env.BASE_URL}${resource.image}`}
            alt={resource.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${resource.tagColor}`}>
              {resource.tag}
            </span>
          </div>
          <button
            onClick={onClose}
            className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-xs font-semibold text-[#3a9ca5] mb-1 uppercase tracking-wider">{resource.subtitle}</p>
          <h3 className="text-xl font-bold mb-3 text-foreground">{resource.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed mb-5">
            {resource.description}
          </p>
          <Button className="w-full bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
            <Link href="/elearning">
              Learn More
            </Link>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ELearningSection() {
  const [selected, setSelected] = useState<Resource | null>(null);

  return (
    <section id="elearning" className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">E-Learning</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Digital courses and interactive modules for modern music education.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {ELEARNING_RESOURCES.map((resource, idx) => (
            <motion.button
              key={resource.title}
              onClick={() => setSelected(resource)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group bg-card rounded-xl overflow-hidden border border-border hover:border-[#3a9ca5]/40 transition-all duration-300 hover:shadow-md hover:shadow-[#3a9ca5]/10 flex flex-col text-left cursor-pointer"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={resource.image.startsWith("http") ? resource.image : `${import.meta.env.BASE_URL}${resource.image}`}
                  alt={resource.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${resource.tagColor}`}>
                    {resource.tag}
                  </span>
                </div>
              </div>

              <div className="p-3">
                <p className="text-[10px] font-semibold text-[#3a9ca5] mb-0.5 uppercase tracking-wider">{resource.subtitle}</p>
                <h3 className="text-sm font-bold text-foreground group-hover:text-[#3a9ca5] transition-colors line-clamp-1">{resource.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {resource.description}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && <ResourceModal resource={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </section>
  );
}
