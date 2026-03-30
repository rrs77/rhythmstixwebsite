import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, Music, BookOpen, Users, BarChart3 } from "lucide-react";
import { Link } from "wouter";

const floatingIcons = [
  { Icon: Music, x: "10%", y: "20%", delay: 0, size: 28 },
  { Icon: BookOpen, x: "85%", y: "15%", delay: 0.5, size: 24 },
  { Icon: Users, x: "75%", y: "75%", delay: 1, size: 26 },
  { Icon: BarChart3, x: "15%", y: "70%", delay: 1.5, size: 22 },
];

export function Hero() {
  return (
    <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e3c] via-[#0c3d4a] to-[#0e4a52]" />

      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(14,154,167,0.25),transparent_70%)] blur-3xl" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(14,154,167,0.15),transparent_70%)] blur-2xl" />

      {floatingIcons.map(({ Icon, x, y, delay, size }, i) => (
        <motion.div
          key={i}
          className="absolute text-white/10"
          style={{ left: x, top: y }}
          animate={{ y: [0, -15, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon size={size} />
        </motion.div>
      ))}

      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-4"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-white/10 text-teal-300 border border-white/10 backdrop-blur-sm">
              Performing Arts Education Platform
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="mb-8"
          >
            <img
              src={`${import.meta.env.BASE_URL}images/rhythmstix-logo-hero.svg`}
              alt="Rhythmstix - Making Learning Stick"
              className="h-16 sm:h-24 md:h-28 w-auto object-contain mx-auto"
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-xl sm:text-2xl md:text-3xl font-medium text-white/80 mb-6 leading-relaxed"
          >
            Assessment, planning, progression tracking,
            <br className="hidden sm:block" />
            and interactive teaching — all in one place.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
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

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
            className="flex items-center justify-center gap-8 text-white/40 text-sm"
          >
            <span>6 Education Apps</span>
            <span className="w-1 h-1 rounded-full bg-teal-400/50" />
            <span>UK Schools</span>
            <span className="w-1 h-1 rounded-full bg-teal-400/50" />
            <span>24/7 Online Access</span>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
