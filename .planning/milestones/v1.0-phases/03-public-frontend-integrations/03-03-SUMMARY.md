---
phase: 03-public-frontend-integrations
plan: 03
subsystem: ui
tags: [react, tailwind, components, blocks, newsletter, rich-text, lexical]

# Dependency graph
requires:
  - phase: 02-content-collections-tenant-config
    provides: SiteSettings, Posts, Pages, Media collections with block fields
  - phase: 03-public-frontend-integrations
    plan: 02
    provides: Tailwind CSS v4, lib/tenant.ts data helpers, lib/api.ts newsletter helpers
provides:
  - 6 shared UI components (InitialsAvatar, PostCard, Pagination, ShareButtons, NewsletterForm, MobileNav)
  - 4 block renderers (Hero, Text, Issues, Contact) with BlockRenderer dispatcher
  - StickyActionBar for external nav CTA buttons
  - Footer with newsletter form, social icons, and compliance disclaimer
affects: [03-04-templates, 03-05-pages, 03-06-integrations]

# Tech tracking
tech-stack:
  added: [@payloadcms/richtext-lexical/react]
  patterns: [block-type switch dispatch, Lexical rich text rendering, CSS animation keyframes in Tailwind v4]

key-files:
  created:
    - src/components/shared/InitialsAvatar.tsx
    - src/components/shared/PostCard.tsx
    - src/components/shared/Pagination.tsx
    - src/components/shared/ShareButtons.tsx
    - src/components/shared/NewsletterForm.tsx
    - src/components/shared/MobileNav.tsx
    - src/components/shared/StickyActionBar.tsx
    - src/components/shared/Footer.tsx
    - src/components/blocks/BlockRenderer.tsx
    - src/components/blocks/HeroBlockRenderer.tsx
    - src/components/blocks/TextBlockRenderer.tsx
    - src/components/blocks/IssuesBlockRenderer.tsx
    - src/components/blocks/ContactBlockRenderer.tsx
  modified:
    - src/app/globals.css

key-decisions:
  - "BlockRenderer uses Page['layout'] union type from payload-types for type-safe block dispatch"
  - "PostCard extracts plain-text excerpts from Lexical rich text by walking first text nodes (no serialization library needed)"
  - "MobileNav slide-in animation added as @theme keyframe in globals.css (Tailwind v4 CSS-first pattern)"

patterns-established:
  - "Block rendering: BlockRenderer dispatches by blockType, each renderer is a standalone component with typed props"
  - "Rich text: use RichText from @payloadcms/richtext-lexical/react with prose classes for typography"
  - "Social icons: inline SVG (no icon library) for Twitter/X, Facebook, Instagram"
  - "Newsletter form: client component with POST to run-api, compact and full layout modes"

requirements-completed: [FRONT-06]

# Metrics
duration: 4min
completed: 2026-03-12
---

# Phase 3 Plan 03: Shared Components and Block Renderers Summary

**13 template-agnostic React components: newsletter signup, blog cards, block renderers for hero/text/issues/contact, sticky CTA bar, footer with social icons, and mobile hamburger nav**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-12T03:27:38Z
- **Completed:** 2026-03-12T03:31:39Z
- **Tasks:** 2
- **Files modified:** 14

## Accomplishments

- 6 shared UI components: InitialsAvatar (candidate initials circle), PostCard (blog card with image/placeholder/date/excerpt), Pagination (prev/next with page counter), ShareButtons (Facebook/X/Email/Copy with clipboard feedback), NewsletterForm (email capture with loading/success/error states and compact mode), MobileNav (hamburger with slide-in overlay and body scroll lock)
- 5 block renderers: BlockRenderer dispatches by Payload blockType to HeroBlockRenderer (bg image + dark overlay + CTA), TextBlockRenderer (Lexical RichText with prose typography), IssuesBlockRenderer (responsive card grid with primary accent border), ContactBlockRenderer (email/address/phone + optional newsletter form)
- StickyActionBar: filters external nav items + donation URL, renders as sticky pill buttons, auto-hides when empty
- Footer: 3-row layout with compact newsletter form, campaign name + social SVG icons + contact email, and "Paid for by" disclaimer with CivPulse attribution

## Task Commits

Each task was committed atomically:

1. **Task 1: Shared UI components** - `4b775e5` (feat)
2. **Task 2: Block renderers + StickyActionBar + Footer** - `eb26569` (feat)

## Files Created/Modified

- `src/components/shared/InitialsAvatar.tsx` - Circle with candidate initials, 3 sizes, bg-primary
- `src/components/shared/PostCard.tsx` - Blog card with featured image/placeholder, date, Lexical excerpt
- `src/components/shared/Pagination.tsx` - Prev/next page navigation with page counter
- `src/components/shared/ShareButtons.tsx` - 4 share options: Facebook, X/Twitter, Email, Copy Link
- `src/components/shared/NewsletterForm.tsx` - Email capture with run-api integration, compact/full modes
- `src/components/shared/MobileNav.tsx` - Hamburger menu with slide-in overlay, body scroll lock
- `src/components/shared/StickyActionBar.tsx` - Sticky CTA bar for external nav items + donation
- `src/components/shared/Footer.tsx` - Newsletter, social icons, contact, disclaimer, CivPulse link
- `src/components/blocks/BlockRenderer.tsx` - Block dispatcher switching on blockType
- `src/components/blocks/HeroBlockRenderer.tsx` - Hero section with optional background image and CTA
- `src/components/blocks/TextBlockRenderer.tsx` - Lexical rich text via RichText component with prose
- `src/components/blocks/IssuesBlockRenderer.tsx` - Responsive issue card grid with primary accent
- `src/components/blocks/ContactBlockRenderer.tsx` - Contact info with optional newsletter form
- `src/app/globals.css` - Added slide-in-right animation keyframe for MobileNav

## Decisions Made

- **BlockRenderer types from payload-types:** Used `NonNullable<Page['layout']>[number]` union type for type-safe block discrimination, avoiding manual type definitions that could drift from Payload schema.
- **PostCard excerpt extraction:** Walks Lexical AST text nodes directly instead of using a serialization library -- simple and dependency-free for the ~150 char excerpt use case.
- **MobileNav animation in globals.css:** Added `@keyframes slide-in-right` and registered via `@theme inline` as `--animate-slide-in-right` following Tailwind v4 CSS-first animation pattern.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Pre-existing TypeScript errors in scripts/smoke-test.ts, src/tests/phase2-smoke.ts, and src/app/(payload)/admin/not-found.tsx are unrelated to this plan's changes and were not addressed (out of scope).
- Generated payload-types.ts is stale (missing featuredImage on Post, navItems on SiteSetting). Components use local interface types or access via existing type patterns. This is expected since types are regenerated at build time.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All 13 shared/block components are ready for template consumption (Plan 04)
- BlockRenderer is the single entry point for page layout rendering
- NewsletterForm, Footer, StickyActionBar, and MobileNav can be composed into any template layout
- PostCard and Pagination ready for blog feed pages

## Self-Check: PASSED

All 13 created files verified on disk. Both task commits (4b775e5, eb26569) verified in git log.

---
*Phase: 03-public-frontend-integrations*
*Completed: 2026-03-12*
