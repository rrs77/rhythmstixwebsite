# Deploying Rhythmstix to Vercel

This project deploys to Vercel as a single project that serves both the
React frontend and the Express API as one serverless function.

## 1. Vercel project settings

When you connect the repo on Vercel:

| Setting | Value |
| --- | --- |
| **Framework Preset** | Other (let `vercel.json` decide) |
| **Root Directory** | `./` (the **repo root**, not `artifacts/rhythmstix-web`) |
| **Build Command** | _leave blank_ — `vercel.json` provides it |
| **Output Directory** | _leave blank_ — `vercel.json` provides it |
| **Install Command** | _leave blank_ — `vercel.json` provides it |
| **Node.js Version** | 22.x or later |

Root Directory **must** be the repo root because the API serverless function
lives at `api/index.ts` at the top level of the monorepo. Setting it to
`artifacts/rhythmstix-web` will result in a working frontend with every
`/api/*` call returning 404.

## 2. Environment variables

Open **Settings → Environment Variables** and add each one from
[`.env.example`](./.env.example). Mark them as available for **Production**,
**Preview**, and **Development** unless you have a specific reason not to.

The minimum to get a working deploy is:

- `DATABASE_URL`
- `SESSION_SECRET`
- `ADMIN_PASSWORD`
- `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`

Add these next, in this order, to unlock features:

- `BLOB_READ_WRITE_TOKEN` — enable image uploads (logo, EditableImage)
- `MAILCHIMP_API_KEY` + `MAILCHIMP_LIST_ID` — enable newsletter signups

## 3. Vercel Blob (image uploads)

1. Vercel dashboard → your project → **Storage** tab → **Create Database**
   → choose **Blob**.
2. Name it (e.g. `rhythmstix-media`) and click **Create & Connect**.
3. Vercel will automatically inject `BLOB_READ_WRITE_TOKEN` into the project
   — you don't need to copy it manually.
4. Redeploy so the new env var takes effect.

## 4. Custom domain

1. **Settings → Domains → Add** → enter `rhythmstix.co.uk` (and `www.`).
2. Vercel will show DNS records to add at your registrar:
   - Apex: an `A` record pointing to `76.76.21.21`
   - `www`: a `CNAME` to `cname.vercel-dns.com`
3. Wait for DNS to propagate (usually < 1 hour). TLS is automatic.

## 5. Post-deploy admin checklist

Once the site is live, log in to `/admin` with `ADMIN_PASSWORD` and:

- [ ] **Theme & Design tab** — set primary / accent colours, corner radius,
      heading weight.
- [ ] **Hero / Login / Register pages** — hover the wordmark and click
      Upload to drop in your logo (one upload, all three places update).
- [ ] **Site Copy tab** — review every editable string.
- [ ] **Apps tab** — confirm the homepage app cards.
- [ ] **Pages tab** — publish any custom pages you want at launch.
- [ ] **Navigation & Footer tab** — confirm menus.
- [ ] **Settings tab** — set social URLs (LinkedIn, YouTube, Facebook).

## 6. Verifying the deploy

```bash
# Replace with your real domain
curl https://rhythmstix.co.uk/api/healthz
# → {"ok":true}

curl https://rhythmstix.co.uk/api/content
# → {} or your saved content keys

curl -X POST https://rhythmstix.co.uk/api/uploads/image
# → 401 (expected — admin-gated)
```

If `/api/healthz` returns 404, check that **Root Directory** in Vercel is
the repo root (not `artifacts/rhythmstix-web`).

If `/api/healthz` returns 500, check the function logs in Vercel —
usually means `DATABASE_URL` or `SESSION_SECRET` is missing.

## 7. Local development still uses Replit

Nothing about this Vercel setup changes how Replit dev works. The same
`api/index.ts` glue file is only loaded by Vercel; locally, the API is run
directly via `pnpm --filter @workspace/api-server run dev` as before.
