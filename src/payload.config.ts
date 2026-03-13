// env MUST be imported first — throws ZodError at startup if vars are missing
import { env } from './env'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { s3Storage } from '@payloadcms/storage-s3'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { SiteSettings } from './collections/SiteSettings'
import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Tenants, Posts, Pages, Media, SiteSettings],
  editor: lexicalEditor(),
  secret: env.PAYLOAD_SECRET,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URL,
    },
    // push: true auto-applies schema changes at startup — NEVER use in production.
    // Only enable in development; always use payload migrate:create + payload migrate otherwise.
    push: process.env.NODE_ENV === 'development',
    migrationDir: './src/migrations',
  }),
  plugins: [
    multiTenantPlugin({
      collections: {
        // Posts is registered here to prove tenant isolation in Phase 1.
        // Pages added in Phase 2 Plan 02 for tenant-scoped page management.
        // Media and SiteSettings added in Phase 2 Plan 03 for tenant-scoped assets and config.
        posts: {},
        pages: {},
        media: {},
        'site-settings': {},
      },
      tenantsSlug: 'tenants',
      // REQUIRED: cleanupAfterTenantDelete: true triggers a Postgres transaction
      // abort bug (GitHub #14576, open as of November 2025). Always false for this project.
      cleanupAfterTenantDelete: false,
      // tenantsArrayField is manually defined in src/collections/Users.ts at the top level.
      // Setting includeDefaultField: false prevents the plugin from adding a duplicate.
      tenantsArrayField: {
        includeDefaultField: false,
      },
      // Super-admins (role === 'super-admin') see the tenant selector in admin UI.
      // Campaign managers see no selector — they're scoped to their single tenant.
      userHasAccessToAllTenants: (user) =>
        (user as { role?: string })?.role === 'super-admin',
    }),
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
          generateFileURL: ({ filename, prefix }) =>
            `${env.R2_PUBLIC_URL}/${prefix}/${filename}`,
        },
      },
      bucket: env.R2_BUCKET,
      config: {
        // env.R2_ENDPOINT stores domain only (no https://) -- prepend protocol here
        endpoint: `https://${env.R2_ENDPOINT}`,
        credentials: {
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        },
        region: 'auto', // R2-specific: not a real AWS region
        forcePathStyle: true, // Required for R2 S3-compatible API
      },
    }),
  ],
})
