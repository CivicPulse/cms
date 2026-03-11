# CivPulse CMS

CMS for campaign websites, built with [PayloadCMS v3](https://payloadcms.com) + Next.js 15 App Router.

## Stack

- **PayloadCMS v3** — headless CMS embedded inside Next.js
- **Next.js 15** — App Router
- **SQLite** — zero-config local database (`cms.db`, auto-created)
- **Lexical** — rich text editor

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` and set a secure `PAYLOAD_SECRET`:

```
PAYLOAD_SECRET=some-long-random-string
```

### 3. Start development server

```bash
npm run dev
```

### 4. Open in browser

| URL | Description |
|-----|-------------|
| http://localhost:3000 | Frontend hello world page |
| http://localhost:3000/admin | Payload admin panel |
| http://localhost:3000/api | Payload REST API |

On first visit to `/admin`, you'll be prompted to create an admin user.

## Collections

- **Users** — admin users with email/password auth
- **Posts** — content with title + rich text body

## Project structure

```
src/
├── app/
│   ├── (frontend)/       # Public-facing Next.js routes
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── (payload)/        # Payload admin + API routes
│       ├── admin/
│       │   └── [[...segments]]/
│       │       ├── page.tsx
│       │       └── not-found.tsx
│       └── api/
│           └── [...slug]/
│               └── route.ts
├── collections/
│   ├── Posts.ts
│   └── Users.ts
└── payload.config.ts
```

## Notes

- `cms.db` is gitignored — each developer gets their own local database
- Run `npm run build` before deploying; Payload generates types at build time
