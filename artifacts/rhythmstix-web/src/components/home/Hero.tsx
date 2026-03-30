import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-16">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Abstract dark background"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,180,216,0.15),transparent_70%)]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 relative group"
        >
          {/* Logo icon representation */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-[2rem] bg-gradient-to-tr from-primary via-accent to-primary p-[2px] shadow-2xl shadow-primary/30">
            <div className="w-full h-full rounded-[calc(2rem-2px)] bg-card/80 backdrop-blur-xl flex items-center justify-center">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-16 sm:h-16">
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(var(--accent))" />
                  </linearGradient>
                </defs>
                <path d="m14.5 9.5-9 9" />
                <path d="m9.5 14.5 9-9" />
                <circle cx="18" cy="5" r="2" fill="currentColor" className="text-primary"/>
                <circle cx="5" cy="18" r="2" fill="currentColor" className="text-accent"/>
              </svg>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary mb-6 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            MUSIC FOR EDUCATION
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 text-glow text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70">
            RHYTHMSTIX
          </h1>
          
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground/90 mb-6">
            Performing Arts Tools & Teaching Platform
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Assessment, planning, progression tracking, and interactive teaching — all in one beautifully integrated place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto group" asChild>
              <a href="#products">
                Explore Apps
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button size="lg" variant="glass" className="w-full sm:w-auto" asChild>
              <a href="#assessify">Open Assessify</a>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
