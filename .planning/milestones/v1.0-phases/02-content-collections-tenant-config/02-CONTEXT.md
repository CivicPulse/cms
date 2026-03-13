# Phase 2: Content Collections + Tenant Config - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Define all content types (posts, pages, media) with Cloudflare R2 storage, per-tenant site-settings, and REST API seeding — campaign managers can create blog posts with email delivery fields, build static pages with block-based layouts, upload images, and configure their full site identity. All scoped to their tenant.

Phase does NOT include: webhook firing logic (Phase 3), public frontend rendering (Phase 3), email delivery itself (run-api's responsibility).

</domain>

<decisions>
## Implementation Decisions

### Site-settings collection
- Regular Payload collection (not `isGlobal: true`) — avoids known bug #10740
- One SiteSettings document per tenant, enforced by a `beforeOperation` hook that blocks create if a document for this tenant already exists
- Appears in admin sidebar under a **'Configuration' group** (not listed with Posts/Pages in the main nav)
- Fields grouped as:
  - Candidate identity: candidate name, office running for, tagline, bio
  - Visual branding: primary color (hex), logo upload, candidate photo upload
  - Links + contact: Twitter/Facebook/Instagram URLs, contact email, donation URL
  - Template + display: active template key (select from available template IDs)

### Email publishing workflow
- `emailStatus` values: `draft` | `scheduled` | `sent` | `failed`
- `emailStatus` starts as `draft`; transitions to `scheduled` automatically when a post with `publishAs` of `email` or `both` is saved as published — this is the same event that fires the webhook to run-api
- `emailStatus` is **read-only for campaign managers** — only run-api can update it (via the callback endpoint); rendered as a badge/display in admin, not an editable select
- `scheduledSendAt` is an optional datetime field — campaign managers can set a future time; run-api reads it from the webhook payload to know when to deliver
- `emailSentAt` is set by run-api via callback after successful delivery

### Pages block builder
- All 4 block types included in Phase 2
- **Hero block**: headline (text), subheadline (text), background image (upload from media), CTA button with label + URL
- **Text block**: rich text (Lexical) — for any free-form content section
- **Issues block**: repeating array of `{ title: text, description: text }` — no rich text per issue, plain short descriptions only
- **Contact block**: contact email (text, defaults pull from site-settings), office address (textarea), phone number (text), show newsletter signup form (boolean toggle)
- Pages have: title (text), slug (text, per-tenant unique via `beforeValidate` hook), layout (array of blocks)

### Posts slug and email fields
- Posts get a `slug` field with per-tenant uniqueness enforced via `beforeValidate` hook (cross-tenant duplicate slugs are allowed)
- `publishAs` select: `web` | `email` | `both`
- Email-specific fields (`emailSubject`, `emailPreviewText`, `emailStatus`, `emailSentAt`, `scheduledSendAt`) are conditionally visible via `admin.condition` when `publishAs !== 'web'`

### Media / R2 storage
- `@payloadcms/storage-s3` adapter (not `storage-r2`) — confirmed compatible with Node.js / Cloudflare R2
- All tenant uploads go to a single R2 bucket; files prefixed by `tenantId/` for logical isolation
- Tenant isolation enforced by multi-tenant plugin (same pattern as Posts)
- Accepted mime types: images (jpeg, png, webp, gif, svg) — no raw video uploads in v1

### run-api integration auth
- run-api authenticates using a **super-admin Payload API key** for all Payload REST calls (seeding site-settings, seeding initial content)
- API key stored as env var on run-api side; validated on Payload side via Payload's built-in API key auth on the Users collection
- `WEBHOOK_SECRET` env var on both Payload and run-api sides for HMAC signing/verification
- A dedicated **`POST /api/posts/:id/email-status`** endpoint (Next.js API route) handles run-api's delivery callback — validates HMAC signature, then uses Payload Local API to update `emailStatus` and `emailSentAt`
- `WEBHOOK_SECRET` added to `env.ts` Zod validation (fail loudly at startup if missing)

### Claude's Discretion
- Exact Lexical editor toolbar configuration (nodes, formatting options)
- R2 bucket name and environment variable naming
- Image resizing / thumbnail generation if any
- Error message copy for the `beforeOperation` duplicate-document hook

</decisions>

<specifics>
## Specific Ideas

- The `emailStatus` badge in admin should make it obvious when something is "stuck" — a post that's been `scheduled` for days without becoming `sent` should be visually noticeable to a super-admin
- Site-settings' Configuration group placement: campaign managers should feel like they're configuring "their site" not just editing records, so grouping helps with the mental model
- Issues block deliberately uses plain text (not rich text) so Phase 3 template rendering can style each issue card consistently without cleaning up arbitrary HTML

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/collections/Posts.ts`: Exists with basic `title` + `content` fields. Will be extended in place with slug, publishAs, and email fields. Multi-tenant plugin already registered for posts.
- `src/collections/Tenants.ts`: `tenants` collection has `slug`, `displayName`, `domain`, `status`. Site-settings will reference tenant via the plugin's standard tenant field.
- `src/collections/Users.ts`: `tenantsArrayField` already at top level. `role` field with `super-admin` / `campaign-manager`. API key auth can be enabled on this collection for run-api.
- `src/env.ts`: Zod validation pattern established — `WEBHOOK_SECRET` and R2 env vars should be added here.
- `src/payload.config.ts`: Multi-tenant plugin `collections` object — `pages`, `media`, `site-settings` must be registered here alongside `posts`.

### Established Patterns
- Per-tenant access: `multiTenantPlugin` handles row-level scoping for registered collections; no custom access control needed beyond what Phase 1 established
- `beforeValidate` hooks: pattern is established (Users has `afterOperation`); same hook pattern for per-tenant slug uniqueness
- Env validation: `src/env.ts` with Zod — all new required env vars added there, never via `process.env.X || ''`
- Migration workflow: `push: process.env.NODE_ENV === 'development'` for dev, formal `payload migrate:create` for prod — Phase 2 schema additions need a migration

### Integration Points
- `payload.config.ts` `plugins` array: add new collections to `multiTenantPlugin.collections` map
- `payload.config.ts` `collections` array: register Posts (extended), Pages, Media, SiteSettings
- New Next.js API route for email-status callback: `src/app/(payload)/api/email-status/[id]/route.ts` or similar

</code_context>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-content-collections-tenant-config*
*Context gathered: 2026-03-11*
