import { Music, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export function AppCreator() {
  return (
    <section className="py-16 bg-gradient-to-b from-background to-[#3a9ca5]/[0.03]">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.h2
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-bold text-center mb-8"
        >
          <span className="text-[rgb(52,154,167)]">App Creator</span>
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-[#3a9ca5]/20 p-8 md:p-10 shadow-sm shadow-[#3a9ca5]/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-12 h-12 rounded-full bg-gradient-to-br from-[#3a9ca5] to-[#2d8890] flex items-center justify-center text-white"
            >
              <Music size={22} />
            </motion.div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Rob</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <GraduationCap size={14} className="text-primary" />
                Composer & Specialist Teacher
              </p>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-muted-foreground leading-relaxed"
          >
            Rob graduated from Birmingham University with a Degree in Drama and Theatre Arts.
            Following many years as a teacher in Primary and Secondary settings, he is now a
            composer and specialist teacher. As the Head Of Music and Drama at an independent
            school in Essex, teaching children from 2 – 16, he is always around music and loves
            composing for schools and creating inspiring learning for children. He lives in
            Chelmsford Essex with his wife, 2 children and 2 cats – Georgie and Ira.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
