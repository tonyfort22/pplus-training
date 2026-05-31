import { getAdminAuthConfig } from './admin-auth-config.js'

export function createAdminAccountError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  if (cause) error.cause = cause
  return error
}

function requireAccessToken(accessToken) {
  if (!String(accessToken || '').trim()) {
    throw createAdminAccountError('Admin session is required.', 401)
  }
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

async function readJsonResponse(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function mapAccount(payload, fallbackEmail = '') {
  return { email: normalizeText(payload?.email || fallbackEmail) }
}

function resolveSupabaseErrorMessage(payload, fallback = 'Account update failed.') {
  return payload?.msg || payload?.message || payload?.error_description || payload?.error || fallback
}

export function createAdminAccountRepository(overrides = {}) {
  const envConfig = overrides.supabaseUrl && overrides.anonKey
    ? { supabaseUrl: overrides.supabaseUrl, anonKey: overrides.anonKey }
    : getAdminAuthConfig(overrides.env)
  const supabaseUrl = envConfig.supabaseUrl.replace(/\/$/, '')
  const anonKey = envConfig.anonKey
  const accessToken = overrides.accessToken || ''
  const fetchImpl = overrides.fetchImpl ?? globalThis.fetch

  async function requestCurrentUser(method, body = null) {
    requireAccessToken(accessToken)
    if (typeof fetchImpl !== 'function') {
      throw createAdminAccountError('Fetch support is required for admin account updates.', 500)
    }

    const response = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
      method,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const payload = await readJsonResponse(response)

    if (!response.ok) {
      const message = resolveSupabaseErrorMessage(payload, method === 'GET' ? 'Unable to load account.' : 'Account update failed.')
      const safeMessage = response.status === 401 || response.status === 403
        ? 'Admin session is invalid.'
        : `${method === 'GET' ? 'Account load' : 'Account update'} failed: ${message}`
      throw createAdminAccountError(safeMessage, response.status)
    }

    return payload
  }

  async function verifyCurrentPassword(email, currentPassword) {
    requireAccessToken(accessToken)
    if (typeof fetchImpl !== 'function') {
      throw createAdminAccountError('Fetch support is required for admin account updates.', 500)
    }

    const response = await fetchImpl(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        email,
        password: currentPassword,
      }),
    })
    const payload = await readJsonResponse(response)

    if (!response.ok) {
      throw createAdminAccountError('Current password is incorrect.', 401, payload)
    }

    return payload
  }

  return {
    async getCurrentAccount() {
      const payload = await requestCurrentUser('GET')
      return mapAccount(payload)
    },

    async updateCurrentAccount({ email, currentPassword = '', password = '', confirmPassword = '' } = {}) {
      const nextEmail = normalizeText(email)
      const nextCurrentPassword = String(currentPassword || '')
      const nextPassword = String(password || '')
      const nextConfirmPassword = String(confirmPassword || '')

      if (!nextEmail) {
        throw createAdminAccountError('Email is required.', 400)
      }
      if (nextPassword || nextConfirmPassword) {
        if (nextPassword !== nextConfirmPassword) {
          throw createAdminAccountError('New password and confirmation must match.', 400)
        }
        if (!nextCurrentPassword) {
          throw createAdminAccountError('Current password is required to set a new password.', 400)
        }
        await verifyCurrentPassword(nextEmail, nextCurrentPassword)
      }

      const updates = { email: nextEmail }
      if (nextPassword) updates.password = nextPassword

      const payload = await requestCurrentUser('PATCH', updates)
      return mapAccount(payload, nextEmail)
    },
  }
}
