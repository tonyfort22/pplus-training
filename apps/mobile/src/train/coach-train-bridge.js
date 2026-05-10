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

  console.info('[coach-train-bridge] fetched', {
    athleteId,
    todayIsoDate,
    assignedProgram: assignedProgram
      ? {
          id: assignedProgram.id ?? null,
          name: assignedProgram.name ?? '',
          weekCount: Array.isArray(assignedProgram.weeks) ? assignedProgram.weeks.length : 0,
          dayCount: Array.isArray(assignedProgram.weeks)
            ? assignedProgram.weeks.reduce((sum, week) => sum + (Array.isArray(week.days) ? week.days.length : 0), 0)
            : 0,
        }
      : null,
    todayProgramWorkout: todayProgramWorkout
      ? {
          id: todayProgramWorkout.id ?? null,
          athleteId: todayProgramWorkout.athleteId ?? null,
          programDayId: todayProgramWorkout.programDayId ?? null,
          nameSnapshot: todayProgramWorkout.nameSnapshot ?? '',
          exerciseCount: Array.isArray(todayProgramWorkout.exercises) ? todayProgramWorkout.exercises.length : 0,
        }
      : null,
    completedSessionsCount: Array.isArray(completedSessions) ? completedSessions.length : 0,
  });

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

  console.info('[coach-train-bridge] resolved', {
    athleteId,
    resolvedProgramWorkoutId: resolvedProgramWorkoutId ?? null,
    seededCoachTrainState: seededCoachTrainState
      ? {
          todayWorkoutName: seededCoachTrainState.today?.workoutName ?? '',
          scheduledLabel: seededCoachTrainState.today?.scheduledLabel ?? '',
          programName: seededCoachTrainState.program?.name ?? '',
          calendarWeekCount: Array.isArray(seededCoachTrainState.program?.calendarWeek) ? seededCoachTrainState.program.calendarWeek.length : 0,
          selectedProgramWorkoutId: seededCoachTrainState.programWorkout?.id ?? null,
        }
      : null,
    hydratedSession: hydratedSession
      ? {
          id: hydratedSession.id ?? null,
          programWorkoutId: hydratedSession.programWorkoutId ?? null,
          status: hydratedSession.status ?? null,
        }
      : null,
    fallbackHydratedSession: fallbackHydratedSession
      ? {
          id: fallbackHydratedSession.id ?? null,
          programWorkoutId: fallbackHydratedSession.programWorkoutId ?? null,
          status: fallbackHydratedSession.status ?? null,
        }
      : null,
  });

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
