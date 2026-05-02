import { Link } from "wouter";
import { ArrowRight, Check, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export type PageTemplate = "standard" | "cards" | "features" | "about" | "contact";

export interface PageData {
  eyebrow?: string;
  heading?: string;
  intro?: string;
  body?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  cards?: Array<{ title: string; description: string; href?: string }>;
  features?: Array<{ title: string; description: string }>;
  email?: string;
  phone?: string;
  address?: string;
}

export const TEMPLATE_LABELS: Record<PageTemplate, { label: string; description: string }> = {
  standard:  { label: "Standard",     description: "Hero title and a body of text. Best for policies, longer write-ups." },
  cards:     { label: "Card Grid",    description: "Hero plus a 3-column grid of cards. Great for service overviews." },
  features:  { label: "Hero + Features", description: "Hero, feature checklist and a call-to-action button." },
  about:     { label: "About / Bio",  description: "Image alongside a bio with an optional CTA." },
  contact:   { label: "Contact",      description: "Hero with email, phone and address details." },
};

function PageHero({ data }: { data: PageData }) {
  return (
    <div className="mb-10">
      {data.eyebrow && (
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[#3a9ca5] mb-3">
          {data.eyebrow}
        </p>
      )}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
        {data.heading}
      </h1>
      <div className="w-16 h-1 rounded-full bg-gradient-to-r from-[#3a9ca5] to-[#4cb5bd] mb-4" />
      {data.intro && (
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          {data.intro}
        </p>
      )}
    </div>
  );
}

function StandardTemplate({ data }: { data: PageData }) {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHero data={data} />
      {data.body && (
        <div className="rounded-2xl border border-[#3a9ca5]/10 bg-card p-6 md:p-10 shadow-sm">
          <div className="prose prose-lg max-w-none text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {data.body}
          </div>
        </div>
      )}
    </div>
  );
}

function CardsTemplate({ data }: { data: PageData }) {
  const cards = data.cards || [];
  return (
    <div className="max-w-5xl mx-auto">
      <PageHero data={data} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card, i) => {
          const inner = (
            <>
              <h3 className="text-base font-bold text-foreground group-hover:text-[#3a9ca5] transition-colors mb-2">
                {card.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{card.description}</p>
              {card.href && (
                <div className="flex items-center text-[#3a9ca5] text-xs font-semibold mt-3">
                  Learn More
                  <ArrowRight className="ml-1 w-3 h-3" />
                </div>
              )}
            </>
          );
          const cls = "group block bg-card rounded-xl p-5 border border-border hover:border-[#3a9ca5]/30 hover:shadow-md transition-all duration-200 h-full";
          return card.href ? (
            <Link key={i} href={card.href} className={cls}>{inner}</Link>
          ) : (
            <div key={i} className={cls}>{inner}</div>
          );
        })}
      </div>
    </div>
  );
}

function FeaturesTemplate({ data }: { data: PageData }) {
  const features = data.features || [];
  return (
    <div className="max-w-3xl mx-auto">
      <PageHero data={data} />
      {features.length > 0 && (
        <div className="rounded-2xl border border-[#3a9ca5]/10 bg-card p-6 md:p-10 shadow-sm">
          <ul className="space-y-4">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-[#3a9ca5]/10 text-[#3a9ca5] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h4 className="font-semibold text-foreground mb-0.5">{f.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      {data.ctaLabel && data.ctaHref && (
        <div className="text-center mt-8">
          <Button asChild className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white">
            <Link href={data.ctaHref}>
              {data.ctaLabel}
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function AboutTemplate({ data }: { data: PageData }) {
  return (
    <div className="max-w-5xl mx-auto">
      <PageHero data={data} />
      <div className="rounded-2xl border border-[#3a9ca5]/10 bg-card p-6 md:p-10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8 items-start">
          {data.imageUrl ? (
            <img src={data.imageUrl} alt={data.heading} className="w-full rounded-xl object-cover aspect-square" />
          ) : (
            <div className="w-full aspect-square rounded-xl bg-gradient-to-br from-[#3a9ca5]/20 to-[#4cb5bd]/10 flex items-center justify-center text-[#3a9ca5] text-6xl font-black">
              {data.heading?.[0] || "·"}
            </div>
          )}
          <div>
            {data.body && (
              <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{data.body}</p>
            )}
            {data.ctaLabel && data.ctaHref && (
              <Button asChild className="bg-[#3a9ca5] hover:bg-[#2d8890] text-white mt-6">
                <Link href={data.ctaHref}>
                  {data.ctaLabel}
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactTemplate({ data }: { data: PageData }) {
  return (
    <div className="max-w-3xl mx-auto">
      <PageHero data={data} />
      <div className="rounded-2xl border border-[#3a9ca5]/10 bg-card p-6 md:p-10 shadow-sm space-y-4">
        {data.email && (
          <a href={`mailto:${data.email}`} className="flex items-center gap-3 text-foreground hover:text-[#3a9ca5] transition-colors">
            <span className="w-9 h-9 rounded-full bg-[#3a9ca5]/10 text-[#3a9ca5] flex items-center justify-center"><Mail className="w-4 h-4" /></span>
            <span>{data.email}</span>
          </a>
        )}
        {data.phone && (
          <a href={`tel:${data.phone}`} className="flex items-center gap-3 text-foreground hover:text-[#3a9ca5] transition-colors">
            <span className="w-9 h-9 rounded-full bg-[#3a9ca5]/10 text-[#3a9ca5] flex items-center justify-center"><Phone className="w-4 h-4" /></span>
            <span>{data.phone}</span>
          </a>
        )}
        {data.address && (
          <div className="flex items-start gap-3 text-muted-foreground">
            <span className="w-9 h-9 rounded-full bg-[#3a9ca5]/10 text-[#3a9ca5] flex items-center justify-center mt-0.5">·</span>
            <address className="not-italic whitespace-pre-wrap">{data.address}</address>
          </div>
        )}
        {data.body && (
          <div className="pt-4 border-t border-border text-foreground/90 whitespace-pre-wrap leading-relaxed">
            {data.body}
          </div>
        )}
      </div>
    </div>
  );
}

export function CustomPageRenderer({ template, data }: { template: PageTemplate; data: PageData }) {
  switch (template) {
    case "cards":    return <CardsTemplate data={data} />;
    case "features": return <FeaturesTemplate data={data} />;
    case "about":    return <AboutTemplate data={data} />;
    case "contact":  return <ContactTemplate data={data} />;
    default:         return <StandardTemplate data={data} />;
  }
}
