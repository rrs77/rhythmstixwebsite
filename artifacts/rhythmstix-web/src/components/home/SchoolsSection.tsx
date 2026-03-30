import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const RESOURCES = [
  {
    title: "Guide The Way",
    subtitle: "Nativity for Years 3–6",
    description: "A complete, modern nativity package for Key Stage 2 with script, sheet music, and performance tracks. Everything you need to stage a memorable school production — from rehearsal guides to backing tracks.",
    image: "images/guide-the-way.png",
    tag: "Premium Package",
    tagColor: "bg-[#3a9ca5] text-white",
    features: [
      "Full script and staging guide",
      "Sheet music and backing tracks",
      "Performance-ready production pack",
    ],
  }
];

const FREE_RESOURCES = [
  {
    title: "Sneaky Creatures",
    subtitle: "Free Early Years Song",
    description: "A fun, interactive song for early years students to develop rhythm, coordination, and listening skills. Perfect for Reception and Year 1 classes, with actions and movement built in to keep young learners engaged.",
    image: "images/sneaky-creatures.png",
    tag: "Free Resource",
    tagColor: "bg-emerald-500 text-white",
    features: [
      "Rhythm and coordination activities",
      "Perfect for Reception & Year 1",
      "Movement and actions included",
    ],
  },
];

type Resource = typeof RESOURCES[number];

function ResourceModal({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const isFree = resource.tag === "Free Resource";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-card rounded-2xl overflow-hidden border border-[#3a9ca5]/20 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
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
          <p className="text-muted-foreground text-sm leading-relaxed mb-4">
            {resource.description}
          </p>

          {resource.features && resource.features.length > 0 && (
            <ul className="space-y-2 mb-5">
              {resource.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3a9ca5] mt-1.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}

          <Button className="w-full bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
            <Link href="/shop">
              {isFree ? (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Get Free Download in Shop
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Purchase in Shop
                </>
              )}
            </Link>
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResourceCard({ resource, onClick, index }: { resource: Resource; onClick: () => void; index: number }) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="group bg-card rounded-xl overflow-hidden border border-[#3a9ca5]/10 hover:border-[#3a9ca5]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#3a9ca5]/10 flex flex-col text-left cursor-pointer"
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
  );
}

export function SchoolsSection() {
  const [selected, setSelected] = useState<Resource | null>(null);

  return (
    <section className="py-12 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-[#3a9ca5]">Music For Schools</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] mx-auto rounded-full mb-3" />
          <p className="text-muted-foreground max-w-xl mx-auto">
            High-quality, ready-to-use musical resources for your classroom.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {RESOURCES.map((resource, idx) => (
            <ResourceCard key={resource.title} resource={resource} onClick={() => setSelected(resource)} index={idx} />
          ))}
        </div>

        <div className="text-center mt-12 mb-8">
          <h3 className="text-xl md:text-2xl font-bold mb-2 text-[#3a9ca5]">Free Resources</h3>
          <div className="w-12 h-1 bg-gradient-to-r from-emerald-400 to-emerald-500 mx-auto rounded-full mb-3" />
          <p className="text-muted-foreground max-w-xl mx-auto text-sm">
            Free music resources for your classroom — no purchase required.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {FREE_RESOURCES.map((resource, idx) => (
            <ResourceCard key={resource.title} resource={resource} onClick={() => setSelected(resource)} index={idx} />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && <ResourceModal resource={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </section>
  );
}
