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

  const registerMutation = useMutation({
    mutationFn: async (params: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      subscribe: boolean;
    }) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
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
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
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

export function useSubscription() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: async () => {
      const res = await fetch("/api/account/subscription", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to check subscription");
      return res.json() as Promise<{ configured: boolean; subscribed: boolean }>;
    },
    staleTime: 60 * 1000,
  });

  const toggleMutation = useMutation({
    mutationFn: async (subscribe: boolean) => {
      const res = await fetch("/api/account/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subscribe }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update subscription");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
    },
  });

  return {
    configured: data?.configured ?? false,
    subscribed: data?.subscribed ?? false,
    isLoading,
    toggleSubscription: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
  };
}

export async function forgotPassword(email: string) {
  const res = await fetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}
