import { useState, useMemo, useEffect, type CSSProperties } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAdminMode } from "@/hooks/use-admin";
import { useContent, useSaveContent } from "@/hooks/use-content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText, MessageSquareQuote, Linkedin, Twitter, Youtube, Settings as SettingsIcon,
  Loader2, Lock, Plus, Trash2, Pencil, Save, X, Search, ExternalLink, Shield, Eye, EyeOff, ChevronUp, ChevronDown,
  LayoutTemplate, Globe, AppWindow, ArrowUp, ArrowDown, Menu as MenuIcon, Palette, RotateCcw,
  Facebook, RefreshCw, AlertTriangle, CheckCircle2, Package, GripVertical, Ticket, ShoppingBag, Tag,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TEMPLATE_LABELS, type PageTemplate, type PageData, CustomPageRenderer } from "@/components/CustomPageRenderer";
import { HtmlBodyEditor } from "@/components/admin/HtmlBodyEditor";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast, useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

type TabKey = "copy" | "apps" | "pages" | "navigation" | "testimonials" | "linkedin" | "twitter" | "youtube" | "facebook" | "visibility" | "theme" | "vouchers" | "orders" | "settings";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "copy", label: "Site Copy", icon: FileText },
  { key: "apps", label: "Apps", icon: AppWindow },
  { key: "pages", label: "Pages", icon: LayoutTemplate },
  { key: "navigation", label: "Navigation & Footer", icon: MenuIcon },
  { key: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "twitter", label: "Twitter / X", icon: Twitter },
  { key: "facebook", label: "Facebook", icon: Facebook },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "visibility", label: "Hidden Posts", icon: EyeOff },
  { key: "theme", label: "Theme & Design", icon: Palette },
  { key: "vouchers", label: "Vouchers", icon: Ticket },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

function readInitialTab(): TabKey {
  if (typeof window === "undefined") return "copy";
  const params = new URLSearchParams(window.location.search);
  const t = params.get("tab");
  const valid: TabKey[] = ["copy", "apps", "pages", "navigation", "testimonials", "linkedin", "twitter", "youtube", "facebook", "visibility", "theme", "vouchers", "orders", "settings"];
  return (valid.includes(t as TabKey) ? (t as TabKey) : "copy");
}

function readInitialEditPageId(): number | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const id = params.get("edit");
  const n = id ? parseInt(id, 10) : NaN;
  return Number.isFinite(n) ? n : null;
}

export default function Admin() {
  const { data: isAdmin, isLoading: adminLoading } = useAdminMode();
  const [tab, setTab] = useState<TabKey>(() => readInitialTab());
  const [initialEditPageId] = useState<number | null>(() => readInitialEditPageId());

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3a9ca5]" />
      </div>
    );
  }

  if (!isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#3a9ca5] text-white flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage your site copy, testimonials, social feeds and settings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
            <nav className="space-y-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                    tab === t.key
                      ? "bg-[#3a9ca5] text-white"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </nav>

            <div className="bg-card rounded-2xl border border-border p-6 min-h-[400px]">
              {tab === "copy" && <CopyTab />}
              {tab === "apps" && <AppsTab />}
              {tab === "pages" && <PagesTab initialEditId={initialEditPageId} />}
              {tab === "navigation" && <NavigationTab />}
              {tab === "testimonials" && <TestimonialsTab />}
              {tab === "linkedin" && <LinkedInTab />}
              {tab === "twitter" && <TwitterTab />}
              {tab === "facebook" && <FacebookTab />}
              {tab === "youtube" && <YouTubeTab />}
              {tab === "visibility" && <VisibilityTab />}
              {tab === "theme" && <ThemeTab />}
              {tab === "vouchers" && <VouchersTab />}
              {tab === "orders" && <OrdersTab />}
              {tab === "settings" && <SettingsTab />}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const loginMutation = useMutation({
    mutationFn: async (pw: string) => {
      const res = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: pw }),
      });
      if (!res.ok) throw new Error("Invalid password");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-check"] });
      setPassword("");
      setError("");
    },
    onError: () => setError("Invalid password"),
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl border border-border p-8 w-full max-w-sm shadow-lg">
        <div className="flex items-center justify-center w-12 h-12 mx-auto rounded-xl bg-[#3a9ca5] text-white mb-4">
          <Lock className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-center mb-1">Admin Login</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Enter your admin password to continue.</p>
        <form onSubmit={(e) => { e.preventDefault(); loginMutation.mutate(password); }} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Admin password"
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
          />
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <Button type="submit" disabled={loginMutation.isPending} className="w-full bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
            {loginMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}

/* ========== SITE COPY TAB ========== */
function CopyTab() {
  const { data: content = {}, isLoading } = useContent();
  const saveMutation = useSaveContent();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const entries = useMemo(() => {
    const list = Object.entries(content) as [string, string][];
    list.sort(([a], [b]) => a.localeCompare(b));
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q));
  }, [content, search]);

  function save(key: string) {
    saveMutation.mutate({ key, value: editValue }, {
      onSuccess: () => setEditing(null),
    });
  }

  function addNew() {
    if (!newKey.trim() || !newValue.trim()) return;
    saveMutation.mutate({ key: newKey.trim(), value: newValue.trim() }, {
      onSuccess: () => { setNewKey(""); setNewValue(""); },
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Site Copy</h2>
        <p className="text-sm text-muted-foreground">All editable text overrides on the site. You can also edit copy inline by hovering text on any page while logged in as admin.</p>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search keys or values..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
        />
      </div>

      <div className="border border-border rounded-lg p-3 bg-secondary/40 space-y-2">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Add new key</div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr_auto] gap-2">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="key.path.like.this"
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
          />
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="Value"
            className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
          />
          <Button onClick={addNew} disabled={!newKey.trim() || !newValue.trim() || saveMutation.isPending} className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" /></div>}

      <div className="space-y-2">
        {entries.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground text-sm">No keys yet. Edit text inline on the site or add one above.</div>
        )}
        {entries.map(([key, value]) => (
          <div key={key} className="border border-border rounded-lg p-3 hover:bg-secondary/30 transition-colors">
            <div className="flex items-start justify-between gap-3 mb-1">
              <code className="text-xs font-mono text-[#3a9ca5] break-all">{key}</code>
              <div className="flex gap-1 shrink-0">
                {editing === key ? (
                  <>
                    <button onClick={() => save(key)} className="p-1 rounded hover:bg-[#3a9ca5]/10 text-[#3a9ca5]" title="Save">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditing(null)} className="p-1 rounded hover:bg-secondary" title="Cancel">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => { setEditing(key); setEditValue(value); }}
                    className="p-1 rounded hover:bg-[#3a9ca5]/10 text-muted-foreground hover:text-[#3a9ca5]"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            {editing === key ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
              />
            ) : (
              <p className="text-sm text-foreground/80 whitespace-pre-wrap break-words">{value}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== TESTIMONIALS TAB ========== */
interface Testimonial {
  id: number;
  quote: string;
  author: string;
  organization: string;
  app: string | null;
  published: boolean;
  sortOrder: number;
}

function TestimonialsTab() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const res = await fetch("/api/testimonials/all", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState({ quote: "", author: "", organization: "", app: "", published: true });

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
    queryClient.invalidateQueries({ queryKey: ["testimonials"] });
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editing === "new" ? "/api/testimonials" : `/api/testimonials/${editing}`;
      const method = editing === "new" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...form, app: form.app.trim() || null }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => { invalidate(); setEditing(null); },
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: number; published: boolean }) => {
      const res = await fetch(`/api/testimonials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ published }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: invalidate,
  });

  const swapOrderMutation = useMutation({
    mutationFn: async ({ idA, idB }: { idA: number; idB: number }) => {
      const res = await fetch("/api/testimonials/swap-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idA, idB }),
      });
      if (!res.ok) throw new Error("Reorder failed");
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: invalidate,
  });

  function startNew() {
    setForm({ quote: "", author: "", organization: "", app: "", published: true });
    setEditing("new");
  }

  function startEdit(t: Testimonial) {
    setForm({ quote: t.quote, author: t.author, organization: t.organization, app: t.app || "", published: t.published });
    setEditing(t.id);
  }

  const { toast } = useToast();

  function move(index: number, direction: -1 | 1) {
    const other = index + direction;
    if (other < 0 || other >= items.length) return;
    const idA = items[index].id;
    const idB = items[other].id;
    swapOrderMutation.mutate(
      { idA, idB },
      {
        onSuccess: () => {
          // Swap is its own inverse, so undo just re-runs the same swap.
          // TOAST_LIMIT=1 ensures only the most recent reorder's undo is
          // offered, matching the WooCommerce reorder undo affordance.
          const t = toast({
            title: "Order updated",
            description: "Reordered testimonial. Drop in the wrong spot?",
            duration: 6000,
            action: (
              <ToastAction
                altText="Undo reorder"
                onClick={() => {
                  t.dismiss();
                  swapOrderMutation.mutate({ idA, idB });
                }}
              >
                Undo
              </ToastAction>
            ),
          });
        },
      },
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Testimonials</h2>
          <p className="text-sm text-muted-foreground">All testimonials shown on the homepage. Use the arrows to reorder, the eye icon to hide/show, or the trash icon to delete.</p>
        </div>
        <Button onClick={startNew} className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {editing !== null && (
        <div className="border-2 border-[#3a9ca5]/30 rounded-lg p-4 bg-[#3a9ca5]/5 space-y-3">
          <h3 className="font-semibold text-sm">{editing === "new" ? "New Testimonial" : "Edit Testimonial"}</h3>
          <textarea
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
            placeholder="Quote"
            rows={3}
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="Author"
              className="px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
            />
            <input
              value={form.organization}
              onChange={(e) => setForm({ ...form, organization: e.target.value })}
              placeholder="Organization"
              className="px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
            />
            <input
              value={form.app}
              onChange={(e) => setForm({ ...form, app: e.target.value })}
              placeholder="App / product (optional)"
              className="px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="rounded" />
            <span>Published (visible on the homepage)</span>
          </label>
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={!form.quote.trim() || !form.author.trim() || saveMutation.isPending} className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" /></div>}

      <div className="space-y-2">
        {items.length === 0 && !isLoading && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No testimonials yet. Click <strong>Add</strong> to create one.
          </div>
        )}
        {items.map((t, i) => (
          <div key={t.id} className={cn("border rounded-lg p-3", t.published ? "border-border" : "border-border bg-muted/30 opacity-70")}>
            <div className="flex items-start gap-2">
              <div className="flex flex-col gap-0.5 pt-0.5">
                <button
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || swapOrderMutation.isPending}
                  className="p-0.5 rounded hover:bg-[#3a9ca5]/10 text-muted-foreground hover:text-[#3a9ca5] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  title="Move up"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1 || swapOrderMutation.isPending}
                  className="p-0.5 rounded hover:bg-[#3a9ca5]/10 text-muted-foreground hover:text-[#3a9ca5] disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  title="Move down"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm italic mb-1">"{t.quote}"</p>
                <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                  <span><strong className="text-foreground">{t.author}</strong> — {t.organization}</span>
                  {t.app && <span className="text-[10px] font-medium text-[#3a9ca5] bg-[#3a9ca5]/10 px-2 py-0.5 rounded-full">{t.app}</span>}
                  {!t.published && <span className="text-[10px] font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Hidden</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => togglePublishedMutation.mutate({ id: t.id, published: !t.published })}
                  className="p-1 rounded hover:bg-[#3a9ca5]/10 text-muted-foreground hover:text-[#3a9ca5]"
                  title={t.published ? "Hide from homepage" : "Show on homepage"}
                >
                  {t.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(t)} className="p-1 rounded hover:bg-[#3a9ca5]/10 text-muted-foreground hover:text-[#3a9ca5]" title="Edit"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Delete this testimonial?")) deleteMutation.mutate(t.id); }} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== SHARED SOCIAL FEED CONTROLS ========== */
type FeedInfo = {
  platform: "youtube" | "facebook" | "linkedin" | "twitter";
  enabled: boolean;
  lastSyncedAt: string | null;
  lastSyncStatus: "ok" | "error" | null;
  lastSyncMessage: string | null;
  configured: boolean;
  missingSecrets: string[];
  autoSync: boolean;
};

function useFeeds() {
  return useQuery<FeedInfo[]>({
    queryKey: ["social-feeds"],
    queryFn: async () => {
      const res = await fetch("/api/social/feeds", { credentials: "include" });
      return res.json();
    },
    staleTime: 30 * 1000,
  });
}

function FeedControls({ platform, accent }: { platform: FeedInfo["platform"]; accent: string }) {
  const queryClient = useQueryClient();
  const { data: feeds = [] } = useFeeds();
  const feed = feeds.find((f) => f.platform === platform);

  const toggleMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch(`/api/social/feeds/${platform}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-feeds"] });
      queryClient.invalidateQueries({ queryKey: ["social-posts-all"] });
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
      queryClient.invalidateQueries({ queryKey: ["linkedin-posts"] });
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/social/sync/${platform}`, {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Sync failed");
      return j as { inserted: number; updated: number; total: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-feeds"] });
      queryClient.invalidateQueries({ queryKey: ["social-posts-all"] });
      queryClient.invalidateQueries({ queryKey: [`admin-${platform}`] });
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
    },
  });

  const enabled = feed?.enabled ?? true;
  const lastSync = feed?.lastSyncedAt ? new Date(feed.lastSyncedAt) : null;

  return (
    <div className="border border-border rounded-lg p-3 bg-secondary/30 space-y-2">
      {feed && !feed.configured && feed.missingSecrets.length > 0 && (
        <div className="flex items-start gap-2 p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong>Setup required:</strong> Missing env var{feed.missingSecrets.length > 1 ? "s" : ""}{" "}
            <code className="px-1 py-0.5 bg-white rounded text-[10px]">{feed.missingSecrets.join(", ")}</code>.
            {platform === "facebook" && (
              <span className="block mt-1">
                Create a long-lived <em>Page Access Token</em> from <a className="underline" href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer">Graph API Explorer</a>, set <code>FACEBOOK_PAGE_ID</code> and <code>FACEBOOK_PAGE_ACCESS_TOKEN</code>, then restart the API server.
              </span>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => toggleMutation.mutate(e.target.checked)}
            className={accent}
          />
          <span className="font-medium">Feed {enabled ? "enabled" : "disabled"}</span>
          <span className="text-xs text-muted-foreground">
            {enabled ? "Posts appear on /blog" : "Hidden from /blog"}
          </span>
        </label>
        {feed?.autoSync && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || !feed.configured}
            className="gap-1.5"
          >
            {syncMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Sync now
          </Button>
        )}
      </div>
      {(lastSync || syncMutation.isError || feed?.lastSyncStatus === "error") && (
        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
          {feed?.lastSyncStatus === "ok" && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
          {feed?.lastSyncStatus === "error" && <AlertTriangle className="w-3 h-3 text-red-600" />}
          {lastSync && <span>Last synced {lastSync.toLocaleString("en-GB")}</span>}
          {feed?.lastSyncStatus === "error" && feed.lastSyncMessage && (
            <span className="text-red-600">— {feed.lastSyncMessage}</span>
          )}
          {syncMutation.isError && (
            <span className="text-red-600">— {(syncMutation.error as Error).message}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ========== FACEBOOK TAB ========== */
function FacebookTab() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin-facebook"],
    queryFn: async () => {
      const res = await fetch("/api/social/posts?platform=facebook&includeHidden=1", {
        credentials: "include",
      });
      return res.json();
    },
  });

  const toggleHidden = useMutation({
    mutationFn: async ({ id, hidden }: { id: number; hidden: boolean }) => {
      const res = await fetch(`/api/social/posts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ hidden }),
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-facebook"] });
      queryClient.invalidateQueries({ queryKey: ["social-posts-all"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/social/posts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-facebook"] });
      queryClient.invalidateQueries({ queryKey: ["social-posts-all"] });
    },
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2"><Facebook className="w-5 h-5 text-[#1877f2]" /> Facebook Page Feed</h2>
        <p className="text-sm text-muted-foreground">Posts from your Facebook Page are imported automatically via the Graph API. Use <em>Sync now</em> to pull the latest 25 posts on demand.</p>
      </div>

      <FeedControls platform="facebook" accent="accent-[#1877f2]" />

      <div>
        <h3 className="text-sm font-semibold mb-2">Imported posts ({posts.length})</h3>
        {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#1877f2]" /></div>}
        {!isLoading && posts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">No Facebook posts yet. Click <em>Sync now</em> after configuring credentials.</div>
        )}
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.rawId} className={cn("border border-border rounded-lg p-3", p.hidden && "opacity-60 border-dashed")}>
              <div className="flex items-start gap-3">
                {p.thumbnail && <img src={p.thumbnail} alt="" className="w-20 h-20 object-cover rounded shrink-0" />}
                <div className="flex-grow min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm line-clamp-3 flex-grow">{p.body || p.title}</p>
                    <div className="flex gap-1 shrink-0">
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-secondary text-muted-foreground" title="Open on Facebook"><ExternalLink className="w-4 h-4" /></a>
                      <button
                        onClick={() => toggleHidden.mutate({ id: p.rawId, hidden: !p.hidden })}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground"
                        title={p.hidden ? "Show on /blog" : "Hide from /blog"}
                      >
                        {p.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => { if (confirm("Delete this post from the local cache? It will reappear on next sync.")) deleteMutation.mutate(p.rawId); }}
                        className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(p.date).toLocaleString("en-GB")}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== LINKEDIN TAB ========== */
function LinkedInTab() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin-linkedin"],
    queryFn: async () => {
      const res = await fetch("/api/social/linkedin");
      return res.json();
    },
  });
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState({ title: "", description: "", url: "", date: "" });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const id = editing && editing !== "new" ? editing.replace("li:", "") : null;
      const url = id ? `/api/social/linkedin/${id}` : "/api/social/linkedin";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-linkedin"] });
      queryClient.invalidateQueries({ queryKey: ["linkedin-posts"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const numId = id.replace("li:", "");
      const res = await fetch(`/api/social/linkedin/${numId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-linkedin"] });
      queryClient.invalidateQueries({ queryKey: ["linkedin-posts"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Linkedin className="w-5 h-5 text-[#0077b5]" /> LinkedIn Posts</h2>
          <p className="text-sm text-muted-foreground">Manually add LinkedIn posts to your blog feed (LinkedIn doesn't offer a public API).</p>
        </div>
        <Button onClick={() => { setForm({ title: "", description: "", url: "", date: new Date().toISOString().slice(0, 10) }); setEditing("new"); }} className="bg-[#0077b5] hover:bg-[#005e93] text-white">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      <FeedControls platform="linkedin" accent="accent-[#0077b5]" />

      {editing !== null && (
        <div className="border-2 border-[#0077b5]/30 rounded-lg p-4 bg-[#0077b5]/5 space-y-3">
          <h3 className="font-semibold text-sm">{editing === "new" ? "New LinkedIn Post" : "Edit Post"}</h3>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title"
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b5]/30"
          />
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description / excerpt"
            rows={3}
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b5]/30"
          />
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://www.linkedin.com/posts/..."
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b5]/30"
          />
          <input
            type="date"
            value={form.date.slice(0, 10)}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#0077b5]/30"
          />
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={!form.title.trim() || !form.url.trim() || saveMutation.isPending} className="bg-[#0077b5] hover:bg-[#005e93] text-white">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#0077b5]" /></div>}

      <div className="space-y-2">
        {posts.length === 0 && !isLoading && <div className="text-center py-8 text-muted-foreground text-sm">No LinkedIn posts yet.</div>}
        {posts.map((p) => (
          <div key={p.id} className="border border-border rounded-lg p-3">
            <div className="flex items-start justify-between gap-3 mb-1">
              <h3 className="font-medium text-sm">{p.title}</h3>
              <div className="flex gap-1 shrink-0">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-secondary text-muted-foreground" title="View"><ExternalLink className="w-4 h-4" /></a>
                <button onClick={() => { setForm({ title: p.title, description: p.description, url: p.url, date: p.date.slice(0, 10) }); setEditing(p.id); }} className="p-1 rounded hover:bg-[#0077b5]/10 text-muted-foreground hover:text-[#0077b5]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Delete this LinkedIn post?")) deleteMutation.mutate(p.id); }} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            {p.description && <p className="text-xs text-muted-foreground mb-1 line-clamp-2">{p.description}</p>}
            <p className="text-[10px] text-muted-foreground">{new Date(p.date).toLocaleDateString("en-GB")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== TWITTER TAB ========== */
function TwitterTab() {
  const queryClient = useQueryClient();
  const { data: posts = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin-twitter"],
    queryFn: async () => {
      const res = await fetch("/api/social/twitter");
      return res.json();
    },
  });
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState({ text: "", url: "", date: "" });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const id = editing && editing !== "new" ? editing.replace("tw:", "") : null;
      const url = id ? `/api/social/twitter/${id}` : "/api/social/twitter";
      const method = id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-twitter"] });
      queryClient.invalidateQueries({ queryKey: ["twitter-posts"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const numId = id.replace("tw:", "");
      const res = await fetch(`/api/social/twitter/${numId}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-twitter"] });
      queryClient.invalidateQueries({ queryKey: ["twitter-posts"] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Twitter className="w-5 h-5 text-sky-500" /> Twitter / X Posts</h2>
          <p className="text-sm text-muted-foreground">Manually add tweets to your blog feed. Set your handle in Settings to add a "Follow on X" link.</p>
        </div>
        <Button onClick={() => { setForm({ text: "", url: "", date: new Date().toISOString().slice(0, 10) }); setEditing("new"); }} className="bg-sky-500 hover:bg-sky-600 text-white">
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      <FeedControls platform="twitter" accent="accent-sky-500" />

      {editing !== null && (
        <div className="border-2 border-sky-300 rounded-lg p-4 bg-sky-50 space-y-3">
          <h3 className="font-semibold text-sm">{editing === "new" ? "New Tweet" : "Edit Tweet"}</h3>
          <textarea
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            placeholder="Tweet text"
            rows={3}
            maxLength={280}
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          />
          <input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://x.com/yourhandle/status/..."
            className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          />
          <input
            type="date"
            value={form.date.slice(0, 10)}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
          />
          <div className="flex gap-2">
            <Button onClick={() => saveMutation.mutate()} disabled={!form.text.trim() || !form.url.trim() || saveMutation.isPending} className="bg-sky-500 hover:bg-sky-600 text-white">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </Button>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-sky-500" /></div>}

      <div className="space-y-2">
        {posts.length === 0 && !isLoading && <div className="text-center py-8 text-muted-foreground text-sm">No tweets yet.</div>}
        {posts.map((p) => (
          <div key={p.id} className="border border-border rounded-lg p-3">
            <div className="flex items-start justify-between gap-3 mb-1">
              <p className="text-sm flex-grow">{p.text}</p>
              <div className="flex gap-1 shrink-0">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="p-1 rounded hover:bg-secondary text-muted-foreground"><ExternalLink className="w-4 h-4" /></a>
                <button onClick={() => { setForm({ text: p.text, url: p.url, date: p.date.slice(0, 10) }); setEditing(p.id); }} className="p-1 rounded hover:bg-sky-100 text-muted-foreground hover:text-sky-600"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Delete this tweet?")) deleteMutation.mutate(p.id); }} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">{new Date(p.date).toLocaleDateString("en-GB")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== YOUTUBE TAB ========== */
function YouTubeTab() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery<{ youtubeChannelId: string }>({
    queryKey: ["social-settings"],
    queryFn: async () => {
      const res = await fetch("/api/social/settings");
      return res.json();
    },
  });
  const { data: videos = [], isLoading } = useQuery<any[]>({
    queryKey: ["admin-youtube"],
    queryFn: async () => {
      const res = await fetch("/api/social/youtube");
      return res.json();
    },
  });
  const [channelId, setChannelId] = useState("");

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/social/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ youtubeChannelId: channelId }),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["social-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-youtube"] });
      queryClient.invalidateQueries({ queryKey: ["youtube-videos"] });
    },
  });

  const currentChannel = settings?.youtubeChannelId || "";
  const displayChannel = channelId || currentChannel;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2"><Youtube className="w-5 h-5 text-red-600" /> YouTube Feed</h2>
        <p className="text-sm text-muted-foreground">YouTube videos appear automatically in your blog feed via the channel's RSS feed (auto-syncs every 10 minutes).</p>
      </div>

      <FeedControls platform="youtube" accent="accent-red-600" />

      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Channel ID</div>
        <input
          value={displayChannel}
          onChange={(e) => setChannelId(e.target.value)}
          placeholder="UCooHhU7FKALUQ4CtqjDFMsw"
          className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-red-500/30"
        />
        <p className="text-xs text-muted-foreground">
          Find your channel ID at <a href="https://www.youtube.com/account_advanced" target="_blank" rel="noopener noreferrer" className="text-[#3a9ca5] underline">youtube.com/account_advanced</a> while logged in.
        </p>
        <Button onClick={() => saveMutation.mutate()} disabled={!channelId || channelId === currentChannel || saveMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Channel ID"}
        </Button>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Latest Videos ({videos.length})</h3>
        {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-red-600" /></div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {videos.slice(0, 10).map((v) => (
            <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="flex gap-2 border border-border rounded-lg p-2 hover:bg-secondary/40 transition-colors">
              <img src={v.thumbnail} alt={v.title} className="w-24 h-16 object-cover rounded shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium line-clamp-2">{v.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{new Date(v.date).toLocaleDateString("en-GB")}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ========== HIDDEN POSTS TAB ========== */
function VisibilityTab() {
  const queryClient = useQueryClient();
  const { data: hiddenWp = [] } = useQuery<number[]>({
    queryKey: ["hidden-posts"],
    queryFn: async () => {
      const res = await fetch("/api/hidden-posts", { credentials: "include" });
      return res.json();
    },
  });
  const { data: hiddenSocial = [] } = useQuery<string[]>({
    queryKey: ["hidden-social"],
    queryFn: async () => {
      const res = await fetch("/api/social/hidden", { credentials: "include" });
      return res.json();
    },
  });

  const unhideWp = useMutation({
    mutationFn: async (id: number) => {
      const newList = hiddenWp.filter((x) => x !== id);
      await fetch("/api/hidden-posts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ postIds: newList }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hidden-posts"] }),
  });

  const unhideSocial = useMutation({
    mutationFn: async (id: string) => {
      const newList = hiddenSocial.filter((x) => x !== id);
      await fetch("/api/social/hidden", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ids: newList }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["hidden-social"] }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2"><EyeOff className="w-5 h-5" /> Hidden Posts</h2>
        <p className="text-sm text-muted-foreground">Posts you've hidden from the public blog feed. Click to restore.</p>
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Hidden WordPress Posts ({hiddenWp.length})</h3>
        {hiddenWp.length === 0 ? (
          <p className="text-xs text-muted-foreground">None hidden.</p>
        ) : (
          <div className="space-y-1">
            {hiddenWp.map((id) => (
              <div key={id} className="flex items-center justify-between border border-border rounded p-2">
                <code className="text-xs">WordPress post #{id}</code>
                <button onClick={() => unhideWp.mutate(id)} className="text-xs text-[#3a9ca5] hover:underline flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold mb-2">Hidden Social Posts ({hiddenSocial.length})</h3>
        {hiddenSocial.length === 0 ? (
          <p className="text-xs text-muted-foreground">None hidden.</p>
        ) : (
          <div className="space-y-1">
            {hiddenSocial.map((id) => (
              <div key={id} className="flex items-center justify-between border border-border rounded p-2">
                <code className="text-xs">{id}</code>
                <button onClick={() => unhideSocial.mutate(id)} className="text-xs text-[#3a9ca5] hover:underline flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ========== SETTINGS TAB ========== */
function SettingsTab() {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery<{ youtubeChannelId: string; twitterHandle: string; linkedinHandle: string }>({
    queryKey: ["social-settings"],
    queryFn: async () => {
      const res = await fetch("/api/social/settings");
      return res.json();
    },
  });
  const [twitterHandle, setTwitterHandle] = useState<string | null>(null);
  const [linkedinHandle, setLinkedinHandle] = useState<string | null>(null);

  type CredentialInfo = { set: boolean; source: "db" | "env" | null; hint: string };
  const { data: credentials } = useQuery<Record<string, CredentialInfo>>({
    queryKey: ["social-credentials"],
    queryFn: async () => {
      const res = await fetch("/api/social/credentials", { credentials: "include" });
      if (!res.ok) return {};
      return res.json();
    },
  });

  const [fbPageId, setFbPageId] = useState("");
  const [fbToken, setFbToken] = useState("");
  const [credSavedAt, setCredSavedAt] = useState<number | null>(null);

  const saveCredentialsMutation = useMutation({
    mutationFn: async (body: Record<string, string | null>) => {
      const res = await fetch("/api/social/credentials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => {
      setFbPageId("");
      setFbToken("");
      setCredSavedAt(Date.now());
      queryClient.invalidateQueries({ queryKey: ["social-credentials"] });
      queryClient.invalidateQueries({ queryKey: ["social-feeds"] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/social/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Save failed");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["social-settings"] }),
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-check"] });
      window.location.href = "/";
    },
  });

  const currentTwitter = settings?.twitterHandle || "";
  const currentLinkedin = settings?.linkedinHandle || "";
  const twitterValue = twitterHandle ?? currentTwitter;
  const linkedinValue = linkedinHandle ?? currentLinkedin;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">Configure social media handles and admin session.</p>
      </div>

      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold uppercase text-muted-foreground">Twitter / X handle</div>
        <input
          value={twitterValue}
          onChange={(e) => setTwitterHandle(e.target.value)}
          placeholder="@rhythmstix"
          className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
        />
        <Button onClick={() => saveMutation.mutate({ twitterHandle: twitterValue.replace(/^@/, "") })} disabled={saveMutation.isPending} size="sm" className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">Save</Button>
      </div>

      <div className="border border-border rounded-lg p-4 space-y-3">
        <div className="text-xs font-semibold uppercase text-muted-foreground">LinkedIn handle / company slug</div>
        <input
          value={linkedinValue}
          onChange={(e) => setLinkedinHandle(e.target.value)}
          placeholder="company/rhythmstix"
          className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
        />
        <Button onClick={() => saveMutation.mutate({ linkedinHandle: linkedinValue })} disabled={saveMutation.isPending} size="sm" className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">Save</Button>
      </div>

      <div className="border border-border rounded-lg p-4 space-y-4">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <Facebook className="w-4 h-4 text-[#1877f2]" /> Social Media API Credentials
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Used by the auto-sync jobs that pull posts from your Facebook Page. Saved values are stored in the database and take effect immediately — no server restart needed. Values shown are masked; leave a field blank to keep the current value.
          </p>
        </div>

        {(["FACEBOOK_PAGE_ID", "FACEBOOK_PAGE_ACCESS_TOKEN"] as const).map((key) => {
          const info = credentials?.[key];
          const isToken = key.includes("TOKEN");
          const value = key === "FACEBOOK_PAGE_ID" ? fbPageId : fbToken;
          const setValue = key === "FACEBOOK_PAGE_ID" ? setFbPageId : setFbToken;
          return (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-muted-foreground flex items-center justify-between gap-2">
                <span>{key === "FACEBOOK_PAGE_ID" ? "Facebook Page ID" : "Facebook Page Access Token"}</span>
                {info?.set ? (
                  <span className="inline-flex items-center gap-1 text-emerald-700 font-normal normal-case text-[11px]">
                    <CheckCircle2 className="w-3 h-3" /> Set
                    {info.source === "env" && <span className="text-muted-foreground">(via env var)</span>}
                    {info.hint && <code className="ml-1 px-1 py-0.5 bg-secondary rounded">{info.hint}</code>}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-normal normal-case text-[11px]">
                    <AlertTriangle className="w-3 h-3" /> Not set
                  </span>
                )}
              </label>
              <input
                type={isToken ? "password" : "text"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={info?.set ? "Enter new value to replace…" : (key === "FACEBOOK_PAGE_ID" ? "e.g. 100075736525991" : "Long-lived Page Access Token")}
                autoComplete="off"
                className="w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 font-mono"
              />
            </div>
          );
        })}

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Need a token? Open the <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" className="underline">Graph API Explorer</a>, pick your app, choose <em>Get Page Access Token</em> for the Rhythmstix Page, grant the <code>pages_read_engagement</code> and <code>pages_show_list</code> permissions, then exchange it for a long-lived token via the <a href="https://developers.facebook.com/tools/debug/accesstoken/" target="_blank" rel="noopener noreferrer" className="underline">Access Token Debugger</a> so it doesn't expire in an hour.
        </p>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              const body: Record<string, string> = {};
              if (fbPageId.trim()) body.FACEBOOK_PAGE_ID = fbPageId.trim();
              if (fbToken.trim()) body.FACEBOOK_PAGE_ACCESS_TOKEN = fbToken.trim();
              if (Object.keys(body).length === 0) return;
              saveCredentialsMutation.mutate(body);
            }}
            disabled={saveCredentialsMutation.isPending || (!fbPageId.trim() && !fbToken.trim())}
            size="sm"
            className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
          >
            {saveCredentialsMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
            Save credentials
          </Button>
          {(credentials?.FACEBOOK_PAGE_ID?.set || credentials?.FACEBOOK_PAGE_ACCESS_TOKEN?.set) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (!confirm("Clear stored Facebook credentials? Auto-sync will stop until you set them again or restore the env vars.")) return;
                saveCredentialsMutation.mutate({ FACEBOOK_PAGE_ID: null, FACEBOOK_PAGE_ACCESS_TOKEN: null });
              }}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear
            </Button>
          )}
          {credSavedAt && Date.now() - credSavedAt < 4000 && (
            <span className="text-xs text-emerald-600 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
          {saveCredentialsMutation.isError && (
            <span className="text-xs text-red-600">Save failed</span>
          )}
        </div>
      </div>

      <WooCommerceProductsSection />

      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <h3 className="text-sm font-semibold text-red-700 mb-1">Sign out of admin</h3>
        <p className="text-xs text-red-600/80 mb-3">End your admin session. You'll need to log in again to make changes.</p>
        <Button onClick={() => logoutMutation.mutate()} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
          Logout
        </Button>
      </div>
    </div>
  );
}

interface WooAdminProduct {
  wcId: number;
  name: string;
  slug: string;
  price: string;
  onSale: boolean;
  status: string;
  stockStatus: string;
  purchasable: boolean;
  hidden: boolean;
  permalink: string;
  thumbnail: string | null;
  categories: { id: number; name: string; slug: string }[];
  adminSortOrder: number;
  menuOrder: number;
  categorySortOrder: number | null;
  lastSyncedAt: string;
}

interface WooAdminResponse {
  category: string | null;
  products: WooAdminProduct[];
  sync: {
    configured: boolean;
    lastResult: { inserted: number; updated: number; removed: number; total: number; finishedAt: string; complete: boolean } | null;
    lastError: { message: string; at: string } | null;
    inFlight: boolean;
    siteUrl: string;
  };
}

interface ShopCategoryOption {
  id: number;
  name: string;
  slug: string;
  count: number;
  parent?: number;
}

function WooCommerceProductsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  // Local override of the server's product order, kept while a drag is in
  // flight so the UI updates instantly. Cleared once the server confirms
  // (the next refetch supplies the canonical order) or on error.
  const [localOrder, setLocalOrder] = useState<number[] | null>(null);

  const { data: categoryOptions = [] } = useQuery<ShopCategoryOption[]>({
    queryKey: ["admin-woo-categories"],
    queryFn: async () => {
      const res = await fetch("/api/admin/woocommerce/categories", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data, isLoading, refetch } = useQuery<WooAdminResponse>({
    queryKey: ["admin-woo-products", categoryFilter],
    queryFn: async () => {
      const url = categoryFilter
        ? `/api/admin/woocommerce/products?category=${encodeURIComponent(categoryFilter)}`
        : "/api/admin/woocommerce/products";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load products");
      return res.json();
    },
    refetchInterval: (q) => (q.state.data?.sync.inFlight ? 2000 : false),
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/woocommerce/sync", { method: "POST", credentials: "include" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Sync failed");
      return body;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-woo-products"] }),
  });

  const visibilityMutation = useMutation({
    mutationFn: async ({ wcId, hidden }: { wcId: number; hidden: boolean }) => {
      const res = await fetch(`/api/admin/woocommerce/products/${wcId}/visibility`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ hidden }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-woo-products"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products-grouped"] });
    },
  });

  const bulkOrderMutation = useMutation({
    mutationFn: async (orderedWcIds: number[]) => {
      const body: Record<string, unknown> = { orderedWcIds };
      if (categoryFilter) body.categorySlug = categoryFilter;
      const res = await fetch("/api/admin/woocommerce/products/bulk-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Reorder failed");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-woo-products"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products-grouped"] });
    },
    onError: () => {
      // Roll the optimistic order back to whatever the server has.
      setLocalOrder(null);
      queryClient.invalidateQueries({ queryKey: ["admin-woo-products"] });
    },
  });

  const resetOrderMutation = useMutation({
    mutationFn: async () => {
      const body: Record<string, unknown> = {};
      if (categoryFilter) body.categorySlug = categoryFilter;
      const res = await fetch("/api/admin/woocommerce/products/reset-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Reset failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-woo-products"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products-grouped"] });
      const scope = categoryFilter
        ? `category “${categoryOptions.find((c) => c.slug === categoryFilter)?.name || categoryFilter}”`
        : "the whole shop";
      toast({
        title: "Display order reset",
        description: `Cleared local sort overrides for ${scope}. Products will fall back to the WooCommerce menu order.`,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Reset failed";
      toast({ title: "Reset failed", description: message, variant: "destructive" });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (vars: { name: string; slug?: string; parent?: number }) => {
      const res = await fetch("/api/admin/woocommerce/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(vars),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to create category");
      return body as ShopCategoryOption;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-woo-categories"] });
      queryClient.invalidateQueries({ queryKey: ["shop-categories"] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (vars: { id: number; name?: string; slug?: string; parent?: number | null }) => {
      const { id, ...rest } = vars;
      const res = await fetch(`/api/admin/woocommerce/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(rest),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to update category");
      return body as ShopCategoryOption;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-woo-categories"] });
      queryClient.invalidateQueries({ queryKey: ["shop-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-woo-products"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products-grouped"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/woocommerce/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to delete category");
      return body as { success: boolean; id: number };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-woo-categories"] });
      queryClient.invalidateQueries({ queryKey: ["shop-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-woo-products"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products-grouped"] });
    },
  });

  const categoryMutation = useMutation({
    mutationFn: async (vars: { wcIds: number[]; mode: "add" | "remove" | "set"; categoryIds: number[]; _undo?: boolean }) => {
      const res = await fetch("/api/admin/woocommerce/products/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wcIds: vars.wcIds, mode: vars.mode, categoryIds: vars.categoryIds }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Category update failed");
      return body as {
        success: boolean;
        updated: { wcId: number; categories: { id: number; name: string; slug: string }[] }[];
        failures: { wcId: number; error: string }[];
      };
    },
    onSuccess: (result, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-woo-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-woo-categories"] });
      queryClient.invalidateQueries({ queryKey: ["shop-products-grouped"] });

      const catId = vars.categoryIds[0];
      const catName = categoryOptions.find((c) => c.id === catId)?.name || `category #${catId}`;
      const updatedCount = result.updated.length;
      const noun = `product${updatedCount === 1 ? "" : "s"}`;
      const summary =
        vars.mode === "add"
          ? `Added ${updatedCount} ${noun} to “${catName}”`
          : vars.mode === "remove"
          ? `Removed ${updatedCount} ${noun} from “${catName}”`
          : `Replaced categories on ${updatedCount} ${noun} with “${catName}”`;

      const failureDescription = result.failures.length > 0
        ? `Some products could not be updated:\n${result.failures.map((f) => `#${f.wcId}: ${f.error}`).join("\n")}`
        : undefined;

      if (vars._undo) {
        toast({
          title: "Undone",
          description: failureDescription ?? summary,
          variant: failureDescription ? "destructive" : undefined,
        });
        return;
      }

      const undoMode: "add" | "remove" | null =
        vars.mode === "add" ? "remove" : vars.mode === "remove" ? "add" : null;
      const undoableIds = result.updated.map((u) => u.wcId);
      const action =
        undoMode && undoableIds.length > 0
          ? (
              <ToastAction
                altText="Undo this change"
                onClick={() =>
                  categoryMutation.mutate({
                    wcIds: undoableIds,
                    mode: undoMode,
                    categoryIds: vars.categoryIds,
                    _undo: true,
                  })
                }
              >
                Undo
              </ToastAction>
            )
          : undefined;

      toast({
        title: summary,
        description: failureDescription,
        variant: failureDescription ? "destructive" : undefined,
        action,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Category update failed";
      toast({ title: "Category update failed", description: message, variant: "destructive" });
    },
  });

  const sync = data?.sync;
  const serverProducts = data?.products ?? [];
  // Apply any in-flight optimistic ordering on top of the server list. We
  // only honour localOrder when its id-set matches the server set so a sync
  // that adds/removes products doesn't leave us showing stale ghosts.
  const products = useMemo(() => {
    if (!localOrder || serverProducts.length === 0) return serverProducts;
    const byId = new Map(serverProducts.map((p) => [p.wcId, p] as const));
    if (localOrder.length !== serverProducts.length) return serverProducts;
    const reordered: WooAdminProduct[] = [];
    for (const id of localOrder) {
      const p = byId.get(id);
      if (!p) return serverProducts;
      reordered.push(p);
    }
    return reordered;
  }, [serverProducts, localOrder]);

  // Drop the optimistic order once the server's list matches it (the next
  // refetch will deliver the canonical sequence).
  useEffect(() => {
    if (!localOrder) return;
    if (serverProducts.length !== localOrder.length) return;
    const matches = serverProducts.every((p, i) => p.wcId === localOrder[i]);
    if (matches) setLocalOrder(null);
  }, [serverProducts, localOrder]);

  const filtered = products.filter((p) => {
    if (!showHidden && p.hidden) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
  });
  // Reorder works against the full list (or full category list) on the server,
  // so only allow it when the visible list matches that list — otherwise an
  // "up" click could jump past hidden or filtered-out neighbours that aren't
  // on screen.
  const reorderEnabled = !search && showHidden;
  const reorderDisabledReason = search
    ? "Clear the search to reorder"
    : "Turn on \"Show hidden\" to reorder";
  const orderingScopeLabel = categoryFilter
    ? `category “${categoryOptions.find((c) => c.slug === categoryFilter)?.name || categoryFilter}”`
    : "the whole shop";

  const sensors = useSensors(
    // Activate after a small drag distance so clicks on the row's buttons
    // (visibility toggle, arrows, links) still work without starting a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Bulk-select state: a Set of wcIds that the admin has ticked. The bulk
  // toolbar appears whenever at least one row is selected and lets the admin
  // add/remove categories on the whole selection in a single API call.
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  // Track which row is currently being dragged so we can decide whether a
  // drop on a category lane should target the whole multi-selection (when
  // the dragged row is part of the selection) or just the single row.
  const [activeDragId, setActiveDragId] = useState<number | null>(null);

  function toggleSelected(wcId: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(wcId)) next.delete(wcId);
      else next.add(wcId);
      return next;
    });
  }

  function handleDragStart(event: DragStartEvent) {
    const id = Number(event.active.id);
    if (Number.isInteger(id)) setActiveDragId(id);
  }

  function commitReorder(prev: number[], next: number[]) {
    if (prev.length === next.length && prev.every((v, i) => v === next[i])) return;
    setLocalOrder(next);
    bulkOrderMutation.mutate(next, {
      onSuccess: () => {
        // Show a per-action undo toast that restores the previous order via
        // a single bulk-order call. TOAST_LIMIT=1 ensures only the most
        // recent reorder's undo is offered, matching the task spec.
        const t = toast({
          title: "Order updated",
          description: "Reordered product. Drop in the wrong spot?",
          duration: 6000,
          action: (
            <ToastAction
              altText="Undo reorder"
              onClick={() => {
                t.dismiss();
                setLocalOrder(prev);
                bulkOrderMutation.mutate(prev);
              }}
            >
              Undo
            </ToastAction>
          ),
        });
      },
    });
  }


  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    // Drops on a category lane carry an id of the form "cat:<id>". We treat
    // those as "add this product (or the whole selection) to that category"
    // — independent of the sort-reorder flow below.
    const overId = String(over.id);
    if (overId.startsWith("cat:")) {
      const categoryId = Number(overId.slice(4));
      if (!Number.isInteger(categoryId) || categoryId <= 0) return;
      const draggedId = Number(active.id);
      // If the dragged row is part of a multi-selection, move the whole
      // selection. Otherwise just move the single row.
      const targetIds = selectedIds.has(draggedId) ? Array.from(selectedIds) : [draggedId];
      if (targetIds.length === 0) return;
      categoryMutation.mutate({ wcIds: targetIds, mode: "add", categoryIds: [categoryId] });
      return;
    }

    if (active.id === over.id) return;
    if (!reorderEnabled) return;
    const ids = products.map((p) => p.wcId);
    const oldIndex = ids.indexOf(Number(active.id));
    const newIndex = ids.indexOf(Number(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = arrayMove(ids, oldIndex, newIndex);
    commitReorder(ids, next);
  }

  // Filter selectedIds whenever the visible product set changes so we don't
  // hold onto ids that have been deleted/hidden out of view.
  const visibleIds = useMemo(() => new Set(products.map((p) => p.wcId)), [products]);
  useEffect(() => {
    setSelectedIds((prev) => {
      let changed = false;
      const next = new Set<number>();
      for (const id of prev) {
        if (visibleIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [visibleIds]);

  const lastSyncLabel = sync?.lastResult
    ? new Date(sync.lastResult.finishedAt).toLocaleString()
    : "Never";

  return (
    <div className="border border-border rounded-lg p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <Package className="w-4 h-4 text-[#3a9ca5]" /> WooCommerce Products
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            Products are synced from WooCommerce on the source site and stored locally for fast display. Edit titles, prices, descriptions, images and categories in WordPress — they'll appear here on the next sync. Use the toggle to hide a product from the public Replit shop without removing it from WooCommerce.
          </p>
          <div className="text-[11px] text-muted-foreground mt-2">
            Last synced: <span className="font-mono">{lastSyncLabel}</span>
            {sync?.lastResult && (
              <span className="ml-2">
                ({sync.lastResult.total} products · {sync.lastResult.inserted} new · {sync.lastResult.updated} updated · {sync.lastResult.removed} removed)
              </span>
            )}
          </div>
          {sync?.lastError && (
            <div className="text-[11px] text-red-600 mt-1 inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Last sync error: {sync.lastError.message}
            </div>
          )}
          {sync?.lastResult && !sync.lastResult.complete && (
            <div className="mt-2 rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-xs p-2 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Last sync was incomplete</div>
                <div className="mt-0.5">
                  The sync hit the page cap (over 5,000 products) and may have missed some items. Stale products were not removed to avoid data loss. Investigate the WooCommerce catalog or raise the page cap, then run a manual sync.
                </div>
              </div>
            </div>
          )}
          {!sync?.configured && (
            <div className="text-[11px] text-amber-700 mt-1 inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> WooCommerce credentials missing. Set WC_CONSUMER_KEY and WC_CONSUMER_SECRET.
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending || sync?.inFlight || !sync?.configured}
            size="sm"
            className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
          >
            {syncMutation.isPending || sync?.inFlight ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            Sync products now
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or slug…"
          className="flex-1 min-w-[200px] px-3 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
          title="Filter products by shop category. Selecting a category lets you set a per-category sort order independent of the global order."
        >
          <option value="">All categories (global order)</option>
          {categoryOptions.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>
        <label className="text-xs inline-flex items-center gap-1.5 text-muted-foreground cursor-pointer">
          <input type="checkbox" checked={showHidden} onChange={(e) => setShowHidden(e.target.checked)} />
          Show hidden
        </label>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const scopeLabel = categoryFilter
              ? `category “${categoryOptions.find((c) => c.slug === categoryFilter)?.name || categoryFilter}”`
              : "the whole shop";
            toast({
              title: "Reset display order?",
              description: `This clears local sort overrides for ${scopeLabel} and falls back to the WooCommerce menu order.`,
              action: (
                <ToastAction
                  altText="Confirm reset"
                  onClick={() => resetOrderMutation.mutate()}
                >
                  Reset
                </ToastAction>
              ),
            });
          }}
          disabled={resetOrderMutation.isPending}
          title={categoryFilter
            ? "Clear this category's per-category overrides"
            : "Drop local sort overrides and fall back to WooCommerce menu_order"}
        >
          {resetOrderMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <RotateCcw className="w-3.5 h-3.5 mr-1.5" />}
          {categoryFilter ? "Reset category order" : "Reset order"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground -mt-1">
        Drag the grip handle on a product card to drop it into a new position, or use the up/down arrows for keyboard-friendly fine adjustments. Reordering applies to {orderingScopeLabel}. Reordering is only available when no search filter is applied and "Show hidden" is on (so positions stay consistent with the full list). To change a product's category assignment, drag a card onto a category lane below, use the “+ Category” picker on the row, or tick multiple rows and use the bulk toolbar.
      </p>

      {isLoading ? (
        <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading products…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          {products.length === 0
            ? "No products synced yet. Click \"Sync products now\" to pull from WooCommerce."
            : "No products match your filters."}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveDragId(null)}
        >
          <CategoryDropLanes
            categories={categoryOptions}
            activeDragId={activeDragId}
            selectedIds={selectedIds}
            disabled={categoryMutation.isPending}
            onEdit={(id, vars) =>
              updateCategoryMutation.mutateAsync({ id, ...vars }).catch((err: unknown) => {
                const message = err instanceof Error ? err.message : "Failed to update category";
                alert(message);
                throw err;
              })
            }
            onDelete={(id) =>
              deleteCategoryMutation.mutateAsync(id).catch((err: unknown) => {
                const message = err instanceof Error ? err.message : "Failed to delete category";
                alert(message);
                throw err;
              })
            }
            editPending={updateCategoryMutation.isPending}
            deletePending={deleteCategoryMutation.isPending}
          />
          <NewCategoryForm
            categories={categoryOptions}
            pending={createCategoryMutation.isPending}
            onSubmit={(vars) =>
              createCategoryMutation.mutateAsync(vars).catch((err: unknown) => {
                const message = err instanceof Error ? err.message : "Failed to create category";
                alert(message);
                throw err;
              })
            }
          />
          {selectedIds.size > 0 && (
            <BulkCategoryToolbar
              selectedCount={selectedIds.size}
              categories={categoryOptions}
              onApply={(mode, categoryIds) => {
                if (categoryIds.length === 0) return;
                categoryMutation.mutate({
                  wcIds: Array.from(selectedIds),
                  mode,
                  categoryIds,
                });
              }}
              onClear={() => setSelectedIds(new Set())}
              pending={categoryMutation.isPending}
            />
          )}
          <SortableContext items={filtered.map((p) => p.wcId)} strategy={verticalListSortingStrategy}>
            <div className="border border-border rounded overflow-hidden divide-y divide-border max-h-[600px] overflow-y-auto">
              {filtered.map((p, i) => (
                <SortableProductRow
                  key={p.wcId}
                  product={p}
                  index={i}
                  totalCount={filtered.length}
                  reorderEnabled={reorderEnabled}
                  reorderDisabledReason={reorderDisabledReason}
                  reorderPending={bulkOrderMutation.isPending}
                  onMoveUp={() => {
                    const above = filtered[i - 1];
                    if (!above) return;
                    const ids = products.map((pp) => pp.wcId);
                    const fromIdx = ids.indexOf(p.wcId);
                    const toIdx = ids.indexOf(above.wcId);
                    if (fromIdx === -1 || toIdx === -1) return;
                    commitReorder(ids, arrayMove(ids, fromIdx, toIdx));
                  }}
                  onMoveDown={() => {
                    const below = filtered[i + 1];
                    if (!below) return;
                    const ids = products.map((pp) => pp.wcId);
                    const fromIdx = ids.indexOf(p.wcId);
                    const toIdx = ids.indexOf(below.wcId);
                    if (fromIdx === -1 || toIdx === -1) return;
                    commitReorder(ids, arrayMove(ids, fromIdx, toIdx));
                  }}
                  onToggleVisibility={() => visibilityMutation.mutate({ wcId: p.wcId, hidden: !p.hidden })}
                  visibilityPending={visibilityMutation.isPending}
                  categoryScope={categoryFilter || null}
                  selected={selectedIds.has(p.wcId)}
                  onToggleSelected={() => toggleSelected(p.wcId)}
                  allCategories={categoryOptions}
                  onAddCategory={(categoryId) =>
                    categoryMutation.mutate({ wcIds: [p.wcId], mode: "add", categoryIds: [categoryId] })
                  }
                  onRemoveCategory={(categoryId) =>
                    categoryMutation.mutate({ wcIds: [p.wcId], mode: "remove", categoryIds: [categoryId] })
                  }
                  categoryPending={categoryMutation.isPending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <WebhookEventsPanel />
    </div>
  );
}

interface SortableProductRowProps {
  product: WooAdminProduct;
  index: number;
  totalCount: number;
  reorderEnabled: boolean;
  reorderDisabledReason: string;
  reorderPending: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleVisibility: () => void;
  visibilityPending: boolean;
  // When non-null, the row is being viewed inside a per-category scope and
  // shows a small badge with its position within that category.
  categoryScope: string | null;
  selected: boolean;
  onToggleSelected: () => void;
  allCategories: ShopCategoryOption[];
  onAddCategory: (categoryId: number) => void;
  onRemoveCategory: (categoryId: number) => void;
  categoryPending: boolean;
}

function SortableProductRow({
  product: p,
  index: i,
  totalCount,
  reorderEnabled,
  reorderDisabledReason,
  reorderPending,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  visibilityPending,
  categoryScope,
  selected,
  onToggleSelected,
  allCategories,
  onAddCategory,
  onRemoveCategory,
  categoryPending,
}: SortableProductRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: p.wcId });
  // We intentionally always allow the drag listeners to engage, even when
  // the sort-reorder flow is disabled, so the admin can still drag a card
  // onto a category lane to change its category assignment.

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  const assignedIds = new Set(p.categories.map((c) => c.id));
  const addableCategories = allCategories.filter((c) => !assignedIds.has(c.id));

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-secondary/30 bg-background",
        isDragging && "shadow-lg ring-2 ring-[#3a9ca5]/40",
        selected && "bg-[#3a9ca5]/5",
      )}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={onToggleSelected}
        className="mt-2 shrink-0"
        aria-label={`Select ${p.name} for bulk actions`}
        title="Select for bulk category actions"
      />
      <button
        type="button"
        {...attributes}
        {...listeners}
        disabled={categoryPending}
        className="p-1 mt-1 rounded text-muted-foreground hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed cursor-grab active:cursor-grabbing touch-none shrink-0"
        title={
          categoryPending
            ? "Saving…"
            : reorderEnabled
            ? "Drag to reorder, or drop on a category lane to add to that category"
            : `Drop on a category lane to add to that category. ${reorderDisabledReason} for in-list reordering.`
        }
        aria-label="Drag to reorder or assign to a category"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex flex-col gap-0.5 shrink-0">
        <button
          onClick={onMoveUp}
          disabled={!reorderEnabled || i === 0 || reorderPending}
          className="p-0.5 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          title={reorderEnabled ? "Move up" : reorderDisabledReason}
          aria-label="Move product up"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={!reorderEnabled || i === totalCount - 1 || reorderPending}
          className="p-0.5 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          title={reorderEnabled ? "Move down" : reorderDisabledReason}
          aria-label="Move product down"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>
      {p.thumbnail ? (
        <img src={p.thumbnail} alt="" className="w-12 h-12 object-cover rounded shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center shrink-0">
          <Package className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate flex items-center gap-2">
          {categoryScope && reorderEnabled && (
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#3a9ca5]/10 text-[#3a9ca5] shrink-0"
              title={p.categorySortOrder != null
                ? `Position #${i + 1} in this category (override #${p.categorySortOrder})`
                : `Position #${i + 1} in this category (using global order)`}
            >
              #{i + 1}
            </span>
          )}
          <span className="truncate">{p.name}</span>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          <code className="font-mono">{p.slug}</code>
          {p.price && <span className="ml-2">£{p.price}</span>}
          {p.onSale && <span className="ml-1.5 text-amber-600">on sale</span>}
          {p.stockStatus !== "instock" && (
            <span className="ml-1.5 text-red-600">{p.stockStatus}</span>
          )}
          {categoryScope && p.categorySortOrder == null && (
            <span className="ml-1.5 italic">no per-category override yet</span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1">
          {p.categories.length === 0 && (
            <span className="text-[10px] italic text-amber-700">No categories assigned</span>
          )}
          {p.categories.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-secondary text-foreground/80"
              title={`Slug: ${c.slug}`}
            >
              {c.name}
              <button
                type="button"
                onClick={() => {
                  if (p.categories.length <= 1) {
                    toast({
                      title: "Can't remove the last category",
                      description: "A product must belong to at least one category.",
                      variant: "destructive",
                    });
                    return;
                  }
                  onRemoveCategory(c.id);
                }}
                disabled={categoryPending || p.categories.length <= 1}
                className="text-muted-foreground hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label={`Remove category ${c.name}`}
                title={p.categories.length <= 1 ? "Cannot remove the last category" : "Remove this category"}
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {addableCategories.length > 0 && (
            <select
              value=""
              onChange={(e) => {
                const id = Number(e.target.value);
                if (Number.isInteger(id) && id > 0) onAddCategory(id);
                e.currentTarget.value = "";
              }}
              disabled={categoryPending}
              className="text-[10px] px-1 py-0.5 rounded border border-dashed border-border bg-transparent text-muted-foreground hover:border-[#3a9ca5] hover:text-[#3a9ca5] focus:outline-none disabled:opacity-50"
              title="Add this product to another category"
            >
              <option value="">+ Category…</option>
              {addableCategories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>
      <span
        className={cn(
          "text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap",
          p.hidden ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700",
        )}
      >
        {p.hidden ? "Hidden" : "Visible"}
      </span>
      <Button
        size="sm"
        variant="outline"
        onClick={onToggleVisibility}
        disabled={visibilityPending}
        className="shrink-0"
      >
        {p.hidden ? "Show" : "Hide"}
      </Button>
      <a
        href={p.permalink}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs inline-flex items-center gap-1 px-2.5 py-1 rounded border border-border hover:bg-secondary shrink-0"
        title="Open WooCommerce purchase page in a new tab"
      >
        <ExternalLink className="w-3 h-3" /> Test purchase link
      </a>
    </div>
  );
}

interface CategoryDropLanesProps {
  categories: ShopCategoryOption[];
  // The wcId of the row currently being dragged. Used to highlight valid drop
  // lanes (i.e. lanes the dragged product is not already a member of) so the
  // admin gets useful visual feedback during the drag.
  activeDragId: number | null;
  selectedIds: Set<number>;
  disabled: boolean;
  onEdit: (id: number, vars: { name?: string; slug?: string; parent?: number | null }) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
  editPending: boolean;
  deletePending: boolean;
}

function CategoryDropLanes({
  categories,
  activeDragId,
  selectedIds,
  disabled,
  onEdit,
  onDelete,
  editPending,
  deletePending,
}: CategoryDropLanesProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  if (categories.length === 0) return null;
  const dragging = activeDragId !== null;
  // When the dragged row is part of the multi-selection, dropping on a lane
  // assigns the whole selection. Otherwise just the single dragged row.
  const dropTargetCount = activeDragId !== null && selectedIds.has(activeDragId) ? selectedIds.size : 1;

  const editing = editingId !== null ? categories.find((c) => c.id === editingId) ?? null : null;

  return (
    <div
      className={cn(
        "border border-dashed rounded-lg p-3 mb-3 transition-colors",
        dragging ? "border-[#3a9ca5] bg-[#3a9ca5]/5" : "border-border bg-secondary/20",
      )}
    >
      <div className="text-[11px] font-semibold text-muted-foreground mb-2">
        {dragging
          ? `Drop on a category to add ${dropTargetCount} product${dropTargetCount === 1 ? "" : "s"} to it`
          : "Drag a product card onto one of these category lanes to add it to that category. Hover a lane to rename or delete it."}
      </div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => (
          <CategoryDropTarget
            key={c.id}
            category={c}
            active={dragging}
            disabled={disabled}
            onEditClick={() => setEditingId(c.id)}
            onDeleteClick={async () => {
              const msg =
                c.count > 0
                  ? `Delete category “${c.name}”? It currently contains ${c.count} product${c.count === 1 ? "" : "s"}, which will fall back to the WooCommerce default category if they don't have other categories assigned.`
                  : `Delete category “${c.name}”? This cannot be undone.`;
              if (!window.confirm(msg)) return;
              await onDelete(c.id).catch(() => {
                /* error already alerted in parent */
              });
            }}
            deletePending={deletePending}
          />
        ))}
      </div>
      {editing && (
        <EditCategoryForm
          key={editing.id}
          category={editing}
          allCategories={categories}
          pending={editPending}
          onCancel={() => setEditingId(null)}
          onSubmit={async (vars) => {
            await onEdit(editing.id, vars);
            setEditingId(null);
          }}
        />
      )}
    </div>
  );
}

function CategoryDropTarget({
  category,
  active,
  disabled,
  onEditClick,
  onDeleteClick,
  deletePending,
}: {
  category: ShopCategoryOption;
  active: boolean;
  disabled: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  deletePending: boolean;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `cat:${category.id}`,
    disabled,
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "group relative px-3 py-2 pr-12 rounded border text-xs font-medium transition-all select-none",
        isOver
          ? "border-[#3a9ca5] bg-[#3a9ca5] text-white scale-105 shadow"
          : active
          ? "border-[#3a9ca5]/60 bg-background text-foreground"
          : "border-border bg-background text-muted-foreground",
        disabled && "opacity-50",
      )}
      title={`Slug: ${category.slug} · ${category.count} product${category.count === 1 ? "" : "s"}`}
    >
      {category.name}
      <span className="ml-1.5 text-[10px] opacity-70">({category.count})</span>
      {!active && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            className="p-1 rounded hover:bg-secondary text-foreground"
            aria-label={`Edit category ${category.name}`}
            title="Rename / change slug or parent"
          >
            <Pencil className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick();
            }}
            disabled={deletePending}
            className="p-1 rounded hover:bg-red-100 text-red-600 disabled:opacity-50"
            aria-label={`Delete category ${category.name}`}
            title="Delete category"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

interface EditCategoryFormProps {
  category: ShopCategoryOption;
  allCategories: ShopCategoryOption[];
  pending: boolean;
  onCancel: () => void;
  onSubmit: (vars: { name?: string; slug?: string; parent?: number | null }) => Promise<unknown>;
}

function EditCategoryForm({ category, allCategories, pending, onCancel, onSubmit }: EditCategoryFormProps) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [parent, setParent] = useState<string>(category.parent ? String(category.parent) : "");

  const trimmedName = name.trim();
  const trimmedSlug = slug.trim();
  const slugValid = trimmedSlug !== "" && /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(trimmedSlug);
  // Avoid offering this category (or no-ops) as its own parent.
  const parentOptions = allCategories.filter((c) => c.id !== category.id);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmedName || !slugValid || pending) return;
    const vars: { name?: string; slug?: string; parent?: number | null } = {};
    if (trimmedName !== category.name) vars.name = trimmedName;
    if (trimmedSlug !== category.slug) vars.slug = trimmedSlug;
    const newParent = parent ? Number(parent) : 0;
    const oldParent = category.parent ?? 0;
    if (newParent !== oldParent) {
      vars.parent = parent ? newParent : null;
    }
    if (Object.keys(vars).length === 0) {
      onCancel();
      return;
    }
    try {
      await onSubmit(vars);
    } catch {
      // error surfaced by parent
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-3 border border-[#3a9ca5]/40 bg-background rounded-lg p-3 flex items-end gap-2 flex-wrap"
    >
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-muted-foreground">
          Edit “{category.name}”
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          maxLength={100}
          disabled={pending}
          className="px-2 py-1 rounded border border-border bg-background text-xs min-w-[160px] focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-muted-foreground">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          disabled={pending}
          className={cn(
            "px-2 py-1 rounded border bg-background text-xs min-w-[140px] focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30",
            slugValid ? "border-border" : "border-red-400",
          )}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-muted-foreground">Parent</label>
        <select
          value={parent}
          onChange={(e) => setParent(e.target.value)}
          disabled={pending}
          className="px-2 py-1 rounded border border-border bg-background text-xs min-w-[160px]"
        >
          <option value="">None (top level)</option>
          {parentOptions.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={pending || !trimmedName || !slugValid}
        className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
        Save changes
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={onCancel}
      >
        Cancel
      </Button>
      {!slugValid && (
        <span className="text-[11px] text-red-600 w-full">
          Slug must be lowercase letters, numbers and hyphens only.
        </span>
      )}
    </form>
  );
}

interface NewCategoryFormProps {
  categories: ShopCategoryOption[];
  pending: boolean;
  onSubmit: (vars: { name: string; slug?: string; parent?: number }) => Promise<unknown>;
}

function NewCategoryForm({ categories, pending, onSubmit }: NewCategoryFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parent, setParent] = useState("");

  const trimmedName = name.trim();
  const trimmedSlug = slug.trim();
  const slugValid = trimmedSlug === "" || /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(trimmedSlug);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!trimmedName || !slugValid || pending) return;
    const vars: { name: string; slug?: string; parent?: number } = { name: trimmedName };
    if (trimmedSlug) vars.slug = trimmedSlug;
    if (parent) {
      const n = Number(parent);
      if (Number.isInteger(n) && n > 0) vars.parent = n;
    }
    try {
      await onSubmit(vars);
      setName("");
      setSlug("");
      setParent("");
    } catch {
      // error already surfaced by the parent mutation
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="border border-dashed border-border rounded-lg p-3 mb-3 flex items-end gap-2 flex-wrap bg-secondary/10"
    >
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-muted-foreground">New category</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          maxLength={100}
          disabled={pending}
          className="px-2 py-1 rounded border border-border bg-background text-xs min-w-[160px] focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-muted-foreground">Slug (optional)</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="auto"
          disabled={pending}
          className={cn(
            "px-2 py-1 rounded border bg-background text-xs min-w-[140px] focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30",
            slugValid ? "border-border" : "border-red-400",
          )}
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-semibold text-muted-foreground">Parent (optional)</label>
        <select
          value={parent}
          onChange={(e) => setParent(e.target.value)}
          disabled={pending}
          className="px-2 py-1 rounded border border-border bg-background text-xs min-w-[160px]"
        >
          <option value="">None (top level)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={pending || !trimmedName || !slugValid}
        className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
        Create category
      </Button>
      {!slugValid && (
        <span className="text-[11px] text-red-600 w-full">
          Slug must be lowercase letters, numbers and hyphens only.
        </span>
      )}
    </form>
  );
}

interface BulkCategoryToolbarProps {
  selectedCount: number;
  categories: ShopCategoryOption[];
  onApply: (mode: "add" | "remove" | "set", categoryIds: number[]) => void;
  onClear: () => void;
  pending: boolean;
}

function BulkCategoryToolbar({ selectedCount, categories, onApply, onClear, pending }: BulkCategoryToolbarProps) {
  const [mode, setMode] = useState<"add" | "remove" | "set">("add");
  const [categoryId, setCategoryId] = useState<string>("");

  return (
    <div className="border border-[#3a9ca5]/40 bg-[#3a9ca5]/5 rounded-lg p-3 mb-3 flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-foreground">
        {selectedCount} selected
      </span>
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as "add" | "remove" | "set")}
        disabled={pending}
        className="text-xs px-2 py-1 rounded border border-border bg-background"
      >
        <option value="add">Add to category</option>
        <option value="remove">Remove from category</option>
        <option value="set">Replace with only this category</option>
      </select>
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        disabled={pending}
        className="text-xs px-2 py-1 rounded border border-border bg-background min-w-[160px]"
      >
        <option value="">Choose category…</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <Button
        size="sm"
        onClick={() => {
          const id = Number(categoryId);
          if (!Number.isInteger(id) || id <= 0) return;
          onApply(mode, [id]);
        }}
        disabled={pending || !categoryId}
        className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"
      >
        {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
        Apply
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} disabled={pending}>
        Clear selection
      </Button>
    </div>
  );
}

interface WebhookEvent {
  id: string;
  ts: string;
  topic: string;
  ip: string;
  signatureValid: boolean;
  syncTriggered: boolean;
  status: number;
  note?: string;
}

interface WebhookEventsResponse {
  configured: boolean;
  events: WebhookEvent[];
}

function WebhookEventsPanel() {
  const { data, isLoading, refetch, isFetching } = useQuery<WebhookEventsResponse>({
    queryKey: ["admin-woo-webhook-events"],
    queryFn: async () => {
      const res = await fetch("/api/admin/woocommerce/webhook-events", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load webhook events");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const events = data?.events ?? [];
  const configured = data?.configured ?? false;

  return (
    <div className="border-t border-border pt-4 mt-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-sm font-semibold flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#3a9ca5]" /> Recent webhook events
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
            The most recent hits to <code className="font-mono">/api/webhooks/woocommerce</code>. WordPress should ping this when products change so the site updates within seconds instead of waiting for the next 30-minute sync.
          </p>
          {!configured && (
            <div className="text-[11px] text-amber-700 mt-1 inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> WC_WEBHOOK_SECRET is not set — incoming webhooks will be rejected as unauthorized.
            </div>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}>
          {isFetching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {isLoading ? (
        <div className="py-4 flex items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading events…
        </div>
      ) : events.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-border p-4 text-xs text-muted-foreground space-y-2">
          <div className="font-semibold text-foreground">No webhook events received yet.</div>
          <p>To enable instant product sync, add a webhook in WordPress:</p>
          <ol className="list-decimal pl-5 space-y-0.5">
            <li>WP Admin → WooCommerce → Settings → Advanced → Webhooks → <span className="font-semibold">Add webhook</span>.</li>
            <li>Status <span className="font-semibold">Active</span>; API Version <span className="font-semibold">WP REST API Integration v3</span>.</li>
            <li>Set the Secret to the same value as <code className="font-mono">WC_WEBHOOK_SECRET</code> on the server.</li>
            <li>Create one webhook each for topics: Product created, updated, deleted, restored.</li>
            <li>Delivery URL: <code className="font-mono">{typeof window !== "undefined" ? window.location.origin : ""}/api/webhooks/woocommerce</code></li>
          </ol>
          <p>Events appear here within a few seconds of being received.</p>
        </div>
      ) : (
        <div className="mt-3 border border-border rounded overflow-hidden divide-y divide-border max-h-[320px] overflow-y-auto">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 p-2.5 text-xs hover:bg-secondary/30">
              <span className="text-muted-foreground font-mono shrink-0 w-40">
                {new Date(ev.ts).toLocaleString("en-GB")}
              </span>
              <span className="font-mono shrink-0 w-36 truncate" title={ev.topic}>{ev.topic}</span>
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 inline-flex items-center gap-1",
                  ev.signatureValid
                    ? "bg-emerald-100 text-emerald-700"
                    : ev.topic === "(ping)"
                    ? "bg-secondary text-muted-foreground"
                    : "bg-red-100 text-red-700",
                )}
                title="HMAC signature verification result"
              >
                {ev.signatureValid ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                sig {ev.signatureValid ? "ok" : "fail"}
              </span>
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0",
                  ev.syncTriggered ? "bg-[#3a9ca5]/15 text-[#2d8890]" : "bg-secondary text-muted-foreground",
                )}
                title="Whether this event triggered a product re-sync"
              >
                {ev.syncTriggered ? "sync triggered" : "no sync"}
              </span>
              <span className="font-mono text-muted-foreground shrink-0 w-12 text-right">{ev.status}</span>
              <span className="flex-1 min-w-0 text-muted-foreground truncate" title={ev.note ? `${ev.note} · ${ev.ip}` : ev.ip}>
                {ev.note ? `${ev.note} · ` : ""}{ev.ip}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========== PAGES TAB ========== */
interface CustomPage {
  id: number;
  slug: string;
  title: string;
  template: PageTemplate;
  data: PageData;
  published: boolean;
  updatedAt: string;
}

const TEMPLATE_DEFAULTS: Record<PageTemplate, PageData> = {
  standard: { eyebrow: "", intro: "", body: "" },
  cards:    { eyebrow: "", intro: "", cards: [{ title: "Card title", description: "Card description.", href: "" }] },
  features: { eyebrow: "", intro: "", features: [{ title: "Feature", description: "Feature detail." }], ctaLabel: "", ctaHref: "" },
  about:    { eyebrow: "", intro: "", body: "", imageUrl: "", ctaLabel: "", ctaHref: "" },
  contact:  { eyebrow: "", intro: "", email: "", phone: "", address: "", body: "" },
  richhtml: { eyebrow: "", intro: "", body: "" },
};

function PagesTab({ initialEditId }: { initialEditId?: number | null }) {
  const queryClient = useQueryClient();
  const { data: pages = [], isLoading } = useQuery<CustomPage[]>({
    queryKey: ["admin-pages"],
    queryFn: async () => {
      const res = await fetch("/api/pages");
      return res.json();
    },
  });

  const [editing, setEditing] = useState<CustomPage | "new" | null>(null);
  const [autoOpenedId, setAutoOpenedId] = useState<number | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [form, setForm] = useState<{ slug: string; title: string; template: PageTemplate; data: PageData; published: boolean }>({
    slug: "", title: "", template: "standard", data: TEMPLATE_DEFAULTS.standard, published: true,
  });
  const [error, setError] = useState("");

  function startNew() {
    setForm({ slug: "", title: "", template: "standard", data: { ...TEMPLATE_DEFAULTS.standard }, published: true });
    setError("");
    setEditing("new");
  }

  function startEdit(p: CustomPage) {
    setForm({ slug: p.slug, title: p.title, template: p.template, data: { ...TEMPLATE_DEFAULTS[p.template], ...p.data }, published: p.published });
    setError("");
    setEditing(p);
  }

  function changeTemplate(t: PageTemplate) {
    setForm((f) => ({ ...f, template: t, data: { ...TEMPLATE_DEFAULTS[t], ...f.data } }));
  }

  useEffect(() => {
    if (initialEditId == null) return;
    if (autoOpenedId === initialEditId) return;
    if (editing !== null) return;
    const target = pages.find((p) => p.id === initialEditId);
    if (target) {
      startEdit(target);
      setAutoOpenedId(initialEditId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEditId, pages]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const isNew = editing === "new";
      const url = isNew ? "/api/pages" : `/api/pages/${(editing as CustomPage).id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pages"] });
      queryClient.invalidateQueries({ queryKey: ["wp-slug"] });
      setEditing(null);
      setError("");
    },
    onError: (e: any) => setError(e.message || "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/pages/${id}`, { method: "DELETE", credentials: "include" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-pages"] }),
  });

  if (editing !== null) {
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{editing === "new" ? "New Page" : `Edit: ${(editing as CustomPage).title}`}</h2>
            <p className="text-sm text-muted-foreground">Choose a template, fill in the fields, then save. The page will appear at <code className="text-[#3a9ca5]">/{form.slug || "your-slug"}</code>.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewOpen((v) => !v)}>
              <Eye className="w-4 h-4 mr-1" /> {previewOpen ? "Hide" : "Preview"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEditing(null); setPreviewOpen(false); }}>Cancel</Button>
            <Button size="sm" disabled={saveMutation.isPending || !form.title.trim()} onClick={() => saveMutation.mutate()} className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Save className="w-4 h-4 mr-1" /> Save</>)}
            </Button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") })}
              placeholder="About our team"
              className="w-full mt-1 px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-muted-foreground">URL slug</label>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-muted-foreground">/</span>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="about-our-team"
                className="flex-grow px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Template</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {(Object.keys(TEMPLATE_LABELS) as PageTemplate[]).map((t) => (
              <button
                key={t}
                onClick={() => changeTemplate(t)}
                className={cn(
                  "text-left border rounded-lg p-3 transition-colors",
                  form.template === t ? "border-[#3a9ca5] bg-[#3a9ca5]/5" : "border-border hover:border-[#3a9ca5]/50"
                )}
              >
                <div className="text-sm font-semibold mb-0.5">{TEMPLATE_LABELS[t].label}</div>
                <div className="text-xs text-muted-foreground">{TEMPLATE_LABELS[t].description}</div>
              </button>
            ))}
          </div>
        </div>

        <PageFieldsEditor template={form.template} data={form.data} onChange={(d) => setForm({ ...form, data: d })} />

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="rounded" />
          <span>Published (visible to visitors)</span>
        </label>

        {previewOpen && (
          <div className="border-2 border-dashed border-[#3a9ca5]/30 rounded-lg p-4 bg-background">
            <div className="text-xs font-semibold uppercase text-muted-foreground mb-3">Live preview</div>
            <CustomPageRenderer template={form.template} data={{ heading: form.title, ...form.data }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Pages</h2>
          <p className="text-sm text-muted-foreground">Create custom pages from templates. Each page gets its own URL on the site.</p>
        </div>
        <Button onClick={startNew} className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
          <Plus className="w-4 h-4 mr-1" /> New Page
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" /></div>}

      {!isLoading && pages.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
          <LayoutTemplate className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No custom pages yet. Click <strong>New Page</strong> to create one.</p>
        </div>
      )}

      <div className="space-y-2">
        {pages.map((p) => (
          <div key={p.id} className="border border-border rounded-lg p-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-grow">
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="font-medium text-sm truncate">{p.title}</h3>
                {!p.published && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Draft</span>}
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3a9ca5]/10 text-[#3a9ca5] font-medium">{TEMPLATE_LABELS[p.template]?.label || p.template}</span>
              </div>
              <code className="text-xs text-muted-foreground">/{p.slug}</code>
            </div>
            <div className="flex gap-1 shrink-0">
              <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-secondary text-muted-foreground" title="View"><Globe className="w-4 h-4" /></a>
              <button onClick={() => startEdit(p)} className="p-1.5 rounded hover:bg-[#3a9ca5]/10 text-muted-foreground hover:text-[#3a9ca5]" title="Edit"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm(`Delete the "${p.title}" page? This cannot be undone.`)) deleteMutation.mutate(p.id); }} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageFieldsEditor({ template, data, onChange }: { template: PageTemplate; data: PageData; onChange: (d: PageData) => void }) {
  function set<K extends keyof PageData>(key: K, value: PageData[K]) {
    onChange({ ...data, [key]: value });
  }
  const inputCls = "w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30";
  const labelCls = "text-xs font-semibold uppercase text-muted-foreground mb-1 block";

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-secondary/30">
      <div className="text-xs font-semibold uppercase text-muted-foreground">Page content</div>

      <div>
        <label className={labelCls}>Eyebrow (small label above the title)</label>
        <input value={data.eyebrow || ""} onChange={(e) => set("eyebrow", e.target.value)} placeholder="OUR STORY" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Intro paragraph</label>
        <textarea value={data.intro || ""} onChange={(e) => set("intro", e.target.value)} rows={2} placeholder="A short summary that appears below the title." className={inputCls} />
      </div>

      {(template === "standard" || template === "about" || template === "contact") && (
        <div>
          <label className={labelCls}>Body text</label>
          <textarea value={data.body || ""} onChange={(e) => set("body", e.target.value)} rows={8} placeholder="Write your page content here. Line breaks are preserved." className={inputCls} />
        </div>
      )}

      {template === "richhtml" && (
        <div>
          <label className={labelCls}>HTML body</label>
          <HtmlBodyEditor
            value={data.body || ""}
            onChange={(v) => set("body", v)}
            placeholder="<p>Paste or edit HTML here. Tags like <p>, <h2>, <img>, <a>, <strong> are supported.</p>"
          />
        </div>
      )}

      {template === "about" && (
        <div>
          <label className={labelCls}>Image URL (optional)</label>
          <input value={data.imageUrl || ""} onChange={(e) => set("imageUrl", e.target.value)} placeholder="https://..." className={inputCls} />
        </div>
      )}

      {(template === "features" || template === "about") && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>CTA button label</label>
            <input value={data.ctaLabel || ""} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="Get in touch" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>CTA button link</label>
            <input value={data.ctaHref || ""} onChange={(e) => set("ctaHref", e.target.value)} placeholder="/contact" className={inputCls} />
          </div>
        </div>
      )}

      {template === "contact" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className={labelCls}>Email</label>
            <input value={data.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="info@example.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input value={data.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="Phone number" className={inputCls} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Address</label>
            <textarea value={data.address || ""} onChange={(e) => set("address", e.target.value)} rows={2} className={inputCls} />
          </div>
        </div>
      )}

      {template === "cards" && (
        <div>
          <label className={labelCls}>Cards</label>
          <div className="space-y-2">
            {(data.cards || []).map((card, i) => (
              <div key={i} className="border border-border rounded p-3 bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Card {i + 1}</span>
                  <button onClick={() => set("cards", (data.cards || []).filter((_, j) => j !== i))} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <input value={card.title} onChange={(e) => set("cards", (data.cards || []).map((c, j) => j === i ? { ...c, title: e.target.value } : c))} placeholder="Card title" className={inputCls} />
                <textarea value={card.description} onChange={(e) => set("cards", (data.cards || []).map((c, j) => j === i ? { ...c, description: e.target.value } : c))} rows={2} placeholder="Card description" className={inputCls} />
                <input value={card.href || ""} onChange={(e) => set("cards", (data.cards || []).map((c, j) => j === i ? { ...c, href: e.target.value } : c))} placeholder="Optional link, e.g. /shop" className={inputCls} />
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => set("cards", [...(data.cards || []), { title: "", description: "", href: "" }])} className="mt-2">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add card
          </Button>
        </div>
      )}

      {template === "features" && (
        <div>
          <label className={labelCls}>Features</label>
          <div className="space-y-2">
            {(data.features || []).map((f, i) => (
              <div key={i} className="border border-border rounded p-3 bg-background space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Feature {i + 1}</span>
                  <button onClick={() => set("features", (data.features || []).filter((_, j) => j !== i))} className="text-red-600 hover:bg-red-50 p-1 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <input value={f.title} onChange={(e) => set("features", (data.features || []).map((x, j) => j === i ? { ...x, title: e.target.value } : x))} placeholder="Feature title" className={inputCls} />
                <textarea value={f.description} onChange={(e) => set("features", (data.features || []).map((x, j) => j === i ? { ...x, description: e.target.value } : x))} rows={2} placeholder="Feature description" className={inputCls} />
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => set("features", [...(data.features || []), { title: "", description: "" }])} className="mt-2">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add feature
          </Button>
        </div>
      )}
    </div>
  );
}

/* ========== APPS TAB ========== */
interface AdminApp {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  logoUrl: string | null;
  infoHref: string | null;
  appUrl: string | null;
  accentFrom: string;
  accentTo: string;
  badge: string | null;
  sortOrder: number;
  published: boolean;
}

type AppForm = Omit<AdminApp, "id">;

const EMPTY_APP: AppForm = {
  slug: "", title: "", tagline: "", description: "",
  logoUrl: "", infoHref: "", appUrl: "",
  accentFrom: "#3a9ca5", accentTo: "#4cb5bd",
  badge: "", sortOrder: 0, published: true,
};

function AppsTab() {
  const queryClient = useQueryClient();
  const { data: apps = [], isLoading } = useQuery<AdminApp[]>({
    queryKey: ["admin-apps"],
    queryFn: async () => {
      const res = await fetch("/api/apps/all", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load apps");
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
  });

  const [editing, setEditing] = useState<AdminApp | "new" | null>(null);
  const [form, setForm] = useState<AppForm>(EMPTY_APP);
  const [error, setError] = useState("");

  function startNew() {
    const nextSort = apps.length ? Math.max(...apps.map((a) => a.sortOrder)) + 10 : 10;
    setForm({ ...EMPTY_APP, sortOrder: nextSort });
    setError("");
    setEditing("new");
  }
  function startEdit(a: AdminApp) {
    setForm({
      slug: a.slug, title: a.title, tagline: a.tagline, description: a.description,
      logoUrl: a.logoUrl || "", infoHref: a.infoHref || "", appUrl: a.appUrl || "",
      accentFrom: a.accentFrom, accentTo: a.accentTo,
      badge: a.badge || "", sortOrder: a.sortOrder, published: a.published,
    });
    setError("");
    setEditing(a);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const isNew = editing === "new";
      const url = isNew ? "/api/apps" : `/api/apps/${(editing as AdminApp).id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      return json;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-apps"] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      setEditing(null);
    },
    onError: (e: any) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/apps/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-apps"] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
    onError: (e: any) => setError(e.message),
  });

  const togglePublishedMutation = useMutation({
    mutationFn: async ({ id, published }: { id: number; published: boolean }) => {
      const res = await fetch(`/api/apps/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ published }),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onMutate: async ({ id, published }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-apps"] });
      const previous = queryClient.getQueryData<AdminApp[]>(["admin-apps"]);
      if (previous) {
        queryClient.setQueryData<AdminApp[]>(
          ["admin-apps"],
          previous.map((a) => (a.id === id ? { ...a, published } : a)),
        );
      }
      return { previous };
    },
    onError: (e: any, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(["admin-apps"], ctx.previous);
      setError(e.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-apps"] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ idA, idB }: { idA: number; idB: number }) => {
      const res = await fetch("/api/apps/swap-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ idA, idB }),
      });
      if (!res.ok) throw new Error("Reorder failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-apps"] });
      queryClient.invalidateQueries({ queryKey: ["apps"] });
    },
    onError: (e: any) => setError(e.message),
  });

  const { toast } = useToast();

  function move(id: number, dir: -1 | 1) {
    const sorted = [...apps].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((a) => a.id === id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    const idA = id;
    const idB = swap.id;
    reorderMutation.mutate(
      { idA, idB },
      {
        onSuccess: () => {
          // Swap is its own inverse, so undo just re-runs the same swap.
          // TOAST_LIMIT=1 ensures only the most recent reorder's undo is
          // offered, matching the WooCommerce reorder undo affordance.
          const t = toast({
            title: "Order updated",
            description: "Reordered app. Drop in the wrong spot?",
            duration: 6000,
            action: (
              <ToastAction
                altText="Undo reorder"
                onClick={() => {
                  t.dismiss();
                  reorderMutation.mutate({ idA, idB });
                }}
              >
                Undo
              </ToastAction>
            ),
          });
        },
      },
    );
  }

  const inputCls = "w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30";
  const labelCls = "text-xs font-semibold uppercase text-muted-foreground mb-1 block";

  if (editing !== null) {
    const initial = (form.title.trim()[0] || "·").toUpperCase();
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">{editing === "new" ? "New App" : `Edit: ${(editing as AdminApp).title}`}</h2>
            <p className="text-sm text-muted-foreground">Configure the card shown on the homepage and where its two buttons go.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" disabled={saveMutation.isPending || !form.title.trim()} onClick={() => saveMutation.mutate()} className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Save className="w-4 h-4 mr-1" /> Save</>)}
            </Button>
          </div>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Title</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") })} placeholder="Assessify" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="assessify" className={cn(inputCls, "font-mono")} />
              </div>
            </div>
            <div>
              <label className={labelCls}>Tagline (small label)</label>
              <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="AI-Powered Assessment" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="What this app does in one paragraph." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Logo URL</label>
              <input value={form.logoUrl || ""} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} placeholder="https://example.com/logo.svg" className={inputCls} />
              <p className="text-[11px] text-muted-foreground mt-0.5">Leave blank to use a coloured initial badge.</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>"Learn more" link</label>
                <input value={form.infoHref || ""} onChange={(e) => setForm({ ...form, infoHref: e.target.value })} placeholder="/assessify or https://..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>"Open app" link</label>
                <input value={form.appUrl || ""} onChange={(e) => setForm({ ...form, appUrl: e.target.value })} placeholder="https://app.example.com" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={labelCls}>Accent (from)</label>
                <div className="flex gap-1">
                  <input type="color" value={form.accentFrom} onChange={(e) => setForm({ ...form, accentFrom: e.target.value })} className="h-9 w-12 rounded border border-border" />
                  <input value={form.accentFrom} onChange={(e) => setForm({ ...form, accentFrom: e.target.value })} className={cn(inputCls, "font-mono text-xs")} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Accent (to)</label>
                <div className="flex gap-1">
                  <input type="color" value={form.accentTo} onChange={(e) => setForm({ ...form, accentTo: e.target.value })} className="h-9 w-12 rounded border border-border" />
                  <input value={form.accentTo} onChange={(e) => setForm({ ...form, accentTo: e.target.value })} className={cn(inputCls, "font-mono text-xs")} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Badge (optional)</label>
                <input value={form.badge || ""} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="New / Beta / Free" className={inputCls} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              <span>Published (shown on homepage)</span>
            </label>
          </div>

          <div>
            <label className={labelCls}>Live preview</label>
            <div className={cn("rounded-2xl border bg-card overflow-hidden transition-opacity", form.published ? "border-border" : "border-dashed border-amber-300 opacity-60")}>
              {!form.published && (
                <div className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 px-3 py-1 flex items-center gap-1 border-b border-amber-200">
                  <EyeOff className="w-3 h-3" /> Hidden — won't appear on homepage
                </div>
              )}
              <div className="h-32 flex items-center justify-center relative" style={{ background: `linear-gradient(135deg, ${form.accentFrom}12, ${form.accentTo}1f)` }}>
                {form.badge && <span className="absolute top-3 right-3 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-white/90 text-[#3a9ca5] shadow-sm">{form.badge}</span>}
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="" className="w-20 h-20 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                ) : (
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-md" style={{ background: `linear-gradient(135deg, ${form.accentFrom}, ${form.accentTo})` }}>{initial}</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-sm">{form.title || "App title"}</h3>
                {form.tagline && <p className="text-[11px] text-[#3a9ca5]/80 uppercase tracking-wide mb-1">{form.tagline}</p>}
                <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{form.description || "Short description appears here."}</p>
                <div className="flex gap-2">
                  <button className="flex-1 text-xs px-2 py-1.5 rounded border border-[#3a9ca5]/30 text-[#3a9ca5]">Learn more</button>
                  <button className="flex-1 text-xs px-2 py-1.5 rounded text-white" style={{ background: "#3a9ca5" }}>Open app</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...apps].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Apps</h2>
          <p className="text-sm text-muted-foreground">Manage the cards shown on the homepage. Each app has a "Learn more" page and an "Open app" link.</p>
        </div>
        <Button onClick={startNew} className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
          <Plus className="w-4 h-4 mr-1" /> New App
        </Button>
      </div>

      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" /></div>}

      <div className="space-y-2">
        {sorted.map((a, i) => (
          <div key={a.id} className={cn("border rounded-lg p-3 flex items-center gap-3 transition-opacity", a.published ? "border-border" : "border-dashed border-amber-300 bg-amber-50/30")}>
            <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden", !a.published && "opacity-50 grayscale")} style={{ background: `linear-gradient(135deg, ${a.accentFrom}20, ${a.accentTo}30)` }}>
              {a.logoUrl ? (
                <img src={a.logoUrl} alt="" className="w-10 h-10 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="w-10 h-10 rounded flex items-center justify-center text-white font-black text-lg" style={{ background: `linear-gradient(135deg, ${a.accentFrom}, ${a.accentTo})` }}>{a.title[0]?.toUpperCase()}</div>
              )}
            </div>
            <div className={cn("min-w-0 flex-grow", !a.published && "opacity-60")}>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                {a.published ? (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium">
                    <Eye className="w-3 h-3" /> Visible
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                    <EyeOff className="w-3 h-3" /> Hidden
                  </span>
                )}
                {a.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3a9ca5]/10 text-[#3a9ca5] font-medium">{a.badge}</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{a.tagline || a.description}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => togglePublishedMutation.mutate({ id: a.id, published: !a.published })}
                disabled={togglePublishedMutation.isPending}
                className={cn(
                  "p-1.5 rounded transition-colors disabled:opacity-50",
                  a.published
                    ? "text-emerald-600 hover:bg-emerald-50"
                    : "text-amber-600 hover:bg-amber-100",
                )}
                title={a.published ? "Visible on homepage — click to hide" : "Hidden from homepage — click to show"}
                aria-label={a.published ? "Hide app from homepage" : "Show app on homepage"}
              >
                {a.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button onClick={() => move(a.id, -1)} disabled={i === 0 || reorderMutation.isPending} className="p-1.5 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30" title="Move up"><ArrowUp className="w-4 h-4" /></button>
              <button onClick={() => move(a.id, 1)} disabled={i === sorted.length - 1 || reorderMutation.isPending} className="p-1.5 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30" title="Move down"><ArrowDown className="w-4 h-4" /></button>
              {a.appUrl && <a href={a.appUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-secondary text-muted-foreground" title="Open app"><ExternalLink className="w-4 h-4" /></a>}
              <button onClick={() => startEdit(a)} className="p-1.5 rounded hover:bg-[#3a9ca5]/10 text-muted-foreground hover:text-[#3a9ca5]" title="Edit"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => { if (confirm(`Delete "${a.title}"?`)) deleteMutation.mutate(a.id); }} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ========== NAVIGATION & FOOTER TAB ========== */
interface NavLinkRow {
  id: number;
  label: string;
  href: string;
  group: string;
  sortOrder: number;
  visible?: boolean;
}

const NAV_GROUPS: { key: string; label: string; description: string }[] = [
  { key: "main", label: "Top navigation menu", description: "The header menu at the top of every page." },
  { key: "footer", label: "Footer links", description: "The grid of links in the site footer." },
];

const FALLBACK_NAV_DEFAULTS: Record<string, { label: string; href: string }[]> = {
  main: [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Portal", href: "https://app.rhythmstix.co.uk/" },
    { label: "Community", href: "/community" },
    { label: "Shop", href: "/shop" },
    { label: "Blog", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ],
  footer: [
    { label: "Blog", href: "/blog" },
    { label: "Shop", href: "/shop" },
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Privacy Notice", href: "/policy" },
    { label: "Cookies", href: "/cookies" },
    { label: "Copyright", href: "/copyright-and-licenses" },
  ],
};

function NavigationTab() {
  const queryClient = useQueryClient();
  const { data: links = [], isLoading } = useQuery<NavLinkRow[]>({
    queryKey: ["admin-nav-links"],
    queryFn: async () => {
      const res = await fetch("/api/nav-links", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load navigation");
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
  });

  const [error, setError] = useState("");

  const createMutation = useMutation({
    mutationFn: async (body: { label: string; href: string; group: string; sortOrder: number }) => {
      const res = await fetch("/api/nav-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Create failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-nav-links"] });
      queryClient.invalidateQueries({ queryKey: ["nav-links"] });
    },
    onError: (e: any) => setError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...body }: { id: number; label?: string; href?: string; group?: string; sortOrder?: number; visible?: boolean }) => {
      const res = await fetch(`/api/nav-links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Update failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-nav-links"] });
      queryClient.invalidateQueries({ queryKey: ["nav-links"] });
    },
    onError: (e: any) => setError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/nav-links/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-nav-links"] });
      queryClient.invalidateQueries({ queryKey: ["nav-links"] });
    },
    onError: (e: any) => setError(e.message),
  });

  function seedDefaults(group: string) {
    const defaults = FALLBACK_NAV_DEFAULTS[group] || [];
    defaults.forEach((d, i) => {
      createMutation.mutate({ label: d.label, href: d.href, group, sortOrder: (i + 1) * 10 });
    });
  }

  const inputCls = "w-full px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2"><MenuIcon className="w-5 h-5" /> Navigation & Footer</h2>
        <p className="text-sm text-muted-foreground">Manage the links shown in the top menu and the footer. Use full URLs (https://...) for external links, or paths starting with "/" for internal pages.</p>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
      {isLoading && <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" /></div>}

      {NAV_GROUPS.map((group) => {
        const groupLinks = links.filter((l) => l.group === group.key).sort((a, b) => a.sortOrder - b.sortOrder);
        return (
          <div key={group.key} className="border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">{group.label}</h3>
                <p className="text-xs text-muted-foreground">{group.description}</p>
              </div>
              {groupLinks.length === 0 && (
                <button
                  onClick={() => seedDefaults(group.key)}
                  className="text-xs px-2 py-1 rounded border border-[#3a9ca5]/30 text-[#3a9ca5] hover:bg-[#3a9ca5]/5"
                  disabled={createMutation.isPending}
                >
                  Add starter links
                </button>
              )}
            </div>

            <div className="space-y-2">
              {groupLinks.map((link, i) => (
                <NavLinkRowEditor
                  key={link.id}
                  link={link}
                  isFirst={i === 0}
                  isLast={i === groupLinks.length - 1}
                  onSave={(patch) => updateMutation.mutate({ id: link.id, label: patch.label, href: patch.href, sortOrder: patch.sortOrder })}
                  onDelete={() => { if (confirm(`Remove "${link.label}"?`)) deleteMutation.mutate(link.id); }}
                  onToggleVisible={() => updateMutation.mutate({ id: link.id, visible: link.visible === false })}
                  onMove={(dir) => {
                    const swap = groupLinks[i + dir];
                    if (!swap) return;
                    updateMutation.mutate({ id: link.id, sortOrder: swap.sortOrder });
                    updateMutation.mutate({ id: swap.id, sortOrder: link.sortOrder });
                  }}
                />
              ))}
            </div>

            <NewNavLinkRow
              group={group.key}
              defaultSort={(groupLinks.at(-1)?.sortOrder ?? 0) + 10}
              onAdd={(label, href, sortOrder) => createMutation.mutate({ label, href, group: group.key, sortOrder })}
              isPending={createMutation.isPending}
              inputCls={inputCls}
            />
          </div>
        );
      })}

      <div className="border border-dashed border-border rounded-lg p-3 text-xs text-muted-foreground">
        Tip: footer contact info, address, phone, email and social URLs are editable directly on any public page — log in via the shield icon at the bottom right, then hover the text to reveal the pencil button.
      </div>
    </div>
  );
}

function NavLinkRowEditor({
  link, isFirst, isLast, onSave, onDelete, onMove, onToggleVisible,
}: {
  link: NavLinkRow;
  isFirst: boolean;
  isLast: boolean;
  onSave: (patch: { label: string; href: string; sortOrder: number }) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  onToggleVisible: () => void;
}) {
  const [label, setLabel] = useState(link.label);
  const [href, setHref] = useState(link.href);
  const dirty = label !== link.label || href !== link.href;
  const hidden = link.visible === false;
  const inputCls = "px-2 py-1.5 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30";
  return (
    <div className={cn("grid grid-cols-[1fr_2fr_auto] gap-2 items-center", hidden && "opacity-50")}>
      <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label" className={inputCls} />
      <input value={href} onChange={(e) => setHref(e.target.value)} placeholder="/path or https://..." className={cn(inputCls, "font-mono text-xs")} />
      <div className="flex gap-0.5">
        <button
          onClick={onToggleVisible}
          className={cn(
            "p-1.5 rounded hover:bg-secondary",
            hidden ? "text-muted-foreground/60" : "text-[#3a9ca5]"
          )}
          title={hidden ? "Hidden — click to show on the live site" : "Visible — click to hide from the live site"}
        >
          {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button onClick={() => onMove(-1)} disabled={isFirst} className="p-1.5 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30" title="Move up"><ArrowUp className="w-4 h-4" /></button>
        <button onClick={() => onMove(1)} disabled={isLast} className="p-1.5 rounded hover:bg-secondary text-muted-foreground disabled:opacity-30" title="Move down"><ArrowDown className="w-4 h-4" /></button>
        <button
          onClick={() => dirty && onSave({ label: label.trim(), href: href.trim(), sortOrder: link.sortOrder })}
          disabled={!dirty || !label.trim() || !href.trim()}
          className="p-1.5 rounded hover:bg-[#3a9ca5]/10 text-muted-foreground hover:text-[#3a9ca5] disabled:opacity-30"
          title="Save changes"
        >
          <Save className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600" title="Remove"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function NewNavLinkRow({
  group, defaultSort, onAdd, isPending, inputCls,
}: {
  group: string;
  defaultSort: number;
  onAdd: (label: string, href: string, sortOrder: number) => void;
  isPending: boolean;
  inputCls: string;
}) {
  const [label, setLabel] = useState("");
  const [href, setHref] = useState("");
  const valid = label.trim().length > 0 && href.trim().length > 0;
  function add() {
    if (!valid) return;
    onAdd(label.trim(), href.trim(), defaultSort);
    setLabel("");
    setHref("");
  }
  return (
    <div className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center pt-2 border-t border-dashed border-border">
      <input value={label} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder={`Add to ${group} (label)`} className={inputCls} />
      <input value={href} onChange={(e) => setHref(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") add(); }} placeholder="/path or https://..." className={cn(inputCls, "font-mono text-xs")} />
      <Button size="sm" onClick={add} disabled={!valid || isPending} className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white"><Plus className="w-3.5 h-3.5 mr-1" /> Add</Button>
    </div>
  );
}

// =====================================================================
// THEME & DESIGN TAB
// =====================================================================
const THEME_DEFAULTS = {
  primaryColor: "#3a9ca5",
  accentColor: "#4cb5bd",
  backgroundTone: "#ffffff",
  radius: "1",
  headingWeight: "700",
};

function ThemeTab() {
  const { data: content, isLoading } = useContent();
  const saveMutation = useSaveContent();
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<string | null>(null);

  const current = (k: keyof typeof THEME_DEFAULTS) =>
    draft[`theme.${k}`] ?? content?.[`theme.${k}`] ?? THEME_DEFAULTS[k];

  function setField(k: keyof typeof THEME_DEFAULTS, value: string) {
    setDraft((d) => ({ ...d, [`theme.${k}`]: value }));
  }

  async function saveAll() {
    const entries = Object.entries(draft);
    if (!entries.length) return;
    await Promise.all(entries.map(([key, value]) => saveMutation.mutateAsync({ key, value })));
    setDraft({});
    setSaved("Theme saved.");
    setTimeout(() => setSaved(null), 2000);
  }

  async function resetAll() {
    if (!confirm("Reset all theme settings to defaults?")) return;
    await Promise.all(
      Object.keys(THEME_DEFAULTS).map((k) =>
        saveMutation.mutateAsync({ key: `theme.${k}`, value: "" }),
      ),
    );
    setDraft({});
    setSaved("Theme reset to defaults.");
    setTimeout(() => setSaved(null), 2000);
  }

  if (isLoading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" /></div>;
  }

  const dirty = Object.keys(draft).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#3a9ca5]" />
            Theme & Design
          </h2>
          <p className="text-sm text-muted-foreground">
            Tune your site's brand colours, corner radius and heading weight. Changes apply live to every page.
          </p>
        </div>
        <Button
          onClick={resetAll}
          variant="outline"
          size="sm"
          disabled={saveMutation.isPending}
          className="gap-1.5 text-muted-foreground hover:text-red-600"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <ColorField
          label="Primary colour"
          help="Buttons, focus rings, links and brand accents."
          value={current("primaryColor")}
          onChange={(v) => setField("primaryColor", v)}
        />
        <ColorField
          label="Accent colour"
          help="Secondary highlights and gradient ends."
          value={current("accentColor")}
          onChange={(v) => setField("accentColor", v)}
        />
        <ColorField
          label="Background tone"
          help="Page background. Pure white by default."
          value={current("backgroundTone")}
          onChange={(v) => setField("backgroundTone", v)}
        />
        <div className="space-y-2">
          <label className="text-sm font-semibold">Corner radius</label>
          <p className="text-xs text-muted-foreground">{current("radius")}rem — controls how rounded buttons and cards feel.</p>
          <input
            type="range"
            min={0}
            max={2}
            step={0.125}
            value={parseFloat(current("radius"))}
            onChange={(e) => setField("radius", e.target.value)}
            className="w-full accent-[#3a9ca5]"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground"><span>Sharp</span><span>Rounded</span><span>Pill</span></div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-semibold">Heading weight</label>
          <p className="text-xs text-muted-foreground">How bold your h1/h2/h3 elements appear.</p>
          <div className="flex gap-2">
            {["500", "600", "700", "800", "900"].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setField("headingWeight", w)}
                className={cn(
                  "flex-1 px-3 py-2 rounded-lg border text-sm transition-colors",
                  current("headingWeight") === w
                    ? "border-[#3a9ca5] bg-[#3a9ca5]/5 text-[#3a9ca5]"
                    : "border-border text-muted-foreground hover:border-[#3a9ca5]/40",
                )}
                style={{ fontWeight: Number(w) }}
              >
                {w === "500" ? "Med" : w === "600" ? "Semi" : w === "700" ? "Bold" : w === "800" ? "X-Bold" : "Black"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-[#3a9ca5]/30 bg-[#3a9ca5]/[0.02] p-5">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#3a9ca5]/80 mb-3">Live preview</div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold shadow-sm"
            style={{ backgroundColor: current("primaryColor"), borderRadius: `${current("radius")}rem` }}
          >
            Primary button
          </button>
          <button
            className="px-4 py-2 rounded-xl text-sm font-semibold border-2"
            style={{
              borderColor: current("accentColor"),
              color: current("accentColor"),
              borderRadius: `${current("radius")}rem`,
            }}
          >
            Accent outline
          </button>
          <div
            className="px-4 py-2 text-sm border bg-card"
            style={{ borderRadius: `${current("radius")}rem` }}
          >
            Card with current radius
          </div>
          <h3 className="text-2xl ml-2" style={{ fontWeight: Number(current("headingWeight")) }}>
            Heading sample
          </h3>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button
          onClick={saveAll}
          disabled={!dirty || saveMutation.isPending}
          className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white gap-2"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save theme
        </Button>
        {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
        {saved && <span className="text-xs text-emerald-600">{saved}</span>}
      </div>
    </div>
  );
}

function ColorField({
  label, help, value, onChange,
}: {
  label: string;
  help: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold">{label}</label>
      <p className="text-xs text-muted-foreground">{help}</p>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-12 h-10 rounded-lg border border-border bg-transparent cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
          placeholder="#3a9ca5"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vouchers tab — CRUD for shop voucher codes.
// ---------------------------------------------------------------------------

interface VoucherRow {
  id: number;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: number; // pence for fixed, 1-100 for percentage
  active: boolean;
  expiresAt: string | null;
  minimumOrderValue: number; // pence
  createdAt: string;
}

interface VoucherFormState {
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  active: boolean;
  expiresAt: string;
  minimumOrderValue: string;
}

const EMPTY_VOUCHER_FORM: VoucherFormState = {
  code: "",
  discountType: "percentage",
  discountValue: "10",
  active: true,
  expiresAt: "",
  minimumOrderValue: "0",
};

function VouchersTab() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery<VoucherRow[]>({
    queryKey: ["admin-vouchers"],
    queryFn: async () => {
      const res = await fetch("/api/admin/vouchers", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load vouchers");
      return res.json();
    },
  });

  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<VoucherFormState>(EMPTY_VOUCHER_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  function startCreate() {
    setForm(EMPTY_VOUCHER_FORM);
    setEditingId("new");
    setFormError(null);
  }

  function startEdit(v: VoucherRow) {
    setForm({
      code: v.code,
      discountType: v.discountType,
      discountValue:
        v.discountType === "percentage"
          ? String(v.discountValue)
          : (v.discountValue / 100).toFixed(2),
      active: v.active,
      expiresAt: v.expiresAt ? v.expiresAt.slice(0, 10) : "",
      minimumOrderValue: (v.minimumOrderValue / 100).toFixed(2),
    });
    setEditingId(v.id);
    setFormError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(EMPTY_VOUCHER_FORM);
    setFormError(null);
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        active: form.active,
        expiresAt: form.expiresAt || null,
        minimumOrderValue: Number(form.minimumOrderValue || "0"),
      };
      const url =
        editingId === "new" ? "/api/admin/vouchers" : `/api/admin/vouchers/${editingId}`;
      const method = editingId === "new" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Failed to save voucher");
      return body as VoucherRow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      cancelEdit();
      toast({ title: "Voucher saved" });
    },
    onError: (err: any) => setFormError(err?.message || "Failed to save voucher"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/vouchers/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || "Failed to delete voucher");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-vouchers"] });
      toast({ title: "Voucher deleted" });
    },
    onError: (err: any) =>
      toast({ title: "Delete failed", description: err?.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Ticket className="w-5 h-5 text-[#3a9ca5]" />
            Voucher codes
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create percentage or fixed-amount discount codes customers can apply at checkout.
          </p>
        </div>
        {editingId === null && (
          <Button onClick={startCreate} className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white">
            <Plus className="w-4 h-4 mr-2" />
            New voucher
          </Button>
        )}
      </div>

      {editingId !== null && (
        <div className="bg-secondary/30 border border-border rounded-xl p-5 space-y-4">
          <h3 className="font-semibold text-foreground">
            {editingId === "new" ? "Create voucher" : "Edit voucher"}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Code
              </label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="WELCOME10"
                maxLength={64}
                className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Type
              </label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm({ ...form, discountType: e.target.value as "percentage" | "fixed" })
                }
                className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
              >
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed amount off (£)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {form.discountType === "percentage" ? "Percent (1-100)" : "Amount (£)"}
              </label>
              <input
                type="number"
                step={form.discountType === "percentage" ? "1" : "0.01"}
                min={form.discountType === "percentage" ? "1" : "0.01"}
                max={form.discountType === "percentage" ? "100" : undefined}
                value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Minimum order (£, optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.minimumOrderValue}
                onChange={(e) => setForm({ ...form, minimumOrderValue: e.target.value })}
                className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Expires on (optional)
              </label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="mt-1.5 w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
              />
            </div>
            <div className="flex items-end">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 rounded border-border"
                />
                <span className="text-sm">Active</span>
              </label>
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex gap-2">
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.code.trim()}
              className="bg-[#3a9ca5] hover:bg-[#4cb5bd] text-white"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save voucher
            </Button>
            <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" />
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600">Failed to load vouchers.</p>
      )}
      {data && data.length === 0 && editingId === null && (
        <div className="bg-secondary/30 rounded-xl p-8 text-center">
          <Tag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No vouchers yet. Create your first one.</p>
        </div>
      )}
      {data && data.length > 0 && (
        <div className="space-y-2">
          {data.map((v) => {
            const expired = v.expiresAt && new Date(v.expiresAt).getTime() < Date.now();
            return (
              <div
                key={v.id}
                className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-lg bg-[#3a9ca5]/10 flex items-center justify-center shrink-0">
                  <Tag className="w-5 h-5 text-[#3a9ca5]" />
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold">{v.code}</span>
                    {!v.active && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                        Inactive
                      </span>
                    )}
                    {expired && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {v.discountType === "percentage"
                      ? `${v.discountValue}% off`
                      : `£${(v.discountValue / 100).toFixed(2)} off`}
                    {v.minimumOrderValue > 0 &&
                      ` • min £${(v.minimumOrderValue / 100).toFixed(2)}`}
                    {v.expiresAt &&
                      ` • expires ${new Date(v.expiresAt).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(v)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Delete voucher ${v.code}?`)) {
                        deleteMutation.mutate(v.id);
                      }
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Orders tab — read-only view of recent local orders.
// ---------------------------------------------------------------------------

interface AdminOrderRow {
  id: number;
  publicId: string;
  status: string;
  email: string;
  firstName: string;
  lastName: string;
  subtotal: string;
  discount: string;
  total: string;
  currency: string;
  voucherCode: string | null;
  createdAt: string;
  paidAt: string | null;
}

function OrdersTab() {
  const { data, isLoading, error } = useQuery<AdminOrderRow[]>({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await fetch("/api/admin/orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load orders");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#3a9ca5]" />
          Recent orders
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          The 200 most recent shop orders. Refunds and detailed payment history are managed in the
          Stripe Dashboard.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-[#3a9ca5]" />
        </div>
      )}
      {error && <p className="text-sm text-red-600">Failed to load orders.</p>}
      {data && data.length === 0 && (
        <div className="bg-secondary/30 rounded-xl p-8 text-center text-sm text-muted-foreground">
          No orders yet.
        </div>
      )}
      {data && data.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <th className="py-2 pr-4">Order</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Voucher</th>
                <th className="py-2 pr-4 text-right">Total</th>
                <th className="py-2 pr-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o) => (
                <tr key={o.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-4 font-mono">#{o.publicId}</td>
                  <td className="py-2.5 pr-4">
                    <div>{o.firstName} {o.lastName}</div>
                    <div className="text-xs text-muted-foreground">{o.email}</div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize",
                        o.status === "paid"
                          ? "bg-green-100 text-green-700"
                          : o.status === "free"
                          ? "bg-blue-100 text-blue-700"
                          : o.status === "failed" || o.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700",
                      )}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                    {o.voucherCode || "—"}
                  </td>
                  <td className="py-2.5 pr-4 text-right tabular-nums font-semibold">
                    £{parseFloat(o.total).toFixed(2)}
                  </td>
                  <td className="py-2.5 pr-2 text-right text-xs text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
