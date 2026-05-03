import { useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useAdminMode } from "@/hooks/use-admin";

interface ProtectedRouteProps {
  children: ReactNode;
  require?: "user" | "admin";
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  require = "user",
  redirectTo,
}: ProtectedRouteProps) {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useAdminMode();

  const isLoading = require === "admin" ? adminLoading : authLoading;
  const allowed =
    require === "admin" ? Boolean(isAdmin) : Boolean(isAuthenticated);
  const fallback = redirectTo ?? (require === "admin" ? "/admin" : "/login");

  useEffect(() => {
    if (!isLoading && !allowed) {
      navigate(fallback);
    }
  }, [isLoading, allowed, navigate, fallback]);

  if (isLoading || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" />
      </div>
    );
  }

  return <>{children}</>;
}
