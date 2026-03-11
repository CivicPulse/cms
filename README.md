# CMS for Campaign Websites

A headless CMS for campaign websites built with [Payload CMS 3.0](https://payloadcms.com/docs/getting-started/what-is-payload) and [Next.js](https://nextjs.org/).

## Quick Start

### Prerequisites

- Node.js v20.9.0+
- pnpm v9+

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/CivicPulse/cms.git
   cd cms
   ```

2. Copy the environment variables file and fill in the required values:
   ```bash
   cp .env.example .env
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Start the development server:
   ```bash
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

6. Navigate to [http://localhost:3000/admin](http://localhost:3000/admin) to access the admin panel. Follow the on-screen instructions to create your first admin user.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | SQLite database file path | `file:./cms.db` |
| `PAYLOAD_SECRET` | Secret key for Payload CMS | A long, random string |

## Project Structure

```
src/
├── app/
│   ├── (frontend)/       # Public-facing Next.js pages
│   └── (payload)/        # Payload CMS admin panel and API routes
├── collections/
│   ├── Media.ts          # Media uploads collection
│   └── Users.ts          # Users collection (authentication)
└── payload.config.ts     # Payload CMS configuration
tests/
├── e2e/                  # End-to-end tests (Playwright)
└── int/                  # Integration tests (Vitest)
```

## Collections

### Users

Auth-enabled collection providing access to the admin panel.

### Media

Upload-enabled collection for managing images and files.

## Development

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm test:int     # Run integration tests
pnpm test:e2e     # Run end-to-end tests
```

## Docker

You can also run the project using Docker:

```bash
docker-compose up
```

## Documentation

- [Payload CMS Docs](https://payloadcms.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
