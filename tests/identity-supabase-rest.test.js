import test from 'node:test'
import assert from 'node:assert/strict'

import { createSupabaseRestIdentityRepository } from '../packages/data/src/identity/index.js'

function createIdentityFetchStub() {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const contentType = options.headers?.['Content-Type'] || options.headers?.['content-type'] || null
    calls.push({
      url: parsedUrl.toString(),
      method: options.method || 'GET',
      contentType,
      body: options.body
        ? (contentType === 'application/json' ? JSON.parse(options.body) : options.body)
        : null,
    })

    if (parsedUrl.pathname === '/auth/v1/token') {
      return json({
        access_token: 'token-1',
        refresh_token: 'refresh-1',
        user: { id: 'user-1', email: 'athlete@example.com', user_metadata: { role: 'athlete' } },
      })
    }

    if (parsedUrl.pathname === '/auth/v1/signup') {
      return json({
        access_token: 'signup-token',
        refresh_token: 'signup-refresh',
        user: { id: 'user-2', email: 'new-athlete@example.com', user_metadata: { role: 'athlete' } },
      })
    }

    if (parsedUrl.pathname === '/auth/v1/recover') {
      return json({})
    }

    if (parsedUrl.pathname === '/auth/v1/logout') {
      return json({})
    }

    if (parsedUrl.pathname === '/auth/v1/user') {
      return json({ id: 'user-1', email: 'athlete@example.com', user_metadata: { role: 'athlete' } })
    }

    const table = parsedUrl.pathname.split('/').at(-1)

    if (table === 'users') {
      return json([{ id: 'user-1', email: 'athlete@example.com', role: 'athlete' }])
    }

    if (table === 'coach_profiles' && parsedUrl.searchParams.get('user_id') === 'eq.user-1') {
      return json([{ id: 'coach-1', user_id: 'user-1', display_name: 'Anthony Fortugno', first_name: 'Anthony', last_name: 'Fortugno', organization_name: 'PPLUS', bio: 'Head coach', phone_number: '555-0100', avatar_url: 'https://cdn.example.com/avatar-coach.png', weight_unit_preference: 'lb', distance_unit_preference: 'km', theme_preference: 'dark' }])
    }

    if (table === 'athlete_profiles' && parsedUrl.searchParams.get('user_id') === 'eq.user-1') {
      return json([{ id: 'ath-1', user_id: 'user-1', coach_id: 'coach-1', first_name: 'Tony', last_name: 'F', date_of_birth: '2011-01-01', sport: 'Hockey', position: 'Forward', handedness: 'Left', gender: 'Male', height_cm: 180, weight_kg: 77, avatar_url: 'https://cdn.example.com/avatar-tony.png', status: 'active', units_preference: 'metric', weight_unit_preference: 'kg', distance_unit_preference: 'km', theme_preference: 'light' }])
    }

    if (table === 'coach_profiles' && parsedUrl.searchParams.get('id') === 'eq.coach-1' && (options.method || 'GET') === 'PATCH') {
      const body = options.body ? JSON.parse(options.body) : {}
      return json([{ id: 'coach-1', user_id: 'user-1', display_name: body.display_name ?? 'Anthony Fortugno', first_name: body.first_name ?? 'Anthony', last_name: body.last_name ?? 'Fortugno', organization_name: body.organization_name ?? 'PPLUS', bio: body.bio ?? 'Head coach', phone_number: body.phone_number ?? '555-0100', avatar_url: body.avatar_url ?? 'https://cdn.example.com/avatar-coach.png', weight_unit_preference: body.weight_unit_preference ?? 'lb', distance_unit_preference: body.distance_unit_preference ?? 'km', theme_preference: body.theme_preference ?? 'dark' }])
    }

    if (table === 'athlete_profiles' && parsedUrl.searchParams.get('id') === 'eq.ath-1' && (options.method || 'GET') === 'PATCH') {
      const body = options.body ? JSON.parse(options.body) : {}
      return json([{ id: 'ath-1', user_id: 'user-1', coach_id: 'coach-1', first_name: body.first_name ?? 'Tony', last_name: body.last_name ?? 'F', date_of_birth: body.date_of_birth ?? '2011-01-01', sport: body.sport ?? 'Hockey', position: body.position ?? 'Forward', handedness: body.handedness ?? 'Left', gender: body.gender ?? 'Male', height_cm: body.height_cm ?? 180, weight_kg: body.weight_kg ?? 77, avatar_url: body.avatar_url ?? 'https://cdn.example.com/avatar-tony.png', status: body.status ?? 'active', units_preference: body.units_preference ?? 'metric', weight_unit_preference: body.weight_unit_preference ?? 'kg', distance_unit_preference: body.distance_unit_preference ?? 'km', theme_preference: body.theme_preference ?? 'light' }])
    }

    if (table === 'body_metric_logs' && (options.method || 'GET') === 'POST') {
      const body = options.body ? JSON.parse(options.body) : {}
      return json([{ id: 'metric-1', athlete_id: body.athlete_id, coach_id: body.coach_id, metric_type: body.metric_type, value: body.value, unit: body.unit, recorded_at: body.recorded_at, source: body.source, notes: body.notes, progress_photo_url: body.progress_photo_url ?? null, created_at: '2026-04-24T21:15:00.000Z' }])
    }

    if (table === 'body_metric_logs' && (options.method || 'GET') === 'GET') {
      return json([{ id: 'metric-2', athlete_id: 'ath-1', coach_id: 'coach-1', metric_type: 'readiness', value: 82, unit: 'percent', recorded_at: '2026-04-24T21:20:00.000Z', source: 'coach_workspace', notes: 'Recover hard today', progress_photo_url: null, created_at: '2026-04-24T21:20:00.000Z' }])
    }

    if (parsedUrl.pathname.includes('/storage/v1/object/coach-avatars/') && (options.method || 'GET') === 'POST') {
      return json({ Key: 'coach-avatars/coach-1/profile.jpg' })
    }

    if (table === 'athlete_profiles' && parsedUrl.searchParams.get('id') === 'eq.ath-1') {
      return json([{ id: 'ath-1', user_id: 'user-1', coach_id: 'coach-1', first_name: 'Tony', last_name: 'F', date_of_birth: '2011-01-01', sport: 'Hockey', position: 'Forward', handedness: 'Left', gender: 'Male', height_cm: 180, weight_kg: 77, avatar_url: 'https://cdn.example.com/avatar-tony.png', status: 'active', units_preference: 'metric', weight_unit_preference: 'kg', distance_unit_preference: 'km', theme_preference: 'light' }])
    }

    throw new Error(`Unexpected identity request: ${parsedUrl.toString()}`)
  }

  return { fetchImpl, calls }
}

function json(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'ERROR',
    async text() {
      return JSON.stringify(payload)
    },
  }
}

test('createSupabaseRestIdentityRepository resolves current user and athlete profile through Supabase REST', async () => {
  const { fetchImpl, calls } = createIdentityFetchStub()
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl,
  })

  const currentUser = await repo.getCurrentUser()
  const athleteProfile = await repo.getAthleteProfileByUserId(currentUser.id)

  assert.equal(currentUser.id, 'user-1')
  assert.equal(athleteProfile.id, 'ath-1')
  assert.equal(calls[0].url.includes('/auth/v1/user'), true)
})

test('createSupabaseRestIdentityRepository can sign in, sign up, reset password, and sign out through Supabase auth endpoints', async () => {
  const { fetchImpl, calls } = createIdentityFetchStub()
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl,
  })

  const signedIn = await repo.signInWithPassword({ email: 'athlete@example.com', password: 'secret' })
  const signedUp = await repo.signUpWithPassword({ email: 'new-athlete@example.com', password: 'secret', metadata: { first_name: 'New' } })
  const reset = await repo.resetPasswordForEmail({ email: 'athlete@example.com' })
  const signedOut = await repo.signOut()

  assert.equal(signedIn.accessToken, 'token-1')
  assert.equal(signedIn.refreshToken, 'refresh-1')
  assert.equal(signedIn.user.id, 'user-1')
  assert.equal(signedUp.accessToken, 'signup-token')
  assert.equal(signedUp.user.id, 'user-2')
  assert.equal(reset.success, true)
  assert.equal(signedOut.success, true)
  assert.equal(calls.some((call) => call.url.includes('/auth/v1/token?grant_type=password')), true)
  assert.equal(calls.some((call) => call.url.includes('/auth/v1/signup')), true)
  assert.equal(calls.some((call) => call.url.includes('/auth/v1/recover')), true)
  assert.equal(calls.some((call) => call.url.includes('/auth/v1/logout')), true)
})

test('createSupabaseRestIdentityRepository can resolve the authenticated user through Supabase auth and fetch athlete profiles by id', async () => {
  const { fetchImpl, calls } = createIdentityFetchStub()
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl,
  })

  const user = await repo.getUserById('user-1')
  const athleteProfile = await repo.getAthleteProfileById('ath-1')

  assert.equal(user.role, 'athlete')
  assert.equal(user.id, 'user-1')
  assert.equal(calls.some((call) => call.url.includes('/rest/v1/users')), false)
  assert.equal(calls.some((call) => call.url.includes('/auth/v1/user')), true)
  assert.equal(athleteProfile.userId, 'user-1')
  assert.equal(athleteProfile.firstName, 'Tony')
  assert.equal(athleteProfile.dateOfBirth, '2011-01-01')
  assert.equal(athleteProfile.sport, 'Hockey')
  assert.equal(athleteProfile.position, 'Forward')
  assert.equal(athleteProfile.handedness, 'Left')
  assert.equal(athleteProfile.gender, 'Male')
  assert.equal(athleteProfile.heightCm, 180)
  assert.equal(athleteProfile.weightKg, 77)
  assert.equal(athleteProfile.avatarUrl, 'https://cdn.example.com/avatar-tony.png')
  assert.equal(athleteProfile.unitsPreference, 'metric')
  assert.equal(athleteProfile.weightUnitPreference, 'kg')
  assert.equal(athleteProfile.distanceUnitPreference, 'km')
  assert.equal(athleteProfile.themePreference, 'light')
})

test('createSupabaseRestIdentityRepository can update coach profiles through Supabase REST', async () => {
  const { fetchImpl, calls } = createIdentityFetchStub()
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl,
  })

  const coachProfile = await repo.getCoachProfileByUserId('user-1')
  const updatedCoachProfile = await repo.updateCoachProfile({
    coachId: coachProfile.id,
    updates: {
      displayName: 'Anthony Fortugno',
      firstName: 'Anthony',
      lastName: 'Fortugno',
      phoneNumber: '555-2222',
      avatarUrl: 'https://example.supabase.co/storage/v1/object/public/coach-avatars/coach-1/profile.jpg',
      themePreference: 'light',
    },
  })

  assert.equal(coachProfile.displayName, 'Anthony Fortugno')
  assert.equal(coachProfile.firstName, 'Anthony')
  assert.equal(coachProfile.lastName, 'Fortugno')
  assert.equal(coachProfile.phoneNumber, '555-0100')
  assert.equal(coachProfile.themePreference, 'dark')
  assert.equal(updatedCoachProfile.displayName, 'Anthony Fortugno')
  assert.equal(updatedCoachProfile.firstName, 'Anthony')
  assert.equal(updatedCoachProfile.lastName, 'Fortugno')
  assert.equal(updatedCoachProfile.phoneNumber, '555-2222')
  assert.equal(updatedCoachProfile.avatarUrl, 'https://example.supabase.co/storage/v1/object/public/coach-avatars/coach-1/profile.jpg')
  assert.equal(updatedCoachProfile.themePreference, 'light')
  assert.equal(calls.some((call) => call.method === 'PATCH' && call.url.includes('/rest/v1/coach_profiles')), true)
})

test('createSupabaseRestIdentityRepository can upload coach avatars to Supabase Storage and return a public URL', async () => {
  const { fetchImpl, calls } = createIdentityFetchStub()
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl,
  })

  const uploaded = await repo.uploadCoachAvatar({
    coachId: 'coach-1',
    fileBuffer: new Uint8Array([1, 2, 3, 4]),
    contentType: 'image/jpeg',
    fileName: 'profile.jpg',
  })

  const uploadCall = calls.find((call) => call.method === 'POST' && call.url.includes('/storage/v1/object/coach-avatars/coach-1/profile.jpg'))
  assert.equal(uploaded.path, 'coach-1/profile.jpg')
  assert.equal(uploaded.publicUrl, 'https://example.supabase.co/storage/v1/object/public/coach-avatars/coach-1/profile.jpg')
  assert.equal(uploadCall.contentType, 'image/jpeg')
})

test('createSupabaseRestIdentityRepository falls back to legacy coach profile fields when phone and avatar columns are not live yet', async () => {
  const calls = []
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl: async (url) => {
      const parsedUrl = new URL(url)
      calls.push(parsedUrl.toString())

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && parsedUrl.searchParams.get('user_id') === 'eq.user-1') {
        const select = parsedUrl.searchParams.get('select') || ''
        if (select.includes('phone_number') || select.includes('avatar_url')) {
          return json({ message: "column coach_profiles.phone_number does not exist" }, 400)
        }

        return json([{ id: 'coach-1', user_id: 'user-1', display_name: 'Anthony Fortugno', organization_name: 'PPLUS', bio: 'Head coach' }])
      }

      throw new Error(`Unexpected identity request: ${parsedUrl.toString()}`)
    },
  })

  const coachProfile = await repo.getCoachProfileByUserId('user-1')

  assert.equal(coachProfile.id, 'coach-1')
  assert.equal(coachProfile.displayName, 'Anthony Fortugno')
  assert.equal(coachProfile.firstName, null)
  assert.equal(coachProfile.lastName, null)
  assert.equal(coachProfile.phoneNumber, null)
  assert.equal(coachProfile.avatarUrl, null)
  assert.equal(calls.length, 2)
  assert.equal(calls[0].includes('phone_number'), true)
  assert.equal(calls[1].includes('phone_number'), false)
})

test('createSupabaseRestIdentityRepository keeps coach phone and avatar when only preference columns are missing', async () => {
  const calls = []
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl: async (url) => {
      const parsedUrl = new URL(url)
      calls.push(parsedUrl.toString())

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && parsedUrl.searchParams.get('user_id') === 'eq.user-1') {
        const select = parsedUrl.searchParams.get('select') || ''
        if (select.includes('weight_unit_preference')) {
          return json({ message: "column coach_profiles.weight_unit_preference does not exist" }, 400)
        }

        return json([{ id: 'coach-1', user_id: 'user-1', display_name: 'Anthony Fortugno', first_name: 'Anthony', last_name: 'Fortugno', organization_name: 'PPLUS', bio: 'Head coach', phone_number: '555-0100', avatar_url: 'https://cdn.example.com/avatar-coach.png' }])
      }

      throw new Error(`Unexpected identity request: ${parsedUrl.toString()}`)
    },
  })

  const coachProfile = await repo.getCoachProfileByUserId('user-1')

  assert.equal(coachProfile.id, 'coach-1')
  assert.equal(coachProfile.firstName, 'Anthony')
  assert.equal(coachProfile.lastName, 'Fortugno')
  assert.equal(coachProfile.phoneNumber, '555-0100')
  assert.equal(coachProfile.avatarUrl, 'https://cdn.example.com/avatar-coach.png')
  assert.equal(calls.length, 2)
  assert.equal(calls[0].includes('weight_unit_preference'), true)
  assert.equal(calls[1].includes('phone_number'), true)
  assert.equal(calls[1].includes('weight_unit_preference'), false)
})

test('createSupabaseRestIdentityRepository keeps coach theme updates working when coach preference columns are missing', async () => {
  const calls = []
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl: async (url, init = {}) => {
      const parsedUrl = new URL(url)
      calls.push({ method: init?.method || 'GET', url: parsedUrl.toString(), body: init?.body ? JSON.parse(init.body) : null })

      if (parsedUrl.pathname === '/rest/v1/coach_profiles' && parsedUrl.searchParams.get('id') === 'eq.coach-1') {
        const select = parsedUrl.searchParams.get('select') || ''
        if (select.includes('weight_unit_preference') || select.includes('distance_unit_preference')) {
          return json({ message: "column coach_profiles.distance_unit_preference does not exist" }, 400)
        }

        return json([{ id: 'coach-1', user_id: 'user-1', display_name: 'Anthony Fortugno', first_name: 'Anthony', last_name: 'Fortugno', organization_name: 'PPLUS', bio: 'Head coach', phone_number: '555-0100', avatar_url: 'https://cdn.example.com/avatar-coach.png', theme_preference: 'light' }])
      }

      throw new Error(`Unexpected identity request: ${parsedUrl.toString()}`)
    },
  })

  const updatedCoachProfile = await repo.updateCoachProfile({
    coachId: 'coach-1',
    updates: {
      themePreference: 'light',
    },
  })

  assert.equal(updatedCoachProfile.themePreference, 'light')
  assert.equal(updatedCoachProfile.phoneNumber, '555-0100')
  assert.equal(updatedCoachProfile.avatarUrl, 'https://cdn.example.com/avatar-coach.png')
  assert.equal(calls.length, 2)
  assert.equal(calls[0].method, 'PATCH')
  assert.equal(calls[0].body.theme_preference, 'light')
  assert.equal(calls[0].url.includes('distance_unit_preference'), true)
  assert.equal(calls[1].url.includes('distance_unit_preference'), false)
  assert.equal(calls[1].url.includes('phone_number'), true)
})

test('createSupabaseRestIdentityRepository falls back to legacy athlete update select when newer preference columns are missing', async () => {
  const calls = []
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'athlete-token',
    fetchImpl: async (url, init = {}) => {
      const parsedUrl = new URL(url)
      calls.push({ method: init?.method || 'GET', url: parsedUrl.toString(), body: init?.body ? JSON.parse(init.body) : null })

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && parsedUrl.searchParams.get('id') === 'eq.ath-1') {
        const select = parsedUrl.searchParams.get('select') || ''
        if (select.includes('weight_unit_preference') || select.includes('distance_unit_preference')) {
          return json({ message: "column athlete_profiles.weight_unit_preference does not exist" }, 400)
        }

        return json([{ id: 'ath-1', user_id: 'user-1', coach_id: 'coach-1', first_name: 'Tony', last_name: 'F', date_of_birth: '2011-01-01', sport: 'Hockey', position: 'Forward', handedness: 'Left', gender: 'Male', height_cm: 180, weight_kg: 77, avatar_url: 'https://cdn.example.com/avatar-tony.png', status: 'active', units_preference: 'metric', theme_preference: 'light' }])
      }

      throw new Error(`Unexpected identity request: ${parsedUrl.toString()}`)
    },
  })

  const updatedAthleteProfile = await repo.updateAthleteProfile({
    athleteId: 'ath-1',
    updates: {
      themePreference: 'light',
    },
  })

  assert.equal(updatedAthleteProfile.themePreference, 'light')
  assert.equal(updatedAthleteProfile.weightUnitPreference, null)
  assert.equal(updatedAthleteProfile.distanceUnitPreference, null)
  assert.equal(calls.length, 2)
  assert.equal(calls[0].method, 'PATCH')
  assert.equal(calls[0].body.theme_preference, 'light')
  assert.equal(calls[0].url.includes('weight_unit_preference'), true)
  assert.equal(calls[1].url.includes('weight_unit_preference'), false)
})

test('createSupabaseRestIdentityRepository falls back to legacy athlete profile fields when unit preference columns are not live yet', async () => {
  const calls = []
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'athlete-token',
    fetchImpl: async (url) => {
      const parsedUrl = new URL(url)
      calls.push(parsedUrl.toString())

      if (parsedUrl.pathname === '/rest/v1/athlete_profiles' && parsedUrl.searchParams.get('user_id') === 'eq.user-1') {
        const select = parsedUrl.searchParams.get('select') || ''

        if (select.includes('weight_unit_preference') || select.includes('distance_unit_preference')) {
          return json({ message: "column athlete_profiles.weight_unit_preference does not exist" }, 400)
        }

        return json([{ id: 'ath-1', user_id: 'user-1', coach_id: 'coach-1', first_name: 'Tony', last_name: 'F', date_of_birth: '2011-01-01', sport: 'Hockey', position: 'Forward', handedness: 'Left', gender: 'Male', height_cm: 180, weight_kg: 77, avatar_url: 'https://cdn.example.com/avatar-tony.png', status: 'active', units_preference: 'metric', theme_preference: 'light' }])
      }

      throw new Error(`Unexpected identity request: ${parsedUrl.toString()}`)
    },
  })

  const athleteProfile = await repo.getAthleteProfileByUserId('user-1')

  assert.equal(athleteProfile.id, 'ath-1')
  assert.equal(athleteProfile.firstName, 'Tony')
  assert.equal(athleteProfile.lastName, 'F')
  assert.equal(athleteProfile.unitsPreference, 'metric')
  assert.equal(athleteProfile.weightUnitPreference, null)
  assert.equal(athleteProfile.distanceUnitPreference, null)
  assert.equal(athleteProfile.themePreference, 'light')
  assert.equal(calls.length, 2)
  assert.equal(calls[0].includes('weight_unit_preference'), true)
  assert.equal(calls[1].includes('weight_unit_preference'), false)
})

test('createSupabaseRestIdentityRepository can write coach-side body metric logs through Supabase REST', async () => {
  const { fetchImpl, calls } = createIdentityFetchStub()
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl,
  })

  const created = await repo.createBodyMetricLog({
    athleteId: 'ath-1',
    coachId: 'coach-1',
    metricType: 'readiness',
    value: 82,
    unit: 'percent',
    source: 'coach_workspace',
    notes: 'Next action: log today\'s metrics',
    recordedAt: '2026-04-24T21:15:00.000Z',
  })

  const insertCall = calls.find((call) => call.method === 'POST' && call.url.includes('/rest/v1/body_metric_logs'))
  assert.equal(created.athleteId, 'ath-1')
  assert.equal(created.coachId, 'coach-1')
  assert.equal(created.metricType, 'readiness')
  assert.equal(created.value, 82)
  assert.equal(created.unit, 'percent')
  assert.equal(created.source, 'coach_workspace')
  assert.equal(created.notes, 'Next action: log today\'s metrics')
  assert.equal(insertCall.body.athlete_id, 'ath-1')
  assert.equal(insertCall.body.coach_id, 'coach-1')
  assert.equal(insertCall.body.metric_type, 'readiness')
  assert.equal(insertCall.body.value, 82)
  assert.equal(insertCall.body.unit, 'percent')
  assert.equal(insertCall.body.recorded_at, '2026-04-24T21:15:00.000Z')
})

test('createSupabaseRestIdentityRepository can read the latest coach-side body metric log for an athlete through Supabase REST', async () => {
  const { fetchImpl, calls } = createIdentityFetchStub()
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl,
  })

  const latestLog = await repo.getLatestBodyMetricLog({
    athleteId: 'ath-1',
    metricType: 'readiness',
    source: 'coach_workspace',
  })

  const readCall = calls.find((call) => call.method === 'GET' && call.url.includes('/rest/v1/body_metric_logs'))
  assert.equal(latestLog.athleteId, 'ath-1')
  assert.equal(latestLog.coachId, 'coach-1')
  assert.equal(latestLog.metricType, 'readiness')
  assert.equal(latestLog.value, 82)
  assert.equal(latestLog.notes, 'Recover hard today')
  assert.equal(readCall.url.includes('athlete_id=eq.ath-1'), true)
  assert.equal(readCall.url.includes('metric_type=eq.readiness'), true)
  assert.equal(readCall.url.includes('source=eq.coach_workspace'), true)
  assert.equal(readCall.url.includes('limit=1'), true)
})

test('createSupabaseRestIdentityRepository resolves function access tokens before issuing authenticated requests', async () => {
  const authorizationHeaders = []
  const repo = createSupabaseRestIdentityRepository({
    url: 'https://example.supabase.co',
    anonKey: 'anon-key',
    accessToken: () => 'live-user-token',
    fetchImpl: async (url, options = {}) => {
      authorizationHeaders.push(options.headers?.Authorization ?? null)
      const parsedUrl = new URL(url)

      if (parsedUrl.pathname === '/auth/v1/user') {
        return json({ id: 'user-1', email: 'athlete@example.com', user_metadata: { role: 'athlete' } })
      }

      throw new Error(`Unexpected identity request: ${parsedUrl.toString()}`)
    },
  })

  const currentUser = await repo.getCurrentUser()

  assert.equal(currentUser.id, 'user-1')
  assert.deepEqual(authorizationHeaders, ['Bearer live-user-token'])
})
