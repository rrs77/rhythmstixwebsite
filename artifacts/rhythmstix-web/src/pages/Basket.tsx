import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useBasket } from "@/contexts/BasketContext";
import { VoucherInput } from "@/components/shop/VoucherInput";
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Package, ArrowLeft, Tag } from "lucide-react";
import { motion } from "framer-motion";

function formatPrice(n: number) {
  return `£${n.toFixed(2)}`;
}

export default function Basket() {
  const { items, count, subtotal, discount, total, voucher, remove, setQuantity } = useBasket();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Button variant="ghost" className="mb-6 text-muted-foreground" asChild>
            <Link href="/shop">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue shopping
            </Link>
          </Button>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#3a9ca5] to-[#4cb5bd] shadow-md shrink-0">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Your basket</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {count === 0 ? "No items yet" : `${count} item${count === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-10 text-center"
            >
              <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">Your basket is empty</h2>
              <p className="text-muted-foreground mb-6">Browse the shop and add products to get started.</p>
              <Button className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
                <Link href="/shop">Browse the shop</Link>
              </Button>
            </motion.div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              <div className="space-y-3">
                {items.map((item, i) => (
                  <motion.div
                    key={item.productId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="bg-card border border-border rounded-xl p-4 flex gap-4"
                  >
                    <div className="w-20 h-20 rounded-lg bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.price === 0 ? "Free" : formatPrice(item.price)} each
                          </p>
                        </div>
                        <button
                          onClick={() => remove(item.productId)}
                          className="text-muted-foreground hover:text-red-500 transition-colors"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center border border-border rounded-lg overflow-hidden">
                          <button
                            className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-40"
                            onClick={() => setQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                          <button
                            className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors"
                            onClick={() => setQuantity(item.productId, item.quantity + 1)}
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-sm font-bold text-[#3a9ca5]">
                          {item.price === 0 ? "Free" : formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.aside
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-5 h-fit lg:sticky lg:top-24"
              >
                <h2 className="font-bold text-foreground mb-4">Order summary</h2>
                <div className="space-y-2 text-sm mb-4 pb-4 border-b border-border">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatPrice(subtotal)}</span>
                  </div>
                  {voucher && discount > 0 && (
                    <div className="flex justify-between text-[#3a9ca5]">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {voucher.code}
                      </span>
                      <span className="tabular-nums">−{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax & delivery</span>
                    <span className="text-xs italic">Calculated at checkout</span>
                  </div>
                </div>
                <div className="mb-4 pb-4 border-b border-border">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                    Voucher code
                  </p>
                  <VoucherInput />
                </div>
                <div className="flex justify-between items-baseline mb-5">
                  <span className="font-bold">Total</span>
                  <span className="text-xl font-bold text-[#3a9ca5] tabular-nums">{formatPrice(total)}</span>
                </div>
                <Button className="w-full bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
                  <Link href="/checkout">
                    Proceed to checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  No account needed — you can check out as a guest.
                </p>
              </motion.aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
