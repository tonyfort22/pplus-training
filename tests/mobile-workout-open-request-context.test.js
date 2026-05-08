import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createWorkoutSheetProgramWorkoutPreview } from '../apps/mobile/src/train/session-orchestration.js';
import {
  deriveWorkoutOpenRequestContext,
  getRequestedProgramWorkoutId,
} from '../apps/mobile/src/train/workout-open-request-context.js';

test('getRequestedProgramWorkoutId preserves workout-open precedence rules', () => {
  const requestedDayWorkoutPreview = {
    id: 'preview-id',
    programWorkoutId: 'pw-preview',
    workoutName: 'Preview workout',
    exercises: [{ id: 'exercise-1', name: 'Jump', setCount: 2, defaultRestSeconds: 90 }],
  };

  assert.equal(getRequestedProgramWorkoutId({
    payload: { programWorkoutId: 'pw-payload' },
    requestedDayWorkoutPreview,
    selectedProgramWorkoutId: 'pw-selected',
  }), 'pw-payload');

  assert.equal(getRequestedProgramWorkoutId({
    payload: null,
    requestedDayWorkoutPreview,
    selectedProgramWorkoutId: 'pw-selected',
  }), 'pw-preview');

  assert.equal(getRequestedProgramWorkoutId({
    payload: null,
    requestedDayWorkoutPreview: { id: 'preview-id' },
    selectedProgramWorkoutId: 'pw-selected',
  }), 'preview-id');

  assert.equal(getRequestedProgramWorkoutId({
    payload: null,
    requestedDayWorkoutPreview: null,
    selectedProgramWorkoutId: 'pw-selected',
  }), 'pw-selected');
});

test('deriveWorkoutOpenRequestContext returns the narrow workout-open request context and immediate preview', () => {
  const trainState = {
    programWorkout: {
      id: 'pw-selected',
      workoutName: 'Selected workout',
      exercises: [{ id: 'exercise-selected' }],
    },
    program: {
      calendarWeek: [
        {
          id: 'day-1',
          workoutPreview: {
            id: 'preview-day-1',
            programWorkoutId: 'pw-day-1',
          },
        },
        {
          id: 'day-2',
          workoutPreview: {
            id: 'preview-day-2',
            programWorkoutId: 'pw-day-2',
            workoutName: 'Preview day 2',
            exercises: [{ id: 'exercise-day-2', name: 'Sled Push', setCount: 3, defaultRestSeconds: 60 }],
          },
        },
      ],
    },
  };

  assert.deepEqual(deriveWorkoutOpenRequestContext({
    payload: { selectedDayId: 'day-2' },
    selectedCalendarDayId: 'day-1',
    selectedProgramWorkoutId: 'pw-selected',
    trainState,
  }), {
    requestedCalendarDayId: 'day-2',
    requestedDayWorkoutPreview: {
      id: 'preview-day-2',
      programWorkoutId: 'pw-day-2',
      workoutName: 'Preview day 2',
      exercises: [{ id: 'exercise-day-2', name: 'Sled Push', setCount: 3, defaultRestSeconds: 60 }],
    },
    requestedProgramWorkoutId: 'pw-day-2',
    immediateProgramWorkout: createWorkoutSheetProgramWorkoutPreview({
      workoutPreview: {
        id: 'preview-day-2',
        programWorkoutId: 'pw-day-2',
        workoutName: 'Preview day 2',
        exercises: [{ id: 'exercise-day-2', name: 'Sled Push', setCount: 3, defaultRestSeconds: 60 }],
      },
      programWorkoutId: 'pw-day-2',
    }),
    workoutOpenRequestContext: {
      requestedCalendarDayId: 'day-2',
      requestedDayWorkoutPreview: {
        id: 'preview-day-2',
        programWorkoutId: 'pw-day-2',
        workoutName: 'Preview day 2',
        exercises: [{ id: 'exercise-day-2', name: 'Sled Push', setCount: 3, defaultRestSeconds: 60 }],
      },
      requestedProgramWorkoutId: 'pw-day-2',
    },
  });
});

test('deriveWorkoutOpenRequestContext falls back to the selected day and selected workout id when the requested day has no preview', () => {
  const trainStateProgramWorkout = {
    id: 'pw-selected',
    exercises: [{ id: 'exercise-selected' }],
  };
  const trainState = {
    programWorkout: trainStateProgramWorkout,
    program: {
      calendarWeek: [
        {
          id: 'day-1',
          workoutPreview: null,
        },
      ],
    },
  };

  assert.deepEqual(deriveWorkoutOpenRequestContext({
    payload: null,
    selectedCalendarDayId: 'day-1',
    selectedProgramWorkoutId: 'pw-selected',
    trainState,
  }), {
    requestedCalendarDayId: 'day-1',
    requestedDayWorkoutPreview: null,
    requestedProgramWorkoutId: 'pw-selected',
    immediateProgramWorkout: trainStateProgramWorkout,
    workoutOpenRequestContext: {
      requestedCalendarDayId: 'day-1',
      requestedDayWorkoutPreview: null,
      requestedProgramWorkoutId: 'pw-selected',
    },
  });
});

test('App.js derives the workout-open request context and delegates its logging through the seam helper', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');

  assert.match(appSource, /workout-open-request-context\.js/);
  assert.match(appSource, /const \{[\s\S]*workoutOpenRequestContext,[\s\S]*\} = deriveWorkoutOpenRequestContext\(/);
  assert.match(appSource, /await orchestrateWorkoutOpen\(\{[\s\S]*workoutOpenRequestContext: \{[\s\S]*requestedCalendarDayId,[\s\S]*requestedDayWorkoutPreview,[\s\S]*requestedProgramWorkoutId,[\s\S]*\.\.\.workoutOpenRequestContext,[\s\S]*\},[\s\S]*requestedProgramWorkoutId,[\s\S]*immediateProgramWorkout,[\s\S]*effectiveSessionStore,[\s\S]*workoutClient: createMobileWorkoutClient\(\{ accessToken: authSession\.accessToken \}\),[\s\S]*session,[\s\S]*trainState,[\s\S]*selectedWorkoutSessionPreview,[\s\S]*\}\);/);
  assert.doesNotMatch(appSource, /logWorkoutOpenTap\s*\(\s*\{/);
});
