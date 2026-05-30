const WP_HOST_RE = /^https?:\/\/(www\.)?rhythmstix\.co\.uk/i;

export function toInternalIfWP(href: string): string | null {
  if (!href) return null;
  if (!WP_HOST_RE.test(href)) return null;
  try {
    const u = new URL(href);
    let slug = u.pathname.replace(/^\/+|\/+$/g, "");
    const qp = u.searchParams.get("p") || u.searchParams.get("page_id") || u.searchParams.get("slug");
    if (qp) return `/${qp}`;
    if (!slug) return null;
    const last = slug.split("/").pop() || slug;
    return `/${last}`;
  } catch {
    return null;
  }
}

export function resolveInternal(href: string): string | null {
  if (!href) return null;
  if (href.startsWith("/")) return href;
  return toInternalIfWP(href);
}
