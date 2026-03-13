import type { CollectionConfig } from 'payload'
import { ensureUniqueTenantSlug } from '../hooks/ensureUniqueTenantSlug'
import { HeroBlock } from './blocks/HeroBlock'
import { TextBlock } from './blocks/TextBlock'
import { IssuesBlock } from './blocks/IssuesBlock'
import { ContactBlock } from './blocks/ContactBlock'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    description: 'Static pages with block-based layout builder',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true, // index for query performance; NOT unique: true (see ensureUniqueTenantSlug)
      // DO NOT set unique: true — that creates a global DB unique constraint breaking
      // cross-tenant slug sharing. Per-tenant uniqueness enforced in validate.
      validate: ensureUniqueTenantSlug('pages'),
      admin: {
        description: 'URL path for this page (e.g. "about", "contact"). Must be unique within this tenant.',
      },
    },
    {
      name: 'layout',
      type: 'blocks',
      blocks: [HeroBlock, TextBlock, IssuesBlock, ContactBlock],
      admin: {
        description: 'Build the page layout by adding and arranging blocks',
      },
    },
  ],
}
