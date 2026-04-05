import { useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useAuth, useOrders, useSubscription, type Order } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { User, Package, LogOut, Loader2, ShoppingBag, Receipt, Calendar, ChevronDown, ChevronUp, Mail, Bell } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  processing: "bg-blue-100 text-blue-700",
  "on-hold": "bg-amber-100 text-amber-700",
  pending: "bg-yellow-100 text-yellow-700",
  cancelled: "bg-red-100 text-red-700",
  refunded: "bg-gray-100 text-gray-700",
  failed: "bg-red-100 text-red-700",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: string, currency: string) {
  const num = parseFloat(amount);
  if (isNaN(num)) return amount;
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;
  return `${symbol}${num.toFixed(2)}`;
}

function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-secondary/30 transition-colors"
      >
        <div className="w-10 h-10 rounded-lg bg-[#3a9ca5]/10 flex items-center justify-center shrink-0">
          <Receipt className="w-5 h-5 text-[#3a9ca5]" />
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm">Order #{order.number}</span>
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize", STATUS_STYLES[order.status] || "bg-gray-100 text-gray-700")}>
              {order.status}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(order.dateCreated)}
            </span>
            <span className="font-medium text-foreground">
              {formatCurrency(order.total, order.currency)}
            </span>
            <span>{order.items.length} item{order.items.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="border-t border-border"
        >
          <div className="p-4 space-y-3">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Items</h4>
              <div className="space-y-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{item.name}</span>
                      {item.quantity > 1 && <span className="text-muted-foreground">×{item.quantity}</span>}
                    </div>
                    <span className="font-medium">{formatCurrency(item.total, order.currency)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-bold text-[#3a9ca5]">{formatCurrency(order.total, order.currency)}</span>
            </div>

            {order.paymentMethod && (
              <p className="text-xs text-muted-foreground">
                Paid via {order.paymentMethod}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function SubscriptionSection() {
  const { configured, subscribed, isLoading, toggleSubscription, isToggling } = useSubscription();
  const [error, setError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="w-5 h-5 animate-spin text-[#3a9ca5]" />
      </div>
    );
  }

  const handleToggle = async () => {
    setError(null);
    try {
      await toggleSubscription(!subscribed);
    } catch (err: any) {
      setError(err.message || "Failed to update preferences");
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#3a9ca5]/10 flex items-center justify-center shrink-0 mt-0.5">
            <Mail className="w-5 h-5 text-[#3a9ca5]" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Email Updates</h3>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Receive news, community updates, new resources, and admin announcements from Rhythmstix.
            </p>
            {!configured && (
              <p className="text-xs text-amber-600 mt-1">
                Email subscription service is being set up.
              </p>
            )}
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isToggling || !configured}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed",
            subscribed ? "bg-[#3a9ca5]" : "bg-gray-200"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              subscribed ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
    </div>
  );
}

export default function Account() {
  const { user, isAuthenticated, isLoading: authLoading, logout } = useAuth();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) navigate("/login");
  }, [authLoading, isAuthenticated, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#3a9ca5]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br from-[#3a9ca5] to-[#4cb5bd] shadow-md">
                  <User className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {user.firstName ? `${user.firstName} ${user.lastName}` : user.username}
                  </h1>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-[#3a9ca5]" />
                Notifications & Updates
              </h2>
              <SubscriptionSection />
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-[#3a9ca5]" />
                Your Orders
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                View your purchase history and order details.
              </p>
            </div>

            {ordersLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" />
              </div>
            )}

            {orders && orders.length === 0 && (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-semibold mb-1">No orders yet</h3>
                <p className="text-sm text-muted-foreground">
                  Your purchase history will appear here.
                </p>
              </div>
            )}

            {orders && orders.length > 0 && (
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
