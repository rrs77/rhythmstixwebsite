import { motion } from "framer-motion";
import { Palette, ClipboardCheck, CalendarDays, TrendingUp, GraduationCap } from "lucide-react";
import { Link } from "wouter";

const APPS = [
  { icon: Palette, label: "CCDesigner", href: "/ccdesigner" },
  { icon: ClipboardCheck, label: "Assessify", href: "/assessify" },
  { icon: CalendarDays, label: "PeriFeedback", href: "/perifeedback" },
  { icon: TrendingUp, label: "ProgressPath", href: "/progresspath" },
  { icon: GraduationCap, label: "E-Learning", href: "/elearning" },
];

const WORDS = ["plan", "assess", "track", "teach", "inspire"];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white via-slate-50 to-slate-100" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#3a9ca5]/5"
            style={{
              width: 80 + i * 40,
              height: 80 + i * 40,
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.6, 0.3],
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

      <div className="container relative z-10 mx-auto px-4 pt-24 pb-12">
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
              className="h-36 sm:h-44 md:h-56 w-auto object-contain mx-auto"
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="text-foreground">Making classrooms </span>
            <span className="text-[rgb(52,154,167)]">work</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
          >
            A suite of apps and tools built specifically for music education —
            helping teachers{" "}
            <span className="inline-flex items-center gap-1">
              {WORDS.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
                  className="text-[rgb(52,154,167)] font-semibold"
                >
                  {word}{i < WORDS.length - 1 ? ", " : "."}
                </motion.span>
              ))}
            </span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-8"
          >
            {APPS.map((app, i) => (
              <motion.div
                key={app.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 + i * 0.1, type: "spring", stiffness: 200 }}
              >
                <Link
                  href={app.href}
                  className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/80 border border-border hover:border-[#3a9ca5]/40 hover:shadow-md hover:shadow-[#3a9ca5]/10 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-[#3a9ca5] to-[#4cb5bd] shadow-sm">
                    <app.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-[#3a9ca5] transition-colors">
                    {app.label}
                  </span>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.6 }}
            className="flex items-center justify-center gap-6 text-xs text-muted-foreground/60"
          >
            <span>Assessment</span>
            <span className="w-1 h-1 rounded-full bg-[#3a9ca5]/30" />
            <span>Planning</span>
            <span className="w-1 h-1 rounded-full bg-[#3a9ca5]/30" />
            <span>Progression Tracking</span>
            <span className="w-1 h-1 rounded-full bg-[#3a9ca5]/30" />
            <span>Interactive Teaching</span>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
