import { motion } from "framer-motion";
import { EditableText } from "@/components/EditableText";

export function AboutSection() {
  return (
    <section className="relative pt-6 sm:pt-8 pb-16 sm:pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="space-y-5 text-base sm:text-lg leading-relaxed text-muted-foreground"
        >
          <EditableText
            contentKey="about.intro1"
            fallback="Rhythmstix creates innovative apps, educational resources, and offers training and support for the arts in education. Working with schools, including leading independent schools across the UK, we build systems that improve teaching and learning, reduce workload, support creative planning, strengthen assessment and feedback, and develop outstanding practice across music, drama, and the arts."
            as="p"
            multiline
          />
        </motion.div>
      </div>
    </section>
  );
}
