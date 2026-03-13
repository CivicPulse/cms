# Phase 1: Multi-Tenant Foundation - Research

**Researched:** 2026-03-11
**Domain:** PayloadCMS v3 multi-tenancy on PostgreSQL — adapter swap, plugin wiring, tenant isolation, migration workflow
**Confidence:** HIGH (all critical claims verified against prior domain research with GitHub issue references and official docs)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Super-admin identity:** `role` field on `Users` with values `super-admin` and `campaign-manager`. Super-admins unrestricted; campaign-managers scoped to their tenant. Role assignment via DB write or seed script only — no UI path for privilege escalation.
- **Super-admin indicator:** Visible indicator in Payload admin showing which tenant is active (prevents accidental edits).
- **Tenant status semantics:** Three values — `active`, `suspended`, `archived`. Suspended blocks admin login; public site still serves. Archived blocks admin login AND returns 404 on public site. Payload access control handles admin lockout (Phase 1 scope); Next.js middleware handles public 404 (Phase 3 scope).
- **Domain field format:** `domain` stores full hostname (e.g., `mycamp.campaigns.civpulse.com`). Required + unique at both Payload field level and Postgres unique constraint. Single field for both plugin admin routing and Phase 3 middleware hostname resolution.
- **Migration workflow:** Migration files committed to git under `src/migrations/`. Local dev: Docker Compose provides Postgres container; developers run `payload migrate`. Initial migration starts fresh (no SQLite data to preserve). Production: entrypoint runs `payload migrate && next start`.
- **`cleanupAfterTenantDelete: false`:** Required — cascade delete on Postgres triggers transaction abort bug (GitHub #14576, open).

### Claude's Discretion

- Exact `payload.config.ts` startup validation approach for missing `PAYLOAD_SECRET` / `DATABASE_URL` (throw Error vs process.exit)
- Multi-tenant plugin configuration details (which fields managed by plugin vs custom)
- Smoke test implementation (scripted vs manual admin UI walkthrough)
- Docker Compose file specifics (postgres version, volume config, health check)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| FOUND-01 | App fails to start with clear error if `PAYLOAD_SECRET` or `DATABASE_URL` are missing (no silent empty-string fallbacks) | Zod env validation pattern in `src/env.ts`, imported before `buildConfig`; throw Error on parse failure |
| FOUND-02 | Database migrated from `@payloadcms/db-sqlite` to `@payloadcms/db-postgres` with `push: false` and migration workflow established | `postgresAdapter` config pattern, `push: false` for non-dev, `migrationDir: './src/migrations'`, CLI commands documented |
| FOUND-03 | `@payloadcms/plugin-multi-tenant` wired to `tenants` collection; tenant isolation enforced at row level for all content collections | Full plugin config pattern with `userHasAccessToAllTenants`, `tenantsArrayField` on Users, collection registration |
| FOUND-04 | `tenants` collection defined with `slug`, `displayName`, `domain`, `status` fields | Custom `Tenants.ts` collection definition with all fields; `domain` unique constraint; `status` select field |
| FOUND-05 | Campaign manager users restricted to their tenant's data in both admin UI and Local API queries (`overrideAccess: false` in all internal tenant-scoped queries) | Access control patterns: plugin handles admin UI; `overrideAccess: false` required for any Local API call from non-admin server code |
| FOUND-06 | `cleanupAfterTenantDelete: false` set in plugin config (prevents Postgres transaction crash bug) | Confirmed required mitigation for GitHub #14576 (open, November 2025) |
</phase_requirements>

---

## Summary

Phase 1 replaces the SQLite scaffold with PostgreSQL and wires `@payloadcms/plugin-multi-tenant` to establish row-level tenant isolation. All six requirements are buildable with the current Payload v3 ecosystem. The work splits into four concrete areas: (1) swap database adapter and establish migration workflow, (2) add env validation at startup, (3) define the `Tenants` collection with the locked field shape, and (4) update `Users` with a `role` field and wire the plugin.

The prior domain research (STACK.md, PITFALLS.md, ARCHITECTURE.md) is comprehensive and current as of 2026-03-11 at Payload v3.79.0. The critical known risk — `cleanupAfterTenantDelete: false` for the Postgres transaction crash bug (GitHub #14576) — is already locked in CONTEXT.md. A secondary known risk is that issue #14938 (slug uniqueness is global not per-tenant) affects future phases but not Phase 1 since Posts is only added as proof-of-isolation here, not as a production content collection.

**Primary recommendation:** Implement in this order: env validation → Docker Compose + Postgres adapter swap → migration → Tenants collection → Users role field + plugin → Posts tenant-scoping → smoke test. Each step is a discrete, verifiable task.

---

## Standard Stack

### Core Changes for Phase 1

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@payloadcms/db-postgres` | `^3.79.0` | PostgreSQL adapter (replaces db-sqlite) | First-party adapter; uses Drizzle ORM + node-postgres; version-matched with core |
| `@payloadcms/plugin-multi-tenant` | `^3.79.0` | Tenant isolation — admin UI filtering, access control, tenant field injection | Official Payload plugin; only supported multi-tenant path |
| `zod` | `^3.23.0` | Runtime env var validation at startup | Lightweight; produces clear error messages; no Payload-specific coupling |

### Already Installed (No Change)

| Library | Version | Purpose |
|---------|---------|---------|
| `payload` | `^3.79.0` | Core CMS |
| `@payloadcms/next` | `^3.79.0` | Next.js integration |
| `@payloadcms/richtext-lexical` | `^3.79.0` | Rich text editor |
| `next` | `^15.0.0` | Framework |

### To Remove

| Library | Why Remove |
|---------|-----------|
| `@payloadcms/db-sqlite` | Replaced by PostgreSQL adapter |

### Installation

```bash
# Remove SQLite adapter
npm uninstall @payloadcms/db-sqlite

# Add PostgreSQL, multi-tenant plugin, and env validation
npm install @payloadcms/db-postgres @payloadcms/plugin-multi-tenant zod

# Verify all @payloadcms/* packages are on the same version
npm ls | grep @payloadcms
```

**Pin strategy:** All `@payloadcms/*` packages must be on the same minor version. Payload publishes in lockstep; mixing versions causes type mismatches and runtime errors.

---

## Architecture Patterns

### Recommended File Changes

```
src/
├── env.ts                    # NEW: Zod env validation (imported first in payload.config.ts)
├── collections/
│   ├── Tenants.ts            # NEW: Tenants collection definition
│   ├── Users.ts              # MODIFY: Add role field + tenantsArrayField
│   └── Posts.ts              # MODIFY: Register with multi-tenant plugin (prove isolation)
├── migrations/               # NEW DIRECTORY: committed migration files
│   └── 0001_initial.ts       # Generated by `payload migrate:create`
└── payload.config.ts         # MODIFY: swap adapter, add plugin, import env

docker-compose.yml            # NEW: at repo root, Postgres dev container
.env.example                  # MODIFY: add DATABASE_URL
```

### Pattern 1: Env Validation at Startup (FOUND-01)

**What:** Validate required env vars before `buildConfig` executes; throw on missing values.
**When:** Always — imported as first line of `payload.config.ts`.

```typescript
// src/env.ts
// Source: Architecture research, Pitfalls research (Pitfall 12)
import { z } from 'zod'

export const env = z.object({
  PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must be at least 32 characters'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
}).parse(process.env)
// Throws ZodError with clear field-level messages if either is missing/empty
```

**Claude's Discretion note:** `z.parse()` throws a `ZodError` (not `process.exit`). This is the preferred approach — Next.js/Payload will surface a clear startup error. If a simple `throw new Error` style is preferred, wrap with try/catch.

**Important:** Phase 1 only validates `PAYLOAD_SECRET` and `DATABASE_URL`. R2 and webhook vars are not required until Phases 2-3.

### Pattern 2: PostgreSQL Adapter with Migration Workflow (FOUND-02)

**What:** Replace SQLite adapter; disable push for non-dev; set explicit migration directory.

```typescript
// src/payload.config.ts
// Source: STACK.md (HIGH confidence), official Postgres docs
import { env } from './env'
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  secret: env.PAYLOAD_SECRET,
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    push: process.env.NODE_ENV === 'development', // NEVER push in production
    migrationDir: './src/migrations',
  }),
  // ...
})
```

**Migration CLI commands:**
```bash
# After any schema change, generate migration file
npx payload migrate:create

# Apply pending migrations (run in CI/CD and production entrypoint)
npx payload migrate

# Check which migrations have/haven't run
npx payload migrate:status
```

**Production entrypoint pattern (locked decision):**
```bash
payload migrate && next start
```

### Pattern 3: Tenants Collection (FOUND-04)

**What:** Define the `Tenants` collection with the exact field shape from locked decisions.

```typescript
// src/collections/Tenants.ts
import type { CollectionConfig } from 'payload'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'displayName',
  },
  access: {
    // Only super-admins can create/update/delete tenants directly
    // Campaign managers never touch this collection
    create: ({ req }) => req.user?.role === 'super-admin',
    update: ({ req }) => req.user?.role === 'super-admin',
    delete: () => false,  // Deletion restricted entirely; use status = archived
    read: () => true,     // Plugin needs read access for tenant resolution
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,  // URL-safe identifier; global uniqueness is correct here
      admin: {
        description: 'URL-safe identifier, e.g. jones-for-council',
      },
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
      unique: true,  // Postgres unique constraint; prevents routing ambiguity
      admin: {
        description: 'Full hostname, e.g. mycamp.campaigns.civpulse.com',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Suspended', value: 'suspended' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        description: 'Suspended: admin blocked, public site up. Archived: admin blocked, public 404.',
      },
    },
  ],
}
```

**Status enforcement (Phase 1 scope — admin lockout only):**
- Suspended/archived tenants: campaign managers blocked from admin login via access control on Users or via Payload's `beforeOperation` hook on the auth flow.
- Public site 404 for archived tenants: Phase 3 Next.js middleware (out of scope here).

### Pattern 4: Users Collection with Role Field (FOUND-03, FOUND-05)

**What:** Add `role` select field and `tenantsArrayField` from the plugin to the existing `Users` collection.

```typescript
// src/collections/Users.ts
// Source: STACK.md, plugin documentation
import type { CollectionConfig } from 'payload'
import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  access: {
    // Campaign managers can only see themselves
    read: ({ req }) => {
      if (req.user?.role === 'super-admin') return true
      return { id: { equals: req.user?.id } }
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'campaign-manager',
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Campaign Manager', value: 'campaign-manager' },
      ],
      // No UI-based escalation: hide this field from non-super-admins
      access: {
        update: ({ req }) => req.user?.role === 'super-admin',
      },
    },
    // tenantsArrayField adds the array of tenant associations
    // Cannot be nested inside a named group/tab; can be inside row, collapsible, unnamed-tab
    tenantsArrayField({
      tenantsCollectionSlug: 'tenants',
    }),
  ],
}
```

### Pattern 5: Multi-Tenant Plugin Configuration (FOUND-03, FOUND-06)

**What:** Wire the plugin in `payload.config.ts` registering all tenant-scoped collections.

```typescript
// src/payload.config.ts
// Source: STACK.md (HIGH confidence), official plugin docs
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

export default buildConfig({
  plugins: [
    multiTenantPlugin({
      collections: {
        posts: {},  // Phase 1: posts added only to prove isolation
      },
      tenantsSlug: 'tenants',
      cleanupAfterTenantDelete: false,  // REQUIRED: Postgres transaction crash bug #14576
      userHasAccessToAllTenants: (user) => user?.role === 'super-admin',
    }),
  ],
  // ...
})
```

**What the plugin does automatically:**
- Adds hidden `tenant` relationship field to all registered collections
- Adds tenant selector dropdown in admin UI (hidden for single-tenant users)
- Filters admin list views and relationships by selected tenant
- Uses `tenantsArrayField` on Users to determine which tenants a user can access

**What the plugin does NOT do:**
- Enforce `overrideAccess: false` on Local API calls — developer must do this explicitly
- Handle suspended/archived tenant login blocking — must be custom access control
- Handle public site 404 for archived tenants — Phase 3 middleware

### Pattern 6: Local API Isolation Guard (FOUND-05)

**What:** Any server-side code querying tenant-scoped collections MUST pass `overrideAccess: false`.
**When:** Every `payload.find()` / `payload.findByID()` in non-admin server code.

```typescript
// Correct pattern for tenant-scoped queries from server code
// Source: PITFALLS.md Pitfall 1 (HIGH confidence)
const posts = await payload.find({
  collection: 'posts',
  where: { tenant: { equals: tenantId } },
  overrideAccess: false,
  user: req.user,  // Pass the scoped user object
})

// WRONG — default overrideAccess: true bypasses all tenant isolation
const posts = await payload.find({ collection: 'posts' })
```

### Pattern 7: Docker Compose for Local Dev (Claude's Discretion)

**What:** Provide Postgres container for local development without requiring local Postgres install.

```yaml
# docker-compose.yml (repo root)
# Source: Community guides, Docker Compose conventions
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: civpulse_cms
      POSTGRES_USER: payload
      POSTGRES_PASSWORD: localdev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U payload -d civpulse_cms']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Corresponding `.env.local` line:
```
DATABASE_URL=postgresql://payload:localdev@localhost:5432/civpulse_cms
```

**Claude's Discretion note:** Postgres 16-alpine is the current stable recommendation. Version 17 exists but 16 has broader ecosystem compatibility. Health check uses `pg_isready` which is included in the official image.

### Anti-Patterns to Avoid

- **`push: true` in production:** Auto-applies destructive schema changes at startup; corrupts migration tracking. Set `push: process.env.NODE_ENV === 'development'`.
- **`cleanupAfterTenantDelete: true`:** Triggers `DrizzleQueryError: current transaction is aborted` on Postgres. Always `false` for this project.
- **Payload Globals for tenant config:** Globals are singletons across the entire deployment. Use `isGlobal: true` in plugin collection config (Phase 2 concern).
- **Local API without `overrideAccess: false`:** The default `overrideAccess: true` silently bypasses all tenant isolation in server-side code.
- **Empty string fallback on secrets:** `process.env.PAYLOAD_SECRET || ''` is in the current scaffold and must be removed. Empty string allows trivially forgeable auth tokens.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Admin UI tenant selector | Custom dropdown + filtering | `@payloadcms/plugin-multi-tenant` | Plugin injects selector, filters list views, manages tenant context across admin panel |
| Tenant field on collections | Manual relationship field + access hooks | Plugin's automatic injection via `collections: { posts: {} }` | Plugin handles field addition, base filters, admin routing, access control hooks |
| User-to-tenant association | Custom user-tenant join table | `tenantsArrayField` from plugin | Plugin provides the array field and manages association logic |
| Row-level tenant isolation | Custom access control functions per collection | `useTenantAccess: true` (plugin default) | Plugin generates correct per-collection access control |
| Migration management | Ad-hoc SQL scripts | `payload migrate:create` / `payload migrate` | Drizzle-generated migrations; tracked in `payload_migrations` table; rollback supported |

**Key insight:** The multi-tenant plugin reduces what would be weeks of custom access control, admin UI filtering, and tenant-field management to a ~15-line config block. The main developer responsibilities are: define the Tenants collection fields, add `role` to Users, and always use `overrideAccess: false` in non-admin server code.

---

## Common Pitfalls

### Pitfall 1: Postgres Transaction Crash on Tenant Delete (FOUND-06)

**What goes wrong:** Deleting a tenant with `cleanupAfterTenantDelete: true` (the default) throws `DrizzleQueryError: current transaction is aborted, commands ignored until end of transaction block`. The cascade delete fails mid-transaction; Postgres aborts the entire transaction.

**Why it happens:** The cascade delete hits a failure (often in `payload_preferences`), aborting the Postgres transaction. Drizzle continues issuing queries against the dead transaction. SQLite is more lenient, masking this bug in dev.

**How to avoid:** Set `cleanupAfterTenantDelete: false` in plugin config. Restrict tenant deletion access to API-only (run-api provisioning). Use `status: 'archived'` as soft-delete.

**Confidence:** HIGH — GitHub #14576 (open, November 2025, draft PR #15520).

### Pitfall 2: Local API Bypasses Tenant Isolation by Default (FOUND-05)

**What goes wrong:** Every `payload.find()` call has `overrideAccess: true` by default. Server-side code (Next.js server components, API routes) silently returns cross-tenant data if the developer forgets `overrideAccess: false`.

**Why it happens:** The Local API is designed for trusted contexts like seeding/migrations. Developers use the same API for multi-tenant frontend code and forget the isolation requirement.

**How to avoid:** Never call `payload.find()` in server code without `overrideAccess: false` + `user: req.user`. Write an integration test that creates two tenants, queries from tenant A's user context, and asserts zero docs from tenant B.

**Confidence:** HIGH — documented in Payload Local API access control docs.

### Pitfall 3: Empty PAYLOAD_SECRET Fallback (FOUND-01)

**What goes wrong:** Current `src/payload.config.ts` has `secret: process.env.PAYLOAD_SECRET || ''`. Empty string allows trivially forgeable JWT auth tokens. No startup error — app runs with broken security.

**How to avoid:** Remove the `|| ''` fallback. Use Zod env validation in `src/env.ts` that throws on startup if missing. This is the first change to make.

**Warning signs:** Current codebase has this exact pattern — it's the first line to fix.

**Confidence:** HIGH — code confirmed via direct file read.

### Pitfall 4: Push Mode Active in Non-Dev Environments

**What goes wrong:** `push: true` (the Drizzle default) auto-applies schema changes at startup in production. Destructive changes (dropped columns, renamed tables) are applied silently. Mixing push and migrations corrupts the migration tracking table.

**How to avoid:** Set `push: process.env.NODE_ENV === 'development'`. Create migration files with `payload migrate:create` after every schema change. Apply migrations with `payload migrate` in production entrypoint.

**Confidence:** HIGH — documented in Payload migrations docs and confirmed in PITFALLS.md.

### Pitfall 5: `tenantsArrayField` Placement Constraint

**What goes wrong:** `tenantsArrayField` cannot be nested inside a named field (group, named tab, array). If placed inside such a container, it silently fails to wire up correctly.

**How to avoid:** Place `tenantsArrayField` at the top level of `fields`, or inside a `row`, unnamed tab, or `collapsible` only.

**Confidence:** MEDIUM — documented in plugin README, cross-referenced via search results.

### Pitfall 6: Payload Package Version Mismatch

**What goes wrong:** Installing `@payloadcms/db-postgres` or `@payloadcms/plugin-multi-tenant` at a different version than `payload` core causes type errors, runtime crashes, or subtle data issues.

**How to avoid:** Install all packages together. After install, run `npm ls | grep @payloadcms` and verify all are on the same version. Use `^3.79.0` for all.

**Confidence:** HIGH — architectural behavior of Payload's monorepo lockstep publishing.

---

## Code Examples

### Startup Validation (FOUND-01)

```typescript
// src/env.ts
// Source: ARCHITECTURE.md Pattern 4
import { z } from 'zod'

export const env = z.object({
  PAYLOAD_SECRET: z.string().min(32, 'PAYLOAD_SECRET must be at least 32 characters'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required — set it in .env.local'),
}).parse(process.env)
// ZodError thrown at module load time if validation fails
// Next.js surfaces this as a clear startup error with field-level messages
```

### PostgreSQL Adapter (FOUND-02)

```typescript
// src/payload.config.ts (db section)
// Source: STACK.md (HIGH confidence)
import { env } from './env'
import { postgresAdapter } from '@payloadcms/db-postgres'

db: postgresAdapter({
  pool: {
    connectionString: env.DATABASE_URL,
  },
  push: process.env.NODE_ENV === 'development',
  migrationDir: './src/migrations',
}),
```

### Full Plugin Config (FOUND-03, FOUND-06)

```typescript
// Source: STACK.md multi-tenancy section
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'

plugins: [
  multiTenantPlugin({
    collections: {
      posts: {},
    },
    tenantsSlug: 'tenants',
    cleanupAfterTenantDelete: false,
    userHasAccessToAllTenants: (user) => user?.role === 'super-admin',
  }),
],
```

### Suspended/Archived Tenant Login Block (FOUND-03, FOUND-04)

**What:** Prevent suspended/archived campaign managers from authenticating.

```typescript
// In Users.ts access control — blocks admin login based on tenant status
// Source: Payload access control docs pattern
access: {
  // This runs at auth time to block suspended/archived tenant managers
},
// Alternatively: use a beforeOperation hook on the 'login' operation
// to check user.tenants[0].tenant.status and reject if not 'active'
```

**Claude's Discretion note:** The exact implementation (access control function vs beforeOperation hook vs afterOperation hook) has tradeoffs. A `beforeOperation` hook on `login` is the cleanest: check the user's assigned tenant status and throw an `APIError` with a clear message if suspended/archived. This produces a proper 403 response rather than a silent login failure.

```typescript
// Recommended approach: hooks in Users collection
hooks: {
  beforeOperation: [
    async ({ operation, req, args }) => {
      if (operation === 'login') {
        // After login resolves the user, check their tenant status
        // Note: this may require checking in afterOperation instead,
        // since the user isn't resolved until after login completes
      }
    },
  ],
},
```

**Research gap:** The exact hook timing for blocking login based on tenant status requires testing. `afterOperation` on login can invalidate the token after the fact; `beforeOperation` fires before user resolution. Both are viable; the planner should choose `afterOperation` as the safer path.

### Super-Admin Tenant Indicator (Locked Decision)

**What:** Show which tenant is active in admin UI for super-admins.

```typescript
// The multi-tenant plugin renders a tenant selector dropdown in the admin UI.
// For super-admins, this selector is always visible — it IS the "active tenant" indicator.
// No additional implementation needed beyond plugin's default behavior.
// Verify the selector is visible for super-admin and hidden for campaign-manager.
// Source: plugin docs — userHasAccessToAllTenants controls selector visibility
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SQLite for all environments | Postgres for production/dev parity | Phase 1 migration | Multi-tenant at scale; concurrent writes; existing CivPulse infra |
| `db push` auto-sync | Committed migration files in `src/migrations/` | Phase 1 migration | Production safety; schema history; CI/CD safe |
| `PAYLOAD_SECRET \|\| ''` fallback | Zod validation at startup | Phase 1 change | Clear startup errors; no silent security holes |
| No tenant concept | `@payloadcms/plugin-multi-tenant` wired to collections | Phase 1 addition | Row-level isolation; admin UI tenant scoping |

**Deprecated in this project:**
- `@payloadcms/db-sqlite`: Removed entirely in Phase 1
- `cms.db` SQLite file: Gitignored and abandoned (no data worth preserving)
- `process.env.PAYLOAD_SECRET || ''` pattern: Replaced by Zod env schema

---

## Open Questions

1. **Suspended tenant login block timing**
   - What we know: Payload hooks offer `beforeOperation` and `afterOperation`; login resolves user asynchronously
   - What's unclear: Whether `beforeOperation` on `login` fires before or after user resolution (i.e., can we read the resolved user's tenant status there)
   - Recommendation: Implement as `afterOperation` hook on the users collection's `login` operation; check user's tenant status and throw `APIError` if not `active`. Test with a suspended tenant user to verify the error message propagates correctly.

2. **Tenant selector visibility for single-tenant campaign managers**
   - What we know: Plugin documentation says selector is shown/hidden based on `userHasAccessToAllTenants`; GitHub #13589 notes a bug where selector may be visible to campaign managers
   - What's unclear: Whether #13589 is fixed in v3.79.0
   - Recommendation: Smoke test this during Phase 1 — log in as a campaign-manager user and verify the tenant selector is hidden. If visible, it's a known unfixed bug; document in state.

3. **Smoke test form (Claude's Discretion)**
   - Options: (a) scripted CLI using `payload.create()` / `payload.find()` / `payload.delete()` with a seed script; (b) manual admin UI walkthrough with documented steps
   - Recommendation: Scripted seed/smoke script at `scripts/smoke-test.ts` — more repeatable, can be run in CI. Uses the Local API with a super-admin user context.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test runner is configured yet") |
| Config file | Wave 0 must create — `jest.config.ts` or `vitest.config.ts` |
| Quick run command | `npx tsx scripts/smoke-test.ts` (script-based; no framework needed for Phase 1) |
| Full suite command | Same — no automated test suite exists yet |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOUND-01 | App throws clear error when `PAYLOAD_SECRET` absent | smoke | `node -e "delete process.env.PAYLOAD_SECRET; require('./src/env.ts')"` (ts-node) | Wave 0 |
| FOUND-01 | App throws clear error when `DATABASE_URL` absent | smoke | Same pattern | Wave 0 |
| FOUND-02 | `push: false` in non-dev; `src/migrations/` directory exists | manual | Check `ls src/migrations/` and config code review | Wave 0 |
| FOUND-02 | `payload migrate` applies migration cleanly | smoke | `npx payload migrate` against fresh Postgres | Wave 0 |
| FOUND-03 | Plugin filters admin list by tenant | manual | Log in as campaign-manager; verify zero cross-tenant docs in list views | N/A (manual) |
| FOUND-03 | `overrideAccess: false` prevents cross-tenant data | integration | `npx tsx scripts/smoke-test.ts` | Wave 0 |
| FOUND-04 | Tenants collection creates docs with correct fields | smoke | `npx tsx scripts/smoke-test.ts` (create tenant, check fields) | Wave 0 |
| FOUND-05 | Campaign manager Local API returns zero Tenant B data | integration | `npx tsx scripts/smoke-test.ts` (two tenants, cross-query) | Wave 0 |
| FOUND-06 | `cleanupAfterTenantDelete: false` in config | static | Code review / grep | N/A (code) |

### Sampling Rate

- **Per task:** Run `npx tsx scripts/smoke-test.ts` for any change touching collections or plugin config
- **Per wave merge:** Full smoke test + manual admin UI walkthrough
- **Phase gate:** All six FOUND requirements verified before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `scripts/smoke-test.ts` — covers FOUND-03, FOUND-04, FOUND-05 (create two tenants, create posts in each, query with tenant A user and assert B data absent)
- [ ] `src/env.ts` — the Zod validation module (prerequisite for FOUND-01 tests)
- [ ] `docker-compose.yml` — Postgres dev container (prerequisite for all DB tests)
- [ ] `src/migrations/` — directory created by `payload migrate:create` after config changes

---

## Sources

### Primary (HIGH confidence)

- `.planning/research/STACK.md` — PayloadCMS v3.79.0 full stack; multi-tenant plugin config; Postgres adapter config; migration workflow
- `.planning/research/PITFALLS.md` — All critical pitfalls with GitHub issue references; `cleanupAfterTenantDelete` bug; Local API isolation; push mode danger
- `.planning/research/ARCHITECTURE.md` — Architecture patterns; anti-patterns; env validation example; tenant resolution; hook recursion pattern
- `src/payload.config.ts` (direct read) — Confirmed `|| ''` fallback exists; SQLite currently in use
- `src/collections/Users.ts`, `Posts.ts` (direct read) — Confirmed bare collections; no role field yet

### Secondary (MEDIUM confidence)

- [GitHub #14576](https://github.com/payloadcms/payload/issues/14576) — Tenant deletion Postgres transaction crash (OPEN, November 2025, draft PR #15520) — `cleanupAfterTenantDelete: false` confirmed required
- [WebSearch: Postgres adapter migration config](https://www.buildwithmatija.com/blog/payloadcms-postgres-push-to-migrations) — `push: false`, `migrationDir`, production workflow patterns
- [WebSearch: Docker Compose Postgres](https://payloadcms.com/community-help/discord/) — `postgres:16-alpine`, healthcheck `pg_isready`, `condition: service_healthy`
- [WebSearch: tenantsArrayField constraints](https://www.npmjs.com/package/@payloadcms/plugin-multi-tenant) — cannot be in named group/tab; top-level or unnamed container only
- [GitHub #15145](https://github.com/payloadcms/payload/issues/15145) — Bulk edit tenant assignment crash (January 2026, open) — do not use bulk edit for tenant assignment in Phase 1

### Tertiary (LOW confidence — flagged for validation)

- [GitHub #13589](https://github.com/payloadcms/payload/issues/13589) — Tenant selector visible to campaign managers — fix status in v3.79.0 unclear; validate during smoke test

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — prior domain research verified at v3.79.0; direct package.json and source file reads confirm current state
- Architecture: HIGH — patterns come from ARCHITECTURE.md and PITFALLS.md which cited official docs and GitHub issues
- Pitfalls: HIGH — critical pitfalls (transaction crash, Local API isolation, push mode) all have GitHub issue numbers or official doc citations
- Smoke test approach: MEDIUM — scripted approach recommended but exact hook timing for login blocking needs testing

**Research date:** 2026-03-11
**Valid until:** 2026-04-10 (30 days; Payload publishes frequently but plugin API is stable at minor version)
