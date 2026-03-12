---
phase: 3
slug: public-frontend-integrations
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-12
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (^1.58.2 -- already in devDependencies, needs config) |
| **Config file** | `playwright.config.ts` -- created by Plan 03-00 (Wave 0) |
| **Quick run command** | `npx playwright test --grep @smoke` |
| **Full suite command** | `npx playwright test` |
| **Estimated runtime** | ~30 seconds (smoke), ~120 seconds (full) |

---

## Sampling Rate

- **After every task commit:** Run `npx playwright test --grep @smoke`
- **After every plan wave:** Run `npx playwright test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-00-01 | 00 | 0 | ALL | infra | `test -f playwright.config.ts && test -f tests/fixtures.ts` | Created by W0 | ⬜ pending |
| 3-00-02 | 00 | 0 | ALL | infra | `ls tests/*.spec.ts \| wc -l \| grep -q 9` | Created by W0 | ⬜ pending |
| 3-01-01 | 01 | 1 | HOOK-01 | integration | `npx playwright test tests/webhook.spec.ts -x` | ✅ W0 | ⬜ pending |
| 3-01-02 | 01 | 1 | HOOK-02 | integration | `npx playwright test tests/webhook.spec.ts -x` | ✅ W0 | ⬜ pending |
| 3-01-03 | 01 | 1 | HOOK-03 | integration | `npx playwright test tests/webhook.spec.ts -x` | ✅ (Phase 2 route) | ⬜ pending |
| 3-02-01 | 02 | 1 | FRONT-01 | integration | `npx playwright test tests/middleware.spec.ts -x` | ✅ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | FRONT-02 | e2e | `npx playwright test tests/homepage.spec.ts -x` | ✅ W0 | ⬜ pending |
| 3-02-03 | 02 | 2 | FRONT-03 | e2e | `npx playwright test tests/blog.spec.ts -x` | ✅ W0 | ⬜ pending |
| 3-02-04 | 02 | 2 | FRONT-04 | e2e | `npx playwright test tests/post.spec.ts -x` | ✅ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | FRONT-05 | e2e | `npx playwright test tests/newsletter.spec.ts -x` | ✅ W0 | ⬜ pending |
| 3-03-02 | 03 | 1 | FRONT-06 | e2e | `npx playwright test tests/templates.spec.ts -x` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Plan

**Plan:** 03-00-PLAN.md (Wave 0)

Creates:
- [x] `playwright.config.ts` -- configure base URL (`http://localhost:3000`), projects, webServer (start dev server)
- [x] `tests/fixtures.ts` -- seed data helpers via Payload Local API
- [x] `tests/` directory -- all 9 test files listed in verification map (stub @smoke tests with test.skip)
- Note: Playwright `^1.58.2` already in devDependencies

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Template visual distinctiveness | FRONT-06 | Visual design quality requires human judgement | Switch between all 3 templates, verify each has visually distinct layout, colors, and typography |
| Font rendering quality | FRONT-02 | Browser font rendering varies | Check homepage in Chrome/Firefox/Safari -- verify fonts load correctly |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved (Wave 0 plan 03-00 created)
