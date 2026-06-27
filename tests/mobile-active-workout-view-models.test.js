import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getActiveWorkoutViewModel } from '../apps/mobile/src/train/active-workout-view-models.js';

test('active workout view model source keeps exercise and set mapping in named model helpers', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/active-workout-view-models.js'), 'utf8')
  const activeWorkoutBlock = source.match(/export function getActiveWorkoutViewModel\([\s\S]*?\n\}/)?.[0] || ''
  const exerciseModelBlock = source.match(/function getActiveWorkoutExerciseViewModel\(exercise, session\) \{[\s\S]*?\n\}/)?.[0] || ''
  const setModelBlock = source.match(/function getActiveWorkoutSetViewModel\(set, index, columns, session, exercise\) \{[\s\S]*?\n\}/)?.[0] || ''

  assert.match(source, /function getActiveWorkoutExerciseViewModel\(exercise, session\) \{/)
  assert.match(source, /function getActiveWorkoutSetViewModel\(set, index, columns, session, exercise\) \{/)
  assert.match(activeWorkoutBlock, /exercises:\s*\(session\.exercises \|\| \[\]\)\.map\(\(exercise\) => getActiveWorkoutExerciseViewModel\(exercise, session\)\)/)
  assert.match(exerciseModelBlock, /const columns = getActiveWorkoutExerciseColumns\(exercise\)/)
  assert.match(exerciseModelBlock, /thumbnailUrl: exercise\.thumbnailUrl \?\? null/)
  assert.match(exerciseModelBlock, /videoUrl: exercise\.videoUrl \?\? null/)
  assert.match(exerciseModelBlock, /supersetGroupId: exercise\.supersetGroupId \?\? null/)
  assert.match(exerciseModelBlock, /isSupersetLinked: Boolean\(exercise\.supersetGroupId\)/)
  assert.match(exerciseModelBlock, /sets:\s*\(exercise\.sets \|\| \[\]\)\.map\(\(set, index\) => getActiveWorkoutSetViewModel\(set, index, columns, session, exercise\)\)/)
  assert.match(setModelBlock, /cells: columns\.map\(\(column\) => \(\{/)
  assert.match(setModelBlock, /isActiveTarget: session\.activeSetTarget\?\.exerciseId === exercise\.id && session\.activeSetTarget\?\.setId === set\.id/)
})

function buildSessionWithExercise(exercise) {
  return {
    id: 'session-1',
    status: 'in_progress',
    nameSnapshot: 'Test Workout',
    settings: {},
    exercises: [exercise],
  };
}

test('active workout model renders strength set columns from load and reps fields', () => {
  const model = getActiveWorkoutViewModel({
    session: buildSessionWithExercise({
      id: 'exercise-strength',
      nameSnapshot: 'Back Squat',
      metricProfileId: 'strength_1rm',
      sets: [
        {
          id: 'set-1',
          prescribedRpe: 7,
          prescribedLoad: 135,
          prescribedLoadUnit: 'lb',
          prescribedReps: 5,
        },
      ],
    }),
  });

  assert.deepEqual(
    model.exercises[0].columns.map((column) => column.label),
    ['EFFORT', 'LB', 'REPS'],
  );
  assert.deepEqual(
    model.exercises[0].sets[0].cells.map((cell) => [cell.key, cell.value]),
    [
      ['effort', '7'],
      ['load', '135'],
      ['reps', '5'],
    ],
  );
});

test('active workout model resolves speed columns from exercise classification even before distance fields are populated', () => {
  const session = buildSessionWithExercise({
    stimulusType: 'speed',
    sets: [{ id: 'set-1', prescribedReps: 5, prescribedRpe: 7 }],
  })

  const [exercise] = getActiveWorkoutViewModel({ session }).exercises

  assert.deepEqual(exercise.columns.map((column) => column.key), ['effort', 'reps'])
  assert.deepEqual(exercise.columns.map((column) => column.label), ['EFFORT', 'REPS'])
  assert.deepEqual(exercise.sets[0].cells.map((cell) => cell.key), ['effort', 'reps'])
})

test('active workout model resolves run exercises from name instead of falling back to fixed LB columns', () => {
  const session = buildSessionWithExercise({
    nameSnapshot: 'Run',
    sets: [{ id: 'set-1', prescribedDurationSeconds: 20, prescribedRpe: 7 }],
  })

  const [exercise] = getActiveWorkoutViewModel({ session }).exercises

  assert.deepEqual(exercise.columns.map((column) => column.key), ['effort', 'duration'])
  assert.notDeepEqual(exercise.columns.map((column) => column.label), ['EFFORT', 'LB', 'REPS'])
})

test('active workout model renders speed set columns from distance and duration fields', () => {
  const model = getActiveWorkoutViewModel({
    session: buildSessionWithExercise({
      id: 'exercise-speed',
      nameSnapshot: 'Flying Sprint',
      metricProfileId: 'speed_time',
      sets: [
        {
          id: 'set-1',
          prescribedRpe: 8,
          prescribedDistance: 20,
          prescribedDistanceUnit: 'm',
          prescribedDurationSeconds: 4.2,
          prescribedLoad: 999,
          prescribedReps: 12,
        },
      ],
    }),
  });

  assert.deepEqual(
    model.exercises[0].columns.map((column) => column.label),
    ['EFFORT', 'M', 'TIME'],
  );
  assert.deepEqual(
    model.exercises[0].sets[0].cells.map((cell) => [cell.key, cell.value]),
    [
      ['effort', '8'],
      ['distance', '20'],
      ['duration', '4.2'],
    ],
  );
  assert.equal(model.exercises[0].sets[0].load, undefined);
  assert.equal(model.exercises[0].sets[0].reps, undefined);
});

test('active workout model infers duration-only hold columns when profile metadata is missing', () => {
  const model = getActiveWorkoutViewModel({
    session: buildSessionWithExercise({
      id: 'exercise-hold',
      nameSnapshot: 'Plank Hold',
      sets: [
        {
          id: 'set-1',
          prescribedRpe: 6,
          prescribedDurationSeconds: 45,
        },
      ],
    }),
  });

  assert.deepEqual(
    model.exercises[0].columns.map((column) => column.label),
    ['EFFORT', 'TIME'],
  );
  assert.deepEqual(
    model.exercises[0].sets[0].cells.map((cell) => [cell.key, cell.value]),
    [
      ['effort', '6'],
      ['duration', '45'],
    ],
  );
});
