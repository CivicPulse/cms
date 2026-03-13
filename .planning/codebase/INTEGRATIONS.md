# External Integrations

**Analysis Date:** 2026-03-11

## APIs & External Services

**Not detected:**
- No third-party API integrations configured
- No external service SDKs in dependencies
- CMS operates entirely self-contained

## Data Storage

**Databases:**
- SQLite (local file-based)
  - Connection: `file:./cms.db` (configured in `src/payload.config.ts`)
  - Client: `@payloadcms/db-sqlite` adapter
  - Location: Database file created at project root as `cms.db` (gitignored - each developer has their own)
  - Auto-created: Yes, on first run

**File Storage:**
- Local filesystem only
- Payload handles media uploads to the local `media/` directory
- Image optimization via sharp library for media processing

**Caching:**
- Not explicitly configured
- Next.js cache defaults apply

## Authentication & Identity

**Auth Provider:**
- Custom Payload built-in authentication
  - Implementation: Payload CMS native auth
  - User collection: `src/collections/Users.ts` with `auth: true`
  - Admin user setup: First visit to `/admin` prompts creation of admin user
  - Session secret: `PAYLOAD_SECRET` environment variable
  - Secure by default: Payload handles session encryption and token management

## Monitoring & Observability

**Error Tracking:**
- Not detected

**Logs:**
- Console output only (Next.js dev server and Payload runtime logs)
- No structured logging or monitoring service configured

## CI/CD & Deployment

**Hosting:**
- Not configured (template stage - ready for deployment)
- Can deploy to: Vercel, AWS, Render, self-hosted Node.js servers
- Database consideration: SQLite works best in single-instance deployments; requires shared file storage or database migration for multi-instance

**CI Pipeline:**
- Not configured
- Linting available via `npm run lint` (ESLint via Next.js)
- No test runner configured

## Environment Configuration

**Required env vars:**
- `PAYLOAD_SECRET` - Long random string for session/token encryption (must be set before running)

**Secrets location:**
- `.env.local` file (gitignored, created by copying `.env.example`)

## Webhooks & Callbacks

**Incoming:**
- None configured
- Payload REST API accepts HTTP requests on `http://localhost:3000/api/*` for CRUD operations

**Outgoing:**
- None configured
- Could be added via Payload hooks in collection configs

## Database Schema / Collections

**Collections defined in code:**
- Users (`src/collections/Users.ts`) - Admin users with email field, auth enabled
- Posts (`src/collections/Posts.ts`) - Content collection with title (required) and rich text content field

Collections auto-generate database tables via Payload on schema changes.

---

*Integration audit: 2026-03-11*
