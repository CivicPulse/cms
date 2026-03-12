---
phase: 5
slug: tech-debt-cleanup
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
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
| 05-01-01 | 01 | 1 | N/A-01 | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 05-01-02 | 01 | 1 | N/A-01 | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 05-02-01 | 02 | 1 | N/A-02 | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 05-02-02 | 02 | 1 | N/A-03 | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 05-03-01 | 03 | 1 | N/A-04 | manual | Code review + grep | N/A | ⬜ pending |
| 05-03-02 | 03 | 1 | N/A-05 | compile | `npx tsc --noEmit` | N/A | ⬜ pending |
| 05-XX-XX | XX | 2 | N/A-06 | build | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

TypeScript compilation (`npx tsc --noEmit`) and build (`npm run build`) are the only validation tools needed, and both are already available. No test framework installation required for this refactoring phase.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WEBHOOK_SECRET runtime guard exists | N/A-04 | Behavioral pattern, not type-checkable | `grep -n 'WEBHOOK_SECRET!' src/hooks/fireWebhook.ts` should return 0 matches; `grep -n 'WEBHOOK_SECRET' src/hooks/fireWebhook.ts` should show guard pattern |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
