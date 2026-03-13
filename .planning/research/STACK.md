# Technology Stack

**Project:** CivPulse Campaign CMS
**Researched:** 2026-03-11
**Current Payload ecosystem version:** 3.79.0

## Recommended Stack

### Core Framework (no change from scaffold)

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Next.js | ^15.0.0 | Full-stack framework | Already scaffolded; Payload v3 embeds inside Next.js |
| PayloadCMS | ^3.79.0 | Headless CMS | Core of the project; pin to latest stable |
| React | ^19.0.0 | UI library | Required by Next.js 15 + Payload v3 |
| TypeScript | ^5.0.0 | Type safety | Already in scaffold |

**Confidence:** HIGH -- scaffold is already working, just bump Payload to latest.

### Database

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @payloadcms/db-postgres | ^3.79.0 | PostgreSQL adapter | Required for multi-tenant at scale; uses Drizzle ORM + node-postgres internally; matches existing CivPulse infra (PostgreSQL on ZFS) |

**Required env vars:**
- `DATABASE_URL` -- full PostgreSQL connection string (e.g., `postgresql://user:pass@host:5432/civpulse_cms`)

**Configuration:**
```typescript
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    // Use 'uuid' if you want UUIDs instead of auto-incrementing serial IDs
    idType: 'serial',
  }),
})
```

**Key options:**
- `pool.connectionString` -- connection string (REQUIRED)
- `idType` -- `'serial'` (default) or `'uuid'`
- `push` -- auto-push schema changes in dev (default: true in dev)
- `migrationDir` -- custom directory for migration files
- `transactionOptions` -- PostgreSQL transaction config or `false` to disable
- `schemaName` -- PostgreSQL schema name (default: `'public'`, marked experimental)
- `readReplicas` -- array of read replica connection strings
- `blocksAsJSON` -- store blocks as JSON instead of relational tables (performance tradeoff)

**Migration from SQLite:**
1. Replace `@payloadcms/db-sqlite` with `@payloadcms/db-postgres` in package.json
2. Update `payload.config.ts` to use `postgresAdapter` instead of `sqliteAdapter`
3. Remove `cms.db` references and the `file:./cms.db` path
4. Set `DATABASE_URL` in `.env.local`
5. Run `npm run dev` -- Payload's `db push` auto-creates tables in development
6. For production: use `npx payload migrate:create` then `npx payload migrate`

**Confidence:** HIGH -- official first-party adapter, actively maintained, version-matched with core.

### Multi-Tenancy

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @payloadcms/plugin-multi-tenant | ^3.79.0 | Tenant isolation | Official Payload plugin; adds tenant field to collections, tenant selector in admin, per-tenant access control |

**Configuration:**
```typescript
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

multiTenantPlugin({
  collections: {
    posts: {},
    pages: {},
    media: {},
    siteConfig: { isGlobal: true },  // single doc per tenant
  },
  tenantsSlug: 'tenants',           // default
  cleanupAfterTenantDelete: false,   // DISABLE -- broken on Postgres (see PITFALLS)
  userHasAccessToAllTenants: (user) => user?.role === 'super-admin',
})
```

**What the plugin does:**
- Creates a `tenants` collection (or uses existing one matching `tenantsSlug`)
- Adds a hidden `tenant` relationship field to every specified collection
- Adds tenant selector dropdown in admin UI
- Filters list views and relationships by selected tenant
- Supports `isGlobal: true` for per-tenant singleton collections (site config, navigation)
- Adds `tenantsArrayField` to Users collection (which tenants a user can access)

**Key config options:**
- `enabled` -- toggle plugin on/off (default: true)
- `tenantsSlug` -- collection slug for tenants (default: `'tenants'`)
- `cleanupAfterTenantDelete` -- cascade delete tenant docs (default: true, BUT BROKEN on Postgres)
- `debug` -- make tenant field visible in admin UI (default: false)
- `collections[slug].isGlobal` -- enforce one doc per tenant
- `collections[slug].useBaseFilter` -- apply tenant filtering (default: true)
- `collections[slug].useTenantAccess` -- enforce tenant access control (default: true)
- `userHasAccessToAllTenants` -- function to designate super-admin access

**Frontend querying by tenant:**
```typescript
const pages = await payload.find({
  collection: 'pages',
  where: { 'tenant.slug': { equals: tenantSlug } },
})
```

**Confidence:** MEDIUM -- plugin is actively maintained (v3.79.0), but there are known PostgreSQL-specific bugs (see PITFALLS.md). Workable with documented mitigations.

### Media Storage

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @payloadcms/storage-s3 | ^3.78.0 | Cloudflare R2 storage via S3 API | R2 is S3-compatible; the native `@payloadcms/storage-r2` is for Cloudflare Workers only (not Node.js); S3 adapter works with R2 out of the box |
| @aws-sdk/client-s3 | ^3.700.0 | S3 client (peer dep) | Required by storage-s3 adapter |

**IMPORTANT: Use `@payloadcms/storage-s3`, NOT `@payloadcms/storage-r2`.**
The `storage-r2` adapter is designed exclusively for Cloudflare Workers runtime (uses R2 bucket bindings via `cloudflare.env.R2`). Since CivPulse runs on k3s (Node.js), you must use the S3-compatible adapter with R2's S3 API endpoint.

**Required env vars:**
- `R2_ACCESS_KEY_ID` -- Cloudflare R2 API token access key
- `R2_SECRET_ACCESS_KEY` -- Cloudflare R2 API token secret
- `R2_BUCKET` -- Bucket name (e.g., `civpulse-media`)
- `R2_ENDPOINT` -- Account-specific endpoint domain (e.g., `<account-id>.r2.cloudflarestorage.com`), WITHOUT `https://` prefix
- `R2_PUBLIC_URL` -- Public URL for serving files (e.g., `https://media.civpulse.com`)

**Configuration:**
```typescript
import { s3Storage } from '@payloadcms/storage-s3'

s3Storage({
  collections: {
    media: {
      disableLocalStorage: true,
      prefix: 'media',
      generateFileURL: ({ filename, prefix }) =>
        `${process.env.R2_PUBLIC_URL}/${prefix}/${filename}`,
    },
  },
  bucket: process.env.R2_BUCKET || '',
  config: {
    endpoint: `https://${process.env.R2_ENDPOINT}`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
    region: 'auto',        // REQUIRED for R2
    forcePathStyle: true,   // REQUIRED for R2
  },
})
```

**Critical R2-specific settings:**
- `region: 'auto'` -- R2 does not use AWS regions; must be `'auto'`
- `forcePathStyle: true` -- R2 requires path-style URLs, not virtual-hosted
- `endpoint` needs `https://` prefix; env var stores domain only

**Confidence:** HIGH -- S3 adapter is the recommended path for non-Workers R2 usage; well-documented community pattern.

### Rich Text and HTML Serialization

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| @payloadcms/richtext-lexical | ^3.79.0 | Rich text editor | Already in scaffold; required for post content |

**HTML serialization for email templates -- two APIs:**

1. **`convertLexicalToHTML`** (synchronous) -- for fully populated data
   - Import: `@payloadcms/richtext-lexical/html`
   - Use when all relationships (images, links) are already resolved

2. **`convertLexicalToHTMLAsync`** (async, RECOMMENDED for email) -- handles relationship population
   - Import: `@payloadcms/richtext-lexical/html-async`
   - Use with `getPayloadPopulateFn` for server-side population

**Server-side usage (for webhook/email flow):**
```typescript
import { convertLexicalToHTMLAsync } from '@payloadcms/richtext-lexical/html-async'
import { getPayloadPopulateFn } from '@payloadcms/richtext-lexical'

const html = await convertLexicalToHTMLAsync({
  data: post.content,  // Lexical JSON from the post
  populate: await getPayloadPopulateFn({
    currentDepth: 0,
    depth: 1,
    payload,  // Payload instance
  }),
})
```

**Why async variant:** The sync `convertLexicalToHTML` does NOT populate relationships. Email templates with embedded images or internal links will render broken references unless you use the async variant with `getPayloadPopulateFn`.

**Alternative (REST-based, slower):**
```typescript
import { getRestPopulateFn } from '@payloadcms/richtext-lexical/client'
// Sends a separate HTTP request per node -- avoid for large posts
```

**Confidence:** HIGH -- official API with documented import paths and examples.

### Webhook Implementation (Built-in Hooks)

No additional package needed. Payload's `afterChange` collection hook provides everything required.

**Pattern for "post transitions to published" webhook:**
```typescript
import type { CollectionAfterChangeHook } from 'payload'
import crypto from 'node:crypto'

const fireWebhookOnPublish: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  // Prevent infinite loop from self-updates
  if (context.skipWebhook) return doc

  // Detect status transition to published
  const justPublished = doc._status === 'published' && previousDoc?._status !== 'published'
  const hasEmailDelivery = doc.publishAs === 'email' || doc.publishAs === 'both'

  if (justPublished && hasEmailDelivery) {
    const payload = JSON.stringify({
      postId: doc.id,
      tenantId: doc.tenant,
      event: 'post.published',
    })

    const signature = crypto
      .createHmac('sha256', process.env.WEBHOOK_SECRET!)
      .update(payload)
      .digest('hex')

    await fetch(process.env.RUN_API_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Payload-Signature': signature,
      },
      body: payload,
    })

    // Update email status without re-triggering webhook
    await req.payload.update({
      collection: 'posts',
      id: doc.id,
      data: { emailStatus: 'queued' },
      context: { skipWebhook: true },
    })
  }

  return doc
}
```

**Key `afterChange` hook arguments:**
- `doc` -- the document AFTER changes
- `previousDoc` -- the document BEFORE changes
- `operation` -- `'create'` or `'update'`
- `req` -- PayloadRequest (contains `req.payload` for Local API calls)
- `context` -- mutable object shared across hooks in the same operation

**Confidence:** HIGH -- well-documented, standard Payload pattern.

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | ^0.33.0 | Image processing | Already in scaffold; used by Payload for image optimization |
| zod | ^3.23.0 | Runtime validation | Validate env vars at startup, webhook payloads, external API inputs |
| @aws-sdk/client-s3 | ^3.700.0 | S3 client | Peer dependency of storage-s3 adapter |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Database | @payloadcms/db-postgres | @payloadcms/db-sqlite | SQLite cannot handle concurrent writes from multiple campaigns; no replication; project already has PostgreSQL infra |
| Database | @payloadcms/db-postgres | FerretDB | Extra complexity for MongoDB-compat layer; Payload Postgres adapter is first-party and mature |
| Storage | @payloadcms/storage-s3 (for R2) | @payloadcms/storage-r2 | storage-r2 requires Cloudflare Workers runtime; CivPulse runs Node.js on k3s |
| Storage | @payloadcms/storage-s3 (for R2) | @payloadcms/storage-azure / gcs | R2 is already in CivPulse infra; zero-egress-fee storage |
| Multi-tenant | @payloadcms/plugin-multi-tenant | Custom tenant field + access control | Plugin handles admin UI filtering, tenant selector, and access control automatically; building this manually is weeks of work |
| Webhooks | Payload afterChange hooks | External webhook service (Svix) | Payload hooks are sufficient for single "post published -> fire to run-api" flow |

## What NOT to Use

| Package | Why Avoid |
|---------|-----------|
| `@payloadcms/storage-r2` | Workers-only; crashes on Node.js runtime. Use storage-s3 instead. |
| `@payloadcms/db-vercel-postgres` | Vercel-specific; uses `@vercel/postgres` which cannot connect to non-Vercel databases |
| `payload-tenancy` (3rd party, joas8211) | Unmaintained community plugin; official `plugin-multi-tenant` supersedes it |
| `@payloadcms/plugin-cloud-storage` | v2 legacy package; replaced by `@payloadcms/storage-s3` in v3 |

## Installation

```bash
# Remove SQLite adapter
npm uninstall @payloadcms/db-sqlite

# Add new packages
npm install @payloadcms/db-postgres @payloadcms/plugin-multi-tenant @payloadcms/storage-s3 @aws-sdk/client-s3 zod

# Already installed (no change needed):
# payload @payloadcms/next @payloadcms/richtext-lexical next react react-dom sharp
```

**Pin strategy:** Use `^3.79.0` for all `@payloadcms/*` packages to stay on the same minor release train. Payload publishes all packages in lockstep -- mixing versions causes type mismatches and runtime errors.

After install, verify alignment:
```bash
npm ls | grep @payloadcms
```

## Environment Variables (Complete)

```bash
# Required -- fail at startup if missing
PAYLOAD_SECRET=<64-char-random-string>
DATABASE_URL=postgresql://user:pass@host:5432/civpulse_cms

# Required for media storage (R2 via S3 API)
R2_ACCESS_KEY_ID=<cloudflare-r2-access-key>
R2_SECRET_ACCESS_KEY=<cloudflare-r2-secret>
R2_BUCKET=civpulse-media
R2_ENDPOINT=<account-id>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://media.civpulse.com

# Required for webhook signing
WEBHOOK_SECRET=<hmac-signing-secret>
RUN_API_WEBHOOK_URL=https://api.civpulse.com/api/v1/webhooks/payload/post-published
```

## Sources

- [Payload Multi-Tenant Plugin Docs](https://payloadcms.com/docs/plugins/multi-tenant)
- [Payload Multi-Tenant Plugin on GitHub (source mdx)](https://github.com/payloadcms/payload/blob/main/docs/plugins/multi-tenant.mdx)
- [Payload PostgreSQL Adapter Docs](https://payloadcms.com/docs/database/postgres)
- [Payload PostgreSQL Adapter on GitHub (source mdx)](https://github.com/payloadcms/payload/blob/main/docs/database/postgres.mdx)
- [Payload Storage Adapters Docs](https://payloadcms.com/docs/upload/storage-adapters)
- [Payload Lexical HTML Converters Docs](https://payloadcms.com/docs/rich-text/converting-html)
- [Payload Collection Hooks Docs](https://payloadcms.com/docs/hooks/collections)
- [Payload Hooks Context Docs](https://payloadcms.com/docs/hooks/context)
- [Cloudflare R2 + Payload CMS Guide (Bridger Tower)](https://bridger.to/payload-r2)
- [Payload R2 Storage Guide (official)](https://payloadcms.com/posts/guides/how-to-configure-file-storage-in-payload-with-vercel-blob-r2-and-uploadthing)
- [GitHub #14576: Tenant deletion fails with Postgres](https://github.com/payloadcms/payload/issues/14576) -- OPEN
- [GitHub #14938: Slug uniqueness ignores tenant scope](https://github.com/payloadcms/payload/issues/14938) -- OPEN
- [GitHub #11484: Tenant field returns ID not object](https://github.com/payloadcms/payload/issues/11484) -- FIXED in v3.26.0
- [@payloadcms/plugin-multi-tenant on npm (v3.79.0)](https://www.npmjs.com/package/@payloadcms/plugin-multi-tenant)
- [@payloadcms/storage-s3 on npm (v3.78.0)](https://www.npmjs.com/package/@payloadcms/storage-s3)
- [@payloadcms/db-postgres on npm](https://www.npmjs.com/package/@payloadcms/db-postgres)
- [payload on npm (v3.79.0)](https://www.npmjs.com/package/payload)
