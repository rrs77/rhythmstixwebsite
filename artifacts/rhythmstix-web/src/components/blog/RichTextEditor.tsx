import { useCallback, useEffect, useRef } from "react";
import {
  Bold, Italic, Underline, Heading2, Heading3, List, ListOrdered,
  Quote, Link as LinkIcon, Image as ImageIcon, Youtube, Undo2, Redo2, Eraser,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  minHeight?: number;
}

// Some browsers (Chrome with Trusted Types enforced via header/meta) reject
// raw string assignment to innerHTML / execCommand("insertHTML", string).
// Create a single named policy that returns the editor's own strings as
// trusted — content is always re-sanitised server-side before display.
type TrustedTypesWindow = Window & {
  trustedTypes?: {
    createPolicy: (name: string, rules: { createHTML: (s: string) => string }) => {
      createHTML: (s: string) => string;
    };
  };
};
let __ttPolicy: { createHTML: (s: string) => string } | null | undefined;
function getTrustedHtml(s: string): string {
  if (typeof window === "undefined") return s;
  const tt = (window as TrustedTypesWindow).trustedTypes;
  if (!tt) return s;
  if (__ttPolicy === undefined) {
    try {
      __ttPolicy = tt.createPolicy("rhythmstix-rte", { createHTML: (input: string) => input });
    } catch {
      __ttPolicy = null;
    }
  }
  return __ttPolicy ? (__ttPolicy.createHTML(s) as unknown as string) : s;
}

function setInnerHtml(el: HTMLElement, html: string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (el as any).innerHTML = getTrustedHtml(html);
}

function execCmd(cmd: string, arg?: string) {
  if (cmd === "insertHTML" && typeof arg === "string") {
    document.execCommand(cmd, false, getTrustedHtml(arg) as unknown as string);
  } else {
    document.execCommand(cmd, false, arg);
  }
}

const YT_ID_RE = /^[A-Za-z0-9_-]{11}$/;

function youtubeIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.slice(1) || null;
    else if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      if (u.pathname === "/watch") id = u.searchParams.get("v");
      else {
        const m = u.pathname.match(/^\/(embed|shorts)\/([\w-]+)/);
        if (m) id = m[2];
      }
    }
    return id && YT_ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Strict URL safelist for inserted hrefs/src — blocks javascript:, data:, vbscript:, control chars.
function isSafeUrl(raw: string): boolean {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) return false;
  // Reject control chars, quotes, angle brackets, backslashes, whitespace inside the URL.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f"<>\\\s]/.test(trimmed)) return false;
  try { new URL(trimmed); return true; } catch { return false; }
}

export function RichTextEditor({ value, onChange, className, minHeight = 320 }: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  // Last selection inside the editor; saved before opening prompts (which steal focus/selection).
  const savedRangeRef = useRef<Range | null>(null);

  // Sync external value into the editor only when it differs from current DOM
  // (avoids resetting the caret while the user types).
  useEffect(() => {
    if (!ref.current) return;
    if (ref.current.innerHTML !== value) {
      setInnerHtml(ref.current, value || "");
    }
  }, [value]);

  const emit = useCallback(() => {
    if (ref.current) onChange(ref.current.innerHTML);
  }, [onChange]);

  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !ref.current) return;
    const range = sel.getRangeAt(0);
    if (ref.current.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const range = savedRangeRef.current;
    if (!range || !ref.current) return;
    ref.current.focus();
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    sel.addRange(range);
  }, []);

  const apply = useCallback((cmd: string, arg?: string) => {
    restoreSelection();
    execCmd(cmd, arg);
    saveSelection();
    emit();
  }, [emit, restoreSelection, saveSelection]);

  const insertHtml = useCallback((html: string) => {
    restoreSelection();
    execCmd("insertHTML", html);
    saveSelection();
    emit();
  }, [emit, restoreSelection, saveSelection]);

  const onLink = useCallback(() => {
    saveSelection();
    const url = window.prompt("Link URL (https://…)");
    if (!url) return;
    if (!isSafeUrl(url)) {
      window.alert("Please enter a full URL starting with http:// or https:// (no quotes or spaces).");
      return;
    }
    const safeUrl = escapeAttr(url.trim());
    // Insert a fully-formed anchor so we control attributes (target/rel) without
    // relying on execCommand("createLink") plus post-hoc DOM mutation.
    restoreSelection();
    const sel = window.getSelection();
    const selectedText = sel?.toString() || url.trim();
    insertHtml(`<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${escapeAttr(selectedText)}</a>`);
  }, [insertHtml, restoreSelection, saveSelection]);

  const onImage = useCallback(() => {
    saveSelection();
    const url = window.prompt("Image URL (https://…)");
    if (!url) return;
    if (!isSafeUrl(url)) {
      window.alert("Please enter a full image URL starting with http:// or https:// (no quotes or spaces).");
      return;
    }
    const alt = window.prompt("Image description (alt text)") || "";
    insertHtml(`<img src="${escapeAttr(url.trim())}" alt="${escapeAttr(alt)}" />`);
  }, [insertHtml, saveSelection]);

  const onYouTube = useCallback(() => {
    saveSelection();
    const url = window.prompt("YouTube URL (watch, shorts, or youtu.be link)");
    if (!url) return;
    const id = youtubeIdFromUrl(url);
    if (!id) {
      window.alert("That doesn't look like a YouTube URL.");
      return;
    }
    // id is guaranteed to match YT_ID_RE (alphanumeric, _, -) so safe to interpolate.
    insertHtml(
      `<p><iframe src="https://www.youtube.com/embed/${id}" width="560" height="315" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen title="YouTube video"></iframe></p>`
    );
  }, [insertHtml, saveSelection]);

  const btn = "w-8 h-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-slate-100 hover:text-foreground border border-transparent";

  // Toolbar buttons must not steal focus from the editor; use onMouseDown preventDefault
  // and bind the action to onClick so the selection is preserved between mousedown and click.
  const toolbarMouseDown = (e: React.MouseEvent) => e.preventDefault();

  return (
    <div className={cn("rounded-lg border border-border bg-background overflow-hidden", className)}>
      <div role="toolbar" aria-label="Formatting" className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-slate-50/70" onMouseDown={toolbarMouseDown}>
        <button type="button" aria-label="Bold" onClick={() => apply("bold")} title="Bold (Ctrl+B)" className={btn}><Bold className="w-4 h-4" /></button>
        <button type="button" aria-label="Italic" onClick={() => apply("italic")} title="Italic (Ctrl+I)" className={btn}><Italic className="w-4 h-4" /></button>
        <button type="button" aria-label="Underline" onClick={() => apply("underline")} title="Underline (Ctrl+U)" className={btn}><Underline className="w-4 h-4" /></button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" aria-label="Heading 2" onClick={() => apply("formatBlock", "<h2>")} title="Heading 2" className={btn}><Heading2 className="w-4 h-4" /></button>
        <button type="button" aria-label="Heading 3" onClick={() => apply("formatBlock", "<h3>")} title="Heading 3" className={btn}><Heading3 className="w-4 h-4" /></button>
        <button type="button" aria-label="Paragraph" onClick={() => apply("formatBlock", "<p>")} title="Paragraph" className={cn(btn, "text-xs font-semibold px-1.5 w-auto")}>P</button>
        <button type="button" aria-label="Block quote" onClick={() => apply("formatBlock", "<blockquote>")} title="Quote" className={btn}><Quote className="w-4 h-4" /></button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" aria-label="Bulleted list" onClick={() => apply("insertUnorderedList")} title="Bulleted list" className={btn}><List className="w-4 h-4" /></button>
        <button type="button" aria-label="Numbered list" onClick={() => apply("insertOrderedList")} title="Numbered list" className={btn}><ListOrdered className="w-4 h-4" /></button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" aria-label="Insert link" onClick={onLink} title="Insert link" className={btn}><LinkIcon className="w-4 h-4" /></button>
        <button type="button" aria-label="Remove link" onClick={() => apply("unlink")} title="Remove link" className={cn(btn, "text-xs")}>Un</button>
        <button type="button" aria-label="Insert image by URL" onClick={onImage} title="Insert image by URL" className={btn}><ImageIcon className="w-4 h-4" /></button>
        <button type="button" aria-label="Embed YouTube video" onClick={onYouTube} title="Embed YouTube video" className={btn}><Youtube className="w-4 h-4" /></button>
        <span className="mx-1 h-5 w-px bg-slate-200" />
        <button type="button" aria-label="Clear formatting" onClick={() => apply("removeFormat")} title="Clear formatting" className={btn}><Eraser className="w-4 h-4" /></button>
        <button type="button" aria-label="Undo" onClick={() => apply("undo")} title="Undo" className={btn}><Undo2 className="w-4 h-4" /></button>
        <button type="button" aria-label="Redo" onClick={() => apply("redo")} title="Redo" className={btn}><Redo2 className="w-4 h-4" /></button>
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label="Post body"
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onPaste={(e) => {
          // Force plain-text paste so users don't drag in arbitrary styled markup
          // from Word/Google Docs. Formatting can be re-applied with the toolbar.
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          execCmd("insertText", text);
          emit();
        }}
        className="prose prose-base max-w-none px-4 py-3 text-sm focus:outline-none [&_iframe]:w-full [&_iframe]:aspect-video [&_iframe]:h-auto [&_img]:max-w-full [&_img]:rounded-md"
        style={{ minHeight }}
      />
    </div>
  );
}
