import { test } from '@playwright/test'

test.describe('Newsletter signup flow @smoke', () => {
  test.skip('/newsletter page renders email signup form', async ({ page }) => {
    // FRONT-05: dedicated newsletter page with email-only capture (step 1)
    // NOTE: CONTEXT.md specifies two-step flow (email first, then optional name+zip)
    // which supersedes REQUIREMENTS.md "name + email" single-step wording
  })

  test.skip('newsletter form shows success state on valid submission', async ({ page }) => {
    // FRONT-05: success feedback after email capture
  })

  test.skip('/newsletter/thank-you offers optional name and zip fields', async ({ page }) => {
    // FRONT-05: step 2 of two-step flow
  })

  test.skip('footer contains compact newsletter signup form', async ({ page }) => {
    // FRONT-05: multi-placement newsletter form
  })
})
