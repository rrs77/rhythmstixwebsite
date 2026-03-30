import { motion } from "framer-motion";

export function Hero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100" />

      <div className="container relative z-10 mx-auto px-4 pt-28 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-6"
          >
            <img
              src={`${import.meta.env.BASE_URL}images/rhythmstix-logo-colour.png`}
              alt="Rhythmstix - Education Solutions"
              className="h-28 sm:h-36 md:h-48 w-auto object-contain mx-auto"
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl font-medium text-black leading-relaxed"
          >
            Assessment, planning, progression tracking,
            <br className="hidden sm:block" />
            and interactive teaching — all in one place.
          </motion.h2>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
