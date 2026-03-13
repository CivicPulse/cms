import { z } from 'zod'

export const env = z
  .object({
    PAYLOAD_SECRET: z
      .string()
      .min(32, 'PAYLOAD_SECRET must be at least 32 characters'),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required — set it in .env.local'),
    // R2 storage (required for Media collection uploads)
    R2_ENDPOINT: z
      .string()
      .min(1, 'R2_ENDPOINT is required — format: {accountid}.r2.cloudflarestorage.com (no https://)'),
    R2_BUCKET: z
      .string()
      .min(1, 'R2_BUCKET is required — Cloudflare R2 bucket name'),
    R2_ACCESS_KEY_ID: z
      .string()
      .min(1, 'R2_ACCESS_KEY_ID is required — R2 API token access key'),
    R2_SECRET_ACCESS_KEY: z
      .string()
      .min(1, 'R2_SECRET_ACCESS_KEY is required — R2 API token secret'),
    R2_PUBLIC_URL: z
      .string()
      .url('R2_PUBLIC_URL must be a valid URL — e.g. https://media.example.com or https://pub-{hash}.r2.dev'),
    // Webhook signing (required for email callback endpoint)
    WEBHOOK_SECRET: z
      .string()
      .min(32, 'WEBHOOK_SECRET must be at least 32 characters — used for HMAC signing with run-api'),
    // Webhook target URL for post-published events (e.g. https://api.civpulse.com/api/v1/webhooks/payload/post-published)
    RUN_API_WEBHOOK_URL: z
      .string()
      .min(1, 'RUN_API_WEBHOOK_URL is required — target URL for post-published webhook'),
    // Base URL for run-api (e.g. https://api.civpulse.com)
    RUN_API_BASE_URL: z
      .string()
      .url('RUN_API_BASE_URL must be a valid URL — e.g. https://api.civpulse.com'),
    // Base domain for subdomain extraction (e.g. campaigns.civpulse.com)
    SITE_DOMAIN: z
      .string()
      .min(1, 'SITE_DOMAIN is required — base domain for subdomain extraction'),
  })
  .parse(process.env)
