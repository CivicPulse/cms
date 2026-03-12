import type { CollectionAfterChangeHook } from 'payload'
import crypto from 'node:crypto'

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

  // Guard 2: env vars must be set
  const webhookSecret = process.env.WEBHOOK_SECRET
  if (!webhookSecret) {
    req.payload.logger.error(
      'WEBHOOK_SECRET not set -- skipping post-published webhook',
    )
    return doc
  }

  const webhookUrl = process.env.RUN_API_WEBHOOK_URL
  if (!webhookUrl) {
    req.payload.logger.error(
      'RUN_API_WEBHOOK_URL not set -- skipping post-published webhook',
    )
    return doc
  }

  // Guard 3: only fire on publish transitions
  const wasPublished = previousDoc?._status === 'published'
  const isPublished = doc._status === 'published'

  if (operation === 'update' && (wasPublished || !isPublished)) return doc
  if (operation === 'create' && !isPublished) return doc

  // Guard 4: only fire for email or both publishAs
  if (doc.publishAs !== 'email' && doc.publishAs !== 'both') return doc

  // Extract tenant ID (may be populated object or raw ID)
  const tenantId =
    typeof doc.tenant === 'object' && doc.tenant !== null
      ? doc.tenant.id
      : doc.tenant

  // Build payload
  const body = JSON.stringify({
    postId: doc.id,
    tenantId,
    publishAs: doc.publishAs,
  })

  // Compute HMAC-SHA256 signature
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  // Fire-and-forget — do not block the response
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature,
    },
    body,
  }).catch((err: unknown) => {
    req.payload.logger.error(
      `Failed to fire post-published webhook: ${err instanceof Error ? err.message : String(err)}`,
    )
  })

  return doc
}
