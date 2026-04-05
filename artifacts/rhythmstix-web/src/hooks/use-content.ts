import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useContent() {
  return useQuery<Record<string, string>>({
    queryKey: ["site-content"],
    queryFn: async () => {
      const res = await fetch("/api/content");
      if (!res.ok) throw new Error("Failed to load content");
      return res.json();
    },
    staleTime: 60 * 1000,
  });
}

export function useContentValue(key: string, fallback: string): string {
  const { data } = useContent();
  return data?.[key] ?? fallback;
}

export function useSaveContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const res = await fetch(`/api/content/${encodeURIComponent(key)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ value }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<Record<string, string>>(["site-content"], (old) => ({
        ...old,
        [variables.key]: variables.value,
      }));
    },
  });
}
