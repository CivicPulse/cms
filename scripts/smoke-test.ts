/**
 * Smoke test: Phase 1 multi-tenant isolation proof
 *
 * Covers: FOUND-03 (plugin isolation), FOUND-04 (tenants collection),
 *         FOUND-05 (Local API overrideAccess: false isolation)
 *
 * Run: npx tsx scripts/smoke-test.ts
 * Requires: Postgres running (docker compose up -d postgres) and migrations applied
 */

// NOTE: ESM import statements are hoisted, so env loading must happen via a
// side-effect-free import or inline setup. We use a loader file approach.
// The smoke-test-runner.ts file is used to load env vars first.
//
// Direct invocation: npx tsx scripts/smoke-test.ts
// (tsx handles top-level await so the dynamic imports below run sequentially)

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.local before importing any Payload modules.
// All payload imports below are dynamic (not static) so they execute AFTER this code.
const envFiles = ['.env.local', '.env']
for (const file of envFiles) {
  const envPath = resolve(process.cwd(), file)
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.slice(0, eqIdx).trim()
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '')
      if (!(key in process.env)) {
        process.env[key] = value
      }
    }
    break
  }
}

// Dynamic imports execute AFTER the module's top-level sync code above.
const { getPayload } = await import('payload')
const { default: config } = await import('../src/payload.config')

async function main() {
  console.log('Starting Phase 1 smoke test...\n')

  const payload = await getPayload({ config })
  let passed = 0
  let failed = 0

  function assert(condition: boolean, label: string) {
    if (condition) {
      console.log(`  PASS: ${label}`)
      passed++
    } else {
      console.error(`  FAIL: ${label}`)
      failed++
    }
  }

  // ---- Setup: create a super-admin user ----
  let superAdmin: { id: number; email: string }
  try {
    superAdmin = await payload.create({
      collection: 'users',
      data: {
        email: 'superadmin@smoke-test.local',
        password: 'smoke-test-password-123',
        role: 'super-admin',
      },
      overrideAccess: true,
    })
  } catch {
    // User may already exist from a prior run
    const existing = await payload.find({
      collection: 'users',
      where: { email: { equals: 'superadmin@smoke-test.local' } },
      overrideAccess: true,
    })
    superAdmin = existing.docs[0]
  }
  assert(!!superAdmin?.id, 'Super-admin user created or found')

  // ---- FOUND-04: Create two tenants ----
  let tenantA: { id: number }
  let tenantB: { id: number }

  try {
    tenantA = await payload.create({
      collection: 'tenants',
      data: {
        displayName: 'Tenant A',
        slug: 'tenant-a',
        domain: 'tenant-a.localhost',
        status: 'active',
      },
      overrideAccess: true,
    })
  } catch {
    const existing = await payload.find({
      collection: 'tenants',
      where: { slug: { equals: 'tenant-a' } },
      overrideAccess: true,
    })
    tenantA = existing.docs[0]
  }

  try {
    tenantB = await payload.create({
      collection: 'tenants',
      data: {
        displayName: 'Tenant B',
        slug: 'tenant-b',
        domain: 'tenant-b.localhost',
        status: 'active',
      },
      overrideAccess: true,
    })
  } catch {
    const existing = await payload.find({
      collection: 'tenants',
      where: { slug: { equals: 'tenant-b' } },
      overrideAccess: true,
    })
    tenantB = existing.docs[0]
  }

  assert(!!tenantA?.id, 'FOUND-04: Tenant A created with slug, domain, status fields')
  assert(!!tenantB?.id, 'FOUND-04: Tenant B created with slug, domain, status fields')

  // ---- Setup: create campaign manager users for each tenant ----
  let userA: { id: number; email: string }
  let userB: { id: number; email: string }

  const createOrFindUser = async (email: string, tenantId: number) => {
    try {
      return await payload.create({
        collection: 'users',
        data: {
          email,
          password: 'smoke-test-password-123',
          role: 'campaign-manager',
          tenants: [{ tenant: tenantId }],
        },
        overrideAccess: true,
      })
    } catch {
      const existing = await payload.find({
        collection: 'users',
        where: { email: { equals: email } },
        overrideAccess: true,
      })
      return existing.docs[0]
    }
  }

  userA = await createOrFindUser('user-a@smoke-test.local', tenantA.id)
  userB = await createOrFindUser('user-b@smoke-test.local', tenantB.id)

  assert(!!userA?.id, 'Campaign manager User A created for Tenant A')
  assert(!!userB?.id, 'Campaign manager User B created for Tenant B')

  // ---- FOUND-03/04: Create posts under each tenant ----
  let postA: { id: number }
  let postB: { id: number }

  try {
    postA = await payload.create({
      collection: 'posts',
      draft: false,
      data: {
        title: 'Tenant A Post',
        slug: 'tenant-a-post',
        publishAs: 'web',
        tenant: tenantA.id,
      },
      overrideAccess: true,
    })
  } catch {
    const existing = await payload.find({
      collection: 'posts',
      where: {
        and: [
          { title: { equals: 'Tenant A Post' } },
          { tenant: { equals: tenantA.id } },
        ],
      },
      overrideAccess: true,
    })
    postA = existing.docs[0]
  }

  try {
    postB = await payload.create({
      collection: 'posts',
      draft: false,
      data: {
        title: 'Tenant B Post',
        slug: 'tenant-b-post',
        publishAs: 'web',
        tenant: tenantB.id,
      },
      overrideAccess: true,
    })
  } catch {
    const existing = await payload.find({
      collection: 'posts',
      where: {
        and: [
          { title: { equals: 'Tenant B Post' } },
          { tenant: { equals: tenantB.id } },
        ],
      },
      overrideAccess: true,
    })
    postB = existing.docs[0]
  }

  assert(!!postA?.id, 'Post created under Tenant A')
  assert(!!postB?.id, 'Post created under Tenant B')

  // ---- FOUND-05: Cross-tenant isolation via Local API ----
  // User A queries posts scoped to Tenant B — should get 0 results
  const crossTenantResult = await payload.find({
    collection: 'posts',
    where: { tenant: { equals: tenantB.id } },
    overrideAccess: false,
    user: userA as Parameters<typeof payload.find>[0]['user'],
  })

  assert(
    crossTenantResult.docs.length === 0,
    'FOUND-05: User A querying Tenant B posts returns 0 docs (isolation enforced)',
  )

  // User A can query their own tenant's posts
  const ownTenantResult = await payload.find({
    collection: 'posts',
    where: { tenant: { equals: tenantA.id } },
    overrideAccess: false,
    user: userA as Parameters<typeof payload.find>[0]['user'],
  })

  assert(
    ownTenantResult.docs.length >= 1,
    'FOUND-05: User A querying Tenant A posts returns own data',
  )

  // ---- FOUND-06: Verify cleanupAfterTenantDelete is false in config ----
  // Static check — confirmed by the plugin config in payload.config.ts
  // (This is a code review check; we note it here for completeness)
  console.log('\n  INFO: FOUND-06 (cleanupAfterTenantDelete: false) is a static config check.')
  console.log('  Verify: grep "cleanupAfterTenantDelete" src/payload.config.ts\n')

  // ---- Summary ----
  console.log(`\nSmoke test complete: ${passed} passed, ${failed} failed`)
  if (failed > 0) {
    process.exit(1)
  }

  await payload.db.destroy?.()

}

main().catch((err) => {
  console.error('Smoke test error:', err)
  process.exit(1)
})
