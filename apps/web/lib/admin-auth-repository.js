import { createSupabaseRestIdentityRepository } from '../../../packages/data/src/identity/index.js'
import { getAdminAuthConfig } from './admin-auth-config.js'

export function createAdminAuthError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  if (cause) error.cause = cause
  return error
}

function requireCredentials(email, password) {
  if (!String(email || '').trim() || !String(password || '').trim()) {
    throw createAdminAuthError('Email and password are required.', 400)
  }
}

function requireEmail(email) {
  if (!String(email || '').trim()) {
    throw createAdminAuthError('Email is required.', 400)
  }
}

function requirePasswordResetPayload(accessToken, password) {
  if (!String(accessToken || '').trim() || !String(password || '').trim()) {
    throw createAdminAuthError('Recovery token and password are required.', 400)
  }
}

function isSupabaseBadCredentialError(error) {
  const message = String(error?.message || '')
  return /Supabase identity request failed \((400|401)\)/.test(message)
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

export function createAdminAuthRepository(overrides = {}) {
  const envConfig = overrides.supabaseUrl && overrides.anonKey
    ? { supabaseUrl: overrides.supabaseUrl, anonKey: overrides.anonKey }
    : getAdminAuthConfig(overrides.env)
  const supabaseUrl = envConfig.supabaseUrl.replace(/\/$/, '')
  const anonKey = envConfig.anonKey
  const fetchImpl = overrides.fetchImpl ?? globalThis.fetch
  const identityRepositoryFactory = overrides.identityRepositoryFactory ?? createSupabaseRestIdentityRepository

  return {
    async signInAdminWithPassword({ email, password }) {
      requireCredentials(email, password)

      const signInRepository = identityRepositoryFactory({
        url: supabaseUrl,
        anonKey,
        fetchImpl,
      })
      let authSession
      try {
        authSession = await signInRepository.signInWithPassword({
          email: String(email).trim(),
          password,
        })
      } catch (error) {
        if (isSupabaseBadCredentialError(error)) {
          throw createAdminAuthError('Invalid email or password.', 401, error)
        }
        throw error
      }

      if (!authSession?.accessToken) {
        throw createAdminAuthError('Invalid email or password.', 401)
      }

      const sessionRepository = identityRepositoryFactory({
        url: supabaseUrl,
        anonKey,
        accessToken: authSession.accessToken,
        fetchImpl,
      })
      const user = await sessionRepository.getCurrentUser()

      if (!user?.id) {
        throw createAdminAuthError('Invalid email or password.', 401)
      }

      const coachProfile = await sessionRepository.getCoachProfileByUserId(user.id)
      if (!coachProfile?.id) {
        throw createAdminAuthError('This account does not have admin access.', 403)
      }

      return {
        accessToken: authSession.accessToken,
        refreshToken: authSession.refreshToken ?? null,
        user,
        coachProfile,
      }
    },

    async requestPasswordReset({ email, redirectTo }) {
      requireEmail(email)
      const repository = identityRepositoryFactory({
        url: supabaseUrl,
        anonKey,
        fetchImpl,
      })

      await repository.resetPasswordForEmail({
        email: String(email).trim(),
        redirectTo,
      })

      return { success: true }
    },

    async updatePasswordWithRecoveryToken({ accessToken, password }) {
      requirePasswordResetPayload(accessToken, password)

      if (typeof fetchImpl !== 'function') {
        throw createAdminAuthError('Fetch support is required for admin password reset.', 500)
      }

      const response = await fetchImpl(`${supabaseUrl}/auth/v1/user`, {
        method: 'PATCH',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ password }),
      })
      const payload = await readJsonResponse(response)

      if (!response.ok) {
        const message = payload?.msg || payload?.message || payload?.error_description || payload?.error || response.statusText || 'Password reset failed.'
        throw createAdminAuthError(`Password reset failed: ${message}`, response.status)
      }

      return { success: true }
    },
  }
}
