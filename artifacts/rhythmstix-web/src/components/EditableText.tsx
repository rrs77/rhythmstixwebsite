import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { useContent, useSaveContent } from "@/hooks/use-content";
import { useAdminMode } from "@/hooks/use-admin";
import { cn } from "@/lib/utils";

interface EditableTextProps {
  contentKey: string;
  fallback: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span" | "div";
  className?: string;
  multiline?: boolean;
  children?: (value: string) => React.ReactNode;
}

export function EditableText({
  contentKey,
  fallback,
  as: Tag = "span",
  className,
  multiline = false,
  children,
}: EditableTextProps) {
  const { data: content } = useContent();
  const { data: isAdmin } = useAdminMode();
  const saveMutation = useSaveContent();

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const value = content?.[contentKey] ?? fallback;

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function startEdit() {
    setEditValue(value);
    setEditing(true);
  }

  function save() {
    if (!editValue.trim()) return;
    saveMutation.mutate(
      { key: contentKey, value: editValue.trim() },
      { onSuccess: () => setEditing(false) }
    );
  }

  function cancel() {
    setEditing(false);
    setEditValue("");
  }

  if (editing) {
    return (
      <div className="inline-flex items-start gap-2 w-full">
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter" && e.metaKey) save();
            }}
            rows={4}
            className="flex-grow px-3 py-2 rounded-lg border-2 border-[#3a9ca5] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 resize-y"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") cancel();
            }}
            className="flex-grow px-3 py-1.5 rounded-lg border-2 border-[#3a9ca5] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30"
          />
        )}
        <div className="flex gap-1 shrink-0 pt-1">
          <button
            onClick={save}
            disabled={saveMutation.isPending}
            className="p-1.5 rounded-lg bg-[#3a9ca5] text-white hover:bg-[#2d8890] transition-colors disabled:opacity-50"
            title="Save (Enter)"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={cancel}
            className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (children) {
    return (
      <Tag className={cn("group/editable relative", isAdmin && "cursor-pointer", className)}>
        {children(value)}
        {isAdmin && (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startEdit(); }
            }}
            className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#3a9ca5]/10 text-[#3a9ca5] hover:bg-[#3a9ca5]/20 transition-colors ml-1.5 opacity-0 group-hover/editable:opacity-100 align-middle"
            title={`Edit: ${contentKey}`}
          >
            <Pencil className="w-3 h-3" />
          </span>
        )}
      </Tag>
    );
  }

  return (
    <Tag className={cn("group/editable relative", isAdmin && "cursor-pointer", className)}>
      {value}
      {isAdmin && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startEdit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startEdit(); }
          }}
          className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#3a9ca5]/10 text-[#3a9ca5] hover:bg-[#3a9ca5]/20 transition-colors ml-1.5 opacity-0 group-hover/editable:opacity-100 align-middle"
          title={`Edit: ${contentKey}`}
        >
          <Pencil className="w-3 h-3" />
        </span>
      )}
    </Tag>
  );
}

interface EditableListProps {
  contentKey: string;
  fallback: string[];
  className?: string;
  itemClassName?: string;
  renderItem?: (item: string, index: number) => React.ReactNode;
}

export function EditableList({
  contentKey,
  fallback,
  className,
  itemClassName,
  renderItem,
}: EditableListProps) {
  const { data: content } = useContent();
  const { data: isAdmin } = useAdminMode();
  const saveMutation = useSaveContent();

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");

  const raw = content?.[contentKey];
  const items: string[] = raw ? JSON.parse(raw) : fallback;

  function startEdit() {
    setEditValue(items.join("\n"));
    setEditing(true);
  }

  function save() {
    const newItems = editValue.split("\n").map((s) => s.trim()).filter(Boolean);
    saveMutation.mutate(
      { key: contentKey, value: JSON.stringify(newItems) },
      { onSuccess: () => setEditing(false) }
    );
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">One item per line:</p>
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
          autoFocus
          rows={Math.max(4, items.length + 1)}
          className="w-full px-3 py-2 rounded-lg border-2 border-[#3a9ca5] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#3a9ca5]/30 resize-y"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saveMutation.isPending}
            className="px-3 py-1.5 rounded-lg bg-[#3a9ca5] text-white text-xs font-medium hover:bg-[#2d8890] transition-colors disabled:opacity-50"
          >
            {saveMutation.isPending ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("group/editable relative", className)}>
      {renderItem
        ? items.map((item, i) => <div key={i} className={itemClassName}>{renderItem(item, i)}</div>)
        : items.map((item, i) => (
            <div key={i} className={itemClassName}>{item}</div>
          ))
      }
      {isAdmin && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            startEdit();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startEdit(); }
          }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#3a9ca5]/10 text-[#3a9ca5] text-xs font-medium hover:bg-[#3a9ca5]/20 transition-colors mt-2 opacity-0 group-hover/editable:opacity-100 cursor-pointer"
          title={`Edit list: ${contentKey}`}
        >
          <Pencil className="w-3 h-3" />
          Edit List
        </span>
      )}
    </div>
  );
}
