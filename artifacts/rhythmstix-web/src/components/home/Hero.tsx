import { motion } from "framer-motion";
import { EditableText } from "@/components/EditableText";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50/80 to-slate-100/60" />

      <div className="container relative z-10 mx-auto px-4 pt-16 pb-2">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-1 flex items-baseline justify-center"
          >
            <span
              className="text-3xl sm:text-4xl font-black text-[#3a9ca5] leading-none"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              r
            </span>
            <span
              className="text-3xl sm:text-4xl font-black text-foreground leading-none"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              hythm
            </span>
            <span
              className="text-3xl sm:text-4xl font-black text-[#3a9ca5]/40 leading-none"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              tix
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="text-base sm:text-lg md:text-xl font-bold text-foreground mb-1"
          >
            <EditableText
              contentKey="hero.heading"
              fallback="Creative tools for educators."
              as="span"
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.25 }}
            className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto"
          >
            <EditableText
              contentKey="hero.description"
              fallback="Music, performing arts, and AI-powered planning and assessment — all in one place."
              as="span"
              className="text-xs sm:text-sm text-muted-foreground"
            />
          </motion.p>
        </div>
      </div>
    </section>
  );
}
