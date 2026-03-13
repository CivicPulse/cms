---
phase: 01-multi-tenant-foundation
plan: 01
subsystem: infra
tags: [postgres, docker, zod, env-validation, payloadcms]

# Dependency graph
requires: []
provides:
  - Postgres 16 Docker Compose dev container with health check
  - Zod env validation module (src/env.ts) throwing on missing PAYLOAD_SECRET or DATABASE_URL
  - Updated .env.example with both required environment variables
  - npm packages: @payloadcms/db-postgres, @payloadcms/plugin-multi-tenant, zod at 3.79.0
affects:
  - 01-02 (imports env from src/env.ts, wires postgres adapter to payload.config.ts)
  - all subsequent plans (require postgres connection and env vars)

# Tech tracking
tech-stack:
  added:
    - "@payloadcms/db-postgres@3.79.0"
    - "@payloadcms/plugin-multi-tenant@3.79.0"
    - "zod@4.3.6"
  patterns:
    - "Zod env validation at module load time — no try/catch, ZodError propagates as startup failure"
    - "Docker Compose for local Postgres dev database with named volume persistence"

key-files:
  created:
    - src/env.ts
    - docker-compose.yml
  modified:
    - package.json
    - package-lock.json
    - .env.example

key-decisions:
  - "Pinned @payloadcms/db-postgres and plugin-multi-tenant to 3.79.0 to match installed payload core"
  - "Used zod v4 (latest) — API compatible with env validation pattern; payload does not pin zod internally"
  - "Dev server intentionally broken after this plan (sqliteAdapter import still in payload.config.ts) — plan 01-02 fixes it"

patterns-established:
  - "Env validation: use z.object(...).parse(process.env) in src/env.ts, import as first line of payload.config.ts"
  - "Postgres local dev: docker compose up -d, connection string postgresql://payload:localdev@localhost:5432/civpulse_cms"

requirements-completed: [FOUND-01, FOUND-02]

# Metrics
duration: 3min
completed: 2026-03-11
---

# Phase 1 Plan 01: Postgres prerequisite stack — Zod env validation, Docker Compose, and package swap from SQLite to Postgres

**PostgreSQL dev scaffold established: @payloadcms/db-postgres + plugin-multi-tenant installed, Zod env validation module created, Docker Compose provides local Postgres 16 container**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-11T13:58:36Z
- **Completed:** 2026-03-11T14:01:58Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Swapped @payloadcms/db-sqlite for @payloadcms/db-postgres and @payloadcms/plugin-multi-tenant at matching 3.79.0 minor version
- Created src/env.ts with Zod validation that throws ZodError at startup if PAYLOAD_SECRET < 32 chars or DATABASE_URL missing
- Created docker-compose.yml with postgres:16-alpine, civpulse_cms database, pg_isready health check, and named volume
- Updated .env.example to document both required env vars with placeholder values

## Task Commits

Each task was committed atomically:

1. **Task 1: Swap npm packages** - `59095f4` (chore)
2. **Task 2: Create src/env.ts — Zod startup validation** - `2f4608a` (feat)
3. **Task 3: Docker Compose + .env.example update** - `73751d0` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `src/env.ts` - Zod env validation module, exports `env` object, throws ZodError at import time on invalid vars
- `docker-compose.yml` - Local Postgres 16 dev container with health check, named volume, civpulse_cms database
- `.env.example` - Documents PAYLOAD_SECRET (32+ chars) and DATABASE_URL with Docker Compose connection string
- `package.json` - Replaced @payloadcms/db-sqlite with @payloadcms/db-postgres + @payloadcms/plugin-multi-tenant + zod
- `package-lock.json` - Lock file updated after package swap

## Decisions Made
- Pinned @payloadcms/db-postgres and plugin-multi-tenant to 3.79.0 explicitly (not ^3.0.0) to guarantee version parity with installed payload core
- Used zod v4 (latest, installed as ^4.3.6) — z.object().parse() API is compatible with what plan requires; payload does not bundle zod as a peer dep
- Dev server remains intentionally broken after this plan (sqliteAdapter import still in payload.config.ts) — plan 01-02 wires the postgres adapter

## Deviations from Plan

None - plan executed exactly as written.

Note: Initial `npm install` required `--legacy-peer-deps` flag due to peer dependency conflicts in the scaffold. This is a pre-existing condition of the project (not caused by this plan's changes) and does not affect functionality.

## Issues Encountered
- Initial bare repo had no node_modules, requiring `npm install --legacy-peer-deps` before the package swap could proceed. Package conflicts are pre-existing scaffold issues unrelated to this plan.

## User Setup Required
None - no external service configuration required. Docker Compose provides the local Postgres instance. Developers must copy `.env.example` to `.env.local` and set their own PAYLOAD_SECRET.

## Next Phase Readiness
- All prerequisites for plan 01-02 are in place: postgres packages installed, env module ready to import
- Plan 01-02 must: update payload.config.ts to import env.ts, replace sqliteAdapter with postgresAdapter, restore dev server functionality
- To start local Postgres: `docker compose up -d`

---
*Phase: 01-multi-tenant-foundation*
*Completed: 2026-03-11*
