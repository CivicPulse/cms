import { test, expect } from '@playwright/test'
import { getTestPayload, seedTestTenant, seedSiteSettings, cleanupTestData } from './fixtures'

/**
 * Newsletter signup flow tests (FRONT-05).
 *
 * Two-step flow per CONTEXT.md:
 *   Step 1: /newsletter — email-only capture form
 *   Step 2: /newsletter/thank-you — optional name + zip fields
 *
 * Tests verify form rendering and UI behavior only.
 * The actual run-api POST is not tested here (external service).
 */

test.describe('Newsletter signup flow @smoke', () => {
  let tenantId: string | number
  const tenantSlug = `newsletter-test-${Date.now()}`

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

  test('/newsletter page renders email signup form', async ({ page }) => {
    // FRONT-05: dedicated newsletter page with email-only capture (step 1 of two-step flow)
    await page.goto(`http://${tenantSlug}.localhost:3000/newsletter`)
    await page.waitForLoadState('networkidle')

    // Page should have a heading for the signup
    const pageText = await page.textContent('body')
    expect(pageText).toContain('Stay Connected')

    // Email input field must be present in main content area (not just the footer)
    const mainEmailInput = page.locator('main input[type="email"]')
    await expect(mainEmailInput.first()).toBeVisible()

    // Submit button must be present in main content area
    const mainSubmitButton = page.locator('main button[type="submit"]')
    await expect(mainSubmitButton.first()).toBeVisible()

    // Should NOT have name or zip code fields on step 1 (email only)
    // The name/zip fields belong to the thank-you page (step 2), not step 1
    const nameInput = page.locator('main input#name, main input[name="name"]')
    await expect(nameInput).toHaveCount(0)
  })

  test('/newsletter/thank-you offers optional name and zip fields', async ({ page }) => {
    // FRONT-05: step 2 of two-step flow — optional profile enrichment
    // Navigate to thank-you page with required email search param
    await page.goto(
      `http://${tenantSlug}.localhost:3000/newsletter/thank-you?email=test%40example.com&campaignId=1`,
    )
    await page.waitForLoadState('networkidle')

    // Thank-you heading
    const pageText = await page.textContent('body')
    expect(pageText).toContain('Thank you for subscribing')

    // Name field
    const nameInput = page.locator('input#name, input[name="name"]')
    await expect(nameInput.first()).toBeVisible()

    // Zip code field
    const zipInput = page.locator('input#zipCode, input[name="zipCode"]')
    await expect(zipInput.first()).toBeVisible()

    // Skip button
    const skipButton = page.locator('button:has-text("Skip")')
    await expect(skipButton).toBeVisible()
  })
})
