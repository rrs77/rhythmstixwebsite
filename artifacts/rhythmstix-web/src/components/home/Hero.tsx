import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { EditableText } from "@/components/EditableText";
import { EditableImage } from "@/components/EditableImage";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Warm cream gradient backdrop with subtle teal/mustard glows */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(40_35%_96%)] via-background to-[hsl(38_30%_94%)]" />
      <div className="absolute top-0 right-0 w-[28rem] h-[28rem] bg-[#3a9ca5]/[0.06] rounded-full blur-3xl -translate-y-1/3 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#d4a017]/[0.05] rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-10 sm:pb-14">
        <div className="grid md:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center min-h-[600px] lg:min-h-[680px]">
          {/* LEFT: brand + headline + CTAs */}
          <div className="text-left">
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
            >
              <EditableImage
                contentKey="brand.logo"
                fallback="/brand/logo.png"
                alt="Rhythmstix"
                className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto object-contain"
                emptyRender={
                  <div className="inline-flex flex-col">
                    <span className="inline-flex items-baseline tracking-[0.18em]" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      <span className="text-5xl sm:text-6xl md:text-7xl font-black text-foreground leading-none">RHYTHM</span>
                      <span className="text-5xl sm:text-6xl md:text-7xl font-black leading-none relative" style={{ color: "#d4a017" }}>
                        STIX
                        <span className="absolute -bottom-2 left-0 right-0 h-[4px] rounded-full bg-[#d4a017]" />
                      </span>
                    </span>
                  </div>
                }
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12 }}
              className="mt-6 sm:mt-7"
            >
              <EditableText
                contentKey="hero.headline"
                fallback="Reimagining performing arts education"
                as="h1"
                className="text-[1.125rem] sm:text-[1.4rem] md:text-[1.875rem] lg:text-[2.0625rem] font-bold text-foreground tracking-tight leading-[1.15]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-5 sm:mt-6 max-w-xl"
            >
              <EditableText
                contentKey="hero.subheadline"
                fallback="Innovative apps, resources and training that help schools teach music, drama and the arts with less workload and better outcomes."
                as="p"
                multiline
                className="text-[15px] sm:text-base text-muted-foreground leading-relaxed"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28 }}
              className="mt-7 sm:mt-8 flex flex-wrap items-center gap-3"
            >
              <a
                href="#products"
                className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#d4a017] text-white text-sm font-semibold shadow-md shadow-[#d4a017]/25 hover:bg-[#b8881a] hover:shadow-lg hover:shadow-[#d4a017]/30 transition-all"
              >
                <EditableText contentKey="hero.cta_primary" fallback="Explore Our Tools" as="span" />
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <Link
                href="/about"
                className="inline-flex items-center px-5 py-2.5 rounded-full border-2 border-[#3a9ca5] text-[#3a9ca5] text-sm font-semibold bg-white hover:bg-[#3a9ca5] hover:text-white transition-colors"
              >
                <EditableText contentKey="hero.cta_secondary" fallback="About Rhythmstix" as="span" />
              </Link>
            </motion.div>
          </div>

          {/* RIGHT: layered composition — decorative blobs in CSS, transparent portrait on top */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative w-full h-[480px] sm:h-[600px] lg:h-[680px] md:justify-self-end"
          >
            {/* Mustard half-circle blob — sits behind, lower-left, intentionally bottom-anchored */}
            <div
              aria-hidden
              className="absolute left-[8%] bottom-[6%] w-[55%] aspect-square rounded-full bg-[#d4a017]/55"
            />

            {/* Teal concert circle — upper-right, slightly larger and softer so it supports
                the violinist instead of competing. Uses a soft blur halo + reduced contrast. */}
            <div
              aria-hidden
              className="absolute right-[4%] top-[6%] w-[48%] aspect-square rounded-full overflow-hidden ring-1 ring-[#3a9ca5]/10 shadow-[0_18px_40px_-12px_rgba(58,156,165,0.35)]"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, rgba(58,156,165,0.62), rgba(58,156,165,0.45)), url(/brand/concert.png)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundBlendMode: "multiply",
                maskImage:
                  "radial-gradient(circle at center, black 72%, transparent 100%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, black 72%, transparent 100%)",
              }}
            />

            {/* Halftone dot pattern — right side accent, softened */}
            <div
              aria-hidden
              className="absolute right-0 top-[28%] w-[40%] h-[45%] opacity-45"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #d4a017 2px, transparent 2.2px)",
                backgroundSize: "14px 14px",
                maskImage:
                  "linear-gradient(to right, black 20%, transparent 90%)",
                WebkitMaskImage:
                  "linear-gradient(to right, black 20%, transparent 90%)",
              }}
            />

            {/* Portrait — transparent PNG layered on top, scaled up so she's the focal point.
                origin-bottom keeps her feet anchored, so legs remain visible. */}
            <EditableImage
              contentKey="hero.image"
              fallback="/brand/hero-girl-fullbody.png"
              alt="Young violinist performing — Rhythmstix in action"
              className="absolute inset-0 m-auto h-full w-auto max-w-full object-contain object-bottom origin-bottom scale-[1.12] sm:scale-[1.16] lg:scale-[1.22] drop-shadow-[0_24px_36px_rgba(15,23,42,0.16)]"
              emptyRender={
                <div className="absolute inset-0 m-auto w-full max-w-[440px] aspect-[2/3] flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#3a9ca5]/10 via-white/40 to-[#d4a017]/10">
                  <div className="text-center px-6">
                    <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/85 backdrop-blur flex items-center justify-center shadow-md">
                      <span className="text-3xl font-black" style={{ fontFamily: "'Poppins', sans-serif", color: "#3a9ca5" }}>R</span>
                    </div>
                    <p className="text-[11px] font-semibold text-[#3a9ca5]/80 uppercase tracking-widest">Add a hero image in admin</p>
                  </div>
                </div>
              }
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
