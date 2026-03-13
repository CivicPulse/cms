# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server (Next.js + Payload together)
npm run build    # Build for production (also generates payload-types.ts)
npm run lint     # ESLint via next lint
```

No test runner is configured yet.

## Environment

Copy `.env.example` to `.env.local` and set `PAYLOAD_SECRET` to a long random string before running.

## Architecture

PayloadCMS v3 is **embedded inside Next.js** — they share a single process and port. There is no separate CMS server.

```
src/
├── app/
│   ├── (frontend)/        # Public Next.js routes (pages, layouts)
│   └── (payload)/         # Payload admin UI + REST API routes
│       ├── admin/         # Admin panel (served by Payload)
│       └── api/[...slug]/ # REST API catch-all (proxies to Payload)
├── collections/           # Payload collection definitions
└── payload.config.ts      # Central Payload config (DB, editor, collections)
```

**Key wiring points:**
- `next.config.mjs` wraps config with `withPayload()` — enables the `@payload-config` virtual module alias and Payload's webpack/turbopack integration.
- `src/app/(payload)/api/[...slug]/route.ts` delegates all HTTP verbs to Payload's REST handlers.
- `payload.config.ts` is the single source of truth: registers collections, sets the SQLite DB path (`cms.db`), and configures the Lexical rich text editor.
- Generated types land in `src/payload-types.ts` (created at build time, gitignored or committed per preference).

**Database:** SQLite via `@payloadcms/db-sqlite`. The file `cms.db` is auto-created locally and gitignored — each developer has their own DB.

## Adding collections

Create a new file in `src/collections/`, define and export a `CollectionConfig`, then register it in the `collections` array in `payload.config.ts`.

## URLs (local dev)

| URL | Purpose |
|-----|---------|
| `http://localhost:3000` | Frontend |
| `http://localhost:3000/admin` | Payload admin panel |
| `http://localhost:3000/api` | Payload REST API |

First visit to `/admin` prompts admin user creation.
