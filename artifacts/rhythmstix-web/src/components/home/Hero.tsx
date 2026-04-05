import { motion } from "framer-motion";
import { EditableText } from "@/components/EditableText";
import { useContentValue } from "@/hooks/use-content";

export function Hero() {
  const subtitle = useContentValue("hero.subtitle", "education solutions.");
  const descriptionText = useContentValue(
    "hero.description",
    "A suite of apps and tools built specifically for music education — helping teachers"
  );
  const wordsRaw = useContentValue("hero.words", "plan, assess, track, teach, inspire");
  const words = wordsRaw.split(",").map((w) => w.trim()).filter(Boolean);

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
          <div className="mb-2 flex flex-col items-center">
            <div className="flex items-baseline justify-center">
              <motion.span
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 150 }}
                className="text-5xl sm:text-6xl md:text-8xl font-black text-[#3a9ca5] leading-none"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                r
              </motion.span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="text-5xl sm:text-6xl md:text-8xl font-black text-foreground leading-none"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                hythm
              </motion.span>
              <motion.span
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 150 }}
                className="text-5xl sm:text-6xl md:text-8xl font-black text-[#3a9ca5] leading-none"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                tix
              </motion.span>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.9 }}
            >
              <EditableText
                contentKey="hero.subtitle"
                fallback="education solutions."
                as="span"
                className="text-sm sm:text-base md:text-lg tracking-[0.25em] text-muted-foreground font-medium mt-1"
              />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2"
          >
            <EditableText
              contentKey="hero.heading"
              fallback="Making classrooms work"
            >
              {(value) => {
                const parts = value.split(" ");
                const lastWord = parts.pop();
                return (
                  <>
                    <span className="text-foreground">{parts.join(" ")} </span>
                    <span className="text-[rgb(52,154,167)]">{lastWord}</span>
                  </>
                );
              }}
            </EditableText>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-5"
          >
            <EditableText
              contentKey="hero.description"
              fallback="A suite of apps and tools built specifically for music education — helping teachers"
              as="span"
              className="text-base sm:text-lg text-muted-foreground"
            />{" "}
            <span className="inline-flex items-center gap-1">
              {words.map((word, i) => (
                <motion.span
                  key={word}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
                  className="text-[rgb(52,154,167)] font-semibold"
                >
                  {word}{i < words.length - 1 ? ", " : "."}
                </motion.span>
              ))}
            </span>
            <EditableText
              contentKey="hero.words"
              fallback="plan, assess, track, teach, inspire"
              as="span"
              className="hidden"
            />
          </motion.p>

        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
