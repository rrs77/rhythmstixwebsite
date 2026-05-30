import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBasket } from "@/contexts/BasketContext";
import { useAuth } from "@/hooks/use-auth";
import { createOrder } from "@/hooks/use-shop";
import { VoucherInput } from "@/components/shop/VoucherInput";
import { ArrowLeft, CreditCard, Loader2, Lock, Package, ShoppingCart, ShieldCheck, CheckCircle2, Tag } from "lucide-react";
import { motion } from "framer-motion";

function formatPrice(n: number) {
  return `£${n.toFixed(2)}`;
}

export default function Checkout() {
  const { items, subtotal, discount, total, voucher, clear } = useBasket();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");
  const [country, setCountry] = useState("GB");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<{
    isFree: boolean;
    publicId: string;
  } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.firstName) setFirstName((v) => v || user.firstName);
      if (user?.lastName) setLastName((v) => v || user.lastName);
      if (user?.email) setEmail((v) => v || user.email);
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Please complete the required name and email fields.");
      return;
    }
    if (items.length === 0) {
      setError("Your basket is empty.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        billing: {
          firstName, lastName, email, phone,
          address1, address2, city, postcode, country,
        },
        voucherCode: voucher?.code,
      });

      if (result.paymentUrl) {
        // Keep basket until Stripe confirms — if the user bounces back we
        // don't want their cart erased. The /checkout/success page clears it.
        // Hand off to Stripe-hosted checkout.
        window.location.href = result.paymentUrl;
        return;
      }

      // Free order — already completed.
      clear();
      setCompletedOrder({ isFree: result.isFree, publicId: result.publicId });
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-8 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Order complete</h1>
              <p className="text-muted-foreground mb-1">
                Order <span className="font-semibold text-foreground">#{completedOrder.publicId}</span>
              </p>
              <p className="text-muted-foreground mb-6">
                A confirmation email is on its way{email ? ` to ${email}` : ""}.
              </p>
              <div className="flex gap-3 justify-center">
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
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-xl text-center">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Your basket is empty</h1>
            <p className="text-muted-foreground mb-6">Add a product before heading to checkout.</p>
            <Button className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" asChild>
              <Link href="/shop">Browse the shop</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isFreeOrder = subtotal === 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-20 pb-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
          <Button variant="ghost" className="mb-6 text-muted-foreground" asChild>
            <Link href="/basket">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to basket
            </Link>
          </Button>

          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#3a9ca5] to-[#4cb5bd] shadow-md shrink-0">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {isFreeOrder
                  ? "Confirm your details to get your free downloads."
                  : "Enter your details — payment is handled securely on the next step."}
              </p>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="bg-[#3a9ca5]/5 border border-[#3a9ca5]/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#3a9ca5] shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Checking out as a guest</p>
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <Link href="/login?redirect=/checkout" className="text-[#3a9ca5] hover:underline font-medium">Sign in</Link>{" "}
                  for faster checkout.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_360px] gap-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <section className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-bold text-foreground mb-4">Contact details</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First name *</Label>
                    <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last name *</Label>
                    <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="mt-1.5" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label htmlFor="phone">Phone (optional)</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
                  </div>
                </div>
              </section>

              {!isFreeOrder && (
                <section className="bg-card border border-border rounded-xl p-6">
                  <h2 className="font-bold text-foreground mb-4">Billing address</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="address1">Address</Label>
                      <Input id="address1" value={address1} onChange={(e) => setAddress1(e.target.value)} className="mt-1.5" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="address2">Apartment, suite, etc. (optional)</Label>
                      <Input id="address2" value={address2} onChange={(e) => setAddress2(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="mt-1.5" />
                    </div>
                    <div>
                      <Label htmlFor="postcode">Postcode</Label>
                      <Input id="postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} className="mt-1.5" />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="country">Country</Label>
                      <select
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="mt-1.5 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/40"
                      >
                        <option value="GB">United Kingdom</option>
                        <option value="IE">Ireland</option>
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="AU">Australia</option>
                        <option value="NZ">New Zealand</option>
                      </select>
                    </div>
                  </div>
                </section>
              )}

            </motion.div>

            <motion.aside
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-card border border-border rounded-xl p-5 h-fit lg:sticky lg:top-24"
            >
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#3a9ca5]" />
                Your order
              </h2>
              <ul className="space-y-3 mb-4 pb-4 border-b border-border max-h-72 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-3 text-sm">
                    <div className="w-12 h-12 rounded-md bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="font-medium text-foreground line-clamp-2 leading-snug">{item.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Qty {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums shrink-0">
                      {item.price === 0 ? "Free" : formatPrice(item.price * item.quantity)}
                    </p>
                  </li>
                ))}
              </ul>
              <div className="space-y-1.5 text-sm mb-4 pb-4 border-b border-border">
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
                {!isFreeOrder && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax & delivery</span>
                    <span className="text-xs italic">Calculated next</span>
                  </div>
                )}
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

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2 mb-3">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    {isFreeOrder ? "Complete order" : "Continue to payment"}
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-3 leading-relaxed">
                {isFreeOrder
                  ? "Your order will be confirmed immediately."
                  : "You'll be taken to our secure Stripe payment page to finish."}
              </p>
            </motion.aside>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
