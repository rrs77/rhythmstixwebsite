import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, Mail, Lock, User, CheckSquare } from "lucide-react";
import { Link } from "wouter";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [subscribe, setSubscribe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { register, isRegistering, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (isAuthenticated) navigate("/account");
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      await register({ email, password, firstName, lastName, subscribe });
      navigate("/account");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
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
              <img
                src={`${import.meta.env.BASE_URL}images/rhythmstix-logo-colour.png`}
                alt="Rhythmstix"
                className="h-16 w-auto mx-auto mb-2"
              />
              <h1 className="text-2xl font-bold">Create Your Account</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Join the Rhythmstix community
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 focus:border-[#3a9ca5]"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last"
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 focus:border-[#3a9ca5]"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
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

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 focus:border-[#3a9ca5]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm your password"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 focus:border-[#3a9ca5]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group py-1">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={subscribe}
                    onChange={(e) => setSubscribe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${subscribe ? "bg-[#3a9ca5] border-[#3a9ca5]" : "border-border group-hover:border-[#3a9ca5]/50"}`}>
                    {subscribe && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <span className="text-sm text-muted-foreground leading-snug">
                  Keep me updated with news, resources, and community updates from Rhythmstix
                </span>
              </label>

              <Button
                type="submit"
                disabled={isRegistering}
                className="w-full bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-[#3a9ca5] hover:underline">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
