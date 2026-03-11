import { z } from 'zod'

export const env = z
  .object({
    PAYLOAD_SECRET: z
      .string()
      .min(32, 'PAYLOAD_SECRET must be at least 32 characters'),
    DATABASE_URL: z
      .string()
      .min(1, 'DATABASE_URL is required — set it in .env.local'),
  })
  .parse(process.env)
