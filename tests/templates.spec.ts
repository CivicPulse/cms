import { test, expect } from '@playwright/test'
import { getTestPayload, seedTestTenant, seedSiteSettings, cleanupTestData } from './fixtures'

/**
 * Template system tests (FRONT-06).
 *
 * Three templates exist (classic, modern, bold), each with a distinct
 * visual identity implemented via Tailwind CSS palette tokens and font classes.
 *
 * Observable: each template applies a wrapper element with template-specific
 * CSS classes (e.g. font-serif for classic, bg-bold-bg for bold).
 */

test.describe('Template system @smoke', () => {
  const classicSlug = `classic-template-test-${Date.now()}`
  const modernSlug = `modern-template-test-${Date.now()}`
  const boldSlug = `bold-template-test-${Date.now()}`
  let classicTenantId: string | number
  let modernTenantId: string | number
  let boldTenantId: string | number

  test.beforeAll(async () => {
    const payload = await getTestPayload()

    const classicTenant = await seedTestTenant(payload, classicSlug)
    classicTenantId = classicTenant.id
    await payload.create({
      collection: 'site-settings',
      data: {
        tenant: classicTenantId as never,
        candidateName: 'Classic Candidate',
        officeRunningFor: 'City Council',
        tagline: 'Classic tagline',
        primaryColor: '#2563eb',
        activeTemplateKey: 'classic',
        bio: 'Running for office.',
        contactEmail: 'classic@example.com',
      },
      overrideAccess: true,
    })

    const modernTenant = await seedTestTenant(payload, modernSlug)
    modernTenantId = modernTenant.id
    await payload.create({
      collection: 'site-settings',
      data: {
        tenant: modernTenantId as never,
        candidateName: 'Modern Candidate',
        officeRunningFor: 'City Council',
        tagline: 'Modern tagline',
        primaryColor: '#2563eb',
        activeTemplateKey: 'modern',
        bio: 'Running for office.',
        contactEmail: 'modern@example.com',
      },
      overrideAccess: true,
    })

    const boldTenant = await seedTestTenant(payload, boldSlug)
    boldTenantId = boldTenant.id
    await payload.create({
      collection: 'site-settings',
      data: {
        tenant: boldTenantId as never,
        candidateName: 'Bold Candidate',
        officeRunningFor: 'City Council',
        tagline: 'Bold tagline',
        primaryColor: '#2563eb',
        activeTemplateKey: 'bold',
        bio: 'Running for office.',
        contactEmail: 'bold@example.com',
      },
      overrideAccess: true,
    })
  })

  test.afterAll(async () => {
    const payload = await getTestPayload()
    await cleanupTestData(payload, classicTenantId)
    await cleanupTestData(payload, modernTenantId)
    await cleanupTestData(payload, boldTenantId)
  })

  test('classic template renders with serif fonts and structured layout', async ({ page }) => {
    // FRONT-06: classic template visual identity
    // ClassicLayout applies font-serif class on the root wrapper div
    await page.goto(`http://${classicSlug}.localhost:3000/`)
    await page.waitForLoadState('networkidle')

    // ClassicLayout root div has class "font-serif text-classic-text bg-classic-bg min-h-screen"
    const hasSerifClass = await page.evaluate(() => {
      const el = document.querySelector('.font-serif')
      return el !== null
    })
    expect(hasSerifClass).toBe(true)

    // Candidate name should appear
    const pageText = await page.textContent('body')
    expect(pageText).toContain('Classic Candidate')
  })

  test('modern template renders with sans-serif and clean whitespace', async ({ page }) => {
    // FRONT-06: modern template visual identity
    // ModernLayout applies font-sans on root wrapper
    await page.goto(`http://${modernSlug}.localhost:3000/`)
    await page.waitForLoadState('networkidle')

    // ModernLayout root div has class "font-sans text-modern-text bg-modern-bg min-h-screen"
    const hasSansClass = await page.evaluate(() => {
      const el = document.querySelector('.font-sans')
      return el !== null
    })
    expect(hasSansClass).toBe(true)

    const pageText = await page.textContent('body')
    expect(pageText).toContain('Modern Candidate')
  })

  test('bold template renders with dark background', async ({ page }) => {
    // FRONT-06: bold template visual identity
    // BoldLayout applies font-sans and bg-bold-bg
    await page.goto(`http://${boldSlug}.localhost:3000/`)
    await page.waitForLoadState('networkidle')

    // BoldLayout root div has class "font-sans text-bold-text bg-bold-bg min-h-screen"
    // bg-bold-bg is the dark slate background
    const hasBoldBgClass = await page.evaluate(() => {
      const el = document.querySelector('.bg-bold-bg')
      return el !== null
    })
    expect(hasBoldBgClass).toBe(true)

    const pageText = await page.textContent('body')
    expect(pageText).toContain('Bold Candidate')
  })
})
