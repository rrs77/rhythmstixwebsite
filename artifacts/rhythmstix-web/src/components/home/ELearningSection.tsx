import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export function ELearningSection() {
  return (
    <section id="elearning" className="py-24 bg-secondary/30 border-y border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-12 lg:gap-20">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1 w-full"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/40 group aspect-video md:aspect-[4/3] border border-border/50">
              <img 
                src={`${import.meta.env.BASE_URL}images/bandlab-cover.png`}
                alt="BandLab Interface"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex-1"
          >
            <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-3">E-Learning</h2>
            <h3 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">BandLab — Let's Get Started</h3>
            <p className="text-lg text-muted-foreground mb-8">
              Dive into music production with our comprehensive starter guide for BandLab. Perfect for classroom integration or independent student learning. Master the basics of recording, mixing, and creating loops.
            </p>
            <ul className="space-y-4 mb-8">
              {[
                "Step-by-step video tutorials",
                "Downloadable lesson plans and resources",
                "Interactive quizzes to test knowledge"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-foreground/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <Button size="lg" asChild>
              <Link href="/elearning">Learn More</Link>
            </Button>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
