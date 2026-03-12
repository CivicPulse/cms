import { test } from '@playwright/test'

test.describe('Individual post page @smoke', () => {
  test.skip('/blog/{slug} renders post title and content', async ({ page }) => {
    // FRONT-04: post page with rich text
  })

  test.skip('/blog/{slug} shows featured image when present', async ({ page }) => {
    // FRONT-04: featured image rendering
  })

  test.skip('/blog/{slug} has share buttons', async ({ page }) => {
    // FRONT-04: social share buttons
  })
})
