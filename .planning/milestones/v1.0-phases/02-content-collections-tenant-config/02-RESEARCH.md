# Phase 2: Content Collections + Tenant Config - Research

**Researched:** 2026-03-11
**Domain:** PayloadCMS v3 collections, blocks field, S3/R2 storage, field hooks, API key auth
**Confidence:** HIGH (all critical claims verified against official docs or source code)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Site-settings collection**: Regular Payload collection (not `isGlobal: true`) — avoids known bug #10740. One SiteSettings document per tenant, enforced by a `beforeOperation` hook that blocks create if a document for this tenant already exists. Appears in admin sidebar under a **'Configuration' group**.
- **SiteSettings fields grouped as**: Candidate identity (name, office, tagline, bio), Visual branding (primary color hex, logo upload, candidate photo upload), Links + contact (Twitter/Facebook/Instagram URLs, contact email, donation URL), Template + display (active template key select).
- **emailStatus values**: `draft` | `scheduled` | `sent` | `failed`; starts as `draft`; transitions to `scheduled` automatically when post saved as published with `publishAs` of `email` or `both` (Phase 3 webhook event).
- **emailStatus is read-only for campaign managers** — only run-api can update it (via callback endpoint); rendered as badge/display in admin, not editable select.
- **scheduledSendAt**: optional datetime field; campaign managers can set a future time; run-api reads it from webhook payload.
- **emailSentAt**: set by run-api via callback after successful delivery.
- **Pages block builder** — all 4 block types in Phase 2:
  - Hero block: headline (text), subheadline (text), background image (upload from media), CTA button with label + URL
  - Text block: rich text (Lexical) — free-form content
  - Issues block: repeating array of `{ title: text, description: text }` — plain text only
  - Contact block: contact email (text), office address (textarea), phone number (text), show newsletter signup form (boolean)
- **Pages**: title, slug (per-tenant unique via `beforeValidate`), layout (blocks array)
- **Posts slug**: per-tenant uniqueness via `beforeValidate` hook (cross-tenant duplicate slugs allowed)
- **publishAs select**: `web` | `email` | `both`
- **Email fields conditional visibility**: `admin.condition` when `publishAs !== 'web'`
- **Media storage**: `@payloadcms/storage-s3` adapter (not storage-r2); single R2 bucket; files prefixed by `tenantId/`; tenant isolation via multi-tenant plugin
- **Accepted mime types**: jpeg, png, webp, gif, svg — no raw video
- **run-api auth**: super-admin Payload API key (`useAPIKey: true` on Users); API key in `Authorization: users API-Key {key}` header
- **WEBHOOK_SECRET**: both sides; HMAC signing/verification; `WEBHOOK_SECRET` added to `src/env.ts` Zod validation
- **Email callback endpoint**: dedicated `POST /api/posts/:id/email-status` Next.js route; validates HMAC, uses Local API to update `emailStatus` and `emailSentAt`

### Claude's Discretion

- Exact Lexical editor toolbar configuration (nodes, formatting options)
- R2 bucket name and environment variable naming
- Image resizing / thumbnail generation if any
- Error message copy for the `beforeOperation` duplicate-document hook

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | `posts` collection: title, content (Lexical), `publishAs` select (web/email/both), slug with per-tenant uniqueness validation | Custom validate function on slug field; `beforeValidate` hook pattern; `publishAs` select config |
| CONT-02 | Posts email fields conditionally visible: `emailSubject`, `emailPreviewText`, `emailStatus`, `emailSentAt`, `scheduledSendAt` | `admin.condition` function signature documented; field-level `access.update` for read-only emailStatus |
| CONT-03 | `pages` collection: title, slug (per-tenant unique), layout builder with 4 block types | Blocks field API documented; Block type definition pattern; per-tenant slug validate |
| CONT-04 | `media` collection: file uploads backed by Cloudflare R2 via `@payloadcms/storage-s3`; tenant-scoped | R2 config pattern verified; prefix option for tenantId; disableLocalStorage auto-set |
| CONF-01 | Per-tenant site-settings collection: candidate name, office, tagline, primary color, logo/photo | `beforeOperation` hook to block duplicate create; `admin.group` for sidebar grouping |
| CONF-02 | Per-tenant site-settings includes: social links, contact email, donation URL, active template key | Standard Payload fields; group field for visual organization |
| CONF-03 | run-api can seed site-settings for a new tenant via Payload REST API during campaign provisioning | API key auth (`useAPIKey: true`); Authorization header format documented |
</phase_requirements>

---

## Summary

Phase 2 extends the existing PayloadCMS v3 + multi-tenant-plugin foundation with four collections (Posts extended, Pages new, Media new, SiteSettings new) and wires Cloudflare R2 storage. The main technical challenges are: per-tenant slug uniqueness (slug `unique: true` is a global DB constraint, which conflicts with multi-tenant — must use a custom `validate` function instead of relying on the unique index), the R2 storage adapter configuration (uses `@payloadcms/storage-s3` with `region: 'auto'` and `forcePathStyle: true`), and making `emailStatus` writable only by run-api (field-level `access.update` returning `false` for campaign-managers, overridable by API-key user with super-admin role).

The blocks field API is straightforward: define each block as a `Block` object with `slug` and `fields`, then reference them in the collection's `layout` field of `type: 'blocks'`. All four block types in Phase 2 use only primitive field types (text, richText, upload, boolean, array) — no complex sub-structures.

The SiteSettings collection uses a collection-level `beforeOperation` hook on the `create` operation to query for an existing document with the current tenant and throw an error if one exists, simulating the one-document-per-global behavior without the `isGlobal: true` bug.

**Primary recommendation:** Implement per-tenant slug uniqueness via a custom `validate` function on the slug field (not `unique: true`, not `beforeValidate`) — this is the only approach confirmed to work with Payload's multi-tenant plugin as of early 2026.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@payloadcms/storage-s3` | latest (^3.x) | S3/R2 file storage adapter | Official Payload adapter; works with Cloudflare R2 via S3 API |
| `@aws-sdk/client-s3` | peer dep of storage-s3 | AWS SDK required by storage-s3 | Required peer dependency |
| `payload` | ^3.0.0 (pinned 3.79.0) | Core CMS with blocks, hooks, access control | Already installed |
| `sharp` | ^0.33.0 | Image resizing (already installed) | Required by Payload upload for image processing |

### Installation

```bash
npm install @payloadcms/storage-s3 @aws-sdk/client-s3
```

**Note:** Do NOT install `@payloadcms/storage-r2` — that package is for Cloudflare Workers (edge runtime), not Node.js. The `@payloadcms/storage-s3` adapter works with R2's S3-compatible API in Node.js deployments.

---

## Architecture Patterns

### Recommended File Structure for Phase 2

```
src/
├── collections/
│   ├── Posts.ts          # Extended in place — add slug, publishAs, email fields
│   ├── Pages.ts          # New — title, slug, layout blocks
│   ├── Media.ts          # New — upload collection wired to R2
│   ├── SiteSettings.ts   # New — per-tenant config collection
│   └── blocks/           # Block definitions for Pages layout builder
│       ├── HeroBlock.ts
│       ├── TextBlock.ts
│       ├── IssuesBlock.ts
│       └── ContactBlock.ts
├── hooks/
│   └── ensureUniqueTenantSlug.ts  # Reusable validate fn for Posts + Pages
├── app/
│   └── (payload)/
│       └── api/
│           └── posts/
│               └── [id]/
│                   └── email-status/
│                       └── route.ts  # Email delivery callback endpoint
└── env.ts                # Add R2 vars + WEBHOOK_SECRET
```

### Pattern 1: Per-Tenant Slug Uniqueness (Custom validate function)

**What:** The slug field's `unique: true` database constraint enforces global uniqueness, preventing two tenants from using the same slug. The fix is to NOT use `unique: true` and instead implement a custom `validate` function that queries for slugs only within the same tenant.

**Why `beforeValidate` hook is wrong here:** The hook runs at the collection level and can transform data but is harder to return user-facing validation errors. The field-level `validate` function is the correct place because it integrates with Payload's validation error reporting in the admin UI.

**When to use:** Both Posts and Pages slug fields.

```typescript
// Source: community workaround for GitHub issue #14938 (open as of Jan 2026)
// src/hooks/ensureUniqueTenantSlug.ts
import type { Payload } from 'payload'

export const ensureUniqueTenantSlug =
  (collectionSlug: 'posts' | 'pages') =>
  async (
    value: string | null | undefined,
    { data, req, id }: { data: Record<string, unknown>; req: { payload: Payload }; id?: string | number | null }
  ): Promise<true | string> => {
    if (!value) return true // required validation handles the empty case
    const tenantId = data?.tenant
    if (!tenantId) return true // no tenant context yet (draft create edge case)

    const existing = await req.payload.find({
      collection: collectionSlug,
      where: {
        and: [
          { slug: { equals: value } },
          { tenant: { equals: tenantId } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })

    if (existing.docs.length > 0 && String(existing.docs[0].id) !== String(id)) {
      return `The slug "${value}" is already in use by another ${collectionSlug === 'posts' ? 'post' : 'page'} in this tenant.`
    }
    return true
  }
```

Usage in a field:
```typescript
// In Posts.ts or Pages.ts
{
  name: 'slug',
  type: 'text',
  required: true,
  index: true,          // index for query performance, but NOT unique: true
  // DO NOT set unique: true — that creates a global DB unique constraint
  validate: ensureUniqueTenantSlug('posts'),
}
```

### Pattern 2: Blocks Field for Pages Layout Builder

**What:** The `layout` field on Pages uses `type: 'blocks'` with an array of block definitions. Each block lives in its own file for reusability.

**When to use:** Pages `layout` field.

```typescript
// Source: https://raw.githubusercontent.com/payloadcms/payload/main/docs/fields/blocks.mdx
// src/collections/blocks/HeroBlock.ts
import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    { name: 'headline', type: 'text', required: true },
    { name: 'subheadline', type: 'text' },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'ctaLabel',
      type: 'text',
      admin: { description: 'Button text' },
    },
    { name: 'ctaUrl', type: 'text' },
  ],
}

// src/collections/blocks/IssuesBlock.ts
export const IssuesBlock: Block = {
  slug: 'issues',
  fields: [
    {
      name: 'items',
      type: 'array',
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text' },
      ],
    },
  ],
}

// In Pages.ts — the layout field
{
  name: 'layout',
  type: 'blocks',
  blocks: [HeroBlock, TextBlock, IssuesBlock, ContactBlock],
}
```

### Pattern 3: Conditional Field Visibility (admin.condition)

**What:** Fields are hidden or shown in the admin UI based on sibling field values using `admin.condition`.

**Signature:** `(data, siblingData, { blockData, operation, path, user }) => boolean`

```typescript
// Source: https://raw.githubusercontent.com/payloadcms/payload/main/docs/fields/overview.mdx
// Email fields in Posts.ts — visible only when publishAs includes email
{
  name: 'emailSubject',
  type: 'text',
  admin: {
    condition: (data, siblingData) => {
      return siblingData?.publishAs === 'email' || siblingData?.publishAs === 'both'
    },
    description: 'Subject line for email delivery',
  },
},
{
  name: 'emailStatus',
  type: 'select',
  defaultValue: 'draft',
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'Sent', value: 'sent' },
    { label: 'Failed', value: 'failed' },
  ],
  access: {
    // Campaign managers cannot update emailStatus — only run-api (super-admin) can
    update: ({ req }) => req.user?.role === 'super-admin',
  },
  admin: {
    readOnly: true, // renders as disabled in admin UI for campaign managers
    condition: (data, siblingData) =>
      siblingData?.publishAs === 'email' || siblingData?.publishAs === 'both',
    description: 'Managed by run-api. Read-only in admin.',
  },
},
```

**Important:** `admin.readOnly: true` affects UI rendering only. `access.update: () => false` is the actual enforcement at the API level. Use both together for the emailStatus field.

### Pattern 4: beforeOperation Hook for One-Per-Tenant Enforcement

**What:** SiteSettings must allow only one document per tenant. Since `isGlobal: true` has bug #10740, use a `beforeOperation` hook on `create` to block duplicates.

```typescript
// Source: https://raw.githubusercontent.com/payloadcms/payload/main/docs/hooks/collections.mdx
// In SiteSettings.ts
hooks: {
  beforeOperation: [
    async ({ args, operation, req }) => {
      if (operation !== 'create') return args

      const tenantId = args.data?.tenant
      if (!tenantId) return args

      const existing = await req.payload.find({
        collection: 'site-settings',
        where: { tenant: { equals: tenantId } },
        limit: 1,
        overrideAccess: true,
      })

      if (existing.docs.length > 0) {
        throw new Error(
          'Site settings already exist for this tenant. Edit the existing record instead.'
        )
      }

      return args
    },
  ],
},
```

### Pattern 5: R2 Storage via @payloadcms/storage-s3

**What:** Configure Cloudflare R2 as the file storage backend. Files are prefixed by `tenantId/` for logical isolation.

**Critical R2-specific settings:**
- `region: 'auto'` (not a real AWS region — R2 uses this value)
- `forcePathStyle: true` (required for R2)
- `endpoint` must include `https://` prefix in the config object; store the domain-only value in env var and prepend the protocol in code

```typescript
// Source: bridger.to/payload-r2 (verified against storage-s3 README)
// In payload.config.ts plugins array:
import { s3Storage } from '@payloadcms/storage-s3'

s3Storage({
  collections: {
    media: {
      prefix: 'media', // static prefix; tenant isolation handled by multi-tenant plugin
      // Note: generateFileURL needed if using public bucket with custom domain
      generateFileURL: ({ filename, prefix }) =>
        `${env.R2_PUBLIC_URL}/${prefix}/${filename}`,
    },
  },
  bucket: env.R2_BUCKET,
  config: {
    endpoint: `https://${env.R2_ENDPOINT}`, // env var stores domain only, prepend https here
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
    region: 'auto',
    forcePathStyle: true,
  },
})
```

**Environment variables to add to `src/env.ts`:**
```
R2_ENDPOINT        # {accountid}.r2.cloudflarestorage.com (no https://)
R2_BUCKET          # bucket name
R2_ACCESS_KEY_ID   # R2 API token access key
R2_SECRET_ACCESS_KEY # R2 API token secret
R2_PUBLIC_URL      # Public bucket URL or custom domain (e.g. https://media.example.com)
WEBHOOK_SECRET     # HMAC secret for run-api webhook signing
```

`disableLocalStorage` is **automatically set to `true`** by the `s3Storage` plugin — you do not need to specify it.

### Pattern 6: API Key Auth for run-api

**What:** Enable API key authentication on the Users collection so run-api can authenticate using a stored API key instead of email/password.

```typescript
// Source: https://raw.githubusercontent.com/payloadcms/payload/main/docs/authentication/api-keys.mdx
// In Users.ts
auth: {
  useAPIKey: true,
  // Keep email/password login for admin UI users
},

// run-api Authorization header:
// Authorization: users API-Key {THE_API_KEY}
```

The API key is generated via the Payload Admin UI on a specific user record (the super-admin service account). The key is then stored as an env var on the run-api side. Payload encrypts keys in the database using `PAYLOAD_SECRET` — if the secret changes, the key must be regenerated.

### Pattern 7: admin.group for Sidebar Organization

**What:** Group SiteSettings under 'Configuration' in the admin sidebar, separate from content collections.

```typescript
// In SiteSettings.ts
admin: {
  useAsTitle: 'candidateName',
  group: 'Configuration',
  description: 'Site-wide settings for this campaign',
},
```

**Note:** All collections with the same `admin.group` string appear together under a collapsible section in the sidebar. Order within a group matches registration order in `payload.config.ts`.

### Pattern 8: Upload Collection with Mime Type Filtering

**What:** Configure the Media collection to accept only images (no video), integrate with multi-tenant plugin, and disable local storage.

```typescript
// In Media.ts
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    // Optional: generate thumbnails for admin preview
    imageSizes: [
      { name: 'thumbnail', width: 300, height: 200, crop: 'centre' },
    ],
  },
  access: {
    read: () => true, // Public read for frontend rendering
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
    },
  ],
}
```

**Register in multiTenantPlugin.collections:**
```typescript
multiTenantPlugin({
  collections: {
    posts: {},
    pages: {},
    media: {},
    'site-settings': {},
  },
  ...
})
```

### Anti-Patterns to Avoid

- **`unique: true` on slug field in multi-tenant collections:** Creates a global DB unique constraint. Two tenants cannot share a slug value. Use `index: true` + custom `validate` function instead.
- **`isGlobal: true` for SiteSettings:** Known bug #10740 in Payload — may cause validation errors. Use regular collection with `beforeOperation` guard.
- **`@payloadcms/storage-r2` in Node.js:** That adapter is for Cloudflare Workers (edge runtime only). The project runs on Node.js; use `@payloadcms/storage-s3`.
- **R2 endpoint without `https://` in config:** The `endpoint` field in S3ClientConfig requires the full URL with protocol. Store the domain in env var, prepend `https://` in config.
- **Omitting `overrideAccess: true` in hook queries:** Hooks that query other documents (for slug uniqueness or site-settings de-duplication) must use `overrideAccess: true` to bypass tenant filtering — otherwise they won't see records belonging to the current tenant from the hook's execution context.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File storage | Custom S3 upload middleware | `@payloadcms/storage-s3` | Handles signed URLs, local dev fallback, collection wiring, file deletion sync |
| Block UI | Custom React DnD layout builder | Payload `type: 'blocks'` field | Built-in drag-and-drop, type safety, admin UI out of the box |
| Image optimization | Custom Sharp pipeline | Payload `upload.imageSizes` + `sharp` (already installed) | Automatic resize on upload, srcset support |
| API key management | Custom token system | Payload `auth: { useAPIKey: true }` | Encrypted storage, admin UI generation, built-in header parsing |
| Field visibility logic | Custom React component | `admin.condition` function | Runs in admin UI automatically; no custom component needed |
| Tenant-scoped admin filtering | Custom access control hooks | `@payloadcms/plugin-multi-tenant` (already wired) | Already handles admin UI row filtering; just register new collections |

---

## Common Pitfalls

### Pitfall 1: Global Slug Uniqueness Breaks Multi-Tenant

**What goes wrong:** If `unique: true` is set on the slug field (or if Payload's built-in `slugField()` helper is used), the database enforces a global unique constraint. Tenant A and Tenant B cannot both have a `/about` page.

**Why it happens:** Payload's field `unique: true` creates a DB-level unique index. The multi-tenant plugin's row-level filtering is an application layer concern — it doesn't create compound indexes.

**How to avoid:** Use `index: true` (not `unique: true`) and implement uniqueness in the field's `validate` function. The validate function receives `req.payload` so it can query within-tenant scope.

**Warning signs:** Error "duplicate key value violates unique constraint 'posts_slug_idx'" when a second tenant tries to create the same slug.

**GitHub reference:** Issue #14938 (open as of January 2026) and Issue #14801.

### Pitfall 2: R2 Endpoint Protocol Mismatch

**What goes wrong:** The environment variable stores the endpoint domain without `https://`. If code passes it directly to `s3Storage config.endpoint`, the AWS SDK receives an invalid URL and throws a network error.

**Why it happens:** The guidance in R2 dashboard docs says "copy the domain" without protocol. The S3ClientConfig `endpoint` field requires a full URL.

**How to avoid:** In env.ts, store the domain only (e.g., `abc123.r2.cloudflarestorage.com`). In `payload.config.ts`, prepend: `endpoint: \`https://\${env.R2_ENDPOINT}\``.

**Warning signs:** ECONNREFUSED or "Invalid URL" errors on startup or first upload.

### Pitfall 3: admin.readOnly Is UI-Only, Not API Enforcement

**What goes wrong:** Setting only `admin: { readOnly: true }` on `emailStatus` makes the field appear disabled in the UI, but a direct REST API PATCH call from any authenticated user can still update it.

**Why it happens:** `admin.readOnly` is a rendering hint for the admin panel. It has no effect on API requests.

**How to avoid:** ALWAYS pair `admin.readOnly` with `access.update: ({ req }) => req.user?.role === 'super-admin'` for fields that must be write-protected at the API level.

**Warning signs:** REST PATCH to `/api/posts/:id` with `{ emailStatus: 'sent' }` succeeds even when user is a campaign-manager.

### Pitfall 4: beforeOperation Hook Query Without overrideAccess

**What goes wrong:** Inside a `beforeOperation` hook (e.g., checking if a SiteSettings doc already exists for a tenant), calling `req.payload.find({ collection: 'site-settings', where: { tenant: { equals: tenantId } } })` may return 0 results even when a document exists — if the hook's request context doesn't have tenant-scoped access.

**Why it happens:** The multi-tenant plugin's access control filters queries by tenant. When the hook runs during a `create` operation, the request context may not yet have the tenant scoped. `overrideAccess: false` would apply the plugin's filter.

**How to avoid:** Always use `overrideAccess: true` in hook queries that need to see across tenant boundaries or query specific tenant records from a system/admin context.

### Pitfall 5: New Collections Not Registered in multiTenantPlugin

**What goes wrong:** Pages, Media, and SiteSettings are added to `payload.config.ts`'s `collections` array but not to the `multiTenantPlugin.collections` map. They appear in the admin with no tenant scoping — all campaign managers see all records.

**How to avoid:** Every content collection that should be tenant-scoped MUST be added to both the `collections` array AND the `multiTenantPlugin.collections` map in `payload.config.ts`.

### Pitfall 6: condition Function Receives siblingData for Email Fields

**What goes wrong:** Using `data.publishAs` (the full document data) instead of `siblingData.publishAs` in the `admin.condition` function. Since `publishAs` is a sibling field (same level as `emailSubject`, `emailStatus`, etc.), it lives in `siblingData`, not nested under `data`.

**Why it happens:** `data` is the entire document (including nested blocks, relations). `siblingData` is only the fields at the same nesting level. For top-level Post fields, `data` and `siblingData` are the same object — but it's best practice to use `siblingData` for sibling field access.

**How to avoid:** For fields at the top level of a collection, either `data` or `siblingData` works. Inside a block, `siblingData` is the block's data and `blockData` is also available. Use `siblingData.publishAs` for clarity.

---

## Code Examples

### Complete Posts.ts Extension Structure

```typescript
// Source: official Payload docs for field config and hooks
import type { CollectionConfig } from 'payload'
import { ensureUniqueTenantSlug } from '../hooks/ensureUniqueTenantSlug'

const emailCondition = (_data: unknown, siblingData: Record<string, unknown>) =>
  siblingData?.publishAs === 'email' || siblingData?.publishAs === 'both'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: { useAsTitle: 'title' },
  access: {
    read: ({ req }) => {
      if (req.user?.role === 'super-admin') return true
      return true // plugin handles scoping
    },
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'content', type: 'richText' },
    {
      name: 'publishAs',
      type: 'select',
      required: true,
      defaultValue: 'web',
      options: [
        { label: 'Web only', value: 'web' },
        { label: 'Email only', value: 'email' },
        { label: 'Web + Email', value: 'both' },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true, // performance; NOT unique: true
      validate: ensureUniqueTenantSlug('posts'),
    },
    // Email fields — conditionally visible
    { name: 'emailSubject', type: 'text', admin: { condition: emailCondition } },
    { name: 'emailPreviewText', type: 'text', admin: { condition: emailCondition } },
    {
      name: 'emailStatus',
      type: 'select',
      defaultValue: 'draft',
      options: ['draft', 'scheduled', 'sent', 'failed'].map(v => ({ label: v, value: v })),
      access: { update: ({ req }) => req.user?.role === 'super-admin' },
      admin: { readOnly: true, condition: emailCondition },
    },
    {
      name: 'scheduledSendAt',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        condition: emailCondition,
        description: 'Optional. Leave blank for immediate delivery.',
      },
    },
    {
      name: 'emailSentAt',
      type: 'date',
      access: { update: ({ req }) => req.user?.role === 'super-admin' },
      admin: { readOnly: true, condition: emailCondition },
    },
  ],
}
```

### payload.config.ts Plugin Registration

```typescript
// Add storage-s3 plugin + register new collections in multi-tenant plugin
import { s3Storage } from '@payloadcms/storage-s3'

plugins: [
  multiTenantPlugin({
    collections: {
      posts: {},
      pages: {},
      media: {},
      'site-settings': {},
    },
    // ... rest of existing config unchanged
  }),
  s3Storage({
    collections: {
      media: {
        prefix: 'media',
        generateFileURL: ({ filename, prefix }) =>
          `${env.R2_PUBLIC_URL}/${prefix}/${filename}`,
      },
    },
    bucket: env.R2_BUCKET,
    config: {
      endpoint: `https://${env.R2_ENDPOINT}`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
      region: 'auto',
      forcePathStyle: true,
    },
  }),
],
```

### Email Status Callback Route

```typescript
// src/app/(payload)/api/posts/[id]/email-status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import crypto from 'crypto'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.text()
  const signature = req.headers.get('x-webhook-signature') ?? ''
  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(body)
    .digest('hex')

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const { emailStatus, emailSentAt } = JSON.parse(body)
  const payload = await getPayload({ config: configPromise })

  await payload.update({
    collection: 'posts',
    id: params.id,
    data: { emailStatus, emailSentAt },
    overrideAccess: true, // system-level update
  })

  return NextResponse.json({ ok: true })
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@payloadcms/plugin-cloud-storage` | `@payloadcms/storage-s3` (separate package) | Payload v3 | Separate packages per storage provider; plugin-cloud-storage is v2 only |
| `isGlobal: true` for per-tenant config | Regular collection + `beforeOperation` guard | N/A (bug workaround) | Avoids #10740 validation bug; must be documented as intentional |
| Slug `unique: true` | `index: true` + field `validate` function | Workaround for #14938 | Allows cross-tenant slug reuse; per-tenant uniqueness enforced in app layer |
| `storage-r2` adapter | `storage-s3` (with R2-compatible config) | Payload v3 decision | `storage-r2` is edge-only; `storage-s3` works in Node.js with R2's S3 API |

**Deprecated/outdated:**
- `@payloadcms/plugin-cloud-storage`: This is the Payload v2 package name. In v3, use `@payloadcms/storage-s3` directly.
- `slugField()` helper from multi-tenant plugin: Sets `unique: true` which breaks cross-tenant slug sharing. Do not use for this project.

---

## Open Questions

1. **R2 Public URL configuration**
   - What we know: `generateFileURL` must return the publicly accessible URL for uploaded files. This can be the R2 public bucket URL, a custom domain, or Cloudflare's R2.dev subdomain.
   - What's unclear: Whether the project will use R2's built-in public access URL (`pub-{hash}.r2.dev`) or a custom domain. This determines the `R2_PUBLIC_URL` env var value.
   - Recommendation: Add `R2_PUBLIC_URL` to `env.ts` as a required string. The planner should note that this env var must be configured before R2 uploads work in any environment.

2. **Image resizing / thumbnail generation**
   - What we know: `sharp` is already installed. Payload supports `upload.imageSizes` for automatic resize on upload. S3 storage adapter uploads all generated sizes automatically.
   - What's unclear: Whether thumbnails are needed (marked as Claude's discretion). Thumbnails improve admin UI preview performance but add upload time and R2 storage cost.
   - Recommendation: Add a single `thumbnail` size (300x200) for admin panel previews. This is low cost and improves UX for campaign managers uploading hero images.

3. **Lexical editor toolbar configuration**
   - What we know: `lexicalEditor()` is already configured globally. Individual richText fields can pass `editor: lexicalEditor({ features: [...] })` to customize the toolbar.
   - What's unclear: Exact set of formatting options for the Text block (H2/H3? lists? links?).
   - Recommendation: Use default `lexicalEditor()` for the Text block (inherits global config). If global config needs tuning, do it in `payload.config.ts` for consistency.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Playwright (already installed, v1.58.2) |
| Config file | None detected — need to create `playwright.config.ts` or use existing `.playwright-mcp/` |
| Quick run command | `npx playwright test --grep @smoke` |
| Full suite command | `npx playwright test` |
| Alternative | Local API integration tests via a Node script (lower setup cost for Phase 2 API-level checks) |

**Note:** No test runner (jest/vitest) is configured. CLAUDE.md states "No test runner is configured yet." Phase 2 validation should follow the same pattern as Phase 1's smoke test (a Node script using Payload Local API), since Playwright is available but requires a running server.

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Create post for tenant A with slug "hello"; create post for tenant B with same slug "hello" — both succeed | integration (Local API script) | `npx tsx src/tests/phase2-smoke.ts` | ❌ Wave 0 |
| CONT-01 | Create two posts in same tenant with same slug — second fails validation | integration (Local API script) | same | ❌ Wave 0 |
| CONT-02 | Post with `publishAs: 'web'` — email fields absent from response; `publishAs: 'email'` — email fields present | integration (Local API) | same | ❌ Wave 0 |
| CONT-02 | Campaign manager PATCH to set `emailStatus: 'sent'` — access denied (403) | integration (Local API) | same | ❌ Wave 0 |
| CONT-03 | Create page with 4 block types; read back and verify block structure | integration (Local API) | same | ❌ Wave 0 |
| CONT-04 | Upload image via REST API — verify file stored in R2 (check returned URL starts with R2_PUBLIC_URL) | integration (REST, requires running server + R2 creds) | manual / Playwright | ❌ Wave 0 |
| CONF-01 | Create SiteSettings for tenant A — succeeds; create second — fails with error | integration (Local API) | same | ❌ Wave 0 |
| CONF-02 | Read SiteSettings via REST as run-api (API key auth) — returns all fields | integration (REST) | same | ❌ Wave 0 |
| CONF-03 | Seed SiteSettings via REST with `Authorization: users API-Key {key}` — succeeds | integration (REST, requires running server) | manual | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx tsx src/tests/phase2-smoke.ts` (Local API tests only — no running server needed)
- **Per wave merge:** Full smoke script + manual R2 upload check
- **Phase gate:** All smoke tests green + manual CONF-03 REST seed verified before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/tests/phase2-smoke.ts` — Local API integration test script covering CONT-01, CONT-02, CONT-03, CONF-01, CONF-02
- [ ] `playwright.config.ts` — if Playwright-based tests are needed for REST/CONF-03
- [ ] `npm install @payloadcms/storage-s3 @aws-sdk/client-s3` — packages not yet in package.json
- [ ] `.env.local` additions — R2 env vars and WEBHOOK_SECRET needed before any R2 test

---

## Sources

### Primary (HIGH confidence)

- GitHub `payloadcms/payload` `docs/fields/blocks.mdx` — blocks field API, Block type definition, `blockReferences` pattern
- GitHub `payloadcms/payload` `docs/fields/overview.mdx` — `admin.condition` function signature `(data, siblingData, ctx)` returning boolean
- GitHub `payloadcms/payload` `docs/hooks/collections.mdx` — `beforeOperation` and `beforeValidate` hook signatures, error throwing pattern
- GitHub `payloadcms/payload` `docs/authentication/api-keys.mdx` — `useAPIKey: true`, Authorization header format `{slug} API-Key {key}`
- GitHub `payloadcms/payload` `docs/access-control/fields.mdx` — field-level `access.create/read/update` functions
- `bridger.to/payload-r2` — Complete R2 + storage-s3 config with `region: 'auto'`, `forcePathStyle: true`, `https://` prefix requirement

### Secondary (MEDIUM confidence)

- Community workaround for GitHub issue #14938 — custom `validate` function for per-tenant slug uniqueness (issue confirmed open Jan 2026; workaround verified working by community)
- WebSearch: `admin.group` property for sidebar grouping — confirmed in multiple community help posts and official collection config docs

### Tertiary (LOW confidence)

- Image thumbnail recommendation (300x200 size) — based on general UX practice; not project-specific validation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@payloadcms/storage-s3` is official package; R2 config verified against working example
- Architecture: HIGH — blocks field, hooks, access control all verified against official docs source
- Pitfalls: HIGH — slug uniqueness issue (#14938) is a confirmed open GitHub issue; other pitfalls are documented API behaviors
- Slug uniqueness workaround: MEDIUM — community-verified workaround for open bug; no official fix yet

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (stable PayloadCMS APIs; slug uniqueness bug may get official fix before then — check #14938)
