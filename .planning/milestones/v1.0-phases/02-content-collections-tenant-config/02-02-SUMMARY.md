---
phase: 02-content-collections-tenant-config
plan: 02
subsystem: api
tags: [payload, blocks, pages, media, upload, layout-builder, rich-text, lexical]

# Dependency graph
requires:
  - phase: 02-content-collections-tenant-config
    plan: 01
    provides: ensureUniqueTenantSlug hook, smoke test scaffold, Posts collection, ESLint config
provides:
  - "Pages collection with title, slug (per-tenant unique), and block-based layout builder"
  - "4 block types: HeroBlock (hero section with CTA), TextBlock (Lexical rich text), IssuesBlock (repeating plain-text items), ContactBlock (email, address, phone, newsletter toggle)"
  - "Media collection with image-only uploads (5 mime types), thumbnail size, public read access"
  - "Smoke test CONT-03 assertions: cross-tenant page slug, block storage, same-tenant dup rejection"
affects: [02-03-PLAN, phase-03]

# Tech tracking
tech-stack:
  added: []
  patterns: ["block-based layout builder with typed blocks", "upload collection with mime type filtering", "media public read access pattern"]

key-files:
  created:
    - src/collections/Pages.ts
    - src/collections/blocks/HeroBlock.ts
    - src/collections/blocks/TextBlock.ts
    - src/collections/blocks/IssuesBlock.ts
    - src/collections/blocks/ContactBlock.ts
    - src/collections/Media.ts
  modified:
    - src/payload.config.ts
    - src/tests/phase2-smoke.ts

key-decisions:
  - "Registered Pages and Media in payload.config.ts and multi-tenant plugin immediately (not deferred to Plan 03) to enable smoke test assertions"
  - "IssuesBlock uses plain text (not richText) for description — consistent card styling without HTML cleanup"
  - "Media collection has no disableLocalStorage or s3 config — storage-s3 plugin sets these automatically in payload.config.ts (Plan 03)"
  - "ContactBlock showNewsletterForm uses checkbox type (not boolean) — Payload v3 convention for boolean fields in admin UI"

patterns-established:
  - "Block definition pattern: export const XBlock: Block = { slug, labels, fields } for reusable layout blocks"
  - "Upload collection with mime type filtering: upload.mimeTypes array restricts accepted file types"
  - "Layout builder pattern: type: 'blocks' field with imported block definitions for page composition"

requirements-completed: [CONT-03, CONT-04]

# Metrics
duration: 3min
completed: 2026-03-12
---

# Phase 2 Plan 2: Pages + Blocks + Media Summary

**Pages collection with block-based layout builder (hero, text, issues, contact blocks) and Media upload collection with image-only filtering and public read access**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-12T00:08:31Z
- **Completed:** 2026-03-12T00:11:53Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created 4 block types for page layout composition: HeroBlock (headline, subheadline, backgroundImage, CTA), TextBlock (Lexical richText), IssuesBlock (repeating title+description array), ContactBlock (email, address, phone, newsletter toggle)
- Created Pages collection with title, per-tenant unique slug (via ensureUniqueTenantSlug validate), and blocks-based layout field
- Created Media collection with image-only mime type filtering (jpeg, png, webp, gif, svg+xml), thumbnail imageSizes, and public read access
- Registered Pages and Media in payload.config.ts collections array and Pages in multi-tenant plugin
- Updated smoke test with 5 CONT-03 assertions (all passing) and CONT-04 skip stub

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 4 block files and Pages.ts collection** - `5b830aa` (feat)
2. **Task 2: Create Media.ts and update smoke test** - `a34e3bf` (feat)

## Files Created/Modified
- `src/collections/blocks/HeroBlock.ts` - Hero section block with headline, subheadline, backgroundImage (media upload), ctaLabel, ctaUrl
- `src/collections/blocks/TextBlock.ts` - Free-form rich text block using Lexical editor
- `src/collections/blocks/IssuesBlock.ts` - Campaign issues block with repeating plain-text items array
- `src/collections/blocks/ContactBlock.ts` - Contact info block with email, address, phone, newsletter toggle
- `src/collections/Pages.ts` - Pages collection with title, per-tenant unique slug, block-based layout builder
- `src/collections/Media.ts` - Image upload collection with 5 accepted mime types, thumbnail size, public read
- `src/payload.config.ts` - Added Pages and Media imports, registered in collections array and multi-tenant plugin
- `src/tests/phase2-smoke.ts` - CONT-03 assertions for pages + blocks, CONT-04 skip stub for media R2

## Decisions Made
- Registered Pages in multi-tenant plugin immediately (not deferred to Plan 03) so the tenant field is available for smoke test assertions and per-tenant slug uniqueness enforcement
- Registered Media in collections array now but without multi-tenant plugin registration (Media is shared, not tenant-scoped)
- ContactBlock uses `checkbox` type for showNewsletterForm (Payload v3 convention for boolean admin UI fields)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Registered Pages in payload.config.ts collections and multi-tenant plugin**
- **Found during:** Task 1 (Pages.ts creation)
- **Issue:** Pages collection must be registered in both the collections array and multi-tenant plugin for tenant field injection and smoke test to work
- **Fix:** Added Pages import, registered in collections array and multi-tenant plugin collections config
- **Files modified:** src/payload.config.ts
- **Verification:** Smoke test creates pages with tenant field successfully
- **Committed in:** 5b830aa (Task 1 commit)

**2. [Rule 3 - Blocking] Registered Media in payload.config.ts collections array**
- **Found during:** Task 2 (Media.ts creation)
- **Issue:** Media collection must be registered in collections array for Payload to recognize it as an upload target for HeroBlock backgroundImage
- **Fix:** Added Media import and registration in collections array
- **Files modified:** src/payload.config.ts
- **Verification:** Smoke test runs without media collection errors
- **Committed in:** a34e3bf (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both registrations are necessary for the collections to function. Plan stated "registered in Plan 03" but that only applies to the storage-s3 plugin wiring, not the base collection registration. No scope creep.

## Issues Encountered
- Schema push required NODE_ENV=development for the smoke test to auto-create the pages and media tables. Without it, Drizzle push is disabled and the test crashes with "relation pages does not exist". This is existing behavior (same as Phase 1) and is handled by running the test with NODE_ENV=development.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Pages and Media collections fully defined, ready for Plan 03 (SiteSettings + R2 storage wiring)
- Block definitions ready for frontend template consumption in Phase 3
- Media collection ready for s3Storage plugin registration in payload.config.ts (Plan 03)
- All 9 assertions pass (CONT-01: 2, CONT-02: 2, CONT-03: 5) with CONT-04, CONF-01, CONF-02 showing SKIP

## Self-Check: PASSED

All 8 created/modified files verified present. Both task commits (5b830aa, a34e3bf) verified in git log.

---
*Phase: 02-content-collections-tenant-config*
*Completed: 2026-03-12*
