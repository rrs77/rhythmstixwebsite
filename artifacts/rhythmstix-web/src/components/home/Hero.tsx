import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { Link } from "wouter";

export function Hero() {
  return (
    <section className="relative flex items-center justify-center overflow-hidden pt-24 pb-8">
      <div className="absolute inset-0 z-0">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Abstract dark background"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,180,170,0.2),transparent_70%)]" />
      </div>

      <div className="container relative z-10 mx-auto px-4 flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-6"
        >
          <img
            src={`${import.meta.env.BASE_URL}images/rhythmstix-logo-full.png`}
            alt="Rhythmstix - Music for Education"
            className="h-32 sm:h-40 md:h-48 w-auto object-contain mx-auto"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-foreground/90 mb-4">
            Performing Arts Tools & Teaching Platform
          </h2>
          
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Assessment, planning, progression tracking, and interactive teaching — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="w-full sm:w-auto group" asChild>
              <a href="#products">
                Explore Apps
                <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button size="lg" variant="glass" className="w-full sm:w-auto" asChild>
              <Link href="/page/assessify">Open Assessify</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
