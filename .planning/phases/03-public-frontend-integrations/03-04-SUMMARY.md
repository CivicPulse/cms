---
phase: 03-public-frontend-integrations
plan: 04
subsystem: ui
tags: [react, tailwind, templates, responsive, server-components]

# Dependency graph
requires:
  - phase: 03-public-frontend-integrations
    provides: shared components (Footer, StickyActionBar, MobileNav, InitialsAvatar), Tailwind theme tokens, tenant data layer
provides:
  - Classic template (serif fonts, side-by-side hero, cream palette)
  - Modern template (Inter sans-serif, centered hero, white palette)
  - Bold template (Space Grotesk display, full-bleed hero, dark palette)
  - Template registry with getTemplate() and LayoutProps type
affects: [03-05, 03-06, frontend-pages]

# Tech tracking
tech-stack:
  added: []
  patterns: [template-component-tree, template-registry-pattern, navItems-type-assertion]

key-files:
  created:
    - src/components/templates/classic/ClassicLayout.tsx
    - src/components/templates/classic/ClassicNav.tsx
    - src/components/templates/classic/ClassicHero.tsx
    - src/components/templates/modern/ModernLayout.tsx
    - src/components/templates/modern/ModernNav.tsx
    - src/components/templates/modern/ModernHero.tsx
    - src/components/templates/bold/BoldLayout.tsx
    - src/components/templates/bold/BoldNav.tsx
    - src/components/templates/bold/BoldHero.tsx
  modified:
    - src/lib/templates.ts

key-decisions:
  - "navItems accessed via type assertion (siteSettings as unknown as Record) -- generated types stale, field exists in SiteSettings collection"
  - "BoldHero uses solid primaryColor background fallback instead of InitialsAvatar when no photo -- full-bleed design requires background fill, not element"
  - "Template registry exports LayoutProps type for page components to consume"

patterns-established:
  - "Template component tree: each template has Layout > Nav + StickyActionBar + children + Footer"
  - "Template palette isolation: classic-*, modern-*, bold-* CSS tokens keep base palettes fixed; primary used as accent only"
  - "Populated media access: typeof check + null guard + cast to Media type for logo/candidatePhoto"

requirements-completed: [FRONT-06, FRONT-02]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 03 Plan 04: Template Components Summary

**Three visually distinct template trees (Classic/Modern/Bold) with Layout, Nav, Hero components and a registry mapping activeTemplateKey to Layout components**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T03:35:08Z
- **Completed:** 2026-03-12T03:39:33Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Built 9 template component files (3 per template: Layout, Nav, Hero) each with distinct visual identity
- Classic: serif fonts, cream palette, side-by-side hero with candidate photo right/text left
- Modern: Inter sans-serif, white palette, centered hero with circular photo above name
- Bold: Space Grotesk headings, dark slate palette, full-bleed hero with primaryColor overlay on background photo
- Wired template registry in lib/templates.ts with getTemplate() returning Layout components and Modern as fallback

## Task Commits

Each task was committed atomically:

1. **Task 1: Classic + Modern template components** - `66a7c01` (feat)
2. **Task 2: Bold template components + template registry wiring** - `5a5b87d` (feat)

## Files Created/Modified
- `src/components/templates/classic/ClassicNav.tsx` - Serif-styled nav with desktop/mobile, external link detection
- `src/components/templates/classic/ClassicHero.tsx` - Side-by-side hero (text left 60%, photo right 40%)
- `src/components/templates/classic/ClassicLayout.tsx` - Layout wrapper with Nav > StickyActionBar > content > Footer
- `src/components/templates/modern/ModernNav.tsx` - Clean sans-serif nav with shadow, desktop/mobile
- `src/components/templates/modern/ModernHero.tsx` - Centered hero with circular photo, rounded-full CTA
- `src/components/templates/modern/ModernLayout.tsx` - Layout wrapper with 5xl max-width
- `src/components/templates/bold/BoldNav.tsx` - Dark nav with Space Grotesk campaign name
- `src/components/templates/bold/BoldHero.tsx` - Full-bleed background with color-mix overlay, large typography
- `src/components/templates/bold/BoldLayout.tsx` - Layout wrapper with 7xl max-width, dark palette
- `src/lib/templates.ts` - Template registry with getTemplate(), getTemplateKey(), LayoutProps export

## Decisions Made
- **navItems type assertion:** Generated payload-types.ts is stale and doesn't include navItems (field exists in SiteSettings collection). Used `siteSettings as unknown as Record<string, unknown>` to safely access navItems at runtime. Will resolve when types are regenerated.
- **BoldHero photo fallback:** Bold template uses solid primaryColor background instead of InitialsAvatar when no photo. Full-bleed hero design requires background fill, not a rendered element.
- **LayoutProps exported from registry:** Page components import LayoutProps type from lib/templates.ts for consistent prop typing across all templates.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] navItems type not in generated SiteSetting interface**
- **Found during:** Task 1 (ClassicNav component)
- **Issue:** SiteSetting type from payload-types.ts does not include navItems field despite it existing in the SiteSettings collection definition
- **Fix:** Used `(siteSettings as unknown as Record<string, unknown>).navItems` type assertion pattern across all components that access navItems
- **Files modified:** All Nav, Hero, and Layout components (8 files)
- **Verification:** `npx tsc --noEmit` passes with no errors in template files
- **Committed in:** 66a7c01, 5a5b87d (both task commits)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Type assertion necessary due to stale generated types. No scope creep. Will self-resolve on next `payload generate:types`.

## Issues Encountered
None beyond the navItems type gap documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 3 template component trees available for page-level consumption
- getTemplate(key) returns the correct Layout component for any valid key
- Pages can import { getTemplate, LayoutProps } from '@/lib/templates' and render the selected template
- Ready for Plan 05 (page routes) to wire templates into Next.js route handlers

---
*Phase: 03-public-frontend-integrations*
*Completed: 2026-03-12*

## Self-Check: PASSED

All 10 created files verified present. Both task commits (66a7c01, 5a5b87d) confirmed in git log. SUMMARY.md exists.
