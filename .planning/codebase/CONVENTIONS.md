# Coding Conventions

**Analysis Date:** 2026-03-11

## Naming Patterns

**Files:**
- TypeScript/TSX files use PascalCase for components: `HomePage.tsx`, `RootLayout.tsx`
- Configuration files use lowercase with dot notation: `payload.config.ts`, `next.config.mjs`
- Collection definitions use PascalCase: `Users.ts`, `Posts.ts`
- Route files follow Next.js conventions: `page.tsx`, `layout.tsx`, `route.ts`, `not-found.tsx`
- Dynamic route parameters use brackets: `[...slug]`, `[[...segments]]`

**Functions:**
- React components (PascalCase): `HomePage()`, `RootLayout()`, `PayloadLayout()`
- Arrow functions for component handlers: `export const generateMetadata = ({ params, searchParams }: Args)`
- Named exports for handlers and configs: `export const GET`, `export const POST`, `export default buildConfig()`

**Variables:**
- camelCase for local variables: `filename`, `dirname`, `nextConfig`
- SCREAMING_SNAKE_CASE for constants exported from Payload framework: `REST_GET`, `REST_POST`, `REST_DELETE`, `REST_PATCH`, `REST_PUT`, `REST_OPTIONS`
- destructured props with inline types: `{ params, searchParams }`, `{ children }`

**Types:**
- PascalCase for type definitions: `CollectionConfig`, `Metadata`, `Args`, `NextConfig`
- `type` keyword used for type aliases (not `interface`)
- Imported types marked with `import type`: `import type { CollectionConfig } from 'payload'`, `import type { Metadata } from 'next'`

## Code Style

**Formatting:**
- No explicit formatter configured (no .prettierrc, .eslintrc present)
- Uses TypeScript strict mode for type checking
- Inline styles in React components use JavaScript objects: `{ fontFamily: 'sans-serif', maxWidth: '600px', margin: '4rem auto', padding: '0 1rem' }`

**Linting:**
- ESLint configured via Next.js: `npm run lint` runs `next lint`
- No custom eslint configuration file present — uses Next.js defaults

## Import Organization

**Order:**
1. Third-party framework imports: `import React from 'react'`, `import { buildConfig } from 'payload'`
2. Relative imports from project: `import { Posts } from './collections/Posts'`
3. Configuration imports: `import config from '@payload-config'`
4. Type imports separated: `import type { ... } from 'payload'`

**Path Aliases:**
- `@/*` → `./src/*` (configured in tsconfig.json)
- `@payload-config` → `./src/payload.config.ts` (virtual module alias)

Example usage:
- `import config from '@payload-config'`
- `import type { CollectionConfig } from 'payload'`

## Error Handling

**Patterns:**
- No explicit error handling visible in codebase (application relies on Payload framework error handling)
- Configuration uses optional environment variables with fallback: `process.env.PAYLOAD_SECRET || ''`
- No custom error boundaries or error handling utilities present

**Strategy:**
- Framework-delegated: Payload handles database and API errors
- Next.js handles route-level errors via `not-found.tsx` for 404s
- No try-catch blocks found in source code

## Logging

**Framework:** Console object (implicit)

**Patterns:**
- No explicit logging infrastructure configured
- Application relies on Payload and Next.js built-in logging
- No custom logger instances or Winston/Pino dependencies

## Comments

**When to Comment:**
- No JSDoc/TSDoc comments used in the codebase
- Configuration is self-documenting through Payload's declarative config style
- Collection definitions use clear property names instead of inline comments

**JSDoc/TSDoc:**
- Not used or required

## Function Design

**Size:** Small, focused functions

**Parameters:**
- Destructured destructuring for props: `{ children: React.ReactNode }`, `{ params, searchParams }`
- Typed props with explicit type annotations: `type Args = { params: Promise<{...}>; searchParams: Promise<{...}> }`
- Arrow function declarations for async handlers: `export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>`

**Return Values:**
- Explicit return types on async functions: `Promise<Metadata>`
- React components return JSX elements
- Config builders return configuration objects
- Handler functions return Framework handler instances

## Module Design

**Exports:**
- Named exports for configurations: `export const Users: CollectionConfig = {...}`
- Default exports for React components: `export default function HomePage() {...}`
- Re-exports from Payload: `export const GET = REST_GET(config)`

**Barrel Files:**
- Single collection file per entity: `Users.ts`, `Posts.ts`
- No barrel index files (no `index.ts` for collections)
- Empty importMap: `src/app/(payload)/admin/importMap.js` for Payload's dynamic imports

## Type System

**TypeScript Configuration:**
- `strict: true` — enforces strict type checking
- `jsx: "preserve"` — leaves JSX for Next.js to process
- `moduleResolution: "bundler"` — uses modern module resolution
- `resolveJsonModule: true` — allows importing JSON files
- `isolatedModules: true` — ensures each file can be transpiled independently

**Type Usage:**
- Payload's `CollectionConfig` type used for all collection definitions
- Next.js types (`Metadata`) imported and used for metadata generation
- Promise types used for async props: `Promise<{ segments: string[] }>`
- Discriminated unions for route parameters: `type Args = { params: ...; searchParams: ... }`

---

*Convention analysis: 2026-03-11*
