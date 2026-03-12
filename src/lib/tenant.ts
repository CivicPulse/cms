// Stub -- full implementation in Task 2
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Tenant, SiteSetting, Post, Page } from '@/payload-types'

export async function getTenantBySlug(): Promise<Tenant | null> {
  const headersList = await headers()
  const slug = headersList.get('x-tenant-slug')
  if (!slug) return null

  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'tenants',
    where: { slug: { equals: slug } },
    limit: 1,
    overrideAccess: true,
  })

  return result.docs[0] ?? null
}

export async function getSiteSettings(tenantId: string | number): Promise<SiteSetting | null> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'site-settings',
    where: { tenant: { equals: tenantId } },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })

  return result.docs[0] ?? null
}

export async function getPublishedPosts(
  tenantId: string | number,
  options?: { page?: number; limit?: number },
) {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    where: {
      tenant: { equals: tenantId },
      _status: { equals: 'published' },
      publishAs: { in: ['web', 'both'] },
    },
    sort: '-createdAt',
    page: options?.page ?? 1,
    limit: options?.limit ?? 9,
    depth: 2,
    overrideAccess: true,
  })

  return result
}

export async function getPostBySlug(
  tenantId: string | number,
  slug: string,
): Promise<Post | null> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    where: {
      tenant: { equals: tenantId },
      slug: { equals: slug },
      _status: { equals: 'published' },
      publishAs: { in: ['web', 'both'] },
    },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })

  return result.docs[0] ?? null
}

export async function getPageBySlug(
  tenantId: string | number,
  slug: string,
): Promise<Page | null> {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'pages',
    where: {
      tenant: { equals: tenantId },
      slug: { equals: slug },
    },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  })

  return result.docs[0] ?? null
}
