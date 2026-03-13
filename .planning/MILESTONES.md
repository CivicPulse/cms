# Milestones

## v1.0 CivPulse Campaign CMS (Shipped: 2026-03-13)

**Phases completed:** 6 phases, 17 plans
**Timeline:** 3 days (2026-03-10 → 2026-03-13)
**LOC:** 5,173 TypeScript | 168 files modified | 109 commits

**Key accomplishments:**
1. Multi-tenant PostgreSQL foundation with plugin-based row-level isolation across all collections
2. Content collections (Posts, Pages, Media, SiteSettings) with R2 storage, block-based layouts, and per-tenant slug uniqueness
3. Public frontend with subdomain routing, 3 distinct templates (Classic/Modern/Bold), and data-driven rendering
4. HMAC-signed webhook pipeline from post publish → run-api → email-status callback with infinite-loop guard
5. Newsletter signup flow with server actions posting to run-api subscriber endpoint
6. Production-ready Drizzle migration chain (3 ordered migrations) and full tech debt sweep

**Known Tech Debt:**
- `push: true` in development (deliberate DX choice — FOUND-02 enforced in production only)

---

