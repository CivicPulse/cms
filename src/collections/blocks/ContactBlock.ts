import type { Block } from 'payload'

export const ContactBlock: Block = {
  slug: 'contact',
  labels: { singular: 'Contact', plural: 'Contact Blocks' },
  fields: [
    {
      name: 'contactEmail',
      type: 'text',
      admin: { description: 'Contact email (defaults to site-settings contact email if left blank)' },
    },
    {
      name: 'officeAddress',
      type: 'textarea',
      admin: { description: 'Campaign office address' },
    },
    {
      name: 'phoneNumber',
      type: 'text',
      admin: { description: 'Campaign office phone number' },
    },
    {
      name: 'showNewsletterForm',
      type: 'checkbox',
      defaultValue: false,
      admin: { description: 'Show newsletter signup form in this contact section' },
    },
  ],
}
