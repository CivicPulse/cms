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
  })
  .parse(process.env)
