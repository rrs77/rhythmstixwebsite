import { useQuery } from "@tanstack/react-query";
import { getPage, getPosts, getPost, getPages } from "@/lib/wordpress";

export function useWPPage(slug: string) {
  return useQuery({
    queryKey: ["wp-page", slug],
    queryFn: () => getPage(slug),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWPPost(slug: string) {
  return useQuery({
    queryKey: ["wp-post", slug],
    queryFn: () => getPost(slug),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWPPosts(perPage = 20) {
  return useQuery({
    queryKey: ["wp-posts", perPage],
    queryFn: () => getPosts(perPage),
    staleTime: 5 * 60 * 1000,
  });
}

export function useWPPages() {
  return useQuery({
    queryKey: ["wp-pages"],
    queryFn: () => getPages(),
    staleTime: 5 * 60 * 1000,
  });
}
