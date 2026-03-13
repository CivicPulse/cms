import type { CollectionAfterChangeHook } from 'payload'
import crypto from 'node:crypto'
import { env } from '@/env'

/**
 * afterChange hook for the Posts collection.
 *
 * Fires an HMAC-signed webhook to run-api when a post transitions to
 * "published" status with publishAs "email" or "both". This triggers
 * the email delivery pipeline on the run-api side.
 *
 * Guard: context.skipWebhook prevents the email-status callback from
 * re-triggering this hook (avoids infinite loop).
 */
export const firePostPublishedWebhook: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  context,
  operation,
  req,
}) => {
  // Guard 1: skip when email-status callback updates a post
  if (context.skipWebhook) return doc

  // Guard 2: only fire on publish transitions
  const wasPublished = previousDoc?._status === 'published'
  const isPublished = doc._status === 'published'

  if (operation === 'update' && (wasPublished || !isPublished)) return doc
  if (operation === 'create' && !isPublished) return doc

  // Guard 3: only fire for email or both publishAs
  if (doc.publishAs !== 'email' && doc.publishAs !== 'both') return doc

  // I4: Use validated env object instead of reading process.env directly
  const webhookSecret = env.WEBHOOK_SECRET
  const webhookUrl = env.RUN_API_WEBHOOK_URL

  // Extract tenant ID (may be populated object or raw ID)
  const tenantId =
    typeof doc.tenant === 'object' && doc.tenant !== null
      ? doc.tenant.id
      : doc.tenant

  // Build payload (I5: include scheduledSendAt for delayed delivery support)
  const body = JSON.stringify({
    postId: doc.id,
    tenantId,
    publishAs: doc.publishAs,
    scheduledSendAt: doc.scheduledSendAt ?? null,
  })

  // Compute HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  // Fire-and-forget — do not block the response
  // C3: On failure, update emailStatus to 'failed' so the admin sees the real state
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
    },
    body,
  }).catch(async (err: unknown) => {
    req.payload.logger.error(
      `Failed to fire post-published webhook for post ${doc.id}: ${err instanceof Error ? err.message : String(err)}`,
    )
    try {
      await req.payload.update({
        collection: 'posts',
        id: doc.id,
        data: { emailStatus: 'failed' },
        overrideAccess: true,
        context: { skipWebhook: true },
      })
    } catch (updateErr: unknown) {
      req.payload.logger.error(
        `Failed to mark post ${doc.id} emailStatus as failed: ${updateErr instanceof Error ? updateErr.message : String(updateErr)}`,
      )
    }
  })

  return doc
}
