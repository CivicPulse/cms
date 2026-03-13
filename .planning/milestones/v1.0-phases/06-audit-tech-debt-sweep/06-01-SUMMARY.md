---
phase: 06-audit-tech-debt-sweep
plan: 01
subsystem: api, ui, infra
tags: [env-validation, dead-code, middleware, zod, nextjs]

# Dependency graph
requires:
  - phase: 05-tech-debt-cleanup
    provides: server actions wrapping api.ts, env.ts validation pattern
provides:
  - "Zero dead code paths in api.ts, templates.ts, middleware.ts, blog page"
  - "Consistent validated env usage across all server-side application code"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All src/lib/ and src/app/ server code imports env from @/env (not process.env)"
    - "Edge Runtime (middleware) uses process.env with explanatory comment"

key-files:
  created: []
  modified:
    - src/lib/api.ts
    - src/lib/templates.ts
    - src/middleware.ts
    - src/app/(frontend)/blog/[slug]/page.tsx

key-decisions:
  - "Module-level baseUrl in api.ts -- env.ts Zod validation guarantees value at startup, removing need for per-function guards"
  - "Blog page uses env.SITE_DOMAIN without ternary fallback -- Zod .min(1) ensures non-empty"

patterns-established:
  - "Validated env import: import { env } from '@/env' for all server-side code outside Edge Runtime and Payload hooks"

requirements-completed: []

# Metrics
duration: 6min
completed: 2026-03-12
---

# Phase 06 Plan 01: Audit Tech Debt Sweep Summary

**Removed 5 tech debt items: dead getBaseUrl/getTemplateKey/VALID_KEYS code, deduplicated middleware condition, and switched blog page to validated env object**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-12T21:36:27Z
- **Completed:** 2026-03-12T21:42:28Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Eliminated dead code from api.ts (getBaseUrl function, NEXT_PUBLIC fallback, unreachable guards) and templates.ts (getTemplateKey, VALID_KEYS)
- Deduplicated identical host.endsWith('.localhost') condition in middleware with Edge Runtime explanatory comment
- Switched blog post page from raw process.env.SITE_DOMAIN to validated env.SITE_DOMAIN import, removing ternary fallback
- npm run build passes with zero errors; all 5 audit items verified via grep checks

## Task Commits

Each task was committed atomically:

1. **Task 1: Clean up library utilities (api.ts + templates.ts)** - `22cde5d` (fix)
2. **Task 2: Fix middleware dedup + blog page env read + build verification** - `e23aea6` (fix)

## Files Created/Modified
- `src/lib/api.ts` - Server-side API helpers now use validated env import and module-level baseUrl constant
- `src/lib/templates.ts` - Template registry with dead getTemplateKey/VALID_KEYS removed
- `src/middleware.ts` - Subdomain extraction with deduplicated localhost check and Edge Runtime comment
- `src/app/(frontend)/blog/[slug]/page.tsx` - Blog post page using validated env for share URL

## Decisions Made
- Module-level `const baseUrl = env.RUN_API_BASE_URL.replace(/\/$/, '')` shared by both api.ts functions -- Zod validation guarantees the value exists at startup, so per-function guards are unreachable dead code
- Blog page share URL simplified to always use absolute URL (`https://${tenantSlug}.${env.SITE_DOMAIN}/blog/${post.slug}`) -- env.ts validates SITE_DOMAIN with .min(1) so ternary fallback was unnecessary

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 v1.0 milestone audit items resolved
- Zero known dead code paths or pattern inconsistencies remain
- Codebase is clean for v1.0 shipping

## Self-Check: PASSED

- All 4 modified files exist on disk
- Commit 22cde5d found (Task 1)
- Commit e23aea6 found (Task 2)

---
*Phase: 06-audit-tech-debt-sweep*
*Completed: 2026-03-12*
