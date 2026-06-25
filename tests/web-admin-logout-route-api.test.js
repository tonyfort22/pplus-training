import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { createAdminAuthRouteHandlers } from '../apps/web/lib/admin-auth-route-handlers.js'
import {
  PPLUS_ADMIN_ACCESS_TOKEN_COOKIE,
  PPLUS_ADMIN_REFRESH_TOKEN_COOKIE,
} from '../apps/web/lib/admin-auth-cookies.js'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function logoutRequest() {
  return new Request('https://admin.pplus.test/api/admin/auth/logout', { method: 'POST' })
}

async function readJson(response) {
  return response.json()
}

function getSetCookieHeaders(response) {
  if (response.headers.getSetCookie) return response.headers.getSetCookie()
  return response.headers.get('set-cookie')?.split(/,\s*(?=[^;,]+=)/) ?? []
}

function findCookie(cookies, name) {
  return cookies.find((cookie) => cookie.startsWith(`${name}=`)) || ''
}

test('logout route file delegates POST requests to the shared admin auth handler', () => {
  const source = readFileSync(resolve(repoRoot, 'apps/web/app/api/admin/auth/logout/route.js'), 'utf8')

  assert.match(source, /createAdminAuthRouteHandlers/)
  assert.match(source, /export async function POST\(request\)/)
  assert.match(source, /return handlers\.logout\(request\)/)
})

test('logout API clears access and refresh cookies with production deletion shape', async () => {
  const handlers = createAdminAuthRouteHandlers({ nodeEnv: 'production' })

  const response = await handlers.logout(logoutRequest())

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), { success: true })

  const cookies = getSetCookieHeaders(response)
  assert.equal(cookies.length, 2)

  const accessCookie = findCookie(cookies, PPLUS_ADMIN_ACCESS_TOKEN_COOKIE)
  assert.match(accessCookie, new RegExp(`^${PPLUS_ADMIN_ACCESS_TOKEN_COOKIE}=;`))
  assert.match(accessCookie, /Path=\//)
  assert.match(accessCookie, /HttpOnly/)
  assert.match(accessCookie, /SameSite=Lax/)
  assert.match(accessCookie, /Max-Age=0/)
  assert.match(accessCookie, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/)
  assert.match(accessCookie, /Secure/)

  const refreshCookie = findCookie(cookies, PPLUS_ADMIN_REFRESH_TOKEN_COOKIE)
  assert.match(refreshCookie, new RegExp(`^${PPLUS_ADMIN_REFRESH_TOKEN_COOKIE}=;`))
  assert.match(refreshCookie, /Path=\//)
  assert.match(refreshCookie, /HttpOnly/)
  assert.match(refreshCookie, /SameSite=Lax/)
  assert.match(refreshCookie, /Max-Age=0/)
  assert.match(refreshCookie, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/)
  assert.match(refreshCookie, /Secure/)
})

test('logout API clears cookies without reading request JSON or touching the repository', async () => {
  const handlers = createAdminAuthRouteHandlers({
    nodeEnv: 'production',
    createRepository: () => {
      throw new Error('repository should not be created for logout')
    },
  })
  const request = new Request('https://admin.pplus.test/api/admin/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not-json',
  })

  const response = await handlers.logout(request)

  assert.equal(response.status, 200)
  assert.deepEqual(await readJson(response), { success: true })
  const cookies = getSetCookieHeaders(response)
  assert.equal(cookies.length, 2)
  assert.match(findCookie(cookies, PPLUS_ADMIN_ACCESS_TOKEN_COOKIE), /Max-Age=0/)
  assert.match(findCookie(cookies, PPLUS_ADMIN_REFRESH_TOKEN_COOKIE), /Max-Age=0/)
})
