---
phase: 1
slug: multi-tenant-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured — Wave 0 installs `tsx` smoke test script |
| **Config file** | `scripts/smoke-test.ts` — Wave 0 creates |
| **Quick run command** | `npx tsx scripts/smoke-test.ts` |
| **Full suite command** | `npx tsx scripts/smoke-test.ts` (same — no framework yet) |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx scripts/smoke-test.ts` for any change touching collections or plugin config
- **After every plan wave:** Full smoke test + manual admin UI walkthrough
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| env-validation | 01 | 0 | FOUND-01 | smoke | `node -e "delete process.env.PAYLOAD_SECRET; require('./dist/env.js')"` | ❌ W0 | ⬜ pending |
| db-url-validation | 01 | 0 | FOUND-01 | smoke | `node -e "delete process.env.DATABASE_URL; require('./dist/env.js')"` | ❌ W0 | ⬜ pending |
| postgres-adapter | 01 | 1 | FOUND-02 | smoke | `npx payload migrate` against fresh Postgres | ❌ W0 | ⬜ pending |
| migrations-dir | 01 | 1 | FOUND-02 | static | `ls src/migrations/` | ❌ W0 | ⬜ pending |
| tenants-collection | 01 | 1 | FOUND-04 | smoke | `npx tsx scripts/smoke-test.ts` | ❌ W0 | ⬜ pending |
| plugin-install | 01 | 1 | FOUND-03 | integration | `npx tsx scripts/smoke-test.ts` | ❌ W0 | ⬜ pending |
| campaign-manager-isolation | 01 | 2 | FOUND-05 | integration | `npx tsx scripts/smoke-test.ts` (two tenants, cross-query) | ❌ W0 | ⬜ pending |
| admin-ui-isolation | 01 | 2 | FOUND-03 | manual | Log in as campaign-manager; verify zero cross-tenant docs in list views | N/A | ⬜ pending |
| cleanup-disabled | 01 | 1 | FOUND-06 | static | `grep "cleanupAfterTenantDelete" src/payload.config.ts` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/smoke-test.ts` — end-to-end smoke covering FOUND-03, FOUND-04, FOUND-05 (create two tenants, create posts in each, query with tenant A user and assert B data absent)
- [ ] `src/env.ts` — Zod validation module (prerequisite for FOUND-01 tests)
- [ ] `docker-compose.yml` — Postgres dev container (prerequisite for all DB tests)
- [ ] `src/migrations/` — directory created by `payload migrate:create` after config changes

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin UI shows zero cross-tenant docs | FOUND-03 | Requires browser session; Payload admin UI rendering can't be unit-tested | Log in as campaign-manager for Tenant A; navigate to Posts list; assert no Tenant B posts visible |
| Tenant selector hidden from campaign managers | FOUND-03 | UI visibility check; GitHub #13589 fix status unknown | Log in as campaign-manager; verify no tenant switcher is visible in admin nav |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
