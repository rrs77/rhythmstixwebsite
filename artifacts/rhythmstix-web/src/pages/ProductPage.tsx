import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertCircle, ImageIcon, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface ProductPageProps {
  name: string;
  subtitle: string;
  icon: LucideIcon;
  description: string[];
  features: Feature[];
  pros: string[];
  considerations: string[];
  ctaHeading: string;
  ctaText: string;
  heroImage?: string;
  screenshots?: string[];
}

export default function ProductPage({
  name,
  subtitle,
  icon: Icon,
  description,
  features,
  pros,
  considerations,
  ctaHeading,
  ctaText,
  heroImage,
  screenshots,
}: ProductPageProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#3a9ca5] to-[#4cb5bd] shadow-md shrink-0">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                  {name}
                </h1>
                <p className="text-xl text-muted-foreground mt-1">
                  {subtitle}
                </p>
              </div>
            </div>

            {heroImage ? (
              <div className="mb-8 rounded-2xl overflow-hidden border border-border">
                <img src={heroImage} alt={name} className="w-full h-auto" />
              </div>
            ) : (
              <div className="mb-8 rounded-2xl overflow-hidden border border-border bg-gradient-to-br from-[#3a9ca5]/5 to-[#4cb5bd]/10 flex items-center justify-center h-64">
                <div className="text-center text-muted-foreground/40">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">Product image coming soon</p>
                </div>
              </div>
            )}

            {description.map((para, i) => (
              <p key={i} className="text-lg text-foreground leading-relaxed mb-6 max-w-3xl">
                {para}
              </p>
            ))}

            <div className="mb-12">
              <Button size="lg" className="group bg-[#3a9ca5] hover:bg-[#4cb5bd]" asChild>
                <Link href="/contact">
                  Enquire About {name}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </motion.div>

          {screenshots && screenshots.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-16"
            >
              <h2 className="text-3xl font-bold mb-8 text-foreground">Screenshots</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {screenshots.map((src, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden border border-border">
                    <img src={src} alt={`${name} screenshot ${i + 1}`} className="w-full h-auto" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-8 text-foreground">Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-card rounded-2xl p-6 border border-border hover:border-[#3a9ca5]/30 transition-all"
                >
                  <div className="w-11 h-11 rounded-xl mb-4 flex items-center justify-center bg-[#3a9ca5]/10">
                    <feature.icon className="w-5 h-5 text-[#3a9ca5]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
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
                {pros.map((pro) => (
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
                {considerations.map((con) => (
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
            className="bg-gradient-to-br from-[#3a9ca5]/5 to-[#4cb5bd]/10 rounded-2xl p-8 md:p-12 border border-[#3a9ca5]/20 text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-foreground">
              {ctaHeading}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {ctaText}
            </p>
            <Button size="lg" className="group bg-[#3a9ca5] hover:bg-[#4cb5bd]" asChild>
              <Link href="/contact">
                Get In Touch
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
