import { buildStartWorkoutPlan } from './session-orchestration.js';
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
      if (session?.id) {
        setSession(session);
      }
      setIsWorkoutSheetOpen(false);
      setIsStartingWorkout(false);
      logStartWorkoutOpenActiveWorkoutViewOverride();
      setIsActiveWorkoutViewOpen(true);
      openedActiveWorkoutImmediately = true;
      nextSession = await effectiveSessionStore.resumeSession(startWorkoutPlan.resumeSessionId);
    } else {
      if (optimisticWorkoutSession) {
        logStartWorkoutOpenOptimisticSessionOverride({ targetProgramWorkoutId });
        setSession(optimisticWorkoutSession);
        setIsWorkoutSheetOpen(false);
        setIsStartingWorkout(false);
        logStartWorkoutOpenActiveWorkoutViewOverride();
        setIsActiveWorkoutViewOpen(true);
        openedActiveWorkoutImmediately = true;
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
      nextSession = result?.session || null;

      if (optimisticWorkoutSession) {
        setSession(result?.session ?? optimisticWorkoutSession);

        return {
          outcome: 'optimistic-session-created',
          nextSession,
          startWorkoutPlan,
        };
      }
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

  if (!nextSession) {
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
  startedAt = new Date().toISOString(),
  setIsStartingWorkout = () => {},
  setSession = () => {},
  setIsWorkoutSheetOpen = () => {},
  setIsActiveWorkoutViewOpen = () => {},
  runAfterInteractions = (callback) => callback(),
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
