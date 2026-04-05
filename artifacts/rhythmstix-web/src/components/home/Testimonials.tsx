import { Quote } from "lucide-react";
import { motion } from "framer-motion";
import { EditableText } from "@/components/EditableText";

const TESTIMONIALS = [
  {
    id: 1,
    quote: "CCDesigner has completely transformed how we plan our curriculum. Everything is in one place — no more digging through folders or rewriting lessons from scratch.",
    author: "Head of Music",
    organization: "Independent Prep School, Essex",
    app: "CCDesigner",
  },
  {
    id: 2,
    quote: "Assessify saves me hours every term. The AI reports sound like I actually wrote them, and parents love the detail. It's made assessment something I don't dread anymore.",
    author: "Music Teacher",
    organization: "Primary Academy, Birmingham",
    app: "Assessify",
  },
  {
    id: 3,
    quote: "As a peripatetic teacher across four schools, PeriFeedback keeps me organised. I log feedback on the spot and the school sees it immediately — no more chasing emails.",
    author: "Peripatetic Music Teacher",
    organization: "Multi-Academy Trust, London",
    app: "PeriFeedback",
  },
  {
    id: 4,
    quote: "I finally understand what the Rondo form is. I love these lessons — they're really fun.",
    author: "Student",
    organization: "Apopka Junior High School, Florida",
    app: null,
  },
];

export function Testimonials() {
  return (
    <section className="py-12 bg-gradient-to-br from-[#3a9ca5]/[0.03] via-secondary/20 to-[#4cb5bd]/[0.03] relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <EditableText
            contentKey="testimonials.heading"
            fallback="What People Say"
            as="h2"
            className="text-2xl font-bold mb-2"
          />
          <div className="w-12 h-0.5 bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="bg-card rounded-xl p-5 border border-[#3a9ca5]/10 hover:border-[#3a9ca5]/25 transition-colors duration-300 flex flex-col"
            >
              <Quote className="w-5 h-5 text-[#3a9ca5]/20 mb-3 rotate-180 shrink-0" />
              <div className="text-sm text-foreground leading-relaxed mb-4 flex-grow">
                <EditableText
                  contentKey={`testimonial.${testimonial.id}.quote`}
                  fallback={testimonial.quote}
                  as="p"
                  className="text-sm text-foreground leading-relaxed"
                  multiline
                >
                  {(value) => <span>"{value}"</span>}
                </EditableText>
              </div>
              <div className="border-t border-border/50 pt-3">
                <EditableText
                  contentKey={`testimonial.${testimonial.id}.author`}
                  fallback={testimonial.author}
                  as="p"
                  className="text-xs font-semibold text-[#3a9ca5]"
                />
                <EditableText
                  contentKey={`testimonial.${testimonial.id}.org`}
                  fallback={testimonial.organization}
                  as="p"
                  className="text-[11px] text-muted-foreground"
                />
                {testimonial.app && (
                  <span className="inline-block mt-1.5 text-[10px] font-medium text-[#3a9ca5]/70 bg-[#3a9ca5]/8 px-2 py-0.5 rounded-full">
                    {testimonial.app}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
