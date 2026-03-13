---
phase: 03-public-frontend-integrations
plan: 02
subsystem: ui
tags: [tailwind, postcss, middleware, next-font, subdomain-routing, tenant-resolution]

# Dependency graph
requires:
  - phase: 01-multi-tenant-foundation
    provides: Tenants collection with slug/domain/status fields
  - phase: 02-content-collections-tenant-config
    provides: SiteSettings, Posts, Pages, Media collections with tenant scoping
provides:
  - Subdomain-based tenant resolution middleware (x-tenant-slug header)
  - Tailwind CSS v4 with CSS-first @theme tokens and dynamic primaryColor
  - Frontend layout with Google fonts and tenant-aware metadata
  - Data-fetching helpers (getTenantBySlug, getSiteSettings, getPublishedPosts, getPostBySlug, getPageBySlug)
  - Template key validation (classic/modern/bold)
  - Newsletter signup API helpers (subscribeToNewsletter, updateSubscriber)
affects: [03-03-templates, 03-04-pages, 03-05-integrations]

# Tech tracking
tech-stack:
  added: [tailwindcss v4, "@tailwindcss/postcss", postcss, next/font/google]
  patterns: [CSS-first Tailwind theming via @theme, subdomain middleware with x-tenant-slug header, overrideAccess for public frontend queries]

key-files:
  created:
    - postcss.config.mjs
    - src/app/globals.css
    - src/middleware.ts
    - src/lib/tenant.ts
    - src/lib/templates.ts
    - src/lib/api.ts
  modified:
    - src/app/(frontend)/layout.tsx
    - package.json

key-decisions:
  - "Tailwind v4 CSS-first config -- no tailwind.config.js, all theming via @theme in globals.css"
  - "Middleware uses process.env.SITE_DOMAIN directly -- Edge Runtime cannot reliably import Zod validation"
  - "lib/tenant.ts created in Task 1 (Rule 3 deviation) -- frontend layout imports require it to compile"

patterns-established:
  - "Subdomain resolution: middleware sets x-tenant-slug, Server Components read via headers()"
  - "Public data fetching: overrideAccess: true with explicit tenant where clauses"
  - "CSS variables: --site-primary set on body wrapper div, consumed by @theme inline tokens"
  - "Font loading: 3 Google fonts via next/font with CSS variable integration"

requirements-completed: [FRONT-01]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 3 Plan 02: Frontend Infrastructure Summary

**Tailwind CSS v4 with CSS-first theming, subdomain middleware for tenant resolution, and lib utilities for data fetching, templates, and newsletter API**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T03:09:22Z
- **Completed:** 2026-03-12T03:13:17Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- Tailwind CSS v4 installed with PostCSS and CSS-first @theme tokens including template palettes (classic/modern/bold) and dynamic primaryColor via CSS variables
- Next.js middleware resolves subdomains to tenants for both localhost and production, excludes admin/API routes
- Frontend layout loads 3 Google fonts (Merriweather, Inter, Space Grotesk), resolves tenant, handles archived/missing state, and sets primaryColor CSS variable
- Full data-fetching helper library: getTenantBySlug, getSiteSettings, getPublishedPosts, getPostBySlug, getPageBySlug with overrideAccess and proper depth
- Template key validation and newsletter signup API helpers ready for downstream plans

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Tailwind CSS v4 + PostCSS + globals.css + frontend layout** - `1add4ea` (feat)
2. **Task 2: Middleware + lib utilities (tenant, templates, api)** - `057c807` (feat)

## Files Created/Modified

- `postcss.config.mjs` - PostCSS config with @tailwindcss/postcss plugin (Tailwind v4)
- `src/app/globals.css` - Tailwind imports, template palettes, dynamic primaryColor tokens
- `src/app/(frontend)/layout.tsx` - Frontend layout with fonts, tenant resolution, metadata, primaryColor CSS var
- `src/middleware.ts` - Subdomain extraction and x-tenant-slug header injection
- `src/lib/tenant.ts` - Payload Local API helpers for tenant, settings, posts, pages
- `src/lib/templates.ts` - TemplateKey type and getTemplateKey validation
- `src/lib/api.ts` - subscribeToNewsletter and updateSubscriber helpers for run-api
- `package.json` - Added tailwindcss, @tailwindcss/postcss, postcss dependencies

## Decisions Made

- **Tailwind v4 CSS-first config:** No tailwind.config.js file. All theme configuration lives in globals.css via @theme blocks. This is the Tailwind v4 canonical pattern.
- **Edge-safe middleware:** Middleware uses `process.env.SITE_DOMAIN` directly instead of importing env.ts, because Edge Runtime may not support Zod parse. Simple fallback for localhost dev.
- **lib/tenant.ts in Task 1:** Created full implementation during Task 1 (instead of Task 2) because the frontend layout imports from it. This is a Rule 3 deviation -- the import dependency makes it blocking.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created lib/tenant.ts during Task 1 instead of Task 2**
- **Found during:** Task 1 (Frontend layout implementation)
- **Issue:** Layout imports getTenantBySlug and getSiteSettings from @/lib/tenant, which doesn't exist yet (planned for Task 2)
- **Fix:** Created full lib/tenant.ts implementation during Task 1 to resolve the import
- **Files modified:** src/lib/tenant.ts
- **Verification:** TypeScript compiles clean for all new files
- **Committed in:** 1add4ea (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Moved one file creation earlier due to import dependency. No scope change -- same code was planned, just reordered.

## Issues Encountered

- Pre-existing TypeScript errors in scripts/smoke-test.ts, src/tests/phase2-smoke.ts, and src/app/(payload)/admin/not-found.tsx are unrelated to this plan's changes and were not addressed (out of scope).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Frontend infrastructure is complete: Tailwind, middleware, data helpers, template registry
- Plan 03 (template components) can now build on these foundations
- All lib utilities export stable interfaces for downstream consumption
- CSS variables and font loading are wired and ready for template styling

## Self-Check: PASSED

All 7 created files verified on disk. Both task commits (1add4ea, 057c807) verified in git log.

---
*Phase: 03-public-frontend-integrations*
*Completed: 2026-03-12*
