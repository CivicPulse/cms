import { test } from '@playwright/test'

test.describe('Blog feed @smoke', () => {
  test.skip('/blog shows published posts for current tenant', async ({ page }) => {
    // FRONT-03: paginated blog feed with web/both posts
  })

  test.skip('/blog paginates at 9 posts per page', async ({ page }) => {
    // FRONT-03: pagination controls appear when >9 posts
  })

  test.skip('/blog excludes email-only posts', async ({ page }) => {
    // FRONT-03: publishAs filter
  })
})
