import { useState, type ReactNode } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, ExternalLink } from "lucide-react";

interface PortalModalProps {
  url: string;
  title?: string;
  children: (open: () => void) => ReactNode;
}

export function PortalModal({ url, title = "Portal", children }: PortalModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {children(() => setIsOpen(true))}
      <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 flex flex-col bg-background border shadow-2xl rounded-lg overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
            style={{
              width: "90vw",
              height: "85vh",
              minWidth: 320,
              minHeight: 240,
              maxWidth: "98vw",
              maxHeight: "95vh",
              resize: "both",
            }}
          >
            <DialogPrimitive.Title className="sr-only">{title}</DialogPrimitive.Title>
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b bg-muted/40 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-foreground truncate">{title}</span>
                <span className="text-xs text-muted-foreground truncate hidden sm:inline">{url}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-[#3a9ca5] px-2 py-1 rounded-md hover:bg-background transition-colors"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Open in new tab</span>
                </a>
                <DialogPrimitive.Close
                  className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </DialogPrimitive.Close>
              </div>
            </div>
            <iframe
              src={url}
              title={title}
              className="flex-1 w-full bg-white"
              allow="clipboard-read; clipboard-write; fullscreen; microphone; camera"
            />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
