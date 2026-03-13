---
phase: 6
slug: audit-tech-debt-sweep
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-12
audited: 2026-03-13
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Playwright (E2E) + build verification |
| **Config file** | `playwright.config.ts` (E2E), `tsconfig.json` (build) |
| **Quick run command** | `npm run build` |
| **Full suite command** | `npm run build && npm run lint && npx playwright test` |
| **Estimated runtime** | ~60 seconds (build ~30s, lint ~5s, E2E ~25s) |

---

## Sampling Rate

- **After every task commit:** Run `npm run build`
- **After every plan wave:** Run `npm run build && npm run lint`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | E2E Coverage | Status |
|---------|------|------|-------------|-----------|-------------------|--------------|--------|
| 06-01-01 | 01 | 1 | SC-1: api.ts dead code + env import | build + grep | `npm run build && ! grep -q 'NEXT_PUBLIC_RUN_API_BASE_URL' src/lib/api.ts` | `tests/newsletter.spec.ts` (exercises api.ts consumers) | ✅ green |
| 06-01-02 | 01 | 1 | SC-2: blog page env consistency | build + grep | `grep -q "env.SITE_DOMAIN" src/app/\(frontend\)/blog/\[slug\]/page.tsx` | `tests/post.spec.ts` (renders blog post + share buttons) | ✅ green |
| 06-01-03 | 01 | 1 | SC-3: templates.ts dead code removal | build + grep | `! grep -q 'getTemplateKey' src/lib/templates.ts` | `tests/templates.spec.ts` (all 3 templates render) | ✅ green |
| 06-01-04 | 01 | 1 | SC-4: middleware dedup | build + grep | `! grep -q 'endsWith.*localhost.*\|\|.*endsWith.*localhost' src/middleware.ts` | `tests/middleware.spec.ts` (subdomain routing works) | ✅ green |
| 06-01-05 | 01 | 1 | SC-5: build passes | build | `npm run build` | N/A (build is the test) | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. No test framework installation needed — verification is via `npm run build`, grep-based confirmation that dead code is removed, and existing Playwright E2E tests that exercise the modified files and confirm behavioral preservation.

---

## Manual-Only Verifications

None. All phase behaviors have automated verification via build + grep + existing E2E tests.

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

## Validation Audit 2026-03-13

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |

**Audit notes:** Phase 6 was a dead code removal + env pattern consistency phase. All 5 success criteria verified green via grep checks and `npm run build`. Existing Playwright E2E tests (`newsletter.spec.ts`, `post.spec.ts`, `templates.spec.ts`, `middleware.spec.ts`) provide behavioral regression coverage for each modified file, confirming the refactoring preserved the contract. No new tests needed.
