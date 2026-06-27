import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  createAuthSessionController,
  createMemoryAuthStorage,
  getBootstrapFailureState,
  getInitialAuthSessionState,
  readStoredAuthSession,
  writeStoredAuthSession,
  clearStoredAuthSession,
} from '../apps/mobile/src/auth/session-provider.js'
import { createSupabaseMobileIdentityClient } from '../apps/mobile/src/train/session-runtime.js'

test('getInitialAuthSessionState returns a signed-out auth shell baseline', () => {
  assert.deepEqual(getInitialAuthSessionState(), {
    accessToken: null,
    refreshToken: null,
    currentUserId: null,
    currentAthleteId: null,
  })
})

test('createAuthSessionController updates and clears auth session state cleanly', () => {
  const controller = createAuthSessionController()

  assert.equal(controller.isAuthenticated(), false)

  const afterToken = controller.updateAuthSession({
    accessToken: 'user-token',
    refreshToken: 'refresh-token',
    currentUserId: 'user-1',
  })

  assert.equal(afterToken.accessToken, 'user-token')
  assert.equal(afterToken.refreshToken, 'refresh-token')
  assert.equal(afterToken.currentUserId, 'user-1')
  assert.equal(controller.isAuthenticated(), true)

  const afterAthlete = controller.updateAuthSession({ currentAthleteId: 'ath-1' })
  assert.equal(afterAthlete.currentAthleteId, 'ath-1')
  assert.equal(controller.getState().currentAthleteId, 'ath-1')

  const cleared = controller.clearAuthSession()
  assert.deepEqual(cleared, getInitialAuthSessionState())
  assert.equal(controller.isAuthenticated(), false)
})

test('createAuthSessionController can start from an injected auth session snapshot', () => {
  const controller = createAuthSessionController({
    accessToken: 'seed-token',
    currentUserId: 'user-9',
  })

  assert.equal(controller.getState().accessToken, 'seed-token')
  assert.equal(controller.getState().currentUserId, 'user-9')
  assert.equal(controller.isAuthenticated(), true)
})

test('auth session storage helpers persist, restore, and clear stored sessions', async () => {
  const storage = createMemoryAuthStorage()

  const written = await writeStoredAuthSession(storage, {
    accessToken: 'token-1',
    refreshToken: 'refresh-1',
    currentUserId: 'user-1',
    currentAthleteId: 'ath-1',
  })

  const restored = await readStoredAuthSession(storage)
  await clearStoredAuthSession(storage)
  const cleared = await readStoredAuthSession(storage)

  assert.equal(written.accessToken, 'token-1')
  assert.equal(restored.refreshToken, 'refresh-1')
  assert.equal(restored.currentAthleteId, 'ath-1')
  assert.deepEqual(cleared, getInitialAuthSessionState())
})

test('readStoredAuthSession falls back cleanly when persisted data is invalid JSON', async () => {
  const storage = createMemoryAuthStorage('not-json')
  const restored = await readStoredAuthSession(storage)
  assert.deepEqual(restored, getInitialAuthSessionState())
})

test('auth session SecureStore data persists only the minimal bootstrap resume shape', async () => {
  const storage = createMemoryAuthStorage()

  const written = await writeStoredAuthSession(storage, {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    currentUserId: 'user-1',
    currentAthleteId: 'ath-1',
    bootstrapState: { status: 'authenticated', trainState: { huge: true } },
    athleteProfile: { id: 'ath-1', firstName: 'Tony' },
    coachProfile: { id: 'coach-1' },
    trainState: { programWorkout: { id: 'pw-1' } },
    sessionStore: { getCurrentSession: 'not-serializable' },
    errorMessage: 'stale bootstrap error',
  })

  const rawStored = await storage.getItem()
  const persisted = JSON.parse(rawStored)

  assert.deepEqual(written, {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    currentUserId: 'user-1',
    currentAthleteId: 'ath-1',
  })
  assert.deepEqual(Object.keys(persisted).sort(), ['accessToken', 'currentAthleteId', 'currentUserId', 'refreshToken'].sort())
  assert.doesNotMatch(rawStored, /bootstrapState|athleteProfile|coachProfile|trainState|sessionStore|errorMessage/)
})

test('readStoredAuthSession normalizes legacy oversized SecureStore snapshots back to the bootstrap resume shape', async () => {
  const storage = createMemoryAuthStorage(JSON.stringify({
    accessToken: 'legacy-access-token',
    refreshToken: 'legacy-refresh-token',
    currentUserId: 'legacy-user',
    currentAthleteId: 'legacy-athlete',
    bootstrapState: { status: 'authenticated', trainState: { huge: true } },
    athleteProfile: { id: 'legacy-athlete', firstName: 'Tony' },
    trainState: { programWorkout: { id: 'pw-1' } },
    sessionStore: { currentSession: { id: 'session-1' } },
  }))

  const restored = await readStoredAuthSession(storage)

  assert.deepEqual(restored, {
    accessToken: 'legacy-access-token',
    refreshToken: 'legacy-refresh-token',
    currentUserId: 'legacy-user',
    currentAthleteId: 'legacy-athlete',
  })
})

test('getBootstrapFailureState converts bootstrap exceptions into a non-loading error shell', () => {
  const failureState = getBootstrapFailureState(new Error('coach bootstrap failed'))

  assert.equal(failureState.status, 'bootstrap_error')
  assert.equal(failureState.athleteProfile, null)
  assert.equal(failureState.trainState, null)
  assert.equal(failureState.sessionStore, null)
  assert.equal(failureState.errorMessage, 'coach bootstrap failed')
})

test('session provider keeps the live auth session ref in sync for same-tick post-auth mutations', () => {
  const providerSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/auth/session-provider.js'), 'utf8')

  assert.match(providerSource, /async updateAuthSession\(nextSession = \{\}\) \{[\s\S]*const mergedSession = \{ \.\.\.authSession, \.\.\.nextSession \}[\s\S]*authSessionRef\.current = mergedSession[\s\S]*setAuthSession\(mergedSession\)[\s\S]*writeStoredAuthSession/)
  assert.match(providerSource, /async updateAthleteProfile\(updates = \{\}\) \{[\s\S]*const currentAuthSession = authSessionRef\.current[\s\S]*const athleteId = bootstrapState\.athleteProfile\?\.id \|\| currentAuthSession\.currentAthleteId[\s\S]*accessToken: currentAuthSession\.accessToken/)
  assert.match(providerSource, /setBootstrapState\(\(current\) => \({[\s\S]*athleteProfile: updatedAthleteProfile[\s\S]*}\)\)/)
})

test('session provider preserves a freshly saved athlete avatar when the auth bootstrap finishes with an older athlete profile snapshot', () => {
  const providerSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/auth/session-provider.js'), 'utf8')

  assert.match(providerSource, /function mergeBootstrapAthleteProfile\(currentBootstrapState, nextBootstrapState\) \{[\s\S]*currentAthleteProfile\.avatarUrl[\s\S]*nextAthleteProfile\.avatarUrl[\s\S]*return \{[\s\S]*avatarUrl: currentAthleteProfile\.avatarUrl[\s\S]*}\s*}/)
  assert.match(providerSource, /setBootstrapState\(\(current\) => mergeBootstrapAthleteProfile\(current, nextBootstrapState\)\)/)
})

test('createSupabaseMobileIdentityClient supports forgot-password through the shared identity seam', async () => {
  const calls = []
  const identityClient = createSupabaseMobileIdentityClient({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method || 'GET' })
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return '{}'
        },
      }
    },
  })

  const result = await identityClient.resetPasswordForEmail({ email: 'athlete@example.com' })

  assert.equal(result.success, true)
  assert.equal(calls.some((call) => call.url.includes('/auth/v1/recover')), true)
})

test('createSupabaseMobileIdentityClient supports athlete profile updates through the shared identity seam', async () => {
  const calls = []
  const identityClient = createSupabaseMobileIdentityClient({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method || 'GET', body: options.body ? JSON.parse(options.body) : null })
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return JSON.stringify([{ id: 'ath-1', user_id: 'user-1', first_name: 'Anthony', gender: 'Male', height_cm: 183, weight_kg: 79, avatar_url: 'data:image/jpeg;base64,updated-avatar' }])
        },
      }
    },
  })

  const updated = await identityClient.updateAthleteProfile({
    athleteId: 'ath-1',
    updates: { firstName: 'Anthony', gender: 'Male', heightCm: 183, weightKg: 79, avatarUrl: 'data:image/jpeg;base64,updated-avatar' },
  })

  assert.equal(updated.firstName, 'Anthony')
  assert.equal(updated.heightCm, 183)
  assert.equal(updated.weightKg, 79)
  assert.equal(updated.avatarUrl, 'data:image/jpeg;base64,updated-avatar')
  assert.equal(calls.some((call) => call.method === 'PATCH' && call.url.includes('/rest/v1/athlete_profiles')), true)
})

test('createSupabaseMobileIdentityClient supports coach profile updates through the shared identity seam', async () => {
  const calls = []
  const identityClient = createSupabaseMobileIdentityClient({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl: async (url, options = {}) => {
      const contentType = options.headers?.['Content-Type'] || options.headers?.['content-type'] || null
      calls.push({ url: String(url), method: options.method || 'GET', contentType, body: options.body ? (contentType === 'application/json' ? JSON.parse(options.body) : options.body) : null })
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return JSON.stringify([{ id: 'coach-1', user_id: 'user-1', display_name: 'Anthony Fortugno', organization_name: 'PPLUS', bio: 'Head coach', phone_number: '555-2222', avatar_url: 'https://example.supabase.co/storage/v1/object/public/coach-avatars/coach-1/profile.jpg' }])
        },
      }
    },
  })

  const updated = await identityClient.updateCoachProfile({
    coachId: 'coach-1',
    updates: { displayName: 'Anthony Fortugno', phoneNumber: '555-2222', avatarUrl: 'https://example.supabase.co/storage/v1/object/public/coach-avatars/coach-1/profile.jpg' },
  })

  assert.equal(updated.displayName, 'Anthony Fortugno')
  assert.equal(updated.phoneNumber, '555-2222')
  assert.equal(updated.avatarUrl, 'https://example.supabase.co/storage/v1/object/public/coach-avatars/coach-1/profile.jpg')
  assert.equal(calls.some((call) => call.method === 'PATCH' && call.url.includes('/rest/v1/coach_profiles')), true)
})

test('createSupabaseMobileIdentityClient supports coach avatar uploads through the shared identity seam', async () => {
  const calls = []
  const identityClient = createSupabaseMobileIdentityClient({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl: async (url, options = {}) => {
      const contentType = options.headers?.['Content-Type'] || options.headers?.['content-type'] || null
      calls.push({ url: String(url), method: options.method || 'GET', contentType, body: options.body ?? null })
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return JSON.stringify({ Key: 'coach-avatars/coach-1/profile.jpg' })
        },
      }
    },
  })

  const uploaded = await identityClient.uploadCoachAvatar({
    coachId: 'coach-1',
    fileBuffer: new Uint8Array([1, 2, 3]),
    contentType: 'image/jpeg',
    fileName: 'profile.jpg',
  })

  assert.equal(uploaded.path, 'coach-1/profile.jpg')
  assert.equal(uploaded.publicUrl, 'https://example.supabase.co/storage/v1/object/public/coach-avatars/coach-1/profile.jpg')
  assert.equal(calls.some((call) => call.method === 'POST' && call.url.includes('/storage/v1/object/coach-avatars/coach-1/profile.jpg')), true)
})

test('createSupabaseMobileIdentityClient supports coach-side body metric writes through the shared identity seam', async () => {
  const calls = []
  const identityClient = createSupabaseMobileIdentityClient({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method || 'GET', body: options.body ? JSON.parse(options.body) : null })
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return JSON.stringify([{ id: 'metric-1', athlete_id: 'ath-1', coach_id: 'coach-1', metric_type: 'readiness', value: 82, unit: 'percent', source: 'coach_workspace', notes: 'Next action: log today\'s metrics', recorded_at: '2026-04-24T21:15:00.000Z', created_at: '2026-04-24T21:15:00.000Z' }])
        },
      }
    },
  })

  const created = await identityClient.createBodyMetricLog({
    athleteId: 'ath-1',
    coachId: 'coach-1',
    metricType: 'readiness',
    value: 82,
    unit: 'percent',
    source: 'coach_workspace',
    notes: 'Next action: log today\'s metrics',
    recordedAt: '2026-04-24T21:15:00.000Z',
  })

  assert.equal(created.metricType, 'readiness')
  assert.equal(created.value, 82)
  assert.equal(created.coachId, 'coach-1')
  assert.equal(calls.some((call) => call.method === 'POST' && call.url.includes('/rest/v1/body_metric_logs')), true)
})

test('createSupabaseMobileIdentityClient supports latest coach-side body metric reads through the shared identity seam', async () => {
  const calls = []
  const identityClient = createSupabaseMobileIdentityClient({
    supabaseUrl: 'https://example.supabase.co',
    supabaseAnonKey: 'anon-key',
    accessToken: 'coach-token',
    fetchImpl: async (url, options = {}) => {
      calls.push({ url: String(url), method: options.method || 'GET' })
      return {
        ok: true,
        status: 200,
        statusText: 'OK',
        async text() {
          return JSON.stringify([{ id: 'metric-2', athlete_id: 'ath-1', coach_id: 'coach-1', metric_type: 'readiness', value: 76, unit: 'percent', source: 'coach_workspace', notes: 'Shift today to recovery work', recorded_at: '2026-04-24T21:20:00.000Z', created_at: '2026-04-24T21:20:00.000Z' }])
        },
      }
    },
  })

  const latest = await identityClient.getLatestBodyMetricLog({ athleteId: 'ath-1', metricType: 'readiness', source: 'coach_workspace' })

  assert.equal(latest.metricType, 'readiness')
  assert.equal(latest.value, 76)
  assert.equal(latest.notes, 'Shift today to recovery work')
  assert.equal(calls.some((call) => call.method === 'GET' && call.url.includes('/rest/v1/body_metric_logs')), true)
})
