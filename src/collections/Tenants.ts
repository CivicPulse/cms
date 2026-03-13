import type { CollectionConfig } from 'payload'

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  admin: {
    useAsTitle: 'displayName',
  },
  access: {
    // Only super-admins can create or update tenants
    create: ({ req }) => req.user?.role === 'super-admin',
    update: ({ req }) => req.user?.role === 'super-admin',
    // Deletion is blocked entirely — use status: 'archived' as soft-delete.
    // This also avoids the cleanupAfterTenantDelete Postgres transaction crash (GitHub #14576).
    delete: () => false,
    // Plugin requires read access on the tenants collection for tenant resolution
    read: () => true,
  },
  fields: [
    {
      name: 'displayName',
      type: 'text',
      required: true,
      admin: {
        description: 'Human-readable name, e.g. Jones for City Council',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-safe identifier, e.g. jones-for-council',
      },
    },
    {
      name: 'domain',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description:
          'Full hostname, e.g. jones-for-council.campaigns.civpulse.com — must be unique across all tenants',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        {
          label: 'Suspended',
          value: 'suspended',
          // Suspended: admin login blocked; public site continues to serve
        },
        {
          label: 'Archived',
          value: 'archived',
          // Archived: admin login blocked; public site returns 404 (Phase 3 scope)
        },
      ],
      admin: {
        description:
          'Suspended: campaign manager admin access blocked, public site stays up. Archived: admin blocked + public site returns 404 (handled in Phase 3).',
      },
    },
  ],
}
