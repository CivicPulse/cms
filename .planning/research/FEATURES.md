# Feature Landscape

**Domain:** Multi-tenant campaign website CMS
**Researched:** 2026-03-11

## Table Stakes

Features users expect. Missing = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Tenant isolation (data + admin) | Core multi-tenant requirement; campaigns must never see each other's data | High | Plugin handles most of this; slug uniqueness needs custom work |
| Blog posts with rich text | Every campaign site needs a blog/news section | Low | Already scaffolded with Lexical editor |
| Static pages (about, issues) | Campaign websites need more than just blog posts | Medium | Block-based layout builder with Payload blocks field |
| Media uploads to cloud storage | Candidate photos, event images must persist across deploys | Medium | S3 adapter + R2; requires disableLocalStorage: true |
| Per-tenant site config | Candidate name, colors, logo, social links drive the template | Medium | Payload isGlobal collection or regular collection with one-per-tenant enforcement |
| Admin panel per tenant | Campaign managers edit only their content | Low | Multi-tenant plugin provides out of the box |
| Webhook on publish | Trigger email delivery in run-api when post transitions to published | Medium | afterChange hook comparing doc vs previousDoc status |
| Newsletter subscriber signup | Visitors subscribe to campaign updates | Low | Frontend form POSTing to run-api; CMS provides campaign_id context |

## Differentiators

Features that set product apart. Not expected, but valued.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Template switching without content loss | Campaigns change visual theme instantly; no re-entry of content | Medium | Data-driven templates reading from tenant globals; content decoupled from layout |
| 10-minute site launch | From provisioning to live site in under 10 minutes | Medium | run-api seeds tenant + initial content via Payload REST API |
| Dual-purpose posts (web + email) | Write once, publish as blog post AND newsletter email | Medium | publishAs field with conditional email fields; Lexical-to-HTML serialization |
| Non-technical admin experience | Zero code, zero terminal, zero config files | Low | Payload admin UI handles everything; invest in field labels and descriptions |
| HMAC-signed webhooks | Secure, verifiable integration between CMS and run-api | Low | Standard crypto.createHmac in afterChange hook |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Subscriber storage in Payload | Subscribers are CRM data; Payload owns content, not people | Store in run-api PostgreSQL; form POSTs to run-api endpoint |
| Email delivery from Payload | Sending requires queuing, retries, unsubscribe handling, rate limiting | Payload fires webhook; run-api handles Resend + Procrastinate job queue |
| Custom domain management | Requires DNS management UI, SSL provisioning, CNAME verification | v2 feature; use subdomains (*.campaigns.civpulse.com) for v1 |
| User self-registration | Campaign managers should be provisioned by platform admin, not self-serve | Provisioning initiated from run-web via run-api |
| Drag-and-drop page builder | Over-engineering for v1; Payload's block field provides structured editing | Use Payload blocks field type for page layouts |
| Per-tenant database isolation | One DB per tenant = operational nightmare at scale | Row-level tenant isolation via plugin's tenant relationship field |
| Real-time collaborative editing | Adds massive complexity; single-campaign-manager use case does not need it | Standard Payload save/publish workflow |

## Feature Dependencies

```
PostgreSQL adapter --> Multi-tenant plugin (plugin needs real DB for production)
Multi-tenant plugin --> Tenant-scoped collections (posts, pages, media, site-config)
Media collection --> R2 storage adapter (configure before media uploads work)
Posts collection --> Lexical editor (already scaffolded)
Posts collection --> afterChange hook --> Webhook to run-api
Webhook to run-api --> HMAC signing (WEBHOOK_SECRET env var)
Lexical-to-HTML serializer --> Email template generation (CMS provides HTML to run-api)
Tenant globals --> Frontend templates (templates read candidate name, colors, etc.)
Frontend templates --> Template switching (data-driven, not hardcoded to layout)
```

## MVP Recommendation

Prioritize (in dependency order):
1. PostgreSQL migration + env validation (foundation; blocks everything else)
2. Multi-tenant plugin + tenants collection with custom slug validation (core isolation)
3. Tenant-scoped posts, pages, media collections (core content types)
4. Per-tenant site config (isGlobal or one-per-tenant pattern) (drives frontend)
5. R2 media storage (required for any image uploads)
6. afterChange webhook on post publish (connects CMS to email pipeline)
7. One frontend template reading from tenant config (proves the pattern)

Defer:
- Template switching UI: build 1 template first, add switching mechanism when 2+ templates exist
- Newsletter subscriber form: simple frontend component; can be added at any time after templates
- Multiple visual templates: build one, validate data-driven pattern, then add variants
- Lexical-to-HTML for email: only needed when webhook + run-api email pipeline is connected

## Sources

- [Payload Multi-Tenant Plugin Docs](https://payloadcms.com/docs/plugins/multi-tenant)
- [Payload Blocks Field Docs](https://payloadcms.com/docs/fields/blocks)
- [Payload Collection Hooks](https://payloadcms.com/docs/hooks/collections)
- PROJECT.md requirements
