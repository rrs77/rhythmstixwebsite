import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useAdminMode } from "@/hooks/use-admin";
import { useContent, useSaveContent } from "@/hooks/use-content";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText, MessageSquareQuote, Linkedin, Twitter, Youtube, Settings as SettingsIcon,
  Loader2, Lock, Plus, Trash2, Pencil, Save, X, Search, ExternalLink, Shield, Eye, EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TabKey = "copy" | "testimonials" | "linkedin" | "twitter" | "youtube" | "visibility" | "settings";

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: "copy", label: "Site Copy", icon: FileText },
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
