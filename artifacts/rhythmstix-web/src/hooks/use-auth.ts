import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  avatar: string;
}

export interface Order {
  id: number;
  number: string;
  status: string;
  dateCreated: string;
  total: string;
  currency: string;
  paymentMethod: string;
  items: {
    id: number;
    name: string;
    quantity: number;
    total: string;
    productId: number;
  }[];
  billing: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
  };
}

async function fetchMe() {
  const res = await fetch("/api/auth/me", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to check auth");
  return res.json() as Promise<{ authenticated: boolean; user: User | null }>;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["auth"],
    queryFn: fetchMe,
    staleTime: 60 * 1000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });

  return {
    user: data?.user ?? null,
    isAuthenticated: data?.authenticated ?? false,
    isLoading,
    login: loginMutation.mutateAsync,
    loginError: loginMutation.error?.message ?? null,
    isLoggingIn: loginMutation.isPending,
    logout: logoutMutation.mutateAsync,
  };
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await fetch("/api/account/orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json() as Promise<Order[]>;
    },
    staleTime: 2 * 60 * 1000,
  });
}

export async function forgotPassword(email: string) {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}
