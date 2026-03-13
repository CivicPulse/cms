import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    description: 'Images and media files for campaign websites',
  },
  // Public read — frontend templates need to render images without authentication
  access: {
    read: () => true,
  },
  upload: {
    // Image-only — no raw video uploads in v1
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
    // Single thumbnail size for admin panel preview performance
    // S3 storage adapter automatically uploads all imageSizes to R2
    imageSizes: [
      {
        name: 'thumbnail',
        width: 300,
        height: 200,
        crop: 'centre',
      },
    ],
  },
  // DO NOT add disableLocalStorage: true here — @payloadcms/storage-s3 sets it automatically
  // DO NOT add s3 config here — s3Storage plugin is registered in payload.config.ts
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: 'Accessibility alt text for this image',
      },
    },
  ],
}
