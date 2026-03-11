# CivPulse Campaign CMS

## What This Is

A multi-tenant campaign website platform built on PayloadCMS v3 + Next.js 15, embedded into the CivPulse civic technology suite. Each local political campaign (city council, school board, mayor) gets an isolated public website and admin panel at their own subdomain — all served from a single Payload deployment. Campaign managers with no technical background provision their site, write posts, and send newsletter emails entirely through the Payload admin panel.

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

### Active

<!-- Current scope. Building toward these. -->

**Multi-tenancy**
- [ ] `tenants` collection: one per campaign, with slug and serving domain
- [ ] `@payloadcms/plugin-multi-tenant` wired to `tenants` collection
- [ ] Each campaign admin panel isolated by subdomain (`{slug}.campaigns.civpulse.com/admin`)
- [ ] Tenant-scoped access control: campaign managers only see their own content

**Database Migration**
- [ ] Swap `@payloadcms/db-sqlite` for `@payloadcms/db-postgres`; validate with multi-tenant plugin
- [ ] Database URL configured via environment variable for prod/dev parity
- [ ] Fail loudly at startup if `DATABASE_URL` or `PAYLOAD_SECRET` are missing

**Collections**
- [ ] `posts` collection: blog posts with `publishAs` (web/email/both), `emailSubject`, `emailPreviewText`, `emailStatus`, `emailSentAt`, `scheduledSendAt`; email fields conditionally visible
- [ ] `pages` collection: static pages (homepage, about, issues) using block-based layout builder
- [ ] `media` collection: candidate photos, event images, backed by Cloudflare R2 via `@payloadcms/storage-r2`

**Tenant Global Config**
- [ ] Per-tenant globals: candidate name, office, tagline, primary color, logo/photo, social links, contact email, donation link, active template selection

**Webhooks**
- [ ] Payload fires signed webhook to `POST /api/v1/webhooks/payload/post-published` on run-api when post transitions to published with email delivery
- [ ] Webhook includes post ID, tenant ID, and HMAC signature for run-api to verify authenticity

**Newsletter Subscriber Form**
- [ ] Signup form component POSTs name + email to `POST /api/v1/campaigns/{campaign_id}/subscribers` on run-api
- [ ] Handles success/error states gracefully; tenant-aware (knows its own campaign ID)

**Frontend Templates**
- [ ] 3–5 visual templates: distinct layouts and color schemes, all data-driven from tenant global config
- [ ] Template switching: campaigns can change templates without losing any content
- [ ] Homepage: candidate name, photo, bio, tagline, key issues — seeded from provisioning form

### Out of Scope

- Custom domain connection (CNAME to subdomain) — v2, requires DNS management UI
- Real-time events calendar pulling from run-api — v2, run-api events module not yet scoped
- Donate page with embedded Stripe form — v2, requires run-api donation processing integration
- Mobile app or PWA — web-first
- OAuth / social login for campaign managers — email/password sufficient for v1
- Campaign manager self-signup — provisioning always initiated from run-web (run-api creates the tenant via REST API)

## Context

CivPulse targets small local candidates (city council, school board, small-town mayor) — first-time candidates with no paid staff, minimal budgets, and no technical infrastructure. The platform is deliberately nonpartisan, a direct differentiator against NGPVAN (Democrats) and WinRed (Republicans).

Infrastructure: k3s cluster on bare metal (`thor`, 384GB RAM, 32 cores), PostgreSQL outside k3s. Traefik ingress. Cloudflare DNS + tunneling. GitHub Actions CI/CD over Tailscale. Payload runs as a single Deployment in `civpulse-infra` namespace — all campaigns served by one pod.

run-api owns: subscribers, email delivery (Resend), campaign provisioning (creates Payload tenant via REST API + creates k8s Ingress), CRM, Kubernetes infrastructure management. Payload owns: content, templates, admin editing experience, public-facing websites.

Integration points: Payload → run-api via signed webhooks on post publish; run-api → Payload REST API to seed initial content on provisioning and update post `emailStatus` after send completes.

## Constraints

- **Tech Stack**: PayloadCMS v3, Next.js 15, TypeScript — cannot change
- **Database**: PostgreSQL (preferred) via `@payloadcms/db-postgres`; FerretDB as fallback; standalone MongoDB as last resort — validate multi-tenant plugin compatibility before committing
- **Media Storage**: Cloudflare R2 via `@payloadcms/storage-r2` — no local file storage in production
- **Kubernetes**: Payload runs as single Deployment in `civpulse-infra` namespace; wildcard DNS `*.campaigns.civpulse.com` routes via Cloudflare Tunnel → Traefik → Payload service
- **Provisioning Speed**: New campaign site must be live within 30 seconds of provisioning request
- **Security**: HMAC-signed webhooks; tenant isolation enforced at data layer (not just UI); no empty `PAYLOAD_SECRET` fallback

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single Payload deployment for all tenants | Operational simplicity; 384GB RAM makes resource cost negligible; multi-tenant plugin handles isolation | — Pending |
| Subscriber data in run-api PostgreSQL, not Payload | Subscribers are contacts; contacts belong to CRM layer; Payload owns content not people data | — Pending |
| Email delivery orchestrated by run-api, not Payload | Payload fires webhook → run-api handles Procrastinate job queue, Resend integration, unsubscribe tokens | — Pending |
| PostgreSQL adapter preferred over MongoDB | No new persistence tier; same ZFS-snapshotted instance as rest of platform | — Pending |
| Templates are data-driven, not per-template hardcoded | Campaigns can switch templates without losing content; colors/fonts/candidate info from tenant global config | — Pending |

---
*Last updated: 2026-03-11 after initialization*
