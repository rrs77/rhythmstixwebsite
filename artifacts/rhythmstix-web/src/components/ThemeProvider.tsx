import { useEffect } from "react";
import { useContent } from "@/hooks/use-content";

/**
 * Reads `theme.*` keys from siteContentTable and injects them as CSS custom
 * properties on document.documentElement. The CSS in `index.css` already
 * consumes these via `hsl(var(--primary))` etc., so changing the values here
 * cascades through every shadcn component, button, ring, focus state, and
 * border in the app.
 *
 * Stored keys (all optional — fall back to the values in index.css):
 *   theme.primaryColor   — hex (#RRGGBB)
 *   theme.accentColor    — hex (#RRGGBB)
 *   theme.backgroundTone — hex (#RRGGBB)
 *   theme.radius         — number (rem) for the rounded-xl scale
 *   theme.headingWeight  — "600" | "700" | "800" | "900"
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: content } = useContent();

  useEffect(() => {
    const root = document.documentElement;
    if (!content) return;

    const primary = content["theme.primaryColor"];
    const accent = content["theme.accentColor"];
    const background = content["theme.backgroundTone"];
    const radius = content["theme.radius"];
    const headingWeight = content["theme.headingWeight"];

    if (primary) {
      const hsl = hexToHslTriplet(primary);
      if (hsl) {
        root.style.setProperty("--primary", hsl);
        root.style.setProperty("--ring", hsl);
      }
    } else {
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
    }

    if (accent) {
      const hsl = hexToHslTriplet(accent);
      if (hsl) root.style.setProperty("--accent", hsl);
    } else {
      root.style.removeProperty("--accent");
    }

    if (background) {
      const hsl = hexToHslTriplet(background);
      if (hsl) root.style.setProperty("--background", hsl);
    } else {
      root.style.removeProperty("--background");
    }

    if (radius) {
      const num = parseFloat(radius);
      if (!Number.isNaN(num) && num >= 0 && num <= 3) {
        root.style.setProperty("--radius-xl", `${num}rem`);
        root.style.setProperty("--radius-lg", `${num * 0.75}rem`);
        root.style.setProperty("--radius-md", `${num * 0.5}rem`);
      }
    } else {
      root.style.removeProperty("--radius-xl");
      root.style.removeProperty("--radius-lg");
      root.style.removeProperty("--radius-md");
    }

    if (headingWeight && /^[1-9]00$/.test(headingWeight)) {
      root.style.setProperty("--heading-weight", headingWeight);
    } else {
      root.style.removeProperty("--heading-weight");
    }
  }, [content]);

  return <>{children}</>;
}

/** Convert "#3a9ca5" or shorthand "#39c" -> "184 47% 44%" (shadcn HSL var format). */
function hexToHslTriplet(hex: string): string | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const expanded = m[1].length === 3
    ? m[1].split("").map((c) => c + c).join("")
    : m[1];
  const int = parseInt(expanded, 16);
  const r = ((int >> 16) & 0xff) / 255;
  const g = ((int >> 8) & 0xff) / 255;
  const b = (int & 0xff) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return `${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}
