import { isSameSessionLineage } from './session-truth.js';

function toNullableNumber(value) {
  if (value == null || value === '') return null;
  const nextNumber = Number(value);
  return Number.isFinite(nextNumber) ? nextNumber : null;
}

function createOptimisticSessionFromWorkoutSheetModel({ workoutSheetModel = null, targetProgramWorkoutId = null, startedAt = new Date().toISOString() } = {}) {
  if (!targetProgramWorkoutId || !Array.isArray(workoutSheetModel?.exercises)) return null;

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

export function shouldPreserveIncomingSession({ currentSession = null, nextSession = null, isActiveWorkoutViewOpen = false } = {}) {
  return (
    isActiveWorkoutViewOpen
    && currentSession?.status === 'in_progress'
    && hasRichSessionStructure(currentSession)
    && isSameSessionLineage(currentSession, nextSession)
    && !hasRichSessionStructure(nextSession)
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

export function resolveIncomingSession({ currentSession = null, nextSession = null, isActiveWorkoutViewOpen = false } = {}) {
  const shouldPreserveCurrentSession = shouldPreserveIncomingSession({
    currentSession,
    nextSession,
    isActiveWorkoutViewOpen,
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
  selectedProgramWorkoutId = null,
  startedAt = new Date().toISOString(),
} = {}) {
  const targetProgramWorkoutId = selectedProgramWorkoutId || workoutSheetModel?.programWorkoutId || selectedWorkoutSessionPreview?.programWorkoutId || null;
  const currentSessionProgramWorkoutId = session?.programWorkoutId || session?.id || null;
  const shouldResumeStoredSession = Boolean(
    storedSessionId
    && session?.status === 'in_progress'
    && currentSessionProgramWorkoutId === targetProgramWorkoutId
  );
  const optimisticSession = shouldResumeStoredSession
    ? null
    : (selectedWorkoutSessionPreview?.programWorkoutId === targetProgramWorkoutId
      ? {
          ...selectedWorkoutSessionPreview,
          startedAt,
          elapsedSeconds: 0,
          completedAt: null,
          activeRestTimer: null,
        }
      : createOptimisticSessionFromWorkoutSheetModel({
          workoutSheetModel,
          targetProgramWorkoutId,
          startedAt,
        }));

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
