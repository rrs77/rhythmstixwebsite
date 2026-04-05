import { motion } from "framer-motion";
import { EditableText } from "@/components/EditableText";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#3a9ca5]/[0.025]"
            style={{
              width: 80 + i * 40,
              height: 80 + i * 40,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.4,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-32 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 flex flex-col items-center">
            <div className="flex items-baseline justify-center">
              <motion.span
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 150 }}
                className="text-5xl sm:text-6xl md:text-8xl font-black text-[#3a9ca5] leading-none"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                r
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-5xl sm:text-6xl md:text-8xl font-black text-foreground leading-none"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                hythm
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 150 }}
                className="text-5xl sm:text-6xl md:text-8xl font-black text-[#3a9ca5]/15 leading-none"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                tix
              </motion.span>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-base sm:text-lg text-muted-foreground/70 max-w-xl mx-auto"
          >
            <EditableText
              contentKey="hero.description"
              fallback="Creative tools for educators — from performing arts to AI-powered assessment and planning."
              as="span"
              className="text-base sm:text-lg text-muted-foreground/70"
            />
          </motion.p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
