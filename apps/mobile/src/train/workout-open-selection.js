import { logWorkoutOpenMissingProgramWorkoutId, logWorkoutOpenOpeningWorkoutSheet, logWorkoutOpenResolvedWorkout, logWorkoutOpenTap } from './session-diagnostics.js';
import { resolveWorkoutOpenPreview } from './workout-open-resolution.js';
import { applyWorkoutOpenStateTransition as applyWorkoutOpenStateTransitionDefault } from './workout-open-state-transition.js';

export async function orchestrateWorkoutOpen({
  targetKey = 'workout',
  payload = null,
  selectedCalendarDayId = null,
  selectedProgramWorkoutId = null,
  workoutOpenRequestContext = null,
  requestedProgramWorkoutId = null,
  immediateProgramWorkout = null,
  effectiveSessionStore = null,
  workoutClient = null,
  session = null,
  trainState = null,
  selectedWorkoutSessionPreview = null,
  setIsWorkoutSheetOpen = () => {},
  setSelectedProgramWorkoutPreview = () => {},
  setSelectedWorkoutSessionPreview = () => {},
  applyWorkoutOpenStateTransition = applyWorkoutOpenStateTransitionDefault,
  logWorkoutOpenTap: logWorkoutOpenTapOverride = logWorkoutOpenTap,
  logWorkoutOpenOpeningWorkoutSheet: logWorkoutOpenOpeningWorkoutSheetOverride = logWorkoutOpenOpeningWorkoutSheet,
  logResolvedWorkout = logWorkoutOpenResolvedWorkout,
  logMissingProgramWorkoutId = logWorkoutOpenMissingProgramWorkoutId,
} = {}) {
  logWorkoutOpenTapOverride({
    targetKey,
    payload,
    selectedCalendarDayId,
    selectedProgramWorkoutId,
    ...(workoutOpenRequestContext || {}),
    effectiveSessionStore,
    session,
    trainState,
    selectedWorkoutSessionPreview,
  });
  logWorkoutOpenOpeningWorkoutSheetOverride({});
  setIsWorkoutSheetOpen(true);

  applyWorkoutOpenStateTransition({
    immediateProgramWorkout,
    setSelectedProgramWorkoutPreview,
    setSelectedWorkoutSessionPreview,
  });

  return settleWorkoutOpenSelection({
    requestedProgramWorkoutId,
    immediateProgramWorkout,
    effectiveSessionStore,
    workoutClient,
    logResolvedWorkout,
    logMissingProgramWorkoutId,
    applyStateTransition: ({ immediateProgramWorkout: nextImmediateProgramWorkout = null, selectedWorkout = null }) => {
      applyWorkoutOpenStateTransition({
        immediateProgramWorkout: nextImmediateProgramWorkout,
        selectedWorkout,
        setSelectedProgramWorkoutPreview,
        setSelectedWorkoutSessionPreview,
      });
    },
  });
}

export async function settleWorkoutOpenSelection({
  requestedProgramWorkoutId = null,
  immediateProgramWorkout = null,
  effectiveSessionStore = null,
  workoutClient = null,
  logResolvedWorkout = () => {},
  logMissingProgramWorkoutId = () => {},
  applyStateTransition = () => {},
} = {}) {
  if (requestedProgramWorkoutId) {
    const { selectedWorkout } = await resolveWorkoutOpenPreview({
      requestedProgramWorkoutId,
      effectiveSessionStore,
      workoutClient,
    });

    logResolvedWorkout({
      requestedProgramWorkoutId,
      selectedWorkout,
    });
    applyStateTransition({
      immediateProgramWorkout,
      selectedWorkout,
    });

    return {
      resolution: 'resolved-workout',
      selectedWorkout,
    };
  }

  if (!immediateProgramWorkout?.id) {
    logMissingProgramWorkoutId({
      requestedProgramWorkoutId,
    });
    applyStateTransition({
      immediateProgramWorkout: null,
      selectedWorkout: null,
    });

    return {
      resolution: 'missing-program-workout-id',
      selectedWorkout: null,
    };
  }

  return {
    resolution: 'immediate-preview-only',
    selectedWorkout: null,
  };
}
