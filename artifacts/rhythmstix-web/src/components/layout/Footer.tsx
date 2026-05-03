import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Youtube, Linkedin, Facebook, MapPin, Phone, Mail } from "lucide-react";
import { EditableText } from "@/components/EditableText";
import { useContent } from "@/hooks/use-content";

interface NavLink {
  id: number;
  label: string;
  href: string;
  group: string;
  sortOrder: number;
}

const FALLBACK_FOOTER_LINKS: Pick<NavLink, "label" | "href">[] = [
  { label: "Blog", href: "/blog" },
  { label: "Shop", href: "/shop" },
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Notice", href: "/policy" },
  { label: "Cookies", href: "/cookies" },
  { label: "Copyright", href: "/copyright-and-licenses" },
];

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

export function Footer() {
  const { data: navLinks } = useQuery<NavLink[]>({
    queryKey: ["nav-links"],
    queryFn: async () => {
      const res = await fetch("/api/nav-links");
      if (!res.ok) throw new Error("nav links fetch failed");
      const json = await res.json();
      return Array.isArray(json) ? json : [];
    },
    staleTime: 60_000,
  });
  const { data: content } = useContent();

  const footerLinks: Pick<NavLink, "label" | "href">[] = (() => {
    const f = (navLinks ?? []).filter((l) => l.group === "footer");
    return f.length ? f : FALLBACK_FOOTER_LINKS;
  })();

  const youtubeUrl = content?.["footer_youtube_url"] || "https://www.youtube.com/@RhythmstixMusicForEducation";
  const linkedinUrl = content?.["footer_linkedin_url"] || "https://www.linkedin.com/in/robert-reich-storer-974449144/";
  const facebookUrl = content?.["footer_facebook_url"] || "https://www.facebook.com/rhythmstix";

  return (
    <footer className="bg-gradient-to-b from-background to-[#3a9ca5]/[0.02] border-t border-border pt-10 pb-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground mb-1">
              <span className="border-b-2 border-[#3a9ca5]/30 pb-0.5">Contact Us</span>
            </h3>
            <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <Phone size={14} className="shrink-0 text-[#3a9ca5]" />
              <EditableText contentKey="footer_phone" fallback="01245 633 231" as="span">
                {(v) => <a href={`tel:${v.replace(/\s+/g, "")}`}>{v}</a>}
              </EditableText>
            </div>
            <div className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors text-sm">
              <Mail size={14} className="shrink-0 text-[#3a9ca5]" />
              <EditableText contentKey="footer_email" fallback="info@rhythmstix.co.uk" as="span">
                {(v) => <a href={`mailto:${v}`}>{v}</a>}
              </EditableText>
            </div>
            <div className="flex items-start gap-2.5 text-muted-foreground text-sm">
              <MapPin size={14} className="mt-0.5 shrink-0 text-[#3a9ca5]" />
              <EditableText
                contentKey="footer_address"
                fallback="Rhythmstix Ltd, 33 Vicarage Road, Chelmsford, Essex CM2 9BP"
                as="div"
                multiline
              >
                {(v) => (
                  <address className="not-italic text-xs leading-relaxed whitespace-pre-line">{v}</address>
                )}
              </EditableText>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:items-center">
            <div className="w-full md:w-auto">
              <h3 className="text-sm font-bold text-foreground mb-2">
                <span className="border-b-2 border-[#3a9ca5]/30 pb-0.5">Links</span>
              </h3>
              <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                {footerLinks.map((link) => (
                  <li key={link.label}>
                    {isExternal(link.href) ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-[#3a9ca5] transition-colors text-xs"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} className="text-muted-foreground hover:text-[#3a9ca5] transition-colors text-xs">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground mb-1">
              <span className="border-b-2 border-[#3a9ca5]/30 pb-0.5">Follow Us</span>
            </h3>
            <div className="flex items-center gap-3">
              <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-[#3a9ca5] hover:text-white transition-all">
                <Youtube size={16} />
              </a>
              <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-[#3a9ca5] hover:text-white transition-all">
                <Linkedin size={14} />
              </a>
              <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-[#3a9ca5] hover:text-white transition-all">
                <Facebook size={16} />
              </a>
            </div>
          </div>

        </div>

        <div className="pt-4 border-t border-border/60 flex flex-col md:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <span className="font-bold text-foreground/80">rhythm<span className="text-[#3a9ca5]">stix</span></span>
            <EditableText contentKey="footer_copyright" fallback="© 2021" as="span" />
          </div>
          <EditableText contentKey="footer_tagline" fallback="Designed for education." as="p" className="text-[10px] text-muted-foreground/50" />
        </div>
      </div>
    </footer>
  );
}
