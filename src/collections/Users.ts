import type { CollectionConfig } from 'payload'
import { tenantsArrayField } from '@payloadcms/plugin-multi-tenant/fields'
import { APIError } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
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
      async ({ operation, result }) => {
        if (operation !== 'login') return result
        const user = (result as { user?: { role?: string; tenants?: Array<{ tenant?: { status?: string } }> } })?.user
        if (!user) return result
        // Super-admins are never blocked
        if (user.role === 'super-admin') return result
        // Check the first tenant assignment (campaign managers belong to one tenant)
        const tenantStatus = user.tenants?.[0]?.tenant?.status
        if (tenantStatus === 'suspended') {
          throw new APIError(
            'Your account access has been suspended. Contact support.',
            403,
            undefined,
            true,
          )
        }
        if (tenantStatus === 'archived') {
          throw new APIError(
            'This campaign account is no longer active.',
            403,
            undefined,
            true,
          )
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
