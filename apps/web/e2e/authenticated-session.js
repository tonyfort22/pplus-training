import { expect } from '@playwright/test'

import { assertCssLoaded } from './css-loaded.js'

export const DEFAULT_AUTHENTICATED_SESSION_OPTIONS = Object.freeze({
  loginApiPath: '/api/admin/auth/login',
  loginPath: '/admin/login',
  authenticatedPath: '/admin/dashboard',
  emailEnv: 'PPLUS_WEB_ADMIN_EMAIL',
  passwordEnv: 'PPLUS_WEB_ADMIN_PASSWORD',
  emailInputSelector: '#email',
  passwordInputSelector: '#password',
  submitButtonSelector: 'button[type="submit"]',
  accessCookieName: 'pplus_admin_access_token',
  refreshCookieName: 'pplus_admin_refresh_token',
  assertAuthenticatedCss: true,
})

export function hasAdminLoginCredentials(env = process.env, options = {}) {
  const emailEnv = options.emailEnv ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.emailEnv
  const passwordEnv = options.passwordEnv ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.passwordEnv
  const email = String(env?.[emailEnv] || '').trim()
  const password = String(env?.[passwordEnv] || '')

  return Boolean(email && password)
}

export function readAdminLoginCredentials(env = process.env, options = {}) {
  const emailEnv = options.emailEnv ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.emailEnv
  const passwordEnv = options.passwordEnv ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.passwordEnv
  const email = String(env?.[emailEnv] || '').trim()
  const password = String(env?.[passwordEnv] || '')

  expect(email, `set ${emailEnv} before running authenticated PPLUS web browser smoke tests`).toBeTruthy()
  expect(password, `set ${passwordEnv} before running authenticated PPLUS web browser smoke tests`).toBeTruthy()

  return { email, password }
}

async function assertAdminCookies(page, responseUrl, options = {}) {
  const accessCookieName = options.accessCookieName ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.accessCookieName
  const refreshCookieName = options.refreshCookieName ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.refreshCookieName
  const origin = new URL(responseUrl).origin
  const cookies = await page.context().cookies(origin)
  const cookieNames = cookies.map((cookie) => cookie.name)

  expect(cookieNames, `expected authenticated session to set ${accessCookieName}`).toContain(accessCookieName)
  expect(cookieNames, `expected authenticated session to set ${refreshCookieName}`).toContain(refreshCookieName)

  return cookies
}

async function assertAuthenticatedPath(page, authenticatedPath, options = {}) {
  const loginPath = options.loginPath ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.loginPath
  const assertAuthenticatedCss = options.assertAuthenticatedCss ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.assertAuthenticatedCss
  const authenticatedResponse = await page.goto(authenticatedPath, { waitUntil: 'domcontentloaded' })

  expect(authenticatedResponse, `expected authenticated path ${authenticatedPath} to return a response`).not.toBeNull()
  expect(authenticatedResponse.status(), `expected authenticated path ${authenticatedPath} to return 200`).toBe(200)
  await expect(page, `expected authenticated path ${authenticatedPath} to avoid redirecting back to login`).not.toHaveURL(new RegExp(`${loginPath.replaceAll('/', '\\/')}(?:\\?|$)`))

  if (assertAuthenticatedCss) {
    await assertCssLoaded(page, { route: authenticatedPath })
  }

  return authenticatedResponse
}

export async function loginAdminThroughApi(page, options = {}) {
  const loginApiPath = options.loginApiPath ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.loginApiPath
  const authenticatedPath = options.authenticatedPath ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.authenticatedPath
  const credentials = options.credentials ?? readAdminLoginCredentials(options.env, options)
  const response = await page.request.post(loginApiPath, {
    data: {
      email: credentials.email,
      password: credentials.password,
    },
  })
  const payload = await response.json().catch(() => ({}))

  expect(response.status(), `expected ${loginApiPath} to authenticate the admin browser session`).toBe(200)
  expect(payload?.success, `expected ${loginApiPath} to return a success payload`).toBe(true)

  const cookies = await assertAdminCookies(page, response.url(), options)
  const authenticatedResponse = await assertAuthenticatedPath(page, authenticatedPath, options)

  return { response, payload, cookies, authenticatedResponse }
}

export async function loginAdminThroughUi(page, options = {}) {
  const loginPath = options.loginPath ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.loginPath
  const authenticatedPath = options.authenticatedPath ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.authenticatedPath
  const emailInputSelector = options.emailInputSelector ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.emailInputSelector
  const passwordInputSelector = options.passwordInputSelector ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.passwordInputSelector
  const submitButtonSelector = options.submitButtonSelector ?? DEFAULT_AUTHENTICATED_SESSION_OPTIONS.submitButtonSelector
  const credentials = options.credentials ?? readAdminLoginCredentials(options.env, options)

  const loginResponse = await page.goto(loginPath, { waitUntil: 'domcontentloaded' })
  expect(loginResponse, `expected login path ${loginPath} to return a response`).not.toBeNull()
  expect(loginResponse.status(), `expected login path ${loginPath} to return 200`).toBe(200)

  await page.locator('#email').fill(credentials.email)
  await page.locator('#password').fill(credentials.password)
  await page.locator(emailInputSelector).fill(credentials.email)
  await page.locator(passwordInputSelector).fill(credentials.password)
  await page.locator(submitButtonSelector).click()
  await page.waitForURL((url) => url.pathname !== loginPath, { waitUntil: 'domcontentloaded' })

  const cookies = await assertAdminCookies(page, page.url(), options)
  const authenticatedResponse = await assertAuthenticatedPath(page, authenticatedPath, options)

  return { loginResponse, cookies, authenticatedResponse }
}
