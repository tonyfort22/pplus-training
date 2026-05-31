import { createSupabaseRestIdentityRepository } from '../../../packages/data/src/identity/index.js'
import { getAdminAuthConfig } from './admin-auth-config.js'

export function createAdminCoachProfileError(message, status = 500, cause = null) {
  const error = new Error(message)
  error.status = status
  if (cause) error.cause = cause
  return error
}

function requireAccessToken(accessToken) {
  if (!String(accessToken || '').trim()) {
    throw createAdminCoachProfileError('Admin session is required.', 401)
  }
}

function normalizeText(value) {
  return String(value ?? '').trim()
}

function mapCoachProfile(profile, user = null) {
  if (!profile?.id) return null

  return {
    id: profile.id,
    name: profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ').trim() || '',
    phone: profile.phoneNumber || '',
    avatarUrl: profile.avatarUrl || '',
    email: user?.email || '',
  }
}

function isSupabaseAuthSessionError(error) {
  const message = String(error?.message || '')
  return /Supabase identity request failed \((401|403)\)/.test(message)
}

function parseDataUrlToUploadPayload(dataUrl) {
  const match = String(dataUrl || '').match(/^data:([^;,]+)?(;base64)?,(.*)$/)
  if (!match) {
    throw createAdminCoachProfileError('Coach avatar upload payload is invalid.', 400)
  }

  const contentType = match[1] || 'image/jpeg'
  const isBase64 = Boolean(match[2])
  const rawData = match[3] || ''
  const fileBuffer = isBase64
    ? new Uint8Array(Buffer.from(rawData, 'base64'))
    : new TextEncoder().encode(decodeURIComponent(rawData))

  return { fileBuffer, contentType }
}

export function createAdminCoachProfileRepository(overrides = {}) {
  const envConfig = overrides.supabaseUrl && overrides.anonKey
    ? { supabaseUrl: overrides.supabaseUrl, anonKey: overrides.anonKey }
    : getAdminAuthConfig(overrides.env)
  const accessToken = overrides.accessToken || ''
  const identityRepositoryFactory = overrides.identityRepositoryFactory ?? createSupabaseRestIdentityRepository
  const fetchImpl = overrides.fetchImpl ?? globalThis.fetch

  function createIdentityRepository() {
    requireAccessToken(accessToken)
    return identityRepositoryFactory({
      url: envConfig.supabaseUrl,
      anonKey: envConfig.anonKey,
      accessToken,
      fetchImpl,
    })
  }

  async function getCurrentProfileContext() {
    const repository = createIdentityRepository()
    let user
    try {
      user = await repository.getCurrentUser()
    } catch (error) {
      if (isSupabaseAuthSessionError(error)) {
        throw createAdminCoachProfileError('Admin session is invalid.', 401)
      }
      throw error
    }

    if (!user?.id) {
      throw createAdminCoachProfileError('Admin session is invalid.', 401)
    }

    const coachProfile = await repository.getCoachProfileByUserId(user.id)
    if (!coachProfile?.id) {
      throw createAdminCoachProfileError('This account does not have admin access.', 403)
    }

    return { repository, user, coachProfile }
  }

  return {
    async getCurrentCoachProfile() {
      const { user, coachProfile } = await getCurrentProfileContext()
      return mapCoachProfile(coachProfile, user)
    },

    async updateCurrentCoachProfile({ name, phone, avatarUrl, avatarUpload = null } = {}) {
      const { repository, user, coachProfile } = await getCurrentProfileContext()
      let nextAvatarUrl = normalizeText(avatarUrl ?? coachProfile.avatarUrl ?? '')

      if (avatarUpload?.dataUrl) {
        const { fileBuffer, contentType } = parseDataUrlToUploadPayload(avatarUpload.dataUrl)
        nextAvatarUrl = await repository.uploadCoachAvatar({
          coachId: coachProfile.id,
          fileBuffer,
          contentType: avatarUpload.contentType || contentType || 'image/jpeg',
          fileName: avatarUpload.fileName || 'profile.jpg',
        })
      }

      const updatedProfile = await repository.updateCoachProfile({
        coachId: coachProfile.id,
        updates: {
          displayName: normalizeText(name),
          phoneNumber: normalizeText(phone),
          avatarUrl: nextAvatarUrl,
        },
      })

      return mapCoachProfile(updatedProfile, user)
    },
  }
}
