# Testing Patterns

**Analysis Date:** 2026-03-11

## Test Framework

**Runner:**
- Not configured — no test runner installed

**Assertion Library:**
- None installed

**Run Commands:**
```bash
# No testing infrastructure configured
# The following commands are available via npm scripts:
npm run dev       # Start dev server (Next.js + Payload)
npm run build     # Build for production
npm run lint      # ESLint via next lint
npm run start     # Start production server
```

## Test File Organization

**Location:**
- No test files present in codebase
- No `.test.ts`, `.spec.ts`, `.test.tsx`, or `.spec.tsx` files found

**Naming:**
- Not applicable

**Structure:**
- Not applicable

## Test Framework Recommendations

Based on the technology stack (Next.js 15, PayloadCMS 3, React 19), the following frameworks would be appropriate:

**For Unit/Integration Testing:**
- **Vitest** (recommended) - Fast, TypeScript-native, Jest-compatible API
  - Zero config with tsconfig
  - Fast due to native ESM/Vite support
  - Perfect for Next.js and React component testing

- **Jest** (alternative) - Mature, widely adopted
  - Requires additional configuration for Next.js
  - Heavier startup time but excellent ecosystem

**For E2E Testing:**
- **Playwright** or **Cypress** - Recommended for testing the admin panel and API routes

## Testing Areas Not Covered

**Unit Tests (Priority: High):**
- Collection definitions (`src/collections/Users.ts`, `src/collections/Posts.ts`)
  - Should test field validation, slugs, auth configuration
  - Risk: Schema errors in production if untested

- Configuration (`src/payload.config.ts`)
  - Should verify Payload initialization, database setup
  - Risk: Silent configuration failures

**Component Tests (Priority: Medium):**
- Frontend pages (`src/app/(frontend)/page.tsx`)
  - Should test rendering, links, metadata
  - Risk: Broken UI in production

- Layouts (`src/app/(frontend)/layout.tsx`, `src/app/(payload)/layout.tsx`)
  - Should test proper nesting, metadata inheritance
  - Risk: SEO issues, layout breakage

**Integration Tests (Priority: High):**
- API routes (`src/app/(payload)/api/[...slug]/route.ts`)
  - Should test HTTP verb delegation to Payload
  - Should test CRUD operations on Users and Posts collections
  - Should test authentication flows (user creation, login)
  - Risk: API broken without detection

- Admin page (`src/app/(payload)/admin/[[...segments]]/page.tsx`)
  - Should test page metadata generation with dynamic segments
  - Should test admin panel routing
  - Risk: Admin panel inaccessible in production

**E2E Tests (Priority: Medium):**
- Complete user flows:
  - Admin user creation flow
  - Post creation/editing/deletion
  - API endpoint calls
  - Frontend → Admin navigation

## Mocking Strategy (When Implemented)

**What to Mock:**
- Payload configuration (use dependency injection or test doubles)
- `process.env` variables (set defaults for testing)
- Database (use SQLite in-memory or test database)
- External APIs (if any are added later)

**What NOT to Mock:**
- React components (test actual rendered output)
- Next.js routing (use actual route handlers)
- HTTP handlers (test the actual REST export functions)

## Fixtures and Factories (When Implemented)

**Suggested Test Data Structure:**

```typescript
// tests/fixtures/users.ts
export const mockUsers = {
  admin: {
    email: 'admin@test.local',
    password: 'test-password-123',
  },
  editor: {
    email: 'editor@test.local',
    password: 'editor-password-123',
  },
}

// tests/fixtures/posts.ts
export const mockPosts = {
  published: {
    title: 'Test Post',
    content: 'Test content',
  },
  draft: {
    title: 'Draft Post',
    content: 'Draft content',
  },
}
```

**Location:**
- Should be in `tests/fixtures/` or `__fixtures__/` directory
- Keep separate from test files for reusability

## Coverage

**Requirements:**
- Not enforced — no coverage thresholds configured
- Recommendation: Set minimum coverage target at 80% for critical paths (collections, API routes)

## Common Testing Patterns (When Implemented)

**Async Testing:**
```typescript
// Vitest example for async API route testing
describe('POST /api/posts', () => {
  it('should create a post', async () => {
    const response = await POST(request, { params: Promise.resolve({}) })
    expect(response.status).toBe(201)
  })
})
```

**Error Testing:**
```typescript
// Testing validation errors on collections
describe('Posts Collection', () => {
  it('should require title field', async () => {
    // Test that title: required validates properly
    expect(Posts.fields[0].required).toBe(true)
  })
})
```

**Type Safety in Tests:**
```typescript
// Use generated payload-types.ts for test data
import type { Post } from '@/payload-types'

const testPost: Post = {
  id: 'test-1',
  title: 'Test',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}
```

## Configuration Setup Instructions (For Future Implementation)

**Step 1: Install Vitest**
```bash
npm install --save-dev vitest @vitest/ui happy-dom
```

**Step 2: Create vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/payload-types.ts']
    }
  }
})
```

**Step 3: Add test scripts to package.json**
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

**Step 4: Create test file structure**
```
src/
├── collections/
│   ├── Posts.ts
│   └── Posts.test.ts           # Co-located test
├── app/
│   └── (payload)/
│       └── api/
│           └── [...slug]/
│               └── route.test.ts
tests/
├── fixtures/
│   ├── posts.ts
│   └── users.ts
└── integration/
    └── api.test.ts
```

---

*Testing analysis: 2026-03-11*
