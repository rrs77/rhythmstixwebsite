import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { Testimonials } from "@/components/home/Testimonials";
import { ProductGrid } from "@/components/home/ProductGrid";
import { AppCreator } from "@/components/home/AppCreator";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        <Hero />
        <ProductGrid />
        <AppCreator />
        <Testimonials />
      </main>

      <Footer />
    </div>
  );
}
