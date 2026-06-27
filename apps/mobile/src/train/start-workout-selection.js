import { buildStartWorkoutPlan, hasRichSessionStructure } from './session-orchestration.js';
import {
  logStartWorkoutTap as logStartWorkoutTapDefault,
  logStartWorkoutBlockedMissingStore as logStartWorkoutBlockedMissingStoreDefault,
  logStartWorkoutResumeExistingSession as logStartWorkoutResumeExistingSessionDefault,
  logStartWorkoutOpenOptimisticSession as logStartWorkoutOpenOptimisticSessionDefault,
  logStartWorkoutCreateSession as logStartWorkoutCreateSessionDefault,
  logStartWorkoutFailed as logStartWorkoutFailedDefault,
  logStartWorkoutResolvedSession as logStartWorkoutResolvedSessionDefault,
  logStartWorkoutBlockedNoNextSession as logStartWorkoutBlockedNoNextSessionDefault,
  logStartWorkoutOpenActiveWorkoutView as logStartWorkoutOpenActiveWorkoutViewDefault,
} from './session-diagnostics.js';

export function scheduleActiveWorkoutOpen({
  setIsActiveWorkoutViewOpen = () => {},
  runAfterInteractions = (callback) => callback(),
} = {}) {
  return runAfterInteractions(() => setIsActiveWorkoutViewOpen(true));
}

export function mergeResolvedStartWorkoutSession({ optimisticSession = null, resolvedSession = null } = {}) {
  if (!resolvedSession) return null;
  if (!hasRichSessionStructure(optimisticSession)) {
    return resolvedSession;
  }

  const optimisticProgramWorkoutId = optimisticSession?.programWorkoutId || optimisticSession?.id || null;
  const resolvedProgramWorkoutId = resolvedSession?.programWorkoutId || resolvedSession?.id || null;
  const isSameProgramWorkout = Boolean(optimisticProgramWorkoutId && optimisticProgramWorkoutId === resolvedProgramWorkoutId);

  if (hasRichSessionStructure(resolvedSession)) {
    if (!isSameProgramWorkout) return resolvedSession;

    return {
      ...resolvedSession,
      ...(optimisticSession.nameSnapshot ? { nameSnapshot: optimisticSession.nameSnapshot } : {}),
      ...(optimisticSession.name ? { name: optimisticSession.name } : {}),
    };
  }

  if (!isSameProgramWorkout) {
    return resolvedSession;
  }

  const optimisticExercises = optimisticSession.exercises || [];
  const optimisticTotalSets = optimisticExercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0);

  return {
    ...optimisticSession,
    ...resolvedSession,
    nameSnapshot: resolvedSession.nameSnapshot || optimisticSession.nameSnapshot,
    status: resolvedSession.status || optimisticSession.status,
    startedAt: resolvedSession.startedAt || optimisticSession.startedAt,
    elapsedSeconds: resolvedSession.elapsedSeconds ?? optimisticSession.elapsedSeconds ?? 0,
    totalExercisesCount: resolvedSession.totalExercisesCount || optimisticExercises.length,
    totalSetsCount: resolvedSession.totalSetsCount || optimisticTotalSets,
    completedExercisesCount: resolvedSession.completedExercisesCount ?? optimisticSession.completedExercisesCount ?? 0,
    completedSetsCount: resolvedSession.completedSetsCount ?? optimisticSession.completedSetsCount ?? 0,
    exercises: optimisticExercises,
  };
}

export async function orchestrateStartWorkout({
  effectiveSessionStore = null,
  startedAt = new Date().toISOString(),
  storedSessionId = null,
  session = null,
  startWorkoutPlan = null,
  setSession = () => {},
  setIsWorkoutSheetOpen = () => {},
  setIsStartingWorkout = () => {},
  setIsActiveWorkoutViewOpen = () => {},
  runAfterInteractions = (callback) => callback(),
  shouldApplyResolvedSession = () => true,
  onBlockedResolvedSession = () => {},
  logStartWorkoutBlockedMissingStore: logStartWorkoutBlockedMissingStoreOverride = logStartWorkoutBlockedMissingStoreDefault,
  logStartWorkoutResumeExistingSession: logStartWorkoutResumeExistingSessionOverride = logStartWorkoutResumeExistingSessionDefault,
  logStartWorkoutOpenOptimisticSession: logStartWorkoutOpenOptimisticSessionOverride = logStartWorkoutOpenOptimisticSessionDefault,
  logStartWorkoutCreateSession: logStartWorkoutCreateSessionOverride = logStartWorkoutCreateSessionDefault,
  logStartWorkoutFailed: logStartWorkoutFailedOverride = logStartWorkoutFailedDefault,
  logStartWorkoutResolvedSession: logStartWorkoutResolvedSessionOverride = logStartWorkoutResolvedSessionDefault,
  logStartWorkoutBlockedNoNextSession: logStartWorkoutBlockedNoNextSessionOverride = logStartWorkoutBlockedNoNextSessionDefault,
  logStartWorkoutOpenActiveWorkoutView: logStartWorkoutOpenActiveWorkoutViewOverride = logStartWorkoutOpenActiveWorkoutViewDefault,
} = {}) {
  const targetProgramWorkoutId = startWorkoutPlan?.targetProgramWorkoutId || null;
  const optimisticWorkoutSession = startWorkoutPlan?.optimisticSession || null;

  if (!effectiveSessionStore) {
    logStartWorkoutBlockedMissingStoreOverride();
    setIsStartingWorkout(false);

    return {
      outcome: 'blocked-missing-store',
      nextSession: null,
      startWorkoutPlan,
    };
  }

  let nextSession = null;
  let openedActiveWorkoutImmediately = false;

  try {
    if (startWorkoutPlan?.shouldResumeStoredSession) {
      logStartWorkoutResumeExistingSessionOverride({
        sessionId: startWorkoutPlan.resumeSessionId,
        targetProgramWorkoutId,
      });
      const immediateResumeSession = optimisticWorkoutSession || session;
      if (immediateResumeSession?.id) {
        setSession(immediateResumeSession);
      }
      setIsWorkoutSheetOpen(false);
      setIsStartingWorkout(false);
      logStartWorkoutOpenActiveWorkoutViewOverride();
      scheduleActiveWorkoutOpen({ setIsActiveWorkoutViewOpen, runAfterInteractions });
      openedActiveWorkoutImmediately = true;

      void effectiveSessionStore.resumeSession(startWorkoutPlan.resumeSessionId)
        .then((resolvedSession) => {
          const nextResolvedSession = mergeResolvedStartWorkoutSession({
            optimisticSession: immediateResumeSession,
            resolvedSession,
          });
          if (!nextResolvedSession || !shouldApplyResolvedSession()) {
            if (nextResolvedSession) onBlockedResolvedSession(nextResolvedSession);
            return;
          }
          logStartWorkoutResolvedSessionOverride({ nextSession: nextResolvedSession });
          setSession(nextResolvedSession);
        })
        .catch((error) => {
          logStartWorkoutFailedOverride({ error, targetProgramWorkoutId });
        });

      return {
        outcome: 'resume-session-opened',
        nextSession: immediateResumeSession || null,
        startWorkoutPlan,
        targetProgramWorkoutId,
      };
    } else {
      if (optimisticWorkoutSession) {
        logStartWorkoutOpenOptimisticSessionOverride({ targetProgramWorkoutId });
        setSession(optimisticWorkoutSession);
        setIsWorkoutSheetOpen(false);
        setIsStartingWorkout(false);
        logStartWorkoutOpenActiveWorkoutViewOverride();
        scheduleActiveWorkoutOpen({ setIsActiveWorkoutViewOpen, runAfterInteractions });
        openedActiveWorkoutImmediately = true;

        logStartWorkoutCreateSessionOverride({
          targetProgramWorkoutId,
          storedSessionId,
          sessionStatus: session?.status || null,
        });

        void effectiveSessionStore.startSession({
          startedAt,
          programWorkoutId: targetProgramWorkoutId,
          forceNewSession: Boolean(startWorkoutPlan?.shouldStartNewSession),
        })
          .then((result) => {
            const resolvedSession = result?.session || null;
            const nextResolvedSession = mergeResolvedStartWorkoutSession({
              optimisticSession: optimisticWorkoutSession,
              resolvedSession,
            });
            if (!nextResolvedSession || !shouldApplyResolvedSession()) {
              if (nextResolvedSession) onBlockedResolvedSession(nextResolvedSession);
              logStartWorkoutBlockedNoNextSessionOverride();
              return;
            }
            logStartWorkoutResolvedSessionOverride({ nextSession: nextResolvedSession });
            setSession(nextResolvedSession);
          })
          .catch((error) => {
            logStartWorkoutFailedOverride({ error, targetProgramWorkoutId });
          });

        return {
          outcome: 'optimistic-session-opened',
          nextSession: optimisticWorkoutSession,
          startWorkoutPlan,
          targetProgramWorkoutId,
        };
      }

      logStartWorkoutCreateSessionOverride({
        targetProgramWorkoutId,
        storedSessionId,
        sessionStatus: session?.status || null,
      });
      const result = await effectiveSessionStore.startSession({
        startedAt,
        programWorkoutId: targetProgramWorkoutId,
        forceNewSession: Boolean(startWorkoutPlan?.shouldStartNewSession),
      });
      nextSession = mergeResolvedStartWorkoutSession({
        optimisticSession: optimisticWorkoutSession,
        resolvedSession: result?.session || null,
      });
    }
  } catch (error) {
    logStartWorkoutFailedOverride({ error, targetProgramWorkoutId });
    setIsStartingWorkout(false);

    return {
      outcome: 'failed',
      error,
      nextSession: null,
      startWorkoutPlan,
    };
  }

  logStartWorkoutResolvedSessionOverride({ nextSession });

  if (!nextSession || !shouldApplyResolvedSession()) {
    if (nextSession) onBlockedResolvedSession(nextSession);
    logStartWorkoutBlockedNoNextSessionOverride();
    setIsStartingWorkout(false);

    return {
      outcome: 'blocked-no-next-session',
      nextSession: null,
      startWorkoutPlan,
    };
  }

  setSession(nextSession);
  setIsWorkoutSheetOpen(false);
  if (!openedActiveWorkoutImmediately) {
    setIsStartingWorkout(false);
    logStartWorkoutOpenActiveWorkoutViewOverride();
    setIsActiveWorkoutViewOpen(true);
  }

  return {
    outcome: 'resolved-session',
    nextSession,
    startWorkoutPlan,
    targetProgramWorkoutId,
  };
}

export async function orchestrateStartWorkoutFromSheet({
  effectiveSessionStore = null,
  selectedProgramWorkoutId = null,
  session = null,
  selectedWorkoutSessionPreview = null,
  workoutSheetModel = null,
  programWorkout = null,
  startedAt = new Date().toISOString(),
  setIsStartingWorkout = () => {},
  setSession = () => {},
  setIsWorkoutSheetOpen = () => {},
  setIsActiveWorkoutViewOpen = () => {},
  runAfterInteractions = (callback) => callback(),
  shouldApplyResolvedSession = () => true,
  onBlockedResolvedSession = () => {},
  logStartWorkoutTap = logStartWorkoutTapDefault,
  logStartWorkoutBlockedMissingStore = logStartWorkoutBlockedMissingStoreDefault,
  logStartWorkoutResumeExistingSession = logStartWorkoutResumeExistingSessionDefault,
  logStartWorkoutOpenOptimisticSession = logStartWorkoutOpenOptimisticSessionDefault,
  logStartWorkoutCreateSession = logStartWorkoutCreateSessionDefault,
  logStartWorkoutFailed = logStartWorkoutFailedDefault,
  logStartWorkoutResolvedSession = logStartWorkoutResolvedSessionDefault,
  logStartWorkoutBlockedNoNextSession = logStartWorkoutBlockedNoNextSessionDefault,
  logStartWorkoutOpenActiveWorkoutView = logStartWorkoutOpenActiveWorkoutViewDefault,
} = {}) {
  logStartWorkoutTap({
    effectiveSessionStore,
    selectedProgramWorkoutId,
    session,
    selectedWorkoutSessionPreview,
    workoutSheetModel,
  });
  setIsStartingWorkout(true);

  const storedSessionId = effectiveSessionStore?.getCurrentSessionId?.() || null;
  const startWorkoutPlan = buildStartWorkoutPlan({
    session,
    storedSessionId,
    selectedWorkoutSessionPreview,
    workoutSheetModel,
    programWorkout,
    selectedProgramWorkoutId,
    startedAt,
  });

  return orchestrateStartWorkout({
    effectiveSessionStore,
    startedAt,
    storedSessionId,
    session,
    startWorkoutPlan,
    setSession,
    setIsWorkoutSheetOpen,
    setIsStartingWorkout,
    setIsActiveWorkoutViewOpen,
    runAfterInteractions,
    shouldApplyResolvedSession,
    onBlockedResolvedSession,
    logStartWorkoutBlockedMissingStore,
    logStartWorkoutResumeExistingSession,
    logStartWorkoutOpenOptimisticSession,
    logStartWorkoutCreateSession,
    logStartWorkoutFailed,
    logStartWorkoutResolvedSession,
    logStartWorkoutBlockedNoNextSession,
    logStartWorkoutOpenActiveWorkoutView,
  });
}
