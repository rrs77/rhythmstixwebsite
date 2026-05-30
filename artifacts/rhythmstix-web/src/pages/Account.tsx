import { useEffect } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  useAuth,
  useOrders,
  useSubscription,
  useProfile,
  useUpdateProfile,
  useDownloads,
  forgotPassword,
  type Order,
  type Address,
} from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  User,
  Package,
  LogOut,
  Loader2,
  ShoppingBag,
  Receipt,
  Calendar,
  ChevronDown,
  ChevronUp,
  Mail,
  Bell,
  MapPin,
  Download,
  KeyRound,
  Pencil,
  Save,
  X as XIcon,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { EditableText } from "@/components/EditableText";

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
            <EditableText
              contentKey="account.subscription.title"
              fallback="Email Updates"
              as="h3"
              className="font-semibold text-sm text-foreground"
            />
            <EditableText
              contentKey="account.subscription.body"
              fallback="Receive news, community updates, new resources, and admin announcements from Rhythmstix."
              as="p"
              className="text-xs text-muted-foreground mt-0.5 leading-relaxed"
              multiline
            />
            {!configured && (
              <EditableText
                contentKey="account.subscription.notConfigured"
                fallback="Email subscription service is being set up."
                as="p"
                className="text-xs text-amber-600 mt-1"
              />
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

function formatAddress(a: Address | undefined) {
  if (!a) return [];
  const lines = [
    [a.first_name, a.last_name].filter(Boolean).join(" "),
    a.company,
    a.address_1,
    a.address_2,
    [a.city, a.state, a.postcode].filter(Boolean).join(", "),
    a.country,
  ].filter((line) => line && line.trim().length > 0);
  return lines as string[];
}

const ADDR_FIELDS: Array<{ key: keyof Address; label: string; full?: boolean }> = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "company", label: "Company", full: true },
  { key: "address_1", label: "Address line 1", full: true },
  { key: "address_2", label: "Address line 2", full: true },
  { key: "city", label: "City" },
  { key: "state", label: "County / State" },
  { key: "postcode", label: "Postcode" },
  { key: "country", label: "Country code (e.g. GB)" },
  { key: "phone", label: "Phone" },
];

function AddressEditor({
  value,
  onChange,
  showEmail,
}: {
  value: Address;
  onChange: (next: Address) => void;
  showEmail?: boolean;
}) {
  const set = (k: keyof Address, v: string) => onChange({ ...value, [k]: v });
  const inputCls =
    "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 focus:border-[#3a9ca5]";
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {ADDR_FIELDS.map((f) => (
        <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{f.label}</label>
          <input
            type="text"
            value={(value[f.key] as string) || ""}
            onChange={(e) => set(f.key, e.target.value)}
            className={inputCls}
          />
        </div>
      ))}
      {showEmail && (
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Billing email</label>
          <input
            type="email"
            value={value.email || ""}
            onChange={(e) => set("email", e.target.value)}
            className={inputCls}
          />
        </div>
      )}
    </div>
  );
}

function ProfileSection() {
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<{ firstName: string; lastName: string; billing: Address; shipping: Address } | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEdit() {
    if (!profile) return;
    setDraft({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      billing: { ...profile.billing },
      shipping: { ...profile.shipping },
    });
    setSaveError(null);
    setEditing(true);
  }

  async function save() {
    if (!draft) return;
    setSaveError(null);
    try {
      await updateProfile.mutateAsync(draft);
      setEditing(false);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save profile");
    }
  }

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#3a9ca5]" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 flex items-start gap-3 text-sm text-amber-700">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          Couldn't load your profile from WooCommerce. Please try again later.
        </div>
      </div>
    );
  }

  const billingLines = formatAddress(profile.billing);
  const shippingLines = formatAddress(profile.shipping);

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#3a9ca5]/10 flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-[#3a9ca5]" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-foreground">Profile & Addresses</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Synced from your Rhythmstix WooCommerce account.
            </p>
          </div>
        </div>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={startEdit}>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setEditing(false); setSaveError(null); }} disabled={updateProfile.isPending}>
              <XIcon className="w-3.5 h-3.5 mr-1.5" />
              Cancel
            </Button>
            <Button size="sm" className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white" onClick={save} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
              Save
            </Button>
          </div>
        )}
      </div>

      {saveError && (
        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5 flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {saveError}
        </div>
      )}

      {!editing && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Name</h4>
            <p className="text-sm">
              {(profile.firstName || profile.lastName) ? `${profile.firstName} ${profile.lastName}`.trim() : <span className="text-muted-foreground italic">Not set</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.email}</p>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Billing address</h4>
            {billingLines.length > 0 ? (
              <div className="text-sm leading-relaxed">{billingLines.map((l, i) => <div key={i}>{l}</div>)}</div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No billing address on file</p>
            )}
            {profile.billing.phone && <p className="text-xs text-muted-foreground mt-1">{profile.billing.phone}</p>}
          </div>
          <div className="md:col-span-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Shipping address</h4>
            {shippingLines.length > 0 ? (
              <div className="text-sm leading-relaxed">{shippingLines.map((l, i) => <div key={i}>{l}</div>)}</div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No shipping address on file</p>
            )}
          </div>
        </div>
      )}

      {editing && draft && (
        <div className="space-y-5">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Name</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">First name</label>
                <input
                  type="text"
                  value={draft.firstName}
                  onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 focus:border-[#3a9ca5]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Last name</label>
                <input
                  type="text"
                  value={draft.lastName}
                  onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 focus:border-[#3a9ca5]"
                />
              </div>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Billing address</h4>
            <AddressEditor value={draft.billing} onChange={(billing) => setDraft({ ...draft, billing })} showEmail />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Shipping address</h4>
            <AddressEditor value={draft.shipping} onChange={(shipping) => setDraft({ ...draft, shipping })} />
          </div>
        </div>
      )}
    </div>
  );
}

function DownloadsSection() {
  const { data: downloads, isLoading, error } = useDownloads();

  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#3a9ca5]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 flex items-start gap-3 text-sm text-amber-700">
        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
        Couldn't load your purchased downloads. Please try again later.
      </div>
    );
  }

  if (!downloads || downloads.length === 0) {
    return (
      <div className="text-center py-10 bg-card rounded-xl border border-border">
        <Download className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="font-semibold text-sm">No downloads yet</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Downloadable resources from your purchases will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {downloads.map((d) => (
        <div key={`${d.downloadId}-${d.orderId}`} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#d4a017]/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-[#d4a017]" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="font-semibold text-sm truncate">{d.productName}</div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
              {d.fileName && <span className="truncate">{d.fileName}</span>}
              <span>Order #{d.orderId}</span>
              {typeof d.downloadsRemaining === "number" && d.downloadsRemaining >= 0 && (
                <span>{d.downloadsRemaining} left</span>
              )}
              {d.accessExpires && <span>Expires {new Date(d.accessExpires).toLocaleDateString("en-GB")}</span>}
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white shrink-0"
          >
            <a href={d.downloadUrl} target="_blank" rel="noopener noreferrer">
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Download
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}

function ChangePasswordSection({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setError(null);
    try {
      const res = await forgotPassword(email);
      if (res?.success === false) throw new Error(res.error || "Failed to send reset link");
      setSent(true);
    } catch (e: any) {
      setError(e.message || "Failed to send reset link");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-[#3a9ca5]/10 flex items-center justify-center shrink-0">
        <KeyRound className="w-5 h-5 text-[#3a9ca5]" />
      </div>
      <div className="flex-grow">
        <h3 className="font-semibold text-sm text-foreground">Password</h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          Passwords are managed by your Rhythmstix WordPress account. We'll email a secure reset link to{" "}
          <span className="font-medium text-foreground">{email}</span>.
        </p>
        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
        {sent ? (
          <p className="text-xs text-emerald-600 mt-2">Reset link sent — check your inbox.</p>
        ) : (
          <Button size="sm" variant="outline" className="mt-3" onClick={send} disabled={sending}>
            {sending ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5 mr-1.5" />}
            Send password reset email
          </Button>
        )}
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
                <User className="w-5 h-5 text-[#3a9ca5]" />
                <EditableText contentKey="account.profile.heading" fallback="Profile & Addresses" as="span" />
              </h2>
              <ProfileSection />
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                <Download className="w-5 h-5 text-[#3a9ca5]" />
                <EditableText contentKey="account.products.heading" fallback="My Products" as="span" />
              </h2>
              <p className="text-sm text-muted-foreground mb-3 -mt-2">
                <EditableText
                  contentKey="account.products.subheading"
                  fallback="Downloadable resources you've purchased."
                  as="span"
                />
              </p>
              <DownloadsSection />
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                <KeyRound className="w-5 h-5 text-[#3a9ca5]" />
                <EditableText contentKey="account.security.heading" fallback="Security" as="span" />
              </h2>
              <ChangePasswordSection email={user.email} />
            </div>

            <div className="mb-8">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-3">
                <Bell className="w-5 h-5 text-[#3a9ca5]" />
                <EditableText contentKey="account.notifications.heading" fallback="Notifications & Updates" as="span" />
              </h2>
              <SubscriptionSection />
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Package className="w-5 h-5 text-[#3a9ca5]" />
                <EditableText contentKey="account.orders.heading" fallback="Order History" as="span" />
              </h2>
              <EditableText
                contentKey="account.orders.subheading"
                fallback="View your purchase history and order details."
                as="p"
                className="text-sm text-muted-foreground mt-1"
              />
            </div>

            {ordersLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" />
              </div>
            )}

            {orders && orders.length === 0 && (
              <div className="text-center py-16 bg-card rounded-2xl border border-border">
                <ShoppingBag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                <EditableText contentKey="account.orders.empty.title" fallback="No orders yet" as="h3" className="font-semibold mb-1" />
                <EditableText
                  contentKey="account.orders.empty.body"
                  fallback="Your purchase history will appear here."
                  as="p"
                  className="text-sm text-muted-foreground"
                />
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
