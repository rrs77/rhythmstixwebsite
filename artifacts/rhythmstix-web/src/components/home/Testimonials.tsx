import { useState, useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TESTIMONIALS = [
  {
    id: 1,
    quote: "I finally understand what the Rondo form is. I love these lessons they're really fun.",
    author: "Student",
    organization: "Apopka Junior High School, Florida"
  },
  {
    id: 2,
    quote: "The planning tools have completely transformed how our department organizes the curriculum. It saves us hours every week.",
    author: "Head of Music",
    organization: "St. Jude's Academy, London"
  },
  {
    id: 3,
    quote: "ProgressPath makes tracking student development intuitive and visual. Parents love the detailed reports we can now provide.",
    author: "Teacher",
    organization: "Creative Arts College, Sydney"
  }
];

export function Testimonials() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "center" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
  }, [emblaApi, onSelect]);

  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 6000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  return (
    <section className="py-16 bg-gradient-to-br from-[#3a9ca5]/[0.04] via-secondary/30 to-[#4cb5bd]/[0.04] relative">
      <div className="container mx-auto px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-bold mb-3">What People Say</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] mx-auto rounded-full" />
        </motion.div>

        <div className="max-w-3xl mx-auto relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {TESTIMONIALS.map((testimonial) => (
                <div key={testimonial.id} className="flex-[0_0_100%] min-w-0 px-4">
                  <div className="glass-panel rounded-2xl p-6 md:p-8 text-center relative mx-auto max-w-2xl border border-[#3a9ca5]/10">
                    <Quote className="w-8 h-8 text-primary/15 mx-auto mb-4 rotate-180" />
                    <p className="text-base md:text-lg font-medium text-foreground mb-4 leading-relaxed">
                      "{testimonial.quote}"
                    </p>
                    <div>
                      <p className="text-sm font-semibold text-primary">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.organization}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8 border-border/50" onClick={scrollPrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex gap-2">
              {TESTIMONIALS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => scrollTo(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    index === selectedIndex 
                      ? "bg-primary w-5" 
                      : "bg-border hover:bg-muted-foreground"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            <Button variant="outline" size="icon" className="rounded-full w-8 h-8 border-border/50" onClick={scrollNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
