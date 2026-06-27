import * as data from '../../../../packages/data/src/index.js'
import { createAssignedProgramTrainState, createStandaloneProgramWorkoutTrainState, createTrainDemoState, createTrainSessionStore } from '../train/index.js'
import { getAssignedProgramWorkoutIdForDate } from '../train/assigned-program-workout-id.js'
import { createSupabaseMobileIdentityClient } from '../train/session-runtime.js'
import { getPlaceholderSurfaceModel } from '../progress/index.js'

function getCoachDisplayName(currentUser, coachProfile) {
  const currentDisplayName = String(coachProfile?.displayName || '').trim()
  const hasRealCoachDisplayName = currentDisplayName && !/^coach$/i.test(currentDisplayName)
  if (hasRealCoachDisplayName) {
    return currentDisplayName
  }

  const fullName = [coachProfile?.firstName, coachProfile?.lastName].filter(Boolean).join(' ').trim()
  if (fullName) {
    return fullName
  }

  const authFullName = [currentUser?.firstName, currentUser?.lastName].filter(Boolean).join(' ').trim()
  return authFullName || coachProfile?.firstName || coachProfile?.lastName || currentUser?.firstName || currentUser?.lastName || currentDisplayName || null
}

function getIsoToday() {
  return new Date().toISOString().slice(0, 10)
}

async function resolveBootstrapIdentity({ env, fetchImpl, accessToken, currentUserId }) {
  const identityClient = createSupabaseMobileIdentityClient({
    supabaseUrl: env?.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: env?.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    accessToken,
    fetchImpl,
  })

  const currentUser = currentUserId
    ? await identityClient?.getUserById?.(currentUserId)
    : await identityClient?.getCurrentUser?.()

  return {
    identityClient,
    currentUser,
    accessToken,
  }
}

function createMobileProgramClient({ env, fetchImpl, accessToken }) {
  if (!env?.EXPO_PUBLIC_SUPABASE_URL || !env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  return data.programs.createSupabaseRestProgramRepository({
    url: env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    accessToken,
    fetchImpl,
  })
}

function createMobileWorkoutClient({ env, fetchImpl, accessToken }) {
  if (!env?.EXPO_PUBLIC_SUPABASE_URL || !env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  return data.sessions.createSupabaseRestSessionDb({
    url: env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    accessToken,
    fetchImpl,
  })
}

function createMobileGroupsClient({ env, fetchImpl, accessToken }) {
  if (!env?.EXPO_PUBLIC_SUPABASE_URL || !env?.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
    return null
  }

  return data.groups.createSupabaseRestGroupRepository({
    url: env.EXPO_PUBLIC_SUPABASE_URL,
    anonKey: env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    accessToken,
    fetchImpl,
  })
}

function createSafeWorkoutProgramWorkout() {
  return {
    id: 'pw-safe-simulator-smoke',
    athleteId: 'ath-preview-1',
    coachId: 'coach-preview',
    programId: 'program-safe-simulator',
    programDayId: 'safe-workout-today',
    programWeekId: 'safe-workout-week',
    workoutTemplateId: 'template-safe-simulator',
    programName: 'Safe Simulator Program',
    nameSnapshot: 'Safe Simulator Workout',
    notes: 'Seeded local-only workout for simulator smoke. Safe to open and start.',
    status: 'scheduled',
    exercises: [
      {
        id: 'pwe-safe-squat',
        exerciseId: 'exercise-squat',
        nameSnapshot: 'Barbell Back Squat',
        sortOrder: 1,
        notes: 'Brace and move fast',
        defaultRestSeconds: 180,
        sets: [
          { id: 'pws-safe-squat-1', sortOrder: 1, setType: 'straight', targetReps: 5, targetLoad: 95, targetLoadUnit: 'lb', targetRpe: 6, targetRestSeconds: 180 },
          { id: 'pws-safe-squat-2', sortOrder: 2, setType: 'straight', targetReps: 5, targetLoad: 95, targetLoadUnit: 'lb', targetRpe: 6, targetRestSeconds: 180 },
        ],
      },
    ],
  }
}

function createSafeAssignedProgram() {
  const todayDate = getIsoToday()
  const assignedProgramWorkout = {
    ...createSafeWorkoutProgramWorkout(),
    id: 'pw-safe-assigned-program-detail-smoke',
    programId: 'program-safe-assigned-detail-smoke',
    programDayId: 'safe-assigned-program-today',
    programWeekId: 'safe-assigned-program-week-1',
    programName: 'Safe Assigned Program',
    nameSnapshot: 'Safe Assigned Workout',
  }

  return {
    id: 'program-safe-assigned-detail-smoke',
    name: 'Safe Assigned Program',
    startDate: todayDate,
    endDate: todayDate,
    weeks: [
      {
        id: 'safe-assigned-program-week-1',
        weekIndex: 1,
        name: 'Week 1',
        startDate: todayDate,
        endDate: todayDate,
        days: [
          {
            id: 'safe-assigned-program-today',
            date: todayDate,
            name: 'Safe Assigned Workout',
            status: 'training',
            workouts: [assignedProgramWorkout],
          },
        ],
      },
    ],
  }
}

function createSeededAthleteTrainHomeBootstrap({ trainState, sessionStore } = {}) {
  const safeWorkoutTrainState = trainState || createStandaloneProgramWorkoutTrainState({
    programWorkout: createSafeWorkoutProgramWorkout(),
    previewState: 'planned',
  })
  const safeWorkoutSessionStore = sessionStore || createTrainSessionStore({
    programWorkout: safeWorkoutTrainState.programWorkout,
    initialSession: safeWorkoutTrainState.session,
    env: {},
  })

  return {
    status: 'authenticated',
    role: 'athlete',
    athleteProfile: {
      id: 'ath-preview-1',
      userId: 'ath-preview-user-1',
      firstName: 'Thomas',
      lastName: 'Thibault',
      sport: 'Hockey',
      position: 'Forward',
      unitsPreference: 'imperial',
      themePreference: 'dark',
    },
    trainState: safeWorkoutTrainState,
    sessionStore: safeWorkoutSessionStore,
  }
}

function createSeededCoachShellBootstrap({ trainState = null, sessionStore = null } = {}) {
  return {
    status: 'authenticated_coach',
    role: 'coach',
    coachProfile: {
      id: 'coach-preview',
      userId: 'coach-preview-user',
      displayName: 'Coach Tony',
      firstName: 'Coach',
      lastName: 'Tony',
      organizationName: 'PPLUS',
      bio: 'Seeded coach shell simulator smoke context',
    },
    coachAthletes: [
      {
        id: 'ath-preview-1',
        athleteId: 'ath-preview-1',
        userId: 'ath-preview-user-1',
        coachId: 'coach-preview',
        firstName: 'Thomas',
        lastName: 'Thibault',
        sport: 'Hockey',
        position: 'Forward',
        status: 'active',
      },
      {
        id: 'ath-preview-2',
        athleteId: 'ath-preview-2',
        userId: 'ath-preview-user-2',
        coachId: 'coach-preview',
        firstName: 'Mia',
        lastName: 'Chen',
        sport: 'Hockey',
        position: 'Forward',
        status: 'active',
      },
    ],
    coachGroups: [
      {
        id: 'group-preview-speed',
        coachId: 'coach-preview',
        name: 'Speed Group',
        description: 'Seeded simulator smoke group',
        athleteCount: 2,
        athleteCountLabel: '2 athletes',
        status: 'active',
      },
    ],
    athleteProfile: null,
    trainState,
    sessionStore,
  }
}

export async function createMobileAppBootstrap({
  env = process.env,
  fetchImpl,
  accessToken = null,
  accessTokenProvider = null,
  refreshAccessToken = null,
  currentUserId = null,
  currentAthleteId = null,
  previewState = 'planned',
} = {}) {
  const hasRemoteConfig = Boolean(env?.EXPO_PUBLIC_SUPABASE_URL && env?.EXPO_PUBLIC_SUPABASE_ANON_KEY)
  const runtimeBootstrapOverride = env?.EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE || null

  if (runtimeBootstrapOverride === 'signed_out') {
    return {
      status: 'signed_out',
      athleteProfile: null,
      trainState: null,
      sessionStore: null,
    }
  }

  if (runtimeBootstrapOverride === 'authenticated_train_preview') {
    const trainState = createTrainDemoState({ previewState })
    const sessionStore = createTrainSessionStore({
      programWorkout: trainState.programWorkout,
      initialSession: trainState.session,
    })

    return {
      status: 'authenticated',
      athleteProfile: {
        id: 'preview-athlete',
        firstName: 'Preview',
        lastName: 'Athlete',
        sport: 'Hockey',
        position: 'Forward',
        unitsPreference: 'imperial',
        themePreference: 'dark',
      },
      trainState,
      sessionStore,
    }
  }

  if (runtimeBootstrapOverride === 'authenticated_coach_shell_seeded') {
    return createSeededCoachShellBootstrap()
  }

  if (
    runtimeBootstrapOverride === 'authenticated_coach_athlete_switching_safe' ||
    runtimeBootstrapOverride === 'authenticated_coach_profile_group_update_safe'
  ) {
    return createSeededCoachShellBootstrap()
  }

  if (runtimeBootstrapOverride === 'authenticated_athlete_train_home_seeded') {
    return createSeededAthleteTrainHomeBootstrap()
  }

  if (
    runtimeBootstrapOverride === 'authenticated_coach_safe_workout_seeded' ||
    runtimeBootstrapOverride === 'authenticated_coach_start_workout_safe' ||
    runtimeBootstrapOverride === 'authenticated_coach_log_set_safe'
  ) {
    const safeWorkoutProgramWorkout = createSafeWorkoutProgramWorkout()
    const safeWorkoutTrainState = createStandaloneProgramWorkoutTrainState({
      programWorkout: safeWorkoutProgramWorkout,
      previewState: 'planned',
    })
    const safeWorkoutSessionStore = createTrainSessionStore({
      programWorkout: safeWorkoutTrainState.programWorkout,
      initialSession: safeWorkoutTrainState.session,
      env: {},
    })

    return createSeededCoachShellBootstrap({
      trainState: safeWorkoutTrainState,
      sessionStore: safeWorkoutSessionStore,
    })
  }

  if (runtimeBootstrapOverride === 'authenticated_coach_assigned_program_seeded') {
    const safeAssignedProgram = createSafeAssignedProgram()
    const safeAssignedProgramWorkout = safeAssignedProgram.weeks[0].days[0].workouts[0]
    const safeAssignedTrainState = createAssignedProgramTrainState({
      assignedProgram: safeAssignedProgram,
      programWorkout: safeAssignedProgramWorkout,
      previewState: 'planned',
      todayIsoDate: getIsoToday(),
    })
    const safeAssignedSessionStore = createTrainSessionStore({
      programWorkout: safeAssignedTrainState.programWorkout,
      initialSession: safeAssignedTrainState.session,
      env: {},
    })

    return createSeededCoachShellBootstrap({
      trainState: safeAssignedTrainState,
      sessionStore: safeAssignedSessionStore,
    })
  }

  if (!hasRemoteConfig) {
    return {
      status: 'signed_out',
      athleteProfile: null,
      trainState: null,
      sessionStore: null,
    }
  }

  if (!accessToken && !currentUserId && !currentAthleteId) {
    return {
      status: 'signed_out',
      athleteProfile: null,
      trainState: null,
      sessionStore: null,
    }
  }

  let identityClient = null
  let currentUser = null
  let resolvedAccessToken = accessToken

  try {
    const resolvedIdentity = await resolveBootstrapIdentity({
      env,
      fetchImpl,
      accessToken: resolvedAccessToken,
      currentUserId,
    })
    identityClient = resolvedIdentity.identityClient
    currentUser = resolvedIdentity.currentUser
    resolvedAccessToken = resolvedIdentity.accessToken ?? resolvedAccessToken
  } catch (error) {
    if (typeof refreshAccessToken === 'function' && (accessToken || currentUserId || currentAthleteId)) {
      try {
        resolvedAccessToken = await refreshAccessToken()
        const resolvedIdentity = await resolveBootstrapIdentity({
          env,
          fetchImpl,
          accessToken: resolvedAccessToken,
          currentUserId,
        })
        identityClient = resolvedIdentity.identityClient
        currentUser = resolvedIdentity.currentUser
        resolvedAccessToken = resolvedIdentity.accessToken ?? resolvedAccessToken
      } catch {
        return {
          status: 'signed_out',
          athleteProfile: null,
          trainState: null,
          sessionStore: null,
        }
      }
    } else if (accessToken || currentUserId || currentAthleteId) {
      return {
        status: 'signed_out',
        athleteProfile: null,
        trainState: null,
        sessionStore: null,
      }
    } else {
      throw error
    }
  }
  const resolvedUserId = currentUser?.id || currentUserId || null
  const currentRole = currentUser?.role || null

  if ((currentRole === 'coach' || !currentRole) && typeof identityClient?.getCoachProfileByUserId === 'function' && resolvedUserId) {
    const coachProfile = await identityClient.getCoachProfileByUserId(resolvedUserId)
    if (coachProfile?.id) {
      const coachAthletes = typeof identityClient?.listAthleteProfilesForCoach === 'function'
        ? await identityClient.listAthleteProfilesForCoach(coachProfile.id)
        : []
      const groupsClient = createMobileGroupsClient({ env, fetchImpl, accessToken: resolvedAccessToken })
      let coachGroups = []
      try {
        coachGroups = await groupsClient?.listGroupsForCoach?.(coachProfile.id) || []
      } catch {
        coachGroups = []
      }
      const coachDisplayName = getCoachDisplayName(currentUser, coachProfile)

      return {
        status: 'authenticated_coach',
        role: 'coach',
        coachProfile: {
          ...coachProfile,
          displayName: coachDisplayName,
          firstName: coachProfile.firstName ?? currentUser?.firstName ?? '',
          lastName: coachProfile.lastName ?? currentUser?.lastName ?? '',
        },
        coachAthletes,
        coachGroups,
        athleteProfile: null,
        trainState: null,
        sessionStore: null,
      }
    }
  }

  const sessionStore = createTrainSessionStore({
    env,
    fetchImpl,
    accessToken: resolvedAccessToken,
    refreshAccessToken,
    currentUserId: resolvedUserId,
    currentAthleteId,
    identityClient,
  })

  const athleteProfile = await sessionStore.getCurrentAthleteProfile()
  if (!athleteProfile?.id) {
    return {
      status: 'signed_out',
      athleteProfile: null,
      trainState: null,
      sessionStore,
    }
  }

  const todayIsoDate = getIsoToday()
  const programClient = createMobileProgramClient({ env, fetchImpl, accessToken: resolvedAccessToken })
  const workoutClient = createMobileWorkoutClient({ env, fetchImpl, accessToken: resolvedAccessToken })
  const [assignedProgram, programWorkout, completedSessions] = await Promise.all([
    programClient?.getAssignedProgramForAthlete?.(athleteProfile.id) || null,
    sessionStore.getProgramWorkout({ onDate: todayIsoDate }),
    workoutClient?.getCompletedSessionsByAthleteId?.(athleteProfile.id) || [],
  ])
  const resolvedProgramWorkoutId = programWorkout?.id || getAssignedProgramWorkoutIdForDate(assignedProgram, todayIsoDate)
  const hydratedSession = await sessionStore.syncCurrentSession({
    programWorkoutId: resolvedProgramWorkoutId,
    onDate: todayIsoDate,
  })

  if (!assignedProgram?.id && !programWorkout?.id) {
    return {
      status: 'authenticated_no_workout',
      athleteProfile,
      trainState: null,
      sessionStore,
    }
  }

  const seededTrainState = assignedProgram?.id
    ? createAssignedProgramTrainState({
        assignedProgram,
        programWorkout,
        previewState,
        todayIsoDate,
        completedSessions,
      })
    : createStandaloneProgramWorkoutTrainState({
        programWorkout,
        previewState,
        todayIsoDate,
        completedSessions,
      })
  const resolvedBootstrapSession = hydratedSession || sessionStore.getCurrentSession() || seededTrainState.session

  return {
    status: 'authenticated',
    athleteProfile,
    trainState: {
      ...seededTrainState,
      session: resolvedBootstrapSession,
    },
    sessionStore,
  }
}

export function getBootstrapSurfaceModel({ bootstrapState }) {
  if (!bootstrapState || bootstrapState.status === 'loading') {
    return getPlaceholderSurfaceModel('Loading', 'Connecting the athlete shell, identity context, and today\'s training state.')
  }

  if (bootstrapState.status === 'signed_out') {
    return {
      title: 'Sign in required',
      body: 'Connect the athlete account before the Train, Progress, and team surfaces start pulling live data.',
      actionLabel: 'Waiting for auth bootstrap',
      targetKey: null,
    }
  }

  if (bootstrapState.status === 'authenticated_coach') {
    return null
  }

  if (bootstrapState.status === 'authenticated_no_workout') {
    const athleteName = bootstrapState.athleteProfile?.firstName || 'Athlete'
    return {
      title: 'No workout scheduled',
      body: `${athleteName} is connected, but there is no workout scheduled for today yet. Once a coach-assigned workout exists, Train can start a live session from it.`,
      actionLabel: 'Check back later',
      targetKey: null,
    }
  }

  if (bootstrapState.status === 'bootstrap_error') {
    return {
      title: 'Connection issue',
      body: bootstrapState.errorMessage || 'Something went sideways while connecting identity and training data.',
      actionLabel: 'Retry app bootstrap',
      targetKey: null,
    }
  }

  return null
}
