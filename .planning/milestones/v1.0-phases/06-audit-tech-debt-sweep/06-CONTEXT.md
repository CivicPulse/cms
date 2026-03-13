# Phase 6: Audit Tech Debt Sweep - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Eliminate 5 specific code-level tech debt items surfaced by the v1.0 milestone re-audit: dead code in api.ts, inconsistent env reads in blog page, dead export in templates.ts, and duplicate condition in middleware. No new features, no scope expansion.

</domain>

<decisions>
## Implementation Decisions

### api.ts cleanup
- Remove `getBaseUrl()` entirely — import `env` from `@/env` and use `env.RUN_API_BASE_URL` directly
- Create module-level `const baseUrl = env.RUN_API_BASE_URL.replace(/\/$/, '')` shared by both functions
- Remove the `if (!baseUrl)` guard from both `subscribeToNewsletter` and `updateSubscriber` — env.ts Zod validation guarantees the value at startup, so the guard is unreachable dead code
- Update the file's JSDoc header to reflect that these helpers are called from server actions (`src/actions/newsletter.ts`), not directly from components

### getTemplateKey removal
- Remove `getTemplateKey()` function entirely — zero callers, all pages use `getTemplate()` directly
- Remove the `VALID_KEYS` ReadonlySet constant (only used by `getTemplateKey`)
- Keep `TemplateKey` type and `LayoutProps` type exported — they are the module's public API

### SITE_DOMAIN in blog post page
- In `src/app/(frontend)/blog/[slug]/page.tsx`, import `env` from `@/env` and use `env.SITE_DOMAIN` instead of `process.env.SITE_DOMAIN`
- Simplify the share URL to always use absolute URL: `` `https://${tenantSlug}.${env.SITE_DOMAIN}/blog/${post.slug}` `` — remove the ternary fallback to relative path (env validation guarantees SITE_DOMAIN exists)
- Scope: only fix this specific page — middleware intentionally uses `process.env` due to Edge Runtime

### Middleware dedup
- Remove the duplicate `host.endsWith('.localhost')` condition on line 14 — keep one instance
- Add a brief comment near the `process.env.SITE_DOMAIN` read explaining why it doesn't use `env.ts`: `// Edge Runtime cannot import Zod validation from env.ts`

### Claude's Discretion
- Exact import ordering after adding `env` import to blog page
- Whether to adjust whitespace/formatting in touched files to match project style

</decisions>

<specifics>
## Specific Ideas

- All 5 audit items are mechanical fixes — no behavioral changes
- Phase 5 decision context: server actions are thin wrappers delegating to api.ts helpers, so api.ts simplification doesn't affect the action layer

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/env.ts`: Zod-validated env object — already validates RUN_API_BASE_URL and SITE_DOMAIN at startup
- `src/actions/newsletter.ts`: Server actions that import from `@/lib/api` — only consumer of api.ts

### Established Patterns
- Server-side code imports `env` from `@/env` for validated env vars
- Edge Runtime code (middleware) uses `process.env` directly — cannot import Zod
- Module docstrings describe intended consumers (e.g., "called from server actions")

### Integration Points
- `src/lib/api.ts` → imported by `src/actions/newsletter.ts` (server actions)
- `src/lib/templates.ts` → imported by all page routes via `getTemplate()`
- `src/middleware.ts` → Next.js middleware, runs on every non-excluded request
- `src/app/(frontend)/blog/[slug]/page.tsx` → Server Component, renders individual blog posts

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-audit-tech-debt-sweep*
*Context gathered: 2026-03-12*
