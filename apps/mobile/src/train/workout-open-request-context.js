import { buildImmediateWorkoutSheetPreview } from './session-orchestration.js';

export function getRequestedProgramWorkoutId({ payload = null, requestedDayWorkoutPreview = null, selectedProgramWorkoutId = null } = {}) {
  return payload?.programWorkoutId || requestedDayWorkoutPreview?.programWorkoutId || requestedDayWorkoutPreview?.id || selectedProgramWorkoutId || null;
}

export function deriveWorkoutOpenRequestContext({
  payload = null,
  selectedCalendarDayId = null,
  selectedProgramWorkoutId = null,
  trainState = null,
} = {}) {
  const requestedCalendarDayId = payload?.selectedDayId || selectedCalendarDayId || null;
  const calendarWeek = Array.isArray(trainState?.program?.calendarWeek) ? trainState.program.calendarWeek : [];
  const requestedDayWorkoutPreview = calendarWeek.find((day) => day.id === requestedCalendarDayId)?.workoutPreview || null;
  const requestedProgramWorkoutId = getRequestedProgramWorkoutId({
    payload,
    requestedDayWorkoutPreview,
    selectedProgramWorkoutId,
  });
  const workoutOpenRequestContext = {
    requestedCalendarDayId,
    requestedDayWorkoutPreview,
    requestedProgramWorkoutId,
  };
  const immediateProgramWorkout = buildImmediateWorkoutSheetPreview({
    trainStateProgramWorkout: trainState?.programWorkout,
    requestedProgramWorkoutId,
    requestedDayWorkoutPreview,
  });

  return {
    ...workoutOpenRequestContext,
    immediateProgramWorkout,
    workoutOpenRequestContext,
  };
}
