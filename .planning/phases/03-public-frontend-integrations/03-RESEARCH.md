# Phase 3: Public Frontend + Integrations - Research

**Researched:** 2026-03-12
**Domain:** Next.js 15 multi-tenant middleware, Tailwind CSS v4, PayloadCMS v3 Lexical rendering, webhook pipelines, frontend templates
**Confidence:** HIGH (critical paths verified against official docs and installed package versions)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **Three templates:** Classic (serif, structured, navy/burgundy) -> Modern (clean sans-serif, balanced) -> Bold (large type, vivid, hero-forward). Each has its own hero treatment.
- **primaryColor as accent only** -- buttons, links, highlights, nav indicator. Each template has a fixed base palette unaffected by primaryColor.
- **Styling: Tailwind CSS** with CSS variables for primaryColor, template-specific wrapper classes, responsive via sm:/md:/lg: prefixes, shared design tokens via tailwind config.
- **Mobile-first responsive** -- single column default, multi-column on desktop, 48px tap targets, hamburger nav on mobile, stacked hero on mobile.
- **Missing image handling** -- initials placeholder circle with primaryColor, no broken-image states.
- **Sticky action bar** below nav with CTA buttons from external nav items. Hides if no external nav items configured.
- **Footer:** campaign name, social icons, contact email, "Paid for by..." disclaimer, "Powered by CivPulse" link, newsletter email subscribe form.
- **Navigation:** Ghost-style configurable nav via new `navItems` array field on SiteSettings ({label, url} pairs). External links auto-detected and open in new tab.
- **Homepage structure:** Pages collection entry slug "home". Fixed sandwich: Hero (SiteSettings) -> Meet Candidate (SiteSettings) -> Editable blocks (Pages "home") -> Recent posts grid (9 cards, 3-col) -> Footer. Provisioning must auto-create "home" page per tenant.
- **Route structure:** `/` (homepage), `/{slug}` (pages), `/blog` (paginated feed), `/blog/{slug}` (post), `/newsletter` (signup page).
- **Page rendering (non-homepage):** blocks rendered directly, no fixed hero/blog sections.
- **Tenant status enforcement:** suspended = public site renders normally; archived/unknown = "site not found" page.
- **Blog feed:** /blog, 3-column cards, 9 per page, prev/next pagination, only published posts with publishAs "web" or "both".
- **Post pages:** title h1 -> date + author meta -> featured image -> rich text -> share buttons (Facebook, X, Email, Copy Link).
- **featuredImage:** new upload field on Posts collection (optional, relationTo media).
- **Newsletter signup:** multi-placement (footer, contact block toggle, sticky mobile CTA, /newsletter page). Two-step flow: email-only capture -> thank you page with optional name + zip.
- **Webhook pipeline:** Posts afterChange hook fires HMAC-signed webhook when post transitions to published with publishAs "email" or "both". Context flag prevents infinite loop. email-status callback already exists from Phase 2.

### Claude's Discretion
- Exact Tailwind config structure and design tokens
- Template color palettes (specific hex values for each template's base palette)
- Typography choices (specific font families, weights, sizes)
- Lexical rich text rendering approach (how to convert Lexical JSON to HTML/React)
- SEO meta tags and og:image implementation
- Loading states and skeleton screens
- Error pages (404, 500) styling
- "Powered by CivPulse" link placement and styling
- How "View all posts" link is styled on homepage
- Thank you page exact layout and copy

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| HOOK-01 | Posts fires HMAC-signed webhook to run-api when post transitions to published with publishAs including email | afterChange hook pattern with previousDoc comparison; versions/drafts needed for _status field; HMAC via Node.js crypto |
| HOOK-02 | Webhook includes postId, tenantId, publishAs, HMAC signature; context flag prevents infinite loop on emailStatus update | Payload req.context pattern documented; context flag on update calls |
| HOOK-03 | Payload REST endpoint to accept run-api callback updating emailStatus and emailSentAt | Already exists at src/app/(payload)/api/posts/[id]/email-status/route.ts -- Phase 2 complete |
| FRONT-01 | Next.js middleware resolves tenant from request subdomain and injects tenant context into all Server Components | Middleware sets x-tenant-slug header; Server Components read via headers() (async in Next.js 15) |
| FRONT-02 | Public homepage renders candidate name, photo, tagline, office, issues from tenant site-settings | getPayload() Local API in Server Components; SiteSettings query by tenant; template-driven rendering |
| FRONT-03 | Public blog feed renders published posts (web or both) for current tenant | Local API find with where clause on tenant + publishAs + _status; pagination via page/limit |
| FRONT-04 | Individual post page renders content with structured metadata | RichText component from @payloadcms/richtext-lexical/react; SEO meta tags |
| FRONT-05 | Newsletter signup POSTs to run-api subscriber endpoint; handles success/error states | Client component with form action; fetch to external run-api endpoint |
| FRONT-06 | 3 distinct templates; switch via site-settings without content loss; data-driven from site-settings | Template wrapper pattern; CSS variables for primaryColor; template-specific component trees |
</phase_requirements>

---

## Summary

Phase 3 transforms the placeholder frontend into a fully functional multi-tenant campaign website. The work spans five major technical domains: (1) Next.js middleware for subdomain-based tenant resolution, (2) Tailwind CSS v4 setup from scratch with CSS variable-driven theming, (3) three visual templates rendering data from PayloadCMS collections via the Local API, (4) Lexical rich text rendering on the frontend, and (5) a webhook pipeline from Posts afterChange hooks to run-api.

The project currently has Next.js 15.4.11 and Payload 3.79.0 installed. Tailwind CSS is NOT installed -- it needs to be added from scratch. The frontend directory (`src/app/(frontend)/`) contains only a placeholder page and barebones layout. The middleware file does not exist yet. The Posts collection lacks both a `featuredImage` field and `versions/drafts` support, both of which need to be added. SiteSettings needs a new `navItems` array field.

The highest-risk area is the webhook pipeline: the Posts collection must gain `versions: { drafts: true }` so that the afterChange hook can detect draft-to-published transitions via `previousDoc._status !== 'published' && doc._status === 'published'`. Without this, there's no reliable way to detect "publish" events. The second risk area is Tailwind v4's CSS-first configuration model, which differs significantly from v3 -- there is no `tailwind.config.js`; all customization happens in the CSS file using `@theme` directives.

**Primary recommendation:** Add `versions: { drafts: true }` to Posts, install Tailwind CSS v4 with `@tailwindcss/postcss`, implement middleware-first tenant resolution with header injection, and use the `RichText` component from `@payloadcms/richtext-lexical/react` for Lexical content rendering.

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | 15.4.11 | App Router, Server Components, middleware | Already installed; embedded Payload |
| payload | 3.79.0 | CMS Local API, collections, hooks | Already installed; data layer |
| @payloadcms/richtext-lexical | 3.79.0 | Lexical editor + JSX rendering | Already installed; provides RichText component |
| react | 19.x | UI rendering | Already installed |

### New Dependencies
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| tailwindcss | ^4.0 | Utility-first CSS framework | User decision; CSS-first config in v4 |
| @tailwindcss/postcss | ^4.0 | PostCSS integration for Tailwind v4 | Required PostCSS plugin for v4 |
| postcss | ^8.0 | CSS processing | Peer dependency of @tailwindcss/postcss |

### Fonts (via next/font -- zero additional packages)
| Font | Source | Template | Why |
|------|--------|----------|-----|
| Merriweather | next/font/google | Classic | Elegant serif; readable at body size; formal tone |
| Inter | next/font/google | Modern | Clean variable sans-serif; neutral; highly legible |
| Space Grotesk | next/font/google | Bold | Geometric sans-serif; energetic; modern personality |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tailwind v4 | Tailwind v3 | v3 is more documented but v4 is stable, 70% smaller CSS, CSS-first config is cleaner for dynamic themes |
| @payloadcms/richtext-lexical/react | payload-lexical-react-renderer (3rd party) | Official component is maintained by Payload team; 3rd party may lag behind |
| next/font | @fontsource | next/font self-hosts at build time with zero CLS; @fontsource adds bundle size |

**Installation:**
```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/
│   ├── (frontend)/
│   │   ├── layout.tsx              # Root layout: fonts, Tailwind globals, tenant provider
│   │   ├── page.tsx                # Homepage (slug "home" with fixed sections)
│   │   ├── [slug]/
│   │   │   └── page.tsx            # Dynamic pages from Pages collection
│   │   ├── blog/
│   │   │   ├── page.tsx            # Paginated blog feed
│   │   │   └── [slug]/
│   │   │       └── page.tsx        # Individual post page
│   │   ├── newsletter/
│   │   │   ├── page.tsx            # Dedicated newsletter signup
│   │   │   └── thank-you/
│   │   │       └── page.tsx        # Step 2: optional name + zip
│   │   └── not-found.tsx           # Tenant-aware 404 page
│   └── (payload)/                  # Existing admin routes (unchanged)
├── components/
│   ├── templates/
│   │   ├── classic/                # Classic template components
│   │   │   ├── ClassicLayout.tsx
│   │   │   ├── ClassicHero.tsx
│   │   │   ├── ClassicNav.tsx
│   │   │   └── ...
│   │   ├── modern/                 # Modern template components
│   │   │   ├── ModernLayout.tsx
│   │   │   ├── ModernHero.tsx
│   │   │   └── ...
│   │   └── bold/                   # Bold template components
│   │       ├── BoldLayout.tsx
│   │       ├── BoldHero.tsx
│   │       └── ...
│   ├── shared/                     # Shared across all templates
│   │   ├── StickyActionBar.tsx
│   │   ├── Footer.tsx
│   │   ├── NewsletterForm.tsx      # Client component (form submission)
│   │   ├── ShareButtons.tsx        # Client component (copy link)
│   │   ├── InitialsAvatar.tsx
│   │   ├── PostCard.tsx
│   │   ├── Pagination.tsx
│   │   └── BlockRenderer.tsx       # Maps block types to components
│   └── blocks/                     # Block-type renderers
│       ├── HeroBlockRenderer.tsx
│       ├── TextBlockRenderer.tsx
│       ├── IssuesBlockRenderer.tsx
│       └── ContactBlockRenderer.tsx
├── lib/
│   ├── tenant.ts                   # getTenant() helper: reads header, queries DB
│   ├── templates.ts                # Template registry: maps key -> component tree
│   └── api.ts                      # run-api fetch helpers (newsletter, etc.)
├── hooks/
│   ├── ensureUniqueTenantSlug.ts   # Existing
│   └── fireWebhook.ts             # NEW: afterChange hook for Posts
├── middleware.ts                    # NEW: subdomain -> tenant resolution
└── app/globals.css                 # NEW: Tailwind imports + theme variables
```

### Pattern 1: Middleware Tenant Resolution
**What:** Extract tenant slug from subdomain, set request header, allow Server Components to read it.
**When to use:** Every frontend request.
**Example:**
```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  // Extract subdomain: "jones.campaigns.civpulse.com" -> "jones"
  const subdomain = extractSubdomain(hostname)

  if (!subdomain) {
    // Root domain -- let it pass through (or redirect to marketing site)
    return NextResponse.next()
  }

  // Set tenant slug as header for Server Components to read
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant-slug', subdomain)

  return NextResponse.next({
    request: { headers: requestHeaders },
  })
}

function extractSubdomain(hostname: string): string | null {
  // Handle localhost for dev: "jones.localhost:3000"
  if (hostname.includes('localhost')) {
    const parts = hostname.split('.')
    return parts.length > 1 ? parts[0] : null
  }
  // Production: "jones.campaigns.civpulse.com"
  const baseDomain = 'campaigns.civpulse.com'
  if (!hostname.endsWith(baseDomain)) return null
  const sub = hostname.replace(`.${baseDomain}`, '').split('.')[0]
  return sub || null
}

export const config = {
  matcher: [
    // Match all paths EXCEPT Payload admin, API, Next.js internals, and static files
    '/((?!admin|api|_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Pattern 2: Tenant Data Fetching in Server Components
**What:** Use Payload Local API to fetch tenant-scoped data directly in Server Components.
**When to use:** Every page that needs tenant data.
**Example:**
```typescript
// src/lib/tenant.ts
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function getTenantBySlug() {
  const headersList = await headers() // async in Next.js 15
  const slug = headersList.get('x-tenant-slug')
  if (!slug) return null

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true, // public frontend -- no user context
  })
  return result.docs[0] ?? null
}

export async function getSiteSettings(tenantId: string | number) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'site-settings',
    where: { tenant: { equals: tenantId } },
    limit: 1,
    depth: 2, // populate media relations (logo, candidatePhoto)
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}
```

### Pattern 3: Template Selection
**What:** Map activeTemplateKey from SiteSettings to a component tree.
**When to use:** Layout rendering.
**Example:**
```typescript
// src/lib/templates.ts
import { ClassicLayout } from '@/components/templates/classic/ClassicLayout'
import { ModernLayout } from '@/components/templates/modern/ModernLayout'
import { BoldLayout } from '@/components/templates/bold/BoldLayout'

const templates = {
  classic: ClassicLayout,
  modern: ModernLayout,
  bold: BoldLayout,
} as const

export function getTemplate(key: string) {
  return templates[key as keyof typeof templates] ?? templates.modern
}
```

### Pattern 4: CSS Variables for Dynamic primaryColor
**What:** Inject primaryColor from SiteSettings as a CSS variable, reference in Tailwind.
**When to use:** Layout wrapper.
**Example:**
```css
/* src/app/globals.css */
@import "tailwindcss";

@theme inline {
  --color-primary: var(--site-primary, #2563eb);
  --color-primary-hover: color-mix(in oklch, var(--site-primary, #2563eb) 85%, black);
  --font-sans: var(--font-inter);
  --font-serif: var(--font-merriweather);
  --font-display: var(--font-space-grotesk);
}
```
```tsx
// In layout, set CSS variable from SiteSettings
<div style={{ '--site-primary': siteSettings.primaryColor ?? '#2563eb' } as React.CSSProperties}>
  {children}
</div>
```
Then in components: `className="bg-primary text-white hover:bg-primary-hover"`

### Pattern 5: Webhook afterChange Hook
**What:** Fire HMAC-signed webhook on publish transition.
**When to use:** Posts collection afterChange.
**Example:**
```typescript
// src/hooks/fireWebhook.ts
import crypto from 'node:crypto'
import type { CollectionAfterChangeHook } from 'payload'

export const firePostPublishedWebhook: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  context,
  operation,
}) => {
  // Guard: skip if this update was triggered by the email-status callback
  if (context.skipWebhook) return doc

  // Guard: only fire on publish transitions
  const wasPublished = previousDoc?._status === 'published'
  const isPublished = doc._status === 'published'
  if (!isPublished || (wasPublished && operation === 'update')) return doc

  // Guard: only fire for email-related publishAs
  if (doc.publishAs !== 'email' && doc.publishAs !== 'both') return doc

  // Get tenant ID from the multi-tenant plugin field
  const tenantId = typeof doc.tenant === 'object' ? doc.tenant.id : doc.tenant

  const payload = JSON.stringify({
    postId: doc.id,
    tenantId,
    publishAs: doc.publishAs,
  })

  const signature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex')

  // Fire and forget -- don't block the response
  fetch(process.env.RUN_API_WEBHOOK_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
    },
    body: payload,
  }).catch((err) => {
    req.payload.logger.error({ err, msg: 'Webhook delivery failed' })
  })

  return doc
}
```

### Pattern 6: Lexical Rich Text Rendering
**What:** Render Payload Lexical content as React JSX.
**When to use:** Post pages, text blocks.
**Example:**
```typescript
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

export function PostContent({ content }: { content: SerializedEditorState }) {
  return (
    <article className="prose prose-lg max-w-none">
      <RichText data={content} />
    </article>
  )
}
```

### Anti-Patterns to Avoid
- **Fetching tenant via REST API from frontend:** Use Local API (getPayload) in Server Components -- zero network latency, direct DB access.
- **Client-side tenant resolution:** Tenant must be resolved in middleware (runs before any page), not in a client component.
- **Global React Context for tenant:** Server Components cannot use React Context. Use headers() to read middleware-injected headers.
- **Tailwind v3 config style:** Do NOT create tailwind.config.js -- Tailwind v4 uses CSS-first @theme directives in globals.css.
- **Firing webhook on every update:** Must compare previousDoc._status to detect publish transitions; otherwise every save fires a webhook.
- **Using overrideAccess: false on public frontend:** Public frontend has no user session. Use overrideAccess: true with explicit where clauses for tenant scoping.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Rich text rendering | Custom Lexical-to-HTML converter | `RichText` from `@payloadcms/richtext-lexical/react` | Handles all Lexical node types, upload embeds, internal links; maintained by Payload team |
| Font loading | Manual @font-face declarations | `next/font/google` | Self-hosts at build time, zero CLS, automatic subsetting |
| CSS utility framework | Custom CSS classes | Tailwind CSS v4 | Decision is locked; responsive design built-in |
| HMAC signing | Custom signature scheme | Node.js `crypto.createHmac('sha256', secret)` | Industry standard; matches existing email-status route pattern |
| Subdomain extraction | Custom DNS/host parsing | Next.js middleware with host header parsing | Runs at edge, before page render, established pattern |
| Pagination | Custom offset/limit logic | Payload Local API `page` + `limit` params | Returns `totalPages`, `totalDocs`, `hasNextPage`, `hasPrevPage` |
| Share buttons | Social SDK embeds | Simple anchor tags with share URLs | No JS SDK needed; share intents are just URL patterns |

**Key insight:** The heaviest lifting in this phase is UI component work, not infrastructure. Payload's Local API and RichText component handle data access and rendering. The middleware pattern for tenant resolution is well-established. The real work is creating three visually distinct template component trees.

---

## Common Pitfalls

### Pitfall 1: Missing versions/drafts on Posts
**What goes wrong:** Without `versions: { drafts: true }`, Posts have no `_status` field. The afterChange hook cannot detect publish transitions -- every create/update looks the same.
**Why it happens:** The Posts collection was built in Phase 2 without versioning because it was not needed until the webhook pipeline.
**How to avoid:** Add `versions: { drafts: true }` to the Posts CollectionConfig. This adds a `_status` field with values `draft` and `published`. Run a migration to add the field to existing records.
**Warning signs:** All existing posts will have `_status: undefined` until resaved. Seed or migrate existing data.

### Pitfall 2: Next.js 15 async headers()
**What goes wrong:** `headers()` in Next.js 15 returns a Promise. Calling `headers().get('x-tenant-slug')` without await silently returns wrong values or throws.
**Why it happens:** Next.js 15 made Dynamic APIs async (breaking change from 14).
**How to avoid:** Always `const h = await headers()` before accessing values. This also opts the route into dynamic rendering (no static generation).
**Warning signs:** TypeScript may not catch this if using older @types/next.

### Pitfall 3: Middleware matching Payload admin routes
**What goes wrong:** Middleware rewrites `/admin` to a tenant-scoped path, breaking the Payload admin panel.
**Why it happens:** Middleware runs on all routes by default.
**How to avoid:** Use matcher config to exclude `/admin`, `/api`, `/_next/*`, and static files: `'/((?!admin|api|_next/static|_next/image|favicon.ico).*)'`
**Warning signs:** Admin panel shows 404 or wrong tenant data.

### Pitfall 4: Infinite webhook loop
**What goes wrong:** afterChange fires webhook -> run-api calls email-status callback -> Payload updates emailStatus -> afterChange fires again -> infinite loop.
**Why it happens:** The email-status callback updates the same post document, triggering afterChange.
**How to avoid:** The email-status route must pass `context: { skipWebhook: true }` in the payload.update() call. The afterChange hook checks `if (context.skipWebhook) return doc`.
**Warning signs:** Runaway HTTP requests between CMS and run-api.

### Pitfall 5: Tailwind v4 @theme vs tailwind.config.js
**What goes wrong:** Creating a `tailwind.config.js` file has no effect in Tailwind v4 by default.
**Why it happens:** Tailwind v4 uses CSS-first configuration via `@theme` directives in the CSS file. JavaScript config files are only used with the legacy compatibility layer.
**How to avoid:** All custom colors, fonts, and spacing go in `globals.css` inside `@theme { }` blocks. Use `@theme inline { }` for values that reference CSS variables.
**Warning signs:** Custom utilities like `bg-primary` don't work despite being configured.

### Pitfall 6: overrideAccess confusion on public frontend
**What goes wrong:** Queries return empty results because there's no authenticated user session on the public frontend.
**Why it happens:** The multi-tenant plugin's access control expects a logged-in user with tenant context.
**How to avoid:** Always use `overrideAccess: true` on public frontend queries. Scope results manually via `where: { tenant: { equals: tenantId } }`.
**Warning signs:** Pages render empty even though data exists in admin.

### Pitfall 7: Lexical depth for populated nodes
**What goes wrong:** Rich text content with uploaded images renders broken image links.
**Why it happens:** Lexical upload nodes need populated media data, which requires sufficient `depth` on the find/findByID call.
**How to avoid:** Use `depth: 2` or higher when fetching posts with rich text content.
**Warning signs:** Upload nodes in rich text show `[object Object]` or null URLs.

---

## Code Examples

### Tailwind v4 PostCSS Config
```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### Tailwind v4 Global CSS with Theme
```css
/* src/app/globals.css */
@import "tailwindcss";

/* Custom theme: colors, fonts, spacing */
@theme {
  /* Template base palettes */
  --color-classic-bg: #f8f5f0;
  --color-classic-text: #1a1a2e;
  --color-classic-accent: #1e3a5f;
  --color-classic-muted: #6b7280;

  --color-modern-bg: #ffffff;
  --color-modern-text: #111827;
  --color-modern-accent: #374151;
  --color-modern-muted: #9ca3af;

  --color-bold-bg: #0f172a;
  --color-bold-text: #f8fafc;
  --color-bold-accent: #e2e8f0;
  --color-bold-muted: #94a3b8;
}

/* Dynamic values that reference CSS variables must use @theme inline */
@theme inline {
  --color-primary: var(--site-primary, #2563eb);
  --color-primary-hover: color-mix(in oklch, var(--site-primary, #2563eb) 85%, black);
  --color-primary-light: color-mix(in oklch, var(--site-primary, #2563eb) 15%, white);
}
```

### Next.js Font Setup with Tailwind v4
```typescript
// src/app/(frontend)/layout.tsx
import { Merriweather, Inter, Space_Grotesk } from 'next/font/google'

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-merriweather',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
})

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${merriweather.variable} ${inter.variable} ${spaceGrotesk.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Newsletter Signup Client Component
```typescript
// src/components/shared/NewsletterForm.tsx
'use client'

import { useState } from 'react'

export function NewsletterForm({ campaignId, runApiUrl }: {
  campaignId: string
  runApiUrl: string
}) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch(
        `${runApiUrl}/api/v1/campaigns/${campaignId}/subscribers`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }
      )
      if (!res.ok) throw new Error('Subscription failed')
      setStatus('success')
    } catch {
      setStatus('error')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        required
        className="..."
      />
      <button type="submit" disabled={status === 'loading'} className="bg-primary ...">
        {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
      </button>
      {status === 'success' && <p>Check your inbox!</p>}
      {status === 'error' && <p>Something went wrong. Please try again.</p>}
    </form>
  )
}
```

### Social Share Buttons (no SDK needed)
```typescript
// src/components/shared/ShareButtons.tsx
'use client'

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const encoded = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  return (
    <div className="flex gap-4">
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
         target="_blank" rel="noopener noreferrer">Facebook</a>
      <a href={`https://twitter.com/intent/tweet?url=${encoded}&text=${encodedTitle}`}
         target="_blank" rel="noopener noreferrer">X / Twitter</a>
      <a href={`mailto:?subject=${encodedTitle}&body=${encoded}`}>Email</a>
      <button onClick={() => navigator.clipboard.writeText(url)}>
        Copy Link
      </button>
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.js (JS) | @theme in CSS (v4) | Jan 2025 | No JS config file needed; all customization in CSS |
| @tailwind base/components/utilities | @import "tailwindcss" | Tailwind v4 | Single import replaces three directives |
| headers() sync (Next.js 14) | await headers() async (Next.js 15) | Oct 2024 | Must await before accessing; breaking change |
| React.useContext for server data | headers() in Server Components | Next.js 13+ App Router | Context not available in Server Components |
| Custom Lexical-to-HTML | RichText from @payloadcms/richtext-lexical/react | Payload 3.x | Official component with built-in converters |

**Deprecated/outdated:**
- `tailwindcss` PostCSS plugin: replaced by `@tailwindcss/postcss` in v4
- `@tailwind base; @tailwind components; @tailwind utilities;`: replaced by `@import "tailwindcss";`
- Synchronous `headers()` / `cookies()`: deprecated in Next.js 15, will be removed in future

---

## Schema Changes Required

Before building the frontend, the following schema changes must be made to existing collections:

### Posts Collection
1. **Add `versions: { drafts: true }`** -- enables _status field (draft/published)
2. **Add `featuredImage` upload field** -- `type: 'upload', relationTo: 'media'`
3. **Add `afterChange` hook** -- fires webhook on publish transition
4. **Migration:** existing posts need `_status` set to 'published' (or they become invisible)

### SiteSettings Collection
1. **Add `navItems` array field** -- `type: 'array', fields: [{ name: 'label', type: 'text' }, { name: 'url', type: 'text' }]`

### Environment Variables
1. **Add `RUN_API_WEBHOOK_URL`** -- target URL for post-published webhook
2. **Add `RUN_API_BASE_URL`** -- base URL for newsletter subscriber endpoint
3. **Add `SITE_DOMAIN`** -- base domain for subdomain extraction (e.g., "campaigns.civpulse.com")
4. Add all three to `src/env.ts` Zod validation

### email-status Route Update
The existing `src/app/(payload)/api/posts/[id]/email-status/route.ts` must pass `context: { skipWebhook: true }` in its `payload.update()` call to prevent infinite webhook loops.

---

## Template Design Specifications

### Classic Template
- **Fonts:** Merriweather (serif) for headings + body, Inter for nav/UI elements
- **Base palette:** cream background (#f8f5f0), dark navy text (#1a1a2e), structured borders
- **Hero:** side-by-side layout -- text left (name, tagline, office, CTA) + candidate photo right
- **Grid:** traditional newspaper-like structure with clear section dividers
- **Personality:** Formal, established, trustworthy

### Modern Template
- **Fonts:** Inter throughout (variable weight)
- **Base palette:** white background (#ffffff), near-black text (#111827), generous whitespace
- **Hero:** centered text with small circular photo above, clean typography hierarchy
- **Grid:** balanced card layout with subtle shadows
- **Personality:** Clean, professional, approachable

### Bold Template
- **Fonts:** Space Grotesk for headings, Inter for body
- **Base palette:** dark slate background (#0f172a), white text, high contrast
- **Hero:** full-bleed candidate photo background with primaryColor overlay and large name text
- **Grid:** dynamic layout, oversized type, primaryColor used prominently
- **Personality:** Energetic, grassroots, attention-grabbing

### All Templates Share
- Sticky action bar component (same behavior, template-specific styling)
- Footer component (same data, template-specific layout)
- Newsletter form component (same functionality)
- Blog feed page (same data, template-specific card styling)
- Post page (same structure, template-specific typography)

---

## Open Questions

1. **Versions/drafts migration for existing posts**
   - What we know: Adding `versions: { drafts: true }` to Posts will create a `_status` field. Existing posts will have `_status: undefined`.
   - What's unclear: Whether Payload auto-migrates existing docs or requires a manual migration step.
   - Recommendation: Run `payload migrate:create` after adding versions config. Write a data migration that sets `_status: 'published'` on all existing posts. Test in dev first.

2. **RUN_API_WEBHOOK_URL availability**
   - What we know: The webhook POSTs to `POST /api/v1/webhooks/payload/post-published` on run-api.
   - What's unclear: Whether run-api endpoint exists yet or needs to be stubbed.
   - Recommendation: Add env var to validation. If run-api isn't ready, webhook fires but fails gracefully (catch + log). Development can proceed independently.

3. **Campaign ID mapping for newsletter signup**
   - What we know: Newsletter signup POSTs to `POST /api/v1/campaigns/{campaign_id}/subscribers`.
   - What's unclear: Whether `campaign_id` is the Payload tenant ID or a separate run-api ID. Need mapping.
   - Recommendation: Store campaign_id on the tenant or SiteSettings record, or use tenant slug as the identifier. Clarify with run-api team.

4. **Local development subdomain testing**
   - What we know: Middleware needs to parse subdomains from localhost.
   - What's unclear: Whether `jones.localhost:3000` works in all browsers without hosts file changes.
   - Recommendation: Support `jones.localhost:3000` pattern (works in Chrome/Firefox natively). Document hosts file alternative for Safari.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None configured (CLAUDE.md: "No test runner is configured yet") |
| Config file | none -- see Wave 0 |
| Quick run command | `npx playwright test --grep @smoke` (after setup) |
| Full suite command | `npx playwright test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOOK-01 | Webhook fires on publish with email publishAs | integration | `npx playwright test tests/webhook.spec.ts -x` | No -- Wave 0 |
| HOOK-02 | Webhook includes correct payload + HMAC; context prevents loop | integration | `npx playwright test tests/webhook.spec.ts -x` | No -- Wave 0 |
| HOOK-03 | email-status callback updates post | integration | Already covered by Phase 2 email-status route | Exists |
| FRONT-01 | Middleware resolves tenant from subdomain | integration | `npx playwright test tests/middleware.spec.ts -x` | No -- Wave 0 |
| FRONT-02 | Homepage renders tenant site-settings data | e2e | `npx playwright test tests/homepage.spec.ts -x` | No -- Wave 0 |
| FRONT-03 | Blog feed shows published posts for tenant | e2e | `npx playwright test tests/blog.spec.ts -x` | No -- Wave 0 |
| FRONT-04 | Post page renders Lexical content with metadata | e2e | `npx playwright test tests/post.spec.ts -x` | No -- Wave 0 |
| FRONT-05 | Newsletter form submits to run-api endpoint | e2e | `npx playwright test tests/newsletter.spec.ts -x` | No -- Wave 0 |
| FRONT-06 | Template switch changes layout without losing content | e2e | `npx playwright test tests/templates.spec.ts -x` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `npx playwright test --grep @smoke` (< 30s subset)
- **Per wave merge:** `npx playwright test` (full suite)
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] Playwright config: `playwright.config.ts` -- configure base URL, projects, webServer
- [ ] `tests/` directory -- all test files listed above
- [ ] Dev server fixture -- start dev server before test runs
- [ ] Seed data fixture -- create test tenant + site-settings + sample posts via Local API
- [ ] Note: Playwright is already in devDependencies (^1.58.2) but has no config

---

## Sources

### Primary (HIGH confidence)
- PayloadCMS v3 official docs: [Hooks Context](https://payloadcms.com/docs/hooks/context) -- context flag pattern for preventing infinite loops
- PayloadCMS v3 official docs: [Collection Hooks](https://payloadcms.com/docs/hooks/collections) -- afterChange signature with previousDoc
- PayloadCMS v3 official docs: [Converting JSX](https://payloadcms.com/docs/rich-text/converting-jsx) -- RichText component import and usage
- PayloadCMS v3 official docs: [Versions/Drafts](https://payloadcms.com/docs/versions/drafts) -- _status field, draft/published lifecycle
- Tailwind CSS v4 official docs: [Next.js Setup](https://tailwindcss.com/docs/guides/nextjs) -- installation steps, PostCSS config
- Tailwind CSS v4 official docs: [Theme Variables](https://tailwindcss.com/docs/theme) -- @theme directive, CSS-first config
- Next.js 15 official docs: [Multi-tenant Guide](https://nextjs.org/docs/app/guides/multi-tenant) -- middleware subdomain approach
- Next.js 15 official docs: [headers()](https://nextjs.org/docs/app/api-reference/functions/headers) -- async in Next.js 15
- Next.js 15 official docs: [Middleware](https://nextjs.org/docs/15/app/api-reference/file-conventions/middleware) -- matcher config
- Installed package versions verified: payload 3.79.0, next 15.4.11, @payloadcms/richtext-lexical 3.79.0
- Existing codebase: email-status route, SiteSettings, Posts, Pages, blocks -- all read and analyzed

### Secondary (MEDIUM confidence)
- [Vercel Platforms Starter Kit](https://github.com/vercel/platforms) -- middleware.ts pattern for subdomain rewriting
- [Google Fonts + Tailwind v4 + Next.js 15](https://www.buildwithmatija.com/blog/how-to-use-custom-google-fonts-in-next-js-15-and-tailwind-v4) -- font variable integration with @theme
- [Tailwind v4 Multi-Theme](https://medium.com/render-beyond/build-a-flawless-multi-theme-ui-using-new-tailwind-css-v4-react-dca2b3c95510) -- CSS variable theming approach

### Tertiary (LOW confidence)
- Font choices (Merriweather, Inter, Space Grotesk) are recommendations based on design goals -- can be adjusted
- Template hex values for base palettes are proposed defaults -- will need visual validation

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified as installed or well-documented
- Architecture: HIGH -- middleware + Local API pattern verified against official docs and Vercel reference
- Pitfalls: HIGH -- each pitfall traced to specific codebase observation or official doc
- Template design: MEDIUM -- font/color choices are recommendations, not verified against user preference
- Webhook pipeline: HIGH -- afterChange + context flag pattern verified in Payload docs

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (stable stack, no fast-moving dependencies)
