function requireFetch(fetchImpl) {
  if (typeof fetchImpl !== 'function') {
    throw new Error('Supabase REST identity repository requires fetch support')
  }
  return fetchImpl
}

function mapUserRow(row) {
  if (!row) return null
  return {
    id: row.id,
    email: row.email ?? null,
    role: row.role ?? null,
    createdAt: row.created_at ?? null,
    updatedAt: row.updated_at ?? null,
  }
}

function mapAthleteProfileRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id ?? null,
    coachId: row.coach_id ?? null,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    dateOfBirth: row.date_of_birth ?? null,
    sport: row.sport ?? null,
    position: row.position ?? null,
    handedness: row.handedness ?? null,
    gender: row.gender ?? null,
    heightCm: row.height_cm ?? null,
    weightKg: row.weight_kg ?? null,
    avatarUrl: row.avatar_url ?? null,
    status: row.status ?? null,
    unitsPreference: row.units_preference ?? null,
    weightUnitPreference: row.weight_unit_preference ?? null,
    distanceUnitPreference: row.distance_unit_preference ?? null,
    themePreference: row.theme_preference ?? null,
  }
}

function mapCoachProfileRow(row) {
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id ?? null,
    displayName: row.display_name ?? null,
    firstName: row.first_name ?? null,
    lastName: row.last_name ?? null,
    organizationName: row.organization_name ?? null,
    bio: row.bio ?? null,
    phoneNumber: row.phone_number ?? null,
    avatarUrl: row.avatar_url ?? null,
    weightUnitPreference: row.weight_unit_preference ?? null,
    distanceUnitPreference: row.distance_unit_preference ?? null,
    themePreference: row.theme_preference ?? null,
  }
}

const ATHLETE_PROFILE_FULL_SELECT = 'id,user_id,coach_id,first_name,last_name,date_of_birth,sport,position,handedness,gender,height_cm,weight_kg,avatar_url,status,units_preference,weight_unit_preference,distance_unit_preference,theme_preference'
const ATHLETE_PROFILE_LEGACY_SELECT = 'id,user_id,coach_id,first_name,last_name,date_of_birth,sport,position,handedness,gender,height_cm,weight_kg,avatar_url,status,units_preference,theme_preference'
const COACH_PROFILE_FULL_SELECT = 'id,user_id,display_name,first_name,last_name,organization_name,bio,phone_number,avatar_url,weight_unit_preference,distance_unit_preference,theme_preference'
const COACH_PROFILE_COMPATIBILITY_SELECT = 'id,user_id,display_name,first_name,last_name,organization_name,bio,phone_number,avatar_url,theme_preference'
const COACH_PROFILE_LEGACY_SELECT = 'id,user_id,display_name,organization_name,bio'

function isLegacyAthleteProfileColumnError(error) {
  const message = String(error?.message || '')
  return message.includes('athlete_profiles.weight_unit_preference does not exist')
    || message.includes('athlete_profiles.distance_unit_preference does not exist')
    || message.includes('athlete_profiles.theme_preference does not exist')
}

function isMissingCoachPreferenceColumnError(error) {
  const message = String(error?.message || '')
  return message.includes('coach_profiles.weight_unit_preference does not exist')
    || message.includes('coach_profiles.distance_unit_preference does not exist')
    || message.includes('coach_profiles.theme_preference does not exist')
}

function isMissingLegacyCoachIdentityColumnError(error) {
  const message = String(error?.message || '')
  return message.includes('coach_profiles.phone_number does not exist')
    || message.includes('coach_profiles.avatar_url does not exist')
    || message.includes('coach_profiles.first_name does not exist')
    || message.includes('coach_profiles.last_name does not exist')
}

function mapBodyMetricLogRow(row) {
  if (!row) return null
  return {
    id: row.id,
    athleteId: row.athlete_id ?? null,
    coachId: row.coach_id ?? null,
    metricType: row.metric_type ?? null,
    value: row.value ?? null,
    unit: row.unit ?? null,
    recordedAt: row.recorded_at ?? null,
    source: row.source ?? null,
    notes: row.notes ?? null,
    progressPhotoUrl: row.progress_photo_url ?? null,
    createdAt: row.created_at ?? null,
  }
}

function createSupabaseIdentityRequest(config) {
  const baseUrl = config?.url
  const anonKey = config?.anonKey
  const accessToken = config?.accessToken || null
  const schema = config?.schema || 'public'
  const fetchImpl = requireFetch(config?.fetchImpl ?? globalThis.fetch)

  function resolveAccessToken() {
    return typeof accessToken === 'function' ? accessToken() : accessToken
  }

  if (!baseUrl) {
    throw new Error('Supabase REST identity repository requires a url')
  }

  if (!anonKey) {
    throw new Error('Supabase REST identity repository requires an anonKey')
  }

  return async function request({ method = 'GET', table, path, query = {}, body }) {
    const url = path
      ? new URL(path, baseUrl)
      : new URL(`/rest/v1/${table}`, baseUrl)

    for (const [key, value] of Object.entries(query)) {
      if (value == null || value === '') continue
      url.searchParams.set(key, value)
    }

    const response = await fetchImpl(url.toString(), {
      method,
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${resolveAccessToken() || anonKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Prefer: 'return=representation',
        'Accept-Profile': schema,
        'Content-Profile': schema,
      },
      body: body == null ? undefined : JSON.stringify(body),
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : null

    if (!response.ok) {
      const message = payload?.message || (typeof payload === 'string' && payload) || response.statusText || 'Unknown Supabase identity error'
      throw new Error(`Supabase identity request failed (${response.status}): ${message}`)
    }

    return payload
  }
}

function createSupabaseStorageUploader(config) {
  const baseUrl = config?.url
  const anonKey = config?.anonKey
  const accessToken = config?.accessToken || null
  const fetchImpl = requireFetch(config?.fetchImpl ?? globalThis.fetch)

  function resolveAccessToken() {
    return typeof accessToken === 'function' ? accessToken() : accessToken
  }

  if (!baseUrl) {
    throw new Error('Supabase storage uploader requires a url')
  }

  if (!anonKey) {
    throw new Error('Supabase storage uploader requires an anonKey')
  }

  return async function uploadObject({ bucket, objectPath, fileBuffer, contentType = 'application/octet-stream', upsert = true }) {
    const uploadUrl = new URL(`/storage/v1/object/${bucket}/${objectPath}`, baseUrl)
    const publicUrl = new URL(`/storage/v1/object/public/${bucket}/${objectPath}`, baseUrl)
    const normalizedBuffer = fileBuffer instanceof Uint8Array ? fileBuffer : new Uint8Array(fileBuffer)

    const response = await fetchImpl(uploadUrl.toString(), {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${resolveAccessToken() || anonKey}`,
        'Content-Type': contentType,
        'x-upsert': upsert ? 'true' : 'false',
      },
      body: normalizedBuffer,
    })

    const text = await response.text()
    const payload = text ? JSON.parse(text) : null

    if (!response.ok) {
      const message = payload?.message || (typeof payload === 'string' && payload) || response.statusText || 'Unknown Supabase storage error'
      throw new Error(`Supabase storage upload failed (${response.status}): ${message}`)
    }

    return {
      path: objectPath,
      publicUrl: publicUrl.toString(),
      payload,
    }
  }
}

export function createSupabaseRestIdentityRepository(config) {
  const request = createSupabaseIdentityRequest(config)
  const uploadObject = createSupabaseStorageUploader(config)

  return {
    async signInWithPassword({ email, password }) {
      const payload = await request({
        method: 'POST',
        path: '/auth/v1/token?grant_type=password',
        body: { email, password },
      })

      return {
        accessToken: payload?.access_token ?? null,
        refreshToken: payload?.refresh_token ?? null,
        user: payload?.user
          ? {
              id: payload.user.id,
              email: payload.user.email ?? null,
              role: payload.user.user_metadata?.role ?? payload.user.app_metadata?.role ?? null,
            }
          : null,
      }
    },
    async signUpWithPassword({ email, password, metadata = {} }) {
      const payload = await request({
        method: 'POST',
        path: '/auth/v1/signup',
        body: { email, password, data: metadata },
      })

      return {
        accessToken: payload?.access_token ?? null,
        refreshToken: payload?.refresh_token ?? null,
        user: payload?.user
          ? {
              id: payload.user.id,
              email: payload.user.email ?? null,
              role: payload.user.user_metadata?.role ?? payload.user.app_metadata?.role ?? null,
            }
          : null,
      }
    },
    async refreshSession({ refreshToken }) {
      if (!refreshToken) {
        throw new Error('Refresh session requires a refreshToken')
      }

      const payload = await request({
        method: 'POST',
        path: '/auth/v1/token?grant_type=refresh_token',
        body: { refresh_token: refreshToken },
      })

      return {
        accessToken: payload?.access_token ?? null,
        refreshToken: payload?.refresh_token ?? refreshToken,
        user: payload?.user
          ? {
              id: payload.user.id,
              email: payload.user.email ?? null,
              role: payload.user.user_metadata?.role ?? payload.user.app_metadata?.role ?? null,
            }
          : null,
      }
    },
    async resetPasswordForEmail({ email, redirectTo = null }) {
      await request({
        method: 'POST',
        path: '/auth/v1/recover',
        body: {
          email,
          ...(redirectTo ? { redirectTo } : {}),
        },
      })
      return { success: true }
    },
    async signOut() {
      if (!config?.accessToken) {
        return { success: true }
      }
      await request({ method: 'POST', path: '/auth/v1/logout' })
      return { success: true }
    },
    async updateAthleteProfile({ athleteId, updates = {} }) {
      if (!athleteId) {
        throw new Error('Athlete profile update requires an athleteId')
      }

      const body = {
        ...(updates.firstName != null ? { first_name: updates.firstName } : {}),
        ...(updates.lastName != null ? { last_name: updates.lastName } : {}),
        ...(updates.dateOfBirth != null ? { date_of_birth: updates.dateOfBirth } : {}),
        ...(updates.sport != null ? { sport: updates.sport } : {}),
        ...(updates.position != null ? { position: updates.position } : {}),
        ...(updates.handedness != null ? { handedness: updates.handedness } : {}),
        ...(updates.gender != null ? { gender: updates.gender } : {}),
        ...(updates.heightCm != null ? { height_cm: updates.heightCm } : {}),
        ...(updates.weightKg != null ? { weight_kg: updates.weightKg } : {}),
        ...(updates.avatarUrl != null ? { avatar_url: updates.avatarUrl } : {}),
        ...(updates.unitsPreference != null ? { units_preference: updates.unitsPreference } : {}),
        ...(updates.weightUnitPreference != null ? { weight_unit_preference: updates.weightUnitPreference } : {}),
        ...(updates.distanceUnitPreference != null ? { distance_unit_preference: updates.distanceUnitPreference } : {}),
        ...(updates.themePreference != null ? { theme_preference: updates.themePreference } : {}),
        ...(updates.status != null ? { status: updates.status } : {}),
      }

      try {
        const rows = await request({
          method: 'PATCH',
          table: 'athlete_profiles',
          query: {
            id: `eq.${athleteId}`,
            select: ATHLETE_PROFILE_FULL_SELECT,
          },
          body,
        })
        return mapAthleteProfileRow(rows?.[0])
      } catch (error) {
        if (!isLegacyAthleteProfileColumnError(error)) {
          throw error
        }

        const rows = await request({
          method: 'PATCH',
          table: 'athlete_profiles',
          query: {
            id: `eq.${athleteId}`,
            select: ATHLETE_PROFILE_LEGACY_SELECT,
          },
          body,
        })
        return mapAthleteProfileRow(rows?.[0])
      }
    },
    async updateCoachProfile({ coachId, updates = {} }) {
      if (!coachId) {
        throw new Error('Coach profile update requires a coachId')
      }

      const body = {
        ...(updates.displayName != null ? { display_name: updates.displayName } : {}),
        ...(updates.firstName != null ? { first_name: updates.firstName } : {}),
        ...(updates.lastName != null ? { last_name: updates.lastName } : {}),
        ...(updates.organizationName != null ? { organization_name: updates.organizationName } : {}),
        ...(updates.bio != null ? { bio: updates.bio } : {}),
        ...(updates.phoneNumber != null ? { phone_number: updates.phoneNumber } : {}),
        ...(updates.avatarUrl != null ? { avatar_url: updates.avatarUrl } : {}),
        ...(updates.weightUnitPreference != null ? { weight_unit_preference: updates.weightUnitPreference } : {}),
        ...(updates.distanceUnitPreference != null ? { distance_unit_preference: updates.distanceUnitPreference } : {}),
        ...(updates.themePreference != null ? { theme_preference: updates.themePreference } : {}),
      }

      try {
        const rows = await request({
          method: 'PATCH',
          table: 'coach_profiles',
          query: {
            id: `eq.${coachId}`,
            select: COACH_PROFILE_FULL_SELECT,
          },
          body,
        })
        return mapCoachProfileRow(rows?.[0])
      } catch (error) {
        const isMissingPreferenceColumn = isMissingCoachPreferenceColumnError(error)
        const isMissingLegacyIdentityColumn = isMissingLegacyCoachIdentityColumnError(error)

        if (!isMissingPreferenceColumn && !isMissingLegacyIdentityColumn) {
          throw error
        }

        const rows = await request({
          method: 'PATCH',
          table: 'coach_profiles',
          query: {
            id: `eq.${coachId}`,
            select: isMissingPreferenceColumn ? COACH_PROFILE_COMPATIBILITY_SELECT : COACH_PROFILE_LEGACY_SELECT,
          },
          body,
        })
        return mapCoachProfileRow(rows?.[0])
      }
    },
    async uploadCoachAvatar({ coachId, fileBuffer, contentType = 'image/jpeg', fileName = 'profile.jpg' }) {
      if (!coachId) {
        throw new Error('Coach avatar upload requires a coachId')
      }
      if (!fileBuffer) {
        throw new Error('Coach avatar upload requires a fileBuffer')
      }

      const safeFileName = String(fileName || 'profile.jpg').replace(/[^a-zA-Z0-9._-]/g, '-')
      return uploadObject({
        bucket: 'coach-avatars',
        objectPath: `${coachId}/${safeFileName}`,
        fileBuffer,
        contentType,
      })
    },
    async createBodyMetricLog({ athleteId, coachId, metricType, value, unit = null, recordedAt = null, source = 'coach_workspace', notes = '', progressPhotoUrl = null }) {
      if (!athleteId) {
        throw new Error('Body metric log requires an athleteId')
      }
      if (!metricType) {
        throw new Error('Body metric log requires a metricType')
      }
      if (value == null || value === '') {
        throw new Error('Body metric log requires a numeric value')
      }

      const rows = await request({
        method: 'POST',
        table: 'body_metric_logs',
        query: {
          select: 'id,athlete_id,coach_id,metric_type,value,unit,recorded_at,source,notes,progress_photo_url,created_at',
        },
        body: {
          athlete_id: athleteId,
          ...(coachId ? { coach_id: coachId } : {}),
          metric_type: metricType,
          value,
          ...(unit != null ? { unit } : {}),
          recorded_at: recordedAt || new Date().toISOString(),
          ...(source ? { source } : {}),
          ...(notes ? { notes } : {}),
          ...(progressPhotoUrl ? { progress_photo_url: progressPhotoUrl } : {}),
        },
      })

      return mapBodyMetricLogRow(rows?.[0])
    },
    async getLatestBodyMetricLog({ athleteId, metricType, source = null }) {
      if (!athleteId) {
        throw new Error('Body metric log lookup requires an athleteId')
      }
      if (!metricType) {
        throw new Error('Body metric log lookup requires a metricType')
      }

      const rows = await request({
        table: 'body_metric_logs',
        query: {
          athlete_id: `eq.${athleteId}`,
          metric_type: `eq.${metricType}`,
          ...(source ? { source: `eq.${source}` } : {}),
          order: 'recorded_at.desc',
          limit: '1',
          select: 'id,athlete_id,coach_id,metric_type,value,unit,recorded_at,source,notes,progress_photo_url,created_at',
        },
      })

      return mapBodyMetricLogRow(rows?.[0])
    },
    async getCurrentUser() {
      if (!config?.accessToken) {
        return null
      }
      const user = await request({ path: '/auth/v1/user' })
      return user
        ? {
            id: user.id,
            email: user.email ?? null,
            role: user.user_metadata?.role ?? user.app_metadata?.role ?? null,
            firstName: user.user_metadata?.first_name ?? user.app_metadata?.first_name ?? null,
            lastName: user.user_metadata?.last_name ?? user.app_metadata?.last_name ?? null,
          }
        : null
    },
    async getUserById(id) {
      if (!config?.accessToken) {
        return null
      }

      const currentUser = await request({ path: '/auth/v1/user' })
      if (!currentUser?.id || currentUser.id !== id) {
        return null
      }

      return {
        id: currentUser.id,
        email: currentUser.email ?? null,
        role: currentUser.user_metadata?.role ?? currentUser.app_metadata?.role ?? null,
        firstName: currentUser.user_metadata?.first_name ?? currentUser.app_metadata?.first_name ?? null,
        lastName: currentUser.user_metadata?.last_name ?? currentUser.app_metadata?.last_name ?? null,
        createdAt: currentUser.created_at ?? null,
        updatedAt: currentUser.updated_at ?? null,
      }
    },
    async getAthleteProfileById(id) {
      try {
        const rows = await request({
          table: 'athlete_profiles',
          query: {
            id: `eq.${id}`,
            select: ATHLETE_PROFILE_FULL_SELECT,
          },
        })
        return mapAthleteProfileRow(rows?.[0])
      } catch (error) {
        if (!isLegacyAthleteProfileColumnError(error)) {
          throw error
        }

        const rows = await request({
          table: 'athlete_profiles',
          query: {
            id: `eq.${id}`,
            select: ATHLETE_PROFILE_LEGACY_SELECT,
          },
        })
        return mapAthleteProfileRow(rows?.[0])
      }
    },
    async getCoachProfileByUserId(userId) {
      try {
        const rows = await request({
          table: 'coach_profiles',
          query: {
            user_id: `eq.${userId}`,
            select: COACH_PROFILE_FULL_SELECT,
          },
        })
        return mapCoachProfileRow(rows?.[0])
      } catch (error) {
        const isMissingPreferenceColumn = isMissingCoachPreferenceColumnError(error)
        const isMissingLegacyIdentityColumn = isMissingLegacyCoachIdentityColumnError(error)

        if (!isMissingPreferenceColumn && !isMissingLegacyIdentityColumn) {
          throw error
        }

        const rows = await request({
          table: 'coach_profiles',
          query: {
            user_id: `eq.${userId}`,
            select: isMissingPreferenceColumn ? COACH_PROFILE_COMPATIBILITY_SELECT : COACH_PROFILE_LEGACY_SELECT,
          },
        })
        return mapCoachProfileRow(rows?.[0])
      }
    },
    async getAthleteProfileByUserId(userId) {
      try {
        const rows = await request({
          table: 'athlete_profiles',
          query: {
            user_id: `eq.${userId}`,
            select: ATHLETE_PROFILE_FULL_SELECT,
          },
        })
        return mapAthleteProfileRow(rows?.[0])
      } catch (error) {
        if (!isLegacyAthleteProfileColumnError(error)) {
          throw error
        }

        const rows = await request({
          table: 'athlete_profiles',
          query: {
            user_id: `eq.${userId}`,
            select: ATHLETE_PROFILE_LEGACY_SELECT,
          },
        })
        return mapAthleteProfileRow(rows?.[0])
      }
    },
    async listAthleteProfilesForCoach(coachId) {
      try {
        const rows = await request({
          table: 'athlete_profiles',
          query: {
            coach_id: `eq.${coachId}`,
            order: 'first_name.asc',
            select: ATHLETE_PROFILE_FULL_SELECT,
          },
        })
        return Array.isArray(rows) ? rows.map(mapAthleteProfileRow).filter(Boolean) : []
      } catch (error) {
        if (!isLegacyAthleteProfileColumnError(error)) {
          throw error
        }

        const rows = await request({
          table: 'athlete_profiles',
          query: {
            coach_id: `eq.${coachId}`,
            order: 'first_name.asc',
            select: ATHLETE_PROFILE_LEGACY_SELECT,
          },
        })
        return Array.isArray(rows) ? rows.map(mapAthleteProfileRow).filter(Boolean) : []
      }
    },
  }
}

export function createIdentityRepository(db) {
  return {
    db,
    async getCurrentUser() {
      if (typeof db?.getCurrentUser === 'function') {
        return db.getCurrentUser()
      }
      return null
    },
    async getUserById(id) {
      if (typeof db?.getUserById === 'function') {
        return db.getUserById(id)
      }
      return { id, role: 'athlete' }
    },
    async getAthleteProfileById(id) {
      if (typeof db?.getAthleteProfileById === 'function') {
        return db.getAthleteProfileById(id)
      }
      return { id, userId: null }
    },
    async getCoachProfileByUserId(userId) {
      if (typeof db?.getCoachProfileByUserId === 'function') {
        return db.getCoachProfileByUserId(userId)
      }
      return null
    },
    async getAthleteProfileByUserId(userId) {
      if (typeof db?.getAthleteProfileByUserId === 'function') {
        return db.getAthleteProfileByUserId(userId)
      }
      return null
    },
    async listAthleteProfilesForCoach(coachId) {
      if (typeof db?.listAthleteProfilesForCoach === 'function') {
        return db.listAthleteProfilesForCoach(coachId)
      }
      return []
    },
    async updateCoachProfile({ coachId, updates = {} }) {
      if (typeof db?.updateCoachProfile === 'function') {
        return db.updateCoachProfile({ coachId, updates })
      }
      return { id: coachId, ...updates }
    },
    async updateAthleteProfile({ athleteId, updates = {} }) {
      if (typeof db?.updateAthleteProfile === 'function') {
        return db.updateAthleteProfile({ athleteId, updates })
      }
      return { id: athleteId, ...updates }
    },
  }
}
