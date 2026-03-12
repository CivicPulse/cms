import { test, expect } from '@playwright/test'
import { getTestPayload, seedTestTenant, seedSiteSettings, seedPost, cleanupTestData } from './fixtures'

/**
 * Individual post page tests (FRONT-04).
 *
 * /blog/{slug} renders:
 *  - Post title as h1
 *  - Post publication date
 *  - Rich text content via Lexical RichText renderer
 *  - Share buttons (Facebook, X, Email, Copy Link)
 */

test.describe('Individual post page @smoke', () => {
  let tenantId: string | number
  const tenantSlug = `post-test-${Date.now()}`
  const postSlug = `individual-post-${Date.now()}`

  test.beforeAll(async () => {
    const payload = await getTestPayload()
    const tenant = await seedTestTenant(payload, tenantSlug)
    tenantId = tenant.id
    await seedSiteSettings(payload, tenantId)
    await seedPost(payload, tenantId, {
      title: 'Individual Test Post Title',
      slug: postSlug,
      publishAs: 'web',
    })
  })

  test.afterAll(async () => {
    const payload = await getTestPayload()
    await cleanupTestData(payload, tenantId)
  })

  test('/blog/{slug} renders post title and content', async ({ page }) => {
    // FRONT-04: post page with rich text
    await page.goto(`http://${tenantSlug}.localhost:3000/blog/${postSlug}`)
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    // Post title rendered as h1
    expect(pageText).toContain('Individual Test Post Title')
    // Rich text content from seed fixture: 'This is a test post.'
    expect(pageText).toContain('This is a test post.')
  })

  test('/blog/{slug} has share buttons', async ({ page }) => {
    // FRONT-04: social share buttons rendered on post page
    await page.goto(`http://${tenantSlug}.localhost:3000/blog/${postSlug}`)
    await page.waitForLoadState('networkidle')

    // The ShareButtons component renders "Share this post" label
    const pageText = await page.textContent('body')
    expect(pageText).toContain('Share this post')
  })
})
