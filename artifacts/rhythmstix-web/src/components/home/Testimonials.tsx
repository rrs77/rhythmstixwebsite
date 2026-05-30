import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, X, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { EditableText } from "@/components/EditableText";

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  organization: string;
  app: string | null;
  published: boolean;
  sortOrder: number;
}

function TestimonialModal({ testimonial, onClose }: { testimonial: Testimonial; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25 }}
        className="relative bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-[#d4a017] text-5xl leading-none font-serif mb-2 select-none">&ldquo;</div>
        <p className="text-base text-foreground leading-relaxed mb-6">
          {testimonial.quote.replace(/^["']|["']$/g, "")}
        </p>
        <div className="border-t border-[#d4a017]/30 pt-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#3a9ca5]/12 flex items-center justify-center text-[#3a9ca5] shrink-0">
            <User className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{testimonial.author}</p>
            <p className="text-xs text-muted-foreground truncate">{testimonial.organization}</p>
            {testimonial.app && (
              <span className="inline-block mt-1.5 text-xs font-medium text-[#3a9ca5] bg-[#3a9ca5]/8 px-3 py-0.5 rounded-full">
                {testimonial.app}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Testimonials() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(3);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const res = await fetch("/api/testimonials");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60_000,
  });

  const recompute = useCallback(() => {
    const w = window.innerWidth;
    if (w < 640) setPerPage(1);
    else if (w < 1024) setPerPage(2);
    else setPerPage(3);
  }, []);

  useEffect(() => {
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [recompute]);

  const totalPages = Math.max(1, Math.ceil(testimonials.length / perPage));

  useEffect(() => {
    if (page > totalPages - 1) setPage(0);
  }, [page, totalPages]);

  const visible = useMemo(
    () => testimonials.slice(page * perPage, page * perPage + perPage),
    [testimonials, page, perPage],
  );

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  if (testimonials.length === 0) return null;

  return (
    <section className="relative py-16 sm:py-20 overflow-hidden">
      {/* Decorative dot patterns */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-6 right-6 w-32 h-32 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d4a017 1.5px, transparent 1.6px)",
          backgroundSize: "12px 12px",
          maskImage: "radial-gradient(circle at top right, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at top right, black 30%, transparent 75%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-6 left-6 w-32 h-32 opacity-50"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d4a017 1.5px, transparent 1.6px)",
          backgroundSize: "12px 12px",
          maskImage: "radial-gradient(circle at bottom left, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(circle at bottom left, black 30%, transparent 75%)",
        }}
      />

      <div ref={viewportRef} className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-10 gap-6 flex-wrap"
        >
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-[#d4a017] uppercase mb-3">
              Testimonials
            </p>
            <EditableText
              contentKey="testimonials.heading"
              fallback="Trusted by Educators"
              as="h2"
              className="text-3xl sm:text-4xl font-bold text-foreground mb-2"
            />
            <EditableText
              contentKey="testimonials.subheading"
              fallback="Hear from teachers and students using our tools every day."
              as="p"
              className="text-sm text-muted-foreground max-w-md"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={!canPrev}
              className="w-10 h-10 rounded-full border border-border bg-white flex items-center justify-center text-muted-foreground hover:text-[#d4a017] hover:border-[#d4a017] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Previous testimonials"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={!canNext}
              className="w-10 h-10 rounded-full border-2 border-[#d4a017] bg-white flex items-center justify-center text-[#d4a017] hover:bg-[#d4a017] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Next testimonials"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        <div ref={trackRef} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map((testimonial, index) => (
              <motion.div
                key={`${page}-${testimonial.id}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, delay: index * 0.06 }}
              >
                <button
                  onClick={() => setSelectedTestimonial(testimonial)}
                  className="group w-full h-full text-left bg-white rounded-2xl p-7 border border-slate-100 shadow-[0_2px_12px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col cursor-pointer"
                >
                  <div className="text-[#d4a017] text-6xl leading-none font-serif select-none mb-3">
                    &ldquo;
                  </div>
                  <p className="text-[15px] text-foreground/90 leading-relaxed mb-6 flex-grow line-clamp-5">
                    {testimonial.quote.replace(/^["']|["']$/g, "")}
                  </p>
                  <div className="pt-5 border-t border-[#d4a017]/30 flex items-center gap-3 mt-auto">
                    <div className="w-11 h-11 rounded-full bg-[#3a9ca5]/12 flex items-center justify-center text-[#3a9ca5] shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {testimonial.author}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {testimonial.organization}
                      </p>
                      {testimonial.app && (
                        <span className="inline-block mt-1.5 text-[11px] font-medium text-[#3a9ca5] bg-[#3a9ca5]/10 px-2.5 py-0.5 rounded-full">
                          {testimonial.app}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {totalPages > 1 && (
          totalPages <= 6 ? (
            <div className="flex items-center justify-center gap-2 mt-10">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-2 rounded-full transition-all ${
                    i === page ? "w-6 bg-[#d4a017]" : "w-2 bg-[#d4a017]/25 hover:bg-[#d4a017]/50"
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 mt-10">
              <span className="text-xs font-semibold tracking-wider text-[#d4a017] tabular-nums">
                {String(page + 1).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
              </span>
              <div className="h-1 w-32 rounded-full bg-[#d4a017]/20 overflow-hidden">
                <div
                  className="h-full bg-[#d4a017] transition-all duration-300"
                  style={{ width: `${((page + 1) / totalPages) * 100}%` }}
                />
              </div>
            </div>
          )
        )}
      </div>

      <AnimatePresence>
        {selectedTestimonial && (
          <TestimonialModal
            testimonial={selectedTestimonial}
            onClose={() => setSelectedTestimonial(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
