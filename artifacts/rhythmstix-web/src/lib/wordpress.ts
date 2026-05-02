const WP_SITE = (import.meta.env.VITE_WP_BASE_URL || "https://www.rhythmstix.co.uk").replace(/\/$/, "");
const WP_BASE = `${WP_SITE}/wp-json/wp/v2`;
const WP_HOST_PATTERN = new RegExp(
  `^https?:\\/\\/(?:www\\.)?(?:${new URL(WP_SITE).hostname.replace(/^www\./, "").replace(/\./g, "\\.")}|rhythmstix\\.co\\.uk)`,
  "i"
);
export const WP_LINK_PATTERN = WP_HOST_PATTERN;

export interface WPPage {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  featured_media: number;
  date: string;
}

export interface WPPost {
  id: number;
  slug: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  link: string;
  featured_media: number;
  date: string;
  categories: number[];
}

export interface WPMedia {
  id: number;
  source_url: string;
  alt_text: string;
  title: { rendered: string };
}

async function wpFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${WP_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`WP API error: ${res.status}`);
  return res.json();
}

export async function getPage(slug: string): Promise<WPPage | null> {
  const pages = await wpFetch<WPPage[]>(`/pages?slug=${slug}&_embed`);
  return pages[0] || null;
}

export async function getPageById(id: number): Promise<WPPage | null> {
  try {
    return await wpFetch<WPPage>(`/pages/${id}`);
  } catch {
    return null;
  }
}

export async function getPages(): Promise<WPPage[]> {
  return wpFetch<WPPage[]>("/pages?per_page=100&_fields=id,title,slug,link,excerpt");
}

export async function getPosts(perPage = 20): Promise<WPPost[]> {
  return wpFetch<WPPost[]>(`/posts?per_page=${perPage}&_fields=id,title,slug,link,excerpt,date,featured_media,categories`);
}

export async function getPost(slug: string): Promise<WPPost | null> {
  const posts = await wpFetch<WPPost[]>(`/posts?slug=${slug}`);
  return posts[0] || null;
}

export async function getMedia(id: number): Promise<WPMedia | null> {
  if (!id) return null;
  try {
    return await wpFetch<WPMedia>(`/media/${id}?_fields=id,source_url,alt_text,title`);
  } catch {
    return null;
  }
}

export function decodeHtml(html: string): string {
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}

const KNOWN_ROUTES: Record<string, string> = {
  assessify: "https://assessify.rhythmstix.co.uk/",
  ccdesigner: "https://www.ccdesigner.co.uk/",
  "creative-curriculum-designer": "https://www.ccdesigner.co.uk/",
  perifeedback: "http://perifeedback.co.uk/",
  periplanner: "http://perifeedback.co.uk/",
  progresspath: "/progresspath",
  "progress-path": "/progresspath",
  "e-learning": "/elearning",
  elearning: "/elearning",
  "rhythmstix-app": "/rhythmstix-app",
  app: "/app",
  shop: "/shop",
  blog: "/blog",
  community: "/community",
  contact: "/contact",
  "contact-us": "/contact",
};

export function rewriteWPLinks(html: string): string {
  html = html.replace(
    /href=["']https?:\/\/[^@"']*@rhythmstix\.co\.uk[^"']*["']/gi,
    'href="/"'
  );

  return html.replace(
    /href=["'](https?:\/\/(?:www\.|cms\.)?rhythmstix\.co\.uk)\/?([^"'#?]*)([^"']*)["']/gi,
    (_match, _domain, path, extra) => {
      const cleanPath = path.replace(/\/$/, "").toLowerCase();

      if (!cleanPath) {
        return `href="/${extra}"`;
      }

      const firstSegment = cleanPath.split("/")[0];
      const route = KNOWN_ROUTES[firstSegment];
      if (route) {
        return `href="${route}${extra}"`;
      }

      const fullRoute = KNOWN_ROUTES[cleanPath];
      if (fullRoute) {
        return `href="${fullRoute}${extra}"`;
      }

      return `href="/${cleanPath}${extra}"`;
    }
  );
}
