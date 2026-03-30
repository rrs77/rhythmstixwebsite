import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ELearningSection } from "@/components/home/ELearningSection";
import { SchoolsSection } from "@/components/home/SchoolsSection";
import { motion } from "framer-motion";

export default function Resources() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-grow pt-24">
        <div className="container mx-auto px-4 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Resources</h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Music resources, e-learning courses, and downloadable materials for your classroom.
            </p>
          </motion.div>
        </div>

        <SchoolsSection />
        <ELearningSection />
      </main>

      <Footer />
    </div>
  );
}
