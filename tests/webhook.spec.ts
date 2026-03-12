import { test } from '@playwright/test'

test.describe('Webhook pipeline @smoke', () => {
  test.skip('publishing a post with publishAs email fires HMAC-signed webhook', async ({ page }) => {
    // HOOK-01: afterChange hook fires webhook on publish transition
  })

  test.skip('webhook payload contains postId, tenantId, and publishAs', async ({ page }) => {
    // HOOK-02: payload shape validation
  })

  test.skip('email-status callback does not re-trigger webhook', async ({ page }) => {
    // HOOK-03: skipWebhook context prevents infinite loop
  })
})
