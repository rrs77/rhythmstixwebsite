import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAdminMode } from "@/hooks/use-admin";
import { useContent, useSaveContent } from "@/hooks/use-content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText, MessageSquareQuote, Linkedin, Twitter, Youtube, Settings as SettingsIcon,
  Loader2, Lock, Plus, Trash2, Pencil, Save, X, Search, ExternalLink, Shield, Eye, EyeOff,
  LayoutTemplate, Globe, AppWindow, ArrowUp, ArrowDown,
} from "lucide-react";
import { TEMPLATE_LABELS, type PageTemplate, type PageData, CustomPageRenderer } from "@/components/CustomPageRenderer";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TabKey = "copy" | "apps" | "pages" | "testimonials" | "linkedin" | "twitter" | "youtube" | "visibility" | "settings";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "copy", label: "Site Copy", icon: FileText },
  { key: "apps", label: "Apps", icon: AppWindow },
  { key: "pages", label: "Pages", icon: LayoutTemplate },
  { key: "testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "twitter", label: "Twitter / X", icon: Twitter },
  { key: "youtube", label: "YouTube", icon: Youtube },
  { key: "visibility", label: "Hidden Posts", icon: EyeOff },
  { key: "settings", label: "Settings", icon: SettingsIcon },
];

export default function Admin() {
  const { data: isAdmin, isLoading: adminLoading } = useAdminMode();
  const [tab, setTab] = useState<TabKey>("copy");

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
              {tab === "pages" && <PagesTab />}
              {tab === "testimonials" && <TestimonialsTab />}
              {tab === "linkedin" && <LinkedInTab />}
              {tab === "twitter" && <TwitterTab />}
              {tab === "youtube" && <YouTubeTab />}
              {tab === "visibility" && <VisibilityTab />}
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
  sortOrder: number;
}

function TestimonialsTab() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery<Testimonial[]>({
    queryKey: ["admin-testimonials"],
    queryFn: async () => {
      const res = await fetch("/api/testimonials");
      return res.json();
    },
  });
  const [editing, setEditing] = useState<number | "new" | null>(null);
  const [form, setForm] = useState({ quote: "", author: "", organization: "", sortOrder: 0 });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = editing === "new" ? "/api/testimonials" : `/api/testimonials/${editing}`;
      const method = editing === "new" ? "POST" : "PUT";
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
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
      setEditing(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-testimonials"] });
      queryClient.invalidateQueries({ queryKey: ["testimonials"] });
    },
  });

  function startNew() {
    setForm({ quote: "", author: "", organization: "", sortOrder: items.length });
    setEditing("new");
  }

  function startEdit(t: Testimonial) {
    setForm({ quote: t.quote, author: t.author, organization: t.organization, sortOrder: t.sortOrder });
    setEditing(t.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Testimonials</h2>
          <p className="text-sm text-muted-foreground">Add, edit and reorder customer testimonials shown on the homepage.</p>
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
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
              placeholder="Sort order"
              className="px-3 py-2 rounded border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
            />
          </div>
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
            No testimonials yet. The homepage shows the built-in defaults until you add some here.
          </div>
        )}
        {items.map((t) => (
          <div key={t.id} className="border border-border rounded-lg p-3">
            <p className="text-sm italic mb-2">"{t.quote}"</p>
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                <strong className="text-foreground">{t.author}</strong> — {t.organization}
              </div>
              <div className="flex gap-1">
                <button onClick={() => startEdit(t)} className="p-1 rounded hover:bg-[#3a9ca5]/10 text-muted-foreground hover:text-[#3a9ca5]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Delete this testimonial?")) deleteMutation.mutate(t.id); }} className="p-1 rounded hover:bg-red-50 text-muted-foreground hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
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
        <p className="text-sm text-muted-foreground">YouTube videos appear automatically in your blog feed via the channel's RSS feed.</p>
      </div>

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
};

function PagesTab() {
  const queryClient = useQueryClient();
  const { data: pages = [], isLoading } = useQuery<CustomPage[]>({
    queryKey: ["admin-pages"],
    queryFn: async () => {
      const res = await fetch("/api/pages");
      return res.json();
    },
  });

  const [editing, setEditing] = useState<CustomPage | "new" | null>(null);
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
            <input value={data.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="01245 633 231" className={inputCls} />
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

  function move(id: number, dir: -1 | 1) {
    const sorted = [...apps].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((a) => a.id === id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    reorderMutation.mutate({ idA: id, idB: swap.id });
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
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
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
                  <button className="flex-1 text-xs px-2 py-1.5 rounded text-white" style={{ background: `linear-gradient(135deg, ${form.accentFrom}, ${form.accentTo})` }}>Open app</button>
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
          <div key={a.id} className="border border-border rounded-lg p-3 flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0 overflow-hidden" style={{ background: `linear-gradient(135deg, ${a.accentFrom}20, ${a.accentTo}30)` }}>
              {a.logoUrl ? (
                <img src={a.logoUrl} alt="" className="w-10 h-10 object-contain" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
              ) : (
                <div className="w-10 h-10 rounded flex items-center justify-center text-white font-black text-lg" style={{ background: `linear-gradient(135deg, ${a.accentFrom}, ${a.accentTo})` }}>{a.title[0]?.toUpperCase()}</div>
              )}
            </div>
            <div className="min-w-0 flex-grow">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <h3 className="font-semibold text-sm truncate">{a.title}</h3>
                {!a.published && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Hidden</span>}
                {a.badge && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#3a9ca5]/10 text-[#3a9ca5] font-medium">{a.badge}</span>}
              </div>
              <p className="text-xs text-muted-foreground truncate">{a.tagline || a.description}</p>
            </div>
            <div className="flex gap-1 shrink-0">
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
