import type { CollectionConfig } from 'payload'

export const SiteSettings: CollectionConfig = {
  slug: 'site-settings',
  admin: {
    useAsTitle: 'candidateName',
    // Appears under 'Configuration' in the admin sidebar — separate from content collections
    group: 'Configuration',
    description: 'Site-wide settings for this campaign. One record per tenant.',
  },
  hooks: {
    beforeOperation: [
      async ({ args, operation, req }) => {
        if (operation !== 'create') return args

        const tenantId = args.data?.tenant
        if (!tenantId) return args

        // IMPORTANT: overrideAccess: true required — the request context during a create
        // operation may not yet have tenant scoping, so the multi-tenant plugin's filter
        // would return 0 results even when a document exists. See RESEARCH.md Pitfall 4.
        const existing = await req.payload.find({
          collection: 'site-settings',
          where: { tenant: { equals: tenantId } },
          limit: 1,
          overrideAccess: true,
        })

        if (existing.docs.length > 0) {
          throw new Error(
            'Site settings already exist for this tenant. Edit the existing record instead.',
          )
        }

        return args
      },
    ],
  },
  fields: [
    // -- Candidate Identity -------------------------------------------------------
    {
      name: 'candidateName',
      type: 'text',
      required: true,
      admin: { description: 'Full name as it appears on the campaign website' },
    },
    {
      name: 'officeRunningFor',
      type: 'text',
      admin: { description: 'e.g. "U.S. Senate -- Illinois" or "Mayor of Springfield"' },
    },
    {
      name: 'tagline',
      type: 'text',
      admin: { description: 'Short campaign slogan shown on the homepage' },
    },
    {
      name: 'bio',
      type: 'textarea',
      admin: { description: 'Candidate biography paragraph' },
    },
    // -- Visual Branding ----------------------------------------------------------
    {
      name: 'primaryColor',
      type: 'text',
      admin: {
        description:
          'Primary brand color as a hex value (e.g. #2563EB). Used for buttons, accents, and highlights.',
      },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Campaign logo image' },
    },
    {
      name: 'candidatePhoto',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Candidate headshot or featured photo' },
    },
    // -- Links + Contact ----------------------------------------------------------
    {
      name: 'twitterUrl',
      type: 'text',
      admin: { description: 'Full Twitter/X profile URL' },
    },
    {
      name: 'facebookUrl',
      type: 'text',
      admin: { description: 'Full Facebook page URL' },
    },
    {
      name: 'instagramUrl',
      type: 'text',
      admin: { description: 'Full Instagram profile URL' },
    },
    {
      name: 'contactEmail',
      type: 'email',
      admin: { description: 'Public contact email displayed on the website' },
    },
    {
      name: 'donationUrl',
      type: 'text',
      admin: { description: 'External donation page URL (e.g. ActBlue link)' },
    },
    // -- Navigation ---------------------------------------------------------------
    {
      name: 'navItems',
      type: 'array',
      admin: {
        description:
          'Navigation menu items. External URLs (starting with http) open in a new tab.',
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: { description: 'Link text (e.g. "About", "Donate")' },
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          admin: {
            description:
              'URL path (/about) or external URL (https://actblue.com/...)',
          },
        },
      ],
    },
    // -- Template + Display -------------------------------------------------------
    {
      name: 'activeTemplateKey',
      type: 'select',
      required: true,
      defaultValue: 'classic',
      options: [
        { label: 'Classic', value: 'classic' },
        { label: 'Modern', value: 'modern' },
        { label: 'Bold', value: 'bold' },
      ],
      admin: {
        description:
          'Choose the visual template for this campaign website. Switching templates does not affect content.',
      },
    },
  ],
}
