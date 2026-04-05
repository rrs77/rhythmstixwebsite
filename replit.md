# Overview

This project is a pnpm workspace monorepo using TypeScript, designed to build a comprehensive music education platform named Rhythmstix. It includes an Express API server, a React frontend, and shared libraries. The platform aims to dynamically integrate content from an existing WordPress site, manage e-commerce functionalities via WooCommerce, and provide user authentication with account management.

The business vision is to modernize and expand Rhythmstix's online presence, offering a robust and engaging educational resource for music. The project seeks to streamline content delivery, enhance user interaction, and provide a scalable foundation for future features, ultimately increasing user engagement and market reach for Rhythmstix's educational offerings.

# User Preferences

I want to follow an iterative development approach. Please ask before making any major architectural changes or introducing new external dependencies. I prefer clear, concise explanations and well-documented code.

# System Architecture

The project is structured as a pnpm workspace monorepo.

**Technology Stack:**
- **Monorepo:** pnpm workspaces
- **Backend:** Node.js 24, Express 5, PostgreSQL, Drizzle ORM, Zod for validation, Orval for API codegen, JWT for authentication.
- **Frontend:** React 19, Vite, wouter for routing, `@tanstack/react-query` for data management, Tailwind CSS, shadcn/ui, Framer Motion.
- **Build:** esbuild for backend, Vite for frontend.
- **Deployment:** Vercel-compatible (serverless API + static frontend).

**Monorepo Structure:**
- `artifacts/`: Contains deployable applications (`api-server`, `rhythmstix-web`).
- `lib/`: Houses shared libraries (`api-spec`, `api-client-react`, `api-zod`, `db`).
- `scripts/`: Utility scripts.

**TypeScript & Composite Projects:**
The monorepo leverages TypeScript's composite projects for efficient type-checking and dependency management across packages. `tsconfig.base.json` configures shared settings, and the root `tsconfig.json` references all packages.

**API Server (`artifacts/api-server`):**
An Express 5 server handling all API requests.
- **Routing:** Organized in `src/routes/`.
- **Validation:** Uses `@workspace/api-zod` for request/response validation.
- **Persistence:** Interacts with PostgreSQL via `@workspace/db`.
- **Authentication:** JWT tokens stored in httpOnly cookies.
- **Shop API:** Proxies WooCommerce product data, including an in-memory cache.
- **Content Management:** Provides API endpoints for inline CMS functionality, allowing admin users to edit site content.

**Frontend (`artifacts/rhythmstix-web`):**
A React application for the Rhythmstix platform.
- **UI/UX:** Teal color scheme (`#3a9ca5`) matching the Rhythmstix brand. Utilizes Tailwind CSS and shadcn/ui components for a modern, responsive design. Framer Motion is used for animations.
- **Content Integration:** Dynamically pulls content from `www.rhythmstix.co.uk` via the WordPress REST API.
- **Key Pages:**
    - **Homepage:** Features hero section, product grid, and testimonials.
    - **Shop:** Displays curated product families from WooCommerce with inline product details and "Add to Basket" functionality.
    - **Blog:** Aggregates content from WordPress, YouTube, and LinkedIn, with filtering and individual post views.
    - **Product Pages:** Dedicated pages for various Rhythmstix applications (e.g., Assessify, CCDesigner) using a shared `ProductPage` component.
    - **User Account:** Login, registration, password reset, and account dashboard with order history and Mailchimp subscription management.
- **Inline CMS:** `EditableText` and `EditableList` components allow administrators to edit content directly on the frontend.
- **User Authentication:** Integrates with WordPress's `wp-login.php` for user authentication, creating WooCommerce customers on registration.

**Database Layer (`lib/db`):**
Uses Drizzle ORM with PostgreSQL for all data persistence. Exports a Drizzle client instance and schema models.

**API Specifications & Generation (`lib/api-spec`, `lib/api-zod`, `lib/api-client-react`):**
- **OpenAPI 3.1 Spec:** Defined in `openapi.yaml`.
- **Codegen:** Orval generates Zod schemas (`lib/api-zod`) for validation and React Query hooks (`lib/api-client-react`) for API interaction from the OpenAPI spec.

**Deployment:**
Configured for Vercel deployment with `vercel.json` managing build and routing. The frontend builds from `artifacts/rhythmstix-web`, and API routes are served as a single Vercel serverless function.

# External Dependencies

- **Database:** PostgreSQL (e.g., Neon, Supabase)
- **Content Management System:** WordPress REST API (`www.rhythmstix.co.uk`)
- **E-commerce:** WooCommerce REST API
- **Email Marketing:** Mailchimp Marketing API
- **Authentication:** JWT (jsonwebtoken)
- **Node.js:** Node.js 24
- **Package Manager:** pnpm
- **API Framework:** Express 5
- **ORM:** Drizzle ORM
- **Validation:** Zod (`zod/v4`), `drizzle-zod`
- **API Codegen:** Orval
- **Frontend Framework:** React 19
- **Build Tools:** Vite, esbuild
- **UI Libraries:** Tailwind CSS, shadcn/ui, Framer Motion
- **Data Fetching/State Management:** `@tanstack/react-query`
- **Routing:** wouter
- **Deployment Platform:** Vercel