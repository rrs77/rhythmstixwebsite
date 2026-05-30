---
name: Dev vs prod databases (Neon) and flaky HTTP reads
description: This project has separate dev and prod Neon databases; how to identify each and the authoritative source of truth for app/testimonial data.
---

# Dev and prod are SEPARATE Neon databases

- `DATABASE_URL` = the **development** database (what the running dev api-server connects to). Has the curated apps + testimonials.
- `NEON_DATABASE_URL` = the **production** database used by the live Vercel site. It carries the real imported blog content (dozens of `blog_posts`) but was NOT seeded with `apps` or `testimonials`.

**Why this matters:** content created/seeded in dev does NOT appear on the live site unless it is also written into the `NEON_DATABASE_URL` database. Symptom seen: live home page rendered blog posts fine but showed empty "Apps" and "Testimonials" sections because those tables were empty in prod.

**How to apply:** to make dynamic content (apps, testimonials, etc.) show on the live site, copy the rows from the dev DB into `NEON_DATABASE_URL`. Production schema migrations still go through the normal deploy flow; this is about *data*, not schema.

# The `@neondatabase/serverless` HTTP driver gives flaky/stale reads here

Reading the dev DB directly with `neon(process.env.DATABASE_URL)` (HTTP driver) intermittently returned **wrong `published` flags** (e.g. all `apps.published = false`) even though the data was correct. The running server (which uses the WebSocket `Pool`) and its API are consistent.

**Rule:** treat the running api-server's API as the source of truth for dev data, not ad-hoc `neon()` HTTP reads. Use admin endpoints `GET /api/apps/all` and `GET /api/testimonials/all` (require `ADMIN_PASSWORD` via `POST /api/auth/admin-login`) to get authoritative rows including unpublished ones and correct `published` flags, then write those into prod.

**Why:** a first pass that sourced `published` from a direct `neon()` read seeded prod with everything unpublished, so the home page still showed nothing until re-synced from the API.
