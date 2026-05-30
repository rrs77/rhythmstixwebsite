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
  categorySlug?: string | null;
}

export interface OrderResult {
  orderId: number;
  publicId: string;
  status: string;
  total: string;
  currency?: string;
  paymentUrl: string | null;
  isFree: boolean;
}

export interface CheckoutBilling {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  company?: string;
}

export interface CreateOrderInput {
  items: { productId: number; quantity: number }[];
  billing: CheckoutBilling;
  voucherCode?: string;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderResult> {
  const res = await fetch("/api/shop/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Failed to create order");
  }
  return data as OrderResult;
}

export interface ValidatedVoucher {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrderValue: number;
  discount: number;
  total: number;
}

export async function validateVoucher(code: string, subtotal: number): Promise<ValidatedVoucher> {
  const res = await fetch("/api/shop/vouchers/validate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Voucher could not be applied");
  }
  return data as ValidatedVoucher;
}

export interface ConfirmedOrder {
  orderId: number;
  publicId: string;
  status: string;
  total: string;
  subtotal: string;
  discount: string;
  voucherCode: string | null;
  currency: string;
  email: string;
  items: { name: string; quantity: number; total: string; downloadable: boolean }[];
}

export async function confirmOrder(sessionId: string): Promise<ConfirmedOrder> {
  const res = await fetch(`/api/shop/orders/confirm?session_id=${encodeURIComponent(sessionId)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.error || "Failed to confirm order");
  }
  return data as ConfirmedOrder;
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

async function fetchCategoryProducts(category: string): Promise<ShopProduct[]> {
  const res = await fetch(`/api/shop/products?category=${encodeURIComponent(category)}`);
  if (!res.ok) throw new Error("Failed to fetch products");
  const rows = (await res.json()) as Array<{
    id: number;
    name: string;
    slug: string;
    price: string;
    regularPrice: string;
    salePrice: string;
    onSale: boolean;
    downloadable: boolean;
    description?: string;
    images: { src: string; alt: string }[];
  }>;
  return rows.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: p.price,
    regularPrice: p.regularPrice,
    salePrice: p.salePrice,
    onSale: p.onSale,
    downloadable: p.downloadable,
    description: p.description || "",
    images: p.images || [],
  }));
}

export function useCategoryProducts(category: string | null | undefined) {
  return useQuery({
    queryKey: ["shop-products-category", category],
    queryFn: () => fetchCategoryProducts(category as string),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}
