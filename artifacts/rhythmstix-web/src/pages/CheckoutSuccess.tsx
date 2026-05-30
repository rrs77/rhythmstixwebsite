import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useBasket } from "@/contexts/BasketContext";
import { useAuth } from "@/hooks/use-auth";
import { confirmOrder, type ConfirmedOrder } from "@/hooks/use-shop";
import { CheckCircle2, Loader2, Package, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

function formatPrice(amount: string) {
  const n = parseFloat(amount);
  return Number.isFinite(n) ? `£${n.toFixed(2)}` : amount;
}

export default function CheckoutSuccess() {
  const [, navigate] = useLocation();
  const { clear } = useBasket();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setError("Missing session id. If you were charged, please contact support.");
      setStatus("error");
      return;
    }
    (async () => {
      try {
        const data = await confirmOrder(sessionId);
        setOrder(data);
        setStatus("ok");
        // Only clear the basket once we know the order succeeded.
        if (data.status === "paid" || data.status === "free") {
          clear();
        }
      } catch (err: any) {
        setError(err?.message || "We could not confirm your order.");
        setStatus("error");
      }
    })();
  }, [clear]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-xl">
          {status === "loading" && (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#3a9ca5] mx-auto mb-4" />
              <h1 className="text-xl font-semibold mb-1">Confirming your order…</h1>
              <p className="text-sm text-muted-foreground">This usually takes just a moment.</p>
            </div>
          )}

          {status === "error" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-8 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">We couldn't confirm that order</h1>
              <p className="text-muted-foreground mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => navigate("/shop")}>Back to shop</Button>
                {isAuthenticated && (
                  <Button className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
                    <Link href="/account">View account</Link>
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {status === "ok" && order && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-8"
            >
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold mb-1">
                  {order.status === "paid" || order.status === "free"
                    ? "Thank you for your order!"
                    : "Order received"}
                </h1>
                <p className="text-muted-foreground mb-1">
                  Order <span className="font-semibold text-foreground">#{order.publicId}</span>
                </p>
                <p className="text-muted-foreground mb-6">
                  A confirmation email is on its way to <span className="font-medium">{order.email}</span>.
                </p>
              </div>

              <div className="bg-secondary/40 rounded-lg p-4 mb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</p>
                <ul className="space-y-2 text-sm">
                  {order.items.map((it, i) => (
                    <li key={i} className="flex justify-between gap-3">
                      <span className="flex items-center gap-2 min-w-0">
                        <Package className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span className="truncate">{it.name}</span>
                        {it.quantity > 1 && <span className="text-muted-foreground shrink-0">×{it.quantity}</span>}
                      </span>
                      <span className="tabular-nums font-medium shrink-0">{formatPrice(it.total)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-1.5 text-sm border-t border-border pt-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
                </div>
                {parseFloat(order.discount) > 0 && (
                  <div className="flex justify-between text-[#3a9ca5]">
                    <span>{order.voucherCode ? `Voucher ${order.voucherCode}` : "Discount"}</span>
                    <span className="tabular-nums">−{formatPrice(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-border mt-2">
                  <span className="font-bold">Total paid</span>
                  <span className="text-lg font-bold text-[#3a9ca5] tabular-nums">{formatPrice(order.total)}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-center mt-6">
                <Button variant="outline" asChild>
                  <Link href="/shop">Back to shop</Link>
                </Button>
                {isAuthenticated && (
                  <Button className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
                    <Link href="/account">View account</Link>
                  </Button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
