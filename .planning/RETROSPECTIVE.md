# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — CivPulse Campaign CMS

**Shipped:** 2026-03-13
**Phases:** 6 | **Plans:** 17 | **Sessions:** multi-session (3 days)

### What Was Built
- Multi-tenant PostgreSQL foundation with row-level isolation via @payloadcms/plugin-multi-tenant
- Content collections: Posts (with email publishing), Pages (block layouts), Media (R2), SiteSettings (per-tenant config)
- Public frontend with subdomain routing, 3 templates (Classic/Modern/Bold), blog, newsletter signup
- HMAC-signed webhook pipeline: post publish → run-api → email-status callback
- 3 ordered Drizzle migrations covering full schema evolution
- Server actions for newsletter form integration with run-api

### What Worked
- Phase dependency chain (Foundation → Content → Frontend) prevented integration issues — each phase built cleanly on the last
- Milestone audit process caught 2 real gaps: missing Phase 3 Drizzle migration (INT-01) and accumulated tech debt
- Audit-driven phases (4, 5, 6) systematically closed gaps rather than letting them accumulate
- Zod env validation caught configuration errors at startup rather than at runtime
- Per-tenant slug uniqueness via field validate (not DB unique constraint) was the correct abstraction for multi-tenancy

### What Was Inefficient
- Tech debt accumulated across phases 1-3 required 2 dedicated cleanup phases (5, 6) — earlier attention would have reduced rework
- Type casts (`as unknown as Record`) were used as shortcuts in Phase 3 that required Phase 5 cleanup
- Phase 3 had 7 plans (largest phase) — could have been split into 2 phases for better manageability
- Multiple audit passes needed (4 audit runs) before reaching clean state

### Patterns Established
- Tailwind v4 CSS-first config: all theming via @theme in globals.css, no tailwind.config.js
- Server actions as thin wrappers around lib/ helpers — no duplicated business logic
- Module-level validated env reads (env.ts Zod validation guarantees values at startup)
- Template registry pattern: getTemplate() returns typed Layout/Nav/Hero components
- Soft-delete via archived status for tenants (cleanupAfterTenantDelete: false workaround)
- BlockRenderer uses payload-types union for type-safe block dispatch

### Key Lessons
1. Run milestone audits earlier — the first audit found INT-01 (missing migration) which would have caused production deployment failure
2. Avoid type casts as shortcuts — the 8 `navItems` casts were unnecessary once payload-types.ts was regenerated
3. Pin Payload plugin versions to match core minor version — prevents silent incompatibilities
4. Fire-and-forget webhooks (fetch().catch()) are correct for CMS → external service — don't block the editor experience
5. Edge Runtime middleware cannot import Zod — process.env reads are necessary in Next.js middleware

### Cost Observations
- Model mix: primarily opus for planning/architecture, sonnet for execution
- Sessions: multi-session across 3 days
- Notable: Phase 3 execution (7 plans) completed in ~20 minutes total — parallel component development was highly efficient

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | multi | 6 | Established audit-driven gap closure pattern |

### Cumulative Quality

| Milestone | Tests | Coverage | Nyquist |
|-----------|-------|----------|---------|
| v1.0 | Playwright stubs + smoke tests | Manual verification | COMPLIANT (6/6 phases) |

### Top Lessons (Verified Across Milestones)

1. Audit-driven development catches integration gaps that phase-level testing misses
2. Pin dependency versions to prevent silent incompatibilities in plugin ecosystems
