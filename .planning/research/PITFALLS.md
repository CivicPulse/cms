# Pitfalls Research

**Domain:** PayloadCMS v3 multi-tenant campaign website platform
**Researched:** 2026-03-11
**Confidence:** MEDIUM (multi-tenant plugin is young; critical pitfalls verified via GitHub issues and official docs, some from community patterns)

## Critical Pitfalls

### Pitfall 1: Local API Bypasses All Tenant Access Control by Default

**What goes wrong:**
Payload's Local API sets `overrideAccess: true` by default. Every `payload.find()`, `payload.update()`, `payload.create()` call from server-side code (Next.js server components, API routes, hooks) silently skips ALL access control -- including tenant isolation. A server component rendering one tenant's page can query and display another tenant's posts, pages, or media if the developer forgets to pass `overrideAccess: false` and a scoped user object.

**Why it happens:**
The Local API is designed for trusted server-side contexts where access control is often unnecessary (seeding, migrations, admin scripts). Developers building frontend rendering code use the same Local API but forget they are in a multi-tenant context where access control IS the isolation boundary.

**How to avoid:**
- Create a helper function (e.g., `getTenantScopedPayload(tenantSlug)`) that wraps every Local API call with `overrideAccess: false` and injects a tenant-scoped `where` clause.
- Never call `payload.find()` or `payload.findByID()` directly in `src/app/(frontend)/` without `overrideAccess: false`.
- Write an integration test that creates two tenants with data, then queries from tenant A's context and asserts tenant B's data is absent.

**Warning signs:**
- Any Local API call in frontend code without explicit `overrideAccess: false`.
- Data from multiple tenants appearing on a single page.
- Tests passing with one tenant but failing with two.

**Phase to address:**
Multi-tenancy setup. Must be established before any frontend rendering code is written.

**Confidence:** HIGH -- documented in [Payload Local API access control docs](https://payloadcms.com/docs/local-api/access-control).

---

### Pitfall 2: Slug Fields Are Globally Unique, Not Per-Tenant

**What goes wrong:**
The Payload slug field enforces a database-level `UNIQUE` constraint globally. Two tenants cannot have a page with slug `home` or a post with slug `welcome`. Users get a cryptic uniqueness error.

**Why it happens:**
The `slugField()` helper bakes in `unique: true` at the database level. The multi-tenant plugin does not modify this to a compound unique on `(tenant, slug)`.

**How to avoid:**
- Do NOT use the built-in `slugField()` helper for tenant-scoped collections.
- Create a custom slug field without `unique: true` at the database level.
- Add a custom `beforeValidate` hook that checks slug uniqueness within the tenant scope:
  ```typescript
  beforeValidate: [async ({ data, req }) => {
    if (data?.slug && data?.tenant) {
      const existing = await req.payload.find({
        collection: 'pages',
        where: {
          slug: { equals: data.slug },
          tenant: { equals: data.tenant },
          id: { not_equals: data.id },
        },
      })
      if (existing.totalDocs > 0) {
        throw new ValidationError([{
          field: 'slug',
          message: 'Slug already in use for this campaign',
        }])
      }
    }
    return data
  }]
  ```
- Add a compound index on `(tenant, slug)` via migration for query performance.

**Warning signs:**
- "Unique constraint violation" errors when the second tenant creates standard pages.

**Phase to address:**
Collection schema design. Custom slug validation must be in place from the first tenant-scoped collection.

**Confidence:** HIGH -- confirmed open bug (GitHub #14938).

---

### Pitfall 3: Globals Cannot Be Partitioned Per Tenant

**What goes wrong:**
Payload's `Globals` are singletons -- one document per Global for the entire application. The multi-tenant plugin does NOT partition Globals by tenant. If you define `SiteSettings` as a Global, all tenants share the same document.

**Why it happens:**
Developers expect "global config" to mean "per-site config." The multi-tenant plugin's `isGlobal: true` on collections (not Globals) is the correct approach but uses confusing nomenclature.

**How to avoid:**
- Do NOT use Payload Globals for any tenant-specific data (candidate name, colors, logo, tagline).
- Use Collections with `isGlobal: true` in the multi-tenant plugin config:
  ```typescript
  multiTenantPlugin({
    collections: {
      'campaign-settings': { isGlobal: true },
    },
  })
  ```
  This creates a collection behaving like a global from admin UI (no list view, single doc per tenant) but properly tenant-scoped.
- NOTE: `isGlobal: true` has a known validation bug (GitHub #10740). Test early; if it persists, use a regular collection with a `beforeValidate` hook enforcing one-document-per-tenant.

**Warning signs:**
- Any Global whose fields include tenant-specific data.
- Campaign managers reporting settings changes affect other campaigns.

**Phase to address:**
Collection schema design. Must be decided before creating the tenant global config collection.

**Confidence:** HIGH -- confirmed in [multi-tenant plugin docs](https://payloadcms.com/docs/plugins/multi-tenant) and [Build with Matija guide](https://www.buildwithmatija.com/blog/how-to-configure-globals-with-multi-tenant-plugin-in-payload-cms).

---

### Pitfall 4: Push Mode in Production Causes Silent Data Loss

**What goes wrong:**
Payload uses Drizzle ORM's `push` mode in development to auto-sync schema changes. If not explicitly disabled for production, destructive schema changes (dropping columns, renaming tables) are auto-applied at startup. Mixing `push` and migrations on the same database corrupts the migration tracking table.

**Why it happens:**
Push mode is the default and "just works" in dev. Developers deploying to production forget to switch to migration-only mode.

**How to avoid:**
- Set `push: false` in the Postgres adapter config for non-development environments:
  ```typescript
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URL },
    push: process.env.NODE_ENV === 'development',
  })
  ```
- Use `payload migrate:create` to generate migration files after schema changes.
- Run `payload migrate` in CI/CD pipeline, not at app startup.
- Never run `push` against a database with migration history.

**Warning signs:**
- No `migrations/` directory in the repository.
- Deployment logs showing "Schema changes applied" instead of "Migrations applied."
- Production database missing columns that exist in dev.

**Phase to address:**
Database migration (SQLite to PostgreSQL). Must be established immediately when switching to Postgres.

**Confidence:** HIGH -- documented in [Payload migrations docs](https://payloadcms.com/docs/database/migrations) and [Build with Matija production guide](https://www.buildwithmatija.com/blog/payloadcms-postgres-push-to-migrations).

---

### Pitfall 5: afterChange Hook Infinite Loop and Double-Fire on Webhooks

**What goes wrong:**
An `afterChange` hook on Posts fires on every update -- draft saves, field edits, autosaves, and status transitions. Naively firing a webhook sends dozens of spurious events. If the hook also updates the document (e.g., `emailStatus: 'sending'`), it triggers itself again in an infinite loop. Payload async hooks run in series and block the save lifecycle.

**Why it happens:**
`afterChange` provides `previousDoc` and `doc` but developers forget to compare them. There is no built-in "on status transition" event.

**How to avoid:**
- Guard the webhook with a transition check and context flag:
  ```typescript
  const afterChange: CollectionAfterChangeHook = async ({ doc, previousDoc, req }) => {
    if (req.context.webhookFired) return doc;

    const justPublished = doc._status === 'published' && previousDoc?._status !== 'published';
    const needsEmail = doc.publishAs === 'email' || doc.publishAs === 'both';

    if (!justPublished || !needsEmail) return doc;

    req.context.webhookFired = true;
    // Fire webhook, update emailStatus with context: { skipWebhook: true }
  };
  ```
- Use `req.context` flags to prevent re-entry (context persists across the full request lifecycle).
- Set a timeout on outbound HTTP calls (5 seconds). If run-api is down, log and move on.
- Consider Payload's jobs queue for webhook delivery instead of inline execution.

**Warning signs:**
- run-api receiving multiple webhooks for a single publish.
- Admin save button hanging or timing out.
- Repeated `afterChange` calls for the same document ID in logs.

**Phase to address:**
Webhook integration. Must be implemented with transition guards from the start.

**Confidence:** HIGH -- documented in [Payload hooks context docs](https://payloadcms.com/docs/hooks/context) and [infinite loop discussion #816](https://github.com/payloadcms/payload/discussions/816).

---

### Pitfall 6: Tenant Deletion Crashes on PostgreSQL

**What goes wrong:**
Deleting a tenant with `cleanupAfterTenantDelete: true` (the default) triggers `DrizzleQueryError: current transaction is aborted, commands ignored until end of transaction block`. The cascade delete fails mid-transaction, and PostgreSQL's strict semantics prevent any further operations.

**Why it happens:**
An earlier delete in the cascade fails (often in `payload_preferences`), aborting the PostgreSQL transaction. Drizzle continues issuing queries against the dead transaction. SQLite is more lenient, so this never surfaces in dev.

**How to avoid:**
- Set `cleanupAfterTenantDelete: false` in the plugin config.
- Do NOT allow tenant deletion from the admin UI in production. Restrict via access control to API-only (run-api provisioning).
- Implement soft-delete (`active: boolean`) instead of hard-delete -- recommended for CivPulse since campaign data may need archiving.
- If hard-delete is needed, build a custom endpoint that deletes documents collection-by-collection in separate transactions.

**Warning signs:**
- "current transaction is aborted" in error logs after delete operations.
- Admin panel showing "An error occurred" on any cascading delete.

**Phase to address:**
Multi-tenancy setup. Tenant lifecycle (create via run-api, restricted deletion) must be defined early.

**Confidence:** HIGH -- confirmed in [GitHub issue #14576](https://github.com/payloadcms/payload/issues/14576) (Payload 3.63.0, open with draft PR #15520).

---

### Pitfall 7: Multi-Tenant Plugin + Versioning = Broken for Non-SuperAdmin Users

**What goes wrong:**
When a collection has both multi-tenant scoping and `versions: true`, the Drizzle query builder cannot resolve the `tenant` field path for version records. SuperAdmin users work fine, but tenant-scoped users get `APIError: Cannot find field for path at tenant`.

**Why it happens:**
The multi-tenant plugin injects a `tenant` relationship field into collections, but the versioning system creates separate `_versions` tables that may not correctly include this field in query paths.

**How to avoid:**
- Do NOT enable `versions` on tenant-scoped collections until confirmed fixed.
- Check [GitHub issue #11071](https://github.com/payloadcms/payload/issues/11071) for resolution before enabling.
- If versioning is needed, implement manual revision history (a `revisions` array field) as a workaround.
- Always test versioned collections with a tenant-scoped (non-SuperAdmin) user.

**Warning signs:**
- Version history working in dev (SuperAdmin) but failing with tenant users.
- "Cannot find field for path at tenant" errors.

**Phase to address:**
Collection schema design. Versioning decision must be tested with tenant users early.

**Confidence:** MEDIUM -- confirmed via [GitHub issue #11071](https://github.com/payloadcms/payload/issues/11071) (Feb 2025, fix status unclear).

---

### Pitfall 8: SQLite to PostgreSQL Has No Automatic Data Transfer

**What goes wrong:**
Swapping `@payloadcms/db-sqlite` for `@payloadcms/db-postgres` creates a fresh schema. No built-in data migration tool exists. SQLite data is silently abandoned. Column type differences (TEXT dates vs TIMESTAMP) make naive export/import fail.

**Why it happens:**
Payload adapters are interchangeable at the config level but operate on independent schemas. Developers assume "swapping the adapter" migrates data.

**How to avoid:**
- Since the current scaffold has minimal data (dev admin user, test posts), treat Postgres switch as a fresh start.
- Create first admin user on fresh Postgres via `/admin` first-visit flow.
- If seed data exists, export via REST API before switching, re-import after.
- Generate initial Postgres migration immediately: `payload migrate:create`.

**Warning signs:**
- "relation does not exist" errors after adapter swap.
- Missing admin user after switch.

**Phase to address:**
Database migration (first step). Do before adding new collections.

**Confidence:** HIGH -- architectural behavior of Drizzle ORM.

---

## Moderate Pitfalls

### Pitfall 9: Wrong R2 Storage Adapter (storage-r2 vs storage-s3)

**What goes wrong:**
Developer installs `@payloadcms/storage-r2` expecting it to work with Cloudflare R2 in a Node.js/k8s environment. It fails because `storage-r2` requires Cloudflare Workers runtime and R2 bucket bindings.

**Why it happens:**
The package name naturally seems like the right choice for R2 storage. But it only works inside Workers.

**How to avoid:**
- Use `@payloadcms/storage-s3` with R2's S3-compatible API endpoint.
- R2-specific config requires `region: 'auto'` and `forcePathStyle: true`.
- Document this explicitly in the project.

**Phase to address:** Media storage setup.

**Confidence:** HIGH -- confirmed in [Payload storage adapter docs](https://payloadcms.com/docs/upload/storage-adapters).

---

### Pitfall 10: Payload Package Version Mismatch

**What goes wrong:**
Installing different versions of `@payloadcms/*` packages causes type generation failures, runtime crashes, or subtle data issues.

**Why it happens:**
Payload uses a monorepo and publishes all packages in lockstep. Internal interfaces change between versions.

**How to avoid:**
- Always install/update all `@payloadcms/*` packages together.
- After install, verify: `npm ls | grep @payloadcms`.
- Add a CI check validating all Payload packages are on the same version.

**Phase to address:** Every phase -- add CI check early.

---

### Pitfall 11: previousDoc Behavior with Drafts

**What goes wrong:**
When using `previousDoc` in `afterChange` to detect status transitions, `previousDoc` returns the last published version, not the last saved draft. Multiple draft saves before publishing can make `previousDoc` stale.

**How to avoid:**
- Compare `doc._status === 'published' && previousDoc?._status !== 'published'` explicitly.
- Test the exact sequence: create draft, save multiple times, then publish.
- Consider a `lastKnownStatus` field updated via `beforeChange` for reliable transition detection.

**Phase to address:** Webhook integration.

---

### Pitfall 12: Missing Env Var Silent Failures

**What goes wrong:**
Empty string fallbacks on env vars (current codebase: `process.env.PAYLOAD_SECRET || ''`) cause cryptic errors instead of clear startup failures.

**How to avoid:**
- Validate ALL required env vars at startup with Zod:
  ```typescript
  import { z } from 'zod'
  const env = z.object({
    DATABASE_URL: z.string().url(),
    PAYLOAD_SECRET: z.string().min(32),
    R2_ACCESS_KEY_ID: z.string().min(1),
    R2_SECRET_ACCESS_KEY: z.string().min(1),
    R2_BUCKET: z.string().min(1),
    R2_ENDPOINT: z.string().url(),
  }).parse(process.env)
  ```
- Already flagged in CONCERNS.md -- fix in database migration phase.

**Phase to address:** Database migration (first fix).

---

### Pitfall 13: payload-jobs Collection Not Tenant-Scoped

**What goes wrong:**
Payload's built-in job scheduling (`payload-jobs` collection) is not isolated by tenant. Scheduled posts are visible across tenants via `/api/payload-jobs`. Including `payload-jobs` in the multi-tenant plugin config does not work.

**How to avoid:**
- Do NOT use Payload's built-in job scheduling for tenant-scoped work.
- Use run-api's Procrastinate queue triggered via webhook instead (already the planned architecture).
- If you need scheduled publishing, implement it via webhook: post gets `scheduledPublishAt` field, run-api polls or schedules a job to call Payload's REST API to publish at the right time.

**Phase to address:** Webhook integration.

**Confidence:** HIGH -- confirmed in [GitHub issue #12849](https://github.com/payloadcms/payload/issues/12849).

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Leave `push: true` in production | No migration files to manage | Silent data loss on schema changes; corrupts migration tracking | Never in production |
| Use Payload Globals for tenant config | Simpler config, fewer collections | Data shared across tenants; requires migration to fix | Never in multi-tenant |
| Skip `overrideAccess: false` in frontend | Faster dev; no auth plumbing | Cross-tenant data leaks discovered only with multiple tenants | Never after multi-tenancy added |
| Inline webhook HTTP in afterChange | Simple flow | Blocks admin saves if run-api is slow/down; double-fires | Only for prototyping; replace before production |
| Store media locally | Faster local dev | Files lost on k8s pod restart; cannot scale | Only in local development |
| Use `@payloadcms/storage-r2` | Matches R2 name | Only works in Workers runtime; fails in Node.js/k8s | Never for this deployment |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Cloudflare R2 adapter | Installing `storage-r2` for Node.js | Use `@payloadcms/storage-s3` with R2's S3-compatible endpoint |
| R2 CORS | Not configuring CORS; admin uploads fail with preflight errors | Configure CORS via S3 API (`PutBucketCors`). Dashboard CORS is not supported for R2. Allow `PUT`/`POST` from admin domain. |
| R2 public file access | `disablePayloadAccessControl: true` without public R2 URL | Set up R2 custom domain for public access, or keep Payload proxying files |
| R2 adapter stability | Assuming stable API | Pin `@payloadcms/storage-s3` to exact version; adapter is beta-quality for R2 |
| run-api webhook receiver | Not validating HMAC before processing | Always verify HMAC signature. Reject with 401 on invalid. |
| run-api emailStatus updates | Hardcoded admin creds in run-api | Dedicated service user with minimal permissions |
| Payload package alignment | Different `@payloadcms/*` versions | Install all together; CI check for version alignment |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| No `depth` limit on Local API | Slow renders; recursive relationship population | Pass `depth: 0` or `depth: 1`; populate selectively | >50 posts with media+user relationships |
| Missing tenant filter on queries | Response includes all tenants' content | Always include `where: { tenant: { equals: id } }` even with access control | >10 tenants, >100 posts each |
| Lexical rich text in list queries | Large `content` JSON fetched for every list item | Use `select` to exclude `content` from list queries | >500 posts with rich content |
| No image size limits on Media | 20MB photo slows admin; R2 costs grow | Set `imageSizes` with max dimensions; `staticOptions.limits.fileSize` | First large image upload |
| Unindexed tenant field | Full table scans on tenant-scoped queries | Verify plugin creates index; add manually if needed | >1000 total documents |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Empty `PAYLOAD_SECRET` fallback | Auth tokens trivially forgeable | Throw at startup if missing (CONCERNS.md) |
| `payload-jobs` not tenant-scoped | Scheduled posts visible across tenants | Use run-api queue, not Payload jobs ([#12849](https://github.com/payloadcms/payload/issues/12849)) |
| Shared webhook secret across tenants | One compromised secret exposes all | Derive per-tenant secrets: `HMAC(masterSecret, tenantId)` |
| SuperAdmin access to all tenants | Compromised SuperAdmin = full breach | SuperAdmin for platform ops only; campaign managers never get SuperAdmin |
| Tenant selector visible to managers | Campaign managers can switch tenants | Verify plugin hides selector for single-tenant users ([#13589](https://github.com/payloadcms/payload/issues/13589)) |
| Local API default `overrideAccess: true` | Frontend bypasses all tenant isolation | Always pass `overrideAccess: false` in frontend code |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Layout builder without preview | Managers cannot see page while editing | Enable Live Preview (supports server components in v3) |
| Block slug mismatch | Missing React component = blank section, no error | `RenderBlocks` with fallback: "Unknown block: {slug}" in dev, error log in prod |
| Template switch loses content | New template may not render all block types | All templates render all blocks; differ in styling only |
| Too many block types | Non-technical users overwhelmed | 5-7 types for v1: Hero, Text, Image+Text, Issues, CTA, Embed, Spacer |
| previousDoc stale with drafts | Webhook fires on draft save | Guard with `_status` comparison, not just existence check |

## "Looks Done But Isn't" Checklist

- [ ] **Tenant isolation:** Plugin installed, admin UI shows selector -- but Local API returns cross-tenant data. Verify: two tenants, cross-query returns empty.
- [ ] **Webhook idempotency:** afterChange fires on publish -- but also on drafts and autosaves. Verify: draft save = 0 webhooks; publish = exactly 1.
- [ ] **R2 public access:** Uploads work in admin -- but public pages 403 on images. Verify: image URL in incognito browser.
- [ ] **Migration workflow:** App starts, schema created -- but `push: true` still active. Verify: `migrations/` has files; `push: false` in prod.
- [ ] **Tenant config:** Collection exists, admin edits settings -- but frontend returns wrong tenant's data. Verify: two tenants, different colors, both render correctly.
- [ ] **Block rendering:** Blocks render in admin -- but public site shows blanks. Verify: page with every block type, public URL shows all.
- [ ] **Slug per-tenant:** Works for one tenant -- second cannot create `/about`. Verify: two tenants both create `about` page.
- [ ] **R2 adapter:** Uploads work locally -- fail in k8s. Verify: using `storage-s3` not `storage-r2`.
- [ ] **Access control scope:** Manager edits own content -- but can switch tenants. Verify: login as manager, selector hidden.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Cross-tenant data leak via Local API | HIGH | Audit all Local API calls; add `overrideAccess: false`; integration tests; breach communication if data exposed |
| Push mode corrupted migration state | MEDIUM | Drop migration tracking table; regenerate initial migration; backup restore if data lost |
| Infinite webhook loop | LOW | Restart Node.js; add `req.context` guard; deduplicate in run-api |
| Globals used instead of isGlobal collection | HIGH | Create tenant-scoped collection; migrate Global data per-tenant; update queries; delete Global |
| Versioning broken for tenant users | LOW | Disable versioning (data preserved); re-enable when fix confirmed |
| R2 CORS blocking uploads | LOW | Add CORS via S3 API. No data loss. |
| Wrong R2 adapter | LOW | Swap `storage-r2` for `storage-s3`; update config; redeploy |
| Slug uniqueness failure | MEDIUM | Drop unique constraint via migration; add beforeValidate hook |
| Tenant deletion crash | LOW | Restrict delete access; soft-delete; manual cleanup if needed |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Local API bypasses tenant isolation | Multi-tenancy setup | Integration test: two tenants, cross-query empty |
| Slug uniqueness per tenant | Collection schema design | Two tenants both create `/about` |
| Globals not partitioned | Collection schema design | `isGlobal: true` in plugin; no Globals for tenant data |
| Push mode in production | Database migration | `push: false` in prod; `migrations/` exists |
| afterChange double-fire | Webhook integration | Draft = 0 webhooks; publish = 1 |
| Tenant deletion crash | Multi-tenancy setup | `cleanupAfterTenantDelete: false`; soft-delete |
| Versioning + multi-tenant | Collection schema design | Test with tenant user; defer if broken |
| SQLite to Postgres data | Database migration | Accept fresh start; seed script ready |
| R2 adapter selection | Media storage setup | `storage-s3` installed, not `storage-r2` |
| R2 CORS | Media storage setup | Upload from deployed URL works |
| PAYLOAD_SECRET empty | Database migration (first fix) | Startup crash if missing |
| payload-jobs not scoped | Webhook integration | Use run-api queue |
| Block slug mismatch | Frontend templates | RenderBlocks has fallback |
| Package version alignment | Every phase (CI) | All `@payloadcms/*` same version |

## Sources

- [Payload Local API Access Control](https://payloadcms.com/docs/local-api/access-control) -- overrideAccess default
- [Payload Multi-Tenant Plugin Docs](https://payloadcms.com/docs/plugins/multi-tenant) -- isGlobal, configuration
- [Payload Migrations Docs](https://payloadcms.com/docs/database/migrations) -- push vs migrate
- [Payload Hooks Context](https://payloadcms.com/docs/hooks/context) -- req.context loop prevention
- [Payload Collection Hooks](https://payloadcms.com/docs/hooks/collections) -- afterChange lifecycle
- [Payload Storage Adapters](https://payloadcms.com/docs/upload/storage-adapters) -- R2 beta, adapter differences
- [GitHub #14576: Tenant deletion on Postgres](https://github.com/payloadcms/payload/issues/14576) -- transaction abort (OPEN)
- [GitHub #14938: Slug uniqueness ignores tenant](https://github.com/payloadcms/payload/issues/14938) -- OPEN
- [GitHub #11071: Multi-tenant + versioning](https://github.com/payloadcms/payload/issues/11071) -- field path error
- [GitHub #12849: Jobs not tenant-scoped](https://github.com/payloadcms/payload/issues/12849) -- isolation gap
- [GitHub #13589: Admin UI tenant visibility](https://github.com/payloadcms/payload/issues/13589) -- selector bug
- [GitHub #10740: Globals validation with multi-tenant](https://github.com/payloadcms/payload/issues/10740) -- isGlobal error
- [GitHub Discussion #816: Hook infinite loops](https://github.com/payloadcms/payload/discussions/816) -- patterns
- [Build with Matija: Postgres migrations](https://www.buildwithmatija.com/blog/payloadcms-postgres-push-to-migrations) -- push: false
- [Build with Matija: Multi-tenant globals](https://www.buildwithmatija.com/blog/how-to-configure-globals-with-multi-tenant-plugin-in-payload-cms) -- isGlobal workaround
- [Cloudflare Community: R2 CORS](https://community.cloudflare.com/t/cors-issue-with-r2-presigned-url/428567) -- presigned URL issues
- [Bridger Tower: Payload R2 Guide](https://bridger.to/payload-r2) -- R2 setup

---
*Pitfalls research for: PayloadCMS v3 multi-tenant campaign website platform*
*Researched: 2026-03-11*
