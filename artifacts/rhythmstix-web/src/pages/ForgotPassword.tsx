import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { forgotPassword } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { KeyRound, Loader2, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await forgotPassword(email);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-[#3a9ca5] to-[#4cb5bd] shadow-md">
                <KeyRound className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold">Reset Password</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Enter your email and we'll send you a reset link
              </p>
            </div>

            {submitted ? (
              <div className="bg-card rounded-2xl border border-border p-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <h2 className="font-semibold text-lg mb-2">Check Your Email</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  If an account exists with <strong>{email}</strong>, you'll receive a password reset link shortly. Please check your inbox and spam folder.
                </p>
                <Button variant="outline" asChild>
                  <Link href="/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 focus:border-[#3a9ca5]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/login" className="text-xs text-[#3a9ca5] hover:underline">
                    <ArrowLeft className="w-3 h-3 inline mr-1" />
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
