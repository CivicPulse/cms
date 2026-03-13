---
phase: 05-tech-debt-cleanup
plan: 01
subsystem: api, ui
tags: [server-actions, nextjs, prop-drilling, refactor]

# Dependency graph
requires:
  - phase: 03-public-frontend-integrations
    provides: Newsletter form components, template layouts, page server components with runApiUrl prop-drilling
provides:
  - Server actions wrapping api.ts newsletter helpers (subscribeAction, updateSubscriberAction)
  - Clean LayoutProps type without runApiUrl
  - Form components using server actions instead of inline fetch
affects: [05-tech-debt-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns: [server-actions-for-api-calls]

key-files:
  created:
    - src/actions/newsletter.ts
  modified:
    - src/components/shared/NewsletterForm.tsx
    - src/app/(frontend)/newsletter/thank-you/ThankYouForm.tsx
    - src/lib/templates.ts
    - src/components/shared/Footer.tsx
    - src/components/templates/classic/ClassicLayout.tsx
    - src/components/templates/modern/ModernLayout.tsx
    - src/components/templates/bold/BoldLayout.tsx
    - src/components/blocks/BlockRenderer.tsx
    - src/components/blocks/ContactBlockRenderer.tsx
    - src/app/(frontend)/page.tsx
    - src/app/(frontend)/blog/page.tsx
    - src/app/(frontend)/blog/[slug]/page.tsx
    - src/app/(frontend)/[slug]/page.tsx
    - src/app/(frontend)/newsletter/page.tsx
    - src/app/(frontend)/newsletter/thank-you/page.tsx

key-decisions:
  - "Server actions as thin wrappers -- subscribeAction and updateSubscriberAction delegate entirely to api.ts helpers, no duplicated logic"
  - "ContactBlockRenderer condition simplified from showNewsletterForm && campaignId && runApiUrl to showNewsletterForm && campaignId since runApiUrl no longer needed"

patterns-established:
  - "Server actions pattern: 'use server' file in src/actions/ wrapping lib/ helpers for client component consumption"

requirements-completed: []

# Metrics
duration: 6min
completed: 2026-03-12
---

# Phase 5 Plan 1: Server Actions and runApiUrl Removal Summary

**Next.js server actions wrapping api.ts newsletter helpers, replacing inline fetch in form components and eliminating 42 runApiUrl prop-drilling occurrences across 15 files**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-12T20:02:32Z
- **Completed:** 2026-03-12T20:08:32Z
- **Tasks:** 2
- **Files modified:** 16 (1 created + 15 modified)

## Accomplishments
- Created src/actions/newsletter.ts with 'use server' directive exporting subscribeAction and updateSubscriberAction
- Rewired NewsletterForm and ThankYouForm to call server actions instead of inline fetch, removing server-side URL exposure from client components
- Removed all 42 runApiUrl occurrences from the 15-file prop-drilling chain (LayoutProps, 3 layouts, Footer, 2 block renderers, 6 page server components)
- api.ts exports (subscribeToNewsletter, updateSubscriber) now consumed by server actions -- no longer orphaned

## Task Commits

Each task was committed atomically:

1. **Task 1: Create server actions and rewire form components** - `ce231d7` (feat)
2. **Task 2: Remove runApiUrl from entire prop-drilling chain** - `cf3550e` (refactor)

## Files Created/Modified
- `src/actions/newsletter.ts` - Server action wrappers for newsletter API calls (new)
- `src/components/shared/NewsletterForm.tsx` - Uses subscribeAction instead of inline fetch; runApiUrl removed from props
- `src/app/(frontend)/newsletter/thank-you/ThankYouForm.tsx` - Uses updateSubscriberAction instead of inline fetch; runApiUrl removed from props
- `src/lib/templates.ts` - LayoutProps type no longer includes runApiUrl
- `src/components/shared/Footer.tsx` - runApiUrl removed from props and NewsletterForm JSX
- `src/components/templates/classic/ClassicLayout.tsx` - runApiUrl removed from props and Footer JSX
- `src/components/templates/modern/ModernLayout.tsx` - runApiUrl removed from props and Footer JSX
- `src/components/templates/bold/BoldLayout.tsx` - runApiUrl removed from props and Footer JSX
- `src/components/blocks/BlockRenderer.tsx` - runApiUrl removed from props and ContactBlockRenderer JSX
- `src/components/blocks/ContactBlockRenderer.tsx` - runApiUrl removed from props, condition, and NewsletterForm JSX
- `src/app/(frontend)/page.tsx` - Removed RUN_API_BASE_URL env read and runApiUrl props
- `src/app/(frontend)/blog/page.tsx` - Removed RUN_API_BASE_URL env read and runApiUrl props
- `src/app/(frontend)/blog/[slug]/page.tsx` - Removed RUN_API_BASE_URL env read and runApiUrl props
- `src/app/(frontend)/[slug]/page.tsx` - Removed RUN_API_BASE_URL env read and runApiUrl props
- `src/app/(frontend)/newsletter/page.tsx` - Removed RUN_API_BASE_URL env read and runApiUrl props
- `src/app/(frontend)/newsletter/thank-you/page.tsx` - Removed RUN_API_BASE_URL env read and runApiUrl props

## Decisions Made
- Server actions as thin wrappers -- subscribeAction and updateSubscriberAction delegate entirely to api.ts helpers, no duplicated logic
- ContactBlockRenderer condition simplified from `showNewsletterForm && campaignId && runApiUrl` to `showNewsletterForm && campaignId` since runApiUrl is no longer needed at the component level

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Server actions pattern established for future API call wrappers
- Plan 02 (smoke-test.ts coverage) can proceed independently
- RUN_API_BASE_URL env var still consumed in src/lib/api.ts (server-side only, as intended)

## Self-Check: PASSED

- All key files exist (src/actions/newsletter.ts, NewsletterForm.tsx, ThankYouForm.tsx, 05-01-SUMMARY.md)
- Both commits verified (ce231d7, cf3550e)
- Zero runApiUrl occurrences in src/

---
*Phase: 05-tech-debt-cleanup*
*Completed: 2026-03-12*
