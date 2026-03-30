# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas
- `src/schema/forum.ts` — forum_categories, forum_topics, forum_replies tables
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `artifacts/rhythmstix-web` (`@workspace/rhythmstix-web`)

React + Vite frontend for the Rhythmstix music education platform. Dynamically pulls content from the existing WordPress site at `www.rhythmstix.co.uk` via the WP REST API.

- **Framework**: React 19 + Vite + TypeScript
- **Routing**: wouter (client-side routing)
- **State/Data**: @tanstack/react-query for WP API caching
- **UI**: Tailwind CSS + shadcn/ui components + Framer Motion animations
- **WordPress API**: `https://www.rhythmstix.co.uk/wp-json/wp/v2/` (must use `www.` subdomain)
- **Theme**: Teal colour scheme matching logo (`#3a9ca5` primary, `#4cb5bd` lighter, `#2d8890` darker)

#### Key Files
- `src/lib/wordpress.ts` — WP REST API client (pages, posts, media)
- `src/hooks/use-wp.ts` — React Query hooks for WP data
- `src/pages/Home.tsx` — Homepage with hero, product grid, testimonials
- `src/pages/WPPage.tsx` — Generic WordPress page renderer (route: `/page/:slug`)
- `src/pages/BlogList.tsx` — Blog listing from WP posts (route: `/blog`)
- `src/pages/BlogPost.tsx` — Individual blog post (route: `/post/:slug`)
- `src/components/layout/Navbar.tsx` — Navigation with internal links
- `src/components/layout/Footer.tsx` — Footer with contact info and links
- `src/components/home/ProductGrid.tsx` — Product cards (CCDesigner, PeriFeedback, ProgressPath, E-Learning)

#### WordPress Page Slugs
about, assessify, periplanner, blog, community, contact-us, learning-platform, shop, policy, cookies

#### Shop
- `src/pages/Shop.tsx` — Shop page pulling products from WooCommerce
- `src/hooks/use-shop.ts` — React Query hooks for WooCommerce products/categories
- Products fetched via API server proxy at `/api/shop/products` and `/api/shop/categories`
- WooCommerce API keys stored as secrets: `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`
- Product cards link to WordPress shop pages for actual purchasing
- Category filtering supported

#### Logos
- `public/images/rhythmstix-logo-colour.png` — Colour logo (hero, light backgrounds)
- `public/images/rhythmstix-logo-new.png` — New logo with updated branding
- `public/images/rhythmstix-logo-white.png` — White logo (dark backgrounds)
- Navbar/footer use text-only "rhythmstix" wordmark (no monogram box)

#### User Authentication & Account
- `src/hooks/use-auth.ts` — Auth hooks (useAuth, useOrders, forgotPassword)
- `src/pages/Login.tsx` — Login page (`/login`) authenticates via WordPress wp-login.php
- `src/pages/ForgotPassword.tsx` — Password reset (`/forgot-password`) triggers WordPress reset email
- `src/pages/Account.tsx` — Account dashboard (`/account`) with expandable order history from WooCommerce
- Navbar dynamically shows "Login" or user's first name + "Account" based on auth state
- Backend: `api-server/src/routes/auth.ts` — `/auth/login`, `/auth/logout`, `/auth/me`, `/auth/forgot-password`, `/account/orders`, `/account/orders/:id`
- Authentication flow: email → WooCommerce customer lookup → WordPress wp-login.php validation → session creation
- WooCommerce API uses Basic Auth headers (not query string credentials)
- CORS restricted to trusted Replit origins only; cookies use sameSite: "lax"

#### Product Pages
Each app has a dedicated page using the shared `ProductPage` component (`src/pages/ProductPage.tsx`):
- `src/pages/Assessify.tsx` — `/assessify`
- `src/pages/CCDesigner.tsx` — `/ccdesigner`
- `src/pages/PeriFeedback.tsx` — `/perifeedback`
- `src/pages/ProgressPath.tsx` — `/progresspath`
- `src/pages/RhythmstixApp.tsx` — `/rhythmstix-app`
- `src/pages/ELearning.tsx` — `/elearning`
- No external product URLs — all CTAs link to `/contact`

Each page includes: hero image placeholder, description text, key features grid, pros/considerations, and CTA section.

#### Routes
- `/` — Homepage (Hero, ProductGrid, Testimonials)
- `/assessify` — Assessify product page
- `/ccdesigner` — CCDesigner product page
- `/perifeedback` — PeriFeedback product page
- `/progresspath` — ProgressPath product page
- `/rhythmstix-app` — Rhythmstix App product page
- `/elearning` — E-Learning product page
- `/shop` — Shop page (WooCommerce products, "Assessify Plan" filtered out)
- `/resources` — Resources page
- `/community` — Community forum (categories → topics → replies; admin can manage)
- `/contact` — Contact Us page with form
- `/login` — User login (WordPress authentication)
- `/forgot-password` — Password reset request
- `/account` — User account dashboard (orders, invoices) — requires login
- `/cookies` — Cookie policy
- `/blog` — Blog listing
- `/post/:slug` — Individual blog post
- `/page/:slug` — WordPress page renderer

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.
