# CivPulse Campaign CMS

## What This Is

A multi-tenant campaign website platform built on PayloadCMS v3 + Next.js 15, embedded into the CivPulse civic technology suite. Each local political campaign (city council, school board, mayor) gets an isolated public website and admin panel at their own subdomain — all served from a single Payload deployment. Campaign managers with no technical background provision their site, write posts, and send newsletter emails entirely through the Payload admin panel. Three distinct templates (Classic, Modern, Bold) are available and switchable without content loss.

## Core Value

A campaign manager with zero technical knowledge can launch a live campaign website and send their first newsletter email in under 10 minutes — without any help from a developer.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ PayloadCMS v3 embedded in Next.js 15 — existing scaffold
- ✓ Basic `Posts` collection with Lexical rich text editor — existing scaffold
- ✓ `Users` collection with Payload auth — existing scaffold
- ✓ REST API catch-all at `/api/*` — existing scaffold
- ✓ Admin panel at `/admin` — existing scaffold
- ✓ FOUND-01: Env validation fails on missing vars — v1.0
- ✓ FOUND-02: Postgres migration workflow (push:false in production) — v1.0
- ✓ FOUND-03: Multi-tenant plugin with row-level isolation — v1.0
- ✓ FOUND-04: Tenants collection with slug, displayName, domain, status — v1.0
- ✓ FOUND-05: Campaign manager data scoping (overrideAccess: false) — v1.0
- ✓ FOUND-06: cleanupAfterTenantDelete: false (Postgres bug workaround) — v1.0
- ✓ CONT-01: Posts with publishAs, per-tenant slug uniqueness — v1.0
- ✓ CONT-02: Email fields conditionally visible on Posts — v1.0
- ✓ CONT-03: Pages with block layout builder (Hero, Text, Issues, Contact) — v1.0
- ✓ CONT-04: Media backed by Cloudflare R2 via storage-s3 — v1.0
- ✓ CONF-01: Per-tenant site-settings core fields — v1.0
- ✓ CONF-02: Per-tenant site-settings extended fields (social, donation, template) — v1.0
- ✓ CONF-03: REST API seeding for run-api provisioning — v1.0
- ✓ HOOK-01: HMAC-signed webhook on email publish — v1.0
- ✓ HOOK-02: Webhook payload + skipWebhook infinite-loop guard — v1.0
- ✓ HOOK-03: Email status callback endpoint — v1.0
- ✓ FRONT-01: Subdomain middleware + tenant context injection — v1.0
- ✓ FRONT-02: Homepage renders candidate info from site-settings — v1.0
- ✓ FRONT-03: Blog feed with published posts — v1.0
- ✓ FRONT-04: Post page with structured metadata — v1.0
- ✓ FRONT-05: Newsletter signup to run-api subscriber endpoint — v1.0
- ✓ FRONT-06: 3 distinct templates (Classic/Modern/Bold), switchable — v1.0

### Active

<!-- Current scope. Building toward these. -->

(None — next milestone not yet scoped)

### Out of Scope

- Custom domain connection (CNAME to subdomain) — v2, requires DNS management UI
- Real-time events calendar pulling from run-api — v2, run-api events module not yet scoped
- Donate page with embedded Stripe form — v2, requires run-api donation processing integration
- Mobile app or PWA — web-first
- OAuth / social login for campaign managers — email/password sufficient
- Campaign manager self-signup — provisioning always initiated from run-web
- Custom CSS per campaign — anti-feature for non-technical users
- Standalone MongoDB — PostgreSQL validated successfully
- Email preview in admin showing subscriber count — v2
- Template editor for custom color/font overrides — v2

## Context

Shipped v1.0 with 5,173 LOC TypeScript across 168 files.
Tech stack: PayloadCMS v3, Next.js 15, PostgreSQL (via @payloadcms/db-postgres), Cloudflare R2 (via @payloadcms/storage-s3), Tailwind CSS v4, Drizzle ORM migrations.

Infrastructure: k3s cluster on bare metal (`thor`, 384GB RAM, 32 cores), PostgreSQL outside k3s. Traefik ingress. Cloudflare DNS + tunneling. GitHub Actions CI/CD over Tailscale. Payload runs as a single Deployment in `civpulse-infra` namespace — all campaigns served by one pod.

run-api owns: subscribers, email delivery (Resend), campaign provisioning (creates Payload tenant via REST API + creates k8s Ingress), CRM, Kubernetes infrastructure management. Payload owns: content, templates, admin editing experience, public-facing websites.

Integration points: Payload → run-api via HMAC-signed webhooks on post publish; run-api → Payload REST API to seed initial content on provisioning and update post `emailStatus` after send completes.

Known tech debt: `push: true` in development (deliberate DX choice — production enforces push:false via Drizzle migrations).

## Constraints

- **Tech Stack**: PayloadCMS v3, Next.js 15, TypeScript — cannot change
- **Database**: PostgreSQL via `@payloadcms/db-postgres` — validated in v1.0
- **Media Storage**: Cloudflare R2 via `@payloadcms/storage-s3` — no local file storage in production
- **Kubernetes**: Payload runs as single Deployment in `civpulse-infra` namespace; wildcard DNS `*.campaigns.civpulse.com` routes via Cloudflare Tunnel → Traefik → Payload service
- **Provisioning Speed**: New campaign site must be live within 30 seconds of provisioning request
- **Security**: HMAC-signed webhooks; tenant isolation enforced at data layer (not just UI); no empty `PAYLOAD_SECRET` fallback

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single Payload deployment for all tenants | Operational simplicity; 384GB RAM makes resource cost negligible; multi-tenant plugin handles isolation | ✓ Good — isolation verified via smoke tests |
| Subscriber data in run-api PostgreSQL, not Payload | Subscribers are contacts; contacts belong to CRM layer; Payload owns content not people data | ✓ Good — clean separation of concerns |
| Email delivery orchestrated by run-api, not Payload | Payload fires webhook → run-api handles Procrastinate job queue, Resend integration, unsubscribe tokens | ✓ Good — skipWebhook guard prevents infinite loops |
| PostgreSQL adapter preferred over MongoDB | No new persistence tier; same ZFS-snapshotted instance as rest of platform | ✓ Good — Drizzle migrations work well |
| Templates are data-driven, not per-template hardcoded | Campaigns can switch templates without losing content; colors/fonts/candidate info from tenant config | ✓ Good — 3 templates shipped with shared component layer |
| @payloadcms/storage-s3 for R2 (not storage-r2) | storage-r2 requires Cloudflare Workers runtime; storage-s3 works in Node.js via S3-compatible API | ✓ Good — standard S3 client compatible |
| cleanupAfterTenantDelete: false | Postgres transaction abort bug #14576; soft-delete via archived status instead | ✓ Good — workaround stable |
| Zod v4 for env validation | z.object().parse() API compatible; Payload does not pin zod as peer dep | ✓ Good — startup validation catches missing vars |
| Tailwind v4 CSS-first config | No tailwind.config.js; theming via @theme in globals.css | ✓ Good — simpler config |
| Server actions for newsletter forms | Removes runApiUrl prop drilling through 15-file chain; Next.js-native pattern | ✓ Good — cleaner architecture |
| Per-tenant slug uniqueness via field validate (not unique: true) | Allows cross-tenant slug reuse; database unique constraint would be global | ✓ Good — correct multi-tenant behavior |
| Fire-and-forget webhook via fetch().catch() | Does not block CMS response on webhook failure | ✓ Good — non-blocking publish flow |

---
*Last updated: 2026-03-13 after v1.0 milestone*
