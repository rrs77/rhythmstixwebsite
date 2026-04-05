import { motion } from "framer-motion";
import { EditableText } from "@/components/EditableText";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#3a9ca5]/[0.02]"
            style={{
              width: 60 + i * 30,
              height: 60 + i * 30,
              left: `${15 + i * 20}%`,
              top: `${25 + (i % 2) * 30}%`,
            }}
            animate={{
              y: [0, -12, 0],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </div>

      <div className="container relative z-10 mx-auto px-4 pt-20 pb-8">
        <div className="max-w-3xl mx-auto text-center">
          <div className="mb-3 flex flex-col items-center">
            <div className="flex items-baseline justify-center">
              <motion.span
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3, type: "spring", stiffness: 150 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black text-[#3a9ca5] leading-none"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                r
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-4xl sm:text-5xl md:text-6xl font-black text-foreground leading-none"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                hythm
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.5, type: "spring", stiffness: 150 }}
                className="text-4xl sm:text-5xl md:text-6xl font-black text-[#3a9ca5]/15 leading-none"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                tix
              </motion.span>
            </div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-2"
          >
            <EditableText
              contentKey="hero.heading"
              fallback="Creative tools for educators."
              as="span"
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-sm sm:text-base text-muted-foreground/70 max-w-lg mx-auto"
          >
            <EditableText
              contentKey="hero.description"
              fallback="Creative tools for educators — from performing arts to AI-powered assessment and planning."
              as="span"
              className="text-sm sm:text-base text-muted-foreground/70"
            />
          </motion.p>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
