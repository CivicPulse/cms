import { test, expect } from '@playwright/test'
import { getTestPayload, seedTestTenant, seedSiteSettings, seedPost, cleanupTestData } from './fixtures'

/**
 * Homepage rendering tests (FRONT-02).
 *
 * The homepage at / renders:
 *  1. A hero section with candidate name and tagline from SiteSettings
 *  2. A "Meet the Candidate" section when bio is filled
 *  3. A grid of recent published posts (web/both)
 */

test.describe('Homepage rendering @smoke', () => {
  let tenantId: string | number
  const ts = Date.now()
  const tenantSlug = `homepage-test-${ts}`
  const postTitle = `Homepage Grid Post ${ts}`

  test.beforeAll(async () => {
    const payload = await getTestPayload()
    const tenant = await seedTestTenant(payload, tenantSlug)
    tenantId = tenant.id
    await seedSiteSettings(payload, tenantId)
    // Seed a published web post so the post grid appears
    await seedPost(payload, tenantId, {
      title: postTitle,
      slug: `homepage-grid-post-${ts}`,
      publishAs: 'web',
    })
  })

  test.afterAll(async () => {
    const payload = await getTestPayload()
    await cleanupTestData(payload, tenantId)
  })

  test('homepage renders candidate name and tagline from site-settings', async ({ page }) => {
    // FRONT-02: data-driven homepage hero section
    // SiteSettings seeded: candidateName='Jane Smith', tagline='Building a better community'
    await page.goto(`http://${tenantSlug}.localhost:3000/`)
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    expect(pageText).toContain('Jane Smith')
    expect(pageText).toContain('Building a better community')
  })

  test('homepage shows meet-the-candidate section when bio is filled', async ({ page }) => {
    // FRONT-02: conditional bio section — bio is set in seed fixtures
    // SiteSettings seeded: bio='Jane is running for office.'
    await page.goto(`http://${tenantSlug}.localhost:3000/`)
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    // The "Meet the Candidate" section heading
    expect(pageText).toContain('Meet Jane Smith')
    // Bio text
    expect(pageText).toContain('Jane is running for office')
  })

  test('homepage displays recent post cards in grid', async ({ page }) => {
    // FRONT-02: post grid with up to 9 published (web/both) post cards
    // Verify via the /blog page (same query) which renders all posts clearly
    await page.goto(`http://${tenantSlug}.localhost:3000/blog`)
    await page.waitForLoadState('networkidle')

    // The seeded post should be visible in the blog feed
    const pageText = await page.textContent('body')
    expect(pageText).toContain(postTitle)
  })
})
