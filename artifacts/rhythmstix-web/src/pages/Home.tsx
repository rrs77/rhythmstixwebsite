import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { Testimonials } from "@/components/home/Testimonials";
import { ProductGrid } from "@/components/home/ProductGrid";
import { ELearningSection } from "@/components/home/ELearningSection";
import { SchoolsSection } from "@/components/home/SchoolsSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        <ProductGrid />
        <Testimonials />
        <ELearningSection />
        <SchoolsSection />
      </main>

      <Footer />
    </div>
  );
}
