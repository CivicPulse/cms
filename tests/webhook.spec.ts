import { test, expect } from '@playwright/test'
import * as http from 'node:http'
import * as crypto from 'node:crypto'
import { getTestPayload, seedTestTenant, seedSiteSettings, cleanupTestData } from './fixtures'

/**
 * Webhook pipeline tests.
 *
 * These tests spin up a local HTTP server on port 4000 to receive webhook
 * calls fired by the Payload afterChange hook when a post is published.
 * The .env.local sets RUN_API_WEBHOOK_URL=http://localhost:4000/...
 *
 * Test flow:
 *  1. Start local HTTP server on port 4000 (before tests)
 *  2. Seed tenant + site settings
 *  3. Publish a post via Payload REST API (authenticated as super-admin)
 *  4. Assert webhook received on the local server with correct HMAC and payload
 *  5. Cleanup tenant + posts
 */

const WEBHOOK_PORT = 4000
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? 'civpulse-webhook-secret-local-dev-do-not-use-in-production'
const WEBHOOK_PATH = '/api/v1/webhooks/payload/post-published'

interface WebhookCapture {
  body: string
  signature: string
  parsedBody?: Record<string, unknown>
}

function startWebhookServer(): {
  server: http.Server
  waitForWebhook: (timeoutMs?: number) => Promise<WebhookCapture>
} {
  let resolveWebhook: ((capture: WebhookCapture) => void) | null = null
  let rejectWebhook: ((err: Error) => void) | null = null

  const server = http.createServer((req, res) => {
    let body = ''
    req.on('data', (chunk) => { body += chunk.toString() })
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true }))

      const signature = req.headers['x-webhook-signature'] as string ?? ''
      const capture: WebhookCapture = { body, signature }
      try {
        capture.parsedBody = JSON.parse(body)
      } catch {
        // ignore parse error
      }
      if (resolveWebhook) {
        resolveWebhook(capture)
        resolveWebhook = null
        rejectWebhook = null
      }
    })
  })

  const waitForWebhook = (timeoutMs = 10_000): Promise<WebhookCapture> => {
    return new Promise((resolve, reject) => {
      resolveWebhook = resolve
      rejectWebhook = reject
      setTimeout(() => {
        if (rejectWebhook) {
          rejectWebhook(new Error(`Webhook not received within ${timeoutMs}ms`))
          resolveWebhook = null
          rejectWebhook = null
        }
      }, timeoutMs)
    })
  }

  return { server, waitForWebhook }
}

function computeHmac(secret: string, body: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}

test.describe('Webhook pipeline @smoke', () => {
  let tenantId: string | number
  const tenantSlug = `webhook-test-${Date.now()}`

  test.beforeAll(async () => {
    const payload = await getTestPayload()
    const tenant = await seedTestTenant(payload, tenantSlug)
    tenantId = tenant.id
    await seedSiteSettings(payload, tenantId)
  })

  test.afterAll(async () => {
    const payload = await getTestPayload()
    await cleanupTestData(payload, tenantId)
  })

  test('publishing a post with publishAs email fires HMAC-signed webhook', async ({ request }) => {
    // HOOK-01: afterChange hook fires webhook on publish transition
    const { server, waitForWebhook } = startWebhookServer()
    await new Promise<void>((resolve, reject) => {
      server.listen(WEBHOOK_PORT, '0.0.0.0', () => resolve())
      server.on('error', reject)
    })

    const webhookPromise = waitForWebhook(12_000)

    try {
      // Authenticate: get a token from Payload REST API using seed admin
      // We use the Local API directly via fixtures for this
      const payload = await getTestPayload()
      await payload.create({
        collection: 'posts',
        data: {
          tenant: tenantId as never,
          title: 'Email Webhook Test Post',
          slug: `email-webhook-test-${Date.now()}`,
          publishAs: 'email',
          _status: 'published',
        } as never,
        overrideAccess: true,
      })

      const capture = await webhookPromise
      expect(capture.body).toBeTruthy()
      expect(capture.signature).toBeTruthy()

      // Verify HMAC signature is valid
      const expected = computeHmac(WEBHOOK_SECRET, capture.body)
      expect(capture.signature).toBe(expected)
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  test('webhook payload contains postId, tenantId, and publishAs', async () => {
    // HOOK-02: payload shape validation
    const { server, waitForWebhook } = startWebhookServer()
    await new Promise<void>((resolve, reject) => {
      server.listen(WEBHOOK_PORT, '0.0.0.0', () => resolve())
      server.on('error', reject)
    })

    const webhookPromise = waitForWebhook(12_000)

    try {
      const payload = await getTestPayload()
      const post = await payload.create({
        collection: 'posts',
        data: {
          tenant: tenantId as never,
          title: 'Payload Shape Test Post',
          slug: `payload-shape-test-${Date.now()}`,
          publishAs: 'both',
          _status: 'published',
        } as never,
        overrideAccess: true,
      })

      const capture = await webhookPromise
      expect(capture.parsedBody).toBeDefined()
      const body = capture.parsedBody!

      expect(body.postId).toBeDefined()
      expect(String(body.postId)).toBe(String(post.id))
      expect(body.tenantId).toBeDefined()
      expect(String(body.tenantId)).toBe(String(tenantId))
      expect(body.publishAs).toBe('both')
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })

  test('email-status callback does not re-trigger webhook', async ({ request }) => {
    // HOOK-03: skipWebhook context prevents infinite loop
    // Verify: calling the email-status route does NOT cause another webhook call
    const { server, waitForWebhook } = startWebhookServer()
    await new Promise<void>((resolve, reject) => {
      server.listen(WEBHOOK_PORT, '0.0.0.0', () => resolve())
      server.on('error', reject)
    })

    let webhookCallCount = 0
    // Override to count calls instead of resolving once
    const callPromise = new Promise<void>((resolve) => {
      const originalHandler = server.listeners('request')[0] as http.RequestListener
      server.removeAllListeners('request')
      server.on('request', (req, res) => {
        webhookCallCount++
        originalHandler(req, res)
        if (webhookCallCount === 1) {
          // T7: Reduced from 3s to 1s — just enough to detect a spurious second call
          setTimeout(resolve, 1000)
        }
      })
    })

    const firstWebhookPromise = waitForWebhook(12_000)

    try {
      const payload = await getTestPayload()

      // Create and publish a post (this should fire exactly 1 webhook)
      const post = await payload.create({
        collection: 'posts',
        data: {
          tenant: tenantId as never,
          title: 'Skip Webhook Test Post',
          slug: `skip-webhook-test-${Date.now()}`,
          publishAs: 'email',
          _status: 'published',
        } as never,
        overrideAccess: true,
      })

      // Wait for the first webhook
      await firstWebhookPromise

      // T2: Serialize body once and compute HMAC over the exact same string
      // (previously called new Date().toISOString() twice, producing different timestamps)
      const statusBodyObj = { emailStatus: 'sent', emailSentAt: new Date().toISOString() }
      const statusBodyStr = JSON.stringify(statusBodyObj)
      const secret = WEBHOOK_SECRET
      const sig = computeHmac(secret, statusBodyStr)

      // Call the email-status route — should update the post WITHOUT re-triggering webhook
      const statusResponse = await request.post(`http://localhost:3000/api/posts/${post.id}/email-status`, {
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-signature': sig,
        },
        data: statusBodyStr,
      })

      // Allow time for any additional webhook to arrive
      // T7: Reduced from 3s to 1s to avoid CI timeout pressure
      await callPromise.catch(() => {})
      await new Promise<void>((resolve) => setTimeout(resolve, 1000))

      expect(statusResponse.ok()).toBe(true)
      // Webhook should have been fired exactly once (for the publish), not again for the email-status update
      expect(webhookCallCount).toBe(1)
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()))
    }
  })
})
