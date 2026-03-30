import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useWPPosts } from "@/hooks/use-wp";
import { decodeHtml } from "@/lib/wordpress";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Shield, Eye, EyeOff, Lock, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

function useAdminCheck() {
  return useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const res = await fetch("/api/auth/admin-check", { credentials: "include" });
      const data = await res.json();
      return data.authenticated as boolean;
    },
    staleTime: 60 * 1000,
  });
}

function useHiddenPosts() {
  return useQuery({
    queryKey: ["hidden-posts"],
    queryFn: async () => {
      const res = await fetch("/api/hidden-posts", { credentials: "include" });
      return res.json() as Promise<number[]>;
    },
    staleTime: 30 * 1000,
  });
}

export default function BlogList() {
  const { data: posts, isLoading, error } = useWPPosts(50);
  const { data: isAdmin } = useAdminCheck();
  const { data: hiddenPosts = [] } = useHiddenPosts();
  const queryClient = useQueryClient();

  const [adminMode, setAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  const adminLoginMutation = useMutation({
    mutationFn: async (password: string) => {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error("Invalid password");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-check"] });
      setShowAdminLogin(false);
      setAdminPassword("");
      setAdminError("");
      setAdminMode(true);
    },
    onError: () => setAdminError("Invalid password"),
  });

  const togglePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      const current = hiddenPosts || [];
      const newHidden = current.includes(postId)
        ? current.filter((id) => id !== postId)
        : [...current, postId];
      const res = await fetch("/api/hidden-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postIds: newHidden }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return newHidden;
    },
    onSuccess: (newHidden) => {
      queryClient.setQueryData(["hidden-posts"], newHidden);
    },
  });

  const visiblePosts = posts?.filter((p) => adminMode || !hiddenPosts.includes(p.id));

  function handleAdminToggle() {
    if (isAdmin) {
      setAdminMode(!adminMode);
    } else {
      setShowAdminLogin(true);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-[rgb(52,154,167)]">Blog</h1>
              <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] mt-2" />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAdminToggle}
              className={cn(
                "text-xs gap-1.5",
                adminMode ? "text-[rgb(52,154,167)]" : "text-muted-foreground/50 hover:text-muted-foreground"
              )}
            >
              <Shield className="w-3.5 h-3.5" />
              {adminMode ? "Exit Admin" : "Admin"}
            </Button>
          </div>

          {showAdminLogin && !isAdmin && (
            <div className="mb-6 bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Lock className="w-4 h-4" />
                  Admin Login
                </div>
                <button onClick={() => { setShowAdminLogin(false); setAdminError(""); }} className="text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  adminLoginMutation.mutate(adminPassword);
                }}
                className="flex gap-2"
              >
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Admin password"
                  className="flex-grow px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(52,154,167)]/30"
                />
                <Button type="submit" size="sm" className="bg-[rgb(52,154,167)] hover:bg-[rgb(52,154,167)]/90 text-white">
                  Login
                </Button>
              </form>
              {adminError && <p className="text-red-500 text-xs mt-2">{adminError}</p>}
            </div>
          )}

          {adminMode && (
            <div className="mb-4 bg-[rgb(52,154,167)]/5 border border-[rgb(52,154,167)]/20 rounded-xl px-4 py-3 text-sm text-[rgb(52,154,167)]">
              <strong>Admin mode:</strong> Click the eye icon on any post to show/hide it from visitors.
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Unable to load posts. Please try again later.</p>
            </div>
          )}
          {visiblePosts && (
            <div className="grid gap-6">
              {visiblePosts.map((post, index) => {
                const isHidden = hiddenPosts.includes(post.id);
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="relative group/card"
                  >
                    <Link
                      href={`/post/${post.slug}`}
                      className={cn(
                        "block bg-card rounded-2xl p-6 border border-[#3a9ca5]/10 hover:border-[#3a9ca5]/40 transition-all duration-300 hover:shadow-lg hover:shadow-[#3a9ca5]/10 group",
                        isHidden && adminMode && "opacity-50 border-dashed"
                      )}
                    >
                      <h2 className="text-xl font-semibold mb-2 text-foreground group-hover:text-primary transition-colors">
                        {decodeHtml(post.title.rendered)}
                      </h2>
                      <div
                        className="text-muted-foreground text-sm line-clamp-2 mb-3"
                        dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                      />
                      <div className="flex items-center text-primary text-sm font-medium">
                        Read More <ArrowRight className="w-4 h-4 ml-1" />
                      </div>
                    </Link>
                    {adminMode && (
                      <button
                        onClick={() => togglePostMutation.mutate(post.id)}
                        disabled={togglePostMutation.isPending}
                        className={cn(
                          "absolute top-3 right-3 p-2 rounded-lg transition-all",
                          isHidden
                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                            : "bg-emerald-100 text-emerald-600 hover:bg-emerald-200"
                        )}
                        title={isHidden ? "Show this post" : "Hide this post"}
                      >
                        {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
