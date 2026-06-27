import { expect, test } from '@playwright/test'

import { resolveWebBaseUrl } from './base-url.js'
import { assertCssLoaded, DEFAULT_CSS_LOADED_OPTIONS } from './css-loaded.js'
import { DEFAULT_ROUTE_SMOKE_OPTIONS, ROUTE_SMOKE_ERROR_PATTERN, smokeRoute } from './route-smoke.js'
import {
  DEFAULT_AUTHENTICATED_SESSION_OPTIONS,
  loginAdminThroughApi,
  loginAdminThroughUi,
  readAdminLoginCredentials,
} from './authenticated-session.js'
import {
  readSafeRecordFixtureIds,
  requireSafeRecordFixtureId,
  SAFE_RECORD_FIXTURE_ENV,
} from './safe-record-fixtures.js'
import { assertUnauthenticatedRedirectToLogin, DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS } from './unauthenticated-redirect.js'

test.describe('PPLUS web browser smoke harness', () => {
  test('is wired for later route smoke specs', async ({ baseURL }) => {
    // This harness sentinel keeps Playwright discovery honest while L4 route smoke coverage is added slice by slice.
    expect(baseURL).toBe(resolveWebBaseUrl())
    expect(DEFAULT_ROUTE_SMOKE_OPTIONS.expectedStatus).toBe(200)
    expect(DEFAULT_ROUTE_SMOKE_OPTIONS.waitUntil).toBe('domcontentloaded')
    expect(DEFAULT_ROUTE_SMOKE_OPTIONS.assertCss).toBe(true)
    expect(DEFAULT_CSS_LOADED_OPTIONS.minimumLoadedStyleSheets).toBe(1)
    expect(DEFAULT_CSS_LOADED_OPTIONS.requireStylesheetLinks).toBe(true)
    expect(DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS.expectedStatus).toBe(307)
    expect(DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS.loginPath).toBe('/admin/login')
    expect(DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS.nextParam).toBe('next')
    expect(DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS.assertLoginCss).toBe(true)
    expect(DEFAULT_AUTHENTICATED_SESSION_OPTIONS.loginApiPath).toBe('/api/admin/auth/login')
    expect(DEFAULT_AUTHENTICATED_SESSION_OPTIONS.authenticatedPath).toBe('/admin/dashboard')
    expect(DEFAULT_AUTHENTICATED_SESSION_OPTIONS.emailEnv).toBe('PPLUS_WEB_ADMIN_EMAIL')
    expect(DEFAULT_AUTHENTICATED_SESSION_OPTIONS.passwordEnv).toBe('PPLUS_WEB_ADMIN_PASSWORD')
    expect(DEFAULT_AUTHENTICATED_SESSION_OPTIONS.accessCookieName).toBe('pplus_admin_access_token')
    expect(SAFE_RECORD_FIXTURE_ENV.athleteId).toBe('PPLUS_WEB_SAFE_ATHLETE_ID')
    expect(SAFE_RECORD_FIXTURE_ENV.workoutTemplateId).toBe('PPLUS_WEB_SAFE_WORKOUT_TEMPLATE_ID')
    expect(SAFE_RECORD_FIXTURE_ENV.programId).toBe('PPLUS_WEB_SAFE_PROGRAM_ID')
    expect(ROUTE_SMOKE_ERROR_PATTERN.test('ChunkLoadError')).toBe(true)
    expect(typeof smokeRoute).toBe('function')
    expect(typeof assertCssLoaded).toBe('function')
    expect(typeof assertUnauthenticatedRedirectToLogin).toBe('function')
    expect(typeof readAdminLoginCredentials).toBe('function')
    expect(typeof loginAdminThroughApi).toBe('function')
    expect(typeof loginAdminThroughUi).toBe('function')
    expect(typeof readSafeRecordFixtureIds).toBe('function')
    expect(typeof requireSafeRecordFixtureId).toBe('function')
  })

  test('CSS loaded helper detects active CSS rules', async ({ page }) => {
    await page.setContent(`
      <!doctype html>
      <html>
        <head><style>body { color: rgb(1, 2, 3); }</style></head>
        <body>CSS helper probe</body>
      </html>
    `)

    const cssState = await assertCssLoaded(page, {
      route: 'inline-css-helper-probe',
      requireStylesheetLinks: false,
    })

    expect(cssState.loadedStyleSheets.length).toBeGreaterThanOrEqual(1)
  })
})
