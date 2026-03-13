# Architecture Patterns

**Domain:** Multi-tenant campaign website platform (PayloadCMS v3 + Next.js 15)
**Researched:** 2026-03-11

## Recommended Architecture

Single Payload + Next.js deployment serving all tenants. Subdomain-based routing determines which tenant's content to serve. All tenant data lives in the same PostgreSQL database with row-level isolation via a `tenant` relationship field.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Payload CMS (embedded in Next.js) | Content management, admin UI, REST API, collection definitions | PostgreSQL, Cloudflare R2, run-api (outbound webhooks) |
| Next.js frontend routes | Public-facing campaign websites, SSR/SSG | Payload Local API (same process) |
| PostgreSQL | Data persistence, tenant-scoped rows | Payload via Drizzle ORM |
| Cloudflare R2 | Media file storage (images, documents) | Payload via S3 API (upload), CDN/public URL (serve) |
| run-api (external) | Subscriber management, email delivery, campaign provisioning, CRM | Payload REST API (inbound: seed content, update emailStatus) |
| Traefik ingress | Wildcard subdomain routing, TLS termination | Payload k3s service |

### Data Flow

**Public page request:**
```
Browser -> *.campaigns.civpulse.com
  -> Cloudflare Tunnel -> Traefik (wildcard ingress)
  -> Next.js server component
  -> Extract tenant slug from subdomain (req.headers.host)
  -> payload.find({ collection: 'pages', where: { 'tenant.slug': { equals: slug } } })
  -> Render template with tenant config (colors, logo, candidate info)
  -> Return HTML
```

**Admin panel:**
```
Browser -> slug.campaigns.civpulse.com/admin
  -> Payload admin UI (React SPA)
  -> Multi-tenant plugin auto-filters by user's assigned tenants
  -> Campaign manager sees only their content
```

**Post publish -> email flow:**
```
Campaign manager publishes post in admin
  -> Payload afterChange hook fires
  -> Hook detects: doc._status === 'published' && previousDoc._status !== 'published'
  -> Hook checks: publishAs includes email delivery
  -> Hook sends HMAC-signed POST to run-api webhook endpoint
  -> Hook updates post.emailStatus = 'queued' (with context.skipWebhook to prevent loop)
  -> run-api receives webhook, verifies HMAC
  -> run-api enqueues Procrastinate job for Resend delivery
  -> run-api calls Payload REST API to update post.emailStatus = 'sent' (after delivery)
```

**Campaign provisioning:**
```
Platform admin creates campaign in run-web
  -> run-web calls run-api provisioning endpoint
  -> run-api creates tenant via Payload REST API: POST /api/tenants
  -> run-api creates initial site config via Payload REST API
  -> run-api seeds default pages (home, about) via Payload REST API
  -> run-api creates k8s Ingress for new subdomain (or wildcard already covers it)
  -> Site is live at slug.campaigns.civpulse.com
```

## Patterns to Follow

### Pattern 1: Tenant Resolution via Subdomain

**What:** Extract tenant slug from the request hostname and use it to scope all data queries.

**When:** Every public-facing page request.

**Example:**
```typescript
// src/lib/tenant.ts
export function getTenantSlug(host: string): string | null {
  // host = "jones-for-council.campaigns.civpulse.com"
  const match = host.match(/^([^.]+)\.campaigns\.civpulse\.com$/)
  return match?.[1] || null
}

// In a Next.js layout or page:
import { headers } from 'next/headers'
import { getPayload } from 'payload'

export default async function TenantLayout({ children }) {
  const host = (await headers()).get('host') || ''
  const slug = getTenantSlug(host)
  if (!slug) return notFound()

  const payload = await getPayload({ config })
  const tenants = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  if (tenants.totalDocs === 0) return notFound()

  const tenant = tenants.docs[0]
  // Pass tenant to children via context or props
}
```

### Pattern 2: Context Flag to Prevent Hook Recursion

**What:** Use Payload's `context` object to pass flags between hooks, preventing infinite loops when a hook updates the same document.

**When:** Any `afterChange` hook that calls `payload.update()` on the triggering document.

**Example:**
```typescript
const afterChangeHook: CollectionAfterChangeHook = async ({
  doc, req, context
}) => {
  if (context.skipSideEffects) return doc

  await req.payload.update({
    collection: 'posts',
    id: doc.id,
    data: { emailStatus: 'queued' },
    context: { skipSideEffects: true },
  })
  return doc
}
```

### Pattern 3: Per-Tenant Slug Uniqueness

**What:** Custom validation hook that enforces slug uniqueness within a tenant, not globally.

**When:** Any collection with a slug field that participates in multi-tenancy.

**Example:**
```typescript
import { ValidationError } from 'payload'

const ensureUniqueSlugPerTenant = async ({ data, req, operation }) => {
  if (!data?.slug || !data?.tenant) return data

  const existing = await req.payload.find({
    collection: 'pages',
    where: {
      slug: { equals: data.slug },
      tenant: { equals: typeof data.tenant === 'object' ? data.tenant.id : data.tenant },
      ...(data.id ? { id: { not_equals: data.id } } : {}),
    },
    limit: 1,
  })

  if (existing.totalDocs > 0) {
    throw new ValidationError([{
      field: 'slug',
      message: 'A page with this slug already exists for this campaign',
    }])
  }
  return data
}
```

### Pattern 4: Env Validation at Startup

**What:** Validate all required environment variables before Payload initializes, failing fast with clear error messages.

**When:** Application startup, before `buildConfig` executes.

**Example:**
```typescript
// src/env.ts
import { z } from 'zod'

export const env = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must be at least 32 characters'),
  R2_BUCKET: z.string().min(1),
  R2_ENDPOINT: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  WEBHOOK_SECRET: z.string().min(16),
  RUN_API_WEBHOOK_URL: z.string().url(),
}).parse(process.env)
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Per-Tenant Database Isolation

**What:** Creating a separate PostgreSQL database or schema per tenant.
**Why bad:** Operational explosion -- migrations must run N times, connection pooling becomes complex, backups multiply, and Payload has no built-in support for this.
**Instead:** Use row-level isolation with the multi-tenant plugin's `tenant` field on every collection.

### Anti-Pattern 2: REST API for Internal Queries

**What:** Using `fetch('/api/posts')` from Next.js server components to query Payload.
**Why bad:** Unnecessary HTTP round-trip within the same process. Adds latency, CORS complexity, and auth overhead.
**Instead:** Use the Payload Local API: `payload.find({ collection: 'posts', ... })` which runs in-process with no HTTP overhead.

### Anti-Pattern 3: Storing Email Templates in the Database

**What:** Saving pre-rendered HTML email templates as Payload fields.
**Why bad:** Creates stale copies that diverge from the source content. Doubles storage. Complicates updates.
**Instead:** Generate HTML on-demand using `convertLexicalToHTMLAsync` when the webhook fires or when run-api requests the email content.

### Anti-Pattern 4: Global Payload Config for Per-Tenant Settings

**What:** Using Payload's built-in `globals` config (top-level, not the plugin's `isGlobal` option) for tenant-specific settings.
**Why bad:** Payload globals are singleton documents -- one per deployment, not per tenant. Using them for tenant config means all campaigns share the same settings.
**Instead:** Use the multi-tenant plugin's `isGlobal: true` option on a collection, which creates one document per tenant, or use a regular collection with one-per-tenant enforcement.

## Scalability Considerations

| Concern | At 10 tenants | At 100 tenants | At 1000 tenants |
|---------|---------------|----------------|-----------------|
| Database queries | No concern; standard indexes | Add compound indexes on (tenant, slug), (tenant, _status) | Consider read replicas; ensure all tenant-scoped queries use indexed tenant field |
| Admin panel performance | No concern | Tenant selector dropdown still manageable | May need searchable tenant selector or pagination |
| Media storage | Minimal R2 usage | Moderate; prefix per tenant helps organization | R2 scales infinitely; no concern |
| Process memory | Single pod sufficient | Single pod sufficient (384GB RAM available) | Monitor; Payload loads all collection configs at startup, not per-tenant |
| Build time | Fast | Fast (collections are defined once, not per-tenant) | No change; collection definitions are static |

## Sources

- [Payload Multi-Tenant Plugin Docs](https://payloadcms.com/docs/plugins/multi-tenant)
- [Payload Local API](https://payloadcms.com/docs/local-api/overview)
- [Payload Collection Hooks](https://payloadcms.com/docs/hooks/collections)
- [Payload Lexical HTML Converters](https://payloadcms.com/docs/rich-text/converting-html)
- PROJECT.md (deployment architecture, infrastructure constraints)
