# Architecture

**Analysis Date:** 2026-03-11

## Pattern Overview

**Overall:** Embedded Headless CMS + Frontend Monolith

This is a unified application architecture where PayloadCMS v3 is embedded directly into a Next.js 15 application. Both the CMS admin panel and public frontend share a single process, port, and runtime environment — there is no separate backend server.

**Key Characteristics:**
- Single process: Next.js dev/build commands run both frontend and Payload simultaneously
- Shared database: SQLite (`cms.db`) stores all collection and user data
- Route-based separation: Next.js route groups `(frontend)` and `(payload)` logically isolate concerns while sharing infrastructure
- Configuration-driven: Central Payload config file drives both schema (collections) and CMS behavior
- Type-safe: TypeScript with generated `payload-types.ts` from Payload schema at build time

## Layers

**Configuration Layer:**
- Purpose: Define data model, admin UI behavior, and CMS settings
- Location: `src/payload.config.ts`
- Contains: Database adapter, editor configuration, collection registry, secrets
- Depends on: Collection definitions (`src/collections/`), database adapter
- Used by: Build process and Payload runtime to wire entire CMS

**Collection Definitions:**
- Purpose: Define schema and admin UI for each data type
- Location: `src/collections/` (e.g., `Users.ts`, `Posts.ts`)
- Contains: Field definitions, admin UI labels, authentication flags, field validation
- Depends on: Payload's `CollectionConfig` type
- Used by: Payload config to register with CMS, REST API to validate/serialize

**API Route Layer:**
- Purpose: Expose Payload REST endpoints through Next.js routing
- Location: `src/app/(payload)/api/[...slug]/route.ts`
- Contains: HTTP verb handlers (GET, POST, DELETE, PATCH, PUT, OPTIONS)
- Depends on: Payload REST route handlers, config
- Used by: Admin panel client-side requests, external API consumers

**Admin UI Route Layer:**
- Purpose: Render and serve Payload's React admin panel
- Location: `src/app/(payload)/admin/[[...segments]]/page.tsx`
- Contains: Root page component that delegates to Payload's `RootPage` component
- Depends on: Config, importMap, Payload's `@payloadcms/next/views`
- Used by: Browser navigation to `/admin` path

**Frontend Route Layer:**
- Purpose: Public-facing pages and layouts
- Location: `src/app/(frontend)/`
- Contains: Marketing pages, layouts, metadata
- Depends on: Nothing CMS-specific (can fetch API if needed)
- Used by: End users visiting the site

**Payload Layout:**
- Purpose: Wrapper for Payload-routed content
- Location: `src/app/(payload)/layout.tsx`
- Contains: Minimal passthrough (children rendered as-is)
- Depends on: Nothing
- Used by: Payload admin and API routes

**Frontend Layout:**
- Purpose: Root layout for public pages
- Location: `src/app/(frontend)/layout.tsx`
- Contains: HTML structure, metadata, global styles
- Depends on: Nothing
- Used by: All frontend pages

## Data Flow

**Admin User Creation & Authentication:**

1. First visit to `http://localhost:3000/admin`
2. Payload detects no users in `users` collection
3. Admin setup prompt appears (built into Payload UI)
4. User creates admin account
5. Credentials stored in SQLite `cms.db` via `users` collection with `auth: true`

**Content Creation:**

1. Admin creates post via `/admin/posts` form
2. Form submits POST to `/api/posts`
3. Next.js route handler at `src/app/(payload)/api/[...slug]/route.ts` receives request
4. Handler delegates to Payload's `REST_POST` handler
5. Payload validates against `Posts` collection schema
6. Data inserted into SQLite
7. Response returns created post JSON with ID

**Frontend Data Access:**

1. Frontend page (e.g., `src/app/(frontend)/page.tsx`) can fetch via API
2. Client-side: `fetch('/api/posts')` retrieves published posts
3. Server-side: Use Payload SDK directly in Server Components if needed
4. Data flows through standard REST API established by catch-all route

**State Management:**

- Form state: Payload admin manages internally with React state and form libraries
- Content state: Persisted exclusively in SQLite database
- Session state: Payload uses cookie-based authentication (configured in `payload.config.ts`)
- No external state management (Redux, Zustand, etc.) currently in place

## Key Abstractions

**CollectionConfig:**
- Purpose: Defines a content type (schema, fields, admin behavior)
- Examples: `src/collections/Posts.ts`, `src/collections/Users.ts`
- Pattern: Export const object typed as `CollectionConfig`, register in main config

**Route Handlers via withPayload:**
- Purpose: Inject Payload request handling into Next.js route system
- Examples: REST handlers in `src/app/(payload)/api/[...slug]/route.ts`, Admin page in `src/app/(payload)/admin/[[...segments]]/page.tsx`
- Pattern: Import REST handler factories from `@payloadcms/next/routes`, wrap config, export as named HTTP verbs

**Virtual Module Alias:**
- Purpose: Allow importing Payload config via `@payload-config` without relative paths
- Implementation: `withPayload()` wraps Next config to enable this alias
- Usage: `import config from '@payload-config'` in route and page files

## Entry Points

**Development Server:**
- Command: `npm run dev`
- Invokes: `next dev`
- Starts: Single process running Next.js with embedded Payload
- Accessible at: `http://localhost:3000`

**Frontend Homepage:**
- Location: `src/app/(frontend)/page.tsx`
- Triggers: Visiting `http://localhost:3000` or `/`
- Responsibilities: Render landing page, provide link to admin panel

**Admin Root:**
- Location: `src/app/(payload)/admin/[[...segments]]/page.tsx`
- Triggers: Visiting `http://localhost:3000/admin` or any `/admin/*` path
- Responsibilities: Render Payload admin UI, handle navigation within admin panel

**API Catch-All:**
- Location: `src/app/(payload)/api/[...slug]/route.ts`
- Triggers: Any request to `/api/*`
- Responsibilities: Route to correct Payload REST handler (POST /api/posts → create post, etc.)

**Build Entry:**
- Command: `npm run build`
- Invokes: `next build`
- Responsibilities: Compile Next.js + Payload, generate `src/payload-types.ts` from collections

## Error Handling

**Strategy:** Implicit delegation to Payload and Next.js defaults

**Patterns:**

- **API Errors:** Payload REST handlers catch validation errors and return appropriate HTTP status codes (400 for bad input, 401 for auth, 500 for server errors)
- **Page Not Found:** Catch-all routes return 404 via Next.js built-in handling
- **Admin UI Errors:** Payload's UI catches form validation errors and displays them inline
- **Admin Panel Routing:** `src/app/(payload)/admin/[[...segments]]/not-found.tsx` handles undefined admin routes (unlikely needed, but available as safety net)

No global error boundaries or custom error middleware are currently in place — relying on framework defaults.

## Cross-Cutting Concerns

**Logging:**

Not explicitly configured. Uses JavaScript `console` methods if needed; Payload and Next.js emit their own logs to stdout.

**Validation:**

Enforced entirely at the Payload collection level via field definitions (e.g., `required: true` on Posts.title). Client-side validation occurs in Payload's admin form UI. Server-side validation happens in Payload's REST handler before data is persisted.

**Authentication:**

Delegated to Payload's built-in `auth: true` flag on the Users collection. Users collection acts as the auth provider for the admin panel. Session managed via cookies set by Payload; no external identity provider configured.

**Environment Configuration:**

Secrets like `PAYLOAD_SECRET` come from `.env.local` (see `src/payload.config.ts` line 19). Each environment (dev, prod) should have its own `.env.local` with unique secret.

---

*Architecture analysis: 2026-03-11*
