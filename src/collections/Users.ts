import type { CollectionConfig } from 'payload'
import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'
import { APIError } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: { useAPIKey: true },
  access: {
    // Campaign managers can only read their own user record
    read: ({ req }) => {
      if (req.user?.role === 'super-admin') return true
      return { id: { equals: req.user?.id } }
    },
  },
  hooks: {
    // Block login for users whose tenant is suspended or archived.
    // Using afterOperation on 'login' because the resolved user is available there.
    afterOperation: [
      async ({ operation, result, req }) => {
        if (operation !== 'login') return result
        const user = (result as { user?: { id?: string | number; role?: string; tenants?: Array<{ tenant?: string | number | { id?: string | number; status?: string } }> } })?.user
        if (!user) return result
        // Super-admins are never blocked
        if (user.role === 'super-admin') return result

        // I1: Check ALL tenant assignments, not just [0].
        // Also handle unpopulated tenant relations (bare ID) by fetching status.
        const tenantEntries = user.tenants ?? []
        for (const entry of tenantEntries) {
          let status: string | undefined

          if (typeof entry.tenant === 'object' && entry.tenant !== null) {
            // Tenant relation is populated
            status = entry.tenant.status
          } else if (entry.tenant) {
            // Tenant is a bare ID — fetch to get status
            const tenantDoc = await req.payload.findByID({
              collection: 'tenants',
              id: entry.tenant,
              overrideAccess: true,
            })
            status = tenantDoc?.status as string | undefined
          }

          if (status === 'suspended') {
            throw new APIError(
              'Your account access has been suspended. Contact support.',
              403,
              undefined,
              true,
            )
          }
          if (status === 'archived') {
            throw new APIError(
              'This campaign account is no longer active.',
              403,
              undefined,
              true,
            )
          }
        }

        return result
      },
    ],
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'campaign-manager',
      options: [
        { label: 'Super Admin', value: 'super-admin' },
        { label: 'Campaign Manager', value: 'campaign-manager' },
      ],
      // Only super-admins can change the role field — no UI path for privilege escalation
      access: {
        update: ({ req }) => req.user?.role === 'super-admin',
      },
      admin: {
        description:
          'Super-admins have unrestricted access. Campaign managers are scoped to their tenant.',
      },
    },
    // tenantsArrayField MUST be at the top level of fields (not inside a named group or tab)
    // per plugin constraint — see research Pitfall 5
    tenantsArrayField({
      tenantsCollectionSlug: 'tenants',
    }),
  ],
}
