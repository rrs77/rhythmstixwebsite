import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// --- Mock heavy layout chrome that isn't relevant to this flow ---
vi.mock("@/components/layout/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/components/layout/Footer", () => ({ Footer: () => null }));

// The blog body editor uses a contentEditable rich-text editor that jsdom can't
// drive. Swap it for a plain textarea so the test can focus on the data flow
// (save -> refetch -> modal reflects live content), not the editor internals.
vi.mock("@/components/blog/RichTextEditor", () => ({
  RichTextEditor: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <textarea data-testid="rte" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

// Strip framer-motion animations so AnimatePresence unmounts the modal
// synchronously (otherwise close/reopen would race the exit animation).
vi.mock("framer-motion", async () => {
  const React = await import("react");
  const MOTION_PROPS = new Set([
    "initial", "animate", "exit", "transition", "whileHover", "whileTap",
    "whileInView", "viewport", "variants", "layout", "layoutId", "drag",
    "onAnimationComplete", "onAnimationStart",
  ]);
  const createComp = (tag: string) =>
    React.forwardRef<HTMLElement, Record<string, unknown>>(({ children, ...props }, ref) => {
      const clean: Record<string, unknown> = {};
      for (const k in props) if (!MOTION_PROPS.has(k)) clean[k] = props[k];
      return React.createElement(tag, { ...clean, ref }, children as React.ReactNode);
    });
  const cache: Record<string, unknown> = {};
  const motion = new Proxy({}, {
    get: (_t, tag: string) => (cache[tag] ??= createComp(tag)),
  });
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

import BlogList from "./BlogList";

interface FakeBlogPost {
  id: string;
  rawId: number;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  published: boolean;
}

let blogPosts: FakeBlogPost[];

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function installFetchMock() {
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const method = (init?.method || "GET").toUpperCase();
    const path = url.replace(/^https?:\/\/[^/]+/, "");

    // WordPress REST API — return no posts.
    if (url.includes("/wp-json/")) return json([]);

    if (path.startsWith("/api/auth/admin-check")) return json({ authenticated: true });
    if (path.startsWith("/api/social/posts")) return json([]);
    if (path.startsWith("/api/hidden-posts")) return json([]);

    if (path.startsWith("/api/blog-posts/all")) return json(blogPosts);

    // PUT /api/blog-posts/:rawId — partial update (mirrors the server which only
    // updates provided fields).
    const putMatch = path.match(/^\/api\/blog-posts\/(\d+)$/);
    if (putMatch && method === "PUT") {
      const rawId = Number(putMatch[1]);
      const body = init?.body ? JSON.parse(init.body as string) : {};
      const post = blogPosts.find((p) => p.rawId === rawId);
      if (!post) return json({ error: "not found" }, 404);
      if (body.title !== undefined) post.title = body.title;
      if (body.excerpt !== undefined) post.excerpt = body.excerpt;
      if (body.content !== undefined) post.content = body.content;
      if (body.date !== undefined) post.date = body.date;
      if (body.published !== undefined) post.published = body.published;
      return json(post);
    }

    if (path === "/api/blog-posts" && method === "GET") {
      return json(blogPosts.filter((p) => p.published));
    }

    return json([], 200);
  }) as unknown as typeof fetch;
}

function renderBlogList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <BlogList />
    </QueryClientProvider>,
  );
}

// Open the post modal by clicking the card whose title matches.
async function openModal(user: ReturnType<typeof userEvent.setup>, title: string) {
  // Blog posts only appear under the "All" filter (no dedicated Blog tab).
  await user.click(await screen.findByRole("button", { name: /^All/ }));
  const card = await screen.findByText(title);
  await user.click(card);
}

describe("BlogList admin post modal", () => {
  beforeEach(() => {
    blogPosts = [
      {
        id: "blog-1",
        rawId: 1,
        title: "Regression Test Post",
        excerpt: "An excerpt that stays the same.",
        content: "Original body text.",
        date: "2026-01-15T00:00:00.000Z",
        published: true,
      },
    ];
    installFetchMock();
  });

  it("keeps the visibility toggle and 'Visible to public' checkbox in sync while the modal stays open", async () => {
    const user = userEvent.setup();
    renderBlogList();
    await openModal(user, "Regression Test Post");

    // Starts visible.
    const toggle = await screen.findByRole("button", { name: /Visible — click to hide/i });
    expect(toggle).toBeInTheDocument();

    // First toggle -> hidden. The label must actually flip (the original bug
    // made this a no-op because the modal rendered a stale snapshot).
    await user.click(toggle);
    const showBtn = await screen.findByRole("button", { name: /Hidden — click to show/i });
    expect(showBtn).toBeInTheDocument();

    // The "Hidden" badge in the modal header reflects the new state too.
    await waitFor(() => {
      const badges = screen.getAllByText("Hidden");
      expect(badges.length).toBeGreaterThan(0);
    });

    // Enter edit mode: the "Visible to public" checkbox must match (unchecked).
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    const checkboxHidden = await screen.findByRole("checkbox");
    expect(checkboxHidden).not.toBeChecked();
    await user.click(screen.getByRole("button", { name: /^Cancel$/i }));

    // Second toggle -> visible again.
    await user.click(await screen.findByRole("button", { name: /Hidden — click to show/i }));
    expect(await screen.findByRole("button", { name: /Visible — click to hide/i })).toBeInTheDocument();

    // Checkbox now matches the visible state (checked).
    await user.click(screen.getByRole("button", { name: /^Edit$/i }));
    const checkboxVisible = await screen.findByRole("checkbox");
    expect(checkboxVisible).toBeChecked();
  });

  it("persists edited body content after save and reopen", async () => {
    const user = userEvent.setup();
    renderBlogList();
    await openModal(user, "Regression Test Post");

    // Edit the body, adding a URL (the kind of content that appeared to vanish).
    await user.click(await screen.findByRole("button", { name: /^Edit$/i }));
    const editor = await screen.findByTestId("rte");
    await user.clear(editor);
    await user.type(editor, "Watch this: https://youtu.be/NEW123");

    await user.click(screen.getByRole("button", { name: /Save changes/i }));

    // Wait for the save to land (edit mode closes -> Edit button returns).
    await screen.findByRole("button", { name: /^Edit$/i });

    // Close and reopen so the modal re-derives from live query data, not the
    // in-memory edit buffer.
    await user.click(screen.getByRole("button", { name: /^Close$/i }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Visible — click to hide/i })).not.toBeInTheDocument();
    });

    const card = await screen.findByText("Regression Test Post");
    await user.click(card);

    // The saved URL must be present in the reopened modal.
    expect(await screen.findByText(/youtu\.be\/NEW123/)).toBeInTheDocument();

    // And it must be the persisted value from the backend.
    expect(blogPosts[0].content).toContain("https://youtu.be/NEW123");
  });
});
