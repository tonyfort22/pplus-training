import { expect } from '@playwright/test'

import { assertCssLoaded } from './css-loaded.js'

export const DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS = Object.freeze({
  expectedStatus: 307,
  loginPath: '/admin/login',
  nextParam: 'next',
  loginFormSelector: 'form',
  allowedLocalHosts: Object.freeze(['127.0.0.1', 'localhost']),
  assertLoginCss: true,
})

export async function assertUnauthenticatedRedirectToLogin(page, protectedPath, options = {}) {
  const {
    expectedStatus = DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS.expectedStatus,
    loginPath = DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS.loginPath,
    nextParam = DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS.nextParam,
    loginFormSelector = DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS.loginFormSelector,
    allowedLocalHosts = DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS.allowedLocalHosts,
    assertLoginCss = DEFAULT_UNAUTHENTICATED_REDIRECT_OPTIONS.assertLoginCss,
  } = options

  const response = await page.request.get(protectedPath, { maxRedirects: 0 })
  const protectedUrl = new URL(response.url())
  const location = response.headers().location

  expect(
    response.status(),
    `expected unauthenticated ${protectedUrl.toString()} to redirect with ${expectedStatus}`,
  ).toBe(expectedStatus)
  expect(location, `expected unauthenticated ${protectedUrl.toString()} to include a Location header`).toBeTruthy()

  const redirectUrl = new URL(location, protectedUrl)
  expect(
    redirectUrl.protocol,
    `expected ${protectedUrl.toString()} to keep the redirect protocol local to the preview server`,
  ).toBe(protectedUrl.protocol)
  expect(
    redirectUrl.port,
    `expected ${protectedUrl.toString()} to keep the redirect on the same preview port`,
  ).toBe(protectedUrl.port)
  expect(
    allowedLocalHosts,
    `expected ${protectedUrl.toString()} to redirect to a local preview host, got ${redirectUrl.hostname}`,
  ).toContain(redirectUrl.hostname)
  expect(
    redirectUrl.pathname,
    `expected ${protectedUrl.toString()} to redirect to ${loginPath}`,
  ).toBe(loginPath)
  const preservedNextPath = redirectUrl.searchParams.get('next')
  expect(
    preservedNextPath,
    `expected ${protectedUrl.toString()} redirect to preserve next path/query`,
  ).toBe(`${protectedUrl.pathname}${protectedUrl.search}`)

  const loginResponse = await page.goto(redirectUrl.toString(), { waitUntil: 'domcontentloaded' })
  expect(loginResponse, `expected redirected login URL ${redirectUrl.toString()} to return a response`).not.toBeNull()
  expect(loginResponse.status(), `expected redirected login URL ${redirectUrl.toString()} to return 200`).toBe(200)

  const loginForm = page.locator(loginFormSelector)
  await expect(loginForm, `expected redirected login URL ${redirectUrl.toString()} to render the login form`).toBeVisible()

  if (assertLoginCss) {
    await assertCssLoaded(page, { route: redirectUrl.toString() })
  }

  return { response, redirectUrl, loginResponse }
}
