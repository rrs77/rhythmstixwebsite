---
name: Blog/post modal live state
description: Why the BlogList PostModal must render live query data, not a frozen activePost snapshot.
---

# Post modal must reflect live query data, not a frozen snapshot

In `rhythmstix-web` `BlogList`, an open post is stored in `activePost` state set at
click time. The React Query cache (`["blog-posts"]`) updates after save/visibility
toggles, but `activePost` is a captured snapshot that never updates on its own.

**Rule:** derive what the modal renders from the latest query results, e.g.
`liveActivePost = unifiedPosts.find(p => p.id === activePost.id) ?? activePost`, and
compute mutation targets (publish/hide) from that live object — never from the
snapshot the modal was opened with.

**Why:** rendering the frozen snapshot made the hide/show toggle look like a no-op
(its `hidden` prop/label never changed) and made the "Visible to public" checkbox
drift from the Hidden badge. It also made saved body content (e.g. a YouTube URL)
appear to "disappear" on reopen — the data was always intact server-side; the modal
was just showing stale state.

**How to apply:** any modal/detail view opened from a list that can be mutated while
open should re-derive from the live cache by id. In `PostModal`, also resync derived
form state (e.g. `fPublished` from `postProp.published`) when NOT editing, so it
tracks server truth without clobbering active edits. Server PUT
(`/api/blog-posts/:id`) only updates provided fields, so a publish-only toggle never
touches `content` — content loss symptoms are client stale-state, not persistence.
