import { expect, test } from '@playwright/test'

import { smokeRoute } from './route-smoke.js'

export const PUBLIC_ROUTE_SMOKE_PATHS = Object.freeze(['/', '/faq', '/support'])

const PUBLIC_ROUTE_EXPECTED_TEXT = Object.freeze({
  '/': /PPLUS|Performance|Training/i,
  '/faq': /FAQ|Frequently Asked/i,
  '/support': /Support|Get in touch/i,
})

test.describe('PPLUS public route smoke', () => {
  for (const route of PUBLIC_ROUTE_SMOKE_PATHS) {
    test(`${route} renders publicly with CSS`, async ({ page }) => {
      await smokeRoute(page, route)
      await expect(page.locator('body')).toContainText(PUBLIC_ROUTE_EXPECTED_TEXT[route])
    })
  }
})
