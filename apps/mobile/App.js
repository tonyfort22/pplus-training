import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { InteractionManager, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as data from '../../packages/data/src/index.js';
import {
  adjustRestTimer,
  canFinishWorkoutSession,
  discardWorkoutSession,
  formatWorkoutTimer,
} from '@pplus/core';
import { advanceSessionAfterRestTimerExpiry, findSessionSet } from '../../packages/core/src/index.js';
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
import { createEmptyGroupEditDraftModel, getGroupEditViewModel } from './src/groups/group-edit-view-models.js';
import { getActiveWorkoutViewModel } from './src/train/active-workout-view-models.js';
import { getExerciseDetailViewModel } from './src/train/exercise-detail-view-models.js';
import { getAnalyticsViewModel, getPlaceholderSurfaceModel, getProgressSurfaceModel } from './src/progress/index.js';
import { getAppRenderModel } from './src/screens/app-render-models.js';
import { getGroupsSections, getPlaceholderSections, getProgressSections } from './src/screens/surface-sections.js';
import { getGenericSectionRenderPlan, getSessionSectionRenderPlan } from './src/screens/render-plans.js';
import { getSessionRenderModel } from './src/screens/session-render-models.js';
import { getSessionSections } from './src/screens/session-sections.js';
import { renderGenericSections, renderSessionSections, renderTrainSurface } from './src/screens/renderers.js';
import { renderProgramSheet } from './src/screens/program-sheet.js';
import { ProgramEditView } from './src/screens/program-edit-view.js';
import { TrainingCalendarSheet } from './src/screens/training-calendar-sheet.js';
import { WorkoutSheet } from './src/screens/workout-sheet.js';
import { WorkoutEditView } from './src/screens/workout-edit-view.js';
import { GroupEditView } from './src/screens/group-edit-view.js';
import { ActiveWorkoutView } from './src/screens/active-workout-view.js';
import { CoachAthletesSheet } from './src/screens/coach-athletes-sheet.js';
import { InviteAthleteView } from './src/screens/invite-athlete-view.js';
import { InvitationSuccessView } from './src/screens/invitation-success-view.js';
import { InvitationCodeEntryView } from './src/screens/invitation-code-entry-view.js';
import { AthleteInviteOnboardingView } from './src/screens/athlete-invite-onboarding-view.js';
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
import { resolveCoachSelectedAthleteStorage } from './src/train/coach-athlete-context-storage.js';
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
  orchestrateCreateSessionSuperset,
  orchestrateRemoveSessionSuperset,
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

const INVITED_ATHLETE_COMPLETION_STATES = Object.freeze({
  IDLE: 'idle',
  SUBMITTING: 'submitting',
  UNAVAILABLE: 'unavailable',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
});

const initialInvitationOnboardingValues = {
  avatarUrl: '',
  avatarAsset: null,
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  gender: '',
  position: '',
  weightUnit: 'lb',
  weight: '70',
  heightUnit: 'ft',
  heightFeet: '5',
  heightInches: '9',
  heightCm: '175',
};

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

function createProfileGroupUpdateSafeGroupsClient() {
  return {
    async updateGroup({ groupId, name, athleteIds = [] } = {}) {
      return {
        id: groupId,
        name,
        athleteIds,
        athleteCount: athleteIds.length,
        athleteCountLabel: `${athleteIds.length} ${athleteIds.length === 1 ? 'athlete' : 'athletes'}`,
        status: 'active',
      }
    },
    async createGroup({ coachId, name, athleteIds = [] } = {}) {
      return {
        id: 'group-profile-update-safe-created',
        coachId,
        name,
        athleteIds,
        athleteCount: athleteIds.length,
        athleteCountLabel: `${athleteIds.length} ${athleteIds.length === 1 ? 'athlete' : 'athletes'}`,
        status: 'active',
      }
    },
  }
}

function createMobileGroupsClient({ env = process.env, fetchImpl = globalThis.fetch, accessToken = null } = {}) {
  if (env?.EXPO_PUBLIC_PPLUS_PROFILE_GROUP_UPDATE_FIXTURE === 'profile_group_update_safe') {
    return createProfileGroupUpdateSafeGroupsClient()
  }

  const url = env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return data.groups.createSupabaseRestGroupRepository({
    url,
    anonKey,
    accessToken,
    fetchImpl,
  });
}

function normalizeGroupAthleteIdForPersistence(athleteId) {
  const value = String(athleteId || '').trim();
  const prefixedValue = value.startsWith('coach-athlete-') ? value.slice('coach-athlete-'.length) : value;
  return prefixedValue || null;
}

function normalizeCoachAthleteProfileId(athleteId) {
  const value = String(athleteId || '').trim();
  return value.startsWith('coach-athlete-') ? value.slice('coach-athlete-'.length) : value || null;
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
  const { authSession, bootstrapState, sessionStore, signInWithPassword, signUpWithPassword, resetPasswordForEmail, signOut, refreshAuthSession, updateAuthSession, updateAthleteProfile, updateCoachProfile, createCoachBodyMetricLog, getLatestCoachBodyMetricLog } = useMobileAuthSession();
  const runtimeAuthPreviewEnv = globalThis.process?.env || {};
  const runtimeAuthPreviewState = runtimeAuthPreviewEnv.EXPO_PUBLIC_PPLUS_RUNTIME_AUTH_PREVIEW || process.env.EXPO_PUBLIC_PPLUS_RUNTIME_AUTH_PREVIEW || null;
  const runtimeBootstrapOverride = runtimeAuthPreviewEnv.EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE || process.env.EXPO_PUBLIC_PPLUS_RUNTIME_BOOTSTRAP_OVERRIDE || null;
  const isAuthPreviewEnabled = runtimeAuthPreviewState === 'sign_in' || runtimeAuthPreviewState === 'sign_up';
  const [authPreviewState, setAuthPreviewState] = useState(runtimeAuthPreviewState || 'live');
  const [authMode, setAuthMode] = useState('sign_in');
  const [authErrorMessage, setAuthErrorMessage] = useState('');
  const [authNoticeMessage, setAuthNoticeMessage] = useState('');
  const [authInvitationCode, setAuthInvitationCode] = useState('');
  const [authInvitationCodeErrorMessage, setAuthInvitationCodeErrorMessage] = useState('');
  const [authInvitationOnboardingStep, setAuthInvitationOnboardingStep] = useState(0);
  const [authInvitationOnboardingValues, setAuthInvitationOnboardingValues] = useState(initialInvitationOnboardingValues);
  const [invitedAthleteCompletionState, setInvitedAthleteCompletionState] = useState(INVITED_ATHLETE_COMPLETION_STATES.IDLE);
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [profileSaveNotice, setProfileSaveNotice] = useState('');
  const [isCoachMetricSaving, setIsCoachMetricSaving] = useState(false);
  const [coachMetricNotice, setCoachMetricNotice] = useState('');
  const [coachMetricError, setCoachMetricError] = useState('');
  const [coachReadinessDraft, setCoachReadinessDraft] = useState({ percent: '', note: '' });
  const [coachWorkspaceFormVersion, setCoachWorkspaceFormVersion] = useState(0);
  const optimisticSessionMutationRef = useRef(0);
  const activeStartWorkoutRequestRef = useRef(0);
  const isActiveWorkoutHandoffPendingRef = useRef(false);
  const discardedSessionIdsRef = useRef(new Set());
  const previousBootstrapStatusRef = useRef(bootstrapState.status);
  const [activeTab, setActiveTab] = useState('train');
  const [activeTrainTab, setActiveTrainTab] = useState('calendar');
  const [isProgramSheetOpen, setIsProgramSheetOpen] = useState(false);
  const [isProgramEditViewOpen, setIsProgramEditViewOpen] = useState(false);
  const [programSheetReturnSurface, setProgramSheetReturnSurface] = useState(null);
  const [selectedProgramPreview, setSelectedProgramPreview] = useState(null);
  const [workoutSheetReturnSurface, setWorkoutSheetReturnSurface] = useState(null);
  const [isTrainingCalendarOpen, setIsTrainingCalendarOpen] = useState(false);
  const [trainingCalendarReturnSurface, setTrainingCalendarReturnSurface] = useState(null);
  const [isWorkoutSheetOpen, setIsWorkoutSheetOpen] = useState(false);
  const [selectedProgramWorkoutPreview, setSelectedProgramWorkoutPreview] = useState(null);
  const [selectedWorkoutSessionPreview, setSelectedWorkoutSessionPreview] = useState(null);
  const [persistedCreatedWorkoutRows, setPersistedCreatedWorkoutRows] = useState([]);
  const [workoutEditReturnSurface, setWorkoutEditReturnSurface] = useState(null);
  const [workoutEditDraftModel, setWorkoutEditDraftModel] = useState(null);
  const [isGroupEditViewOpen, setIsGroupEditViewOpen] = useState(false);
  const [selectedGroupEditModel, setSelectedGroupEditModel] = useState(null);
  const [groupEditDraftModel, setGroupEditDraftModel] = useState(null);
  const [isSavingGroupEdit, setIsSavingGroupEdit] = useState(false);
  const [groupEditErrorMessage, setGroupEditErrorMessage] = useState('');
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
  const [hasRehydratedSelectedCoachAthleteContext, setHasRehydratedSelectedCoachAthleteContext] = useState(false);
  const workflowContextKeyRef = useRef(null);
  const coachSelectedAthleteStorageRef = useRef(null);
  const invitationClient = useMemo(() => createMobileInvitationClient({ accessToken: authSession.accessToken }), [authSession.accessToken]);
  const invitationCompletionClient = useMemo(() => createMobileInvitationClient({ accessToken: null }), []);
  const [coachTrainBridgeState, setCoachTrainBridgeState] = useState({ trainState: null, sessionStore: null, isHydrating: false, hasResolved: false });
  const [session, setSession] = useState(() => emptySession);
  const exerciseDetailClient = useMemo(() => createMobileExerciseDetailClient(), []);
  const exerciseLibraryClient = useMemo(() => createMobileExerciseLibraryClient(), []);
  const programSheetClient = useMemo(() => createMobileProgramClient({ accessToken: authSession?.accessToken }), [authSession?.accessToken]);
  const groupEditClient = useMemo(() => createMobileGroupsClient({ accessToken: authSession?.accessToken }), [authSession?.accessToken]);
  const activeWorkoutExerciseIds = useMemo(() => new Set((session?.exercises || []).map((exercise) => exercise.exerciseId || exercise.id)), [session]);
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
  const isCoachAthletesLoading = bootstrapState.status === 'loading'
  const selectedCoachAthlete = useMemo(() => {
    const selectedProfileId = normalizeCoachAthleteProfileId(selectedCoachAthleteId)
    return coachAthleteOptions.find((athlete) => athlete.id === selectedCoachAthleteId || athlete.athleteProfileId === selectedProfileId) || null;
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

    const selectedProfileId = normalizeCoachAthleteProfileId(selectedCoachAthleteId)
    return bootstrapState.coachAthletes.find((athlete) => athlete.id === selectedProfileId || `coach-athlete-${athlete.id}` === selectedCoachAthleteId) || null
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
    let isActive = true

    if (bootstrapState.status !== 'authenticated_coach') {
      setHasRehydratedSelectedCoachAthleteContext(false)
      return () => {
        isActive = false
      }
    }

    setHasRehydratedSelectedCoachAthleteContext(false)

    ;(async () => {
      const storage = await resolveCoachSelectedAthleteStorage()
      if (!isActive) return
      coachSelectedAthleteStorageRef.current = storage
      const storedCoachAthleteId = await storage?.getItem?.()
      if (!isActive) return
      if (storedCoachAthleteId && coachAthleteOptions.some((athlete) => athlete.id === storedCoachAthleteId)) {
        setSelectedCoachAthleteId(storedCoachAthleteId)
      }
      setHasRehydratedSelectedCoachAthleteContext(true)
    })()

    return () => {
      isActive = false
    }
  }, [bootstrapState.status, coachAthleteOptions])

  useEffect(() => {
    if (bootstrapState.status !== 'authenticated_coach') {
      coachSelectedAthleteStorageRef.current?.removeItem?.()
      return
    }

    if (!coachAthleteOptions.some((athlete) => athlete.id === selectedCoachAthleteId)) return
    coachSelectedAthleteStorageRef.current?.setItem?.(selectedCoachAthleteId)
  }, [bootstrapState.status, coachAthleteOptions, selectedCoachAthleteId])

  useEffect(() => {
    if (bootstrapState.status !== 'authenticated_coach' || !authSession?.accessToken || !bootstrapState.coachAthletes?.length || !hasRehydratedSelectedCoachAthleteContext) {
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
  }, [authSession?.accessToken, bootstrapState.coachAthletes, bootstrapState.status, coachAthleteOptions, hasRehydratedSelectedCoachAthleteContext, selectedCoachAthleteId]);

  useEffect(() => {
    if (!resolvedCoachAthleteDefaultId) return
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
    if (runtimeBootstrapOverride === 'authenticated_coach_safe_workout_seeded' || runtimeBootstrapOverride === 'authenticated_coach_assigned_program_seeded') {
      setCoachTrainBridgeState({
        trainState: bootstrapState.trainState,
        sessionStore: bootstrapState.sessionStore,
        isHydrating: false,
        hasResolved: true,
      })
      return
    }

    if (runtimeBootstrapOverride === 'authenticated_coach_shell_seeded' || runtimeBootstrapOverride === 'authenticated_coach_athlete_switching_safe' || bootstrapState.status !== 'authenticated_coach' || !activeCoachAthleteProfile?.id || !authSession?.accessToken) {
      setCoachTrainBridgeState({ trainState: null, sessionStore: null, isHydrating: false, hasResolved: false })
      return
    }

    let isActive = true
    setCoachTrainBridgeState({ trainState: null, sessionStore: null, isHydrating: true, hasResolved: false })

    async function hydrateCoachAthleteTrainBridge() {
      try {
        const bridgeAthleteProfileId = normalizeCoachAthleteProfileId(selectedCoachAthlete?.athleteProfileId || activeCoachAthleteProfile.id)
        const nextCoachTrainBridgeState = await hydrateCoachTrainBridge({
          athleteId: bridgeAthleteProfileId,
          currentUserId: authSession.currentUserId,
          accessToken: authSession.accessToken,
          accessTokenProvider: () => authSession.accessToken,
          refreshAccessToken: refreshAuthSession,
          programClient: createMobileProgramClient({ accessToken: authSession.accessToken }),
          workoutClient: createMobileWorkoutClient({ accessToken: authSession.accessToken }),
        })

        if (!isActive) return

        setCoachTrainBridgeState({
          ...nextCoachTrainBridgeState,
          isHydrating: false,
          hasResolved: true,
        })
      } catch (error) {
        if (!isActive) return
        console.error('[coach-train-bridge-effect] hydrate failed', {
          selectedCoachAthleteId,
          athleteProfileId: normalizeCoachAthleteProfileId(selectedCoachAthlete?.athleteProfileId || activeCoachAthleteProfile?.id) ?? null,
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
  }, [activeCoachAthleteProfile?.id, authSession?.accessToken, authSession?.currentUserId, bootstrapState.status, refreshAuthSession, runtimeBootstrapOverride, selectedCoachAthlete?.athleteProfileId])
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
          return advanceSessionAfterRestTimerExpiry(currentSession);
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
      const isStartWorkoutHandoffActive = isStartingWorkout || isActiveWorkoutHandoffPendingRef.current;
      const resolvedSession = resolveIncomingSession({
        currentSession,
        nextSession,
        isActiveWorkoutViewOpen,
        isStartingWorkout: isStartWorkoutHandoffActive,
        ignoredSessionIds: discardedSessionIdsRef.current,
      });

      logResolvedIncomingSession({
        currentSession,
        nextSession,
        isActiveWorkoutViewOpen,
        isStartingWorkout: isStartWorkoutHandoffActive,
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
      setPersistedCreatedWorkoutRows([]);
    }
  }, [coachAthleteOptions, effectiveRemoteTrainState, effectiveSessionStore, emptyTrainState, isActiveWorkoutViewOpen, isStartingWorkout, resolvedCoachAthleteDefaultId, selectedCoachAthleteId]);

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
  const visibleBottomTabs = useMemo(() => (effectiveBootstrapState.status === 'authenticated_coach' ? mobileTabs : mobileTabs.filter((tab) => tab.key !== 'inbox')), [effectiveBootstrapState.status]);
  const bottomTabModels = useMemo(() => getTabButtonModels({ tabs: visibleBottomTabs, activeKey: activeTab }), [activeTab, visibleBottomTabs]);
  const bottomTabViewItems = useMemo(() => getBottomTabViewItems(bottomTabModels), [bottomTabModels]);
  const isCoachBootstrapState = effectiveBootstrapState.status === 'authenticated_coach';
  const isAthleteLimitedState = !isRuntimeTrainHomeVerificationEnabled && !isCoachBootstrapState && (effectiveBootstrapState.status === 'authenticated' || effectiveBootstrapState.status === 'authenticated_no_workout');
  const activeTrainContext = useMemo(() => {
    const source = isCoachBootstrapState ? 'coach-selected-athlete' : 'signed-in-athlete'
    const athleteProfile = isCoachBootstrapState ? activeCoachAthleteProfile ?? null : effectiveBootstrapState.athleteProfile ?? null

    return {
      source,
      athleteProfile,
      coachSelectedAthleteId: isCoachBootstrapState ? selectedCoachAthleteId : null,
    }
  }, [activeCoachAthleteProfile, effectiveBootstrapState.athleteProfile, isCoachBootstrapState, selectedCoachAthleteId])
  const activeTrainAthleteProfile = activeTrainContext.athleteProfile;
  const activeTrainAthleteId = activeTrainContext.athleteProfile?.id ?? null;
  const activeTrainAthleteLabel = useMemo(() => {
    if (isCoachBootstrapState) {
      return activeCoachAthleteSummary
    }

    if (!activeTrainAthleteProfile) {
      return null
    }

    return {
      firstName: activeTrainAthleteProfile?.firstName ?? '',
      lastName: activeTrainAthleteProfile?.lastName ?? '',
      avatarUrl: activeTrainAthleteProfile?.avatarUrl ?? null,
    }
  }, [activeCoachAthleteSummary, activeTrainAthleteProfile, isCoachBootstrapState])
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
  const scopedPersistedCreatedWorkoutRows = useMemo(() => persistedCreatedWorkoutRows.filter((row) => {
    const rowAthleteId = row?.actionPayload?.athleteId || null;
    const rowProgramId = row?.actionPayload?.programId || null;
    if (activeTrainAthleteId && rowAthleteId && rowAthleteId !== activeTrainAthleteId) return false;
    if (trainState.program.id && rowProgramId && rowProgramId !== trainState.program.id) return false;
    return true;
  }), [activeTrainAthleteId, persistedCreatedWorkoutRows, trainState.program.id])
  useEffect(() => {
    if (bootstrapState.status !== 'authenticated_coach') return
  }, [activeCoachAthleteProfile?.id, bootstrapState.status, effectiveRemoteTrainState, selectedCoachAthlete?.name, selectedCoachAthleteId, trainState]);
  const programSheetModel = useMemo(() => getProgramSheetModel(selectedProgramPreview || trainState), [selectedProgramPreview, trainState]);
  const programEditViewModel = useMemo(() => getProgramEditViewModel(selectedProgramPreview || trainState), [selectedProgramPreview, trainState]);
  const trainingCalendarModel = useMemo(() => getTrainingCalendarModel(trainState), [trainState]);
  const todayModel = useMemo(() => getTodaySurfaceModel(trainState), [trainState]);
  const workoutModel = useMemo(() => getWorkoutSurfaceModel(trainState, selectedCalendarDayId), [trainState, selectedCalendarDayId]);
  const todayWorkoutModel = useMemo(() => getWorkoutSurfaceModel(trainState, trainState.program.todayCalendarDayId || trainState.program.selectedCalendarDayId), [trainState]);
  const currentDateProgramWorkoutId = todayWorkoutModel?.actionPayload?.programWorkoutId || null;
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
  const todayWorkoutSheetModel = useMemo(() => getWorkoutSheetModel({ workoutModel: todayWorkoutModel, session: workoutSheetSession, programWorkout: trainState.programWorkout, selectedDayId: todayWorkoutModel.dayId }), [todayWorkoutModel, trainState.programWorkout, workoutSheetSession]);
  const workoutEditViewModel = useMemo(() => getWorkoutEditViewModel({ workoutSheetModel, workoutDraftModel: workoutEditDraftModel }), [workoutEditDraftModel, workoutSheetModel]);
  const groupEditViewModel = useMemo(() => getGroupEditViewModel({ group: selectedGroupEditModel, groupDraftModel: groupEditDraftModel, availableAthletes: coachAthletesList }), [coachAthletesList, groupEditDraftModel, selectedGroupEditModel]);
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

    if (session.status === 'in_progress' && (session.completedSetsCount ?? 0) > 0) {
      return [...trainState.completedSessions, session];
    }

    return trainState.completedSessions;
  }, [session, trainState.completedSessions]);
  const exerciseDetailViewModel = useMemo(() => getExerciseDetailViewModel({ exercise: selectedExercise, sessions: progressSessions }), [progressSessions, selectedExercise]);
  const calendarModel = useMemo(() => getCalendarSurfaceModel(trainState, selectedCalendarDayId), [trainState, selectedCalendarDayId]);
  const teamSections = useMemo(() => getGroupsSections(effectiveBootstrapState.coachGroups || []), [effectiveBootstrapState.coachGroups]);
  const teamRenderPlan = useMemo(() => getGenericSectionRenderPlan(teamSections), [teamSections]);
  const inboxPlaceholder = useMemo(
    () => getPlaceholderSurfaceModel('Inbox', 'This surface will hold communication, reminders, and support flows later.'),
    []
  );
  const inboxSections = useMemo(() => getPlaceholderSections(inboxPlaceholder), [inboxPlaceholder]);
  const inboxRenderPlan = useMemo(() => getGenericSectionRenderPlan(inboxSections), [inboxSections]);
  const progressModel = useMemo(() => getProgressSurfaceModel({ sessions: progressSessions }), [progressSessions]);
  const analyticsStrengthSelectionContextId = activeTrainAthleteId || authSession?.currentUserId || null;
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
        persistedWorkoutListRows: scopedPersistedCreatedWorkoutRows,
        canCreateWorkout: isCoachBootstrapState,
      }),
    [
      activeSessionModel,
      activeTrainTab,
      calendarModel,
      completedSessionModel,
      discardedSessionModel,
      isCoachBootstrapState,
      scopedPersistedCreatedWorkoutRows,
      todayModel,
      workoutModel,
    ]
  );
  const trainRenderModel = useMemo(
    () => getTrainRenderModel({ trainSurfaceModel, sessionSections: sessionRenderPlan }),
    [sessionRenderPlan, trainSurfaceModel]
  );
  const floatingStartWorkoutButtonModel = useMemo(() => {
    if (!todayWorkoutModel.hasWorkoutData) return null

    const todayStartWorkoutPayload = {
      selectedDayId: todayWorkoutModel.dayId,
      programWorkoutId: todayWorkoutModel.actionPayload?.programWorkoutId || null,
    }

    if (session?.status === 'in_progress') {
      const inProgressProgramWorkoutId = session?.programWorkoutId || session?.id || null

      return {
        kind: 'in-progress',
        label: session?.nameSnapshot || session?.name || 'Workout in progress',
        elapsedLabel: formatWorkoutTimer(elapsedSeconds),
        targetKey: 'start-workout',
        actionPayload: {
          ...todayStartWorkoutPayload,
          programWorkoutId: inProgressProgramWorkoutId,
        },
      }
    }

    return {
      kind: 'start-workout',
      label: 'Start Workout',
      targetKey: 'start-workout',
      actionPayload: todayStartWorkoutPayload,
    }
  }, [elapsedSeconds, session?.id, session?.name, session?.nameSnapshot, session?.programWorkoutId, session?.status, todayWorkoutModel]);
  const bootstrapSurfaceModel = useMemo(() => getBootstrapSurfaceModel({ bootstrapState: effectiveBootstrapState }), [effectiveBootstrapState]);
  const bootstrapSections = useMemo(
    () => (bootstrapSurfaceModel ? getPlaceholderSections(bootstrapSurfaceModel) : []),
    [bootstrapSurfaceModel]
  );
  const coachPlaceholderModel = useMemo(() => {
    if (!isCoachBootstrapState || activeTab === 'train' || activeTab === 'progress' || activeTab === 'team') {
      return null;
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
            : isAthleteLimitedState && activeTab !== 'progress' && activeTab !== 'train'
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

  function handleOpenInvitationCodeFlow() {
    setAuthMode('invitation_code');
    setAuthErrorMessage('');
    setAuthNoticeMessage('');
    setAuthInvitationCodeErrorMessage('');
    setAuthInvitationCode('');
    setAuthInvitationOnboardingStep(0);
    setAuthInvitationOnboardingValues(initialInvitationOnboardingValues);
    setInvitedAthleteCompletionState(INVITED_ATHLETE_COMPLETION_STATES.IDLE);
  }

  function handleContinueInvitationCodeFlow() {
    const normalizedCode = String(authInvitationCode || '').trim().toUpperCase();

    setAuthErrorMessage('');
    setAuthNoticeMessage('');
    setAuthInvitationCodeErrorMessage('');

    if (normalizedCode.length !== 6) {
      setAuthInvitationCodeErrorMessage('Enter the full 6-character invitation code before continuing.');
      return;
    }

    setAuthInvitationCode(normalizedCode);
    setAuthInvitationOnboardingStep(0);
    setAuthMode('invitation_onboarding');
  }

  function handleCloseInvitationCodeFlow() {
    setAuthMode('sign_in');
    setAuthErrorMessage('');
    setAuthNoticeMessage('');
    setAuthInvitationCodeErrorMessage('');
  }

  function handleInvitationOnboardingChange(fieldId, nextValue) {
    setInvitedAthleteCompletionState(INVITED_ATHLETE_COMPLETION_STATES.IDLE);
    setAuthInvitationOnboardingValues((current) => ({ ...current, [fieldId]: nextValue }));
  }

  async function handleInvitationAvatarUpload() {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!permissionResult?.granted) {
      setAuthErrorMessage('Photo library access is required to update the profile image.')
      return
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })

    if (pickerResult?.canceled) {
      return
    }

    const asset = pickerResult?.assets?.[0]
    if (!asset?.uri) {
      setAuthErrorMessage('Could not read that photo. Try another image.')
      return
    }

    const nextAvatarUrl = asset.uri
    setAuthInvitationOnboardingValues((current) => ({
      ...current,
      avatarUrl: nextAvatarUrl,
      avatarAsset: {
        uri: asset.uri,
        mimeType: asset.mimeType || 'image/jpeg',
        fileName: asset.fileName || `athlete-avatar-${Date.now()}.jpg`,
      },
    }))
    setAuthErrorMessage('')
  }

  function handleInvitationOnboardingPrevious() {
    setAuthErrorMessage('');
    setAuthNoticeMessage('');
    setAuthInvitationOnboardingStep((current) => Math.max(0, current - 1));
  }

  function handleCloseInvitationOnboardingView() {
    setAuthMode('invitation_code');
    setAuthErrorMessage('');
    setAuthNoticeMessage('');
    setAuthInvitationOnboardingStep(0);
  }

  async function handleInvitationOnboardingNext() {
    if (isAuthSubmitting) {
      return;
    }

    setAuthErrorMessage('');
    setAuthNoticeMessage('');
    setIsAuthSubmitting(true);

    try {
      if (authInvitationOnboardingStep === 0) {
        if (!authInvitationOnboardingValues.firstName?.trim() || !authInvitationOnboardingValues.lastName?.trim()) {
          throw new Error('First name and last name are required before continuing.');
        }
        if (!authInvitationOnboardingValues.password || !authInvitationOnboardingValues.confirmPassword) {
          throw new Error('Password and confirm password are both required before continuing.');
        }
        if (authInvitationOnboardingValues.password.length < 6) {
          throw new Error('Password must be at least 6 characters before continuing.');
        }
        if (authInvitationOnboardingValues.password !== authInvitationOnboardingValues.confirmPassword) {
          throw new Error('Passwords need to match before continuing.');
        }

        setAuthInvitationOnboardingStep((current) => current + 1);
        return;
      }

      if (authInvitationOnboardingStep === 1) {
        if (!String(authInvitationOnboardingValues.dateOfBirth || '').trim()) {
          throw new Error('Select the athlete date of birth before continuing.');
        }

        setAuthInvitationOnboardingStep((current) => current + 1);
        return;
      }

      if (authInvitationOnboardingStep === 2) {
        if (!authInvitationOnboardingValues.gender?.trim()) {
          throw new Error('Select the athlete gender before continuing.');
        }

        setAuthInvitationOnboardingStep((current) => current + 1);
        return;
      }

      if (authInvitationOnboardingStep === 3) {
        if (!authInvitationOnboardingValues.position?.trim()) {
          throw new Error('Select the athlete position before continuing.');
        }

        setAuthInvitationOnboardingStep((current) => current + 1);
        return;
      }

      if (authInvitationOnboardingStep === 4) {
        if (!String(authInvitationOnboardingValues.weight || '').trim()) {
          throw new Error('Set the athlete weight before continuing.');
        }

        setAuthInvitationOnboardingStep((current) => current + 1);
        return;
      }

      if (String(authInvitationOnboardingValues.heightUnit || 'ft') === 'ft') {
        if (!String(authInvitationOnboardingValues.heightFeet || '').trim() || !String(authInvitationOnboardingValues.heightInches || '').trim()) {
          throw new Error('Set the athlete height before continuing.');
        }
      } else if (!String(authInvitationOnboardingValues.heightCm || '').trim()) {
        throw new Error('Set the athlete height before continuing.');
      }

      if (!invitationCompletionClient?.completeAthleteInvitation) {
        setInvitedAthleteCompletionState(INVITED_ATHLETE_COMPLETION_STATES.UNAVAILABLE);
        throw new Error('Athlete invitation completion is not available right now.');
      }

      setInvitedAthleteCompletionState(INVITED_ATHLETE_COMPLETION_STATES.SUBMITTING);
      const completionResult = await invitationCompletionClient.completeAthleteInvitation({
        inviteCode: authInvitationCode,
        firstName: authInvitationOnboardingValues.firstName,
        lastName: authInvitationOnboardingValues.lastName,
        password: authInvitationOnboardingValues.password,
        confirmPassword: authInvitationOnboardingValues.confirmPassword,
        dateOfBirth: authInvitationOnboardingValues.dateOfBirth,
        gender: authInvitationOnboardingValues.gender,
        position: authInvitationOnboardingValues.position,
        weight: authInvitationOnboardingValues.weight,
        weightUnit: authInvitationOnboardingValues.weightUnit,
        heightUnit: authInvitationOnboardingValues.heightUnit,
        heightFeet: authInvitationOnboardingValues.heightFeet,
        heightInches: authInvitationOnboardingValues.heightInches,
        heightCm: authInvitationOnboardingValues.heightCm,
      });

      const nextAuthSession = await updateAuthSession({
        accessToken: completionResult.accessToken,
        refreshToken: completionResult.refreshToken,
        currentUserId: completionResult.currentUserId,
        currentAthleteId: completionResult.currentAthleteId,
      });

      setActiveTab('progress');

      if (authInvitationOnboardingValues.avatarAsset) {
        await updateAthleteProfile({ avatarAsset: authInvitationOnboardingValues.avatarAsset });
      }

      void nextAuthSession;
      setInvitedAthleteCompletionState(INVITED_ATHLETE_COMPLETION_STATES.SUCCEEDED);
      setAuthInvitationCode('');
      setAuthInvitationOnboardingValues(initialInvitationOnboardingValues);
      setAuthInvitationOnboardingStep(0);
      setAuthNoticeMessage('Welcome to PPLUS.');
    } catch (error) {
      setInvitedAthleteCompletionState((current) => current === INVITED_ATHLETE_COMPLETION_STATES.UNAVAILABLE ? current : INVITED_ATHLETE_COMPLETION_STATES.FAILED);
      setAuthErrorMessage(error?.message || 'Something went sideways while preparing the athlete onboarding flow.');
    } finally {
      setIsAuthSubmitting(false);
    }
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
    activeStartWorkoutRequestRef.current += 1;
    if (session?.id) {
      discardedSessionIdsRef.current.add(session.id);
    }
    await orchestrateDiscardWorkout({
      session,
      elapsedSeconds,
      setPostSetEffortAdjustment,
      setIsActiveWorkoutViewOpen,
      persistSessionUpdateOptimistic,
      persistDiscardedSession: async (discardedSession) => {
        if (effectiveSessionStore?.saveSession) {
          await effectiveSessionStore.saveSession(discardedSession);
          effectiveSessionStore?.clearSession?.();
        }
      },
      clearVisibleSession: () => {
        effectiveSessionStore?.clearSession?.();
        setSelectedWorkoutSessionPreview(null);
        setSession(createEmptySessionState());
      },
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

  async function handleCreateSessionSuperset(sourceExerciseId, targetExerciseId) {
    await orchestrateCreateSessionSuperset({
      session,
      sourceExerciseId,
      targetExerciseId,
      persistSessionUpdateOptimistic,
    });
  }

  async function handleRemoveSessionSuperset(exerciseId) {
    await orchestrateRemoveSessionSuperset({
      session,
      exerciseId,
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
    const rawAthleteId = activeTrainAthleteId ?? null;
    const rawCoachId = trainState.programWorkout?.coachId || activeCoachAthleteProfile?.coachId || null;
    const rawProgramId = trainState.program.id || null;
    const athleteId = isUuidValue(rawAthleteId) ? rawAthleteId : null;
    const coachId = isUuidValue(rawCoachId) ? rawCoachId : null;
    const programId = isUuidValue(rawProgramId) ? rawProgramId : null;
    const selectedProgramDayId = trainState.program.calendarWeek.find((day) => day.id === selectedCalendarDayId)?.programDayId || null;
    const relatedWorkoutCount = getRelatedWorkoutCount({
      calendarWeek: trainState.program.calendarWeek,
      persistedWorkoutListRows: scopedPersistedCreatedWorkoutRows,
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
          athleteId,
          programId,
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

  function openActiveWorkoutViewImmediately() {
    isActiveWorkoutHandoffPendingRef.current = false;
    setIsActiveWorkoutViewOpen(true);
  }

  async function discardResolvedStartWorkoutSession(resolvedSession) {
    if (!resolvedSession?.id) return;
    discardedSessionIdsRef.current.add(resolvedSession.id);
    const discardedSession = discardWorkoutSession({
      session: resolvedSession,
      discardedAt: new Date().toISOString(),
      elapsedSeconds: resolvedSession.elapsedSeconds ?? 0,
    });
    try {
      await effectiveSessionStore?.saveSession?.(discardedSession);
    } finally {
      effectiveSessionStore?.clearSession?.();
    }
  }

  async function handleStartWorkoutFromSheet(payload = null) {
    const startWorkoutSheetModel = payload?.selectedDayId ? todayWorkoutSheetModel : workoutSheetModel;
    const startWorkoutRequestId = activeStartWorkoutRequestRef.current + 1;
    activeStartWorkoutRequestRef.current = startWorkoutRequestId;
    isActiveWorkoutHandoffPendingRef.current = true;

    const startWorkoutOutcome = await orchestrateStartWorkoutFromSheet({
      effectiveSessionStore,
      selectedProgramWorkoutId: payload?.programWorkoutId || startWorkoutSheetModel?.programWorkoutId || currentDateProgramWorkoutId,
      session,
      selectedWorkoutSessionPreview,
      workoutSheetModel: startWorkoutSheetModel,
      programWorkout: payload?.selectedDayId ? trainState.programWorkout : resolvedWorkoutSheetProgramWorkout,
      startedAt: new Date().toISOString(),
      setIsStartingWorkout,
      setSession,
      setIsWorkoutSheetOpen,
      setIsActiveWorkoutViewOpen: openActiveWorkoutViewImmediately,
      runAfterInteractions: InteractionManager.runAfterInteractions,
      shouldApplyResolvedSession: () => activeStartWorkoutRequestRef.current === startWorkoutRequestId,
      onBlockedResolvedSession: discardResolvedStartWorkoutSession,
    });

    if (!['resume-session-opened', 'optimistic-session-opened', 'resolved-session'].includes(startWorkoutOutcome?.outcome)) {
      isActiveWorkoutHandoffPendingRef.current = false;
    }
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
      void handleStartWorkoutFromSheet(payload);
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

    if (targetKey === 'create-group') {
      setSelectedGroupEditModel(null);
      setGroupEditDraftModel(createEmptyGroupEditDraftModel());
      setIsGroupEditViewOpen(true);
      return;
    }

    if (targetKey === 'group') {
      const requestedGroupId = payload?.groupId || payload?.id || null;
      const selectedGroup = (effectiveBootstrapState.coachGroups || []).find((group) => group.id === requestedGroupId) || null;
      setGroupEditDraftModel(null);
      setSelectedGroupEditModel(selectedGroup);
      setIsGroupEditViewOpen(true);
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

  function handleOpenProgramSheetTrainingCalendar() {
    setIsProgramSheetOpen(false);
    setTrainingCalendarReturnSurface('program-sheet');
    setIsTrainingCalendarOpen(true);
  }

  function handleCloseTrainingCalendar() {
    setIsTrainingCalendarOpen(false);

    if (trainingCalendarReturnSurface === 'program-sheet') {
      setIsProgramSheetOpen(true);
      setTrainingCalendarReturnSurface(null);
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

  function handleCloseGroupEditView() {
    setIsGroupEditViewOpen(false);
    setSelectedGroupEditModel(null);
    setGroupEditDraftModel(null);
    setGroupEditErrorMessage('');
    setIsSavingGroupEdit(false);
  }

  async function handleSaveGroupEdit(draft = {}) {
    const athleteIds = (draft.athleteIds || draft.athletes?.map((athlete) => athlete.id) || []).map(normalizeGroupAthleteIdForPersistence).filter(Boolean);
    setGroupEditErrorMessage('');

    if (!groupEditClient) {
      setGroupEditErrorMessage('Group save is unavailable right now.');
      return;
    }

    setIsSavingGroupEdit(true);
    try {
      if (selectedGroupEditModel?.id || draft.groupId) {
        await groupEditClient.updateGroup({
          groupId: selectedGroupEditModel?.id || draft.groupId,
          name: draft.groupName,
          athleteIds,
        })
      } else {
        await groupEditClient.createGroup({
          coachId: effectiveBootstrapState.coachProfile?.id,
          name: draft.groupName,
          athleteIds,
        })
      }
      await refreshAuthSession();
      handleCloseGroupEditView();
    } catch (error) {
      console.error('Failed to save group', error);
      setGroupEditErrorMessage(error?.message || 'Something went sideways while saving the group.');
    } finally {
      setIsSavingGroupEdit(false);
    }
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
          {authMode === 'invitation_code' ? (
            <InvitationCodeEntryView
              isVisible
              code={authInvitationCode}
              onChangeCode={setAuthInvitationCode}
              errorMessage={authInvitationCodeErrorMessage}
              isSubmitting={isAuthSubmitting}
              onContinue={handleContinueInvitationCodeFlow}
              onClose={handleCloseInvitationCodeFlow}
              theme={appTheme}
            />
          ) : authMode === 'invitation_onboarding' ? (
            <AthleteInviteOnboardingView
              isVisible
              invitationCode={authInvitationCode}
              currentStep={authInvitationOnboardingStep}
              values={authInvitationOnboardingValues}
              onChangeField={handleInvitationOnboardingChange}
              onAvatarPress={handleInvitationAvatarUpload}
              onNext={handleInvitationOnboardingNext}
              onPrevious={handleInvitationOnboardingPrevious}
              onClose={handleCloseInvitationOnboardingView}
              isSubmitting={isAuthSubmitting}
              completionState={invitedAthleteCompletionState}
              errorMessage={authErrorMessage}
              noticeMessage={authNoticeMessage}
              theme={appTheme}
            />
          ) : (
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
              onInvitationCodePress={handleOpenInvitationCodeFlow}
              onSubmit={handleAuthSubmit}
            />
          )}
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
      <SafeAreaView edges={['top', 'left', 'right', 'bottom']} style={styles.container}>
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
          bottomTabs: appRenderModel.bottomTabs,
          activeAthleteSummary: isCoachBootstrapState ? activeTrainAthleteLabel : null,
          floatingStartWorkoutButton: floatingStartWorkoutButtonModel,
          trainRenderModel,
          sessionRenderModel,
          onTabPress: handleTabPress,
          onProfileHeaderPress: () => {
            setIsProfileViewOpen(true);
          },
          onUtilityHeaderPress: () => {
            setTrainingCalendarReturnSurface(null);
            setIsTrainingCalendarOpen(true);
          },
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
              onInvitationCodePress={handleOpenInvitationCodeFlow}
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
          onOpenTrainingCalendar: handleOpenProgramSheetTrainingCalendar,
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
        isLoading={isCoachAthletesLoading}
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
          onClose={handleCloseTrainingCalendar}
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
      <GroupEditView
        isVisible={isGroupEditViewOpen}
        model={groupEditViewModel}
        onClose={handleCloseGroupEditView}
        onSave={handleSaveGroupEdit}
        onAddAthletes={() => {}}
        onDeleteGroup={handleCloseGroupEditView}
        isSavingGroup={isSavingGroupEdit}
        saveErrorMessage={groupEditErrorMessage}
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
          onCreateSuperset={handleCreateSessionSuperset}
          onRemoveSuperset={handleRemoveSessionSuperset}
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
        <ProfileView isVisible={isProfileViewOpen} onClose={() => setIsProfileViewOpen(false)} onSignOut={handleProfileSignOut} athleteProfile={profileViewProfile} onSaveProfile={handleSaveProfile} isSavingProfile={isProfileSaving} saveNotice={profileSaveNotice} role={isCoachBootstrapState ? 'coach' : 'athlete'} athletes={coachAthletesList} selectedAthleteId={selectedCoachAthleteId} isAthletesLoading={isCoachAthletesLoading} onAthleteActionTarget={handleTrainNavigation} onOpenExerciseDetail={(exercise) => handleOpenExerciseDetail(exercise, 'profile-view')} onOpenProgramDetail={(program) => handleOpenProgramDetail(program, 'profile-view')} themePreference={appThemePreference} onChangeThemePreference={handleThemePreferenceChange} weightUnitPreference={profileViewProfile?.weightUnitPreference || 'lb'} distanceUnitPreference={profileViewProfile?.distanceUnitPreference || 'km'} onChangeWeightUnitPreference={(nextWeightUnitPreference) => handleUnitsPreferenceChange({ weightUnitPreference: nextWeightUnitPreference })} onChangeDistanceUnitPreference={(nextDistanceUnitPreference) => handleUnitsPreferenceChange({ distanceUnitPreference: nextDistanceUnitPreference })} theme={appTheme} />
        <StatusBar style={appThemePreference === 'light' ? 'dark' : 'light'} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
