import { getAssignedProgramWorkoutIdForDate } from './assigned-program-workout-id.js';
import { createAssignedProgramTrainState, createTrainSessionStore } from './index.js';

export async function hydrateCoachTrainBridge({
  athleteId,
  currentUserId,
  accessToken,
  accessTokenProvider = null,
  refreshAccessToken = null,
  todayIsoDate = new Date().toISOString().slice(0, 10),
  programClient = null,
  workoutClient = null,
  createTrainSessionStoreOverride = createTrainSessionStore,
  createAssignedProgramTrainStateOverride = createAssignedProgramTrainState,
  getAssignedProgramWorkoutIdForDateOverride = getAssignedProgramWorkoutIdForDate,
} = {}) {
  const sessionStore = createTrainSessionStoreOverride({
    currentAthleteId: athleteId,
    currentUserId,
    accessToken: accessTokenProvider || accessToken,
    refreshAccessToken,
  });

  const [assignedProgram, todayProgramWorkout, completedSessions] = await Promise.all([
    programClient?.getAssignedProgramForAthlete?.(athleteId) || null,
    sessionStore.getProgramWorkout({ onDate: todayIsoDate }),
    workoutClient?.getCompletedSessionsByAthleteId?.(athleteId) || [],
  ]);

  const seededCoachTrainState = assignedProgram?.id
    ? createAssignedProgramTrainStateOverride({
        assignedProgram,
        programWorkout: todayProgramWorkout,
        todayIsoDate,
      })
    : null;
  const resolvedProgramWorkoutId =
    seededCoachTrainState?.programWorkout?.id ||
    todayProgramWorkout?.id ||
    getAssignedProgramWorkoutIdForDateOverride(assignedProgram, todayIsoDate);
  const hydratedSession = await sessionStore.syncCurrentSession({
    programWorkoutId: resolvedProgramWorkoutId,
    onDate: todayIsoDate,
  });
  const fallbackHydratedSessionByProgramWorkout = !hydratedSession?.id && resolvedProgramWorkoutId
    ? await workoutClient?.getInProgressSessionByProgramWorkoutId?.(resolvedProgramWorkoutId)
    : null;
  const fallbackHydratedSession = fallbackHydratedSessionByProgramWorkout?.id
    ? fallbackHydratedSessionByProgramWorkout
    : (!hydratedSession?.id && athleteId
      ? await workoutClient?.getInProgressSessionByAthleteId?.(athleteId)
      : null);

  return {
    trainState: seededCoachTrainState
      ? {
          ...seededCoachTrainState,
          completedSessions: Array.isArray(completedSessions) ? completedSessions : [],
          session:
            fallbackHydratedSession ||
            hydratedSession ||
            sessionStore.getCurrentSession() ||
            seededCoachTrainState.session,
        }
      : null,
    sessionStore,
  };
}
