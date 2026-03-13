import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import crypto from 'node:crypto'
import { env } from '@/env'

/**
 * POST /api/posts/{id}/email-status
 *
 * Called by run-api after successful (or failed) email delivery.
 * Updates emailStatus and emailSentAt on the post.
 *
 * Authentication: HMAC-SHA256 signature in x-webhook-signature header.
 * The signature is computed over the raw request body using WEBHOOK_SECRET.
 *
 * run-api must set:
 *   x-webhook-signature: hex digest of HMAC-SHA256(WEBHOOK_SECRET, raw body)
 *
 * Request body (JSON):
 *   { emailStatus: 'sent' | 'failed', emailSentAt?: string (ISO 8601), tenantId?: string }
 *
 * Response:
 *   200 { ok: true }
 *   400 { error: string } -- invalid JSON or missing emailStatus
 *   401 { error: 'Invalid signature' } -- HMAC mismatch
 *   403 { error: string } -- tenant ownership mismatch
 *   500 { error: string } -- unexpected error
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // Next.js 15: params is a Promise -- must await
  const { id } = await params

  // Read raw body for HMAC verification (must be read before JSON parsing)
  const rawBody = await req.text()
  const signature = req.headers.get('x-webhook-signature') ?? ''

  const payload = await getPayload({ config: configPromise })

  // HMAC verification -- use timingSafeEqual to prevent timing attacks (I4: use validated env)
  const secret = env.WEBHOOK_SECRET

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')

  let signatureValid = false
  try {
    signatureValid = crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expected, 'hex'),
    )
  } catch {
    // Buffer.from throws if signature is not valid hex or length mismatch
    signatureValid = false
  }

  // C5: Log failed HMAC attempts for security monitoring
  if (!signatureValid) {
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    payload.logger.warn(
      `HMAC verification failed for POST /api/posts/${id}/email-status from IP ${ip}`,
    )
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Parse body
  let body: { emailStatus?: string; emailSentAt?: string; tenantId?: string }
  try {
    body = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.emailStatus) {
    return NextResponse.json(
      { error: 'emailStatus is required' },
      { status: 400 },
    )
  }

  // Update the post using Local API with overrideAccess: true
  // This is a system-level callback -- access control is enforced by HMAC, not user context
  try {
    // C1: Verify tenant ownership before updating
    const post = await payload.findByID({
      collection: 'posts',
      id,
      overrideAccess: true,
    })

    // If tenantId is provided in the request body, verify it matches the post's tenant
    if (body.tenantId) {
      const postTenantId =
        typeof post.tenant === 'object' && post.tenant !== null
          ? post.tenant.id
          : post.tenant
      if (String(postTenantId) !== String(body.tenantId)) {
        payload.logger.warn(
          `Tenant mismatch on email-status update: post ${id} belongs to tenant ${postTenantId}, request claims tenant ${body.tenantId}`,
        )
        return NextResponse.json(
          { error: 'Post does not belong to the specified tenant' },
          { status: 403 },
        )
      }
    }

    const updateData: Record<string, unknown> = {
      emailStatus: body.emailStatus,
    }
    if (body.emailSentAt) {
      updateData.emailSentAt = body.emailSentAt
    }

    await payload.update({
      collection: 'posts',
      id,
      data: updateData,
      overrideAccess: true, // system update -- HMAC validates caller identity
      context: { skipWebhook: true }, // prevent afterChange hook from re-triggering webhook
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    // C4: Log detailed error server-side, return generic message to caller
    payload.logger.error(
      `email-status update failed for post ${id}: ${err instanceof Error ? err.message : String(err)}`,
    )
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
