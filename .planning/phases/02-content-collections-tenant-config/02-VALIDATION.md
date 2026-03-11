---
phase: 2
slug: content-collections-tenant-config
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node/tsx (Local API integration script) — same pattern as Phase 1 smoke test |
| **Config file** | none — Wave 0 creates `src/tests/phase2-smoke.ts` |
| **Quick run command** | `npx tsx src/tests/phase2-smoke.ts` |
| **Full suite command** | `npx tsx src/tests/phase2-smoke.ts` + manual R2 upload check |
| **Estimated runtime** | ~10 seconds (Local API, no running server) |

---

## Sampling Rate

- **After every task commit:** Run `npx tsx src/tests/phase2-smoke.ts`
- **After every plan wave:** Run full smoke script + manual R2 upload check
- **Before `/gsd:verify-work`:** All smoke tests green + manual CONF-03 REST seed verified
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CONT-01 | integration | `npx tsx src/tests/phase2-smoke.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | CONT-01 | integration | `npx tsx src/tests/phase2-smoke.ts` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | CONT-02 | integration | `npx tsx src/tests/phase2-smoke.ts` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | CONT-02 | integration | `npx tsx src/tests/phase2-smoke.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | CONT-03 | integration | `npx tsx src/tests/phase2-smoke.ts` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | CONT-04 | manual | R2 upload check via admin UI | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | CONF-01 | integration | `npx tsx src/tests/phase2-smoke.ts` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | CONF-02 | integration | `npx tsx src/tests/phase2-smoke.ts` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | CONF-03 | manual | REST seed via curl with API key | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/tests/phase2-smoke.ts` — Local API integration test script covering CONT-01, CONT-02, CONT-03, CONF-01, CONF-02
- [ ] `npm install @payloadcms/storage-s3 @aws-sdk/client-s3` — packages not yet in package.json
- [ ] `.env.local` additions documented — R2 env vars (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL) needed before any R2 test

*Playwright is installed (v1.58.2) but not needed for Wave 0 — Local API tests cover most requirements without a running server.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Upload image via admin panel → file stored in R2 | CONT-04 | Requires running server + real R2 credentials | 1. Start dev server. 2. Log in as tenant user. 3. Upload image in Media collection. 4. Verify returned URL starts with `R2_PUBLIC_URL`. 5. Check R2 bucket in Cloudflare dashboard for file at `{tenantId}/{filename}`. |
| Seed SiteSettings via REST with API key auth | CONF-03 | Requires running server + API key generated in DB | 1. Start dev server. 2. Generate API key for run-api user via admin UI. 3. `curl -X POST http://localhost:3000/api/site-settings -H "Authorization: users API-Key {key}" -d '{...}'`. 4. Verify 201 response with created document. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
