# Phase 5: Tech Debt Cleanup - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Resolve 5 specific tech debt items from the v1.0 milestone audit: orphaned api.ts exports, stale type casts (navItems + featuredImage), missing WEBHOOK_SECRET runtime guard, and TypeScript errors in smoke tests. No new features, no scope expansion — code quality only.

</domain>

<decisions>
## Implementation Decisions

### api.ts Orphaned Exports → Server Actions
- Create `src/actions/newsletter.ts` with `'use server'` directive
- Thin server action wrappers that call existing `api.ts` helpers internally
- Forms (`NewsletterForm`, `ThankYouForm`) call server actions instead of inline `fetch`
- `runApiUrl` prop removed from form components — URL stays server-side in `api.ts` via `process.env`
- `campaignId` still passed as parameter to the server action
- Client-only validation (keep current HTML required + type="email") — no server-side validation added
- `api.ts` stays as the API client layer; `src/actions/` is the action layer

### Type Cast Cleanup — Direct Typed Access
- Replace all `(siteSettings as unknown as Record<string, unknown>).navItems` casts with `siteSettings.navItems` using `SiteSettings` type from `payload-types.ts`
- Applies to all 8 template components (Classic, Modern, Bold — Layout, Nav, Hero files)
- Replace `featuredImage` casts in `blog/[slug]/page.tsx` with inline `typeof` narrowing: `typeof post.featuredImage === 'object' && post.featuredImage !== null` to narrow to `Media` type
- Also clean up 5 type casts in `src/tests/phase2-smoke.ts` (emailStatus, layout, siteSettings) — same direct typed access approach
- Also clean up any type casts in `scripts/smoke-test.ts` — consistent treatment across all files
- No shared type helpers or type guard functions — direct typed access everywhere

### Webhook Guard — Log + Skip, Check Early
- Replace `process.env.WEBHOOK_SECRET!` non-null assertion with runtime guard
- Use log + skip pattern matching existing `RUN_API_WEBHOOK_URL` guard: `req.payload.logger.error()` + `return doc`
- Move env var checks (both `WEBHOOK_SECRET` and `RUN_API_WEBHOOK_URL`) to top of hook, right after `context.skipWebhook` guard — before publish-transition logic
- No startup validation for `WEBHOOK_SECRET` (dev environments may not have run-api configured)

### Smoke Test Scope — Fix Casts Only
- `npx tsc --noEmit` already passes clean (Phase 4 regenerated payload-types.ts)
- Fix type casts in both `phase2-smoke.ts` and `scripts/smoke-test.ts` with proper typed access
- Compile check only — do not execute smoke tests
- No test removal or restructuring

### Claude's Discretion
- Exact import paths and type narrowing patterns for payload-types.ts types
- Whether to consolidate the two env var checks into a single guard block or keep separate
- Any minor code formatting improvements in touched files

</decisions>

<specifics>
## Specific Ideas

- Server actions file follows Next.js convention at `src/actions/newsletter.ts` (not inside `src/lib/`)
- The `api.ts` file stays as the API client layer — actions wrap it, they don't replace it
- Webhook guard should read naturally alongside the existing `RUN_API_WEBHOOK_URL` guard pattern already in `fireWebhook.ts`

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/api.ts`: Well-structured `subscribeToNewsletter` and `updateSubscriber` helpers with error handling — will be called by new server actions
- `src/payload-types.ts`: Regenerated in Phase 4, now contains proper types for `navItems` (line ~451) and `featuredImage` (line ~202)

### Established Patterns
- Fire-and-forget webhook with `req.payload.logger.error()` for failures (fireWebhook.ts)
- `'use client'` components receive data via props from server components (NewsletterForm, ThankYouForm)
- Payload relationship fields use `typeof x === 'object' && x !== null` narrowing pattern

### Integration Points
- `NewsletterForm` (src/components/shared/NewsletterForm.tsx) — currently receives `runApiUrl` and `campaignId` props; will switch to server action import
- `ThankYouForm` (src/app/(frontend)/newsletter/thank-you/ThankYouForm.tsx) — same pattern
- 8 template components access `siteSettings.navItems` — all in `src/components/templates/`
- `blog/[slug]/page.tsx` — accesses `post.featuredImage`
- `fireWebhook.ts` — HMAC signature computation

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-tech-debt-cleanup*
*Context gathered: 2026-03-12*
