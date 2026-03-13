# Phase 6: Audit Tech Debt Sweep - Research

**Researched:** 2026-03-12
**Domain:** Code cleanup / dead code removal in a Next.js + PayloadCMS v3 project
**Confidence:** HIGH

## Summary

Phase 6 addresses 5 specific, mechanical tech debt items surfaced by the v1.0 milestone re-audit. All items are in files that already exist, with clear before/after states described in the CONTEXT.md decisions. No new libraries, no new patterns, no behavioral changes -- purely surgical code cleanup.

The research confirms every item from the audit by reading the actual source files. All 5 fixes are straightforward: removing dead code paths, switching a direct `process.env` read to the validated `env` object, removing an unused export and its supporting constant, and deduplicating an identical condition in middleware. The only subtlety is that `import { env } from '@/env'` has not yet been used by any file in `src/app/` or `src/lib/` (only `payload.config.ts` imports it via relative path `./env`), so the api.ts and blog page changes establish a new usage pattern for application code.

**Primary recommendation:** Execute all 5 fixes in a single plan -- they are independent, touch 4 distinct files, and each is a 1-10 line change. Verify with `npm run build` after all changes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **api.ts cleanup:** Remove `getBaseUrl()` entirely. Import `env` from `@/env` and use `env.RUN_API_BASE_URL` directly. Create module-level `const baseUrl = env.RUN_API_BASE_URL.replace(/\/$/, '')` shared by both functions. Remove the `if (!baseUrl)` guard from both functions (env.ts Zod validation guarantees the value). Update file JSDoc header.
- **getTemplateKey removal:** Remove `getTemplateKey()` function and `VALID_KEYS` constant entirely. Keep `TemplateKey` type and `LayoutProps` type exported.
- **SITE_DOMAIN in blog post page:** Import `env` from `@/env` and use `env.SITE_DOMAIN`. Simplify share URL to always use absolute URL (remove ternary fallback). Scope: only this page -- middleware intentionally uses `process.env` for Edge Runtime.
- **Middleware dedup:** Remove duplicate `host.endsWith('.localhost')` condition (keep one). Add comment explaining why `process.env.SITE_DOMAIN` is used instead of `env.ts`.

### Claude's Discretion
- Exact import ordering after adding `env` import to blog page
- Whether to adjust whitespace/formatting in touched files to match project style

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | (existing) | Application framework | Already in project |
| PayloadCMS v3 | (existing) | CMS embedded in Next.js | Already in project |
| Zod | v4 (existing) | env.ts validation | Already in project -- used since Phase 1 |

### Supporting
No new libraries required. All changes use existing project code.

## Architecture Patterns

### Existing Pattern: Validated Environment Access

The project has two established patterns for environment variable access:

**Pattern A -- Server-side application code:** Import the Zod-validated `env` object.
```typescript
// In payload.config.ts (uses relative path since it IS in src/)
import { env } from './env'

// In application code under src/app/ or src/lib/ (uses path alias)
import { env } from '@/env'

// Then use: env.RUN_API_BASE_URL, env.SITE_DOMAIN, etc.
```

**Pattern B -- Edge Runtime code:** Use `process.env` directly because Edge Runtime cannot reliably import Zod.
```typescript
// In src/middleware.ts (Edge Runtime)
const siteDomain = process.env.SITE_DOMAIN
// Edge Runtime cannot import Zod validation from env.ts
```

**Pattern C -- Payload hooks:** Use `process.env` directly (hooks run in Payload context).
```typescript
// In src/hooks/fireWebhook.ts
const webhookSecret = process.env.WEBHOOK_SECRET
```

### Current State of Each File

**`src/lib/api.ts`** -- Currently uses Pattern C (process.env) but should use Pattern A. The `getBaseUrl()` function falls back to `NEXT_PUBLIC_RUN_API_BASE_URL` which is never validated and never set. Called only by `src/actions/newsletter.ts` (server actions), which run in Node.js server context -- Pattern A is correct.

**`src/app/(frontend)/blog/[slug]/page.tsx`** -- Currently reads `process.env.SITE_DOMAIN` directly (Pattern C). Should use Pattern A since this is a Server Component running in Node.js. No other file under `src/app/(frontend)/` currently imports from `@/env`, so this will be the first.

**`src/lib/templates.ts`** -- No env changes needed. Only removing dead export `getTemplateKey` and its helper `VALID_KEYS`.

**`src/middleware.ts`** -- Correctly uses Pattern B (process.env) for Edge Runtime. Only fix is removing the duplicate condition and adding an explanatory comment.

### Import Path Convention
- `payload.config.ts` uses relative: `import { env } from './env'`
- All other `src/` files should use the `@/` path alias: `import { env } from '@/env'`
- The `@/*` alias maps to `./src/*` per `tsconfig.json`

### Anti-Patterns to Avoid
- **Adding env.ts import to middleware.ts:** Edge Runtime cannot import Zod. The CONTEXT decision explicitly states middleware stays on `process.env`.
- **Adding runtime guards after env import:** The `if (!baseUrl)` guards become unreachable dead code once `env.RUN_API_BASE_URL` is used (Zod validation throws at startup if missing). Keeping them would be misleading.
- **Changing getTemplate() behavior:** Only `getTemplateKey` is being removed; `getTemplate()` already handles invalid keys with its own `?? templates.modern` fallback.

## Don't Hand-Roll

Not applicable -- this phase removes code rather than adding it.

## Common Pitfalls

### Pitfall 1: Breaking the env.ts Import in api.ts
**What goes wrong:** Importing `env` at module top level in `api.ts` means `env.ts` Zod validation runs when the module is first imported. If any env var is missing, the process crashes at startup -- which is the intended behavior.
**Why it matters:** This is correct and desired. The `getBaseUrl()` pattern with empty-string fallback was the bug (silently degrading). The fix makes missing env vars fail fast.
**How to avoid issues:** Ensure `.env.local` has `RUN_API_BASE_URL` set in dev. This is already required by env.ts.

### Pitfall 2: Forgetting to Remove All Parts of getTemplateKey
**What goes wrong:** Removing the function but leaving `VALID_KEYS` creates an unused constant that ESLint may or may not flag.
**How to avoid:** Remove both `getTemplateKey()` AND `VALID_KEYS` per CONTEXT decision. Keep `TemplateKey` type and `LayoutProps` type.

### Pitfall 3: Removing the Wrong Condition in Middleware
**What goes wrong:** The duplicate is `host.endsWith('.localhost') || host.endsWith('.localhost')` on line 14. Both branches are identical. Removing the wrong one has no functional impact, but keeping the logical OR with one operand is cleaner.
**How to avoid:** Simplify to just `host.endsWith('.localhost')` -- remove the `||` and the duplicate entirely.

### Pitfall 4: Blog Page Share URL Simplification
**What goes wrong:** The current code has `const shareUrl = siteDomain ? ... : '/blog/${post.slug}'`. The CONTEXT decision says to remove the ternary and always use the absolute URL since env validation guarantees SITE_DOMAIN exists. If env.SITE_DOMAIN is somehow empty, the URL would be malformed.
**Why it's safe:** env.ts validates `SITE_DOMAIN` with `.min(1)` -- it cannot be an empty string at runtime.
**How to avoid:** Trust the Zod validation. Use template literal directly without ternary.

## Code Examples

### api.ts After Cleanup
```typescript
/**
 * Server-side API helpers for communicating with run-api.
 *
 * Called from server actions (src/actions/newsletter.ts),
 * NOT directly from client components.
 */

import { env } from '@/env'

interface ApiResult {
  ok: boolean
  error?: string
}

const baseUrl = env.RUN_API_BASE_URL.replace(/\/$/, '')

export async function subscribeToNewsletter(params: {
  email: string
  campaignId: string
}): Promise<ApiResult> {
  try {
    const response = await fetch(
      `${baseUrl}/api/v1/campaigns/${params.campaignId}/subscribers`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: params.email }),
      },
    )

    if (!response.ok) {
      const body = await response.text()
      return { ok: false, error: body || `HTTP ${response.status}` }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}

export async function updateSubscriber(params: {
  campaignId: string
  email: string
  name?: string
  zipCode?: string
}): Promise<ApiResult> {
  try {
    const body: Record<string, string> = {}
    if (params.name) body.name = params.name
    if (params.zipCode) body.zipCode = params.zipCode

    const response = await fetch(
      `${baseUrl}/api/v1/campaigns/${params.campaignId}/subscribers/${encodeURIComponent(params.email)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    )

    if (!response.ok) {
      const text = await response.text()
      return { ok: false, error: text || `HTTP ${response.status}` }
    }

    return { ok: true }
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Network error',
    }
  }
}
```

### templates.ts After Cleanup
```typescript
/**
 * Template registry for campaign website visual themes.
 * ... (existing docstring)
 */

import type { SiteSetting } from '@/payload-types'
import { ClassicLayout } from '@/components/templates/classic/ClassicLayout'
import { ModernLayout } from '@/components/templates/modern/ModernLayout'
import { BoldLayout } from '@/components/templates/bold/BoldLayout'

export type TemplateKey = 'classic' | 'modern' | 'bold'

export type LayoutProps = {
  siteSettings: SiteSetting
  children: React.ReactNode
  campaignId: string
}

const templates: Record<TemplateKey, React.ComponentType<LayoutProps>> = {
  classic: ClassicLayout,
  modern: ModernLayout,
  bold: BoldLayout,
} as const

/**
 * Returns the Layout component for the given template key.
 * Falls back to ModernLayout for unknown keys.
 */
export function getTemplate(key: string): React.ComponentType<LayoutProps> {
  return templates[key as keyof typeof templates] ?? templates.modern
}
```

### blog/[slug]/page.tsx Share URL Change
```typescript
// Before:
const siteDomain = process.env.SITE_DOMAIN
const shareUrl = siteDomain
  ? `https://${tenantSlug}.${siteDomain}/blog/${post.slug}`
  : `/blog/${post.slug}`

// After:
import { env } from '@/env'
// ...
const shareUrl = `https://${tenantSlug}.${env.SITE_DOMAIN}/blog/${post.slug}`
```

### middleware.ts Dedup
```typescript
// Before (line 14):
if (host.endsWith('.localhost') || host.endsWith('.localhost')) {

// After:
if (host.endsWith('.localhost')) {

// And add comment near line 23:
// Edge Runtime cannot import Zod validation from env.ts
const siteDomain = process.env.SITE_DOMAIN
```

## State of the Art

Not applicable -- this is a cleanup phase with no technology decisions.

## Open Questions

None. All 5 items have clear, unambiguous fixes specified in CONTEXT.md decisions.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (per CLAUDE.md: "No test runner is configured yet") |
| Config file | none |
| Quick run command | `npm run build` (TypeScript + Next.js build) |
| Full suite command | `npm run build && npm run lint` |

### Phase Requirements to Test Map

This phase has no formal requirement IDs -- it is a quality improvement phase. The success criteria map as follows:

| Criterion | Behavior | Test Type | Automated Command | File Exists? |
|-----------|----------|-----------|-------------------|-------------|
| SC-1 | api.ts no longer falls back to NEXT_PUBLIC_RUN_API_BASE_URL | code review + build | `npm run build` | N/A |
| SC-2 | blog page reads SITE_DOMAIN via env object | code review + build | `npm run build` | N/A |
| SC-3 | getTemplateKey export removed from templates.ts | code review + build | `npm run build` | N/A |
| SC-4 | Duplicate condition in middleware deduplicated | code review + build | `npm run build` | N/A |
| SC-5 | Build passes with zero errors | build | `npm run build` | N/A |

### Sampling Rate
- **Per task commit:** `npm run build`
- **Per wave merge:** `npm run build && npm run lint`
- **Phase gate:** `npm run build` passes with zero errors

### Wave 0 Gaps
None -- no test infrastructure needed. Verification is via `npm run build` and code review (grep-based confirmation that dead code is gone).

## Sources

### Primary (HIGH confidence)
- Direct source file reads of all 4 files being modified:
  - `src/lib/api.ts` -- confirmed `getBaseUrl()` with `NEXT_PUBLIC_RUN_API_BASE_URL` fallback (dead code)
  - `src/lib/templates.ts` -- confirmed `getTemplateKey` and `VALID_KEYS` are unused (grep: zero callers outside definition)
  - `src/middleware.ts` -- confirmed duplicate `host.endsWith('.localhost')` on line 14
  - `src/app/(frontend)/blog/[slug]/page.tsx` -- confirmed `process.env.SITE_DOMAIN` direct read on line 58
  - `src/env.ts` -- confirmed Zod validation for `RUN_API_BASE_URL` and `SITE_DOMAIN`
- `src/actions/newsletter.ts` -- confirmed only consumer of `api.ts`
- `tsconfig.json` -- confirmed `@/*` path alias maps to `./src/*`
- Grep for all `getTemplateKey` usages -- only the definition in `templates.ts` (zero callers)
- Grep for all `@/env` imports -- only `payload.config.ts` (via relative `./env`)
- `.planning/v1.0-MILESTONE-AUDIT.md` -- tech debt items 1-4 match exactly

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing code
- Architecture: HIGH -- all files read and analyzed, patterns verified by grep
- Pitfalls: HIGH -- changes are mechanical with clear before/after states

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- no external dependencies changing)
