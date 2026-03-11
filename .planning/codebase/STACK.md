# Technology Stack

**Analysis Date:** 2026-03-11

## Languages

**Primary:**
- TypeScript 5.0.0 - Used for all source code (`.ts`, `.tsx` files)
- JSX - React component markup in `.tsx` files

**Secondary:**
- JavaScript (ES modules) - Build config (`next.config.mjs`)

## Runtime

**Environment:**
- Node.js v20.20.1

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (auto-generated)

## Frameworks

**Core:**
- Next.js 15.0.0 - Full-stack framework for frontend and API routes
- React 19.0.0 - UI library for components
- React DOM 19.0.0 - DOM rendering for React

**CMS & Backend:**
- Payload CMS 3.0.0 - Embedded headless CMS, provides REST API and admin UI
- @payloadcms/next 3.0.0 - Next.js integration for Payload, wraps Next config with `withPayload()`
- @payloadcms/richtext-lexical 3.0.0 - Rich text editor for collection fields

**Database:**
- @payloadcms/db-sqlite 3.0.0 - SQLite adapter for Payload, stores data in `cms.db`

**Image Processing:**
- sharp 0.33.0 - Image optimization and manipulation

## Key Dependencies

**Critical:**
- payload (3.0.0) - Core CMS framework providing collection management, admin UI, authentication, and REST API
- @payloadcms/db-sqlite (3.0.0) - Required for database connectivity; SQLite is the storage backend
- @payloadcms/next (3.0.0) - Required integration that enables Payload to run inside Next.js; sets up the `@payload-config` virtual module alias
- @payloadcms/richtext-lexical (3.0.0) - Rich text field support for Posts collection content

**Infrastructure:**
- sharp (0.33.0) - Image processing for media uploads in Payload admin

## Configuration

**Environment:**
- Configuration via environment variables
- `.env.local` required (copy from `.env.example`)
- Required env var: `PAYLOAD_SECRET` (long random string for session encryption)

**Build Configuration:**
- `next.config.mjs` - Next.js config, wrapped with `withPayload()` for CMS integration
- `tsconfig.json` - TypeScript compiler options with path aliases:
  - `@/*` → `./src/*` (source code alias)
  - `@payload-config` → `./src/payload.config.ts` (virtual module for Payload config)
- `src/payload.config.ts` - Central Payload configuration (single source of truth):
  - Database: SQLite at `file:./cms.db`
  - Editor: Lexical rich text editor
  - Collections: Users (with auth), Posts
  - Admin user: User slug
  - TypeScript types output: `src/payload-types.ts` (generated at build)

## Platform Requirements

**Development:**
- Node.js 20.x or later (confirmed working with v20.20.1)
- npm or compatible package manager
- Unix-like shell for running npm scripts

**Production:**
- Node.js 20.x or later
- File system access for SQLite database (`cms.db`)
- Deployment target: Any platform supporting Node.js (Vercel, self-hosted, etc.)
- Single-process architecture (Payload and Next.js share one process on the same port 3000)

---

*Stack analysis: 2026-03-11*
