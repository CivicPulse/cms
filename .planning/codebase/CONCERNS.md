# Codebase Concerns

**Analysis Date:** 2026-03-11

## Security Considerations

**Hardcoded Empty Secret in payload.config.ts:**
- Risk: The `PAYLOAD_SECRET` environment variable has a fallback to an empty string. If the env var is not set during build or runtime, the secret defaults to `''`, which completely undermines Payload's authentication security.
- Files: `src/payload.config.ts` (line 19)
- Current mitigation: `.env.example` documents the requirement to set `PAYLOAD_SECRET`
- Recommendations:
  - Remove the fallback empty string. Instead, throw an error if `PAYLOAD_SECRET` is missing: `process.env.PAYLOAD_SECRET || (() => { throw new Error('PAYLOAD_SECRET is required') })()`
  - This ensures the application fails to start if the critical secret is not configured, preventing accidental insecure deployments
  - Add a build-time check in `next.config.mjs` or a startup script to validate required env vars

**SQLite Database Path is Relative:**
- Risk: The database file `cms.db` is stored at `file:./cms.db` (relative path in `payload.config.ts` line 25). In production, the working directory may differ from development, causing the database file to be created in an unexpected location or lost between deployments.
- Files: `src/payload.config.ts` (line 25)
- Current mitigation: Works correctly in local development where paths are predictable
- Recommendations:
  - Use an absolute path or environment-based configuration: `process.env.DATABASE_URL || path.resolve(process.cwd(), 'cms.db')`
  - For production, enforce the database path via environment variable to control persistence

**Missing CORS Configuration:**
- Risk: No explicit CORS headers are set in the Payload REST API. If the frontend and CMS are served from different origins in production (e.g., `app.civpulse.com` + `cms.civpulse.com`), cross-origin requests will be blocked by the browser. This is not a security vulnerability but a functionality gap that may be discovered late in deployment.
- Files: `src/payload.config.ts` (no `rest` configuration object)
- Current mitigation: Payload provides sensible defaults, but they may not match deployment requirements
- Recommendations:
  - Define explicit CORS rules in the Payload config based on expected frontend origins
  - Document the expected deployment architecture (same domain vs. separate subdomains)

## Tech Debt

**Minimal Field Definition in Users Collection:**
- Issue: The `Users` collection in `src/collections/Users.ts` has an empty `fields` array (line 9). While Payload provides default authentication fields, this is implicit and undocumented. A developer reading this collection won't know what fields exist without checking Payload's source or documentation.
- Files: `src/collections/Users.ts`
- Impact: Confusion when extending the Users collection. Developers may duplicate fields or miss existing ones. Maintenance becomes harder as the project grows.
- Fix approach:
  - Explicitly declare all user fields even if inherited from Payload's auth defaults (e.g., `email`, `password`, `createdAt`, `updatedAt`)
  - Add JSDoc comments explaining the schema

**No API Documentation:**
- Issue: The API routes in `src/app/(payload)/api/[...slug]/route.ts` are minimal pass-throughs to Payload's REST handlers. There is no endpoint documentation, OpenAPI spec, or API reference. New developers cannot easily discover available endpoints or their schemas.
- Files: `src/app/(payload)/api/[...slug]/route.ts`
- Impact: Slows onboarding. External integrations require trial-and-error API exploration. API changes are harder to communicate.
- Fix approach:
  - Consider generating an OpenAPI/Swagger spec from Payload's schema (Payload v3 has plugins for this)
  - Add JSDoc comments above route handlers documenting available endpoints
  - Or create a simple `/api/docs` endpoint listing collections and their CRUD endpoints

**No Error Handling or Validation Middleware:**
- Issue: The API route directly exports Payload's handlers without any wrapper layer for custom error handling, request validation, rate limiting, or logging.
- Files: `src/app/(payload)/api/[...slug]/route.ts`
- Impact: Errors are handled by Payload's defaults. If you need custom error responses (e.g., structured error codes for the frontend), you must modify Payload's config rather than add middleware.
- Fix approach:
  - Wrap the handlers in a middleware function that logs requests, validates input schemas, and catches errors to transform them into application-specific responses
  - Or configure Payload's `endpoints` property to add request/response hooks

## Missing Critical Features

**No Testing Framework Configured:**
- Problem: `package.json` has no test runner installed (no Jest, Vitest, or other framework). The comment in `CLAUDE.md` states "No test runner is configured yet."
- Blocks: Cannot write unit tests, integration tests, or E2E tests. Collections, API endpoints, and Payload config changes cannot be validated before deployment.
- Impact: High risk of bugs reaching production. Collection schema changes might break frontend integrations silently.
- Priority: High

**No Logging or Observability:**
- Problem: The codebase uses no logging library. Errors and request tracking are handled by Payload's defaults and Next.js built-in logging. There is no way to debug issues in production or monitor request patterns.
- Blocks: Troubleshooting production issues is slow. API performance bottlenecks cannot be identified.
- Impact: Medium—affects operational visibility and debugging speed, not functionality.
- Priority: Medium

**No Input Validation Schema (Zod/Yup):**
- Problem: Collections define fields with type definitions, but there is no centralized request validation. Custom API endpoints or webhooks (if added) would need to implement validation separately.
- Blocks: Adding custom endpoints requires boilerplate validation code.
- Impact: Medium—error-prone when extending the API.
- Priority: Medium

## Fragile Areas

**Implicit Payload Configuration Dependencies:**
- Files: `src/payload.config.ts`, `src/collections/`
- Why fragile: The Payload config is the single source of truth, but it's a large object with many implicit features (auth, admin UI, database migrations). Changes to collections or the database adapter can have cascading effects on the admin UI, migrations, and API routes without obvious compile errors until runtime.
- Safe modification:
  - Always test collection changes against the admin UI after modifying `src/collections/`
  - Run `npm run build` locally before pushing to ensure TypeScript type generation (`payload-types.ts`) succeeds
  - Consider adding a `--check` mode to the build that validates the Payload config
- Test coverage: No tests; relies on manual smoke testing

**Frontend and CMS Share the Same Process:**
- Files: `next.config.mjs`, `src/app/`
- Why fragile: Next.js and Payload are tightly integrated via `withPayload()`. If one fails to start, the entire application is down. There is no way to restart just the admin panel without restarting the frontend.
- Safe modification:
  - Changes to `next.config.mjs` can affect both frontend and CMS routes. Test both after any config changes.
  - If performance becomes a concern (e.g., slow admin uploads), you cannot scale the CMS independently.
- Scaling path: For high-traffic scenarios, consider extracting Payload into a separate service using `@payloadcms/rest` Docker image

**Missing Environment Variable Validation:**
- Files: `src/payload.config.ts`, `.env.example`
- Why fragile: The codebase relies on `PAYLOAD_SECRET` being set, but there is no runtime check. If a developer forgets to copy `.env.example` to `.env.local`, the app may start with a hardcoded empty secret without any warning.
- Safe modification:
  - Add a startup validation script that checks required env vars before Payload initializes
  - Or fail loudly in `payload.config.ts` if critical vars are missing
- Test coverage: No env var validation tests

## Performance Bottlenecks

**SQLite Database in Development/Small-Scale Deployments:**
- Problem: SQLite is suitable for local development and small projects, but it has limited concurrency. If the CMS becomes the source of truth for data that the frontend queries frequently, SQLite may become a bottleneck.
- Files: `src/payload.config.ts` (line 23)
- Current capacity: SQLite handles hundreds of concurrent connections with increasing latency. For a civic engagement platform, this is likely sufficient for MVP, but not for scaling to thousands of concurrent users.
- Scaling path:
  - Monitor database query performance with `npm run dev` and check Next.js logs for slow queries
  - When throughput increases, migrate to PostgreSQL using `@payloadcms/db-postgres` (drop-in replacement)
  - Document the migration path in the README

**Rich Text Editor Without Image Optimization:**
- Problem: The `Posts` collection uses Lexical rich text editor (`src/collections/Posts.ts` line 16), which allows embedding images. There is no configured image optimization, compression, or CDN integration (e.g., no `sharp` config passed to Payload).
- Files: `src/payload.config.ts`, `src/collections/Posts.ts`
- Cause: Default Payload image handling uses local file storage and serves images via the Next.js Image component without explicit width/height constraints.
- Improvement path:
  - Configure Payload's `upload` collection to set max file size and image dimensions
  - Integrate with a CDN (e.g., Cloudinary, AWS S3) for image storage and delivery
  - Add `next/image` optimization in the frontend when rendering post content

## Scaling Limits

**Single SQLite File Database:**
- Current capacity: ~10,000 to 100,000 records depending on record size. Good for MVP, but limited for multi-region deployments.
- Limit: Cannot be replicated or backed up easily. Database becomes a single point of failure.
- Scaling path: Migrate to PostgreSQL for better reliability, backups, and horizontal scaling options.

**No Caching Layer:**
- Current capacity: Each frontend request to the CMS API hits the database directly. Repeated queries for the same data (e.g., "get all posts") are not cached.
- Limit: As traffic grows, database load increases linearly with frontend requests.
- Scaling path: Add Redis caching in front of the Payload REST API. Or use Payload's built-in cache plugin (if available in v3).

**Embedded CMS in Next.js:**
- Current capacity: The admin panel and frontend share the same Node.js process. Heavy admin operations (bulk uploads, long-running migrations) will block frontend requests.
- Limit: Cannot scale the CMS independently. If CMS uploads spike, frontend pages slow down.
- Scaling path: For large deployments, run Payload as a separate microservice.

## Dependencies at Risk

**Payload CMS v3 (Early Adoption):**
- Risk: Payload v3 is a relatively new major version. The ecosystem is smaller than v2. Some plugins may not be compatible, and breaking changes could occur in minor version updates before v3 stabilizes.
- Impact: Dependency updates may require code changes. Community support for issues is smaller.
- Migration plan:
  - Pin Payload versions in `package.json` to `^3.0.0` with regular minor version testing
  - Monitor the Payload GitHub releases and breaking changes
  - Maintain an upgrade checklist before bumping major versions

**Next.js v15 (Fresh Release):**
- Risk: Next.js 15 was released recently. Some third-party integrations may not be fully tested with it yet.
- Impact: Potential compatibility issues with Payload's Next.js integration or other middleware.
- Migration plan:
  - Test `npm run build` and `npm run dev` thoroughly before deploying to production
  - Check Payload's compatibility matrix for Next.js v15 support

**Sharp Image Library:**
- Risk: `sharp` is a native Node.js module (compiled bindings). It may fail to install on different platforms or node versions if build tools are not available.
- Impact: Development setup can fail on some machines (especially Windows without build tools). CI/CD pipelines may break.
- Migration plan:
  - Document setup requirements in `README.md` (e.g., Visual Studio Build Tools on Windows)
  - Consider using Docker for consistent development environments

## Test Coverage Gaps

**No Tests for Payload Configuration:**
- What's not tested: Changes to `payload.config.ts`, collection definitions, field types, and validation rules
- Files: `src/payload.config.ts`, `src/collections/`
- Risk: Typos or logic errors in collections won't be caught until the admin UI is loaded manually or the API is tested live
- Priority: High

**No Tests for API Routes:**
- What's not tested: REST API endpoints for CRUD operations, error responses, and edge cases (missing fields, invalid data types)
- Files: `src/app/(payload)/api/[...slug]/route.ts`
- Risk: Breaking changes to the API won't be caught before deployment. Integrations with external systems may fail silently.
- Priority: High

**No Tests for Frontend Integration:**
- What's not tested: The frontend's ability to connect to the CMS API, render data from the CMS, and handle API errors
- Files: `src/app/(frontend)/page.tsx`, `src/app/(frontend)/layout.tsx`
- Risk: A change to the API schema could break the frontend without either side realizing it
- Priority: Medium

---

*Concerns audit: 2026-03-11*
