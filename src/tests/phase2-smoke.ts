#!/usr/bin/env npx tsx
/**
 * Phase 2 smoke test — Local API integration
 * Run: npx tsx src/tests/phase2-smoke.ts
 *
 * Requirements tested (Local API, no running server):
 *   CONT-01: Per-tenant slug uniqueness for posts
 *   CONT-02: emailStatus read-only for campaign managers
 *   CONT-03: Pages + blocks (stub until Plan 02)
 *   CONF-01: SiteSettings one-per-tenant (stub until Plan 03)
 *   CONF-02: REST API key auth (manual — stub note only)
 */

// Load .env.local before any Payload modules are imported.
// Same pattern as scripts/smoke-test.ts — env must be loaded before Zod validation fires.
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

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

// Dynamic imports — execute AFTER env is loaded above
const { getPayload } = await import('payload')
const { default: config } = await import('../payload.config')

let failures = 0

function pass(msg: string) {
  console.log(`  PASS: ${msg}`)
}

function fail(msg: string) {
  console.error(`  FAIL: ${msg}`)
  failures++
}

function skip(msg: string) {
  console.log(`  SKIP: ${msg}`)
}

async function main() {
  const payload = await getPayload({ config })

  // -- Helper: idempotent fixture create --
  async function findOrCreate(
    collection: string,
    where: Record<string, unknown>,
    data: Record<string, unknown>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    const result = await payload.find({
      collection: collection as 'posts',
      where: where as Parameters<typeof payload.find>[0]['where'],
      limit: 1,
      overrideAccess: true,
    })
    if (result.docs.length > 0) return result.docs[0]
    return await payload.create({
      collection: collection as 'posts',
      data: data as Parameters<typeof payload.create>[0]['data'],
      overrideAccess: true,
    })
  }

  // -- Fixtures: two tenants --
  console.log('\n[Fixtures]')
  const tenantA = await findOrCreate(
    'tenants',
    { slug: { equals: 'smoke-tenant-a' } },
    { slug: 'smoke-tenant-a', displayName: 'Smoke Tenant A', domain: 'smoke-a.test', status: 'active' },
  )
  const tenantB = await findOrCreate(
    'tenants',
    { slug: { equals: 'smoke-tenant-b' } },
    { slug: 'smoke-tenant-b', displayName: 'Smoke Tenant B', domain: 'smoke-b.test', status: 'active' },
  )
  const campaignManager = await findOrCreate(
    'users',
    { email: { equals: 'cm-phase2@smoke.test' } },
    {
      email: 'cm-phase2@smoke.test',
      password: 'Phase2Smoke!1',
      role: 'campaign-manager',
      tenants: [{ tenant: tenantA.id, roles: ['tenant-admin'] }],
    },
  )
  console.log(`  Tenant A: ${tenantA.id}, Tenant B: ${tenantB.id}`)

  // -- CONT-01: Per-tenant slug uniqueness --
  console.log('\n[CONT-01] Per-tenant slug uniqueness')

  // Cross-tenant duplicate slug is allowed
  const postA = await findOrCreate(
    'posts',
    { and: [{ slug: { equals: 'hello' } }, { tenant: { equals: tenantA.id } }] },
    { title: 'Hello from A', slug: 'hello', publishAs: 'web', tenant: tenantA.id },
  )
  const postB = await findOrCreate(
    'posts',
    { and: [{ slug: { equals: 'hello' } }, { tenant: { equals: tenantB.id } }] },
    { title: 'Hello from B', slug: 'hello', publishAs: 'web', tenant: tenantB.id },
  )
  if (postA && postB && postA.id !== postB.id) {
    pass('Cross-tenant duplicate slug "hello" is allowed (both posts created)')
  } else {
    fail('Cross-tenant duplicate slug should be allowed')
  }

  // Same-tenant duplicate slug is rejected
  try {
    await payload.create({
      collection: 'posts',
      data: {
        title: 'Hello Again',
        slug: 'hello',
        publishAs: 'web',
        tenant: tenantA.id as number,
      },
      overrideAccess: true,
    })
    fail('Same-tenant duplicate slug should have been rejected but was not')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('already in use')) {
      pass('Same-tenant duplicate slug "hello" rejected with validation error')
    } else {
      fail(`Expected "already in use" error, got: ${msg}`)
    }
  }

  // -- CONT-02: emailStatus read-only for campaign managers --
  console.log('\n[CONT-02] emailStatus access control')

  // Create a post with publishAs: 'email'
  const emailPost = await findOrCreate(
    'posts',
    { and: [{ slug: { equals: 'email-post-smoke' } }, { tenant: { equals: tenantA.id } }] },
    {
      title: 'Email Post',
      slug: 'email-post-smoke',
      publishAs: 'email',
      emailSubject: 'Test Subject',
      emailStatus: 'draft',
      tenant: tenantA.id,
    },
  )

  // Campaign manager attempting to update emailStatus must be denied
  try {
    await payload.update({
      collection: 'posts',
      id: emailPost.id,
      data: { emailStatus: 'sent' } as Parameters<typeof payload.update>[0]['data'],
      overrideAccess: false,
      user: campaignManager,
    })
    // If update silently drops the field (due to access.update), check if it was actually changed
    const updated = await payload.findByID({ collection: 'posts', id: emailPost.id, overrideAccess: true })
    if ((updated as Record<string, unknown>).emailStatus === 'sent') {
      fail('Campaign manager should not be able to update emailStatus')
    } else {
      pass('Campaign manager cannot update emailStatus (field silently ignored by access control)')
    }
  } catch {
    pass('Campaign manager cannot update emailStatus (update throws access error)')
  }

  // Super-admin CAN update emailStatus
  try {
    const superAdmin = await findOrCreate(
      'users',
      { email: { equals: 'super-phase2@smoke.test' } },
      { email: 'super-phase2@smoke.test', password: 'Super2Smoke!1', role: 'super-admin' },
    )
    await payload.update({
      collection: 'posts',
      id: emailPost.id,
      data: { emailStatus: 'scheduled' } as Parameters<typeof payload.update>[0]['data'],
      overrideAccess: false,
      user: superAdmin,
    })
    const updated = await payload.findByID({ collection: 'posts', id: emailPost.id, overrideAccess: true })
    if ((updated as Record<string, unknown>).emailStatus === 'scheduled') {
      pass('Super-admin can update emailStatus')
    } else {
      fail('Super-admin emailStatus update did not persist')
    }
  } catch (err: unknown) {
    fail(`Super-admin should be able to update emailStatus: ${err instanceof Error ? err.message : String(err)}`)
  }

  // -- CONT-03: Pages + blocks --
  console.log('\n[CONT-03] Pages + blocks')
  skip('Pages collection not yet defined — will be tested after Plan 02')

  // -- CONF-01: SiteSettings one-per-tenant --
  console.log('\n[CONF-01] SiteSettings one-per-tenant')
  skip('SiteSettings collection not yet defined — will be tested after Plan 03')

  // -- CONF-02: REST API key auth --
  console.log('\n[CONF-02] REST API key auth')
  skip('REST API key auth requires running server — manual verification in Plan 03')

  // -- Results --
  console.log(`\n${'─'.repeat(50)}`)
  if (failures > 0) {
    console.error(`FAILED: ${failures} assertion(s) failed`)
    await payload.db.destroy?.()
    process.exit(1)
  } else {
    console.log('ALL ASSERTIONS PASSED')
    await payload.db.destroy?.()
    process.exit(0)
  }
}

main().catch(async (err) => {
  console.error('Smoke test crashed:', err)
  process.exit(1)
})
