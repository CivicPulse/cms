import type { Payload } from 'payload'

/**
 * Field-level validate function for per-tenant slug uniqueness.
 *
 * IMPORTANT: Do NOT use `unique: true` on slug fields in tenant-scoped collections.
 * `unique: true` creates a global DB unique constraint — Tenant A and Tenant B
 * cannot share a slug value. This function enforces uniqueness only within the
 * same tenant, allowing cross-tenant slug reuse.
 *
 * Workaround for GitHub issue #14938 (open as of January 2026).
 */
export const ensureUniqueTenantSlug =
  (collectionSlug: 'posts' | 'pages') =>
  async (
    value: string | null | undefined,
    {
      data,
      req,
      id,
    }: {
      data: Record<string, unknown>
      req: { payload: Payload }
      id?: string | number | null
    },
  ): Promise<true | string> => {
    if (!value) return true // required validation handles the empty case
    const tenantId = data?.tenant
    if (!tenantId) return true // no tenant context yet (draft create edge case)

    // Cast needed because 'pages' collection may not exist yet (added in Plan 02).
    // At runtime the collection will exist; TypeScript's generated types lag behind.
    const existing = await req.payload.find({
      collection: collectionSlug as 'posts',
      where: {
        and: [
          { slug: { equals: value } },
          { tenant: { equals: tenantId as string } },
        ],
      },
      limit: 1,
      overrideAccess: true, // must bypass tenant filter to query from hook context
    })

    if (existing.docs.length > 0 && String(existing.docs[0].id) !== String(id)) {
      return `The slug "${value}" is already in use by another ${collectionSlug === 'posts' ? 'post' : 'page'} in this tenant. Choose a unique slug.`
    }
    return true
  }
