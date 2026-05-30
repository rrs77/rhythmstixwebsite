import { useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import { Code2, Eye } from "lucide-react";
import { WPContent } from "@/components/WPContent";
import { cn } from "@/lib/utils";

interface HtmlBodyEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function HtmlBodyEditor({ value, onChange, placeholder }: HtmlBodyEditorProps) {
  const [mode, setMode] = useState<"html" | "preview">("html");

  return (
    <div className="space-y-2">
      <div
        role="tablist"
        aria-label="Editor mode"
        className="inline-flex items-center rounded-lg border border-border bg-secondary/40 p-0.5 text-xs font-medium"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "html"}
          onClick={() => setMode("html")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors",
            mode === "html"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Code2 className="w-3.5 h-3.5" />
          HTML
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "preview"}
          onClick={() => setMode("preview")}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors",
            mode === "preview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>
      </div>

      {mode === "html" ? (
        <div className="rounded border border-border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-[#3a9ca5]/30">
          <Editor
            value={value}
            onValueChange={onChange}
            highlight={(code) =>
              Prism.highlight(code || "", Prism.languages.markup, "markup")
            }
            padding={12}
            placeholder={placeholder}
            tabSize={2}
            insertSpaces={true}
            textareaClassName="focus:outline-none"
            preClassName="!whitespace-pre-wrap"
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              fontSize: 12,
              lineHeight: 1.6,
              minHeight: 320,
              maxHeight: 560,
              overflow: "auto",
            }}
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-[#3a9ca5]/10 bg-card p-6 md:p-8 shadow-sm max-h-[560px] overflow-auto">
          {value.trim() ? (
            <WPContent className="wp-content prose prose-lg max-w-none" html={value} />
          ) : (
            <p className="text-sm text-muted-foreground italic">
              Nothing to preview yet. Switch to <strong>HTML</strong> and add some content.
            </p>
          )}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground">
        {mode === "html"
          ? "Raw HTML is sanitized server-side on save. Internal links to www.rhythmstix.co.uk are auto-rewritten to local routes."
          : "Live preview matches the published page rendering. Switch back to HTML to keep editing."}
      </p>
    </div>
  );
}
