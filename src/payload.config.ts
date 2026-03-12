// env MUST be imported first — throws ZodError at startup if vars are missing
import { env } from './env'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { multiTenantPlugin } from '@payloadcms/plugin-multi-tenant'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Tenants } from './collections/Tenants'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
  },
  collections: [Users, Tenants, Posts, Pages, Media],
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
        posts: {},
        pages: {},
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
  ],
})
