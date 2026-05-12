import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { InteractionManager, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as data from '../../packages/data/src/index.js';
import {
  adjustRestTimer,
  clearRestTimer,
  canFinishWorkoutSession,
  formatWorkoutTimer,
} from '@pplus/core';
import { findSessionSet } from '../../packages/core/src/index.js';
import { getBootstrapSurfaceModel } from './src/auth/bootstrap.js';
import { MobileAuthSessionProvider, useMobileAuthSession } from './src/auth/session-provider.js';
import { getAuthScreenModel } from './src/auth/auth-screen-models.js';
import {
  orchestrateAuthSubmit,
  orchestrateProfileSignOut,
  orchestrateThemePreferenceChange,
  orchestrateUnitsPreferenceChange,
  orchestrateSaveProfile,
  orchestrateSaveCoachReadinessMetric,
} from './src/auth/auth-profile-actions.js';
import {
  getCalendarSurfaceModel,
  getTodaySurfaceModel,
  getWorkoutSurfaceModel,
  mobileTabs,
  trainTabs,
} from './src/train/index.js';
import { getActiveSessionSurfaceModel } from './src/train/active-session-models.js';
import { getCompletedSessionSurfaceModel } from './src/train/completed-session-models.js';
import { getDiscardedSessionSurfaceModel } from './src/train/discarded-session-models.js';
import { getTrainRenderModel } from './src/train/train-render-models.js';
import { getTrainSurfaceModel } from './src/train/train-screen-models.js';
import { getProgramSheetModel } from './src/train/program-sheet-models.js';
import { getProgramEditViewModel } from './src/train/program-edit-view-models.js';
import { getTrainingCalendarModel } from './src/train/training-calendar-models.js';
import { getWorkoutSheetModel } from './src/train/workout-sheet-models.js';
import { getWorkoutEditViewModel, createEmptyWorkoutEditDraftModel } from './src/train/workout-edit-view-models.js';
import { getActiveWorkoutViewModel } from './src/train/active-workout-view-models.js';
import { getExerciseDetailViewModel } from './src/train/exercise-detail-view-models.js';
import { getAnalyticsViewModel, getPlaceholderSurfaceModel, getProgressSurfaceModel } from './src/progress/index.js';
import { getAppRenderModel } from './src/screens/app-render-models.js';
import { getPlaceholderSections, getProgressSections } from './src/screens/surface-sections.js';
import { getGenericSectionRenderPlan, getSessionSectionRenderPlan } from './src/screens/render-plans.js';
import { getSessionRenderModel } from './src/screens/session-render-models.js';
import { getSessionSections } from './src/screens/session-sections.js';
import { renderGenericSections, renderSessionSections, renderTrainSurface } from './src/screens/renderers.js';
import { renderProgramSheet } from './src/screens/program-sheet.js';
import { ProgramEditView } from './src/screens/program-edit-view.js';
import { TrainingCalendarSheet } from './src/screens/training-calendar-sheet.js';
import { WorkoutSheet } from './src/screens/workout-sheet.js';
import { WorkoutEditView } from './src/screens/workout-edit-view.js';
import { ActiveWorkoutView } from './src/screens/active-workout-view.js';
import { CoachAthletesSheet } from './src/screens/coach-athletes-sheet.js';
import { InviteAthleteView } from './src/screens/invite-athlete-view.js';
import { InvitationSuccessView } from './src/screens/invitation-success-view.js';
import { CoachAthleteWorkspaceSheet } from './src/screens/coach-athlete-workspace-sheet.js';
import { AuthView } from './src/screens/auth-view.js';
import { ExerciseDetailView } from './src/screens/exercise-detail-view.js';
import { ProfileView } from './src/screens/profile-view.js';
import { LoadingView } from './src/screens/loading-view.js';
import { AnalyticsView } from './src/screens/analytics-view.js';
import { renderAppShell } from './src/screens/shell-renderers.js';
import { getBottomTabViewItems } from './src/screens/shell-view-models.js';
import { createAppStyles, statusStyles } from './src/screens/styles.js';
import { getAppTheme } from './src/theme/app-theme.js';
import { getTabButtonModels } from './src/ui/tab-models.js';
import { getPreviewStateButtonModels } from './src/ui/preview-state-models.js';
import {
  resolveIncomingSession,
} from './src/train/session-orchestration.js';
import { deriveWorkoutOpenRequestContext } from './src/train/workout-open-request-context.js';
import { hydrateCoachTrainBridge } from './src/train/coach-train-bridge.js';
import { createMobileInvitationClient, sendCoachAthleteInvitation } from './src/train/athlete-invitation-runtime.js';
import { orchestrateWorkoutOpen } from './src/train/workout-open-selection.js';
import { orchestrateStartWorkoutFromSheet } from './src/train/start-workout-selection.js';
import { orchestrateOpenOrResumeSession } from './src/train/open-resume-selection.js';
import { orchestrateCloseProgramSheet, orchestrateOpenProgramSheet } from './src/train/open-program-selection.js';
import { orchestrateCloseExerciseDetail, orchestrateOpenExerciseDetail } from './src/train/open-exercise-detail-selection.js';
import { orchestrateCoachAthleteSelect, orchestrateCoachAthleteWorkspaceOpen } from './src/train/coach-athlete-selection.js';
import { orchestrateCloseActiveWorkout } from './src/train/active-workout-selection.js';
import {
  orchestrateAddExercisesToSession,
  orchestrateAddSessionSet,
  orchestrateAdjustRestTimer,
  orchestrateClosePostSetEffortAdjustment,
  orchestrateCompleteSet,
  orchestrateDeleteSessionExercise,
  orchestrateDeleteSessionSet,
  orchestrateDismissRestTimer,
  orchestrateExerciseRestTimeChange,
  orchestrateFinishWorkout,
  orchestrateDiscardWorkout,
  orchestrateMoveActiveWorkoutExercise,
  orchestrateQuickActualUpdate,
  orchestratePostSetEffortChange,
  orchestrateRemoveExerciseRestTime,
  orchestrateSessionSetValueChange,
  orchestrateWorkoutNotesChange,
  orchestrateWorkoutSettingsChange,
} from './src/train/active-workout-mutations.js';
import { orchestrateCloseProgramEditView, orchestrateOpenProgramEditView } from './src/train/program-edit-selection.js';
import { orchestrateCloseWorkoutEditView, orchestrateOpenWorkoutEditView } from './src/train/workout-edit-selection.js';
import { orchestrateAddExercisesToWorkoutEdit, orchestrateAddWorkoutEditSet, orchestrateDeleteWorkoutEditSet, orchestrateMoveWorkoutEditExercise } from './src/train/workout-edit-mutations.js';
import { createSessionPersistenceController } from './src/train/session-persistence.js';
import { getSessionDebugSummary, logResolvedIncomingSession } from './src/train/session-diagnostics.js';

const authPreviewStates = [
  { key: 'live', label: 'Live' },
  { key: 'sign_in', label: 'Sign in' },
  { key: 'sign_up', label: 'Sign up' },
];

function isUuidValue(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function createMobileExerciseDetailClient({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return data.exercises.createSupabaseRestExerciseRepository({
    url,
    anonKey,
    fetchImpl,
  });
}

function createMobileExerciseLibraryClient({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return data.exercises.createSupabaseRestExerciseRepository({
    url,
    anonKey,
    fetchImpl,
  });
}

function createMobileProgramClient({ env = process.env, fetchImpl = globalThis.fetch, accessToken = null } = {}) {
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return data.programs.createSupabaseRestProgramRepository({
    url,
    anonKey,
    accessToken,
    fetchImpl,
  });
}

function createMobileWorkoutClient({ env = process.env, fetchImpl = globalThis.fetch, accessToken = null } = {}) {
  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return data.sessions.createSupabaseRestSessionDb({
    url,
    anonKey,
    accessToken,
    fetchImpl,
  });
}

function createEmptySessionState() {
  return {
    id: null,
    programWorkoutId: null,
    status: 'planned',
    startedAt: null,
    completedAt: null,
    discardedAt: null,
    elapsedSeconds: 0,
    totalExercisesCount: 0,
    completedExercisesCount: 0,
    totalSetsCount: 0,
    completedSetsCount: 0,
    exercises: [],
    activeRestTimer: null,
    settings: {
      defaultRestSeconds: null,
      autoProgressEnabled: false,
      keepAwake: false,
      adjustEffortAfterSet: false,
    },
  };
}

function createEmptyTrainState(session = createEmptySessionState()) {
  const today = new Date()
  const todayIsoDate = today.toISOString().slice(0, 10)
  const startOfWeek = new Date(today)
  startOfWeek.setHours(0, 0, 0, 0)
  startOfWeek.setDate(today.getDate() - today.getDay())
  const calendarWeek = Array.from({ length: 7 }, (_, index) => {
    const dayDate = new Date(startOfWeek)
    dayDate.setDate(startOfWeek.getDate() + index)
    const isoDate = dayDate.toISOString().slice(0, 10)
    const weekdayShort = dayDate.toLocaleDateString('en-US', { weekday: 'short' })
    return {
      id: isoDate,
      dayLabel: weekdayShort,
      weekdayLabel: weekdayShort.toUpperCase(),
      dateLabel: dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      workoutName: 'No workout scheduled',
      status: 'off',
      workoutPreview: null,
    }
  })

  return {
    programWorkout: {
      id: null,
      nameSnapshot: 'No workout scheduled',
      exercises: [],
    },
    today: {
      title: 'Today',
      workoutName: 'No workout scheduled',
      scheduledLabel: 'No workout scheduled',
      quickSummary: 'No workout is scheduled for this athlete yet.',
    },
    program: {
      name: 'No program assigned',
      dateRangeLabel: '',
      currentWeek: 0,
      totalWeeks: 0,
      weekLabel: 'No active program',
      completedWorkouts: 0,
      totalWorkouts: 0,
      completionLabel: 'No workouts assigned yet',
      todayCalendarDayId: todayIsoDate,
      selectedCalendarDayId: todayIsoDate,
      calendarWeek,
    },
    session,
    completedSessions: [],
  };
}

function getRelatedWorkoutCount({ calendarWeek = [], persistedWorkoutListRows = [], selectedDayId = null }) {
  const selectedDay = calendarWeek.find((day) => day.id === selectedDayId) || null;
  const dayWorkouts = Array.isArray(selectedDay?.workouts) ? selectedDay.workouts : [];
  const dayWorkoutIds = new Set(dayWorkouts.map((workout) => workout?.id).filter(Boolean));
  const localSameDayRows = persistedWorkoutListRows.filter((row) => {
    if (row?.actionPayload?.selectedDayId !== selectedDayId) return false;
    const rowProgramWorkoutId = row?.actionPayload?.programWorkoutId || null;
    return !rowProgramWorkoutId || !dayWorkoutIds.has(rowProgramWorkoutId);
  });

  return dayWorkouts.length + localSameDayRows.length;
}

export default function App() {
  const [previewState, setPreviewState] = useState('planned');

  return (
    <MobileAuthSessionProvider previewState={previewState}>
      <AppShellContent />
    </MobileAuthSessionProvider>
  );
}

function AppShellContent() {
  const emptySession = useMemo(() => createEmptySessionState(), []);
  const emptyTrainState = useMemo(() => createEmptyTrainState(emptySession), [emptySession]);
  const { authSession, bootstrapState, sessionStore, signInWithPassword, signUpWithPassword, resetPasswordForEmail, signOut, refreshAuthSession, updateAthleteProfile, updateCoachProfile, createCoachBodyMetricLog, getLatestCoachBodyMetricLog } = useMobileAuthSession();
  const runtimeAuthPreviewState = process.env.EXPO_PUBLIC_PPLUS_RUNTIME_AUTH_PREVIEW || null;
  const isAuthPreviewEnabled = runtimeAuthPreviewState === 'sign_in' || runtimeAuthPreviewState === 'sign_up';
  const [authPreviewState, setAuthPreviewState] = useState(runtimeAuthPreviewState || 'live');
  const [authMode, setAuthMode] = useState('sign_in');
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [authNoticeMessage, setAuthNoticeMessage] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileSaveNotice, setProfileSaveNotice] = useState('');
  const [isCoachMetricSaving, setIsCoachMetricSaving] = useState(false);
  const [coachMetricNotice, setCoachMetricNotice] = useState('');
  const [coachMetricError, setCoachMetricError] = useState('');
  const [coachReadinessDraft, setCoachReadinessDraft] = useState({ percent: '', note: '' });
  const [coachWorkspaceFormVersion, setCoachWorkspaceFormVersion] = useState(0);
  const optimisticSessionMutationRef = useRef(0);
  const previousBootstrapStatusRef = useRef(bootstrapState.status);
  const [activeTab, setActiveTab] = useState('train');
  const [activeTrainTab, setActiveTrainTab] = useState('calendar');
  const [isProgramSheetOpen, setIsProgramSheetOpen] = useState(false);
  const [isProgramEditViewOpen, setIsProgramEditViewOpen] = useState(false);
  const [programSheetReturnSurface, setProgramSheetReturnSurface] = useState(null);
  const [selectedProgramPreview, setSelectedProgramPreview] = useState(null);
  const [workoutSheetReturnSurface, setWorkoutSheetReturnSurface] = useState(null);
  const [isTrainingCalendarOpen, setIsTrainingCalendarOpen] = useState(false);
  const [isWorkoutSheetOpen, setIsWorkoutSheetOpen] = useState(false);
  const [selectedProgramWorkoutPreview, setSelectedProgramWorkoutPreview] = useState(null);
  const [selectedWorkoutSessionPreview, setSelectedWorkoutSessionPreview] = useState(null);
  const [persistedCreatedWorkoutRows, setPersistedCreatedWorkoutRows] = useState([]);
  const [workoutEditReturnSurface, setWorkoutEditReturnSurface] = useState(null);
  const [workoutEditDraftModel, setWorkoutEditDraftModel] = useState(null);
  const [isDeleteWorkoutModalOpen, setIsDeleteWorkoutModalOpen] = useState(false);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);
  const [deleteWorkoutErrorMessage, setDeleteWorkoutErrorMessage] = useState('');
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const [isActiveWorkoutViewOpen, setIsActiveWorkoutViewOpen] = useState(false);
  const [isCoachAthletesSheetOpen, setIsCoachAthletesSheetOpen] = useState(false);
  const [isInviteAthleteViewOpen, setIsInviteAthleteViewOpen] = useState(false);
  const [isInvitationSuccessViewOpen, setIsInvitationSuccessViewOpen] = useState(false);
  const [inviteAthleteEmail, setInviteAthleteEmail] = useState('');
  const [isSendingAthleteInvitation, setIsSendingAthleteInvitation] = useState(false);
  const [athleteInvitationErrorMessage, setAthleteInvitationErrorMessage] = useState('');
  const [isCoachAthleteWorkspaceOpen, setIsCoachAthleteWorkspaceOpen] = useState(false);
  const [isWorkoutEditViewOpen, setIsWorkoutEditViewOpen] = useState(false);
  const [isExerciseDetailViewOpen, setIsExerciseDetailViewOpen] = useState(false);
  const [isProfileViewOpen, setIsProfileViewOpen] = useState(false);
  const [postSetEffortAdjustment, setPostSetEffortAdjustment] = useState(null);
  const [activeWorkoutAvailableExercises, setActiveWorkoutAvailableExercises] = useState([]);
  const [isActiveWorkoutExercisesLoading, setIsActiveWorkoutExercisesLoading] = useState(false);
  const [activeWorkoutExercisesError, setActiveWorkoutExercisesError] = useState('');
  const [exerciseDetailReturnSurface, setExerciseDetailReturnSurface] = useState(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState(null);
  const [selectedExercisePreview, setSelectedExercisePreview] = useState(null);
  const [selectedCalendarDayId, setSelectedCalendarDayId] = useState(() => emptyTrainState.program.selectedCalendarDayId);
  const [selectedCoachAthleteId, setSelectedCoachAthleteId] = useState(null);
  const [resolvedCoachAthleteDefaultId, setResolvedCoachAthleteDefaultId] = useState(null);
  const workflowContextKeyRef = useRef(null);
  const [coachTrainBridgeState, setCoachTrainBridgeState] = useState({ trainState: null, sessionStore: null, isHydrating: false, hasResolved: false });
  const [session, setSession] = useState(() => emptySession);
  const exerciseDetailClient = useMemo(() => createMobileExerciseDetailClient(), []);
  const exerciseLibraryClient = useMemo(() => createMobileExerciseLibraryClient(), []);
  const programSheetClient = useMemo(() => createMobileProgramClient({ accessToken: authSession?.accessToken }), [authSession?.accessToken]);
  const activeWorkoutExerciseIds = useMemo(() => new Set((session?.exercises || []).map((exercise) => exercise.exerciseId || exercise.id)), [session]);
  const bottomTabModels = useMemo(() => getTabButtonModels({ tabs: mobileTabs, activeKey: activeTab }), [activeTab]);
  const bottomTabViewItems = useMemo(() => getBottomTabViewItems(bottomTabModels), [bottomTabModels]);
  const coachAthleteOptions = useMemo(() => {
    if (!bootstrapState.coachAthletes?.length) {
      return []
    }

    return bootstrapState.coachAthletes.map((athlete, index) => ({
      id: `coach-athlete-${athlete.id}`,
      name: [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') || `Athlete ${index + 1}`,
      readinessLabel: athlete.status ? `Status: ${athlete.status}` : 'No readiness state yet',
      checkInLabel: 'Last check-in: pending',
      nextActionLabel: '',
      readinessPercent: null,
      athleteProfileId: athlete.id,
      avatarUrl: athlete.avatarUrl ?? null,
    }))
  }, [bootstrapState.coachAthletes]);
  const coachAthletesList = useMemo(() => {
    if (!bootstrapState.coachAthletes?.length) {
      return []
    }

    return bootstrapState.coachAthletes.map((athlete, index) => ({
      id: `coach-athlete-${athlete.id}`,
      athleteId: `coach-athlete-${athlete.id}`,
      firstName: athlete.firstName ?? '',
      lastName: athlete.lastName ?? '',
      displayName: [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') || `Athlete ${index + 1}`,
      avatarUrl: athlete.avatarUrl ?? null,
    }))
  }, [bootstrapState.coachAthletes]);
  const selectedCoachAthlete = useMemo(() => {
    return coachAthleteOptions.find((athlete) => athlete.id === selectedCoachAthleteId) || null;
  }, [coachAthleteOptions, selectedCoachAthleteId]);
  const coachWorkspaceAthlete = useMemo(() => {
    if (!selectedCoachAthlete) {
      return null
    }

    return {
      ...selectedCoachAthlete,
      readinessPercent: coachReadinessDraft.percent === '' ? null : Number(coachReadinessDraft.percent),
      nextActionLabel: coachReadinessDraft.note.trim() || '',
    }
  }, [coachReadinessDraft.note, coachReadinessDraft.percent, selectedCoachAthlete])
  const activeCoachAthleteProfile = useMemo(() => {
    if (!bootstrapState.coachAthletes?.length) {
      return null
    }

    return bootstrapState.coachAthletes.find((athlete) => `coach-athlete-${athlete.id}` === selectedCoachAthleteId) || null
  }, [bootstrapState.coachAthletes, selectedCoachAthleteId]);
  const activeCoachAthleteSummary = useMemo(() => {
    const selectedNameParts = String(selectedCoachAthlete?.name || '').trim().split(/\s+/).filter(Boolean)
    const firstName = selectedNameParts[0] || activeCoachAthleteProfile?.firstName || ''
    const lastName = selectedNameParts.slice(1).join(' ') || activeCoachAthleteProfile?.lastName || ''
    const avatarUrl = activeCoachAthleteProfile?.avatarUrl || selectedCoachAthlete?.avatarUrl || null

    if (!firstName && !lastName) {
      return null
    }

    return {
      firstName,
      lastName,
      avatarUrl,
    }
  }, [activeCoachAthleteProfile, selectedCoachAthlete]);

  useEffect(() => {
    if (bootstrapState.status !== 'authenticated_coach' || !authSession?.accessToken || !bootstrapState.coachAthletes?.length) {
      setResolvedCoachAthleteDefaultId(null)
      return
    }

    if (selectedCoachAthleteId && coachAthleteOptions.some((athlete) => athlete.id === selectedCoachAthleteId)) {
      setResolvedCoachAthleteDefaultId(selectedCoachAthleteId)
      return
    }

    let isActive = true
    const programClient = createMobileProgramClient({ accessToken: authSession.accessToken })

    ;(async () => {
      for (const athlete of bootstrapState.coachAthletes) {
        try {
          const assignedProgram = await programClient?.getAssignedProgramForAthlete?.(athlete.id)
          if (!isActive) return
          if (assignedProgram?.id) {
            console.info('[coach-athlete-default] picked-assigned-program-athlete', {
              athleteId: athlete.id,
              athleteName: [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') || athlete.userId || athlete.id,
              assignedProgramId: assignedProgram.id,
            })
            setResolvedCoachAthleteDefaultId(`coach-athlete-${athlete.id}`)
            return
          }
        } catch {
          if (!isActive) return
        }
      }

      if (!isActive) return
      setResolvedCoachAthleteDefaultId(`coach-athlete-${bootstrapState.coachAthletes[0]?.id}`)
    })()

    return () => {
      isActive = false
    }
  }, [authSession?.accessToken, bootstrapState.coachAthletes, bootstrapState.status, coachAthleteOptions, selectedCoachAthleteId]);

  useEffect(() => {
    if (!resolvedCoachAthleteDefaultId) return
    console.info('[coach-athlete-default] resolved', {
      resolvedCoachAthleteDefaultId,
      currentSelectedCoachAthleteId: selectedCoachAthleteId ?? null,
    })
    setSelectedCoachAthleteId((current) => {
      if (coachAthleteOptions.some((athlete) => athlete.id === current)) {
        return current
      }
      return resolvedCoachAthleteDefaultId
    })
  }, [coachAthleteOptions, resolvedCoachAthleteDefaultId, selectedCoachAthleteId])

  useEffect(() => {
    let isActive = true

    if (!selectedCoachAthleteId || !selectedCoachAthlete?.athleteProfileId) {
      setCoachReadinessDraft({ percent: '', note: '' })
      setCoachWorkspaceFormVersion((current) => current + 1)
      return () => {
        isActive = false
      }
    }

    setCoachReadinessDraft({ percent: '', note: '' })
    setCoachWorkspaceFormVersion((current) => current + 1)

    getLatestCoachBodyMetricLog({
      athleteId: selectedCoachAthlete.athleteProfileId,
      metricType: 'readiness',
      source: 'coach_workspace',
    })
      .then((latestReadinessLog) => {
        if (!isActive) return
        setCoachReadinessDraft({
          percent: latestReadinessLog?.value != null ? String(latestReadinessLog.value) : '',
          note: latestReadinessLog?.notes ?? '',
        })
        setCoachWorkspaceFormVersion((current) => current + 1)
      })
      .catch(() => {
        if (!isActive) return
        setCoachReadinessDraft({ percent: '', note: '' })
        setCoachWorkspaceFormVersion((current) => current + 1)
      })

    return () => {
      isActive = false
    }
  }, [getLatestCoachBodyMetricLog, selectedCoachAthlete?.athleteProfileId, selectedCoachAthleteId])

  useEffect(() => {
    if (bootstrapState.status !== 'authenticated_coach' || !activeCoachAthleteProfile?.id || !authSession?.accessToken) {
      setCoachTrainBridgeState({ trainState: null, sessionStore: null, isHydrating: false, hasResolved: false })
      return
    }

    let isActive = true
    setCoachTrainBridgeState({ trainState: null, sessionStore: null, isHydrating: true, hasResolved: false })

    async function hydrateCoachAthleteTrainBridge() {
      try {
        const nextCoachTrainBridgeState = await hydrateCoachTrainBridge({
          athleteId: activeCoachAthleteProfile.id,
          currentUserId: authSession.currentUserId,
          accessToken: authSession.accessToken,
          accessTokenProvider: () => authSession.accessToken,
          refreshAccessToken: refreshAuthSession,
          programClient: createMobileProgramClient({ accessToken: authSession.accessToken }),
          workoutClient: createMobileWorkoutClient({ accessToken: authSession.accessToken }),
        })

        if (!isActive) return

        console.info('[coach-train-bridge-effect] hydrated', {
          selectedCoachAthleteId,
          athleteProfileId: activeCoachAthleteProfile.id,
          selectedAthleteName: selectedCoachAthlete?.name ?? '',
          trainState: nextCoachTrainBridgeState?.trainState
            ? {
                todayWorkoutName: nextCoachTrainBridgeState.trainState.today?.workoutName ?? '',
                scheduledLabel: nextCoachTrainBridgeState.trainState.today?.scheduledLabel ?? '',
                programName: nextCoachTrainBridgeState.trainState.program?.name ?? '',
                calendarWeekCount: Array.isArray(nextCoachTrainBridgeState.trainState.program?.calendarWeek)
                  ? nextCoachTrainBridgeState.trainState.program.calendarWeek.length
                  : 0,
                selectedProgramWorkoutId: nextCoachTrainBridgeState.trainState.programWorkout?.id ?? null,
              }
            : null,
        })

        setCoachTrainBridgeState({
          ...nextCoachTrainBridgeState,
          isHydrating: false,
          hasResolved: true,
        })
      } catch (error) {
        if (!isActive) return
        console.error('[coach-train-bridge-effect] hydrate failed', {
          selectedCoachAthleteId,
          athleteProfileId: activeCoachAthleteProfile?.id ?? null,
          selectedAthleteName: selectedCoachAthlete?.name ?? '',
          message: error?.message || 'Unknown coach train bridge error',
        })
        setCoachTrainBridgeState({ trainState: null, sessionStore: null, isHydrating: false, hasResolved: true })
      }
    }

    hydrateCoachAthleteTrainBridge()

    return () => {
      isActive = false
    }
  }, [activeCoachAthleteProfile?.id, authSession?.accessToken, authSession?.currentUserId, bootstrapState.status, refreshAuthSession])
  useEffect(() => {
    if (bootstrapState.status !== 'authenticated_coach' || !authSession?.accessToken || !bootstrapState.coachAthletes?.length) {
      return
    }

    let isActive = true
    const debugProgramClient = createMobileProgramClient({ accessToken: authSession.accessToken })

    Promise.all(
      bootstrapState.coachAthletes.map(async (athlete) => {
        try {
          const assignedProgram = await debugProgramClient?.getAssignedProgramForAthlete?.(athlete.id)
          return {
            athleteId: athlete.id,
            athleteName: [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') || athlete.userId || athlete.id,
            assignedProgram: assignedProgram
              ? {
                  id: assignedProgram.id ?? null,
                  name: assignedProgram.name ?? '',
                  weekCount: Array.isArray(assignedProgram.weeks) ? assignedProgram.weeks.length : 0,
                }
              : null,
          }
        } catch (error) {
          return {
            athleteId: athlete.id,
            athleteName: [athlete.firstName, athlete.lastName].filter(Boolean).join(' ') || athlete.userId || athlete.id,
            error: error?.message || 'Unknown assigned program debug error',
          }
        }
      })
    ).then((results) => {
      if (!isActive) return
      console.info('[coach-program-debug] assigned-program-matrix', results)
    })

    return () => {
      isActive = false
    }
  }, [authSession?.accessToken, bootstrapState.coachAthletes, bootstrapState.status])

  const [elapsedSecondsNow, setElapsedSecondsNow] = useState(() => Date.now());

  useEffect(() => {
    if (session?.status !== 'in_progress' || !session?.startedAt) {
      setElapsedSecondsNow(Date.now());
      return;
    }

    setElapsedSecondsNow(Date.now());
    const intervalId = setInterval(() => setElapsedSecondsNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [session?.status, session?.startedAt]);

  useEffect(() => {
    if (!session?.activeRestTimer?.isRunning) return undefined;

    const intervalId = setInterval(() => {
      setSession((currentSession) => {
        if (!currentSession?.activeRestTimer?.isRunning) {
          return currentSession;
        }

        if ((currentSession.activeRestTimer.remainingSeconds || 0) <= 1) {
          return clearRestTimer(currentSession);
        }

        return adjustRestTimer(currentSession, -1);
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [session?.activeRestTimer?.exerciseId, session?.activeRestTimer?.isRunning, session?.activeRestTimer?.setId]);

  const elapsedSeconds = useMemo(() => {
    if (session?.status !== 'in_progress') {
      return session?.elapsedSeconds ?? 0;
    }

    const startedAtMs = Date.parse(session.startedAt);
    if (!Number.isFinite(startedAtMs)) {
      return session?.elapsedSeconds ?? 0;
    }

    return Math.max(0, Math.floor((elapsedSecondsNow - startedAtMs) / 1000));
  }, [elapsedSecondsNow, session?.elapsedSeconds, session?.startedAt, session?.status]);

  const effectiveRemoteTrainState = bootstrapState.status === 'authenticated_coach'
    ? coachTrainBridgeState.trainState
    : bootstrapState.trainState
  const effectiveSessionStore = bootstrapState.status === 'authenticated_coach'
    ? coachTrainBridgeState.sessionStore
    : sessionStore
  const {
    persistSessionUpdate,
    persistSessionUpdateOptimistic,
    persistSessionDeletionOptimistic,
  } = createSessionPersistenceController({
    effectiveSessionStore,
    setSession,
    optimisticSessionMutationRef,
    getSessionDebugSummary,
  });

  useEffect(() => {
    if (!isActiveWorkoutViewOpen || !exerciseDetailClient?.listExercises) {
      return undefined;
    }

    let isActive = true;
    setIsActiveWorkoutExercisesLoading(true);
    setActiveWorkoutExercisesError('');

    exerciseDetailClient.listExercises()
      .then((items) => {
        if (!isActive) return;
        const filteredItems = (items || []).filter((exercise) => !activeWorkoutExerciseIds.has(exercise.id));
        setActiveWorkoutAvailableExercises(filteredItems);
        setIsActiveWorkoutExercisesLoading(false);
      })
      .catch((error) => {
        if (!isActive) return;
        setActiveWorkoutExercisesError(error?.message || 'Something went sideways while loading exercises.');
        setIsActiveWorkoutExercisesLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [activeWorkoutExerciseIds, exerciseDetailClient, isActiveWorkoutViewOpen]);

  useLayoutEffect(() => {
    const nextTrainState = effectiveRemoteTrainState || emptyTrainState;
    const nextSession = effectiveSessionStore?.getCurrentSession() || nextTrainState.session;
    const nextWorkflowContextKey = [
      nextSession?.athleteId || nextTrainState.programWorkout?.athleteId || selectedCoachAthleteId || 'no-athlete',
      nextTrainState.program.id || nextTrainState.program.name || 'no-program',
    ].join(':');
    const didWorkflowContextChange = workflowContextKeyRef.current !== nextWorkflowContextKey;

    setSession((currentSession) => {
      const resolvedSession = resolveIncomingSession({
        currentSession,
        nextSession,
        isActiveWorkoutViewOpen,
      });

      logResolvedIncomingSession({
        currentSession,
        nextSession,
        isActiveWorkoutViewOpen,
        resolvedSession,
      });

      return resolvedSession;
    });
    setSelectedCalendarDayId((current) => {
      if (!didWorkflowContextChange && nextTrainState.program.calendarWeek.some((day) => day.id === current)) {
        return current;
      }
      return nextTrainState.program.selectedCalendarDayId;
    });
    setSelectedCoachAthleteId((current) => {
      if (coachAthleteOptions.some((athlete) => athlete.id === current)) {
        return current
      }
      return resolvedCoachAthleteDefaultId ?? current
    });

    if (didWorkflowContextChange) {
      workflowContextKeyRef.current = nextWorkflowContextKey;
      setActiveTrainTab('calendar');
      setIsProgramSheetOpen(false);
      setProgramSheetReturnSurface(null);
      setSelectedProgramPreview(null);
      setIsTrainingCalendarOpen(false);
      setIsWorkoutSheetOpen(false);
      setSelectedProgramWorkoutPreview(null);
      setSelectedWorkoutSessionPreview(null);
      setIsCoachAthletesSheetOpen(false);
      setIsCoachAthleteWorkspaceOpen(false);
      setIsWorkoutEditViewOpen(false);
      setIsExerciseDetailViewOpen(false);
      setPostSetEffortAdjustment(null);
      setCoachMetricNotice('');
      setCoachMetricError('');
      setIsCoachMetricSaving(false);
      setExerciseDetailReturnSurface(null);
      setSelectedExerciseId(null);
      setSelectedExercisePreview(null);
    }
  }, [coachAthleteOptions, effectiveRemoteTrainState, effectiveSessionStore, emptyTrainState, isActiveWorkoutViewOpen, resolvedCoachAthleteDefaultId, selectedCoachAthleteId]);

  const effectiveBootstrapState = useMemo(() => {
    if (isAuthPreviewEnabled && (authPreviewState === 'sign_in' || authPreviewState === 'sign_up')) {
      return {
        ...bootstrapState,
        status: 'signed_out',
      };
    }
    return bootstrapState;
  }, [authPreviewState, bootstrapState, isAuthPreviewEnabled]);
  const authPreviewModels = useMemo(
    () => getPreviewStateButtonModels({ states: authPreviewStates, activeKey: authPreviewState }),
    [authPreviewState]
  );
  const isRuntimeTrainHomeVerificationEnabled = process.env.EXPO_PUBLIC_PPLUS_RUNTIME_SURFACE_OVERRIDE === 'authenticated_train_home';
  const isCoachBootstrapState = effectiveBootstrapState.status === 'authenticated_coach';
  const isAthleteLimitedState = !isRuntimeTrainHomeVerificationEnabled && !isCoachBootstrapState && (effectiveBootstrapState.status === 'authenticated' || effectiveBootstrapState.status === 'authenticated_no_workout');
  const profileViewProfile = useMemo(() => {
    if (isCoachBootstrapState) {
      return {
        id: effectiveBootstrapState.coachProfile?.id ?? null,
        displayName: effectiveBootstrapState.coachProfile?.displayName ?? '',
        firstName: effectiveBootstrapState.coachProfile?.firstName ?? '',
        lastName: effectiveBootstrapState.coachProfile?.lastName ?? '',
        dateOfBirth: '',
        position: effectiveBootstrapState.coachProfile?.organizationName || 'Coach profile connected',
        gender: '',
        heightCm: null,
        weightKg: null,
        avatarUrl: effectiveBootstrapState.coachProfile?.avatarUrl ?? null,
        phoneNumber: effectiveBootstrapState.coachProfile?.phoneNumber ?? '',
        unitsPreference: 'imperial',
        weightUnitPreference: effectiveBootstrapState.coachProfile?.weightUnitPreference ?? 'lb',
        distanceUnitPreference: effectiveBootstrapState.coachProfile?.distanceUnitPreference ?? 'km',
        themePreference: effectiveBootstrapState.coachProfile?.themePreference ?? 'dark',
      }
    }

    return effectiveBootstrapState.athleteProfile
  }, [effectiveBootstrapState.athleteProfile, effectiveBootstrapState.coachProfile, isCoachBootstrapState]);
  const appThemePreference = profileViewProfile?.themePreference || 'dark'
  const appTheme = useMemo(() => getAppTheme(appThemePreference), [appThemePreference])
  const styles = useMemo(() => createAppStyles(appTheme), [appTheme])

  const trainState = useMemo(() => ({ ...(effectiveRemoteTrainState || emptyTrainState), session }), [effectiveRemoteTrainState, emptyTrainState, session]);
  useEffect(() => {
    if (bootstrapState.status !== 'authenticated_coach') return
    console.info('[coach-train-body] handoff', {
      selectedCoachAthleteId,
      athleteProfileId: activeCoachAthleteProfile?.id ?? null,
      selectedAthleteName: selectedCoachAthlete?.name ?? '',
      effectiveRemoteTrainState: effectiveRemoteTrainState
        ? {
            todayWorkoutName: effectiveRemoteTrainState.today?.workoutName ?? '',
            scheduledLabel: effectiveRemoteTrainState.today?.scheduledLabel ?? '',
            programName: effectiveRemoteTrainState.program?.name ?? '',
            calendarWeekCount: Array.isArray(effectiveRemoteTrainState.program?.calendarWeek)
              ? effectiveRemoteTrainState.program.calendarWeek.length
              : 0,
            selectedProgramWorkoutId: effectiveRemoteTrainState.programWorkout?.id ?? null,
          }
        : null,
      fallbackTriggered: !effectiveRemoteTrainState,
      renderedTrainState: {
        todayWorkoutName: trainState.today?.workoutName ?? '',
        scheduledLabel: trainState.today?.scheduledLabel ?? '',
        programName: trainState.program?.name ?? '',
        calendarWeekCount: Array.isArray(trainState.program?.calendarWeek) ? trainState.program.calendarWeek.length : 0,
        selectedProgramWorkoutId: trainState.programWorkout?.id ?? null,
      },
    })
  }, [activeCoachAthleteProfile?.id, bootstrapState.status, effectiveRemoteTrainState, selectedCoachAthlete?.name, selectedCoachAthleteId, trainState]);
  const programSheetModel = useMemo(() => getProgramSheetModel(selectedProgramPreview || trainState), [selectedProgramPreview, trainState]);
  const programEditViewModel = useMemo(() => getProgramEditViewModel(selectedProgramPreview || trainState), [selectedProgramPreview, trainState]);
  const trainingCalendarModel = useMemo(() => getTrainingCalendarModel(trainState), [trainState]);
  const todayModel = useMemo(() => getTodaySurfaceModel(trainState), [trainState]);
  const workoutModel = useMemo(() => getWorkoutSurfaceModel(trainState, selectedCalendarDayId), [trainState, selectedCalendarDayId]);
  const selectedDayWorkoutPreview = trainState.program.calendarWeek.find((day) => day.id === selectedCalendarDayId)?.workoutPreview || null;
  const selectedProgramWorkoutId = workoutModel?.actionPayload?.programWorkoutId || selectedDayWorkoutPreview?.programWorkoutId || selectedDayWorkoutPreview?.id || null;
  const workoutSheetSession = selectedWorkoutSessionPreview || session;
  const resolvedWorkoutSheetProgramWorkout = selectedProgramWorkoutPreview || trainState.programWorkout;
  const effectiveWorkoutSheetModel = useMemo(
    () => selectedProgramWorkoutPreview
      ? {
          ...workoutModel,
          workoutName: selectedProgramWorkoutPreview.nameSnapshot ?? '',
          actionPayload: {
            ...(workoutModel?.actionPayload || {}),
            programWorkoutId: selectedProgramWorkoutPreview.id || selectedProgramWorkoutPreview.programWorkoutId || null,
          },
        }
      : workoutModel,
    [selectedProgramWorkoutPreview, workoutModel]
  );
  const workoutSheetModel = useMemo(() => getWorkoutSheetModel({ workoutModel: effectiveWorkoutSheetModel, session: workoutSheetSession, programWorkout: resolvedWorkoutSheetProgramWorkout, selectedDayId: selectedCalendarDayId }), [effectiveWorkoutSheetModel, resolvedWorkoutSheetProgramWorkout, selectedCalendarDayId, workoutSheetSession]);
  const workoutEditViewModel = useMemo(() => getWorkoutEditViewModel({ workoutSheetModel, workoutDraftModel: workoutEditDraftModel }), [workoutEditDraftModel, workoutSheetModel]);
  const activeWorkoutViewModel = useMemo(() => getActiveWorkoutViewModel({ session, elapsedSeconds }), [elapsedSeconds, session]);
  const canFinishActiveWorkout = useMemo(() => canFinishWorkoutSession(session), [session]);
  const selectedExercise = useMemo(() => {
    const allExercises = [...(workoutSheetModel?.exercises || []), ...(workoutEditViewModel?.exercises || []), ...(activeWorkoutViewModel?.exercises || [])];
    const matchedExercise = allExercises.find((exercise) => exercise.id === selectedExerciseId || exercise.exerciseId === selectedExerciseId) || null;
    if (!matchedExercise) return selectedExercisePreview || null;
    if (!selectedExercisePreview) return matchedExercise;
    const previewExerciseId = selectedExercisePreview.exerciseId || selectedExercisePreview.id;
    if (previewExerciseId !== selectedExerciseId) return matchedExercise;
    return { ...matchedExercise, ...selectedExercisePreview };
  }, [activeWorkoutViewModel, selectedExerciseId, selectedExercisePreview, workoutEditViewModel, workoutSheetModel]);

  const progressSessions = useMemo(() => {
    if (session.status === 'completed') {
      return [...trainState.completedSessions, session];
    }

    return trainState.completedSessions;
  }, [session, trainState.completedSessions]);
  const exerciseDetailViewModel = useMemo(() => getExerciseDetailViewModel({ exercise: selectedExercise, sessions: progressSessions }), [progressSessions, selectedExercise]);
  const calendarModel = useMemo(() => getCalendarSurfaceModel(trainState, selectedCalendarDayId), [trainState, selectedCalendarDayId]);
  const teamPlaceholder = useMemo(
    () => getPlaceholderSurfaceModel('Team', 'This surface will hold coach context, team relationships, and collaboration later.'),
    []
  );
  const teamSections = useMemo(() => getPlaceholderSections(teamPlaceholder), [teamPlaceholder]);
  const teamRenderPlan = useMemo(() => getGenericSectionRenderPlan(teamSections), [teamSections]);
  const inboxPlaceholder = useMemo(
    () => getPlaceholderSurfaceModel('Inbox', 'This surface will hold communication, reminders, and support flows later.'),
    []
  );
  const inboxSections = useMemo(() => getPlaceholderSections(inboxPlaceholder), [inboxPlaceholder]);
  const inboxRenderPlan = useMemo(() => getGenericSectionRenderPlan(inboxSections), [inboxSections]);
  const progressModel = useMemo(() => getProgressSurfaceModel({ sessions: progressSessions }), [progressSessions]);
  const analyticsStrengthSelectionContextId = activeCoachAthleteProfile?.id || authSession?.currentUserId || null;
  const analyticsScreen = useMemo(() => getAnalyticsViewModel({
    sessions: progressSessions,
    progressModel,
    strengthSelectionContextId: analyticsStrengthSelectionContextId,
  }), [analyticsStrengthSelectionContextId, progressModel, progressSessions]);
  const progressSections = useMemo(() => getProgressSections(progressModel), [progressModel]);
  const progressRenderPlan = useMemo(() => getGenericSectionRenderPlan(progressSections), [progressSections]);

  const selectedSet = session.activeRestTimer
    ? findSessionSet(session, session.activeRestTimer.exerciseId, session.activeRestTimer.setId)
    : null;
  const activeSessionModel = useMemo(
    () => getActiveSessionSurfaceModel(session, elapsedSeconds, selectedSet),
    [elapsedSeconds, selectedSet, session]
  );
  const completedSessionModel = useMemo(
    () => (session.status === 'completed' ? getCompletedSessionSurfaceModel(session, { completedSessions: progressSessions }) : null),
    [progressSessions, session]
  );
  const discardedSessionModel = useMemo(
    () => (session.status === 'discarded' ? getDiscardedSessionSurfaceModel(session) : null),
    [session]
  );
  const sessionSections = useMemo(() => getSessionSections(activeSessionModel), [activeSessionModel]);
  const sessionRenderPlan = useMemo(() => getSessionSectionRenderPlan(sessionSections), [sessionSections]);
  const sessionRenderModel = useMemo(
    () => getSessionRenderModel({ sessionRenderPlan, sessionStatus: session.status }),
    [session.status, sessionRenderPlan]
  );
  const trainSurfaceModel = useMemo(
    () =>
      getTrainSurfaceModel({
        trainTabs,
        activeTrainTab,
        todayModel,
        calendarModel,
        workoutModel,
        activeSessionModel,
        completedSessionModel,
        discardedSessionModel,
        persistedWorkoutListRows: persistedCreatedWorkoutRows,
      }),
    [
      activeSessionModel,
      activeTrainTab,
      calendarModel,
      completedSessionModel,
      discardedSessionModel,
      persistedCreatedWorkoutRows,
      todayModel,
      workoutModel,
    ]
  );
  const trainRenderModel = useMemo(
    () => getTrainRenderModel({ trainSurfaceModel, sessionSections: sessionRenderPlan }),
    [sessionRenderPlan, trainSurfaceModel]
  );
  const floatingStartWorkoutButtonModel = useMemo(() => {
    if (activeTab !== 'train') return null

    if (session?.status === 'in_progress') {
      const inProgressProgramWorkoutId = session?.programWorkoutId || session?.id || null

      return {
        kind: 'in-progress',
        label: session?.nameSnapshot || session?.name || 'Workout in progress',
        elapsedLabel: formatWorkoutTimer(elapsedSeconds),
        targetKey: 'start-workout',
        actionPayload: {
          programWorkoutId: inProgressProgramWorkoutId,
        },
      }
    }

    if (!workoutModel.hasWorkoutData) return null

    return {
      kind: 'start-workout',
      label: 'Start Workout',
      targetKey: 'start-workout',
      actionPayload: undefined,
    }
  }, [activeTab, elapsedSeconds, selectedCalendarDayId, session?.id, session?.name, session?.nameSnapshot, session?.programWorkoutId, session?.status, trainState.program.calendarWeek, workoutModel.hasWorkoutData]);
  const bootstrapSurfaceModel = useMemo(() => getBootstrapSurfaceModel({ bootstrapState: effectiveBootstrapState }), [effectiveBootstrapState]);
  const bootstrapSections = useMemo(
    () => (bootstrapSurfaceModel ? getPlaceholderSections(bootstrapSurfaceModel) : []),
    [bootstrapSurfaceModel]
  );
  const coachPlaceholderModel = useMemo(() => {
    if (!isCoachBootstrapState || activeTab === 'train' || activeTab === 'progress') {
      return null;
    }

    if (activeTab === 'team') {
      return getPlaceholderSurfaceModel('Programs', 'This placeholder will become the coach programming surface for templates, assigned plans, and scheduling control.');
    }

    return getPlaceholderSurfaceModel('Inbox', 'This placeholder will become the coach communication hub for athlete follow-up, reminders, and support.');
  }, [activeTab, isCoachBootstrapState]);
  const coachOverrideScreen = useMemo(() => {
    if (!isCoachBootstrapState) {
      return null;
    }

    if (activeTab === 'progress') {
      return null;
    }

    if (activeTab === 'train') {
      return null;
    }

    if (!coachPlaceholderModel) {
      return null;
    }

    return {
      type: 'train-bootstrap',
      sections: getPlaceholderSections(coachPlaceholderModel),
    };
  }, [activeTab, coachPlaceholderModel, isCoachBootstrapState]);
  const athleteLimitedPlaceholderModel = useMemo(() => {
    if (!isAthleteLimitedState || activeTab === 'progress') {
      return null;
    }

    return getPlaceholderSurfaceModel('Progress only', 'Athletes only see their own progress metrics here. Coach-side program, roster, and editing flows stay on the coach app.');
  }, [activeTab, isAthleteLimitedState]);
  const athleteLimitedOverrideScreen = useMemo(
    () => (athleteLimitedPlaceholderModel ? { type: 'train-bootstrap', sections: getPlaceholderSections(athleteLimitedPlaceholderModel) } : null),
    [athleteLimitedPlaceholderModel]
  );
  const authScreenModel = useMemo(
    () => ((effectiveBootstrapState.status === 'signed_out' || (isAuthPreviewEnabled && (authPreviewState === 'sign_in' || authPreviewState === 'sign_up')))
      ? getAuthScreenModel({
          mode: authPreviewState === 'sign_up' ? 'sign_up' : authMode,
          isSubmitting: isAuthSubmitting,
          errorMessage: authErrorMessage,
          noticeMessage: authNoticeMessage,
        })
      : null),
    [authErrorMessage, authMode, authNoticeMessage, authPreviewState, effectiveBootstrapState.status, isAuthPreviewEnabled, isAuthSubmitting]
  );
  const expectedAuthenticatedTrainHomeSession = effectiveSessionStore?.getCurrentSession() || effectiveRemoteTrainState?.session || null;
  const expectedSessionLineageId = expectedAuthenticatedTrainHomeSession?.programWorkoutId || expectedAuthenticatedTrainHomeSession?.id || null;
  const sessionLineageId = session?.programWorkoutId || session?.id || null;
  const isCoachTrainHomeReadinessPending = activeTab === 'train'
    && isCoachBootstrapState
    && activeCoachAthleteProfile?.id
    && coachTrainBridgeState.isHydrating;
  const isAuthenticatedTrainHomeReadinessPending = activeTab === 'train'
    && effectiveBootstrapState.status === 'authenticated'
    && effectiveRemoteTrainState?.program?.selectedCalendarDayId
    && sessionLineageId !== expectedSessionLineageId;
  const appRenderModel = useMemo(
    () =>
      getAppRenderModel({
        activeTab,
        bottomTabModels,
        trainRenderModel,
        analyticsScreen,
        progressSections: progressRenderPlan,
        teamSections: teamRenderPlan,
        inboxSections: inboxRenderPlan,
        overrideScreen: effectiveBootstrapState.status === 'signed_out' || (isAuthPreviewEnabled && (authPreviewState === 'sign_in' || authPreviewState === 'sign_up'))
            ? authScreenModel
            : isAthleteLimitedState && activeTab !== 'progress'
              ? athleteLimitedOverrideScreen
              : isCoachBootstrapState && isCoachTrainHomeReadinessPending
                ? { type: 'loading' }
                : isCoachBootstrapState
                  ? coachOverrideScreen
                  : activeTab === 'train'
                      ? ((effectiveBootstrapState.status === 'loading' || isAuthenticatedTrainHomeReadinessPending)
                          ? { type: 'loading' }
                          : bootstrapSections.length > 0
                            ? { type: 'train-bootstrap', sections: bootstrapSections }
                            : null)
                      : null,
      }),
    [activeTab, activeCoachAthleteProfile?.id, analyticsScreen, athleteLimitedOverrideScreen, authScreenModel, authPreviewState, bootstrapSections, bottomTabModels, coachOverrideScreen, effectiveBootstrapState.status, inboxRenderPlan, isAuthenticatedTrainHomeReadinessPending, isAuthPreviewEnabled, isAthleteLimitedState, isCoachBootstrapState, isCoachTrainHomeReadinessPending, progressRenderPlan, teamRenderPlan, trainRenderModel]
  );
  const isFullscreenAuthGate = appRenderModel.screen.type === 'auth';
  const isFullscreenLoading = appRenderModel.screen.type === 'loading' && !isProfileViewOpen

  useEffect(() => {
    if (isAthleteLimitedState) {
      setActiveTab('progress');
    }
  }, [isAthleteLimitedState]);

  useEffect(() => {
    const previousBootstrapStatus = previousBootstrapStatusRef.current;

    if (effectiveBootstrapState.status === 'authenticated_coach' && previousBootstrapStatus !== 'authenticated_coach') {
      setActiveTab('train');
    }

    previousBootstrapStatusRef.current = effectiveBootstrapState.status;
  }, [effectiveBootstrapState.status]);

  async function handleAuthSubmit({ mode, values }) {
    await orchestrateAuthSubmit({
      mode,
      values,
      resetPasswordForEmail,
      signUpWithPassword,
      signInWithPassword,
      setAuthErrorMessage,
      setAuthNoticeMessage,
      setIsAuthSubmitting,
      setAuthMode,
    });
  }

  async function handleCompleteSet(exerciseId, setId) {
    await orchestrateCompleteSet({
      session,
      exerciseId,
      setId,
      persistSessionUpdateOptimistic,
      setPostSetEffortAdjustment,
    });
  }

  async function handlePostSetEffortChange(nextEffort) {
    await orchestratePostSetEffortChange({
      session,
      nextEffort,
      postSetEffortAdjustment,
      persistSessionUpdateOptimistic,
      setPostSetEffortAdjustment,
    });
  }

  function handleClosePostSetEffortAdjustment() {
    orchestrateClosePostSetEffortAdjustment({
      setPostSetEffortAdjustment,
    });
  }

  async function handleFinishWorkout(completionPayload = {}) {
    await orchestrateFinishWorkout({
      session,
      elapsedSeconds,
      completionPayload,
      persistSessionUpdate,
      setPostSetEffortAdjustment,
      setSelectedWorkoutSessionPreview,
      setIsActiveWorkoutViewOpen,
      setActiveTrainTab,
    });
  }

  async function handleDiscardWorkout() {
    await orchestrateDiscardWorkout({
      session,
      elapsedSeconds,
      setPostSetEffortAdjustment,
      setIsActiveWorkoutViewOpen,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleCloseActiveWorkout() {
    orchestrateCloseActiveWorkout({
      session,
      setSelectedWorkoutSessionPreview,
      setIsActiveWorkoutViewOpen,
      setIsWorkoutSheetOpen,
      runAfterInteractions: InteractionManager.runAfterInteractions,
    });
  }

  async function handleQuickActualUpdate(exerciseId, setId, field, delta) {
    await orchestrateQuickActualUpdate({
      session,
      exerciseId,
      setId,
      field,
      delta,
      persistSessionUpdate,
    });
  }

  async function handleSessionSetValueChange(exerciseId, setId, field, nextValue) {
    await orchestrateSessionSetValueChange({
      session,
      exerciseId,
      setId,
      field,
      nextValue,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleAddSessionSet(exerciseId) {
    await orchestrateAddSessionSet({
      session,
      exerciseId,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleDeleteSessionSet(exerciseId, setId) {
    await orchestrateDeleteSessionSet({
      session,
      exerciseId,
      setId,
      setPostSetEffortAdjustment,
      persistSessionDeletionOptimistic,
    });
  }

  async function handleDeleteSessionExercise(exerciseId) {
    await orchestrateDeleteSessionExercise({
      session,
      exerciseId,
      setPostSetEffortAdjustment,
      persistSessionDeletionOptimistic,
    });
  }

  async function handleMoveActiveWorkoutExercise(exerciseId, direction) {
    await orchestrateMoveActiveWorkoutExercise({
      session,
      exerciseId,
      direction,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleExerciseRestTimeChange(exerciseId, nextRestSeconds) {
    await orchestrateExerciseRestTimeChange({
      session,
      exerciseId,
      nextRestSeconds,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleRemoveExerciseRestTime(exerciseId) {
    await orchestrateRemoveExerciseRestTime({
      session,
      exerciseId,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleAddExercisesToSession(exerciseIds) {
    await orchestrateAddExercisesToSession({
      session,
      exerciseIds,
      exerciseDetailClient,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleWorkoutNotesChange(nextNotes) {
    await orchestrateWorkoutNotesChange({
      session,
      nextNotes,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleWorkoutSettingsChange(settingsPatch) {
    await orchestrateWorkoutSettingsChange({
      session,
      settingsPatch,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleMoveWorkoutEditExercise(exerciseId, direction) {
    return orchestrateMoveWorkoutEditExercise({
      exercises: workoutEditViewModel?.exercises || [],
      exerciseId,
      direction,
      programSheetClient,
      setSelectedWorkoutSessionPreview,
    });
  }

  async function handleAddWorkoutEditSet(exerciseId) {
    return orchestrateAddWorkoutEditSet({
      exercises: workoutEditViewModel?.exercises || [],
      exerciseId,
      programSheetClient,
      setSelectedWorkoutSessionPreview,
    });
  }

  async function handleDeleteWorkoutEditSet(exerciseId, setId) {
    return orchestrateDeleteWorkoutEditSet({
      exercises: workoutEditViewModel?.exercises || [],
      exerciseId,
      setId,
      programSheetClient,
      setSelectedWorkoutSessionPreview,
    });
  }

  async function handleOpenWorkoutEditExercisePicker() {
    const currentExerciseIds = new Set((workoutEditViewModel?.exercises || []).map((exercise) => exercise.exerciseId || exercise.id));
    const items = await exerciseLibraryClient?.listExercises?.();
    const availableExercises = (items || []).filter((exercise) => !currentExerciseIds.has(exercise.id));
    setWorkoutEditDraftModel((currentDraft) => ({
      ...(currentDraft || {}),
      programWorkoutId: currentDraft?.programWorkoutId || workoutEditViewModel?.programWorkoutId || null,
      addExerciseSheet: {
        title: 'Exercises',
        searchPlaceholder: 'Search or Create Exercises',
        addButtonLabel: 'Add',
        exercises: availableExercises,
      },
      exercises: currentDraft?.exercises || workoutEditViewModel?.exercises || [],
    }));
    return availableExercises;
  }

  async function handleAddExercisesToWorkoutEdit(exerciseIds) {
    return orchestrateAddExercisesToWorkoutEdit({
      programWorkoutId: workoutEditViewModel?.programWorkoutId || workoutEditDraftModel?.programWorkoutId,
      exerciseIds,
      programSheetClient,
      exerciseLibraryClient,
      setSelectedWorkoutSessionPreview,
      setWorkoutEditDraftModel,
    });
  }

  async function handleSaveWorkoutEdit(draft) {
    const savedWorkout = await programSheetClient?.updateProgramWorkout?.({
      programWorkoutId: workoutEditViewModel?.programWorkoutId || workoutEditDraftModel?.programWorkoutId,
      nameSnapshot: draft?.workoutName || '',
      notes: draft?.workoutNotes || '',
    });

    if (!savedWorkout?.id) {
      handleCloseWorkoutEditView();
      return;
    }

    setSelectedProgramWorkoutPreview((currentWorkout) => currentWorkout?.id === savedWorkout.id
      ? { ...currentWorkout, nameSnapshot: savedWorkout.nameSnapshot, notes: savedWorkout.notes }
      : currentWorkout);
    setSelectedWorkoutSessionPreview((currentSession) => currentSession?.programWorkoutId === savedWorkout.id
      ? { ...currentSession, nameSnapshot: savedWorkout.nameSnapshot, notes: savedWorkout.notes }
      : currentSession);
    setWorkoutEditDraftModel((currentDraft) => currentDraft
      ? { ...currentDraft, title: savedWorkout.nameSnapshot, workoutNotes: savedWorkout.notes }
      : currentDraft);
    setPersistedCreatedWorkoutRows((currentRows) => currentRows.map((row) => row.actionPayload?.programWorkoutId === savedWorkout.id
      ? { ...row, title: savedWorkout.nameSnapshot }
      : row));
    handleCloseWorkoutEditView();
  }

  async function handleConfirmDeleteWorkout() {
    const deletedWorkoutId = workoutEditViewModel?.programWorkoutId || workoutEditDraftModel?.programWorkoutId
    if (!deletedWorkoutId) {
      setDeleteWorkoutErrorMessage('Missing workout id.')
      return
    }

    setIsDeletingWorkout(true)
    setDeleteWorkoutErrorMessage('')

    try {
      const deleteResult = await programSheetClient?.deleteProgramWorkout?.({
        programWorkoutId: workoutEditViewModel?.programWorkoutId || workoutEditDraftModel?.programWorkoutId,
      })

      if (!deleteResult?.success) {
        throw new Error('Workout delete did not complete.')
      }

      if (bootstrapState.status === 'authenticated_coach' && activeCoachAthleteProfile?.id && authSession?.accessToken) {
        const nextCoachTrainBridgeState = await hydrateCoachTrainBridge({
          athleteId: activeCoachAthleteProfile.id,
          currentUserId: authSession.currentUserId,
          accessToken: authSession.accessToken,
          programClient: createMobileProgramClient({ accessToken: authSession.accessToken }),
          workoutClient: createMobileWorkoutClient({ accessToken: authSession.accessToken }),
        })

        setCoachTrainBridgeState({
          ...nextCoachTrainBridgeState,
          isHydrating: false,
          hasResolved: true,
        })
      }

      setPersistedCreatedWorkoutRows((currentRows) => currentRows.filter((row) => row.actionPayload?.programWorkoutId !== deletedWorkoutId))
      setSelectedProgramWorkoutPreview((currentWorkout) => currentWorkout?.id === deletedWorkoutId ? null : currentWorkout)
      setSelectedWorkoutSessionPreview((currentSession) => currentSession?.programWorkoutId === deletedWorkoutId ? null : currentSession)
      setWorkoutEditDraftModel((currentDraft) => currentDraft?.programWorkoutId === deletedWorkoutId ? null : currentDraft)
      setIsDeleteWorkoutModalOpen(false)
      setDeleteWorkoutErrorMessage('')

      if (workoutEditReturnSurface === 'workout-sheet') {
        if (workoutSheetReturnSurface === 'program-sheet') {
          setIsProgramSheetOpen(true)
          setWorkoutSheetReturnSurface(null)
        }
        setWorkoutEditReturnSurface('train-home')
      }

      handleCloseWorkoutEditView()
    } catch (error) {
      setDeleteWorkoutErrorMessage(error?.message || 'Something went sideways while deleting this workout.')
    } finally {
      setIsDeletingWorkout(false)
    }
  }

  async function handleCreateWorkout() {
    const rawAthleteId = bootstrapState.status === 'authenticated_coach'
      ? activeCoachAthleteProfile?.id || null
      : bootstrapState.athleteProfile?.id || trainState.programWorkout?.athleteId || null;
    const rawCoachId = trainState.programWorkout?.coachId || activeCoachAthleteProfile?.coachId || null;
    const rawProgramId = trainState.program.id || null;
    const athleteId = isUuidValue(rawAthleteId) ? rawAthleteId : null;
    const coachId = isUuidValue(rawCoachId) ? rawCoachId : null;
    const programId = isUuidValue(rawProgramId) ? rawProgramId : null;
    const selectedProgramDayId = trainState.program.calendarWeek.find((day) => day.id === selectedCalendarDayId)?.programDayId || null;
    const relatedWorkoutCount = getRelatedWorkoutCount({
      calendarWeek: trainState.program.calendarWeek,
      persistedWorkoutListRows: persistedCreatedWorkoutRows,
      selectedDayId: selectedCalendarDayId,
    });
    const defaultWorkoutName = `Untitled Workout ${relatedWorkoutCount + 1}`;
    const createdWorkout = await programSheetClient?.createProgramWorkout?.({
      athleteId,
      coachId,
      programId,
      programDayId: selectedProgramDayId,
      nameSnapshot: defaultWorkoutName,
      notes: '',
      sortOrder: relatedWorkoutCount + 1,
    });

    if (!createdWorkout?.id) return;

    setSelectedProgramWorkoutPreview({
      ...createdWorkout,
      notes: createdWorkout.notes || '',
      exercises: [],
    });
    setSelectedWorkoutSessionPreview({
      programWorkoutId: createdWorkout.id,
      nameSnapshot: createdWorkout.nameSnapshot,
      notes: createdWorkout.notes || '',
      status: 'planned',
      exercises: [],
      totalExercisesCount: 0,
      totalSetsCount: 0,
    });
    setPersistedCreatedWorkoutRows((currentRows) => [{
      id: `created-workout-row-${createdWorkout.id}`,
      title: createdWorkout.nameSnapshot,
      body: `${workoutModel.dayLabel} · Scheduled`,
      targetKey: 'workout',
      actionPayload: {
        selectedDayId: selectedCalendarDayId,
        programWorkoutId: createdWorkout.id,
      },
    }, ...currentRows.filter((row) => row.actionPayload?.programWorkoutId !== createdWorkout.id)]);

    orchestrateOpenWorkoutEditView({
      setIsWorkoutSheetOpen,
      setIsWorkoutEditViewOpen,
      setWorkoutEditReturnSurface,
      nextReturnSurface: 'train-home',
      setWorkoutEditDraftModel,
      workoutDraftModel: {
        programWorkoutId: createdWorkout.id,
        title: createdWorkout.nameSnapshot,
        workoutNotes: createdWorkout.notes || '',
        workoutNamePlaceholder: 'Workout name',
        workoutNotesPlaceholder: 'Add notes',
        exerciseNotesPlaceholder: 'Add Notes',
        addExerciseLabel: 'Add Exercise',
        deleteLabel: 'Delete Workout',
        addSetLabel: 'Add Set',
        addExerciseSheet: {
          title: 'Exercises',
          searchPlaceholder: 'Search or Create Exercises',
          addButtonLabel: 'Add',
          exercises: [],
        },
        exercises: [],
      },
    });
  }

  async function handleDismissRestTimer() {
    await orchestrateDismissRestTimer({
      session,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleAdjustRestTimer(delta) {
    await orchestrateAdjustRestTimer({
      session,
      delta,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleStartWorkoutFromSheet(payload = null) {
    await orchestrateStartWorkoutFromSheet({
      effectiveSessionStore,
      selectedProgramWorkoutId: payload?.programWorkoutId || selectedProgramWorkoutId,
      session,
      selectedWorkoutSessionPreview,
      workoutSheetModel,
      startedAt: new Date().toISOString(),
      setIsStartingWorkout,
      setSession,
      setIsWorkoutSheetOpen,
      setIsActiveWorkoutViewOpen,
    });
  }

  async function handleOpenOrResumeSession(payload = null) {
    await orchestrateOpenOrResumeSession({
      effectiveSessionStore,
      session,
      selectedProgramWorkoutId: payload?.programWorkoutId || selectedProgramWorkoutId,
      setIsWorkoutSheetOpen,
      setSession,
      setActiveTrainTab,
    });
  }

  async function handleTrainNavigation(targetKey, payload = null) {
    if (payload?.selectedDayId) {
      setSelectedCalendarDayId(payload.selectedDayId);
    }

    if (targetKey === 'coach-athlete-workspace-open') {
      orchestrateCoachAthleteWorkspaceOpen({
        payload,
        selectedCoachAthleteId,
        setSelectedCoachAthleteId,
        setIsCoachAthletesSheetOpen,
        setIsCoachAthleteWorkspaceOpen,
      });
      return;
    }

    if (targetKey === 'coach-athlete-select') {
      orchestrateCoachAthleteSelect({
        payload,
        selectedCoachAthleteId,
        setSelectedCoachAthleteId,
        setIsCoachAthletesSheetOpen,
        setIsCoachAthleteWorkspaceOpen,
        setCoachMetricNotice,
        setCoachMetricError,
      });
      return;
    }

    if (targetKey === 'coach-athlete-invite') {
      setIsCoachAthletesSheetOpen(false);
      setIsInviteAthleteViewOpen(true);
      setInviteAthleteEmail('');
      setAthleteInvitationErrorMessage('');
      return;
    }

    if (targetKey === 'start-workout') {
      await handleStartWorkoutFromSheet(payload);
      return;
    }

    if (targetKey === 'calendar-day-select') {
      return;
    }

    if (targetKey === 'exercise-detail') {
      handleOpenExerciseDetail(payload?.exercise ?? payload, payload?.sourceSurface ?? 'completed-session');
      return;
    }

    if (targetKey === 'program') {
      orchestrateOpenProgramSheet({
        trainState,
        programSheetClient,
        setProgramSheetReturnSurface,
        setSelectedProgramPreview,
        setIsProgramSheetOpen,
      });
      return;
    }

    if (targetKey === 'create-workout') {
      await handleCreateWorkout();
      return;
    }

    if (targetKey === 'workout') {
      const {
        requestedCalendarDayId,
        requestedDayWorkoutPreview,
        requestedProgramWorkoutId,
        immediateProgramWorkout,
        workoutOpenRequestContext,
      } = deriveWorkoutOpenRequestContext({
        payload,
        selectedCalendarDayId,
        selectedProgramWorkoutId,
        trainState,
      });

      await orchestrateWorkoutOpen({
        targetKey,
        payload,
        selectedCalendarDayId,
        selectedProgramWorkoutId,
        workoutOpenRequestContext: {
          requestedCalendarDayId,
          requestedDayWorkoutPreview,
          requestedProgramWorkoutId,
          ...workoutOpenRequestContext,
        },
        requestedProgramWorkoutId,
        immediateProgramWorkout,
        effectiveSessionStore,
        workoutClient: createMobileWorkoutClient({ accessToken: authSession.accessToken }),
        session,
        trainState,
        selectedWorkoutSessionPreview,
        setIsWorkoutSheetOpen,
        setSelectedProgramWorkoutPreview,
        setSelectedWorkoutSessionPreview,
      });
      return;
    }

    if (targetKey === 'session') {
      await handleOpenOrResumeSession(payload);
      return;
    }

    if (targetKey) {
      setActiveTrainTab(targetKey);
    }
  }

  function handleCloseInviteAthleteView() {
    setIsInviteAthleteViewOpen(false);
    setAthleteInvitationErrorMessage('');
    setIsCoachAthletesSheetOpen(true);
  }

  async function handleSendAthleteInvitation() {
    setIsSendingAthleteInvitation(true);
    setAthleteInvitationErrorMessage('');

    try {
      const invitationClient = createMobileInvitationClient({ accessToken: authSession.accessToken });
      await sendCoachAthleteInvitation({
        invitationClient,
        inviteeEmail: inviteAthleteEmail,
        coachProfile: effectiveBootstrapState.coachProfile,
        appStoreUrl: process.env.EXPO_PUBLIC_PPLUS_APP_STORE_URL || '',
      });
      setIsInviteAthleteViewOpen(false);
      setIsInvitationSuccessViewOpen(true);
    } catch (error) {
      setAthleteInvitationErrorMessage(error?.message || 'Something went sideways while sending the athlete invitation.');
    } finally {
      setIsSendingAthleteInvitation(false);
    }
  }

  function handleCloseInvitationSuccessView() {
    setIsInvitationSuccessViewOpen(false);
    setIsCoachAthletesSheetOpen(true);
  }

  function handleOpenProgramDetail(program, sourceSurface = null) {
    if (!program?.id) return;

    orchestrateOpenProgramSheet({
      program,
      sourceSurface,
      closeProfileView: () => setIsProfileViewOpen(false),
      programSheetClient,
      setProgramSheetReturnSurface,
      setSelectedProgramPreview,
      setIsProgramSheetOpen,
    });
  }

  function handleCloseProgramSheet() {
    orchestrateCloseProgramSheet({
      programSheetReturnSurface,
      setIsProgramSheetOpen,
      setIsProfileViewOpen,
      setProgramSheetReturnSurface,
      setSelectedProgramPreview,
    });
  }

  async function handleOpenProgramSheetWorkout(workout) {
    if (!workout?.programWorkoutId) return;

    setIsProgramSheetOpen(false);
    setWorkoutSheetReturnSurface('program-sheet');

    await handleTrainNavigation('workout', {
      programWorkoutId: workout.programWorkoutId,
      selectedDayId: workout.programDayId,
    });
  }

  function handleCloseWorkoutSheet() {
    setIsWorkoutSheetOpen(false);

    if (workoutSheetReturnSurface === 'program-sheet') {
      setIsProgramSheetOpen(true);
      setWorkoutSheetReturnSurface(null);
    }
  }

  function handleOpenProgramEditView() {
    orchestrateOpenProgramEditView({
      setIsProgramSheetOpen,
      setIsProgramEditViewOpen,
    });
  }

  function handleCloseProgramEditView() {
    orchestrateCloseProgramEditView({
      setIsProgramEditViewOpen,
      setIsProgramSheetOpen,
    });
  }

  function handleOpenWorkoutEditView() {
    setIsDeleteWorkoutModalOpen(false)
    setDeleteWorkoutErrorMessage('')
    orchestrateOpenWorkoutEditView({
      setIsWorkoutSheetOpen,
      setIsWorkoutEditViewOpen,
      setWorkoutEditReturnSurface,
      nextReturnSurface: 'workout-sheet',
      setWorkoutEditDraftModel,
      workoutDraftModel: null,
    });
  }

  function handleCloseWorkoutEditView() {
    setIsDeleteWorkoutModalOpen(false)
    setDeleteWorkoutErrorMessage('')
    orchestrateCloseWorkoutEditView({
      workoutEditReturnSurface,
      setIsWorkoutEditViewOpen,
      setIsWorkoutSheetOpen,
      setWorkoutEditReturnSurface,
      setWorkoutEditDraftModel,
    });
  }

  function handleTabPress(nextTab) {
    if (isCoachBootstrapState && nextTab === 'inbox') {
      setIsCoachAthletesSheetOpen(true);
      return;
    }
    setActiveTab(nextTab);
  }

  function handleOpenExerciseDetail(exercise, sourceSurface = null) {
    orchestrateOpenExerciseDetail({
      exercise,
      sourceSurface,
      exerciseDetailClient,
      logger: console,
      setSelectedExerciseId,
      setSelectedExercisePreview,
      setExerciseDetailReturnSurface,
      setIsWorkoutSheetOpen,
      setIsWorkoutEditViewOpen,
      setIsProfileViewOpen,
      setIsActiveWorkoutViewOpen,
      setIsExerciseDetailViewOpen,
    });
  }

  async function handleCloseExerciseDetail() {
    orchestrateCloseExerciseDetail({
      exerciseDetailReturnSurface,
      setIsExerciseDetailViewOpen,
      setIsWorkoutSheetOpen,
      setIsWorkoutEditViewOpen,
      setIsProfileViewOpen,
      setIsActiveWorkoutViewOpen,
      setExerciseDetailReturnSurface,
    });
  }

  async function handleProfileSignOut() {
    await orchestrateProfileSignOut({
      signOut,
      setAuthErrorMessage,
      setAuthNoticeMessage,
      setProfileSaveNotice,
      setAuthMode,
      setIsProfileViewOpen,
    });
  }

  async function handleThemePreferenceChange(nextThemePreference) {
    await orchestrateThemePreferenceChange({
      nextThemePreference,
      isCoachBootstrapState,
      updateCoachProfile,
      updateAthleteProfile,
      setAuthErrorMessage,
      setAuthNoticeMessage,
      setProfileSaveNotice,
      logger: console,
    });
  }

  async function handleUnitsPreferenceChange(updates = {}) {
    await orchestrateUnitsPreferenceChange({
      updates,
      profileViewProfile,
      isCoachBootstrapState,
      updateCoachProfile,
      updateAthleteProfile,
      logger: console,
    });
  }

  async function handleSaveProfile(profileDraft) {
    await orchestrateSaveProfile({
      profileDraft,
      isCoachBootstrapState,
      updateCoachProfile,
      updateAthleteProfile,
      setAuthErrorMessage,
      setAuthNoticeMessage,
      setProfileSaveNotice,
      setIsProfileSaving,
    });
  }

  async function handleSaveCoachReadinessMetric() {
    await orchestrateSaveCoachReadinessMetric({
      selectedCoachAthlete: coachWorkspaceAthlete,
      createCoachBodyMetricLog,
      setCoachMetricNotice,
      setCoachMetricError,
      setIsCoachMetricSaving,
    });
  }

  if (isFullscreenAuthGate) {
    return (
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
          <AuthView
            mode={authMode}
            isSubmitting={isAuthSubmitting}
            errorMessage={authErrorMessage}
            noticeMessage={authNoticeMessage}
            theme={appTheme}
            onModeChange={(nextMode) => {
              setAuthMode(nextMode)
              setAuthErrorMessage('')
              setAuthNoticeMessage('')
            }}
            onForgotPassword={() => {
              setAuthMode('forgot_password')
              setAuthErrorMessage('')
              setAuthNoticeMessage('')
            }}
            onSubmit={handleAuthSubmit}
          />
          <StatusBar style={appThemePreference === 'light' ? 'dark' : 'light'} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (isFullscreenLoading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
          <LoadingView theme={appTheme} />
          <StatusBar style={appThemePreference === 'light' ? 'dark' : 'light'} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
        {isAuthPreviewEnabled ? (
          <View style={styles.previewBar}>
            <View style={styles.previewHeaderTopRow}>
              <Text style={styles.previewBarLabel}>Auth Preview</Text>
              <Text style={styles.previewHeaderActiveLabel}>{authPreviewModels.find((state) => state.isActive)?.label || 'Live'}</Text>
            </View>
            <View style={styles.previewButtonRow}>
              {authPreviewModels.map((state) => (
                <Pressable
                  key={state.key}
                  style={[styles.previewButton, state.isActive && styles.previewButtonActive]}
                onPress={() => {
                  setAuthPreviewState(state.key)
                  if (state.key === 'sign_up') {
                    setAuthMode('sign_up')
                  }
                  if (state.key === 'sign_in') {
                    setAuthMode('sign_in')
                  }
                  if (state.key === 'live' && authMode === 'forgot_password') {
                    setAuthMode('sign_in')
                  }
                  setAuthErrorMessage('')
                  setAuthNoticeMessage('')
                }}
>
                  <Text style={[styles.previewButtonText, state.isActive && styles.previewButtonTextActive]}>{state.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {renderAppShell({
          styles,
          screen: appRenderModel.screen,
          bottomTabs: bottomTabViewItems,
          activeAthleteSummary: isCoachBootstrapState ? activeCoachAthleteSummary : null,
          floatingStartWorkoutButton: floatingStartWorkoutButtonModel,
          trainRenderModel,
          sessionRenderModel,
          onTabPress: handleTabPress,
          onProfileHeaderPress: () => {
            if (isAthleteLimitedState) return;
            setIsProfileViewOpen(true);
          },
          onUtilityHeaderPress: () => setIsTrainingCalendarOpen(true),
          onActionTarget: handleTrainNavigation,
          renderTrainSurface: ({ trainRenderModel, sessionRenderModel, styles }) =>
            renderTrainSurface({
              trainRenderModel,
              sessionRenderModel,
              styles,
              onTrainTabPress: setActiveTrainTab,
              onActionTarget: handleTrainNavigation,
              renderSections: (sections, onActionTarget) => renderGenericSections({ sections, styles, onActionTarget }),
              renderSessionSections: (sections) =>
                renderSessionSections({
                  sections,
                  styles,
                  statusStyles,
                  onFinishWorkout: handleFinishWorkout,
                  onDiscardWorkout: handleDiscardWorkout,
                  onDismissRestTimer: handleDismissRestTimer,
                  onAdjustRestTimer: handleAdjustRestTimer,
                  onCompleteSet: handleCompleteSet,
                  onQuickActualUpdate: handleQuickActualUpdate,
                }),
            }),
          renderAnalyticsView: (screen) => <AnalyticsView model={screen} theme={appTheme} onOpenExerciseDetail={(exercise) => handleOpenExerciseDetail(exercise, 'metrics-strength')} />,
          renderAuthView: () => (
            <AuthView
              mode={authMode}
              isSubmitting={isAuthSubmitting}
              errorMessage={authErrorMessage}
              noticeMessage={authNoticeMessage}
              theme={appTheme}
              onModeChange={(nextMode) => {
                setAuthMode(nextMode)
                setAuthErrorMessage('')
                setAuthNoticeMessage('')
              }}
              onForgotPassword={() => {
                setAuthMode('forgot_password')
                setAuthErrorMessage('')
                setAuthNoticeMessage('')
              }}
              onSubmit={handleAuthSubmit}
            />
          ),
          renderLoadingView: () => <LoadingView theme={appTheme} />,
          renderGenericSections: ({ sections, styles, onActionTarget }) => renderGenericSections({ sections, styles, onActionTarget }),
        })}
        {renderProgramSheet({
          isVisible: isProgramSheetOpen,
          onClose: handleCloseProgramSheet,
          onEditProgram: handleOpenProgramEditView,
          onOpenWorkoutDetail: handleOpenProgramSheetWorkout,
          model: programSheetModel,
          theme: appTheme,
        })}

        <ProgramEditView
          isVisible={isProgramEditViewOpen}
          model={programEditViewModel}
          theme={appTheme}
          onClose={handleCloseProgramEditView}
          onSave={handleCloseProgramEditView}
        />

      <CoachAthletesSheet
        isVisible={isCoachAthletesSheetOpen}
        onClose={() => setIsCoachAthletesSheetOpen(false)}
        athletes={coachAthletesList}
        selectedAthleteId={selectedCoachAthleteId}
        onActionTarget={handleTrainNavigation}
        theme={appTheme}
      />
      <InviteAthleteView
        isVisible={isInviteAthleteViewOpen}
        email={inviteAthleteEmail}
        onChangeEmail={setInviteAthleteEmail}
        onClose={handleCloseInviteAthleteView}
        onSendInvitation={handleSendAthleteInvitation}
        isSubmitting={isSendingAthleteInvitation}
        errorMessage={athleteInvitationErrorMessage}
        theme={appTheme}
      />
      <InvitationSuccessView
        isVisible={isInvitationSuccessViewOpen}
        onClose={handleCloseInvitationSuccessView}
        theme={appTheme}
      />
        <CoachAthleteWorkspaceSheet
          isVisible={isCoachAthleteWorkspaceOpen}
          onClose={() => setIsCoachAthleteWorkspaceOpen(false)}
          selectedAthlete={coachWorkspaceAthlete}
          readinessDraft={coachReadinessDraft}
          workspaceFormVersion={coachWorkspaceFormVersion}
          onChangeReadinessDraft={setCoachReadinessDraft}
          onSaveReadinessMetric={handleSaveCoachReadinessMetric}
          isSavingMetric={isCoachMetricSaving}
          saveNotice={coachMetricNotice}
          saveErrorMessage={coachMetricError}
          theme={appTheme}
        />
        <TrainingCalendarSheet
          isVisible={isTrainingCalendarOpen}
          onClose={() => setIsTrainingCalendarOpen(false)}
          model={trainingCalendarModel}
          theme={appTheme}
        />
        <WorkoutSheet
          isVisible={isWorkoutSheetOpen}
          model={workoutSheetModel}
          theme={appTheme}
          onClose={handleCloseWorkoutSheet}
          onEditWorkout={handleOpenWorkoutEditView}
          onOpenExerciseDetail={(exercise) => handleOpenExerciseDetail(exercise, 'workout-sheet')}
          onStartWorkout={handleStartWorkoutFromSheet}
          isStartingWorkout={isStartingWorkout}
        />
      <WorkoutEditView
        isVisible={isWorkoutEditViewOpen}
        key={`${workoutEditViewModel?.programWorkoutId || 'draft'}:${workoutEditViewModel?.title || workoutEditDraftModel?.title || ''}`}
        model={workoutEditViewModel}
        onClose={handleCloseWorkoutEditView}
        onSave={handleSaveWorkoutEdit}
        onAddSet={handleAddWorkoutEditSet}
        onDeleteSet={handleDeleteWorkoutEditSet}
        onMoveExercise={handleMoveWorkoutEditExercise}
        onOpenExerciseDetail={(exercise) => handleOpenExerciseDetail(exercise, 'workout-edit')}
        onAddExercise={handleOpenWorkoutEditExercisePicker}
        onAddExercises={handleAddExercisesToWorkoutEdit}
        onOpenDeleteWorkout={() => setIsDeleteWorkoutModalOpen(true)}
        onCloseDeleteWorkoutModal={() => setIsDeleteWorkoutModalOpen(false)}
        onConfirmDeleteWorkout={handleConfirmDeleteWorkout}
        isDeleteWorkoutModalOpen={isDeleteWorkoutModalOpen}
        isDeletingWorkout={isDeletingWorkout}
        deleteWorkoutErrorMessage={deleteWorkoutErrorMessage}
        theme={appTheme}
      />

      <ActiveWorkoutView
          isVisible={isActiveWorkoutViewOpen}
          model={activeWorkoutViewModel}
          theme={appTheme}
          onClose={handleCloseActiveWorkout}
          onFinish={handleFinishWorkout}
          onDiscard={handleDiscardWorkout}
          canFinishWorkout={canFinishActiveWorkout}
          onAddSet={handleAddSessionSet}
          onDeleteSet={handleDeleteSessionSet}
          onDeleteExercise={handleDeleteSessionExercise}
          onMoveExercise={handleMoveActiveWorkoutExercise}
          onOpenExerciseDetail={(exercise) => handleOpenExerciseDetail(exercise, 'active-workout')}
          onWorkoutNotesChange={handleWorkoutNotesChange}
          onExerciseRestTimeChange={handleExerciseRestTimeChange}
          onRemoveExerciseRestTime={handleRemoveExerciseRestTime}
          onAddExercises={handleAddExercisesToSession}
          availableExercises={activeWorkoutAvailableExercises}
          isLoadingAvailableExercises={isActiveWorkoutExercisesLoading}
          availableExercisesError={activeWorkoutExercisesError}
          onCompleteSet={handleCompleteSet}
          onAdjustRestTimer={handleAdjustRestTimer}
          onDismissRestTimer={handleDismissRestTimer}
          onSetValueChange={handleSessionSetValueChange}
          postSetEffortAdjustment={postSetEffortAdjustment}
          onPostSetEffortChange={handlePostSetEffortChange}
          onClosePostSetEffortAdjustment={handleClosePostSetEffortAdjustment}
          onUpdateWorkoutSettings={handleWorkoutSettingsChange}
        />
        <ExerciseDetailView
          isVisible={isExerciseDetailViewOpen}
          model={exerciseDetailViewModel}
          theme={appTheme}
          onClose={handleCloseExerciseDetail}
        />
        <ProfileView isVisible={isProfileViewOpen} onClose={() => setIsProfileViewOpen(false)} onSignOut={handleProfileSignOut} athleteProfile={profileViewProfile} onSaveProfile={handleSaveProfile} isSavingProfile={isProfileSaving} saveNotice={profileSaveNotice} role={isCoachBootstrapState ? 'coach' : 'athlete'} onOpenAthletes={() => setIsCoachAthletesSheetOpen(true)} onOpenExerciseDetail={(exercise) => handleOpenExerciseDetail(exercise, 'profile-view')} onOpenProgramDetail={(program) => handleOpenProgramDetail(program, 'profile-view')} themePreference={appThemePreference} onChangeThemePreference={handleThemePreferenceChange} weightUnitPreference={profileViewProfile?.weightUnitPreference || 'lb'} distanceUnitPreference={profileViewProfile?.distanceUnitPreference || 'km'} onChangeWeightUnitPreference={(nextWeightUnitPreference) => handleUnitsPreferenceChange({ weightUnitPreference: nextWeightUnitPreference })} onChangeDistanceUnitPreference={(nextDistanceUnitPreference) => handleUnitsPreferenceChange({ distanceUnitPreference: nextDistanceUnitPreference })} theme={appTheme} />
        <StatusBar style={appThemePreference === 'light' ? 'dark' : 'light'} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
