import { shouldUseFallbackWorkout } from './session-orchestration.js';
import {
  logWorkoutOpenFallbackFetchFailed,
  logWorkoutOpenFallbackWorkout,
  logWorkoutOpenPreviewFetchFailed,
} from './session-diagnostics.js';

export async function resolveWorkoutOpenPreview({
  requestedProgramWorkoutId = null,
  effectiveSessionStore = null,
  workoutClient = null,
} = {}) {
  let selectedWorkout = null;
  let selectedWorkoutError = null;

  try {
    selectedWorkout = await workoutClient?.getProgramWorkoutById?.(requestedProgramWorkoutId);
  } catch (error) {
    selectedWorkoutError = error;
    logWorkoutOpenPreviewFetchFailed({
      requestedProgramWorkoutId,
      error,
    });
  }

  if (shouldUseFallbackWorkout({ selectedWorkout, effectiveSessionStore })) {
    try {
      const fallbackWorkout = await effectiveSessionStore.getProgramWorkout({ programWorkoutId: requestedProgramWorkoutId });
      const fallbackWorkoutExerciseCount = Array.isArray(fallbackWorkout?.exercises) ? fallbackWorkout.exercises.length : 0;
      logWorkoutOpenFallbackWorkout({
        requestedProgramWorkoutId,
        selectedWorkout,
        fallbackWorkout,
        selectedWorkoutError,
      });
      if (fallbackWorkout?.id && fallbackWorkoutExerciseCount > 0) {
        selectedWorkout = fallbackWorkout;
      }
    } catch (error) {
      logWorkoutOpenFallbackFetchFailed({
        requestedProgramWorkoutId,
        error,
      });
    }
  }

  return {
    selectedWorkout,
    selectedWorkoutError,
  };
}
