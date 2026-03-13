---
phase: 1
slug: multi-tenant-foundation
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
updated: 2026-03-12
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
| env-validation | 01 | 0 | FOUND-01 | smoke | `npx tsx scripts/test-env-validation.ts` | scripts/test-env-validation.ts | ✅ green |
| db-url-validation | 01 | 0 | FOUND-01 | smoke | `npx tsx scripts/test-env-validation.ts` | scripts/test-env-validation.ts | ✅ green |
| postgres-adapter | 01 | 1 | FOUND-02 | smoke | `npx payload migrate` against fresh Postgres | N/A | ✅ green |
| migrations-dir | 01 | 1 | FOUND-02 | static | `ls src/migrations/` | N/A | ✅ green |
| tenants-collection | 01 | 1 | FOUND-04 | smoke | `npx tsx scripts/smoke-test.ts` | scripts/smoke-test.ts | ✅ green |
| plugin-install | 01 | 1 | FOUND-03 | integration | `npx tsx scripts/smoke-test.ts` | scripts/smoke-test.ts | ✅ green |
| campaign-manager-isolation | 01 | 2 | FOUND-05 | integration | `npx tsx scripts/smoke-test.ts` (two tenants, cross-query) | scripts/smoke-test.ts | ✅ green |
| admin-ui-isolation | 01 | 2 | FOUND-03 | manual | Log in as campaign-manager; verify zero cross-tenant docs in list views | N/A | ✅ green |
| cleanup-disabled | 01 | 1 | FOUND-06 | static | `npx tsx scripts/test-env-validation.ts` | scripts/test-env-validation.ts | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `scripts/smoke-test.ts` — end-to-end smoke covering FOUND-03, FOUND-04, FOUND-05 (create two tenants, create posts in each, query with tenant A user and assert B data absent)
- [x] `src/env.ts` — Zod validation module (prerequisite for FOUND-01 tests)
- [x] `docker-compose.yml` — Postgres dev container (prerequisite for all DB tests)
- [x] `src/migrations/` — directory created by `payload migrate:create` after config changes

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin UI shows zero cross-tenant docs | FOUND-03 | Requires browser session; Payload admin UI rendering can't be unit-tested | Log in as campaign-manager for Tenant A; navigate to Posts list; assert no Tenant B posts visible |
| Tenant selector hidden from campaign managers | FOUND-03 | UI visibility check; GitHub #13589 fix status unknown | Log in as campaign-manager; verify no tenant switcher is visible in admin nav |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** 2026-03-12 — Nyquist auditor filled all 3 gaps; 8/8 assertions green

---

## Validation Audit 2026-03-12

| Metric | Count |
|--------|-------|
| Gaps found | 3 |
| Resolved | 3 |
| Escalated | 0 |

**Details:**
- `env-validation` (MISSING → COVERED): Added subprocess-based test asserting ZodError on missing/short PAYLOAD_SECRET
- `db-url-validation` (MISSING → COVERED): Added subprocess-based test asserting ZodError on missing DATABASE_URL
- `cleanup-disabled` (PARTIAL → COVERED): Added static regex assertion on `cleanupAfterTenantDelete: false` in payload.config.ts
- Test file: `scripts/test-env-validation.ts` (8 assertions, all green)
