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
    <section className="py-8 bg-gradient-to-br from-[#3a9ca5]/[0.02] via-secondary/10 to-[#4cb5bd]/[0.02] relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-5"
        >
          <EditableText
            contentKey="testimonials.heading"
            fallback="What People Say"
            as="h2"
            className="text-lg font-bold mb-1.5 text-muted-foreground"
          />
          <div className="w-10 h-0.5 bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] mx-auto rounded-full" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 max-w-5xl mx-auto">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="bg-card rounded-lg p-4 border border-[#3a9ca5]/8 hover:border-[#3a9ca5]/20 transition-colors duration-300 flex flex-col"
            >
              <Quote className="w-4 h-4 text-[#3a9ca5]/15 mb-2 rotate-180 shrink-0" />
              <div className="text-xs text-foreground leading-relaxed mb-3 flex-grow">
                <EditableText
                  contentKey={`testimonial.${testimonial.id}.quote`}
                  fallback={testimonial.quote}
                  as="p"
                  className="text-xs text-foreground leading-relaxed"
                  multiline
                >
                  {(value) => <span>"{value}"</span>}
                </EditableText>
              </div>
              <div className="border-t border-border/40 pt-2">
                <EditableText
                  contentKey={`testimonial.${testimonial.id}.author`}
                  fallback={testimonial.author}
                  as="p"
                  className="text-[11px] font-semibold text-[#3a9ca5]"
                />
                <EditableText
                  contentKey={`testimonial.${testimonial.id}.org`}
                  fallback={testimonial.organization}
                  as="p"
                  className="text-[10px] text-muted-foreground"
                />
                {testimonial.app && (
                  <span className="inline-block mt-1 text-[9px] font-medium text-[#3a9ca5]/60 bg-[#3a9ca5]/6 px-1.5 py-0.5 rounded-full">
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
