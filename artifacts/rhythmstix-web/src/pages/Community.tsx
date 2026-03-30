import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { MessageSquare, Users, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Community() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Community Forum</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Join the Rhythmstix community — share ideas, ask questions, and connect with other educators.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-card rounded-2xl border border-border p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-[#3a9ca5]/10">
                <MessageSquare className="w-6 h-6 text-[#3a9ca5]" />
              </div>
              <h3 className="font-semibold mb-2">Discuss & Share</h3>
              <p className="text-sm text-muted-foreground">
                Post questions, share teaching ideas, and get advice from fellow educators.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="bg-card rounded-2xl border border-border p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-[#3a9ca5]/10">
                <Users className="w-6 h-6 text-[#3a9ca5]" />
              </div>
              <h3 className="font-semibold mb-2">Connect</h3>
              <p className="text-sm text-muted-foreground">
                Network with music teachers, peripatetic instructors, and curriculum leads.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-card rounded-2xl border border-border p-6 text-center"
            >
              <div className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-[#3a9ca5]/10">
                <LogIn className="w-6 h-6 text-[#3a9ca5]" />
              </div>
              <h3 className="font-semibold mb-2">Your Account</h3>
              <p className="text-sm text-muted-foreground">
                Log in with your existing Rhythmstix account to participate in discussions.
              </p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="bg-gradient-to-br from-[#3a9ca5]/5 to-[#4cb5bd]/10 rounded-2xl p-8 md:p-12 border border-[#3a9ca5]/20 text-center"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Join the Community</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              The Rhythmstix community is a place for educators to share ideas, collaborate, and grow together. Get in touch to find out more about joining.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
                <Link href="/contact">
                  Get In Touch
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
