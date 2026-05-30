import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface BasketItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  slug?: string;
  familyId?: string;
  downloadable?: boolean;
}

export interface AppliedVoucher {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrderValue: number;
  discount: number;
}

interface BasketState {
  items: BasketItem[];
  count: number;
  subtotal: number;
  voucher: AppliedVoucher | null;
  discount: number;
  total: number;
  add: (item: Omit<BasketItem, "quantity"> & { quantity?: number }) => void;
  remove: (productId: number) => void;
  setQuantity: (productId: number, quantity: number) => void;
  clear: () => void;
  applyVoucher: (voucher: AppliedVoucher) => void;
  clearVoucher: () => void;
}

const STORAGE_KEY = "rhythmstix.basket.v1";
const VOUCHER_STORAGE_KEY = "rhythmstix.voucher.v1";

const BasketContext = createContext<BasketState | null>(null);

function loadInitial(): BasketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((it) => it && typeof it.productId === "number" && typeof it.name === "string")
      .map((it) => ({
        productId: it.productId,
        name: it.name,
        price: typeof it.price === "number" ? it.price : parseFloat(it.price) || 0,
        quantity: typeof it.quantity === "number" && it.quantity > 0 ? it.quantity : 1,
        image: it.image ?? null,
        slug: it.slug,
        familyId: it.familyId,
        downloadable: !!it.downloadable,
      }));
  } catch {
    return [];
  }
}

function loadInitialVoucher(): AppliedVoucher | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(VOUCHER_STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (
      v &&
      typeof v.code === "string" &&
      (v.discountType === "percentage" || v.discountType === "fixed") &&
      typeof v.discountValue === "number"
    ) {
      return {
        code: v.code,
        discountType: v.discountType,
        discountValue: v.discountValue,
        minimumOrderValue: typeof v.minimumOrderValue === "number" ? v.minimumOrderValue : 0,
        discount: typeof v.discount === "number" ? v.discount : 0,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function computeDiscount(voucher: AppliedVoucher, subtotal: number): number {
  if (subtotal <= 0) return 0;
  if (voucher.discountType === "percentage") {
    const pct = Math.max(0, Math.min(100, voucher.discountValue));
    // Match server: floor at pence precision, then convert back to £.
    return Math.floor(subtotal * pct) / 100;
  }
  // fixed: discountValue is in £ on the client (converted from pence in VoucherInput).
  return Math.min(voucher.discountValue, subtotal);
}

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<BasketItem[]>(() => loadInitial());
  const [voucher, setVoucher] = useState<AppliedVoucher | null>(() => loadInitialVoucher());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage quota / privacy mode — silently ignore.
    }
  }, [items]);

  useEffect(() => {
    try {
      if (voucher) {
        window.localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(voucher));
      } else {
        window.localStorage.removeItem(VOUCHER_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [voucher]);

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(loadInitial());
      if (e.key === VOUCHER_STORAGE_KEY) setVoucher(loadInitialVoucher());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback<BasketState["add"]>((item) => {
    setItems((prev) => {
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const existingIdx = prev.findIndex((i) => i.productId === item.productId);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = { ...next[existingIdx], quantity: next[existingIdx].quantity + qty };
        return next;
      }
      return [...prev, { ...item, quantity: qty }];
    });
  }, []);

  const remove = useCallback<BasketState["remove"]>((productId) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setQuantity = useCallback<BasketState["setQuantity"]>((productId, quantity) => {
    setItems((prev) => {
      if (quantity <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setVoucher(null);
  }, []);

  const applyVoucher = useCallback<BasketState["applyVoucher"]>((v) => {
    setVoucher(v);
  }, []);

  const clearVoucher = useCallback(() => setVoucher(null), []);

  const value = useMemo<BasketState>(() => {
    const count = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    // Re-derive the discount client-side so it stays in sync if the basket
    // changes after a voucher was applied. The server is still the source of
    // truth at order creation time.
    let liveVoucher: AppliedVoucher | null = voucher;
    let discount = 0;
    if (voucher) {
      // Drop the voucher silently if the basket no longer meets the minimum.
      if (subtotal * 100 < voucher.minimumOrderValue) {
        liveVoucher = voucher; // keep displayed but warn via UI
        discount = 0;
      } else {
        discount = computeDiscount(voucher, subtotal);
        liveVoucher = { ...voucher, discount };
      }
    }
    const total = Math.max(0, subtotal - discount);
    return {
      items, count, subtotal,
      voucher: liveVoucher,
      discount, total,
      add, remove, setQuantity, clear,
      applyVoucher, clearVoucher,
    };
  }, [items, voucher, add, remove, setQuantity, clear, applyVoucher, clearVoucher]);

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

export function useBasket(): BasketState {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used within a BasketProvider");
  return ctx;
}
