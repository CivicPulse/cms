---
phase: 01-multi-tenant-foundation
plan: 02
subsystem: database
tags: [payload, postgres, multi-tenant, collections, access-control]

# Dependency graph
requires:
  - phase: 01-multi-tenant-foundation/01-01
    provides: "env.ts with validated PAYLOAD_SECRET and DATABASE_URL; Docker Compose Postgres; db-postgres and plugin-multi-tenant packages installed"

provides:
  - "Tenants collection (displayName, slug, domain unique, status select)"
  - "Users collection with role field (super-admin/campaign-manager) and tenantsArrayField"
  - "Posts collection registered in multi-tenant plugin"
  - "payload.config.ts using postgresAdapter with push:dev and multiTenantPlugin cleanupAfterTenantDelete:false"
  - "Login hook blocking suspended/archived campaign managers"

affects:
  - 01-03-schema-migration
  - 02-content-collections
  - frontend-tenant-routing

# Tech tracking
tech-stack:
  added: ["@payloadcms/plugin-multi-tenant (wired)", "@payloadcms/db-postgres (wired)"]
  patterns:
    - "env import first in payload.config.ts — fails fast at startup on missing vars"
    - "push: process.env.NODE_ENV === 'development' — schema push only in dev"
    - "delete: () => false on Tenants — soft-delete via archived status only"
    - "tenantsArrayField at top level of Users fields (plugin constraint)"
    - "afterOperation hook on login for tenant status gating"

key-files:
  created:
    - src/collections/Tenants.ts
  modified:
    - src/collections/Users.ts
    - src/collections/Posts.ts
    - src/payload.config.ts

key-decisions:
  - "cleanupAfterTenantDelete: false — required workaround for Postgres transaction abort bug #14576"
  - "push: process.env.NODE_ENV === 'development' — prevents schema push in production"
  - "Tenants.delete always returns false — archived status is the soft-delete mechanism, avoids #14576 entirely"
  - "afterOperation hook on Users login to block suspended/archived campaign managers (super-admins never blocked)"
  - "tenantsArrayField placed at top level of Users fields array per plugin constraint (Pitfall 5)"

patterns-established:
  - "Access guard pattern: super-admin check returns true, others return constraint object or false"
  - "Login gate pattern: afterOperation on 'login', check first tenant status, throw APIError 403 with isPublic:true"
  - "env-first import: env.ts is always the first import in payload.config.ts"

requirements-completed: [FOUND-03, FOUND-04, FOUND-05, FOUND-06]

# Metrics
duration: 10min
completed: 2026-03-11
---

# Phase 1 Plan 2: Multi-Tenant Plugin Wiring Summary

**PostgreSQL adapter + multiTenantPlugin wired into Payload; Tenants collection with locked field shape; Users with role-gated access and login block for suspended/archived tenants**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-11T14:10:00Z
- **Completed:** 2026-03-11T14:20:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Tenants collection created with displayName, slug (unique), domain (unique), status (active/suspended/archived) fields and super-admin-only create/update access
- Users collection updated with role select field (super-admin/campaign-manager), tenantsArrayField at top level, and afterOperation hook that blocks suspended/archived campaign managers from logging in
- payload.config.ts fully rewritten: SQLite removed, postgresAdapter wired with push:dev-only guard, multiTenantPlugin registered with cleanupAfterTenantDelete:false and Posts in plugin's collections config

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/collections/Tenants.ts** - `1ae65b7` (feat)
2. **Task 2: Update Users.ts — role field and tenantsArrayField** - `e5a5379` (feat)
3. **Task 3: Rewrite payload.config.ts — Postgres adapter + multi-tenant plugin** - `8caea68` (feat)

## Files Created/Modified

- `src/collections/Tenants.ts` - New Tenants collection: displayName, slug, domain, status fields; delete blocked; create/update super-admin only
- `src/collections/Users.ts` - Added role field, tenantsArrayField, login block hook for suspended/archived tenants
- `src/collections/Posts.ts` - Added access block; registered in plugin collections config
- `src/payload.config.ts` - Rewrote: env first import, postgresAdapter, multiTenantPlugin with cleanupAfterTenantDelete:false

## Decisions Made

- `cleanupAfterTenantDelete: false` required — Postgres transaction abort bug (#14576) makes true value crash on tenant deletion
- Tenants deletion blocked entirely (`delete: () => false`) — archived status is the soft-delete mechanism; this also eliminates any trigger for the #14576 bug path
- `push: process.env.NODE_ENV === 'development'` — schema auto-push only in dev; plan 01-03 creates migration files for production workflow
- Login gate uses `afterOperation` hook (not `beforeOperation`) because the resolved user with tenant relationship is only available after the auth operation completes
- `tenantsArrayField` placed at top level of Users fields (not inside a group or tab) per plugin constraint documented in research Pitfall 5

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None — Postgres must be running (from plan 01-01 Docker Compose), and `.env.local` must have `DATABASE_URL` set (from plan 01-01 setup). No additional external configuration needed for this plan.

## Next Phase Readiness

- Payload config and schema collections are wired and ready
- Plan 01-03 (migration) can now run `payload migrate:create` to generate the initial migration file and smoke-test Payload startup with Postgres
- No blockers — workarounds for both plugin bugs (#14576, #14938) are in place

---
*Phase: 01-multi-tenant-foundation*
*Completed: 2026-03-11*
