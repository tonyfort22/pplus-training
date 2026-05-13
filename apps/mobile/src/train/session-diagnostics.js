import { shouldPreserveIncomingSession } from './session-orchestration.js';

export function getExerciseDebugSummary(exercise) {
  if (!exercise) return null;

  return {
    id: exercise.id || null,
    programWorkoutId: exercise.programWorkoutId || null,
    exerciseId: exercise.exerciseId || null,
    name: exercise.name || exercise.nameSnapshot || null,
    setCount: Array.isArray(exercise.sets) ? exercise.sets.length : exercise.setCount ?? null,
  };
}

export function getSessionDebugSummary(session) {
  if (!session) return null;

  return {
    id: session.id || null,
    programWorkoutId: session.programWorkoutId || null,
    status: session.status || null,
    startedAt: session.startedAt || null,
    completedAt: session.completedAt || null,
    discardedAt: session.discardedAt || null,
    elapsedSeconds: session.elapsedSeconds ?? null,
    exerciseCount: Array.isArray(session.exercises) ? session.exercises.length : null,
    exercises: Array.isArray(session.exercises)
      ? session.exercises.map(getExerciseDebugSummary)
      : null,
    activeRestTimer: session.activeRestTimer
      ? {
          exerciseId: session.activeRestTimer.exerciseId || null,
          setId: session.activeRestTimer.setId || null,
          isRunning: Boolean(session.activeRestTimer.isRunning),
          remainingSeconds: session.activeRestTimer.remainingSeconds ?? null,
        }
      : null,
  };
}

export function logResolvedIncomingSession({
  logger = console,
  currentSession = null,
  nextSession = null,
  isActiveWorkoutViewOpen = false,
  resolvedSession = null,
} = {}) {
  logger.info?.('[session-sync] resolved', {
    shouldPreserveCurrentSession: shouldPreserveIncomingSession({
      currentSession,
      nextSession,
      isActiveWorkoutViewOpen,
    }),
    currentSession: getSessionDebugSummary(currentSession),
    incomingSession: getSessionDebugSummary(nextSession),
    resolvedSession: getSessionDebugSummary(resolvedSession),
  });
}

export function getWorkoutOpenTapSummary({
  targetKey = null,
  payload = null,
  selectedCalendarDayId = null,
  requestedCalendarDayId = null,
  selectedProgramWorkoutId = null,
  requestedProgramWorkoutId = null,
  effectiveSessionStore = null,
  session = null,
  trainState = null,
  selectedWorkoutSessionPreview = null,
} = {}) {
  return {
    targetKey,
    payload,
    selectedCalendarDayId,
    requestedCalendarDayId,
    selectedProgramWorkoutId,
    requestedProgramWorkoutId,
    hasSessionStore: Boolean(effectiveSessionStore),
    currentSessionProgramWorkoutId: session?.programWorkoutId || session?.id || null,
    currentSessionExerciseCount: Array.isArray(session?.exercises) ? session.exercises.length : null,
    trainStateProgramWorkoutId: trainState?.programWorkout?.id || null,
    trainStateProgramWorkoutExerciseCount: Array.isArray(trainState?.programWorkout?.exercises)
      ? trainState.programWorkout.exercises.length
      : null,
    selectedPreviewExerciseCount: Array.isArray(selectedWorkoutSessionPreview?.exercises)
      ? selectedWorkoutSessionPreview.exercises.length
      : null,
  };
}

export function logWorkoutOpenTap({
  logger = console,
  targetKey = null,
  payload = null,
  selectedCalendarDayId = null,
  requestedCalendarDayId = null,
  selectedProgramWorkoutId = null,
  requestedProgramWorkoutId = null,
  effectiveSessionStore = null,
  session = null,
  trainState = null,
  selectedWorkoutSessionPreview = null,
} = {}) {
  logger.info?.('[workout-open] tap', getWorkoutOpenTapSummary({
    targetKey,
    payload,
    selectedCalendarDayId,
    requestedCalendarDayId,
    selectedProgramWorkoutId,
    requestedProgramWorkoutId,
    effectiveSessionStore,
    session,
    trainState,
    selectedWorkoutSessionPreview,
  }));
}

export function logWorkoutOpenOpeningWorkoutSheet({ logger = console } = {}) {
  logger.info?.('[workout-open] opening workout sheet');
}

export function logWorkoutOpenPreviewFetchFailed({
  logger = console,
  requestedProgramWorkoutId = null,
  error = null,
} = {}) {
  logger.warn?.('[workout-open] preview fetch failed', {
    requestedProgramWorkoutId,
    message: error?.message || String(error),
  });
}

export function logWorkoutOpenFallbackWorkout({
  logger = console,
  requestedProgramWorkoutId = null,
  selectedWorkout = null,
  fallbackWorkout = null,
  selectedWorkoutError = null,
} = {}) {
  logger.info?.('[workout-open] fallback workout', {
    requestedProgramWorkoutId,
    selectedWorkoutId: selectedWorkout?.id || null,
    selectedWorkoutExerciseCount: Array.isArray(selectedWorkout?.exercises) ? selectedWorkout.exercises.length : 0,
    fallbackWorkoutId: fallbackWorkout?.id || null,
    fallbackWorkoutExerciseCount: Array.isArray(fallbackWorkout?.exercises) ? fallbackWorkout.exercises.length : 0,
    selectedWorkoutError: selectedWorkoutError?.message || null,
  });
}

export function logWorkoutOpenFallbackFetchFailed({
  logger = console,
  requestedProgramWorkoutId = null,
  error = null,
} = {}) {
  logger.warn?.('[workout-open] fallback fetch failed', {
    requestedProgramWorkoutId,
    message: error?.message || String(error),
  });
}

export function logWorkoutOpenResolvedWorkout({
  logger = console,
  requestedProgramWorkoutId = null,
  selectedWorkout = null,
} = {}) {
  logger.info?.('[workout-open] resolved workout', {
    requestedProgramWorkoutId,
    resolvedProgramWorkoutId: selectedWorkout?.id || null,
    resolvedExerciseCount: Array.isArray(selectedWorkout?.exercises) ? selectedWorkout.exercises.length : null,
  });
}

export function logWorkoutOpenMissingProgramWorkoutId({
  logger = console,
  requestedProgramWorkoutId = null,
} = {}) {
  logger.warn?.('[workout-open] missing programWorkoutId', {
    requestedProgramWorkoutId,
  });
}

export function getStartWorkoutTapSummary({
  effectiveSessionStore = null,
  selectedProgramWorkoutId = null,
  session = null,
  selectedWorkoutSessionPreview = null,
  workoutSheetModel = null,
} = {}) {
  return {
    hasSessionStore: Boolean(effectiveSessionStore),
    selectedProgramWorkoutId,
    currentSessionId: session?.id || null,
    currentSessionProgramWorkoutId: session?.programWorkoutId || session?.id || null,
    previewProgramWorkoutId: selectedWorkoutSessionPreview?.programWorkoutId || null,
    sheetProgramWorkoutId: workoutSheetModel?.programWorkoutId || null,
  };
}

export function logStartWorkoutTap({
  logger = console,
  effectiveSessionStore = null,
  selectedProgramWorkoutId = null,
  session = null,
  selectedWorkoutSessionPreview = null,
  workoutSheetModel = null,
} = {}) {
  logger.info?.('[start-workout] tap', getStartWorkoutTapSummary({
    effectiveSessionStore,
    selectedProgramWorkoutId,
    session,
    selectedWorkoutSessionPreview,
    workoutSheetModel,
  }));
}

export function logStartWorkoutBlockedMissingStore({ logger = console } = {}) {
  logger.warn?.('[start-workout] blocked: missing effectiveSessionStore');
}

export function logStartWorkoutResumeExistingSession({
  logger = console,
  sessionId = null,
  targetProgramWorkoutId = null,
} = {}) {
  logger.info?.('[start-workout] resume existing session', { sessionId, targetProgramWorkoutId });
}

export function logStartWorkoutOpenOptimisticSession({
  logger = console,
  targetProgramWorkoutId = null,
} = {}) {
  logger.info?.('[start-workout] open optimistic session', { targetProgramWorkoutId });
}

export function logStartWorkoutCreateSession({
  logger = console,
  targetProgramWorkoutId = null,
  storedSessionId = null,
  sessionStatus = null,
} = {}) {
  logger.info?.('[start-workout] create session', { targetProgramWorkoutId, storedSessionId, sessionStatus });
}

export function logStartWorkoutFailed({
  logger = console,
  error = null,
  targetProgramWorkoutId = null,
} = {}) {
  logger.error?.('[start-workout] failed', {
    message: error?.message || String(error),
    targetProgramWorkoutId,
  });
}

export function logStartWorkoutResolvedSession({
  logger = console,
  nextSession = null,
} = {}) {
  logger.info?.('[start-workout] resolved session', {
    nextSessionId: nextSession?.id || null,
    nextProgramWorkoutId: nextSession?.programWorkoutId || null,
  });
}

export function logStartWorkoutBlockedNoNextSession({ logger = console } = {}) {
  logger.warn?.('[start-workout] blocked: no nextSession returned');
}

export function logStartWorkoutOpenActiveWorkoutView({ logger = console } = {}) {
  logger.info?.('[start-workout] open active workout view');
}