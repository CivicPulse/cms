# Roadmap: CivPulse Campaign CMS

## Overview

This roadmap takes CivPulse's existing PayloadCMS v3 + Next.js 15 scaffold and transforms it into a production multi-tenant campaign website platform. The work follows a strict dependency chain: PostgreSQL and multi-tenant isolation must be proven first (Phase 1), then content collections and tenant configuration built on that foundation (Phase 2), and finally the public-facing website, webhook integrations, and templates assembled on top (Phase 3). Each phase delivers a verifiable capability that unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Multi-Tenant Foundation** - Migrate to PostgreSQL, wire multi-tenant plugin, enforce tenant isolation with smoke-tested proof
- [x] **Phase 2: Content Collections + Tenant Config** - Define all content types (posts, pages, media) with R2 storage, per-tenant site-settings, and REST API seeding (completed 2026-03-12)
- [x] **Phase 3: Public Frontend + Integrations** - Subdomain-based tenant resolution, data-driven templates, webhook pipeline to run-api, and newsletter signup (completed 2026-03-12)
- [ ] **Phase 4: Phase 3 Drizzle Migration** - Generate and commit missing migration for Phase 3 schema changes (gap closure)
- [ ] **Phase 5: Tech Debt Cleanup** - Resolve stale type casts, orphaned exports, missing runtime guards, and TS errors from audit

## Phase Details

### Phase 1: Multi-Tenant Foundation
**Goal**: A Payload instance running on PostgreSQL where multiple tenants are fully isolated -- campaign managers can only see and edit their own tenant's data in both admin UI and API
**Depends on**: Nothing (first phase)
**Requirements**: FOUND-01, FOUND-02, FOUND-03, FOUND-04, FOUND-05, FOUND-06
**Success Criteria** (what must be TRUE):
  1. App refuses to start with a clear error message when `DATABASE_URL` or `PAYLOAD_SECRET` environment variables are missing
  2. Two test tenants can be created via the admin panel, each with distinct slug and domain values
  3. A campaign manager user logged into Tenant A sees zero content from Tenant B in both admin UI and REST API responses
  4. Multi-tenant plugin + PostgreSQL integration passes smoke test: create tenant, create content, query content, delete content -- no transaction crashes or unexpected errors
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — Infrastructure: npm package swap (@payloadcms/db-postgres, plugin-multi-tenant, zod), src/env.ts Zod startup validation, Docker Compose Postgres dev container
- [x] 01-02-PLAN.md — Schema + plugin: Tenants collection, Users role field + tenantsArrayField, Posts tenant registration, payload.config.ts wired with Postgres adapter and multi-tenant plugin
- [x] 01-03-PLAN.md — Migration + smoke test: generate and commit initial migration, write tenant isolation smoke test, verify admin UI isolation

### Phase 2: Content Collections + Tenant Config
**Goal**: Campaign managers can create blog posts (with email publishing fields), build static pages with block-based layouts, upload images to R2, and configure their site identity -- all scoped to their tenant
**Depends on**: Phase 1
**Requirements**: CONT-01, CONT-02, CONT-03, CONT-04, CONF-01, CONF-02, CONF-03
**Success Criteria** (what must be TRUE):
  1. A campaign manager can create a blog post with title, content, and publishAs selection; when publishAs includes "email", the email-specific fields (subject, preview text, status, scheduled send) become visible
  2. Two tenants can each create a page with slug "about" without conflict -- per-tenant slug uniqueness is enforced via custom validate function, while cross-tenant duplicate slugs are allowed
  3. A campaign manager can upload images through the admin panel and the files are stored in Cloudflare R2 (not local filesystem)
  4. Per-tenant site-settings (candidate name, office, tagline, primary color, logo, social links, contact email, donation URL, active template key) can be configured through admin UI and read via REST API
  5. run-api can seed a new tenant's site-settings via Payload REST API during campaign provisioning
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Infrastructure + Posts: install storage-s3, extend env.ts with R2/webhook vars, enable API key auth on Users, create ensureUniqueTenantSlug hook, scaffold phase2-smoke.ts, extend Posts with slug + publishAs + email fields (CONT-01, CONT-02)
- [x] 02-02-PLAN.md — Pages + Media: create 4 block files (Hero, Text, Issues, Contact), Pages collection with block layout builder, Media upload collection (CONT-03, CONT-04)
- [x] 02-03-PLAN.md — SiteSettings + wiring + migration: SiteSettings collection under Configuration group, update payload.config.ts with all new collections + s3Storage plugin, email-status callback route, Phase 2 Drizzle migration, human-verify checkpoint (CONF-01, CONF-02, CONF-03)

### Phase 3: Public Frontend + Integrations
**Goal**: Visitors see a fully rendered campaign website at the tenant's subdomain, with data-driven templates, blog content, and newsletter signup -- while post publishing triggers the email delivery pipeline via webhooks to run-api
**Depends on**: Phase 2
**Requirements**: HOOK-01, HOOK-02, HOOK-03, FRONT-01, FRONT-02, FRONT-03, FRONT-04, FRONT-05, FRONT-06
**Success Criteria** (what must be TRUE):
  1. Visiting `{slug}.campaigns.civpulse.com` resolves the correct tenant and renders that campaign's homepage with candidate name, photo, tagline, office, and issues -- all pulled from tenant site-settings
  2. The public blog feed at `/{tenant}/blog` shows only published posts (publishAs "web" or "both") for the current tenant; individual post pages render full content with metadata
  3. Publishing a post with publishAs "email" or "both" fires an HMAC-signed webhook to run-api containing postId, tenantId, and publishAs; run-api can call back to update emailStatus and emailSentAt without triggering an infinite webhook loop
  4. A visitor can submit the newsletter signup form with name and email; the form POSTs to run-api's subscriber endpoint with the correct campaign ID and displays success/error feedback
  5. Three visually distinct templates are available; a campaign can switch templates via site-settings without losing any content, and the selected template drives layout and color rendering

**Plans**: 7 plans

Plans:
- [x] 03-00-PLAN.md — Wave 0: Playwright config + stub test files for all 9 requirement-mapped behavioral tests (ALL)
- [x] 03-01-PLAN.md — Schema + webhook pipeline: Posts versions/drafts + featuredImage, SiteSettings navItems, afterChange webhook hook, email-status skipWebhook context, new env vars (HOOK-01, HOOK-02, HOOK-03)
- [x] 03-02-PLAN.md — Frontend infrastructure: Tailwind CSS v4 + PostCSS, subdomain middleware, frontend layout with fonts, lib utilities for tenant data + template selection + run-api (FRONT-01)
- [x] 03-03-PLAN.md — Shared components + block renderers: InitialsAvatar, PostCard, Pagination, ShareButtons, NewsletterForm, MobileNav, StickyActionBar, Footer, BlockRenderer + 4 block renderers (FRONT-06)
- [x] 03-04-PLAN.md — Template system: Classic + Modern + Bold template components (Layout, Nav, Hero for each), template registry wiring (FRONT-06, FRONT-02)
- [x] 03-05-PLAN.md — Page routes: homepage with fixed sections, dynamic pages, blog feed with pagination, post pages with rich text, newsletter signup flow, not-found page, visual verification checkpoint (FRONT-02, FRONT-03, FRONT-04, FRONT-05)
- [x] 03-06-PLAN.md — Gap closure: Wire thank-you page update handler to call run-api PATCH endpoint, pass email from NewsletterForm to thank-you page via URL params (FRONT-05)

### Phase 4: Phase 3 Drizzle Migration
**Goal**: Generate and commit the missing Drizzle migration for Phase 3 schema changes so production deployment (push:false) applies all columns and tables correctly
**Depends on**: Phase 3
**Requirements**: FOUND-02 (gap closure)
**Gap Closure:** Closes INT-01 (missing migration), production deployment flow
**Success Criteria** (what must be TRUE):
  1. A migration file exists in `src/migrations/` covering Phase 3 schema changes (versions/drafts, featuredImage, navItems)
  2. `npx payload migrate` applies the migration cleanly against the existing schema
  3. Production deployment flow (push:false) no longer crashes on missing columns

**Plans**: 1 plan

Plans:
- [ ] 04-01-PLAN.md — Generate Phase 3 Drizzle migration, verify completeness with second migrate:create, confirm build passes (FOUND-02)

### Phase 5: Tech Debt Cleanup
**Goal**: Resolve accumulated tech debt identified in the v1.0 milestone audit — remove stale type casts, consolidate duplicated API helpers, add missing runtime guards, and fix TypeScript errors
**Depends on**: Phase 4
**Requirements**: None (quality improvement)
**Gap Closure:** Addresses 5 tech debt items from v1.0 audit
**Success Criteria** (what must be TRUE):
  1. `subscribeToNewsletter` and `updateSubscriber` from `src/lib/api.ts` are used by NewsletterForm and ThankYouForm (or removed if truly unused)
  2. All `as unknown as Record` type casts for `navItems` and `featuredImage` are replaced with proper typed access from `payload-types.ts`
  3. `fireWebhook.ts` has a runtime guard for `WEBHOOK_SECRET` matching the pattern in email-status route
  4. TypeScript errors in `scripts/smoke-test.ts` and `src/tests/phase2-smoke.ts` are resolved
  5. `npm run build` completes with zero type errors

Plans: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Multi-Tenant Foundation | 3/3 | Complete | 2026-03-11 |
| 2. Content Collections + Tenant Config | 3/3 | Complete | 2026-03-12 |
| 3. Public Frontend + Integrations | 7/7 | Complete | 2026-03-12 |
| 4. Phase 3 Drizzle Migration | 0/1 | Pending | - |
| 5. Tech Debt Cleanup | 0/0 | Pending | - |
