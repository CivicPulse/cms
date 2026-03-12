import type { Block } from 'payload'

export const IssuesBlock: Block = {
  slug: 'issues',
  labels: { singular: 'Issues', plural: 'Issues' },
  fields: [
    {
      name: 'items',
      type: 'array',
      admin: { description: 'Campaign issues or policy positions' },
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          admin: { description: 'Issue or policy title' },
        },
        {
          name: 'description',
          type: 'text',
          // Deliberately plain text (not richText) — Phase 3 templates style
          // each issue card consistently without cleaning up arbitrary HTML
          admin: { description: 'Short plain-text description (no formatting)' },
        },
      ],
    },
  ],
}
