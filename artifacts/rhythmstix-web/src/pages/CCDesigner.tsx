import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Palette,
  BookOpen,
  Layers,
  Cloud,
  Smartphone,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Link } from "wouter";

const FEATURES = [
  {
    icon: BookOpen,
    title: "Lesson Library",
    description:
      "Build a structured library of lessons and activities organised by half-terms, units, categories, and year groups. Every good idea is captured and ready to reuse.",
  },
  {
    icon: Layers,
    title: "Curriculum Mapping",
    description:
      "Map lessons and activities to EYFS, KS1, and KS2 frameworks — including LKG, UKG, Reception, and custom year groups you define in settings.",
  },
  {
    icon: Cloud,
    title: "Cloud Sync",
    description:
      "Data is stored and synced via cloud storage so teams can work from different devices. Changes made by one colleague are available to everyone.",
  },
  {
    icon: Smartphone,
    title: "PWA-Ready",
    description:
      "Built with PWA-style behaviour so it feels app-like on any device and remains usable even when connectivity is patchy.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Designed for curriculum teams who need consistent naming and structure without losing flexibility. Admin tools let you set custom year groups, categories, and branding.",
  },
  {
    icon: Palette,
    title: "White-Label Branding",
    description:
      "Optional white-label support — customise logos, titles, footer content, and social links to match your school or trust's identity.",
  },
];

const PROS = [
  "Single place to design, store, and reuse curriculum-ready content",
  "Structured by half-terms, units, categories, and year groups",
  "Rich activity details: timings, levels, resource links (video, audio, scores, lyrics)",
  "Cloud-synced so teams can collaborate across devices",
  "PWA behaviour — works offline and feels native on tablets",
  "Captures lesson inspiration so good ideas aren't forgotten",
  "Admin controls for custom year groups, categories, and branding",
  "Maps directly to EYFS, KS1, and KS2 curriculum frameworks",
  "Replaces scattered documents and spreadsheets with one coherent system",
  "White-label ready for multi-academy trusts and music hubs",
];

const CONS = [
  "Requires initial setup time to structure your year groups and categories",
  "Best suited for music and creative arts — may need adaptation for other subjects",
  "Cloud sync requires internet for initial data load",
  "Team features work best when all staff adopt the platform together",
];

export default function CCDesigner() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <section className="container mx-auto px-4 max-w-5xl">
          <Button variant="ghost" className="mb-6 text-muted-foreground" asChild>
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-start gap-5 mb-6">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-rose-500 to-amber-400 shadow-md shrink-0">
                <Palette className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  CCDesigner
                </h1>
                <p className="text-xl text-muted-foreground mt-1">
                  Creative Curriculum Designer
                </p>
              </div>
            </div>

            <p className="text-lg text-foreground leading-relaxed mb-6 max-w-3xl">
              CCDesigner is a web app for planning and organising music and
              creative curriculum content for early years and primary settings.
              It helps teachers map lessons and activities to EYFS, KS1, and KS2
              — including structures like LKG, UKG, Reception, and year groups
              you define in settings — so planning stays coherent across classes
              and terms.
            </p>

            <p className="text-lg text-foreground leading-relaxed mb-6 max-w-3xl">
              The app centres on a lesson library and activity workflow: you can
              structure work by half-terms, units, categories, and year groups,
              attach rich descriptions and standards where you use them, and
              manage activity details such as timings, levels, and resource links
              — for example video, audio, scores, and lyrics. Data is stored and
              synced via cloud storage so teams can work from different devices;
              it is also set up with PWA-style behaviour so it can feel more
              app-like and remain usable when connectivity is patchy.
            </p>

            <p className="text-lg text-foreground leading-relaxed mb-8 max-w-3xl">
              It was designed so those moments of inspiration that are often
              forgotten in a lesson can be captured and reused — so a good idea
              on Tuesday is still there when you plan again next week or next
              year. In short, CCDesigner is a single place to design, store, and
              reuse curriculum-ready lesson and activity content rather than
              scattering it across documents and spreadsheets.
            </p>

            <div className="mb-12">
              <Button size="lg" className="group" asChild>
                <a
                  href="https://www.ccdesigner.co.uk/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit CCDesigner
                  <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-foreground">
              Key Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center bg-gradient-to-br from-rose-500/10 to-amber-400/10">
                    <feature.icon className="w-5 h-5 text-rose-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border border-border"
            >
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                Pros
              </h2>
              <ul className="space-y-3">
                {PROS.map((pro) => (
                  <li key={pro} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                    <span className="text-foreground text-sm">{pro}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-card rounded-2xl p-8 border border-border"
            >
              <h2 className="text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                Considerations
              </h2>
              <ul className="space-y-3">
                {CONS.map((con) => (
                  <li key={con} className="flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-500 mt-1 shrink-0" />
                    <span className="text-foreground text-sm">{con}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-rose-50 to-amber-50 rounded-2xl p-8 md:p-12 border border-rose-200/50 text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              Ready to streamline your curriculum planning?
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Stop scattering lesson plans across documents and spreadsheets.
              CCDesigner gives you one coherent system to design, store, and
              reuse your best creative curriculum content.
            </p>
            <Button size="lg" className="group" asChild>
              <a
                href="https://www.ccdesigner.co.uk/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Started with CCDesigner
                <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </Button>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
