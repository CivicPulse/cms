---
phase: 4
slug: phase3-drizzle-migration
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| **Quick run command** | `ls src/migrations/*.ts \| wc -l` (expect 3+) |
| **Full suite command** | `docker compose down -v && docker compose up -d && npx payload migrate` |
| **Estimated runtime** | ~30 seconds (DB restart + migration) |

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
| 4-01-01 | 01 | 1 | FOUND-02 | smoke | `npx payload migrate:create` (generates migration) | ❌ W0 | ⬜ pending |
| 4-01-02 | 01 | 1 | FOUND-02 | inspection | Read generated `.ts` file, verify DDL covers 3 schema changes | ❌ W0 | ⬜ pending |
| 4-01-03 | 01 | 1 | FOUND-02 | smoke | `ls src/migrations/index.ts` + verify new entry | ❌ W0 | ⬜ pending |
| 4-01-04 | 01 | 2 | FOUND-02 | integration | `docker compose down -v && docker compose up -d && npx payload migrate` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- None — this phase generates infrastructure files (migration), not application code. The migration file IS the deliverable. Verification is running it against a fresh DB.

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration SQL covers all 3 schema changes | FOUND-02 | Generated SQL must be read and verified for completeness | Read `.ts` file; confirm DDL for: `_status` column + enum, `_posts_v` table, `featured_image_id` column, `site_settings_nav_items` table |
| Production flow works end-to-end | FOUND-02 | Requires fresh DB + migration run | `docker compose down -v && docker compose up -d && npx payload migrate` — expect 3 migrations applied, 0 errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
