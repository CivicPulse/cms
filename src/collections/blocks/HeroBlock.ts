import type { Block } from 'payload'

export const HeroBlock: Block = {
  slug: 'hero',
  labels: { singular: 'Hero', plural: 'Heroes' },
  fields: [
    {
      name: 'headline',
      type: 'text',
      required: true,
      admin: { description: 'Main heading displayed in the hero section' },
    },
    {
      name: 'subheadline',
      type: 'text',
      admin: { description: 'Supporting text below the headline' },
    },
    {
      name: 'backgroundImage',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Optional background image' },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      admin: { description: 'Call-to-action button text (e.g. "Learn More")' },
    },
    {
      name: 'ctaUrl',
      type: 'text',
      admin: { description: 'URL the CTA button links to' },
    },
  ],
}
