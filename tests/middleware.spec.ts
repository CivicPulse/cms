import { test } from '@playwright/test'

test.describe('Subdomain tenant resolution @smoke', () => {
  test.skip('visiting {slug}.localhost resolves correct tenant', async ({ page }) => {
    // FRONT-01: middleware sets x-tenant-slug header
  })

  test.skip('/admin is not intercepted by middleware', async ({ page }) => {
    // FRONT-01: admin panel works normally
  })

  test.skip('unknown subdomain shows site not found', async ({ page }) => {
    // FRONT-01: archived/unknown tenant handling
  })
})
