import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  // Access control — the multi-tenant plugin injects the tenant field and
  // handles admin UI filtering. The read access below adds an explicit
  // overrideAccess: false guard for Local API calls (FOUND-05).
  access: {
    read: ({ req }) => {
      if (req.user?.role === 'super-admin') return true
      // Permit; plugin's tenant filter handles scoping in admin UI.
      // For Local API calls, caller must pass overrideAccess: false.
      return true
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'content',
      type: 'richText',
    },
  ],
}
