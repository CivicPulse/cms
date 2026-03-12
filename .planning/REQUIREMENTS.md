# Requirements: CivPulse Campaign CMS

**Defined:** 2026-03-11
**Core Value:** A campaign manager with zero technical knowledge can launch a live campaign website and send their first newsletter email in under 10 minutes — without any help from a developer.

## v1 Requirements

### Foundation

- [x] **FOUND-01**: App fails to start with clear error if `PAYLOAD_SECRET` or `DATABASE_URL` are missing (no silent empty-string fallbacks)
- [x] **FOUND-02**: Database migrated from `@payloadcms/db-sqlite` to `@payloadcms/db-postgres` with `push: false` and migration workflow established
- [x] **FOUND-03**: `@payloadcms/plugin-multi-tenant` wired to `tenants` collection; tenant isolation enforced at row level for all content collections
- [x] **FOUND-04**: `tenants` collection defined with `slug`, `displayName`, `domain`, `status` fields
- [x] **FOUND-05**: Campaign manager users restricted to their tenant's data in both admin UI and Local API queries (`overrideAccess: false` in all internal tenant-scoped queries)
- [x] **FOUND-06**: `cleanupAfterTenantDelete: false` set in plugin config (prevents Postgres transaction crash bug)

### Content Collections

- [x] **CONT-01**: `posts` collection: title, content (Lexical), `publishAs` select (web/email/both), slug with per-tenant uniqueness validation
- [x] **CONT-02**: `posts` collection email fields conditionally visible: `emailSubject`, `emailPreviewText`, `emailStatus`, `emailSentAt`, `scheduledSendAt`
- [x] **CONT-03**: `pages` collection: title, slug (per-tenant unique), layout builder with block-based components (hero, text, issues, contact)
- [x] **CONT-04**: `media` collection: file uploads backed by Cloudflare R2 via `@payloadcms/storage-s3`; tenant-scoped

### Tenant Config

- [x] **CONF-01**: Per-tenant site-settings collection (using plugin `isGlobal: true` or one-per-tenant fallback): candidate name, office, tagline, primary color, logo/photo
- [x] **CONF-02**: Per-tenant site-settings includes: social links, contact email, donation URL, active template key
- [x] **CONF-03**: run-api can seed site-settings for a new tenant via Payload REST API during campaign provisioning

### Webhooks

- [x] **HOOK-01**: `posts` collection fires HMAC-signed webhook to run-api `POST /api/v1/webhooks/payload/post-published` when post transitions to `published` status with `publishAs` including email
- [x] **HOOK-02**: Webhook includes `postId`, `tenantId`, `publishAs`, and HMAC signature; uses `context` flag to prevent infinite loop on `emailStatus` update
- [x] **HOOK-03**: Payload REST endpoint to accept run-api callback updating `emailStatus` and `emailSentAt` on a post after send completes

### Frontend

- [ ] **FRONT-01**: Next.js middleware resolves tenant from request subdomain and injects tenant context into all Server Components
- [ ] **FRONT-02**: Public homepage renders candidate name, photo, tagline, office, and issues — all data-driven from tenant site-settings
- [ ] **FRONT-03**: Public blog feed renders published posts (web or both) for the current tenant
- [ ] **FRONT-04**: Individual post page renders post content with structured metadata
- [ ] **FRONT-05**: Newsletter signup form POSTs name + email to `POST /api/v1/campaigns/{campaign_id}/subscribers` on run-api; handles success/error states
- [ ] **FRONT-06**: 3 distinct frontend templates (different layout + color personality); all data-driven from tenant site-settings; campaigns can switch templates without content loss

## v2 Requirements

### Integrations

- **INTG-01**: Donate page with embedded Stripe form tied to run-api donation processing
- **INTG-02**: Events page pulling from run-api events module
- **INTG-03**: Email preview in Payload admin showing subscriber count ("will send to ~N subscribers")

### Customization

- **CUST-01**: Custom domain connection (CNAME to subdomain, DNS management UI)
- **CUST-02**: Template editor — custom color/font overrides without switching templates

## Out of Scope

| Feature | Reason |
|---------|--------|
| Campaign manager self-signup | Provisioning always initiated from run-web; Payload tenant created by run-api |
| OAuth login for campaign managers | Email/password sufficient; reduces attack surface |
| Real-time features (WebSockets) | Not needed for v1 static/SSR sites |
| Mobile app | Web-first |
| Built-in email delivery in Payload | run-api owns delivery; Payload only fires webhooks |
| Custom CSS per campaign | Anti-feature for non-technical users; creates support burden |
| Standalone MongoDB | Last resort only; adds second persistence tier |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FOUND-01 | Phase 1: Multi-Tenant Foundation | Complete |
| FOUND-02 | Phase 1: Multi-Tenant Foundation | Complete |
| FOUND-03 | Phase 1: Multi-Tenant Foundation | Complete |
| FOUND-04 | Phase 1: Multi-Tenant Foundation | Complete |
| FOUND-05 | Phase 1: Multi-Tenant Foundation | Complete |
| FOUND-06 | Phase 1: Multi-Tenant Foundation | Complete |
| CONT-01 | Phase 2: Content Collections + Tenant Config | Complete |
| CONT-02 | Phase 2: Content Collections + Tenant Config | Complete |
| CONT-03 | Phase 2: Content Collections + Tenant Config | Complete |
| CONT-04 | Phase 2: Content Collections + Tenant Config | Complete |
| CONF-01 | Phase 2: Content Collections + Tenant Config | Complete |
| CONF-02 | Phase 2: Content Collections + Tenant Config | Complete |
| CONF-03 | Phase 2: Content Collections + Tenant Config | Complete |
| HOOK-01 | Phase 3: Public Frontend + Integrations | Complete |
| HOOK-02 | Phase 3: Public Frontend + Integrations | Complete |
| HOOK-03 | Phase 3: Public Frontend + Integrations | Complete |
| FRONT-01 | Phase 3: Public Frontend + Integrations | Pending |
| FRONT-02 | Phase 3: Public Frontend + Integrations | Pending |
| FRONT-03 | Phase 3: Public Frontend + Integrations | Pending |
| FRONT-04 | Phase 3: Public Frontend + Integrations | Pending |
| FRONT-05 | Phase 3: Public Frontend + Integrations | Pending |
| FRONT-06 | Phase 3: Public Frontend + Integrations | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---
*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after roadmap creation (3-phase coarse structure)*
