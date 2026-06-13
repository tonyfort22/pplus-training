import { isSameSessionLineage } from './session-truth.js';

function toNullableNumber(value) {
  if (value == null || value === '') return null;
  const nextNumber = Number(value);
  return Number.isFinite(nextNumber) ? nextNumber : null;
}

function normalizeProgramWorkoutAsWorkoutSheetModel(programWorkout = null) {
  if (!programWorkout?.id || !Array.isArray(programWorkout?.exercises)) return null;

  return {
    title: programWorkout.nameSnapshot || programWorkout.name || 'Workout',
    workoutNotes: programWorkout.notes || '',
    programWorkoutId: programWorkout.programWorkoutId || programWorkout.id,
    exercises: programWorkout.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId || exercise.id || null,
      programWorkoutExerciseId: exercise.programWorkoutExerciseId || exercise.id || null,
      programWorkoutId: programWorkout.programWorkoutId || programWorkout.id,
      sortOrder: exercise.sortOrder,
      name: exercise.nameSnapshot || exercise.name || 'Exercise',
      nameSnapshot: exercise.nameSnapshot || exercise.name || 'Exercise',
      defaultRestSeconds: exercise.defaultRestSeconds ?? null,
      sets: (exercise.sets || []).map((set, setIndex) => ({
        id: set.id || `${exercise.id}-set-${setIndex + 1}`,
        programWorkoutSetId: set.programWorkoutSetId || set.id || null,
        sortOrder: set.sortOrder ?? setIndex + 1,
        setType: set.setType || 'straight',
        reps: set.actualReps ?? set.prescribedReps ?? set.targetReps ?? null,
        load: set.actualLoad ?? set.prescribedLoad ?? set.targetLoad ?? null,
        targetLoadUnit: set.targetLoadUnit ?? set.prescribedLoadUnit ?? 'lb',
        effort: set.actualRpe ?? set.prescribedRpe ?? set.targetRpe ?? null,
        prescribedRestSeconds: set.prescribedRestSeconds ?? set.targetRestSeconds ?? exercise.defaultRestSeconds ?? null,
      })),
    })),
  };
}

function createOptimisticSessionFromWorkoutSheetModel({ workoutSheetModel = null, targetProgramWorkoutId = null, startedAt = new Date().toISOString() } = {}) {
  if (!targetProgramWorkoutId || !Array.isArray(workoutSheetModel?.exercises) || workoutSheetModel.exercises.length === 0) return null;

  const exercises = workoutSheetModel.exercises.map((exercise, exerciseIndex) => ({
    id: exercise.id || `${targetProgramWorkoutId}-exercise-${exerciseIndex + 1}`,
    exerciseId: exercise.exerciseId || exercise.id || null,
    programWorkoutExerciseId: exercise.programWorkoutExerciseId || null,
    programWorkoutId: targetProgramWorkoutId,
    sortOrder: exercise.sortOrder ?? exerciseIndex + 1,
    nameSnapshot: exercise.name || exercise.nameSnapshot || 'Exercise',
    status: 'not_started',
    notes: '',
    defaultRestSeconds: toNullableNumber(exercise.defaultRestSeconds) ?? null,
    sets: (exercise.sets || []).map((set, setIndex) => ({
      id: set.id || `${exercise.id || `${targetProgramWorkoutId}-exercise-${exerciseIndex + 1}`}-set-${setIndex + 1}`,
      programWorkoutSetId: set.programWorkoutSetId || null,
      sortOrder: set.sortOrder ?? setIndex + 1,
      setType: set.setType || 'straight',
      prescribedReps: toNullableNumber(set.reps),
      prescribedLoad: toNullableNumber(set.load),
      prescribedLoadUnit: set.targetLoadUnit || 'lb',
      prescribedDurationSeconds: null,
      prescribedDistance: null,
      prescribedDistanceUnit: null,
      prescribedRpe: toNullableNumber(set.effort),
      prescribedRir: null,
      prescribedRestSeconds: toNullableNumber(set.prescribedRestSeconds),
      actualReps: null,
      actualLoad: null,
      actualLoadUnit: null,
      actualDurationSeconds: null,
      actualDistance: null,
      actualDistanceUnit: null,
      actualRpe: null,
      actualRir: null,
      actualRestSeconds: null,
      completedAt: null,
      isCompleted: false,
      notes: '',
    })),
  }));

  const totalSetsCount = exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0);

  return {
    id: targetProgramWorkoutId,
    athleteId: null,
    coachId: null,
    programId: null,
    programDayId: null,
    programWorkoutId: targetProgramWorkoutId,
    workoutTemplateId: null,
    nameSnapshot: workoutSheetModel?.title || 'Workout',
    status: 'in_progress',
    startedAt,
    completedAt: null,
    discardedAt: null,
    elapsedSeconds: 0,
    notes: workoutSheetModel?.workoutNotes || '',
    perceivedDifficulty: null,
    totalExercisesCount: exercises.length,
    completedExercisesCount: 0,
    totalSetsCount,
    completedSetsCount: 0,
    activeRestTimer: null,
    settings: {
      defaultRestSeconds: null,
      autoProgressEnabled: false,
      keepAwake: false,
      adjustEffortAfterSet: false,
    },
    exercises,
  };
}

export { deriveWorkoutOpenRequestContext } from './workout-open-request-context.js';

export function hasRichSessionStructure(value) {
  return Array.isArray(value?.exercises) && value.exercises.length > 0;
}

export function isEmptyPlannedSessionShell(value) {
  return (
    value?.status === 'planned'
    && !value?.id
    && !value?.programWorkoutId
    && !hasRichSessionStructure(value)
  );
}

export function hasSupersetMetadata(value) {
  return Array.isArray(value?.exercises) && value.exercises.some((exercise) => Boolean(exercise?.supersetGroupId));
}

export function shouldPreserveIncomingSession({ currentSession = null, nextSession = null, isActiveWorkoutViewOpen = false, isStartingWorkout = false } = {}) {
  const isProtectedActiveWorkoutState = isActiveWorkoutViewOpen || isStartingWorkout;
  if (!isProtectedActiveWorkoutState || currentSession?.status !== 'in_progress') {
    return false;
  }

  if (isEmptyPlannedSessionShell(nextSession) && hasRichSessionStructure(currentSession)) {
    return true;
  }

  if (isSameSessionLineage(currentSession, nextSession) && hasSupersetMetadata(currentSession) && !hasSupersetMetadata(nextSession)) {
    return true;
  }

  return (
    isSameSessionLineage(currentSession, nextSession)
    && (
      !hasRichSessionStructure(nextSession)
      || nextSession?.status === 'planned'
    )
  );
}

export function createWorkoutSheetProgramWorkoutPreview({ workoutPreview = null, programWorkoutId = null } = {}) {
  if (!programWorkoutId || !workoutPreview) return null;

  return {
    id: programWorkoutId,
    programWorkoutId,
    nameSnapshot: workoutPreview.workoutName || 'Workout',
    exercises: (workoutPreview.exercises || []).map((exercise, exerciseIndex) => ({
      id: exercise.id || `${programWorkoutId}-exercise-${exerciseIndex + 1}`,
      exerciseId: exercise.exerciseId || exercise.id || null,
      nameSnapshot: exercise.name || exercise.nameSnapshot || 'Exercise',
      sortOrder: exercise.sortOrder ?? exerciseIndex + 1,
      defaultRestSeconds: exercise.defaultRestSeconds ?? null,
      sets: Array.from({ length: exercise.setCount || 0 }, (_, setIndex) => ({
        id: `${exercise.id || `${programWorkoutId}-exercise-${exerciseIndex + 1}`}-set-${setIndex + 1}`,
        sortOrder: setIndex + 1,
        setType: 'straight',
        targetRestSeconds: exercise.defaultRestSeconds ?? null,
      })),
    })),
  };
}

export function shouldIgnoreIncomingSession({ nextSession = null, ignoredSessionIds = null } = {}) {
  if (!nextSession?.id || !ignoredSessionIds || typeof ignoredSessionIds.has !== 'function') return false;
  return ignoredSessionIds.has(nextSession.id);
}

export function resolveIncomingSession({ currentSession = null, nextSession = null, isActiveWorkoutViewOpen = false, isStartingWorkout = false, ignoredSessionIds = null } = {}) {
  if (shouldIgnoreIncomingSession({ nextSession, ignoredSessionIds })) {
    return currentSession;
  }

  const shouldPreserveCurrentSession = shouldPreserveIncomingSession({
    currentSession,
    nextSession,
    isActiveWorkoutViewOpen,
    isStartingWorkout,
  });

  return shouldPreserveCurrentSession ? currentSession : nextSession;
}

export function mergePersistedSessionResult({ savedSession = null, optimisticSession = null } = {}) {
  if (savedSession?.activeRestTimer !== undefined) {
    return savedSession;
  }

  return {
    ...savedSession,
    activeRestTimer: optimisticSession?.activeRestTimer ?? null,
  };
}

export function buildStartWorkoutPlan({
  session = null,
  storedSessionId = null,
  selectedWorkoutSessionPreview = null,
  workoutSheetModel = null,
  programWorkout = null,
  selectedProgramWorkoutId = null,
  startedAt = new Date().toISOString(),
} = {}) {
  const programWorkoutId = programWorkout?.programWorkoutId || programWorkout?.id || null;
  const targetProgramWorkoutId = selectedProgramWorkoutId || workoutSheetModel?.programWorkoutId || selectedWorkoutSessionPreview?.programWorkoutId || programWorkoutId || null;
  const currentSessionProgramWorkoutId = session?.programWorkoutId || session?.id || null;
  const shouldResumeStoredSession = Boolean(
    storedSessionId
    && session?.status === 'in_progress'
    && currentSessionProgramWorkoutId === targetProgramWorkoutId
  );
  const shouldCloneSelectedSessionPreview = Boolean(
    selectedWorkoutSessionPreview?.programWorkoutId === targetProgramWorkoutId
    && hasRichSessionStructure(selectedWorkoutSessionPreview)
  );
  const buildOptimisticWorkoutSession = ({ allowSelectedPreview = true } = {}) => {
    if (allowSelectedPreview && shouldCloneSelectedSessionPreview) {
      return {
        ...selectedWorkoutSessionPreview,
        status: 'in_progress',
        startedAt,
        completedAt: null,
        discardedAt: null,
        elapsedSeconds: 0,
        completedExercisesCount: 0,
        completedSetsCount: 0,
        activeRestTimer: null,
        exercises: (selectedWorkoutSessionPreview.exercises || []).map((exercise) => ({
          ...exercise,
          status: 'not_started',
          sets: (exercise.sets || []).map((set) => ({
            ...set,
            actualReps: null,
            actualLoad: null,
            actualRpe: null,
            completedAt: null,
            isCompleted: false,
          })),
        })),
      };
    }

    const optimisticFromSheet = createOptimisticSessionFromWorkoutSheetModel({
      workoutSheetModel,
      targetProgramWorkoutId,
      startedAt,
    });
    if (optimisticFromSheet) return optimisticFromSheet;

    const programWorkoutSheetModel = normalizeProgramWorkoutAsWorkoutSheetModel(programWorkout);
    return createOptimisticSessionFromWorkoutSheetModel({
      workoutSheetModel: programWorkoutSheetModel,
      targetProgramWorkoutId,
      startedAt,
    });
  };
  const optimisticSession = shouldResumeStoredSession
    ? (hasRichSessionStructure(session) ? null : buildOptimisticWorkoutSession({ allowSelectedPreview: false }))
    : buildOptimisticWorkoutSession();

  return {
    targetProgramWorkoutId,
    currentSessionProgramWorkoutId,
    shouldResumeStoredSession,
    resumeSessionId: shouldResumeStoredSession ? storedSessionId : null,
    optimisticSession,
    shouldStartNewSession: Boolean(targetProgramWorkoutId) && !shouldResumeStoredSession,
  };
}

export function buildImmediateWorkoutSheetPreview({ trainStateProgramWorkout = null, requestedProgramWorkoutId = null, requestedDayWorkoutPreview = null } = {}) {
  if (trainStateProgramWorkout?.id === requestedProgramWorkoutId) {
    return trainStateProgramWorkout;
  }

  const requestedPreviewId = requestedDayWorkoutPreview?.programWorkoutId || requestedDayWorkoutPreview?.id || null
  if (requestedPreviewId === requestedProgramWorkoutId) {
    return createWorkoutSheetProgramWorkoutPreview({
      workoutPreview: requestedDayWorkoutPreview,
      programWorkoutId: requestedProgramWorkoutId,
    });
  }

  if (!requestedProgramWorkoutId) return null

  return {
    id: requestedProgramWorkoutId,
    programWorkoutId: requestedProgramWorkoutId,
    nameSnapshot: '',
    exercises: [],
  }
}

export function shouldUseFallbackWorkout({ selectedWorkout = null, effectiveSessionStore = null } = {}) {
  const selectedWorkoutExerciseCount = Array.isArray(selectedWorkout?.exercises) ? selectedWorkout.exercises.length : 0;
  const hasRequestedWorkoutIdentity = Boolean(selectedWorkout?.id)
  const hasOwnWorkoutName = String(selectedWorkout?.nameSnapshot || selectedWorkout?.name || '').trim().length > 0

  return !hasRequestedWorkoutIdentity
    ? typeof effectiveSessionStore?.getProgramWorkout === 'function'
    : (!hasOwnWorkoutName && selectedWorkoutExerciseCount === 0 && typeof effectiveSessionStore?.getProgramWorkout === 'function')
}
