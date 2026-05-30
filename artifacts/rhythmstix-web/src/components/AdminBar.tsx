import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAdminMode } from "@/hooks/use-admin";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Lock, LogOut, X, Loader2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminBar() {
  const { data: isAdmin } = useAdminMode();
  const [location] = useLocation();
  const onAdminPage = location === "/admin" || location.startsWith("/admin/");
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (pw: string) => {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) throw new Error("Invalid password");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-check"] });
      setShowLogin(false);
      setPassword("");
      setError("");
    },
    onError: () => setError("Invalid password"),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-check"] });
    },
  });

  if (isAdmin) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-[#3a9ca5] text-white px-4 py-2 flex items-center justify-between text-sm shadow-lg">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span className="font-medium">Admin Mode</span>
          <span className="text-white/70 text-xs hidden sm:inline">— Hover over text to edit</span>
        </div>
        <div className="flex items-center gap-2">
          {!onAdminPage && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium"
            >
              <Settings className="w-3 h-3" />
              Admin Settings
            </Link>
          )}
          <button
            onClick={() => logoutMutation.mutate()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors text-xs font-medium"
          >
            <LogOut className="w-3 h-3" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (showLogin) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] bg-card rounded-xl border border-border shadow-xl p-4 w-72">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lock className="w-4 h-4 text-[#3a9ca5]" />
            Admin Login
          </div>
          <button onClick={() => { setShowLogin(false); setError(""); }} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(password); }}
          className="space-y-2"
        >
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full px-3 py-2 rounded-lg bg-[#3a9ca5] hover:bg-[#2d8890] text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Login"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowLogin(true)}
      className="fixed bottom-4 right-4 z-[100] w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground/40 hover:text-[#3a9ca5] hover:border-[#3a9ca5]/30 transition-all"
      title="Admin Login"
    >
      <Shield className="w-4 h-4" />
    </button>
  );
}
