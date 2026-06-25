import { expect, test } from '@playwright/test'

import {
  WEB_BROWSER_SMOKE_PRIORITIES,
  WEB_ROUTE_AREAS,
  WEB_ROUTE_AUTH_STATES,
  getWebPageTestManifest,
} from '../testing/page-test-manifest.js'
import { smokeRoute } from './route-smoke.js'

export const QA_INTERNAL_ROUTE_CLASSIFICATION_SMOKE_PATHS = Object.freeze([
  '/qa/planner-ai-import',
])

function manifestEntryFor(path) {
  return getWebPageTestManifest().find((entry) => entry.path === path)
}

test.describe('PPLUS QA/internal route classification smoke', () => {
  for (const route of QA_INTERNAL_ROUTE_CLASSIFICATION_SMOKE_PATHS) {
    test(`${route} stays classified as internal-only and renders with CSS`, async ({ page }) => {
      const manifestEntry = manifestEntryFor(route)

      expect(manifestEntry, `expected ${route} to be present in the web page test manifest`).toBeTruthy()
      expect(manifestEntry.area, `expected ${route} to stay in the QA/internal functional area`).toBe(WEB_ROUTE_AREAS.QA_INTERNAL)
      expect(manifestEntry.authState, `expected ${route} to stay internal-test-only`).toBe(WEB_ROUTE_AUTH_STATES.INTERNAL_TEST_ONLY)
      expect(manifestEntry.browserSmokePriority, `expected ${route} to keep internal browser-smoke priority`).toBe(WEB_BROWSER_SMOKE_PRIORITIES.INTERNAL)

      await smokeRoute(page, route)
    })
  }
})
