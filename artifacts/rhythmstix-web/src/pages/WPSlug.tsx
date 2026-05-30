import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { getPage, getPost, decodeHtml, rewriteWPLinks } from "@/lib/wordpress";
import { WPContent } from "@/components/WPContent";
import { CustomPageRenderer, type PageTemplate, type PageData } from "@/components/CustomPageRenderer";
import { useAdminMode } from "@/hooks/use-admin";
import { Loader2, Pencil, Check, X } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

const PRODUCT_NAMES = [
  "Assessify",
  "CCDesigner",
  "Creative Curriculum Designer",
  "PeriFeedback",
  "PeriPlanner",
  "ProgressPath",
  "Rhythmstix App",
  "Rhythmstix",
  "Teaching Portal",
];

function highlightProducts(html: string): string {
  const sorted = [...PRODUCT_NAMES].sort((a, b) => b.length - a.length);
  const pattern = new RegExp(
    `(?<![<\\/\\w])\\b(${sorted.map(n => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b(?![^<]*>)`,
    'g'
  );
  return html.replace(pattern, '<strong class="product-highlight">$1</strong>');
}

export default function WPSlug() {
  const { slug } = useParams<{ slug: string }>();
  const cleanSlug = (slug || "").replace(/\/$/, "");
  const { data: isAdmin } = useAdminMode();

  const { data, isLoading, error } = useQuery({
    queryKey: ["wp-slug", cleanSlug],
    queryFn: async () => {
      const customRes = await fetch(`/api/pages/by-slug/${encodeURIComponent(cleanSlug)}`);
      if (customRes.ok) {
        const custom = await customRes.json();
        return { type: "custom" as const, item: custom };
      }
      const page = await getPage(cleanSlug);
      if (page) return { type: "page" as const, item: page };
      const post = await getPost(cleanSlug);
      if (post) return { type: "post" as const, item: post };
      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const item = data && data.type !== "custom" ? (data.item as any) : undefined;

  const processedContent = useMemo(() => {
    if (!item?.content?.rendered) return "";
    return rewriteWPLinks(highlightProducts(item.content.rendered));
  }, [item]);

  if (data?.type === "custom") {
    const custom = data.item as { id: number; title: string; template: PageTemplate; data: PageData };
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-16">
          <div className="container mx-auto px-4">
            <CustomPageEditable isAdmin={!!isAdmin} page={custom} cleanSlug={cleanSlug} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          {error && (
            <div className="text-center py-20">
              <p className="text-muted-foreground">Unable to load this page. Please try again later.</p>
            </div>
          )}
          {item && (
            <>
              {item.title.rendered && (
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-[rgb(52,154,167)] mb-2">
                    {decodeHtml(item.title.rendered)}
                  </h1>
                  <div className="w-20 h-1 rounded-full bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd]" />
                </div>
              )}
              <div className="rounded-2xl border border-[#3a9ca5]/10 bg-card p-6 md:p-10 shadow-sm">
                <WPContent
                  className="wp-content prose prose-lg max-w-none"
                  html={processedContent}
                />
              </div>
            </>
          )}
          {!isLoading && !error && !item && (
            <div className="text-center py-20">
              <h1 className="text-2xl font-bold mb-2">Page not found</h1>
              <p className="text-muted-foreground">We couldn't find a page or post at this URL.</p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function CustomPageEditable({
  isAdmin,
  page,
  cleanSlug,
}: {
  isAdmin: boolean;
  page: { id: number; title: string; template: PageTemplate; data: PageData };
  cleanSlug: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(page.title);
  const [draftBody, setDraftBody] = useState<string>(typeof page.data?.body === "string" ? page.data.body : "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraftTitle(page.title);
    setDraftBody(typeof page.data?.body === "string" ? page.data.body : "");
  }, [page.id, page.title, page.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/pages/${page.id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: draftTitle,
          data: { ...page.data, body: draftBody },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Failed to save");
      }
      return res.json();
    },
    onSuccess: () => {
      setError(null);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["wp-slug", cleanSlug] });
    },
    onError: (e: Error) => setError(e.message),
  });

  const isRichHtml = page.template === "richhtml";

  return (
    <>
      {isAdmin && (
        <div className="max-w-5xl mx-auto mb-3">
          {!editing ? (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-[#3a9ca5]/30 bg-[#3a9ca5]/5 px-3 py-2 text-xs">
              <span className="text-[#3a9ca5] font-medium">
                Editing as admin · <strong>{page.template}</strong> template
              </span>
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#3a9ca5] hover:bg-[#2d8890] text-white font-medium transition-colors"
              >
                <Pencil className="w-3 h-3" />
                {isRichHtml ? "Edit content" : "Edit title"}
              </button>
            </div>
          ) : (
            <div className="rounded-lg border-2 border-[#3a9ca5] bg-white p-4 space-y-3 shadow-md">
              <div>
                <label className="block text-xs font-semibold text-[#3a9ca5] mb-1">Page title</label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 text-sm"
                />
              </div>
              {isRichHtml && (
                <div>
                  <label className="block text-xs font-semibold text-[#3a9ca5] mb-1">
                    Body (HTML — sanitized server-side on save)
                  </label>
                  <textarea
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    rows={16}
                    className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 font-mono text-xs leading-relaxed"
                  />
                </div>
              )}
              {error && <p className="text-xs text-red-600">{error}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#3a9ca5] hover:bg-[#2d8890] text-white text-xs font-medium transition-colors disabled:opacity-60"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3" />
                  )}
                  Save changes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                    setDraftTitle(page.title);
                    setDraftBody(typeof page.data?.body === "string" ? page.data.body : "");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium transition-colors"
                >
                  <X className="w-3 h-3" />
                  Cancel
                </button>
                <span className="text-[11px] text-muted-foreground ml-auto">
                  For advanced fields, open <strong>Admin → Pages</strong>.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
      <CustomPageRenderer template={page.template} data={{ heading: page.title, ...page.data }} />
    </>
  );
}
