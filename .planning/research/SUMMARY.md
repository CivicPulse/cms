# Research Summary: CivPulse Campaign CMS

**Domain:** Multi-tenant campaign website CMS (PayloadCMS v3 + Next.js 15)
**Researched:** 2026-03-11
**Overall confidence:** MEDIUM -- stack is solid and well-documented, but the multi-tenant plugin has two open PostgreSQL-specific bugs that require workarounds

## Executive Summary

The PayloadCMS v3 ecosystem at v3.79.0 is mature enough for this project, with first-party packages covering every requirement: PostgreSQL adapter (`@payloadcms/db-postgres`), multi-tenant plugin (`@payloadcms/plugin-multi-tenant`), S3-compatible storage (`@payloadcms/storage-s3` for Cloudflare R2), and Lexical-to-HTML serialization for email templates. All packages are actively maintained and version-locked to the monorepo release train.

The multi-tenant plugin is the highest-risk component. Two confirmed open bugs affect PostgreSQL deployments: (1) tenant deletion crashes transactions (GitHub #14576), and (2) slug fields enforce global uniqueness instead of per-tenant uniqueness (GitHub #14938). Both have documented workarounds -- disable cascade delete and implement custom per-tenant slug validation -- but they add implementation complexity that must be accounted for in phase planning.

The storage situation has a naming trap: `@payloadcms/storage-r2` is for Cloudflare Workers only, not Node.js. The correct package for CivPulse's k3s deployment is `@payloadcms/storage-s3` configured with R2's S3-compatible endpoint. This is well-documented and straightforward once you know to use the right package.

Webhook/event handling is clean. Payload's built-in `afterChange` collection hooks provide `doc`, `previousDoc`, and a `context` object for preventing recursion. The pattern for "detect status transition, fire HMAC-signed webhook, update emailStatus without infinite loop" is well-supported and documented. The Lexical-to-HTML async serializer (`convertLexicalToHTMLAsync` + `getPayloadPopulateFn`) handles server-side conversion with relationship population for email content.

## Key Findings

**Stack:** PayloadCMS v3.79.0 + @payloadcms/db-postgres + @payloadcms/plugin-multi-tenant + @payloadcms/storage-s3 (for R2) + built-in afterChange hooks for webhooks.

**Architecture:** Single Next.js + Payload deployment, subdomain-based tenant resolution, row-level data isolation via plugin's tenant field, Local API for internal queries (not REST).

**Critical pitfall:** Multi-tenant slug uniqueness is globally enforced, not per-tenant. Every tenant-scoped collection with a slug field needs a custom `beforeValidate` hook. This must be implemented from day one.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation: PostgreSQL + Multi-Tenant Core** - Migrate from SQLite to PostgreSQL, wire multi-tenant plugin, implement env validation, set cleanupAfterTenantDelete: false
   - Addresses: DATABASE_URL config, tenant collection, tenant-scoped access control
   - Avoids: Tenant deletion crash bug (disable cascade), env var silent failures (Zod validation)

2. **Collections + Storage** - Define posts (with email fields), pages (with blocks), media collections; wire R2 storage via S3 adapter; implement per-tenant slug uniqueness hooks
   - Addresses: Core content types, media uploads, slug uniqueness per tenant
   - Avoids: Global slug uniqueness bug (custom validation), wrong R2 adapter (use storage-s3)

3. **Tenant Config + Frontend Template** - Per-tenant site config (isGlobal or one-per-tenant), first frontend template, subdomain-based tenant resolution
   - Addresses: Candidate name/colors/logo, public website rendering, template data-driven pattern
   - Avoids: Payload globals anti-pattern (use plugin's isGlobal, not top-level globals)

4. **Webhook + Email Pipeline** - afterChange hook for publish detection, HMAC webhook to run-api, emailStatus field management, Lexical-to-HTML serialization
   - Addresses: Post publish events, email content generation, CMS-to-run-api integration
   - Avoids: afterChange infinite loop (context flag pattern), stale previousDoc with drafts

5. **Subscriber Form + Additional Templates** - Newsletter signup component, additional visual templates, template switching UI
   - Addresses: Visitor engagement, visual variety, campaign customization
   - Avoids: Over-building before core flow is validated

**Phase ordering rationale:**
- PostgreSQL must come first because the multi-tenant plugin and all subsequent features depend on it
- Multi-tenant plugin must be wired before any collection work, since every collection needs the tenant field
- Storage must be configured before media uploads work, and media is needed by pages and posts
- Webhooks depend on the posts collection having email-related fields and status management
- Frontend templates depend on tenant config existing to read from
- Subscriber forms are standalone and can be added at any point after templates exist

**Research flags for phases:**
- Phase 1: Needs verification that multi-tenant plugin + db-postgres work together without migration issues on the project's exact Payload version. Test tenant creation and basic CRUD before proceeding.
- Phase 2: The slug uniqueness workaround needs validation under real multi-tenant conditions. Test with 2+ tenants creating identically-slugged pages.
- Phase 3: The `isGlobal: true` feature may trigger validation errors (GitHub #10740). Have fallback pattern ready (regular collection with one-per-tenant hook).
- Phase 4: Test previousDoc behavior with the exact draft/publish flow. If unreliable, implement a `lastKnownStatus` field for transition detection.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (packages) | HIGH | All packages are first-party, actively maintained, version-matched. Verified via npm and official docs. |
| PostgreSQL adapter | HIGH | Well-documented, standard config. Used in production by many teams (Neon guide, Vercel template). |
| Multi-tenant plugin | MEDIUM | Plugin works but has two confirmed open Postgres bugs. Workarounds are documented and implementable. |
| R2 storage | HIGH | Use storage-s3, not storage-r2. Clear S3-compatible configuration pattern with R2-specific settings. |
| Lexical-to-HTML | HIGH | Official async serializer API with server-side populate function. Import paths confirmed from docs. |
| Webhook pattern | HIGH | afterChange hooks are core Payload API. Context flag pattern is officially documented. |
| Slug uniqueness workaround | MEDIUM | Pattern is sound but needs real-world testing with the multi-tenant plugin's tenant field population timing. |
| isGlobal for tenant config | LOW | GitHub #10740 reports validation errors. May need fallback to regular collection. Test early. |

## Gaps to Address

- **isGlobal reliability:** Cannot confirm whether GitHub #10740 is fixed in v3.79.0. Must test in development before relying on it for tenant site config.
- **Migration tooling:** The SQLite-to-PostgreSQL migration is a fresh start (no data to migrate in scaffold), but the migration command flow (`npx payload migrate:create`, `npx payload migrate`) should be validated for the production deployment pipeline.
- **Bulk operations with multi-tenancy:** GitHub #15145 reports bulk edit breaking with multi-tenant. If admin users need bulk operations, this needs testing.
- **Job scheduling scoping:** GitHub #12849 notes Payload's job system is not tenant-scoped. Not a blocker (CivPulse uses run-api for job queuing), but worth noting if Payload jobs are considered later.
- **R2 public URL strategy:** The `generateFileURL` function needs to produce publicly accessible URLs. This requires either a public R2 bucket or a Cloudflare CDN domain pointing to the bucket. The exact CDN setup is infrastructure-level and not documented in this research.
