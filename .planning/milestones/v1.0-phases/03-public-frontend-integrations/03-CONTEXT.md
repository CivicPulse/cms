# Phase 3: Public Frontend + Integrations - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Visitors see a fully rendered campaign website at the tenant's subdomain, with data-driven templates, blog content, and newsletter signup — while post publishing triggers the email delivery pipeline via webhooks to run-api.

Phase delivers: subdomain-based tenant resolution middleware, 3 visual templates (classic/modern/bold), public homepage with hero + meet candidate + editable blocks + post grid, blog feed with pagination, individual post pages, newsletter signup flow, webhook pipeline to run-api, and social share buttons.

Phase does NOT include: custom domains (v2), events calendar (v2), donation page with Stripe (v2), email delivery itself (run-api), subscriber management beyond initial capture (run-api).

</domain>

<decisions>
## Implementation Decisions

### Template visual identity
- Three templates form a spectrum: Classic (most formal) → Modern (middle ground) → Bold (most energetic)
- Classic: serif fonts, structured grid, navy/burgundy defaults, traditional feel — for established candidates, older voter demographics
- Modern: clean sans-serif, balanced whitespace, contemporary feel — safe default for most campaigns
- Bold: large type, vivid primaryColor usage, dynamic layout, hero-forward — for grassroots, first-time candidates
- Each template has its own hero treatment: Classic = side-by-side (photo right), Modern = centered text with small circular photo above, Bold = full-bleed photo background with primaryColor overlay and huge name text

### primaryColor usage
- primaryColor from SiteSettings is used as **accent only** — buttons, links, highlights, active nav indicator, accent borders/underlines
- Each template has its own fixed base palette (backgrounds, text colors, section dividers) that stays consistent regardless of primaryColor
- This prevents bad hex values from ruining the layout

### Styling approach
- Tailwind CSS for all templates
- CSS variables for primaryColor integration
- Template-specific wrapper classes
- Responsive via sm:/md:/lg: prefixes
- Shared design tokens via tailwind.config

### Mobile-first responsive
- Design for phone screens first, enhance for desktop
- Single-column layout by default, multi-column grids on desktop
- Large tap targets (48px min)
- Nav collapses to hamburger menu on mobile
- Hero stacks vertically on mobile

### Missing image handling
- When candidatePhoto or logo is not uploaded, render an initials placeholder — circle with candidate's initials in primaryColor
- Clean, always looks intentional, no broken-image states

### Sticky action bar
- Persistent bar below the nav with CTA buttons (Donate, Volunteer, etc.)
- Buttons populated from external nav items (auto-detected by URL starting with http)
- donationUrl → Donate button; other external links as configured
- Bar hides if no external nav items are configured
- Visible on both mobile and desktop, matching votehatcher.com pattern

### Footer
- Compact info footer on all templates: campaign name, social icons (from SiteSettings), contact email
- "Paid for by..." disclaimer line (campaign compliance)
- "Powered by CivPulse" small link
- Newsletter email subscribe form in footer (see Newsletter section)

### Navigation — Ghost-style configurable nav
- New `navItems` field on SiteSettings: repeating array of `{label, url}` pairs
- Campaign managers type label ("About") + URL ("/about" or "https://actblue.com/...")
- External links auto-detected (starts with http) and open in new tab
- No highlight/button distinction — flat list, all rendered the same in the nav
- Logo/campaign name click always goes to homepage

### Homepage structure
- Homepage is a **Pages collection entry with slug "home"** — editable via block builder
- Fixed structure sandwich: Hero (from SiteSettings) → Meet the Candidate (from SiteSettings) → Editable blocks (from Pages "home") → Recent posts grid → Footer
- **Hero section:** candidate name, tagline, office, CTA buttons — always present, data-driven from SiteSettings. Template-specific treatment.
- **Meet the Candidate section:** candidatePhoto + bio excerpt + "Read More" link — shows if SiteSettings.bio is filled, hides if empty
- **Recent posts grid:** 9 post cards (title, date, excerpt, featured image) in 3-column grid on desktop, single column on mobile. "View all posts →" link to /blog
- Provisioning must auto-create the "home" page for each new tenant

### Route structure
- `/` → Homepage (Pages entry slug "home" with fixed hero/meet/posts wrapper)
- `/{slug}` → Pages collection entries (about, issues, contact, etc.)
- `/blog` → Full paginated blog feed
- `/blog/{slug}` → Individual post page
- `/newsletter` → Dedicated newsletter signup page

### Page rendering (non-homepage)
- Pages from the Pages collection render their blocks directly — no fixed hero, no blog list
- Campaign managers use Hero block if they want a hero on a specific page
- Homepage is the only page with fixed structural sections

### Tenant status enforcement (from Phase 1)
- `suspended`: public site renders normally, admin panel blocked
- `archived`: generic "site not found" page, no campaign branding, no admin access
- Unknown subdomain: same "site not found" page

### Blog feed
- Dedicated /blog route with full paginated post feed
- 3-column card grid on desktop, single column on mobile
- Each card: featured image, title, excerpt (~150 chars), date
- 9 posts per page
- Simple prev/next pagination: "← Newer Posts | Page X of Y | Older Posts →"
- Only shows published posts where publishAs is "web" or "both"

### Post pages
- Structure: title (h1) → date + author meta → featured image (full width) → rich text content (Lexical rendered) → share buttons
- Social share buttons at bottom: Facebook, X/Twitter, Email, Copy Link

### Posts collection addition: featuredImage
- Add `featuredImage` upload field (relationTo: media) to Posts collection
- Optional field — posts without an image still render fine (use placeholder or hide image area)
- Used in: homepage post cards, blog feed cards, individual post hero, social sharing meta (og:image)

### Newsletter signup — multi-placement
- **Footer on every page:** email-only input + Subscribe button (compact)
- **Contact block toggle:** when "show newsletter signup" is enabled in the Contact block, form appears inline
- **Sticky mobile CTA bar:** includes "Sign Up" alongside Donate (if configured)
- **Dedicated /newsletter page:** standalone signup page with explanation of what subscribers get

### Newsletter signup — two-step flow
- Step 1: email-only capture, POST to run-api `POST /api/v1/campaigns/{campaign_id}/subscribers`
- Step 2: on-site thank you page with optional name + zip code fields, "Update" and "Skip" buttons
- Step 2 updates subscriber record via run-api
- Zip code is valuable for local campaigns (district targeting)

### Webhook pipeline (from requirements)
- Posts `afterChange` hook fires HMAC-signed webhook to run-api when post transitions to published with publishAs "email" or "both"
- Webhook payload: postId, tenantId, publishAs, HMAC signature
- Context flag prevents infinite loop when run-api calls back to update emailStatus
- email-status callback route already exists from Phase 2

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

</decisions>

<specifics>
## Specific Ideas

- **Reference site:** votehatcher.com is the primary design reference — one of the 3 templates should closely replicate this look and feel (navy/blue dominant, orange CTAs, Ghost Casper-like layout)
- **Reference theme source:** https://github.com/kerryhatcher/vote-hatch-ghost-theme — Ghost theme that powers votehatcher.com, valuable for understanding structure and styling decisions
- Homepage post grid: 9 cards with title, date, excerpt, and header image (matching votehatcher.com's "Latest Updates" section)
- Sticky action bar with Donate + Volunteer is a key conversion pattern from the current site — replicate across all templates
- "Paid for by..." disclaimer is a campaign compliance requirement — must be in every footer
- Nav items model copied from Ghost: simple {label, url} pairs, campaign manager controls order, mixes internal pages and external links naturally

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/collections/SiteSettings.ts`: Has candidateName, officeRunningFor, tagline, bio, primaryColor, logo, candidatePhoto, social URLs, contactEmail, donationUrl, activeTemplateKey. Needs new `navItems` array field added.
- `src/collections/Posts.ts`: Has title, content (Lexical), publishAs, slug, email fields. Needs new `featuredImage` upload field added.
- `src/collections/Pages.ts`: Has title, slug, layout (blocks: Hero, Text, Issues, Contact). Homepage will be a Pages entry with slug "home".
- `src/collections/blocks/`: HeroBlock, TextBlock, IssuesBlock, ContactBlock — all defined and ready for frontend rendering.
- `src/collections/Media.ts`: Upload collection backed by R2 via storage-s3. Used for all image uploads.
- `src/collections/Tenants.ts`: Has slug, displayName, domain, status fields. Domain field stores full hostname for middleware resolution.
- `src/app/(payload)/api/posts/[id]/email-status/route.ts`: HMAC-verified callback route for run-api — already exists from Phase 2.
- `src/env.ts`: Zod validation for env vars including WEBHOOK_SECRET — established pattern for new env vars.
- `src/hooks/ensureUniqueTenantSlug.ts`: Per-tenant slug uniqueness validation — used by Posts and Pages.

### Established Patterns
- Multi-tenant plugin handles row-level scoping for registered collections
- `beforeValidate` hooks for per-tenant slug uniqueness (cross-tenant duplicates allowed)
- Env validation via `src/env.ts` with Zod — all new required env vars go there
- Named exports for collections, imported into payload.config.ts collections array
- `@/*` path alias → `./src/*`

### Integration Points
- `src/app/(frontend)/`: Currently has placeholder page.tsx and layout.tsx — this is where the entire public frontend will be built
- `next.config.mjs`: May need middleware config for subdomain tenant resolution
- `src/middleware.ts`: New file — Next.js middleware for subdomain → tenant resolution, injecting tenant context
- `payload.config.ts`: Posts collection needs featuredImage field; SiteSettings needs navItems field
- `src/collections/Posts.ts`: Add afterChange hook for webhook firing
- run-api endpoints: `POST /api/v1/webhooks/payload/post-published` (webhook target), `POST /api/v1/campaigns/{campaign_id}/subscribers` (newsletter signup)

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-public-frontend-integrations*
*Context gathered: 2026-03-12*
