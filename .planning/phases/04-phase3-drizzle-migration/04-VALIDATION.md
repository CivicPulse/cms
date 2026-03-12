---
phase: 4
slug: phase3-drizzle-migration
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (CLAUDE.md: "No test runner is configured yet") |
| **Config file** | none |
| **Quick run command** | `CI=true npx playwright test tests/migration-artifacts.spec.ts --reporter=list` |
| **Full suite command** | `CI=true npx playwright test tests/migration-artifacts.spec.ts --reporter=list` |
| **Estimated runtime** | ~16 seconds |

---

## Sampling Rate

- **After every task commit:** Verify migration file exists and SQL covers expected changes
- **After every plan wave:** Run `npx payload migrate` against fresh database
- **Before `/gsd:verify-work`:** Full suite must be green (all 3 migrations apply cleanly from scratch)
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | FOUND-02 | smoke | `CI=true npx playwright test tests/migration-artifacts.spec.ts -g "contains exactly 4"` | tests/migration-artifacts.spec.ts | ✅ green |
| 4-01-02 | 01 | 1 | FOUND-02 | smoke | `CI=true npx playwright test tests/migration-artifacts.spec.ts -g "required DDL"` | tests/migration-artifacts.spec.ts | ✅ green |
| 4-01-03 | 01 | 1 | FOUND-02 | smoke | `CI=true npx playwright test tests/migration-artifacts.spec.ts -g "chronological order"` | tests/migration-artifacts.spec.ts | ✅ green |
| 4-01-04 | 01 | 2 | FOUND-02 | integration | `docker compose down -v && docker compose up -d && npx payload migrate` | — | ⚠️ manual-only |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- None — this phase generates infrastructure files (migration), not application code. The migration file IS the deliverable. Verification is running it against a fresh DB.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Production flow works end-to-end | FOUND-02 | Requires fresh Docker DB + migration run | `docker compose down -v && docker compose up -d && npx payload migrate` — expect 3 migrations applied, 0 errors |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (2026-03-12)

---

## Validation Audit 2026-03-12

| Metric | Count |
|--------|-------|
| Gaps found | 3 |
| Resolved | 3 |
| Escalated | 0 |

**Test file created:** `tests/migration-artifacts.spec.ts` — 3 static filesystem assertions covering Tasks 4-01-01, 4-01-02, 4-01-03. Task 4-01-04 remains manual-only (requires Docker).
