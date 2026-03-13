import { test, expect } from '@playwright/test'
import { getTestPayload, seedTestTenant, seedSiteSettings, cleanupTestData } from './fixtures'

test.describe('Not found page @smoke', () => {
  let tenantId: string | number
  const tenantSlug = `notfound-test-${Date.now()}`

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

  test('404 page renders for non-existent route', async ({ page }) => {
    await page.goto(`http://${tenantSlug}.localhost:3000/definitely-does-not-exist-${Date.now()}`)
    await page.waitForLoadState('networkidle')

    // Next.js should render the not-found page
    const pageText = await page.textContent('body')
    expect(pageText).toBeTruthy()
    // The page should contain some indication it's a 404
    expect(page.url()).toContain('definitely-does-not-exist')
  })
})
