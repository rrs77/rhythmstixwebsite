# Rhythmstix

A music education platform offering dynamic content, e-commerce, and user management, integrating with WordPress and WooCommerce.

## Run & Operate

To run the application locally, ensure you have `pnpm` installed and set the required environment variables.

- **Install dependencies:** `pnpm install`
- **Build:** `pnpm run build`
- **Typecheck:** `pnpm run typecheck`
- **Codegen (API client/schemas):** `pnpm run generate:api`
- **Database Migrations/Push:** `pnpm run db:push` (for schema changes), `pnpm run db:migrate` (for data migrations)
- **Run Development Server:** `pnpm run dev`

**Required Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string.
- `SESSION_SECRET` (or `JWT_SECRET`): Secret for session management/JWTs.
- `ADMIN_PASSWORD`: Password for accessing admin functionalities.
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token for image uploads.
- `STRIPE_SECRET_KEY`: Stripe secret key (required for shop checkout).
- `STRIPE_WEBHOOK_SECRET`: (Recommended) Stripe webhook signing secret for `/api/webhooks/stripe`. If unset, the webhook accepts unsigned events in development only and logs a warning.
- `WC_CONSUMER_KEY`, `WC_CONSUMER_SECRET`: WooCommerce API credentials (used only for the product catalog mirror — no longer used for checkout).
- `WC_WEBHOOK_SECRET`: (Optional) Shared secret used to verify incoming WooCommerce product webhooks. Required to enable instant product sync.
- `WP_REST_URL`: (Optional) WordPress REST API URL (defaults to `https://www.rhythmstix.co.uk/wp-json`).
- `MAILCHIMP_API_KEY`, `MAILCHIMP_LIST_ID`: (Optional) Mailchimp API credentials.

## Stack

- **Monorepo:** pnpm workspaces
- **Backend:** Node.js 24, Express 5, PostgreSQL, Drizzle ORM, Zod, Orval, JWT
- **Frontend:** React 19, Vite, wouter, `@tanstack/react-query`, Tailwind CSS, shadcn/ui, Framer Motion
- **Build Tool:** Vite (frontend), esbuild (backend)

## Where things live

- `artifacts/api-server`: Express API server source.
- `artifacts/rhythmstix-web`: React frontend source.
- `lib/api-spec`: OpenAPI 3.1 specification (`openapi.yaml`).
- `lib/api-client-react`: Generated React Query hooks.
- `lib/api-zod`: Generated Zod schemas.
- `lib/db`: Drizzle ORM schema and client.
- `artifacts/api-server/src/routes/pages.ts`: Server-side page content sanitization logic.
- `artifacts/api-server/src/routes/shop.ts`: Stripe Checkout sessions, voucher validation, local order storage, Stripe webhook, admin voucher/order endpoints.
- `lib/db/src/schema/shop.ts`: Drizzle schema for `vouchers`, `orders`, `order_items` (all monetary fields in pence).
- `artifacts/rhythmstix-web/src/components/shop/VoucherInput.tsx`: Basket/Checkout voucher entry component.
- `artifacts/rhythmstix-web/src/pages/CheckoutSuccess.tsx`: Stripe success-page handler.
- `artifacts/rhythmstix-web/src/index.css`: Frontend CSS variables and theme.
- `artifacts/rhythmstix-web/src/contexts/BasketContext.tsx`: Frontend shopping basket state.
- `artifacts/rhythmstix-web/src/components/blog/PostModal.tsx`: Unified blog post modal.

## Architecture decisions

- **Monorepo with TypeScript Composite Projects:** Enables efficient type-checking and dependency management across shared libraries and applications.
- **Vercel-compatible Deployment:** Serverless API via a single Vercel function (`api/index.ts`) and static frontend, with specific optimizations for `drizzle-orm/neon-serverless` and Pino logger.
- **Client-Side API Generation:** Uses Orval to generate Zod schemas and React Query hooks from `openapi.yaml`, ensuring type safety and efficient data fetching.
- **Inline CMS and Theme Customization:** Implemented via `EditableText`, `EditableList`, `EditableImage` components and an admin theme customizer storing values in `siteContentTable` and applying them via CSS custom properties.
- **WooCommerce Proxy for Product Catalog Only:** The API mirrors WooCommerce products into the local `woo_products` table on an interval (and via webhook) so the shop can render even if WooCommerce is unreachable. Pricing and quantity are re-validated server-side from this local cache before checkout.
- **Self-Contained Checkout with Stripe + Local Orders:** Checkout is handled by Stripe Checkout (hosted). Orders and discount vouchers live in our own Postgres tables (`orders`, `order_items`, `vouchers`); WordPress/WooCommerce is no longer the source of truth for orders. The `/api/webhooks/stripe` endpoint marks orders as paid; a synchronous `/api/shop/orders/confirm?session_id=` fallback covers the success page before the webhook fires.

## Product

- **Dynamic Content Integration:** Pulls content from WordPress REST API and local database.
- **E-commerce Functionality:** Integrates with WooCommerce for product display, basket management, and checkout.
- **User Authentication & Account Management:** JWT-based authentication, user registration, login, password reset, and account dashboard with order history and Mailchimp subscription.
- **Admin Content Management:** Features for editing site content, managing pages, blog posts, testimonials, and apps directly from the admin interface.
- **Rich User Interface:** Built with React, Tailwind CSS, shadcn/ui, and Framer Motion for a modern, engaging experience.
- **Aggregated Blog:** Displays content from WordPress, YouTube, LinkedIn, and native blog posts in a unified feed.

## User preferences

I want to follow an iterative development approach. Please ask before making any major architectural changes or introducing new external dependencies. I prefer clear, concise explanations and well-documented code.

## Gotchas

- **Stripe Checkout:** `POST /api/shop/orders` re-prices the basket against the local `woo_products` mirror, optionally applies a voucher (creating a one-time Stripe coupon so the discount appears on the receipt), creates a pending local order, and returns a Stripe Checkout URL. The browser is redirected; the basket is only cleared on the success page after `confirmOrder` succeeds.
- **Stripe Webhook:** `POST /api/webhooks/stripe` listens for `checkout.session.completed` / `checkout.session.async_payment_succeeded|failed` and updates the matching local order. Configure the webhook in the Stripe Dashboard pointing to `https://<your-deployed-domain>/api/webhooks/stripe` and set `STRIPE_WEBHOOK_SECRET` to the signing secret. The success page also calls `GET /api/shop/orders/confirm?session_id=…` as a synchronous fallback in case the webhook hasn't landed yet.
- **Voucher money units:** `vouchers.discountValue` stores a percentage (1-100) when `discountType = 'percentage'` and **pence** when `discountType = 'fixed'`. The admin UI inputs pounds for fixed-amount vouchers and converts before saving.
- **Rich HTML Content:** All rich HTML bodies (e.g., custom pages, blog posts) are sanitized server-side upon saving. Ensure allowed tags/attributes/styles are sufficient.
- **Vercel Blob Token:** Image uploads will 503 without `BLOB_READ_WRITE_TOKEN`.
- **Admin Access:** `/admin` routes are protected by `ADMIN_PASSWORD`.
- **Reserved Slugs:** Custom pages cannot use slugs that conflict with existing application routes.
- **WordPress Bulk Import:** `POST /api/blog-posts/import-wordpress` (admin) paginates `WP_BASE_URL/wp-json/wp/v2/posts`, sanitizes HTML server-side, inserts into `blog_posts`, and adds WP IDs to `hidden_posts` (which doubles as the "already imported" guard so re-runs are idempotent).
- **WooCommerce Product Webhook:** `POST /api/webhooks/woocommerce` accepts WC product events and triggers an immediate `syncWooProducts()` run, so admin edits show up on the site within seconds instead of waiting for the 30-minute interval. To configure:
  1. Set `WC_WEBHOOK_SECRET` to a long random string in the deployed environment.
  2. In WP Admin → WooCommerce → Settings → Advanced → Webhooks, click **Add webhook**.
  3. Status: **Active**. API Version: **WP REST API Integration v3**. Secret: paste the same value you set for `WC_WEBHOOK_SECRET`.
  4. Create one webhook for each product topic: **Product created**, **Product updated**, **Product deleted**, **Product restored** (separate webhooks — WC only allows one topic per webhook).
  5. Delivery URL for each: `https://<your-deployed-domain>/api/webhooks/woocommerce`.
  6. Save. WooCommerce sends a "ping" on save which the endpoint replies 200 to. Subsequent product changes will return 202 with `syncTriggered: true` in the WC delivery log.

## Pointers

- **Drizzle ORM:** [https://orm.drizzle.team/](https://orm.drizzle.team/)
- **Orval:** [https://orval.dev/](https://orval.dev/)
- **React Query:** [https://tanstack.com/query/latest](https://tanstack.com/query/latest)
- **Tailwind CSS:** [https://tailwindcss.com/](https://tailwindcss.com/)
- **shadcn/ui:** [https://ui.shadcn.com/](https://ui.shadcn.com/)
- **Framer Motion:** [https://www.framer.com/motion/](https://www.framer.com/motion/)
- **Vercel Deployment:** [https://vercel.com/docs](https://vercel.com/docs)