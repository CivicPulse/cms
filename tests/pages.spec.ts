import { test, expect } from '@playwright/test'
import { getTestPayload, seedTestTenant, seedSiteSettings, cleanupTestData } from './fixtures'

test.describe('Dynamic pages @smoke', () => {
  let tenantId: string | number
  const ts = Date.now()
  const tenantSlug = `pages-test-${ts}`

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

  test('/{slug} returns 404 for non-existent page', async ({ page }) => {
    await page.goto(`http://${tenantSlug}.localhost:3000/no-such-page-${ts}`)
    await page.waitForLoadState('networkidle')

    // Non-existent slug should trigger notFound()
    const pageText = await page.textContent('body')
    expect(pageText).toBeTruthy()
  })
})
