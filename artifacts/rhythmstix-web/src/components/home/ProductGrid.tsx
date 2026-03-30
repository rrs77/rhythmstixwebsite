import { motion } from "framer-motion";
import { 
  CalendarDays, 
  TrendingUp, 
  GraduationCap,
  Palette,
  ClipboardCheck,
  ArrowRight,
  BookOpen,
  Video,
  FileText,
  LogIn
} from "lucide-react";
import { Link } from "wouter";

const PRODUCTS = [
  {
    id: "ccdesigner",
    title: "CCDesigner",
    description: "Creative Curriculum Designer — plan, organise, and reuse curriculum content across EYFS, KS1, and KS2.",
    icon: Palette,
    color: "from-[#3a9ca5] to-[#2d8890]",
    link: "/ccdesigner",
    cta: "Learn More"
  },
  {
    id: "assessify",
    title: "Assessify",
    description: "Fair and personalised assessment for Performing Arts. AI-powered reports, customisable rubrics, and detailed analytics.",
    icon: ClipboardCheck,
    color: "from-[#2d8890] to-[#3a9ca5]",
    link: "/assessify",
    cta: "Learn More"
  },
  {
    id: "perifeedback",
    title: "PeriFeedback",
    description: "Feedback and scheduling solution for peripatetic teachers and school departments.",
    icon: CalendarDays,
    color: "from-[#4cb5bd] to-[#3a9ca5]",
    link: "/perifeedback",
    cta: "Learn More"
  },
  {
    id: "progresspath",
    title: "ProgressPath",
    description: "Visualise student journeys. Map out clear progression routes from early years to advanced levels.",
    icon: TrendingUp,
    color: "from-[#2d8890] to-[#3a9ca5]",
    link: "/progresspath",
    cta: "Learn More"
  }
];

const PLATFORM_FEATURES = [
  { icon: Video, label: "Video tutorials" },
  { icon: FileText, label: "Lesson plans & resources" },
  { icon: BookOpen, label: "Interactive quizzes" },
];

export function ProductGrid() {
  return (
    <section id="products" className="py-16 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-[#3a9ca5] to-[#4cb5bd]" />
            <h2 className="text-3xl md:text-4xl font-bold">Our Apps & Tools</h2>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl ml-5">
            A cohesive suite of applications designed specifically to make teaching, assessing, and learning easier.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {PRODUCTS.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
            >
              <Link
                href={product.link}
                className="group block relative bg-card rounded-2xl p-6 border border-border hover:border-[#3a9ca5]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#3a9ca5]/10 hover:-translate-y-1 h-full"
              >
                <div className={`w-12 h-12 rounded-xl mb-5 flex items-center justify-center bg-gradient-to-br ${product.color} shadow-md`}>
                  <product.icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-[#3a9ca5] transition-colors">
                  {product.title}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-5 line-clamp-3">
                  {product.description}
                </p>
                
                <div className="flex items-center text-[#3a9ca5] text-sm font-medium">
                  {product.cta}
                  <ArrowRight className="ml-1.5 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-10 rounded-2xl bg-gradient-to-r from-[#3a9ca5]/5 via-[#4cb5bd]/8 to-[#3a9ca5]/5 border border-[#3a9ca5]/15 p-6 md:p-8 text-center"
        >
          <p className="text-muted-foreground text-sm md:text-base">
            All our apps are designed to work together — giving schools a{" "}
            <span className="text-[#3a9ca5] font-semibold">complete toolkit</span> for music education.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-1.5 h-10 rounded-full bg-gradient-to-b from-[#3a9ca5] to-[#4cb5bd]" />
            <h2 className="text-3xl md:text-4xl font-bold">E-Learning Platform</h2>
          </div>

          <a
            href="https://app.rhythmstix.co.uk/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-2xl border border-[#3a9ca5]/20 bg-gradient-to-br from-[#3a9ca5]/[0.04] to-[#4cb5bd]/[0.06] hover:border-[#3a9ca5]/40 hover:shadow-lg hover:shadow-[#3a9ca5]/10 transition-all duration-300 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row items-stretch">
              <div className="md:w-2/5 bg-gradient-to-br from-[#1a2332] to-[#0d1821] p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3a9ca5] to-[#4cb5bd] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#3a9ca5]/30">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white/90 font-bold text-lg">rhythmstix</p>
                  <p className="text-[#4cb5bd] text-sm font-medium">Learning Portal</p>
                </div>
              </div>

              <div className="md:w-3/5 p-6 md:p-8">
                <p className="text-xs font-semibold text-[#3a9ca5] uppercase tracking-wider mb-2">Interactive Learning</p>
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 group-hover:text-[#3a9ca5] transition-colors">
                  Comprehensive Digital Courses & Resources
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-5">
                  Ready-to-teach differentiated lessons with video, audio, quizzes, and built-in assessment. Curriculum-aligned content for modern music education — works on any device.
                </p>

                <div className="flex flex-wrap gap-4 mb-6">
                  {PLATFORM_FEATURES.map((feat) => (
                    <div key={feat.label} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <feat.icon className="w-4 h-4 text-[#3a9ca5]" />
                      {feat.label}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3a9ca5] text-white font-medium text-sm group-hover:bg-[#2d8890] transition-colors shadow-sm">
                    <LogIn className="w-4 h-4" />
                    Open Learning Portal
                  </span>
                  <ArrowRight className="w-5 h-5 text-[#3a9ca5] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
