import test from 'node:test'
import assert from 'node:assert/strict'
import { createMobileAppBootstrap, getBootstrapSurfaceModel } from '../apps/mobile/src/auth/bootstrap.js'
import { getAssignedProgramWorkoutIdForDate } from '../apps/mobile/src/train/assigned-program-workout-id.js'

function createBootstrapFetchStub({ includeWorkout = true, role = 'athlete' } = {}) {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    calls.push({ path: parsedUrl.pathname, table, method: options.method || 'GET', query: parsedUrl.search })

    if (parsedUrl.pathname === '/auth/v1/user') {
      return json({ id: 'user-1', email: `${role}@example.com`, user_metadata: { role } })
    }

    if (table === 'coach_profiles') {
      return json(role === 'coach' ? [{ id: 'coach-1', user_id: 'user-1', display_name: 'Coach Tony', organization_name: 'PPLUS', bio: 'Head coach' }] : [])
    }

    if (table === 'athlete_profiles') {
      if (role === 'coach' && parsedUrl.searchParams.get('coach_id') === 'eq.coach-1') {
        return json([
          { id: 'ath-1', user_id: 'user-ath-1', coach_id: 'coach-1', first_name: 'Thomas', last_name: 'Thibault', date_of_birth: '2011-01-01', sport: 'Hockey', position: 'Forward', handedness: 'Left', gender: 'Male', height_cm: 180, weight_kg: 77, avatar_url: 'https://cdn.example.com/avatar-tony.png', status: 'active' },
          { id: 'ath-2', user_id: 'user-ath-2', coach_id: 'coach-1', first_name: 'Mia', last_name: 'Chen', date_of_birth: '2010-04-15', sport: 'Hockey', position: 'Forward', handedness: 'Right', gender: 'Female', height_cm: 168, weight_kg: 60, avatar_url: '', status: 'active' },
        ])
      }
      return json(role === 'coach' ? [] : [{ id: 'ath-1', user_id: 'user-1', first_name: 'Tony', last_name: 'F', date_of_birth: '2011-01-01', sport: 'Hockey', position: 'Forward', handedness: 'Left', gender: 'Male', height_cm: 180, weight_kg: 77, avatar_url: 'https://cdn.example.com/avatar-tony.png', status: 'active' }])
    }

    if (table === 'athlete_groups') {
      return json(role === 'coach' ? [
        { id: 'group-speed', coach_id: 'coach-1', name: 'Speed Group', description: 'Acceleration work', access_level: 'private', status: 'active', created_at: '2026-05-01T00:00:00.000Z', updated_at: '2026-05-02T00:00:00.000Z' },
        { id: 'group-edge', coach_id: 'coach-1', name: 'Edge Group', description: '', access_level: 'private', status: 'active', created_at: '2026-05-03T00:00:00.000Z', updated_at: '2026-05-04T00:00:00.000Z' },
      ] : [])
    }

    if (table === 'athlete_group_memberships') {
      return json(role === 'coach' ? [
        { id: 'membership-1', athlete_group_id: 'group-speed', athlete_id: 'ath-1' },
        { id: 'membership-2', athlete_group_id: 'group-speed', athlete_id: 'ath-2' },
        { id: 'membership-3', athlete_group_id: 'group-edge', athlete_id: 'ath-2' },
      ] : [])
    }

    if (table === 'program_days') {
      if (parsedUrl.searchParams.get('program_week_id')) {
        return json(includeWorkout ? [{ id: 'day-1', program_week_id: 'week-1', day_index: 2, date: '2026-04-21', name: 'Lower A', notes: '', status: 'training' }] : [])
      }
      return json(includeWorkout ? [{ id: 'day-1', date: '2026-04-21' }] : [])
    }

    if (table === 'programs') {
      return json([{ id: 'prog-1', athlete_id: 'ath-1', coach_id: 'coach-1', name: 'Training Program', description: '', start_date: '2026-04-21', end_date: '2026-04-27', status: 'active' }])
    }

    if (table === 'program_weeks') {
      return json([{ id: 'week-1', program_id: 'prog-1', week_index: 1, name: 'Week 1', start_date: '2026-04-21', end_date: '2026-04-27' }])
    }

    if (table === 'program_workouts') {
      return json(includeWorkout ? [{
        id: 'pw-1',
        athlete_id: 'ath-1',
        coach_id: 'coach-1',
        program_id: 'prog-1',
        program_day_id: 'day-1',
        workout_template_id: 'tpl-1',
        name_snapshot: 'Lower A',
        status: 'scheduled',
        sort_order: 1,
      }] : [])
    }

    if (table === 'program_workout_exercises') {
      return json([{ id: 'pwe-1', program_workout_id: 'pw-1', exercise_id: 'ex-1', name_snapshot: 'Front Squat', sort_order: 1, notes: '', default_rest_seconds: 120 }])
    }

    if (table === 'program_workout_sets') {
      return json([{ id: 'pws-1', program_workout_exercise_id: 'pwe-1', sort_order: 1, set_type: 'straight', target_reps: 8, target_load: 135, target_load_unit: 'lb', target_rest_seconds: 120, notes: '' }])
    }

    if (table === 'workout_sessions' || table === 'workout_session_exercises' || table === 'workout_session_sets') {
      return json([])
    }

    throw new Error(`Unexpected bootstrap request: ${parsedUrl.toString()}`)
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

test('getAssignedProgramWorkoutIdForDate returns the first scheduled workout id for the matching assigned-program day', () => {
  assert.equal(
    getAssignedProgramWorkoutIdForDate({
      weeks: [{
        days: [
          { date: '2026-04-20', workouts: [{ id: 'pw-other' }] },
          { date: '2026-04-21', workouts: [{ id: 'pw-1' }, { id: 'pw-2' }] },
        ],
      }],
    }, '2026-04-21'),
    'pw-1'
  )
  assert.equal(
    getAssignedProgramWorkoutIdForDate({ weeks: [{ days: [{ date: '2026-04-21', workouts: [] }] }] }, '2026-04-21'),
    null
  )
})

test('createMobileAppBootstrap returns signed out when Supabase env is missing instead of entering demo mode', async () => {
  const bootstrap = await createMobileAppBootstrap({ env: {}, previewState: 'planned' })

  assert.equal(bootstrap.status, 'signed_out')
  assert.equal(bootstrap.trainState, null)
  assert.equal(bootstrap.sessionStore, null)
})

test('createMobileAppBootstrap can force an authenticated train/home preview override for runtime verification', async () => {
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
      EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE: 'authenticated_train_preview',
    },
    previewState: 'planned',
  })

  assert.equal(bootstrap.status, 'authenticated')
  assert.equal(bootstrap.athleteProfile.id, 'preview-athlete')
  assert.equal(bootstrap.trainState.programWorkout.id, 'pw-lower-a')
  assert.equal(bootstrap.trainState.program.selectedCalendarDayId, 'tue')
  assert.equal(typeof bootstrap.sessionStore.getCurrentSession, 'function')
  assert.equal(bootstrap.sessionStore.getCurrentSession()?.programWorkoutId || bootstrap.sessionStore.getCurrentSession()?.id, 'pw-lower-a')
})

test('createMobileAppBootstrap returns signed out when remote config exists but auth context is missing', async () => {
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
  })

  assert.equal(bootstrap.status, 'signed_out')
  assert.equal(bootstrap.trainState, null)
})

test('createMobileAppBootstrap refreshes a recoverable stored auth session before falling back to signed out', async () => {
  const calls = []
  const fetchImpl = async (url, options = {}) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    const authHeader = options.headers?.Authorization || options.headers?.authorization || ''
    calls.push({ path: parsedUrl.pathname, table, authHeader, query: parsedUrl.search })

    if (parsedUrl.pathname === '/auth/v1/user') {
      if (authHeader === 'Bearer expired-token') {
        return {
          ok: false,
          status: 403,
          statusText: 'Forbidden',
          async text() {
            return JSON.stringify({ message: 'invalid JWT: token is expired' })
          },
        }
      }

      return json({ id: 'user-1', email: 'athlete@example.com', user_metadata: { role: 'athlete' } })
    }

    if (table === 'athlete_profiles') {
      return json([{ id: 'ath-1', user_id: 'user-1', first_name: 'Tony', last_name: 'F', date_of_birth: '2011-01-01', sport: 'Hockey', position: 'Forward', handedness: 'Left', gender: 'Male', height_cm: 180, weight_kg: 77, avatar_url: 'https://cdn.example.com/avatar-tony.png', status: 'active' }])
    }

    if (table === 'programs' || table === 'program_weeks' || table === 'program_days' || table === 'program_workouts' || table === 'program_workout_exercises' || table === 'program_workout_sets' || table === 'workout_sessions' || table === 'workout_session_exercises' || table === 'workout_session_sets') {
      return json([])
    }

    throw new Error(`Unexpected bootstrap request: ${parsedUrl.toString()}`)
  }

  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    accessToken: 'expired-token',
    currentUserId: 'user-1',
    refreshAccessToken: async () => 'fresh-token',
    fetchImpl,
  })

  assert.equal(bootstrap.status, 'authenticated_no_workout')
  assert.equal(bootstrap.athleteProfile.id, 'ath-1')
  assert.equal(calls.filter((call) => call.path === '/auth/v1/user').length, 2)
  assert.equal(calls.some((call) => call.authHeader === 'Bearer expired-token'), true)
  assert.equal(calls.some((call) => call.authHeader === 'Bearer fresh-token'), true)
})

test('createMobileAppBootstrap resolves authenticated athlete state and train store from auth bootstrap', async () => {
  const { fetchImpl, calls } = createBootstrapFetchStub()
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    accessToken: 'user-token',
    fetchImpl,
  })

  assert.equal(bootstrap.status, 'authenticated')
  assert.equal(bootstrap.athleteProfile.id, 'ath-1')
  assert.equal(bootstrap.athleteProfile.dateOfBirth, '2011-01-01')
  assert.equal(bootstrap.athleteProfile.sport, 'Hockey')
  assert.equal(bootstrap.athleteProfile.position, 'Forward')
  assert.equal(bootstrap.athleteProfile.handedness, 'Left')
  assert.equal(bootstrap.athleteProfile.gender, 'Male')
  assert.equal(bootstrap.athleteProfile.heightCm, 180)
  assert.equal(bootstrap.athleteProfile.weightKg, 77)
  assert.equal(bootstrap.athleteProfile.avatarUrl, 'https://cdn.example.com/avatar-tony.png')
  assert.equal(bootstrap.trainState.programWorkout.id, 'pw-1')
  assert.equal(typeof bootstrap.sessionStore.syncCurrentSession, 'function')
  assert.equal(calls.some((call) => call.path === '/auth/v1/user'), true)
  assert.equal(calls.some((call) => call.table === 'program_days'), true)
})

test('createMobileAppBootstrap carries athlete completed session history into train state so athlete analytics can read real completed work', async () => {
  const { fetchImpl } = createBootstrapFetchStub()
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    accessToken: 'user-token',
    fetchImpl: async (url, options = {}) => {
      const parsedUrl = new URL(url)
      const table = parsedUrl.pathname.split('/').at(-1)

      if (table === 'workout_sessions') {
        if (parsedUrl.searchParams.get('status') === 'eq.completed' || parsedUrl.searchParams.get('id') === 'eq.ws-completed-1') {
          return json([{
            id: 'ws-completed-1',
            athlete_id: 'ath-1',
            program_workout_id: 'pw-1',
            status: 'completed',
            started_at: '2026-04-20T18:00:00.000Z',
            completed_at: '2026-04-20T18:45:00.000Z',
            elapsed_seconds: 2700,
          }])
        }
        return json([])
      }

      if (table === 'workout_session_exercises') {
        return json([{
          id: 'wse-1',
          workout_session_id: 'ws-completed-1',
          exercise_id: 'ex-1',
          name_snapshot: 'Front Squat',
          sort_order: 1,
          notes: '',
          default_rest_seconds: 120,
        }])
      }

      if (table === 'workout_session_sets') {
        return json([{
          id: 'wss-1',
          workout_session_exercise_id: 'wse-1',
          set_number: 1,
          target_reps: 8,
          target_load: 135,
          target_load_unit: 'lb',
          actual_reps: 8,
          actual_load: 135,
          actual_load_unit: 'lb',
          is_completed: true,
          completed_at: '2026-04-20T18:10:00.000Z',
          set_type: 'straight',
          target_rest_seconds: 120,
          notes: '',
        }])
      }

      return fetchImpl(url, options)
    },
  })

  assert.equal(bootstrap.status, 'authenticated')
  assert.equal(Array.isArray(bootstrap.trainState.completedSessions), true)
  assert.equal(bootstrap.trainState.completedSessions.length, 1)
  assert.equal(bootstrap.trainState.completedSessions[0].status, 'completed')
  assert.equal(bootstrap.trainState.completedSessions[0].exercises[0].nameSnapshot, 'Front Squat')
})

test('createMobileAppBootstrap falls back when athlete unit preference columns are not live in Supabase yet', async () => {
  const calls = []
  const fetchImpl = async (url) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)
    calls.push(parsedUrl.toString())

    if (parsedUrl.pathname === '/auth/v1/user') {
      return json({ id: 'user-1', email: 'athlete@example.com', user_metadata: { role: 'athlete' } })
    }

    if (table === 'athlete_profiles') {
      const select = parsedUrl.searchParams.get('select') || ''
      if (parsedUrl.searchParams.get('user_id') === 'eq.user-1') {
        if (select.includes('weight_unit_preference') || select.includes('distance_unit_preference')) {
          return json({ message: 'column athlete_profiles.weight_unit_preference does not exist' }, 400)
        }
        return json([{ id: 'ath-1', user_id: 'user-1', first_name: 'Tony', last_name: 'F', date_of_birth: '2011-01-01', sport: 'Hockey', position: 'Forward', handedness: 'Left', gender: 'Male', height_cm: 180, weight_kg: 77, avatar_url: 'https://cdn.example.com/avatar-tony.png', status: 'active', units_preference: 'metric', theme_preference: 'light' }])
      }
      return json([])
    }

    if (table === 'programs' || table === 'program_weeks' || table === 'program_days' || table === 'program_workouts' || table === 'program_workout_exercises' || table === 'program_workout_sets' || table === 'workout_sessions' || table === 'workout_session_exercises' || table === 'workout_session_sets') {
      return json([])
    }

    throw new Error(`Unexpected bootstrap request: ${parsedUrl.toString()}`)
  }

  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    accessToken: 'user-token',
    fetchImpl,
  })

  assert.equal(bootstrap.status, 'authenticated_no_workout')
  assert.equal(bootstrap.athleteProfile.id, 'ath-1')
  assert.equal(bootstrap.athleteProfile.weightUnitPreference, null)
  assert.equal(bootstrap.athleteProfile.distanceUnitPreference, null)
  assert.equal(calls.some((call) => call.includes('weight_unit_preference')), true)
  assert.equal(calls.some((call) => call.includes('theme_preference') && !call.includes('weight_unit_preference')), true)
})

test('createMobileAppBootstrap resolves authenticated coach state and skips athlete workout bootstrapping while loading linked athletes', async () => {
  const { fetchImpl, calls } = createBootstrapFetchStub({ role: 'coach' })
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    accessToken: 'coach-token',
    fetchImpl,
  })

  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.role, 'coach')
  assert.equal(bootstrap.coachProfile.id, 'coach-1')
  assert.equal(bootstrap.coachProfile.displayName, 'Coach Tony')
  assert.equal(bootstrap.coachAthletes.length, 2)
  assert.equal(bootstrap.coachAthletes[0].id, 'ath-1')
  assert.equal(bootstrap.coachAthletes[0].firstName, 'Thomas')
  assert.equal(bootstrap.coachAthletes[1].id, 'ath-2')
  assert.equal(bootstrap.coachGroups.length, 2)
  assert.equal(bootstrap.coachGroups[0].id, 'group-speed')
  assert.equal(bootstrap.coachGroups[0].name, 'Speed Group')
  assert.equal(bootstrap.coachGroups[0].athleteCount, 2)
  assert.equal(bootstrap.coachGroups[0].athleteCountLabel, '2 athletes')
  assert.equal(bootstrap.coachGroups[1].athleteCountLabel, '1 athlete')
  assert.equal(bootstrap.athleteProfile, null)
  assert.equal(bootstrap.trainState, null)
  assert.equal(bootstrap.sessionStore, null)
  assert.equal(calls.some((call) => call.table === 'coach_profiles'), true)
  assert.equal(calls.some((call) => call.table === 'athlete_profiles' && call.query.includes('coach_id=eq.coach-1')), true)
  assert.equal(calls.some((call) => call.table === 'athlete_groups'), true)
  assert.equal(calls.some((call) => call.table === 'athlete_groups' && call.query.includes('coach_id=')), false)
  assert.equal(calls.some((call) => call.table === 'athlete_group_memberships'), true)
  assert.equal(calls.some((call) => call.table === 'program_days'), false)
})

test('createMobileAppBootstrap still resolves authenticated coach state when the auth user is missing role metadata but a coach profile exists', async () => {
  const fetchImpl = async (url) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)

    if (parsedUrl.pathname === '/auth/v1/user') {
      return json({
        id: 'user-1',
        email: 'coach@example.com',
        user_metadata: { first_name: 'Anthony', last_name: 'Fortugno' },
      })
    }

    if (table === 'coach_profiles') {
      return json([{ id: 'coach-1', user_id: 'user-1', display_name: null, organization_name: 'PPLUS', bio: 'Head coach' }])
    }

    if (table === 'athlete_profiles' && parsedUrl.searchParams.get('coach_id') === 'eq.coach-1') {
      return json([])
    }

    throw new Error(`Unexpected bootstrap request: ${parsedUrl.toString()}`)
  }

  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    accessToken: 'coach-token',
    fetchImpl,
  })

  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.coachProfile.id, 'coach-1')
  assert.equal(bootstrap.coachProfile.displayName, 'Anthony Fortugno')
})

test('createMobileAppBootstrap falls back to auth metadata names when the coach profile has no display_name yet', async () => {
  const fetchImpl = async (url) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)

    if (parsedUrl.pathname === '/auth/v1/user') {
      return json({
        id: 'user-1',
        email: 'coach@example.com',
        user_metadata: { role: 'coach', first_name: 'Anthony', last_name: 'Fortugno' },
      })
    }

    if (table === 'coach_profiles') {
      return json([{ id: 'coach-1', user_id: 'user-1', display_name: null, organization_name: 'PPLUS', bio: 'Head coach' }])
    }

    if (table === 'athlete_profiles' && parsedUrl.searchParams.get('coach_id') === 'eq.coach-1') {
      return json([])
    }

    throw new Error(`Unexpected bootstrap request: ${parsedUrl.toString()}`)
  }

  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    accessToken: 'coach-token',
    fetchImpl,
  })

  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.coachProfile.displayName, 'Anthony Fortugno')
})

test('createMobileAppBootstrap replaces a generic coach display_name with auth metadata names', async () => {
  const fetchImpl = async (url) => {
    const parsedUrl = new URL(url)
    const table = parsedUrl.pathname.split('/').at(-1)

    if (parsedUrl.pathname === '/auth/v1/user') {
      return json({
        id: 'user-1',
        email: 'coach@example.com',
        user_metadata: { role: 'coach', first_name: 'Anthony', last_name: 'Fortugno' },
      })
    }

    if (table === 'coach_profiles') {
      return json([{ id: 'coach-1', user_id: 'user-1', display_name: 'Coach', organization_name: 'PPLUS', bio: 'Head coach' }])
    }

    if (table === 'athlete_profiles' && parsedUrl.searchParams.get('coach_id') === 'eq.coach-1') {
      return json([])
    }

    throw new Error(`Unexpected bootstrap request: ${parsedUrl.toString()}`)
  }

  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    accessToken: 'coach-token',
    fetchImpl,
  })

  assert.equal(bootstrap.status, 'authenticated_coach')
  assert.equal(bootstrap.coachProfile.displayName, 'Anthony Fortugno')
})

test('createMobileAppBootstrap keeps an authenticated athlete train state when the assigned program has an off day today', async () => {
  const { fetchImpl } = createBootstrapFetchStub({ includeWorkout: false })
  const bootstrap = await createMobileAppBootstrap({
    env: {
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
    },
    accessToken: 'user-token',
    fetchImpl,
  })

  assert.equal(bootstrap.status, 'authenticated')
  assert.equal(bootstrap.athleteProfile.id, 'ath-1')
  assert.equal(bootstrap.trainState.program.name, 'Training Program')
  assert.equal(bootstrap.trainState.today.scheduledLabel, 'No workout scheduled')
})

test('getBootstrapSurfaceModel returns the right shell copy for loading, auth, coach, no-workout, and bootstrap-error states', () => {
  assert.equal(getBootstrapSurfaceModel({ bootstrapState: { status: 'loading' } }).title, 'Loading')
  assert.equal(getBootstrapSurfaceModel({ bootstrapState: { status: 'signed_out' } }).title, 'Sign in required')
  assert.equal(
    getBootstrapSurfaceModel({ bootstrapState: { status: 'authenticated_coach', coachProfile: { displayName: 'Coach Tony' } } }),
    null
  )
  assert.equal(
    getBootstrapSurfaceModel({ bootstrapState: { status: 'authenticated_no_workout', athleteProfile: { firstName: 'Tony' } } }).title,
    'No workout scheduled'
  )
  assert.equal(
    getBootstrapSurfaceModel({ bootstrapState: { status: 'bootstrap_error', errorMessage: 'coach bootstrap failed' } }).title,
    'Connection issue'
  )
  assert.equal(getBootstrapSurfaceModel({ bootstrapState: { status: 'authenticated' } }), null)
})
