---
phase: 5
slug: tech-debt-cleanup
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-12
audited: 2026-03-12
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (CLAUDE.md: "No test runner is configured yet") |
| **Config file** | none |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | Server actions + form rewire | compile | `npx tsc --noEmit` | N/A | ✅ green |
| 05-01-02 | 01 | 1 | runApiUrl elimination (15 files) | compile+grep | `npx tsc --noEmit && grep -r "runApiUrl" src/ \| wc -l` | N/A | ✅ green |
| 05-02-01 | 02 | 1 | navItems cast removal (8 templates) | compile+grep | `npx tsc --noEmit && grep -r "as unknown as Record" src/components/templates/ \| wc -l` | N/A | ✅ green |
| 05-02-02 | 02 | 1 | featuredImage + WEBHOOK_SECRET + smoke tests | compile+grep | `npx tsc --noEmit && grep -c "WEBHOOK_SECRET!" src/hooks/fireWebhook.ts && grep -c "as { id:" scripts/smoke-test.ts` | N/A | ✅ green |
| 05-02-03 | 02 | 2 | Final build gate | build+grep | `npm run build && grep -r "as unknown as Record" src/ \| wc -l` | N/A | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

TypeScript compilation (`npx tsc --noEmit`) and build (`npm run build`) are the only validation tools needed, and both are already available. No test framework installation required for this refactoring phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WEBHOOK_SECRET runtime guard exists | N/A-04 | Behavioral pattern, not type-checkable | `grep -c "if (!webhookSecret)" src/hooks/fireWebhook.ts` should return 1; `grep -c "WEBHOOK_SECRET!" src/hooks/fireWebhook.ts` should return 0 |

*Note: Manual verification confirmed during audit — guard present at lines 25-31 of fireWebhook.ts.*

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** complete

---

## Validation Audit 2026-03-12

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

All 5 tasks verified green via compile + grep checks. `npx tsc --noEmit` passes clean, `npm run build` succeeds, and all grep assertions confirm zero stale patterns remain.
