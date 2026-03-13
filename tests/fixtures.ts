import { getPayload, type Payload } from 'payload'
import configPromise from '../src/payload.config'

/**
 * Get a Payload instance for test setup/teardown.
 * Uses the same config as the running dev server.
 */
export async function getTestPayload(): Promise<Payload> {
  const payload = await getPayload({ config: configPromise })
  return payload
}

/**
 * Seed a tenant for testing.
 * Creates a tenant with the given slug (default: 'test-campaign').
 */
export async function seedTestTenant(
  payload: Payload,
  slug: string = 'test-campaign',
) {
  const tenant = await payload.create({
    collection: 'tenants',
    data: {
      displayName: 'Test Campaign',
      slug,
      domain: `${slug}.campaigns.civpulse.com`,
      status: 'active',
    },
    overrideAccess: true,
  })
  return tenant
}

/**
 * Seed site settings for a tenant.
 * Creates a site-settings document with sample campaign data.
 */
export async function seedSiteSettings(
  payload: Payload,
  tenantId: string | number,
) {
  const settings = await payload.create({
    collection: 'site-settings',
    data: {
      // tenant field is injected by the multi-tenant plugin at runtime
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tenant: tenantId as any,
      candidateName: 'Jane Smith',
      officeRunningFor: 'City Council',
      tagline: 'Building a better community',
      primaryColor: '#2563eb',
      activeTemplateKey: 'modern',
      bio: 'Jane is running for office.',
      contactEmail: 'jane@example.com',
    },
    overrideAccess: true,
  })
  return settings
}

/**
 * Seed a published post for a tenant.
 * Creates a post with default values, merging any provided overrides.
 */
export async function seedPost(
  payload: Payload,
  tenantId: string | number,
  overrides: Record<string, unknown> = {},
) {
  const postData = {
    // tenant field is injected by the multi-tenant plugin at runtime
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tenant: tenantId as any,
    title: 'Test Post',
    slug: 'test-post',
    content: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [{ type: 'text', text: 'This is a test post.' }],
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      },
    },
    publishAs: 'web',
    ...overrides,
  }

  // Create directly as published by including _status: 'published' in data
  // With Payload v3 drafts, setting _status in data during create publishes directly.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const post = await payload.create({
    collection: 'posts',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { ...postData, _status: 'published' } as any,
    overrideAccess: true,
  })

  return post
}

/**
 * Clean up all test data for a given tenant.
 * Deletes posts, pages, site-settings, then the tenant itself.
 * Wrapped in try/catch to avoid test failures on cleanup.
 */
export async function cleanupTestData(
  payload: Payload,
  tenantId: string | number,
) {
  try {
    // Delete posts for this tenant
    await payload.delete({
      collection: 'posts',
      where: { tenant: { equals: tenantId } },
      overrideAccess: true,
    })
  } catch {
    // Ignore cleanup errors
  }

  try {
    // Delete pages for this tenant
    await payload.delete({
      collection: 'pages',
      where: { tenant: { equals: tenantId } },
      overrideAccess: true,
    })
  } catch {
    // Ignore cleanup errors
  }

  try {
    // Delete site-settings for this tenant
    await payload.delete({
      collection: 'site-settings',
      where: { tenant: { equals: tenantId } },
      overrideAccess: true,
    })
  } catch {
    // Ignore cleanup errors
  }

  try {
    // Delete the tenant — use hard delete to avoid accumulating archived test records
    await payload.delete({
      collection: 'tenants',
      id: tenantId,
      overrideAccess: true,
    })
  } catch {
    // Fallback: archive if hard delete fails (e.g. foreign key constraints)
    try {
      await payload.update({
        collection: 'tenants',
        id: tenantId,
        data: { status: 'archived' },
        overrideAccess: true,
      })
    } catch {
      // Ignore cleanup errors
    }
  }
}
