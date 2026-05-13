import * as data from '../../../../packages/data/src/index.js'
import { createAssignedProgramTrainState, createTrainDemoState, createTrainSessionStore } from '../train/index.js'
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
    : createTrainDemoState({ programWorkout, previewState })
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
