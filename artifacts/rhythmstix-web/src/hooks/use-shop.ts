import { useQuery } from "@tanstack/react-query";

export interface ShopProduct {
  id: number;
  name: string;
  slug: string;
  price: string;
  regularPrice: string;
  salePrice: string;
  onSale: boolean;
  downloadable: boolean;
  description: string;
  images: { src: string; alt: string }[];
}

export interface ProductFamily {
  id: string;
  title: string;
  description: string;
  priceLabel: string;
  image: { src: string; alt: string } | null;
  products: ShopProduct[];
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

async function fetchGroupedProducts(): Promise<ProductFamily[]> {
  const res = await fetch("/api/shop/products?grouped=true");
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export function useGroupedProducts() {
  return useQuery({
    queryKey: ["shop-products-grouped"],
    queryFn: fetchGroupedProducts,
    staleTime: 5 * 60 * 1000,
  });
}
