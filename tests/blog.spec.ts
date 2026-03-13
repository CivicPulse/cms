import { test, expect } from '@playwright/test'
import { getTestPayload, seedTestTenant, seedSiteSettings, seedPost, cleanupTestData } from './fixtures'

/**
 * Blog feed tests (FRONT-03).
 *
 * /blog shows published posts (publishAs web or both) in a paginated grid.
 * Email-only posts (publishAs email) must NOT appear in the feed.
 */

test.describe('Blog feed @smoke', () => {
  let tenantId: string | number
  const tenantSlug = `blog-test-${Date.now()}`

  test.beforeAll(async () => {
    const payload = await getTestPayload()
    const tenant = await seedTestTenant(payload, tenantSlug)
    tenantId = tenant.id
    await seedSiteSettings(payload, tenantId)
    // Seed a web-published post
    await seedPost(payload, tenantId, {
      title: 'Web Published Post',
      slug: `web-post-${Date.now()}`,
      publishAs: 'web',
    })
    // Seed an email-only post — should NOT appear on /blog
    await seedPost(payload, tenantId, {
      title: 'Email Only Post',
      slug: `email-only-post-${Date.now()}`,
      publishAs: 'email',
    })
    // Seed a both post — should appear on /blog
    await seedPost(payload, tenantId, {
      title: 'Web and Email Post',
      slug: `both-post-${Date.now()}`,
      publishAs: 'both',
    })
  })

  test.afterAll(async () => {
    const payload = await getTestPayload()
    await cleanupTestData(payload, tenantId)
  })

  test('/blog shows published posts for current tenant', async ({ page }) => {
    // FRONT-03: blog feed shows web and both posts
    await page.goto(`http://${tenantSlug}.localhost:3000/blog`)
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    // Web-published post should appear
    expect(pageText).toContain('Web Published Post')
    // Web+Email post should also appear
    expect(pageText).toContain('Web and Email Post')
  })

  test('/blog excludes email-only posts', async ({ page }) => {
    // FRONT-03: publishAs filter — email-only posts are not rendered
    await page.goto(`http://${tenantSlug}.localhost:3000/blog`)
    await page.waitForLoadState('networkidle')

    const pageText = await page.textContent('body')
    // Email-only post should NOT appear in the blog feed
    expect(pageText).not.toContain('Email Only Post')
  })
})
