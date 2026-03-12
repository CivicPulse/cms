---
phase: 6
slug: audit-tech-debt-sweep
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None configured (no test runner per CLAUDE.md) |
| **Config file** | none |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | SC-1 | build + grep | `npm run build && ! grep -q 'NEXT_PUBLIC_RUN_API_BASE_URL' src/lib/api.ts` | N/A | ⬜ pending |
| 06-01-02 | 01 | 1 | SC-2 | build + grep | `npm run build && grep -q "env.SITE_DOMAIN" src/app/\(frontend\)/blog/\[slug\]/page.tsx` | N/A | ⬜ pending |
| 06-01-03 | 01 | 1 | SC-3 | build + grep | `npm run build && ! grep -q 'getTemplateKey' src/lib/templates.ts` | N/A | ⬜ pending |
| 06-01-04 | 01 | 1 | SC-4 | build + grep | `npm run build` | N/A | ⬜ pending |
| 06-01-05 | 01 | 1 | SC-5 | build | `npm run build` | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — verification is via `npm run build` and grep-based confirmation that dead code is removed.

---

## Manual-Only Verifications

All phase behaviors have automated verification. Each success criterion can be confirmed by build success + grep for removed/changed code.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
