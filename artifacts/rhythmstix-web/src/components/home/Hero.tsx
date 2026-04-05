import { motion } from "framer-motion";
import { EditableText } from "@/components/EditableText";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#3a9ca5]/[0.04] via-white to-[#4cb5bd]/[0.06]" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#3a9ca5]/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4cb5bd]/[0.04] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="container relative z-10 mx-auto px-4 pt-20 pb-6">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-2 flex items-baseline justify-center"
          >
            <span
              className="text-4xl sm:text-5xl font-black text-[#3a9ca5] leading-none"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              r
            </span>
            <span
              className="text-4xl sm:text-5xl font-black text-foreground leading-none"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              hythm
            </span>
            <span
              className="text-4xl sm:text-5xl font-black text-[#3a9ca5]/40 leading-none"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              tix
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-2"
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
            transition={{ duration: 0.5, delay: 0.25 }}
            className="text-sm text-muted-foreground max-w-lg mx-auto"
          >
            <EditableText
              contentKey="hero.description"
              fallback="Music, performing arts, and AI-powered planning and assessment — all in one place."
              as="span"
              className="text-sm text-muted-foreground"
            />
          </motion.p>
        </div>
      </div>
    </section>
  );
}
