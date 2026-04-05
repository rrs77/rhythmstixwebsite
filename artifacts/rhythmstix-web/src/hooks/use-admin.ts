import { useQuery } from "@tanstack/react-query";

export function useAdminMode() {
  return useQuery({
    queryKey: ["admin-check"],
    queryFn: async () => {
      const res = await fetch("/api/auth/admin-check", { credentials: "include" });
      if (!res.ok) return false;
      const data = await res.json();
      return data.authenticated as boolean;
    },
    staleTime: 60 * 1000,
  });
}
