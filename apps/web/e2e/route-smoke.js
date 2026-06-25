import { expect } from '@playwright/test'

import { assertCssLoaded } from './css-loaded.js'

export const DEFAULT_ROUTE_SMOKE_OPTIONS = Object.freeze({
  expectedStatus: 200,
  waitUntil: 'domcontentloaded',
  bodySelector: 'body',
  assertCss: true,
})

export const ROUTE_SMOKE_ERROR_PATTERN = /ChunkLoadError|Application error|Unhandled Runtime Error|This page could not be found/i

export async function smokeRoute(page, route, options = {}) {
  const {
    expectedStatus = DEFAULT_ROUTE_SMOKE_OPTIONS.expectedStatus,
    waitUntil = DEFAULT_ROUTE_SMOKE_OPTIONS.waitUntil,
    bodySelector = DEFAULT_ROUTE_SMOKE_OPTIONS.bodySelector,
    assertCss = DEFAULT_ROUTE_SMOKE_OPTIONS.assertCss,
  } = options

  const response = await page.goto(route, { waitUntil })
  expect(response, `expected ${route} to return a response`).not.toBeNull()
  expect(response.status(), `expected ${route} to return ${expectedStatus}`).toBe(expectedStatus)

  const body = page.locator(bodySelector)
  await expect(body, `expected ${route} to render visible body content`).toBeVisible()
  await expect(body, `expected ${route} to avoid stale chunk/runtime error text`).not.toContainText(ROUTE_SMOKE_ERROR_PATTERN)

  if (assertCss) {
    await assertCssLoaded(page, { route })
  }

  return response
}
