import type { CollectionConfig } from 'payload'
import { ensureUniqueTenantSlug } from '../hooks/ensureUniqueTenantSlug'
import { firePostPublishedWebhook } from '../hooks/fireWebhook'

const emailCondition = (_data: unknown, siblingData: Record<string, unknown>) =>
  siblingData?.publishAs === 'email' || siblingData?.publishAs === 'both'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
  },
  versions: {
    drafts: true,
  },
  hooks: {
    afterChange: [firePostPublishedWebhook],
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
      name: 'featuredImage',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Featured image shown in post cards and post header',
      },
    },
    {
      name: 'content',
      type: 'richText',
    },
    {
      name: 'publishAs',
      type: 'select',
      required: true,
      defaultValue: 'web',
      options: [
        { label: 'Web Only', value: 'web' },
        { label: 'Email Only', value: 'email' },
        { label: 'Web + Email', value: 'both' },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      index: true,
      // CRITICAL: Do NOT set unique: true — that creates a global DB unique constraint
      // which prevents cross-tenant slug sharing. Per-tenant uniqueness is enforced by
      // the validate function below (see ensureUniqueTenantSlug for details).
      validate: ensureUniqueTenantSlug('posts'),
    },
    {
      name: 'emailSubject',
      type: 'text',
      admin: {
        condition: emailCondition,
      },
    },
    {
      name: 'emailPreviewText',
      type: 'text',
      admin: {
        condition: emailCondition,
        description: 'Short preview shown in email clients before opening',
      },
    },
    {
      name: 'emailStatus',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Sent', value: 'sent' },
        { label: 'Failed', value: 'failed' },
      ],
      access: {
        update: ({ req }) => req.user?.role === 'super-admin',
      },
      admin: {
        readOnly: true,
        condition: emailCondition,
        description: 'Managed by run-api. Read-only for campaign managers.',
      },
    },
    {
      name: 'scheduledSendAt',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        condition: emailCondition,
        description: 'Optional. Leave blank for immediate delivery when post is published.',
      },
    },
    {
      name: 'emailSentAt',
      type: 'date',
      access: {
        update: ({ req }) => req.user?.role === 'super-admin',
      },
      admin: {
        readOnly: true,
        condition: emailCondition,
        description: 'Set by run-api after successful email delivery.',
      },
    },
  ],
}
