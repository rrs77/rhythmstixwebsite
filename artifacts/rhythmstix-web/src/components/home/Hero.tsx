import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Link } from "wouter";

const APP_LINKS = [
  { name: "Assessify", href: "https://www.assessify.co.uk/" },
  { name: "CCDesigner", href: "https://www.ccdesigner.co.uk/" },
  { name: "PeriFeedback", href: "#" },
  { name: "ProgressPath", href: "#" },
  { name: "E-Learning", href: "https://www.rhythmstix.co.uk/learning-platform/" },
];

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
              className="h-16 sm:h-20 md:h-28 w-auto object-contain mx-auto"
            />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg sm:text-xl md:text-2xl font-medium text-slate-500 mb-6 leading-relaxed"
          >
            Assessment, planning, progression tracking,
            <br className="hidden sm:block" />
            and interactive teaching — all in one place.
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-10"
          >
            {APP_LINKS.map((app) => (
              <a
                key={app.name}
                href={app.href}
                target={app.href.startsWith("http") ? "_blank" : undefined}
                rel={app.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="text-sm font-medium text-slate-400 hover:text-[#0e9aa7] transition-colors flex items-center gap-1"
              >
                {app.name}
                {app.href.startsWith("http") && <ExternalLink className="w-3 h-3" />}
              </a>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="w-full sm:w-auto group bg-[#0e9aa7] hover:bg-[#12b5c4] text-white shadow-lg shadow-[#0e9aa7]/25 border-0 text-base px-8 py-6" asChild>
              <a href="#products">
                Explore Apps
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
            <Button size="lg" className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-base px-8 py-6" asChild>
              <Link href="/shop">
                Visit Shop
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
