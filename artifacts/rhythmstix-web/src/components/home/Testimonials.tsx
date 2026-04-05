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
    <section className="py-10 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-white" />
      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-6"
        >
          <EditableText
            contentKey="testimonials.heading"
            fallback="Trusted by Educators"
            as="h2"
            className="text-lg font-bold mb-1 text-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Hear from teachers and students using our tools every day.
          </p>
          <div className="w-10 h-0.5 bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] mx-auto rounded-full mt-2" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="bg-white rounded-xl p-5 border border-slate-100 hover:border-[#3a9ca5]/20 hover:shadow-md transition-all duration-300 flex flex-col relative"
            >
              <Quote className="w-6 h-6 text-[#3a9ca5]/10 mb-2 rotate-180 shrink-0" />
              <div className="text-xs text-foreground/90 leading-relaxed mb-4 flex-grow italic">
                <EditableText
                  contentKey={`testimonial.${testimonial.id}.quote`}
                  fallback={testimonial.quote}
                  as="p"
                  className="text-xs text-foreground/90 leading-relaxed italic"
                  multiline
                >
                  {(value) => <span>"{value}"</span>}
                </EditableText>
              </div>
              <div className="border-t border-slate-100 pt-3 mt-auto">
                <EditableText
                  contentKey={`testimonial.${testimonial.id}.author`}
                  fallback={testimonial.author}
                  as="p"
                  className="text-xs font-semibold text-foreground"
                />
                <EditableText
                  contentKey={`testimonial.${testimonial.id}.org`}
                  fallback={testimonial.organization}
                  as="p"
                  className="text-[10px] text-muted-foreground mt-0.5"
                />
                {testimonial.app && (
                  <span className="inline-block mt-1.5 text-[10px] font-medium text-[#3a9ca5] bg-[#3a9ca5]/8 px-2 py-0.5 rounded-full">
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
