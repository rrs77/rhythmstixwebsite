import { motion } from "framer-motion";
import { Users, ShieldCheck, Clock, Star } from "lucide-react";
import { EditableText } from "@/components/EditableText";

interface Benefit {
  icon: typeof Users;
  titleKey: string;
  titleFallback: string;
  bodyKey: string;
  bodyFallback: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: Users,
    titleKey: "benefits.educators.title",
    titleFallback: "Built for Educators",
    bodyKey: "benefits.educators.body",
    bodyFallback: "Designed by teachers, for teachers.",
  },
  {
    icon: ShieldCheck,
    titleKey: "benefits.secure.title",
    titleFallback: "Trusted & Secure",
    bodyKey: "benefits.secure.body",
    bodyFallback: "Your data is safe with enterprise-grade security.",
  },
  {
    icon: Clock,
    titleKey: "benefits.time.title",
    titleFallback: "Save Time",
    bodyKey: "benefits.time.body",
    bodyFallback: "Reduce workload and focus on what matters.",
  },
  {
    icon: Star,
    titleKey: "benefits.outcomes.title",
    titleFallback: "Better Outcomes",
    bodyKey: "benefits.outcomes.body",
    bodyFallback: "Empower teachers and inspire learners.",
  },
];

export function BenefitsBanner() {
  return (
    <section className="relative pb-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-gradient-to-br from-[#2f8089] via-[#3a9ca5] to-[#2f8089] shadow-xl shadow-[#3a9ca5]/20 overflow-hidden">
          {/* Subtle decorative glows */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#d4a017]/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/5 blur-2xl" />

          <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-6 sm:px-10 py-8 sm:py-10">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={b.titleKey}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className="flex items-start gap-4"
                >
                  <div className="shrink-0 w-11 h-11 rounded-full bg-white/10 ring-1 ring-white/15 flex items-center justify-center text-[#d4a017]">
                    <Icon className="w-5 h-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <EditableText
                      contentKey={b.titleKey}
                      fallback={b.titleFallback}
                      as="h3"
                      className="text-sm font-bold text-white mb-0.5"
                    />
                    <EditableText
                      contentKey={b.bodyKey}
                      fallback={b.bodyFallback}
                      as="p"
                      className="text-xs text-white/75 leading-relaxed"
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
