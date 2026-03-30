import { useQuery } from "@tanstack/react-query";

export interface ShopProduct {
  id: number;
  name: string;
  slug: string;
  type: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  onSale: boolean;
  downloadable: boolean;
  virtual: boolean;
  purchasable: boolean;
  description: string;
  permalink: string;
  images: { id: number; src: string; alt: string }[];
  categories: { id: number; name: string; slug: string }[];
  attributes: { name: string; options: string[] }[];
}

export interface OrderResult {
  orderId: number;
  status: string;
  total: string;
  paymentUrl: string | null;
  downloads: { name: string; url: string }[];
}

export async function createOrder(productId: number, quantity = 1): Promise<OrderResult> {
  const res = await fetch("/api/shop/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productId, quantity }),
  });
  if (res.status === 401) {
    throw new Error("LOGIN_REQUIRED");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create order");
  }
  return res.json();
}

export interface ShopCategory {
  id: number;
  name: string;
  slug: string;
  count: number;
  image: { src: string; alt: string } | null;
}

async function fetchProducts(category?: string): Promise<ShopProduct[]> {
  const params = category ? `?category=${category}` : "";
  const res = await fetch(`/api/shop/products${params}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

async function fetchCategories(): Promise<ShopCategory[]> {
  const res = await fetch("/api/shop/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export function useShopProducts(category?: string) {
  return useQuery({
    queryKey: ["shop-products", category],
    queryFn: () => fetchProducts(category),
    staleTime: 5 * 60 * 1000,
  });
}

export function useShopCategories() {
  return useQuery({
    queryKey: ["shop-categories"],
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000,
  });
}
