import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ['dev.tailb56d83.ts.net'],
}

export default withPayload(nextConfig)
