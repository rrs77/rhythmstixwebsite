import { useState, useRef, useEffect, useCallback } from "react";
import { Quote, ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EditableText } from "@/components/EditableText";

const TESTIMONIALS = [
  {
    id: 1,
    quote: "CCDesigner has completely transformed how we plan our curriculum. Everything is in one place — no more digging through folders or rewriting lessons from scratch.",
    author: "Head of Music",
    organization: "Independent Prep School, Essex",
    app: "CCDesigner",
  },
  {
    id: 2,
    quote: "Assessify saves me hours every term. The AI reports sound like I actually wrote them, and parents love the detail. It's made assessment something I don't dread anymore.",
    author: "Music Teacher",
    organization: "Primary Academy, Birmingham",
    app: "Assessify",
  },
  {
    id: 3,
    quote: "As a peripatetic teacher across four schools, PeriFeedback keeps me organised. I log feedback on the spot and the school sees it immediately — no more chasing emails.",
    author: "Peripatetic Music Teacher",
    organization: "Multi-Academy Trust, London",
    app: "PeriFeedback",
  },
  {
    id: 4,
    quote: "I finally understand what the Rondo form is. I love these lessons — they're really fun.",
    author: "Student",
    organization: "Apopka Junior High School, Florida",
    app: "Teaching Portal",
  },
  {
    id: 5,
    quote: "Assessify generated reports for me that were clear, concise, and based entirely on the criteria I'd chosen. It truly simplified the whole process.",
    author: "Patrick Johns",
    organization: "Presenter/Teacher",
    app: "Assessify",
  },
  {
    id: 6,
    quote: "After a few clicks, Assessify generated full reports for each child. It's very, very impressive.",
    author: "Patrick Johns",
    organization: "Presenter/Teacher",
    app: "Assessify",
  },
  {
    id: 7,
    quote: "I trialled Assessify for music assessment and I've just purchased the base package. I'm starting a new post in UAE next month — this is going to be a great help with reporting.",
    author: "Amanda Phillips",
    organization: "Music Teacher",
    app: "Assessify",
  },
  {
    id: 8,
    quote: "I've been using this fantastic software to teach BandLab to children who were shielding. Being able to direct them toward this unit on the iPad app, so that they don't fall behind, has been a life-saver.",
    author: "Head of Music",
    organization: "Dale Community Primary School",
    app: "Teaching Portal",
  },
  {
    id: 9,
    quote: "It's a rare thing when you see children so engaged and excited by their learning. Highly recommended. What's next?",
    author: "KS2 Teacher",
    organization: "Croydon",
    app: "Teaching Portal",
  },
  {
    id: 10,
    quote: "We've had some excellent feedback on the package from our Secondary School Music Champions.",
    author: "Development Manager",
    organization: "Wiltshire Music Connect",
    app: "Teaching Portal",
  },
];

type Testimonial = typeof TESTIMONIALS[number];

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

        <Quote className="w-8 h-8 text-[#3a9ca5]/15 mb-4 rotate-180" />
        <p className="text-base text-foreground leading-relaxed italic mb-6">
          "{testimonial.quote}"
        </p>
        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-foreground">{testimonial.author}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{testimonial.organization}</p>
          {testimonial.app && (
            <span className="inline-block mt-2 text-xs font-medium text-[#3a9ca5] bg-[#3a9ca5]/8 px-3 py-1 rounded-full">
              {testimonial.app}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedTestimonial, setSelectedTestimonial] = useState<Testimonial | null>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const containerWidth = el.clientWidth;
    const step = containerWidth * 0.75;
    el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section className="py-10 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-white" />
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-6"
        >
          <div>
            <EditableText
              contentKey="testimonials.heading"
              fallback="Trusted by Educators"
              as="h2"
              className="text-lg font-bold mb-1 text-foreground"
            />
            <p className="text-xs text-muted-foreground">
              Hear from teachers and students using our tools every day.
            </p>
            <div className="w-10 h-0.5 bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] rounded-full mt-2" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[#3a9ca5] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-[#3a9ca5] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        <div className="relative overflow-hidden">
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          )}

          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {TESTIMONIALS.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(index * 0.06, 0.3) }}
                className="snap-start shrink-0 w-[calc(100%-16px)] sm:w-[calc(50%-8px)] lg:w-[calc(25%-12px)]"
              >
                <button
                  onClick={() => setSelectedTestimonial(testimonial)}
                  className="w-full text-left bg-white rounded-xl p-5 border border-slate-100 hover:border-[#3a9ca5]/20 hover:shadow-md transition-all duration-300 flex flex-col h-full cursor-pointer"
                >
                  <Quote className="w-5 h-5 text-[#3a9ca5]/12 mb-2 rotate-180 shrink-0" />
                  <div className="text-xs text-foreground/90 leading-relaxed mb-4 flex-grow italic">
                    <EditableText
                      contentKey={`testimonial.${testimonial.id}.quote`}
                      fallback={testimonial.quote}
                      as="p"
                      className="text-xs text-foreground/90 leading-relaxed italic"
                      multiline
                    >
                      {(value) => <span>"{value}"</span>}
                    </EditableText>
                  </div>
                  <div className="border-t border-slate-100 pt-3 mt-auto">
                    <EditableText
                      contentKey={`testimonial.${testimonial.id}.author`}
                      fallback={testimonial.author}
                      as="p"
                      className="text-xs font-semibold text-foreground"
                    />
                    <EditableText
                      contentKey={`testimonial.${testimonial.id}.org`}
                      fallback={testimonial.organization}
                      as="p"
                      className="text-[10px] text-muted-foreground mt-0.5"
                    />
                    {testimonial.app && (
                      <span className="inline-block mt-1.5 text-[10px] font-medium text-[#3a9ca5] bg-[#3a9ca5]/8 px-2 py-0.5 rounded-full">
                        {testimonial.app}
                      </span>
                    )}
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        </div>
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
