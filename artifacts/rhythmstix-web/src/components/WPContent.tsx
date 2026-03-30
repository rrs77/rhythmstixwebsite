import { useCallback, type ReactNode, type MouseEvent } from "react";
import { useLocation } from "wouter";

interface WPContentProps {
  html: string;
  className?: string;
}

export function WPContent({ html, className = "" }: WPContentProps) {
  const [, navigate] = useLocation();

  const handleClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (!anchor) return;

    const href = anchor.getAttribute("href");
    if (!href) return;

    if (href.startsWith("/") && !href.startsWith("//")) {
      e.preventDefault();
      navigate(href);
    }
  }, [navigate]);

  return (
    <div
      className={className}
      onClick={handleClick}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
