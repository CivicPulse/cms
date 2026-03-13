---
phase: 05-tech-debt-cleanup
plan: 02
subsystem: ui, api, testing
tags: [typescript, type-safety, payload-types, webhook, hmac]

# Dependency graph
requires:
  - phase: 04-phase3-drizzle-migration
    provides: "Regenerated payload-types.ts with navItems, featuredImage, emailStatus fields"
  - phase: 05-tech-debt-cleanup plan 01
    provides: "runApiUrl removal, server action cleanup"
provides:
  - "Type-safe navItems access in all 8 template files"
  - "Type-safe featuredImage narrowing in blog page"
  - "WEBHOOK_SECRET runtime guard with log+skip pattern"
  - "Clean typed access in both smoke test files"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "typeof narrowing for Payload union fields (featuredImage)"
    - "Runtime env guard with log+skip for webhook secrets"
    - "Direct Payload generic type flow (no lossy casts)"

key-files:
  created: []
  modified:
    - "src/components/templates/classic/ClassicLayout.tsx"
    - "src/components/templates/classic/ClassicHero.tsx"
    - "src/components/templates/classic/ClassicNav.tsx"
    - "src/components/templates/modern/ModernLayout.tsx"
    - "src/components/templates/modern/ModernNav.tsx"
    - "src/components/templates/bold/BoldLayout.tsx"
    - "src/components/templates/bold/BoldHero.tsx"
    - "src/components/templates/bold/BoldNav.tsx"
    - "src/app/(frontend)/blog/[slug]/page.tsx"
    - "src/hooks/fireWebhook.ts"
    - "src/tests/phase2-smoke.ts"
    - "scripts/smoke-test.ts"

key-decisions:
  - "Partial<SiteSetting> used for phase2-smoke.ts variable annotation to handle {} fallback"
  - "scripts/smoke-test.ts keeps inline type annotations (compatible with Payload generics) rather than importing types"

patterns-established:
  - "Direct siteSettings.navItems ?? [] for navItems access (no casts)"
  - "typeof narrowing for Payload union fields like featuredImage"
  - "Env guards at top of webhook hook before any business logic"

requirements-completed: []

# Metrics
duration: 7min
completed: 2026-03-12
---

# Phase 5 Plan 2: Type Cast Cleanup Summary

**Removed all unsafe type casts from templates, blog page, webhook hook, and both smoke test files -- zero `as unknown as Record` and `as { id: }` casts remain in codebase**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-12T20:12:27Z
- **Completed:** 2026-03-12T20:20:21Z
- **Tasks:** 3
- **Files modified:** 12

## Accomplishments
- Replaced 8 navItems `as unknown as Record` casts with direct `siteSettings.navItems ?? []` in all template files
- Replaced 2 featuredImage casts with `typeof` narrowing in blog/[slug]/page.tsx
- Added WEBHOOK_SECRET runtime guard (log+skip) and moved env checks to top of fireWebhook hook
- Removed 5 `as unknown as Record` casts in phase2-smoke.ts with direct typed access
- Removed 6 `as { id: }` casts in scripts/smoke-test.ts, letting Payload generics flow through
- `npm run build` passes with zero errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Replace navItems type casts in 8 template files** - `c5fa10f` (fix)
2. **Task 2: Fix featuredImage casts, webhook guard, and smoke test types** - `a55324a` (fix)
3. **Task 3: Final build verification** - no commit (verification-only, zero code changes)

## Files Created/Modified
- `src/components/templates/classic/ClassicLayout.tsx` - Direct navItems access
- `src/components/templates/classic/ClassicHero.tsx` - Direct navItems access
- `src/components/templates/classic/ClassicNav.tsx` - Direct navItems access
- `src/components/templates/modern/ModernLayout.tsx` - Direct navItems access
- `src/components/templates/modern/ModernNav.tsx` - Direct navItems access
- `src/components/templates/bold/BoldLayout.tsx` - Direct navItems access
- `src/components/templates/bold/BoldHero.tsx` - Direct navItems access
- `src/components/templates/bold/BoldNav.tsx` - Direct navItems access
- `src/app/(frontend)/blog/[slug]/page.tsx` - typeof narrowing for featuredImage
- `src/hooks/fireWebhook.ts` - WEBHOOK_SECRET guard, env checks at top, removed non-null assertion
- `src/tests/phase2-smoke.ts` - Direct typed access for emailStatus, layout, SiteSettings
- `scripts/smoke-test.ts` - Removed as { id: } casts, Payload generics flow through

## Decisions Made
- Used `Partial<SiteSetting>` for phase2-smoke.ts siteSettingsA variable to accommodate the `{}` error fallback while accepting full SiteSetting from Payload API
- Kept inline type annotations in scripts/smoke-test.ts rather than importing from payload-types -- file is outside src/ and inline annotations compile cleanly with Payload generics
- Left `as Parameters<typeof payload.find>[0]['user']` casts in scripts/smoke-test.ts as-is -- these cast to Payload's own parameter type (not lossy Record)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 5 tech debt items from the milestone audit are resolved
- Zero `as unknown as Record` casts remain in src/
- Zero `WEBHOOK_SECRET!` non-null assertions remain in src/
- Zero `as { id: }` narrowing casts remain in scripts/smoke-test.ts
- Phase 5 (Tech Debt Cleanup) is complete -- all plans executed

## Self-Check: PASSED

All files exist, all commits verified (c5fa10f, a55324a).

---
*Phase: 05-tech-debt-cleanup*
*Completed: 2026-03-12*
