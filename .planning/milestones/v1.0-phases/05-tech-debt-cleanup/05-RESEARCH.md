# Phase 5: Tech Debt Cleanup - Research

**Researched:** 2026-03-12
**Domain:** TypeScript refactoring, Next.js Server Actions, PayloadCMS generated types
**Confidence:** HIGH

## Summary

Phase 5 resolves 5 specific tech debt items from the v1.0 milestone audit. All items are refactoring tasks with no new features: (1) wiring orphaned `api.ts` exports to form components via Next.js Server Actions, (2) replacing 10 stale `as unknown as Record` type casts for `navItems` across 8 template files, (3) replacing 2 stale `featuredImage` type casts in `blog/[slug]/page.tsx`, (4) adding a runtime guard for `WEBHOOK_SECRET` in `fireWebhook.ts`, and (5) fixing type casts in both smoke test files.

The key risk is the scope of the `runApiUrl` prop removal. The `runApiUrl` string currently threads through 15 files (6 page server components, 3 template layouts, a Footer component, a BlockRenderer, a ContactBlockRenderer, and 2 form components). Replacing inline `fetch` with server actions removes this entire prop-drilling chain. All other items are straightforward find-and-replace operations.

**Primary recommendation:** Tackle the server actions refactoring first (highest risk, most files touched), then do the mechanical type cast replacements, webhook guard, and smoke test fixes in a follow-up.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**api.ts Orphaned Exports -> Server Actions**
- Create `src/actions/newsletter.ts` with `'use server'` directive
- Thin server action wrappers that call existing `api.ts` helpers internally
- Forms (`NewsletterForm`, `ThankYouForm`) call server actions instead of inline `fetch`
- `runApiUrl` prop removed from form components -- URL stays server-side in `api.ts` via `process.env`
- `campaignId` still passed as parameter to the server action
- Client-only validation (keep current HTML required + type="email") -- no server-side validation added
- `api.ts` stays as the API client layer; `src/actions/` is the action layer

**Type Cast Cleanup -- Direct Typed Access**
- Replace all `(siteSettings as unknown as Record<string, unknown>).navItems` casts with `siteSettings.navItems` using `SiteSettings` type from `payload-types.ts`
- Applies to all 8 template components (Classic, Modern, Bold -- Layout, Nav, Hero files)
- Replace `featuredImage` casts in `blog/[slug]/page.tsx` with inline `typeof` narrowing: `typeof post.featuredImage === 'object' && post.featuredImage !== null` to narrow to `Media` type
- Also clean up 5 type casts in `src/tests/phase2-smoke.ts` (emailStatus, layout, siteSettings) -- same direct typed access approach
- Also clean up any type casts in `scripts/smoke-test.ts` -- consistent treatment across all files
- No shared type helpers or type guard functions -- direct typed access everywhere

**Webhook Guard -- Log + Skip, Check Early**
- Replace `process.env.WEBHOOK_SECRET!` non-null assertion with runtime guard
- Use log + skip pattern matching existing `RUN_API_WEBHOOK_URL` guard: `req.payload.logger.error()` + `return doc`
- Move env var checks (both `WEBHOOK_SECRET` and `RUN_API_WEBHOOK_URL`) to top of hook, right after `context.skipWebhook` guard -- before publish-transition logic
- No startup validation for `WEBHOOK_SECRET` (dev environments may not have run-api configured)

**Smoke Test Scope -- Fix Casts Only**
- `npx tsc --noEmit` already passes clean (Phase 4 regenerated payload-types.ts)
- Fix type casts in both `phase2-smoke.ts` and `scripts/smoke-test.ts` with proper typed access
- Compile check only -- do not execute smoke tests
- No test removal or restructuring

### Claude's Discretion
- Exact import paths and type narrowing patterns for payload-types.ts types
- Whether to consolidate the two env var checks into a single guard block or keep separate
- Any minor code formatting improvements in touched files

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | ^15.4.11 | Framework (Server Actions, App Router) | Already in use; server actions are built-in |
| PayloadCMS | ^3.0.0 | CMS with generated types | Already in use; `payload-types.ts` is source of truth |
| TypeScript | ^5.0.0 | Type checking | Already configured with strict mode |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| payload-types.ts | Generated | Type definitions for all collections | All type cast replacements reference this file |

### Alternatives Considered
None -- this phase uses only existing stack. No new libraries needed.

## Architecture Patterns

### Pattern 1: Next.js Server Actions for Form Submission
**What:** A `'use server'` file exports async functions that client components can call directly. The framework serializes arguments, executes on the server, and returns the result.
**When to use:** When client components need to call server-side APIs without exposing URLs or secrets to the browser.

**Current flow (broken):**
```
Server Component --[runApiUrl prop]--> Template Layout --[runApiUrl prop]--> Footer --[runApiUrl prop]--> NewsletterForm --[inline fetch to runApiUrl]-->
```

**Target flow:**
```
NewsletterForm --[calls server action]--> src/actions/newsletter.ts --[calls api.ts]--> run-api
```

**Example:**
```typescript
// src/actions/newsletter.ts
'use server'

import { subscribeToNewsletter, updateSubscriber } from '@/lib/api'

export async function subscribeAction(params: {
  email: string
  campaignId: string
}) {
  return subscribeToNewsletter(params)
}

export async function updateSubscriberAction(params: {
  campaignId: string
  email: string
  name?: string
  zipCode?: string
}) {
  return updateSubscriber(params)
}
```

**Client component usage:**
```typescript
'use client'
import { subscribeAction } from '@/actions/newsletter'

// In handleSubmit:
const result = await subscribeAction({ email, campaignId })
if (result.ok) { /* success */ } else { /* result.error */ }
```

**Confidence:** HIGH -- Server actions are a core Next.js 15 feature. The `api.ts` file already documents "intended to be called from server actions or API routes."

### Pattern 2: Direct Typed Access for Payload Relationship Fields
**What:** Use the generated `SiteSetting` interface directly instead of casting to `Record<string, unknown>`.
**When to use:** When `payload-types.ts` has been regenerated and includes the field in question.

**navItems replacement (8 files):**
```typescript
// BEFORE (stale cast):
const navItems =
  ((siteSettings as unknown as Record<string, unknown>).navItems as
    | Array<{ label: string; url: string }>
    | undefined) ?? []

// AFTER (direct typed access):
const navItems = siteSettings.navItems ?? []
```

The `SiteSetting` interface (line 451) defines `navItems` as:
```typescript
navItems?:
  | {
      label: string;
      url: string;
      id?: string | null;
    }[]
  | null;
```

This is compatible with the existing `Array<{ label: string; url: string }>` usage. The `id` field is optional and unused.

**Confidence:** HIGH -- verified by reading `src/payload-types.ts` lines 451-463.

### Pattern 3: typeof Narrowing for Payload Relationship Union Types
**What:** Payload relationship fields have union types like `(number | null) | Media`. Use `typeof` narrowing to access the populated object form.
**When to use:** When accessing relationship fields that may be a raw ID or a populated object.

**featuredImage replacement (blog/[slug]/page.tsx):**
```typescript
// BEFORE (stale cast):
const postRecord = post as unknown as Record<string, unknown>
const featuredImage = postRecord.featuredImage as { url?: string; alt?: string } | null | undefined

// AFTER (typeof narrowing):
const featuredImage =
  typeof post.featuredImage === 'object' && post.featuredImage !== null
    ? post.featuredImage
    : null
```

The `Post` interface (line 202) defines: `featuredImage?: (number | null) | Media`
After the `typeof` narrowing, TypeScript knows `featuredImage` is `Media` with `url?: string | null` and `alt?: string | null`.

**Confidence:** HIGH -- this pattern is already used for `candidatePhoto` and `logo` in the same codebase (see ClassicHero.tsx line 17-20, ClassicNav.tsx line 12).

### Pattern 4: Defensive Runtime Guard for Environment Variables in Hooks
**What:** Check env var existence before use, log error and return early if missing.
**When to use:** Payload hooks that depend on environment variables that may not be configured in all environments.

**Existing pattern (RUN_API_WEBHOOK_URL guard in fireWebhook.ts):**
```typescript
const webhookUrl = process.env.RUN_API_WEBHOOK_URL
if (!webhookUrl) {
  req.payload.logger.error(
    'RUN_API_WEBHOOK_URL not set -- skipping post-published webhook',
  )
  return doc
}
```

**Target pattern (add WEBHOOK_SECRET guard, move both to top):**
```typescript
// Guard 1: skip when email-status callback updates a post
if (context.skipWebhook) return doc

// Guard 2: env vars required for webhook (may not be set in dev)
const webhookSecret = process.env.WEBHOOK_SECRET
if (!webhookSecret) {
  req.payload.logger.error('WEBHOOK_SECRET not set -- skipping post-published webhook')
  return doc
}
const webhookUrl = process.env.RUN_API_WEBHOOK_URL
if (!webhookUrl) {
  req.payload.logger.error('RUN_API_WEBHOOK_URL not set -- skipping post-published webhook')
  return doc
}

// ... publish transition logic ...
// ... HMAC signing uses webhookSecret variable instead of process.env.WEBHOOK_SECRET! ...
```

**Confidence:** HIGH -- pattern already exists in the same file (lines 53-59).

### Anti-Patterns to Avoid
- **Creating type guard utility functions:** Decision says "no shared type helpers or type guard functions -- direct typed access everywhere." Keep `typeof` checks inline.
- **Adding server-side validation in server actions:** Decision explicitly says "client-only validation -- no server-side validation added."
- **Removing api.ts:** The file stays as the API client layer. Actions wrap it, they don't replace it.
- **Executing smoke tests:** Decision says "compile check only -- do not execute smoke tests."

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Server-side form handling | Custom API route | Next.js `'use server'` actions | Built-in serialization, error propagation, and client-server boundary handling |
| Type narrowing for union types | Type guard functions | Inline `typeof` checks | Decision explicitly forbids shared type helpers; inline is sufficient for this codebase |

## Common Pitfalls

### Pitfall 1: Incomplete runApiUrl Removal
**What goes wrong:** Removing `runApiUrl` from form components but forgetting to remove it from the entire prop-drilling chain (15 files, 42 occurrences).
**Why it happens:** `runApiUrl` threads through 6 page server components -> 3 template Layouts -> Footer -> NewsletterForm, plus BlockRenderer -> ContactBlockRenderer -> NewsletterForm, plus ThankYouForm.
**How to avoid:** After removing `runApiUrl` from `NewsletterForm` and `ThankYouForm` interfaces, run `npx tsc --noEmit` to find all compile errors from unused/missing props. Then work backwards through the chain.
**Warning signs:** TypeScript errors about `runApiUrl` not existing in component props, or unused variable warnings.

**Full list of files with `runApiUrl` references (42 occurrences across 15 files):**
1. `src/lib/templates.ts` (LayoutProps type)
2. `src/components/shared/NewsletterForm.tsx` (prop, interface, usage)
3. `src/components/shared/Footer.tsx` (prop, interface, passes to NewsletterForm)
4. `src/components/templates/classic/ClassicLayout.tsx` (prop, interface, passes to Footer)
5. `src/components/templates/modern/ModernLayout.tsx` (same)
6. `src/components/templates/bold/BoldLayout.tsx` (same)
7. `src/components/blocks/BlockRenderer.tsx` (prop, passes to ContactBlockRenderer)
8. `src/components/blocks/ContactBlockRenderer.tsx` (prop, passes to NewsletterForm)
9. `src/app/(frontend)/page.tsx` (reads env, passes to Template)
10. `src/app/(frontend)/blog/page.tsx` (same)
11. `src/app/(frontend)/blog/[slug]/page.tsx` (same)
12. `src/app/(frontend)/[slug]/page.tsx` (same)
13. `src/app/(frontend)/newsletter/page.tsx` (reads env, passes to Template + NewsletterForm)
14. `src/app/(frontend)/newsletter/thank-you/page.tsx` (reads env, passes to Template + ThankYouForm)
15. `src/app/(frontend)/newsletter/thank-you/ThankYouForm.tsx` (prop, interface, usage)

### Pitfall 2: Server Action Return Type Mismatch
**What goes wrong:** Server actions return plain objects, but if the return type doesn't match what the client expects, runtime errors occur silently.
**Why it happens:** The existing `api.ts` returns `Promise<ApiResult>` with `{ ok: boolean; error?: string }`. The server action wrapper must return the same shape.
**How to avoid:** Server action wrappers should directly `return subscribeToNewsletter(params)` and `return updateSubscriber(params)` -- the `ApiResult` type flows through automatically.
**Warning signs:** Form components showing "undefined" errors or not handling error states.

### Pitfall 3: navItems Nullability After Type Cast Removal
**What goes wrong:** The stale cast used `?? []` to default to empty array. When switching to `siteSettings.navItems`, the type is `{...}[] | null | undefined`, so both `null` and `undefined` must be handled.
**Why it happens:** Payload types use `| null` for optional fields, not just `| undefined`.
**How to avoid:** Keep the `?? []` nullish coalescing: `siteSettings.navItems ?? []` handles both `null` and `undefined`.
**Warning signs:** Runtime "Cannot read properties of null" when mapping over navItems.

### Pitfall 4: featuredImage Narrowing Losing Media Type
**What goes wrong:** After `typeof post.featuredImage === 'object' && post.featuredImage !== null`, TypeScript narrows to `Media` but the usage sites need `url` and `alt` properties.
**Why it happens:** `Media` interface has `url?: string | null` and `alt?: string | null` -- both optional.
**How to avoid:** After narrowing, use optional chaining: `featuredImage?.url`. This already matches the existing template usage pattern (e.g., `populatedPhoto?.url` in ClassicHero.tsx).
**Warning signs:** Compile errors about `url` not existing on type, or runtime accessing undefined.

### Pitfall 5: Smoke Test Type Casts Are Not Simple Replacements
**What goes wrong:** The smoke test type casts involve `payload.find()` return types, which are `PaginatedDocs<Post>`. The `docs[0]` element is typed as `Post`, so fields like `emailStatus` and `layout` are directly accessible.
**Why it happens:** The smoke tests were written before `payload-types.ts` was regenerated with these fields.
**How to avoid:** For `phase2-smoke.ts`:
- `(updated as unknown as Record<string, unknown>).emailStatus` -> `updated.emailStatus` (Post has `emailStatus` at line 228)
- `(readPageA as unknown as Record<string, unknown>).layout` -> `readPageA.layout` (Page has `layout`)
- `existing.docs[0] as unknown as Record<string, unknown>` -> remove cast, use `SiteSetting` type
- The `findOrCreate` helper returns `any` already (eslint-disable), so its callers may need targeted type annotations.

## Code Examples

### Server Action File (src/actions/newsletter.ts)
```typescript
// Source: Verified against existing api.ts (src/lib/api.ts) and CONTEXT.md decisions
'use server'

import { subscribeToNewsletter, updateSubscriber } from '@/lib/api'

export async function subscribeAction(params: {
  email: string
  campaignId: string
}) {
  return subscribeToNewsletter(params)
}

export async function updateSubscriberAction(params: {
  campaignId: string
  email: string
  name?: string
  zipCode?: string
}) {
  return updateSubscriber(params)
}
```

### NewsletterForm After Refactoring (key changes only)
```typescript
// Source: Verified against existing NewsletterForm.tsx
'use client'

import { useState, type FormEvent } from 'react'
import { subscribeAction } from '@/actions/newsletter'

interface NewsletterFormProps {
  campaignId: string
  // runApiUrl removed
  compact?: boolean
  className?: string
}

// In handleSubmit:
const result = await subscribeAction({ email, campaignId })
if (result.ok) {
  setSubmittedEmail(email)
  setStatus('success')
  setEmail('')
} else {
  setStatus('error')
}
```

### navItems Direct Access (replaces cast in 8 files)
```typescript
// Source: Verified against payload-types.ts SiteSetting interface (lines 451-463)
// BEFORE:
const navItems =
  ((siteSettings as unknown as Record<string, unknown>).navItems as
    | Array<{ label: string; url: string }>
    | undefined) ?? []

// AFTER:
const navItems = siteSettings.navItems ?? []
```

### featuredImage typeof Narrowing (blog/[slug]/page.tsx)
```typescript
// Source: Verified against payload-types.ts Post interface (line 202) and Media interface (lines 247-276)
// BEFORE:
const postRecord = post as unknown as Record<string, unknown>
const featuredImage = postRecord.featuredImage as
  | { url?: string | null; alt?: string | null }
  | null
  | undefined

// AFTER:
const featuredImage =
  typeof post.featuredImage === 'object' && post.featuredImage !== null
    ? post.featuredImage
    : null
```

### Webhook Guard (fireWebhook.ts)
```typescript
// Source: Verified against existing RUN_API_WEBHOOK_URL guard pattern (lines 53-59)
export const firePostPublishedWebhook: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  context,
  operation,
  req,
}) => {
  // Guard 1: skip when email-status callback updates a post
  if (context.skipWebhook) return doc

  // Guard 2: env vars required for webhook
  const webhookSecret = process.env.WEBHOOK_SECRET
  if (!webhookSecret) {
    req.payload.logger.error('WEBHOOK_SECRET not set -- skipping post-published webhook')
    return doc
  }
  const webhookUrl = process.env.RUN_API_WEBHOOK_URL
  if (!webhookUrl) {
    req.payload.logger.error('RUN_API_WEBHOOK_URL not set -- skipping post-published webhook')
    return doc
  }

  // Guard 3: only fire on publish transitions
  const wasPublished = previousDoc?._status === 'published'
  const isPublished = doc._status === 'published'
  // ... rest of hook ...

  // HMAC uses local variable instead of non-null assertion
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prop-drilling API URLs to client components | Next.js Server Actions (`'use server'`) | Next.js 14+ (stable) | Removes need to expose API URLs in browser, eliminates prop threading |
| `as unknown as Record` for missing fields | Direct typed access after regenerating types | Phase 4 regenerated `payload-types.ts` | Clean, type-safe access; catches regressions at compile time |
| Non-null assertion for env vars (`!`) | Runtime guard with log + skip | Standard defensive pattern | Prevents runtime crash, provides clear error messages in logs |

## Scope Analysis

### Files Modified by Work Item

| Work Item | Files Modified | Lines Changed (est.) |
|-----------|---------------|---------------------|
| Server Actions (api.ts orphans) | 15 files | ~120 lines (mostly deletions of runApiUrl prop threading) |
| navItems type casts | 8 files | ~24 lines (3-line cast -> 1-line access, x8) |
| featuredImage type casts | 1 file | ~10 lines (2 occurrences in blog/[slug]/page.tsx) |
| Webhook guard | 1 file | ~15 lines (reorder guards + add WEBHOOK_SECRET check) |
| Smoke test type casts | 2 files | ~20 lines (5 casts in phase2-smoke.ts, ~2 in smoke-test.ts) |
| **Total** | **~19 unique files** | **~189 lines** |

### Dependency Order
1. Server Actions must be created before form components are modified (new import target)
2. navItems and featuredImage casts are independent of each other and of server actions
3. Webhook guard is fully independent
4. Smoke test fixes are independent
5. `npm run build` verification must come last (success criterion #5)

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test runner is configured yet") |
| Config file | none |
| Quick run command | `npx tsc --noEmit` |
| Full suite command | `npm run build` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| N/A-01 | api.ts exports used via server actions | manual/compile | `npx tsc --noEmit` | N/A |
| N/A-02 | navItems type casts removed | compile | `npx tsc --noEmit` | N/A |
| N/A-03 | featuredImage casts replaced with typeof | compile | `npx tsc --noEmit` | N/A |
| N/A-04 | WEBHOOK_SECRET runtime guard | manual-only | Code review + grep for `WEBHOOK_SECRET!` | N/A |
| N/A-05 | Smoke test TS errors resolved | compile | `npx tsc --noEmit` | N/A |
| N/A-06 | Build succeeds with zero errors | build | `npm run build` | N/A |

### Sampling Rate
- **Per task commit:** `npx tsc --noEmit`
- **Per wave merge:** `npm run build`
- **Phase gate:** `npm run build` completes with zero errors

### Wave 0 Gaps
None -- this is a refactoring phase. TypeScript compilation (`npx tsc --noEmit`) and build (`npm run build`) are the only validation tools needed, and both are already available.

## Open Questions

1. **ContactBlockRenderer runApiUrl removal scope**
   - What we know: `ContactBlockRenderer` receives `runApiUrl` via `BlockRenderer` -> page server components. When `NewsletterForm` no longer needs `runApiUrl`, this entire chain can be simplified.
   - What's unclear: Whether to also remove `runApiUrl` from `BlockRenderer` and `ContactBlockRenderer` interfaces (since it's only used to pass to `NewsletterForm`).
   - Recommendation: Yes, remove it from the entire chain. The server action approach means `NewsletterForm` only needs `campaignId`. This is consistent with the decision to remove `runApiUrl` prop from form components.

2. **LayoutProps type in templates.ts**
   - What we know: `LayoutProps` in `src/lib/templates.ts` includes `runApiUrl: string`. All 3 Layout components use this type.
   - What's unclear: Whether to remove `runApiUrl` from `LayoutProps` or keep it for potential future use.
   - Recommendation: Remove it. The decision says "URL stays server-side in api.ts." Keeping a dead prop creates confusion.

## Sources

### Primary (HIGH confidence)
- `src/payload-types.ts` -- Verified `SiteSetting.navItems` (lines 451-463), `Post.featuredImage` (line 202), `Post.emailStatus` (line 228), `Media` interface (lines 247-276)
- `src/hooks/fireWebhook.ts` -- Verified current `WEBHOOK_SECRET!` usage (line 49) and `RUN_API_WEBHOOK_URL` guard pattern (lines 53-59)
- `src/lib/api.ts` -- Verified `subscribeToNewsletter` and `updateSubscriber` signatures and `ApiResult` return type
- `src/components/shared/NewsletterForm.tsx` -- Verified inline `fetch` duplicating `api.ts` logic
- `src/app/(frontend)/newsletter/thank-you/ThankYouForm.tsx` -- Verified inline `fetch` duplicating `api.ts` logic
- `src/app/(payload)/api/posts/[id]/email-status/route.ts` -- Verified `WEBHOOK_SECRET` guard pattern (lines 39-46)
- Grep results: 42 `runApiUrl` occurrences across 15 files, 10 `as unknown as Record` casts for navItems across 8 files
- `npx tsc --noEmit` -- Verified passes clean (zero errors currently)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, existing codebase only
- Architecture: HIGH -- all patterns verified against actual source code
- Pitfalls: HIGH -- identified by reading actual code and understanding prop threading
- Scope: HIGH -- every affected file read and occurrence counted

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable -- all patterns are established in codebase)
