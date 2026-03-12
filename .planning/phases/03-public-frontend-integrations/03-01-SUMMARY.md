---
phase: 03-public-frontend-integrations
plan: 01
subsystem: api
tags: [webhook, hmac, payload-hooks, versions, drafts, navigation]

# Dependency graph
requires:
  - phase: 02-content-collections-tenant-config
    provides: Posts collection, SiteSettings collection, Media collection, env.ts validation
provides:
  - Posts collection with versions/drafts lifecycle (_status field)
  - Posts featuredImage upload field (relationTo media)
  - SiteSettings navItems array field for configurable navigation
  - firePostPublishedWebhook afterChange hook with HMAC-SHA256 signing
  - Email-status callback skipWebhook context to prevent infinite loop
  - Three new env vars: RUN_API_WEBHOOK_URL, RUN_API_BASE_URL, SITE_DOMAIN
affects: [03-02, 03-03, 03-04, 03-05, run-api]

# Tech tracking
tech-stack:
  added: []
  patterns: [afterChange webhook hook with HMAC signing, context.skipWebhook guard pattern, fire-and-forget fetch]

key-files:
  created:
    - src/hooks/fireWebhook.ts
  modified:
    - src/collections/Posts.ts
    - src/collections/SiteSettings.ts
    - src/env.ts
    - src/app/(payload)/api/posts/[id]/email-status/route.ts
    - .env.example

key-decisions:
  - "Use process.env.* directly in webhook hook (not env.ts import) since hooks run in Payload context"
  - "Fire-and-forget webhook via fetch().catch() -- does not block CMS response"
  - "Guard on operation type: update requires draft->published transition; create requires direct publish"

patterns-established:
  - "afterChange webhook pattern: guard(skipWebhook) -> guard(status transition) -> guard(publishAs) -> HMAC sign -> fire-and-forget"
  - "context.skipWebhook pattern for preventing hook re-trigger from callback endpoints"

requirements-completed: [HOOK-01, HOOK-02, HOOK-03]

# Metrics
duration: 3min
completed: 2026-03-12
---

# Phase 3 Plan 1: Webhook Pipeline + Schema Enhancements Summary

**HMAC-signed webhook hook for post publish events, draft/publish lifecycle via versions, featuredImage upload, and configurable navItems**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T03:09:12Z
- **Completed:** 2026-03-12T03:12:29Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Posts collection now supports draft/published lifecycle via `versions: { drafts: true }` adding the `_status` field
- Posts have a `featuredImage` upload field for post cards and headers (relationTo media)
- SiteSettings has a `navItems` array field for configurable navigation menu items
- Webhook hook fires HMAC-SHA256 signed POST to run-api on publish transition for email/both posts
- Email-status callback passes `context: { skipWebhook: true }` to prevent infinite webhook loop
- Three new env vars validated: RUN_API_WEBHOOK_URL, RUN_API_BASE_URL, SITE_DOMAIN

## Task Commits

Each task was committed atomically:

1. **Task 1: Schema changes -- Posts versions/drafts + featuredImage, SiteSettings navItems, env vars** - `1a88080` (feat)
2. **Task 2: Webhook hook + email-status context fix** - `e19d3f6` (feat)

## Files Created/Modified
- `src/hooks/fireWebhook.ts` - afterChange hook: HMAC-signed webhook on publish transition for email/both
- `src/collections/Posts.ts` - Added versions/drafts, featuredImage field, registered webhook hook
- `src/collections/SiteSettings.ts` - Added navItems array field with label/url sub-fields
- `src/env.ts` - Added RUN_API_WEBHOOK_URL, RUN_API_BASE_URL, SITE_DOMAIN validation
- `src/app/(payload)/api/posts/[id]/email-status/route.ts` - Added context: { skipWebhook: true }
- `.env.example` - Added placeholder values for three new env vars

## Decisions Made
- Used `process.env.*` directly in webhook hook rather than importing from env.ts -- hooks run in Payload context where env.ts may not be the first import, and env.ts eagerly parses all vars which may not be available in test contexts
- Fire-and-forget webhook via `fetch().catch()` -- CMS response is not blocked by webhook delivery
- Guard logic on operation type: update requires previousDoc._status !== 'published' AND doc._status === 'published' (transition); create allows direct publish

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required

Three new environment variables must be added to `.env.local`:
- `RUN_API_WEBHOOK_URL` - Target URL for post-published webhook
- `RUN_API_BASE_URL` - Base URL for run-api
- `SITE_DOMAIN` - Base domain for subdomain extraction

See `.env.example` for placeholder values.

## Next Phase Readiness
- Posts collection ready for frontend rendering with draft/publish filtering and featured images
- SiteSettings ready for frontend navigation menu rendering
- Webhook pipeline ready for email delivery integration (requires run-api endpoint)
- Subsequent plans (03-02 through 03-05) can build on these schema additions

## Self-Check: PASSED

All 7 files verified present. Both commit hashes (1a88080, e19d3f6) confirmed in git log.

---
*Phase: 03-public-frontend-integrations*
*Completed: 2026-03-12*
