import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PPLUS_ADMIN_ACCESS_TOKEN_COOKIE,
  PPLUS_ADMIN_REFRESH_TOKEN_COOKIE,
  clearAdminAuthCookies,
  setAdminAuthCookies,
} from '../apps/web/lib/admin-auth-cookies.js'

function getSetCookieHeaders(response) {
  return response.headers.getSetCookie ? response.headers.getSetCookie() : response.headers.get('set-cookie').split(', ')
}

test('admin auth cookie names are stable and admin-scoped', () => {
  assert.equal(PPLUS_ADMIN_ACCESS_TOKEN_COOKIE, 'pplus_admin_access_token')
  assert.equal(PPLUS_ADMIN_REFRESH_TOKEN_COOKIE, 'pplus_admin_refresh_token')
})

test('setAdminAuthCookies stores access and refresh tokens as secure http-only admin cookies in production', () => {
  const response = Response.json({ success: true })

  setAdminAuthCookies(response, {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }, {
    nodeEnv: 'production',
  })

  const cookies = getSetCookieHeaders(response)
  const accessCookie = cookies.find((cookie) => cookie.startsWith(`${PPLUS_ADMIN_ACCESS_TOKEN_COOKIE}=`))
  const refreshCookie = cookies.find((cookie) => cookie.startsWith(`${PPLUS_ADMIN_REFRESH_TOKEN_COOKIE}=`))

  assert.match(accessCookie, /HttpOnly/i)
  assert.match(accessCookie, /SameSite=Lax/i)
  assert.match(accessCookie, /Secure/i)
  assert.match(accessCookie, /Path=\/admin/i)
  assert.match(accessCookie, /Max-Age=3600/i)

  assert.match(refreshCookie, /HttpOnly/i)
  assert.match(refreshCookie, /SameSite=Lax/i)
  assert.match(refreshCookie, /Secure/i)
  assert.match(refreshCookie, /Path=\/admin/i)
  assert.match(refreshCookie, /Max-Age=2592000/i)
})

test('setAdminAuthCookies does not mark local development cookies secure', () => {
  const response = Response.json({ success: true })

  setAdminAuthCookies(response, {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
  }, {
    nodeEnv: 'development',
  })

  const cookies = getSetCookieHeaders(response)
  assert.equal(cookies.some((cookie) => /Secure/i.test(cookie)), false)
})

test('clearAdminAuthCookies expires access and refresh token cookies', () => {
  const response = Response.json({ success: true })

  clearAdminAuthCookies(response, { nodeEnv: 'production' })

  const cookies = getSetCookieHeaders(response)
  const accessCookie = cookies.find((cookie) => cookie.startsWith(`${PPLUS_ADMIN_ACCESS_TOKEN_COOKIE}=`))
  const refreshCookie = cookies.find((cookie) => cookie.startsWith(`${PPLUS_ADMIN_REFRESH_TOKEN_COOKIE}=`))

  assert.match(accessCookie, /Max-Age=0/i)
  assert.match(accessCookie, /Path=\/admin/i)
  assert.match(accessCookie, /HttpOnly/i)
  assert.match(accessCookie, /Secure/i)

  assert.match(refreshCookie, /Max-Age=0/i)
  assert.match(refreshCookie, /Path=\/admin/i)
  assert.match(refreshCookie, /HttpOnly/i)
  assert.match(refreshCookie, /Secure/i)
})
