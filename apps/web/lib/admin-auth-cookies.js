export const PPLUS_ADMIN_ACCESS_TOKEN_COOKIE = 'pplus_admin_access_token'
export const PPLUS_ADMIN_REFRESH_TOKEN_COOKIE = 'pplus_admin_refresh_token'

const ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60
const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

function isProduction(options = {}) {
  return (options.nodeEnv ?? process.env.NODE_ENV) === 'production'
}

function serializeCookie(name, value, options = {}) {
  const parts = [
    `${name}=${encodeURIComponent(value ?? '')}`,
    `Path=${options.path ?? '/admin'}`,
    'HttpOnly',
    'SameSite=Lax',
  ]

  if (Number.isFinite(options.maxAge)) {
    parts.push(`Max-Age=${options.maxAge}`)
  }

  if (options.secure) {
    parts.push('Secure')
  }

  return parts.join('; ')
}

function appendAdminCookie(response, name, value, options = {}) {
  response.headers.append('Set-Cookie', serializeCookie(name, value, {
    path: '/admin',
    secure: isProduction(options),
    maxAge: options.maxAge,
  }))
}

export function setAdminAuthCookies(response, session, options = {}) {
  appendAdminCookie(response, PPLUS_ADMIN_ACCESS_TOKEN_COOKIE, session?.accessToken || '', {
    ...options,
    maxAge: ACCESS_TOKEN_MAX_AGE_SECONDS,
  })
  appendAdminCookie(response, PPLUS_ADMIN_REFRESH_TOKEN_COOKIE, session?.refreshToken || '', {
    ...options,
    maxAge: REFRESH_TOKEN_MAX_AGE_SECONDS,
  })

  return response
}

export function clearAdminAuthCookies(response, options = {}) {
  appendAdminCookie(response, PPLUS_ADMIN_ACCESS_TOKEN_COOKIE, '', {
    ...options,
    maxAge: 0,
  })
  appendAdminCookie(response, PPLUS_ADMIN_REFRESH_TOKEN_COOKIE, '', {
    ...options,
    maxAge: 0,
  })

  return response
}
