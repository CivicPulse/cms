# Phase 1: Multi-Tenant Foundation - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate Payload from SQLite to PostgreSQL, wire `@payloadcms/plugin-multi-tenant` to a `tenants` collection, and enforce tenant isolation at the data layer. Campaign managers can only see and edit their own tenant's data in both admin UI and REST API. No content collections yet — this phase delivers the isolation foundation that all future phases build on.

</domain>

<decisions>
## Implementation Decisions

### Super-admin identity
- `role` field on the `Users` collection with two values: `super-admin` and `campaign-manager`
- Super-admins have unrestricted access across all tenants; campaign-managers are scoped to their tenant
- Role assignment only via direct DB write or seed script — no UI path for privilege escalation
- Super-admins see a visible indicator in the Payload admin panel showing which tenant is currently active (prevents accidental edits to wrong tenant data)

### Tenant status semantics
- Three status values: `active`, `suspended`, `archived`
- `suspended`: blocks campaign manager admin login; public site continues to serve (billing/violation scenario — public info stays up)
- `archived`: blocks admin login AND public site returns 404 (fully shut down; content preserved in DB but nothing served)
- Enforcement split: Payload access control handles admin lockout (Phase 1 scope); Next.js middleware handles public site behavior (Phase 3 scope)

### Domain field format
- `domain` field stores the full hostname (e.g., `mycamp.campaigns.civpulse.com`)
- Required + unique at both Payload field level and Postgres unique constraint — prevents routing ambiguity
- Single field serves both purposes: multi-tenant plugin admin routing AND Phase 3 middleware tenant resolution (`request.hostname` matched directly to `domain`)
- Custom domains in v2 (e.g., `www.janesdoe.com`) fit naturally into this shape without schema changes

### Migration workflow
- Migration files committed to git under `src/migrations/` — required for production deploys and schema history
- Local dev: Docker Compose provides a Postgres container; developers run `payload migrate` against it
- Initial migration starts fresh (no SQLite data worth preserving — scaffold only)
- Production: container entrypoint runs `payload migrate && next start` (auto-migrate on startup)
- Dev: migrations run manually after pulling schema changes

### Claude's Discretion
- Exact `payload.config.ts` startup validation approach for missing `PAYLOAD_SECRET` / `DATABASE_URL` (throw Error vs process.exit)
- Multi-tenant plugin configuration details (which fields are managed by plugin vs custom)
- Smoke test implementation (scripted vs manual admin UI walkthrough)
- Docker Compose file specifics (postgres version, volume config, health check)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/collections/Users.ts`: Bare auth collection — needs `role` field added (super-admin/campaign-manager) and tenant relationship wired
- `src/collections/Posts.ts`: Simple title + content collection — will need tenant scoping in Phase 1 to prove isolation; content fields expanded in Phase 2
- `src/payload.config.ts`: Has `secret: process.env.PAYLOAD_SECRET || ''` — this is exactly the empty-string fallback FOUND-01 requires removing

### Established Patterns
- Collections use named exports (`export const Users`, `export const Posts`) imported into `payload.config.ts` — new `Tenants` collection follows same pattern
- TypeScript throughout; `payload-types.ts` generated at build time

### Integration Points
- `payload.config.ts`: Swap `sqliteAdapter` for `postgresAdapter`; add `multiTenantPlugin`; replace `|| ''` with startup validation
- `src/collections/`: Add `Tenants.ts`; update `Users.ts` with role field; register in config
- `src/migrations/`: New directory for committed migration files (doesn't exist yet)
- `docker-compose.yml`: New file at repo root for local Postgres dev setup (doesn't exist yet)

</code_context>

<specifics>
## Specific Ideas

- Middleware resolution pattern selected: `payload.find({ where: { domain: { equals: request.hostname } } })` — direct hostname match, no string manipulation
- Production entrypoint: `payload migrate && next start`
- Status field: `active` | `suspended` | `archived` (string enum, not boolean)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-multi-tenant-foundation*
*Context gathered: 2026-03-11*
