import { motion } from "framer-motion";
import { ArrowRight, ExternalLink, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { EditableText } from "@/components/EditableText";
import { Button } from "@/components/ui/button";

interface AppItem {
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
}

function isExternal(href: string) {
  return /^https?:\/\//i.test(href);
}

function AppCard({ app, index }: { app: AppItem; index: number }) {
  const initial = app.title.trim()[0]?.toUpperCase() || "·";
  const [logoBroken, setLogoBroken] = useState(false);
  const showLogo = app.logoUrl && !logoBroken;
  const infoButton = app.infoHref ? (
    isExternal(app.infoHref) ? (
      <Button asChild size="sm" variant="outline" className="flex-1 border-[#3a9ca5]/30 text-[#3a9ca5] hover:bg-[#3a9ca5]/5 hover:text-[#3a9ca5]">
        <a href={app.infoHref} target="_blank" rel="noopener noreferrer">Learn more <ArrowRight className="ml-1 w-3.5 h-3.5" /></a>
      </Button>
    ) : (
      <Button asChild size="sm" variant="outline" className="flex-1 border-[#3a9ca5]/30 text-[#3a9ca5] hover:bg-[#3a9ca5]/5 hover:text-[#3a9ca5]">
        <Link href={app.infoHref}>Learn more <ArrowRight className="ml-1 w-3.5 h-3.5" /></Link>
      </Button>
    )
  ) : null;

  const openButton = app.appUrl ? (
    <Button asChild size="sm" className="flex-1 text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${app.accentFrom}, ${app.accentTo})` }}>
      <a href={app.appUrl} target="_blank" rel="noopener noreferrer">Open app <ExternalLink className="ml-1 w-3.5 h-3.5" /></a>
    </Button>
  ) : (
    <Button size="sm" disabled className="flex-1 opacity-60">Coming soon</Button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group relative bg-card rounded-2xl border border-border hover:border-[#3a9ca5]/40 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
    >
      <div
        className="relative h-32 flex items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${app.accentFrom}12, ${app.accentTo}1f)` }}
      >
        <div
          className="absolute -inset-1 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background: `radial-gradient(circle at 50% 50%, ${app.accentFrom}25, transparent 70%)` }}
        />
        {app.badge && (
          <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/90 backdrop-blur text-[#3a9ca5] shadow-sm">
            <Sparkles className="w-2.5 h-2.5" /> {app.badge}
          </span>
        )}
        {showLogo ? (
          <img
            src={app.logoUrl!}
            alt={`${app.title} logo`}
            className="relative z-10 w-20 h-20 object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300"
            onError={() => setLogoBroken(true)}
          />
        ) : (
          <div
            className="relative z-10 w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-md group-hover:scale-105 transition-transform duration-300"
            style={{ background: `linear-gradient(135deg, ${app.accentFrom}, ${app.accentTo})` }}
          >
            {initial}
          </div>
        )}
      </div>

      <div className="p-5 flex-grow flex flex-col">
        <h3 className="text-base font-bold text-foreground group-hover:text-[#3a9ca5] transition-colors mb-1">
          {app.title}
        </h3>
        {app.tagline && (
          <p className="text-xs font-medium text-[#3a9ca5]/80 uppercase tracking-wide mb-2">{app.tagline}</p>
        )}
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 flex-grow line-clamp-3">
          {app.description}
        </p>
        <div className="flex gap-2 mt-auto">
          {infoButton}
          {openButton}
        </div>
      </div>
    </motion.div>
  );
}

export function ProductGrid() {
  const { data: apps = [], isLoading } = useQuery<AppItem[]>({
    queryKey: ["apps"],
    queryFn: async () => {
      const res = await fetch("/api/apps");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60_000,
  });

  return (
    <section id="products" className="pt-1 pb-12 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-1">
            <div className="w-1 h-7 rounded-full bg-gradient-to-b from-[#3a9ca5] to-[#4cb5bd]" />
            <EditableText
              contentKey="products.heading"
              fallback="Apps, Tools & Teaching Portal"
              as="h2"
              className="text-xl md:text-2xl font-bold"
            />
          </div>
          <EditableText
            contentKey="products.subheading"
            fallback="From curriculum planning to ready-to-teach courses — choose where to start."
            as="p"
            className="text-muted-foreground text-sm ml-4"
          />
        </motion.div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="h-32 bg-secondary animate-pulse" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-secondary rounded animate-pulse w-2/3" />
                  <div className="h-3 bg-secondary rounded animate-pulse w-full" />
                  <div className="h-3 bg-secondary rounded animate-pulse w-4/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && apps.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">No apps yet — add some from the admin dashboard.</div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {apps.map((app, i) => (
            <AppCard key={app.id} app={app} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
