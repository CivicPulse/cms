---
phase: 2
slug: content-collections-tenant-config
status: complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-11
audited: 2026-03-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node/tsx (Local API integration script) — same pattern as Phase 1 smoke test |
| **Config file** | none — `src/tests/phase2-smoke.ts` created in Wave 0 |
| **Quick run command** | `NODE_ENV=development npx tsx src/tests/phase2-smoke.ts` |
| **Full suite command** | `NODE_ENV=development npx tsx src/tests/phase2-smoke.ts` + manual R2 upload check |
| **Estimated runtime** | ~10 seconds (Local API, no running server) |

---

## Sampling Rate

- **After every task commit:** Run `NODE_ENV=development npx tsx src/tests/phase2-smoke.ts`
- **After every plan wave:** Run full smoke script + manual R2 upload check
- **Before `/gsd:verify-work`:** All smoke tests green + manual CONF-03 REST seed verified
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | CONT-01 | integration | `NODE_ENV=development npx tsx src/tests/phase2-smoke.ts` | ✅ | ✅ green |
| 02-01-02 | 01 | 1 | CONT-01 | integration | `NODE_ENV=development npx tsx src/tests/phase2-smoke.ts` | ✅ | ✅ green |
| 02-01-03 | 01 | 1 | CONT-02 | integration | `NODE_ENV=development npx tsx src/tests/phase2-smoke.ts` | ✅ | ✅ green |
| 02-01-04 | 01 | 1 | CONT-02 | integration | `NODE_ENV=development npx tsx src/tests/phase2-smoke.ts` | ✅ | ✅ green |
| 02-02-01 | 02 | 1 | CONT-03 | integration | `NODE_ENV=development npx tsx src/tests/phase2-smoke.ts` | ✅ | ✅ green |
| 02-02-02 | 02 | 1 | CONT-04 | manual | R2 upload check via admin UI | — | ✅ manual-verified |
| 02-03-01 | 03 | 2 | CONF-01 | integration | `NODE_ENV=development npx tsx src/tests/phase2-smoke.ts` | ✅ | ✅ green |
| 02-03-02 | 03 | 2 | CONF-02 | manual | REST API key auth via curl | — | ✅ manual-only |
| 02-03-03 | 03 | 2 | CONF-03 | manual | REST seed via curl with API key | — | ✅ manual-verified |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] `src/tests/phase2-smoke.ts` — Local API integration test script covering CONT-01, CONT-02, CONT-03, CONF-01
- [x] `npm install @payloadcms/storage-s3 @aws-sdk/client-s3` — packages installed in package.json
- [x] `.env.local` additions documented — R2 env vars (R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL) and WEBHOOK_SECRET

*Playwright is installed (v1.58.2) but not needed — Local API tests cover all automatable requirements without a running server.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Upload image via admin panel → file stored in R2 | CONT-04 | Requires running server + real R2 credentials | 1. Start dev server. 2. Log in as tenant user. 3. Upload image in Media collection. 4. Verify returned URL starts with `R2_PUBLIC_URL`. 5. Check R2 bucket in Cloudflare dashboard for file at `media/{filename}`. |
| REST API key auth returns data | CONF-02 | Requires running HTTP server + API key generated in admin UI — Local API uses `overrideAccess`/`user` params, not HTTP headers | 1. Start dev server: `npm run dev`. 2. Go to `/admin` → Users → create/edit super-admin. 3. Generate API key from user record. 4. `curl http://localhost:3000/api/site-settings -H "Authorization: users API-Key {key}"`. 5. Expect 200 with SiteSettings documents. |
| Seed SiteSettings via REST with API key auth | CONF-03 | Requires running server + API key generated in DB | 1. Start dev server. 2. Generate API key for run-api user via admin UI. 3. `curl -X POST http://localhost:3000/api/site-settings -H "Authorization: users API-Key {key}" -d '{...}'`. 4. Verify 201 response with created document. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or manual-only designation
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-03-12

---

## Validation Audit 2026-03-12

| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 1 (CONF-02 reclassified to manual-only) |
| Escalated | 0 |

**Automated assertions:** 11 passing (CONT-01: 2, CONT-02: 2, CONT-03: 5, CONF-01: 3, CONT-04/CONF-02/CONF-03: SKIP)
**Manual-only:** 3 (CONT-04, CONF-02, CONF-03)
**Test file:** `src/tests/phase2-smoke.ts`
**Run command:** `NODE_ENV=development npx tsx src/tests/phase2-smoke.ts`
