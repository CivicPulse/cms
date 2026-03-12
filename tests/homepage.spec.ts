import { test } from '@playwright/test'

test.describe('Homepage rendering @smoke', () => {
  test.skip('homepage renders candidate name and tagline from site-settings', async ({ page }) => {
    // FRONT-02: data-driven homepage hero
  })

  test.skip('homepage shows meet-the-candidate section when bio is filled', async ({ page }) => {
    // FRONT-02: conditional bio section
  })

  test.skip('homepage displays recent post cards in grid', async ({ page }) => {
    // FRONT-02: post grid with up to 9 cards
  })
})
