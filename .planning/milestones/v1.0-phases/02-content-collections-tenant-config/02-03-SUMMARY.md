---
phase: 02-content-collections-tenant-config
plan: 03
subsystem: api
tags: [payload, s3, r2, hmac, site-settings, multi-tenant, drizzle-migration]

# Dependency graph
requires:
  - phase: 02-content-collections-tenant-config/02-01
    provides: "Posts schema with slug, publishAs, email fields; env validation with R2 vars; API key auth"
  - phase: 02-content-collections-tenant-config/02-02
    provides: "Pages collection with 4 block types; Media collection for R2 uploads"
provides:
  - "SiteSettings collection with one-per-tenant guard and Configuration sidebar group"
  - "s3Storage plugin wired to Cloudflare R2 for Media uploads"
  - "HMAC-verified email-status callback route for run-api"
  - "Phase 2 Drizzle migration committed (pages, media, site-settings tables)"
  - "All Phase 2 requirements complete (CONT-01 through CONF-03)"
affects: [03-frontend-templates-integrations]

# Tech tracking
tech-stack:
  added: ["@payloadcms/storage-s3"]
  patterns: ["beforeOperation one-per-tenant guard", "HMAC webhook verification with timingSafeEqual", "admin.group for sidebar organization"]

key-files:
  created:
    - src/collections/SiteSettings.ts
    - src/app/(payload)/api/posts/[id]/email-status/route.ts
    - src/migrations/20260312_001714.ts
    - src/migrations/20260312_001714.json
  modified:
    - src/payload.config.ts
    - src/tests/phase2-smoke.ts
    - src/migrations/index.ts

key-decisions:
  - "R2_ENDPOINT env var stores domain only (no https://) -- code prepends protocol in s3Storage config"
  - "SiteSettings uses beforeOperation hook with overrideAccess: true for duplicate detection -- avoids multi-tenant plugin scoping hiding existing records"
  - "Email-status route uses process.env.WEBHOOK_SECRET directly (not env.ts import) since Next.js API routes run in edge-compatible context"

patterns-established:
  - "One-per-tenant guard: beforeOperation hook queries with overrideAccess: true before create"
  - "HMAC webhook: read raw body, timingSafeEqual comparison, then JSON.parse"
  - "Admin sidebar grouping: admin.group on collection config separates config from content"

requirements-completed: [CONF-01, CONF-02, CONF-03]

# Metrics
duration: multi-session
completed: 2026-03-12
---

# Phase 2 Plan 3: SiteSettings + Email-Status Route + Phase 2 Migration Summary

**SiteSettings collection with one-per-tenant guard under Configuration sidebar group, s3Storage wired to R2, HMAC-verified email-status callback, and Phase 2 Drizzle migration committed**

## Performance

- **Duration:** multi-session (checkpoint verification required human interaction)
- **Started:** 2026-03-12
- **Completed:** 2026-03-12
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 7

## Accomplishments
- SiteSettings collection with 14 fields, beforeOperation one-per-tenant guard, and admin.group: 'Configuration' for sidebar separation
- s3Storage plugin wired to Cloudflare R2 with generateFileURL for public CDN URLs -- verified working upload to cdn-dev.civpulse.org
- HMAC-verified email-status callback route at /api/posts/[id]/email-status for run-api integration
- Phase 2 Drizzle migration generated and committed covering pages, media, and site-settings tables
- All Phase 2 requirements (CONT-01 through CONF-03) verified complete

## Task Commits

Each task was committed atomically:

1. **Task 1: SiteSettings.ts, payload.config.ts, smoke test, migration** - `088a768` (feat)
2. **Task 2: Email-status callback route** - `936cfb9` (feat)
3. **Task 3: Human verification checkpoint** - approved (no commit -- verification only)

## Files Created/Modified
- `src/collections/SiteSettings.ts` - Per-tenant site settings with candidate identity, branding, links, and template fields
- `src/payload.config.ts` - Registers Pages, Media, SiteSettings; adds s3Storage and multi-tenant scoping for all collections
- `src/app/(payload)/api/posts/[id]/email-status/route.ts` - HMAC-verified webhook endpoint for email delivery status updates
- `src/tests/phase2-smoke.ts` - CONF-01 assertions for SiteSettings create + duplicate rejection
- `src/migrations/20260312_001714.ts` - Phase 2 Drizzle migration (pages, media, site-settings tables)
- `src/migrations/20260312_001714.json` - Migration snapshot
- `src/migrations/index.ts` - Updated migration registry

## Decisions Made
- R2_ENDPOINT env var stores domain only (no https://) -- s3Storage config prepends the protocol. Verified during human checkpoint.
- SiteSettings uses beforeOperation hook with overrideAccess: true for duplicate detection -- avoids multi-tenant plugin's access scoping hiding existing records during create operations (RESEARCH.md Pitfall 4).
- Email-status route uses process.env.WEBHOOK_SECRET directly rather than importing from env.ts, since the route runs in Next.js API context.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** R2 environment variables must be set in .env.local:
- R2_ENDPOINT (Cloudflare account ID domain, no https:// prefix)
- R2_BUCKET (bucket name)
- R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY (R2 API token credentials)
- R2_PUBLIC_URL (public bucket URL with https://)
- WEBHOOK_SECRET (random 32+ character string for HMAC verification)

## Next Phase Readiness
- All 7 Phase 2 requirements verified complete (CONT-01 through CONF-03)
- Collections ready for Phase 3 frontend template rendering: Posts, Pages, Media, SiteSettings all tenant-scoped
- SiteSettings.activeTemplateKey (classic/modern/bold) ready for Phase 3 template selection
- R2 media storage operational for image delivery in frontend templates

---
*Phase: 02-content-collections-tenant-config*
*Completed: 2026-03-12*

## Self-Check: PASSED

All files and commits verified:
- FOUND: src/collections/SiteSettings.ts
- FOUND: src/app/(payload)/api/posts/[id]/email-status/route.ts
- FOUND: src/migrations/20260312_001714.ts
- FOUND: commit 088a768
- FOUND: commit 936cfb9
