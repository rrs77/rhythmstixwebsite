import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";

export function Hero() {
  return (
    <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e3c] via-[#0c3d4a] to-[#0e4a52]" />

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <img
              src={`${import.meta.env.BASE_URL}images/rhythmstix-logo-official.png`}
              alt="Rhythmstix - Education Solutions"
              className="h-20 sm:h-28 md:h-36 w-auto object-contain mx-auto"
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl sm:text-2xl md:text-3xl font-medium text-white/80 mb-6 leading-relaxed"
          >
            Assessment, planning, progression tracking,
            <br className="hidden sm:block" />
            and interactive teaching — all in one place.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="w-full sm:w-auto group bg-teal-500 hover:bg-teal-400 text-white shadow-lg shadow-teal-500/25 border-0 text-base px-8 py-6" asChild>
              <a href="#products">
                Explore Apps
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button size="lg" className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm text-base px-8 py-6" asChild>
              <Link href="/page/assessify">Open Assessify</Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
