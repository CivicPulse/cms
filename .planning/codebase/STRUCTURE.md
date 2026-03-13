# Codebase Structure

**Analysis Date:** 2026-03-11

## Directory Layout

```
project-root/
├── src/
│   ├── app/
│   │   ├── (frontend)/
│   │   │   ├── page.tsx                # Homepage
│   │   │   └── layout.tsx              # Root HTML layout
│   │   └── (payload)/
│   │       ├── api/
│   │       │   └── [..slug]/
│   │       │       └── route.ts        # REST API catch-all handler
│   │       ├── admin/
│   │       │   └── [[...segments]]/
│   │       │       ├── page.tsx        # Admin panel root
│   │       │       ├── not-found.tsx   # Admin 404 page
│   │       │       └── importMap.js    # Payload editor import registry
│   │       └── layout.tsx              # Payload route group layout
│   ├── collections/
│   │   ├── Users.ts                    # User/admin collection schema
│   │   └── Posts.ts                    # Post collection schema
│   ├── payload.config.ts               # Central Payload configuration
│   └── payload-types.ts                # Generated type defs (build artifact)
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # TypeScript configuration
├── next.config.mjs                     # Next.js config (wraps Payload)
├── .env.example                        # Environment variable template
└── .gitignore                          # Git ignore rules (includes cms.db)
```

## Directory Purposes

**`src/`:**
- Purpose: All application source code
- Contains: Collections, configuration, pages, layouts, routes
- Key files: `payload.config.ts`, `collections/*.ts`

**`src/app/`:**
- Purpose: Next.js App Router directory
- Contains: All routes and pages organized via route groups
- Key files: Entry points for both frontend and Payload

**`src/app/(frontend)/`:**
- Purpose: Public-facing pages and layouts
- Contains: Customer-facing routes, pages, and styles
- Key files: `page.tsx` (homepage), `layout.tsx` (root layout)

**`src/app/(payload)/`:**
- Purpose: CMS admin and REST API routes
- Contains: Admin panel routing, API endpoint routing
- Key files: Anything under `api/` or `admin/` handles requests

**`src/app/(payload)/admin/`:**
- Purpose: Serve Payload's React admin dashboard
- Contains: Page component that renders Payload's admin UI
- Key files: `page.tsx` (delegates to Payload RootPage), `importMap.js` (Lexical editor config)

**`src/app/(payload)/api/`:**
- Purpose: REST API entry point for content management
- Contains: Catch-all route handler that delegates to Payload
- Key files: `route.ts` (exports GET, POST, PUT, PATCH, DELETE, OPTIONS)

**`src/collections/`:**
- Purpose: Content type (collection) definitions
- Contains: `CollectionConfig` exports defining schema and admin UI behavior
- Key files: `Users.ts` (admin users), `Posts.ts` (content posts)

## Key File Locations

**Entry Points:**

- `src/app/(frontend)/page.tsx`: Homepage — visited at `/`. Renders welcome message with admin link.
- `src/app/(payload)/admin/[[...segments]]/page.tsx`: Admin panel — visited at `/admin` and `/admin/*`. Delegates to Payload's RootPage.
- `src/app/(payload)/api/[...slug]/route.ts`: REST API — handles `/api/*` requests. Exports HTTP verb handlers for CRUD operations.

**Configuration:**

- `src/payload.config.ts`: Central Payload configuration. Registers collections, sets database path, configures editor, sets secrets.
- `next.config.mjs`: Next.js configuration. Wraps with `withPayload()` to enable Payload integration.
- `tsconfig.json`: TypeScript configuration. Enables path aliases and strict typing.
- `.env.example`: Template for environment variables. Copy to `.env.local` and fill in `PAYLOAD_SECRET`.

**Core Logic:**

- `src/collections/Users.ts`: Defines the users collection (CMS admins). Has `auth: true` to enable authentication.
- `src/collections/Posts.ts`: Defines the posts collection (content). Has title and richText fields.

**Testing:**

- Not configured. No test runner present.

## Naming Conventions

**Files:**

- `PascalCase` for React components: `HomePage.tsx`, `RootLayout.tsx` (not observed in current code; use `page.tsx` and `layout.tsx` per Next.js convention)
- `camelCase.ts` for collections and config: `payload.config.ts`, `Users.ts`, `Posts.ts`
- Route group folders use parentheses: `(frontend)`, `(payload)`
- Dynamic route segments use brackets: `[...slug]`, `[[...segments]]`

**Directories:**

- Plural nouns for directories containing multiple items: `collections/`, `app/`
- Lowercase with hyphens for route groups: `(frontend)`, `(payload)`
- No trailing slashes in path references

**Types:**

- Collection slugs: lowercase with no spaces (`users`, `posts`)
- Field names: camelCase (`useAsTitle`, `richText`)

## Where to Add New Code

**New Collection (Content Type):**

1. Create file in `src/collections/YourCollection.ts`
2. Export `CollectionConfig` object with slug, fields, admin settings
3. Import and register in `collections` array in `src/payload.config.ts`
4. Rebuild with `npm run build` to regenerate `payload-types.ts`

**New Frontend Page:**

1. Create folder and file at `src/app/(frontend)/your-route/page.tsx`
2. Export default React component
3. No need to register — Next.js routing is automatic

**New API Endpoint (Custom Payload Hooks):**

- Extend collection definitions with `hooks` property (e.g., `beforeValidate`, `afterChange`)
- Or add middleware/hooks directly in collection config
- Example: Add Stripe webhooks in a collection hook

**Utilities and Helpers:**

- Create `src/lib/` directory (not yet present)
- Export utility functions: `src/lib/api.ts`, `src/lib/helpers.ts`
- Import with absolute paths: `import { helper } from '@/lib/helpers'`

**Components (if needed):**

- Create `src/components/` directory (not yet present)
- Structure by feature: `src/components/ui/`, `src/components/posts/`
- Use PascalCase filenames: `PostCard.tsx`, `Button.tsx`

## Special Directories

**`src/payload-types.ts`:**
- Purpose: Generated TypeScript types from Payload collections
- Generated: Yes, auto-created at build time (`npm run build`)
- Committed: Project decision; currently gitignored (see `.gitignore`)
- Usage: Import types in frontend code: `import type { Post } from '@/payload-types'`

**`cms.db`:**
- Purpose: SQLite database file storing all content and users
- Generated: Yes, auto-created on first run
- Committed: No (in `.gitignore`)
- Reset: Delete file and restart dev server to start fresh

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes, created during build
- Committed: No (in `.gitignore`)
- Clean: Delete if build is corrupted

**`node_modules/`:**
- Purpose: Installed dependencies
- Generated: Yes, from `npm install`
- Committed: No (in `.gitignore`)

**`.env.local`:**
- Purpose: Local environment variables (secrets, config)
- Must exist: Yes, before running `npm run dev`
- Committed: No (in `.gitignore`)
- Create: Copy `.env.example` and fill in `PAYLOAD_SECRET`

---

*Structure analysis: 2026-03-11*
