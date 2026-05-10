import test from 'node:test'
import assert from 'node:assert/strict'
import { getAnalyticsViewModel } from '../apps/mobile/src/progress/index.js'

test('mobile analytics Strength cards prefer classification truth over load-plus-reps heuristics for non-strength exercises', () => {
  const model = getAnalyticsViewModel({
    sessions: [
      {
        id: 'session-strength-classification-1',
        athleteId: 'athlete-1',
        status: 'completed',
        completedAt: '2026-05-20T18:00:00.000Z',
        exercises: [
          {
            id: 'exercise-back-squat',
            exerciseId: 'exercise-back-squat',
            nameSnapshot: 'Barbell Back Squat',
            stimulusType: 'strength',
            sets: [
              { id: 'squat-set-1', isCompleted: true, actualLoad: 135, actualLoadUnit: 'lb', actualReps: 5 },
            ],
          },
          {
            id: 'exercise-resisted-sprint',
            exerciseId: 'exercise-resisted-sprint',
            nameSnapshot: 'Resisted Sprint',
            stimulusType: 'speed',
            sets: [
              { id: 'sprint-set-1', isCompleted: true, actualLoad: 90, actualLoadUnit: 'lb', actualReps: 6, actualDistance: 20, actualDistanceUnit: 'm', actualDurationSeconds: 4.2 },
            ],
          },
        ],
      },
    ],
  })

  assert.deepEqual(model.strengthCards.map((card) => card.exerciseId), ['exercise-back-squat'])
  assert.deepEqual(model.defaultStrengthExerciseIds, ['exercise-back-squat'])
})

test('mobile analytics Strength cards keep the old load-plus-reps fallback for exercises with unknown classification', () => {
  const model = getAnalyticsViewModel({
    sessions: [
      {
        id: 'session-strength-classification-2',
        athleteId: 'athlete-1',
        status: 'completed',
        completedAt: '2026-05-21T18:00:00.000Z',
        exercises: [
          {
            id: 'exercise-unknown-strength',
            exerciseId: 'exercise-unknown-strength',
            nameSnapshot: 'Mystery Press',
            stimulusType: 'coordination',
            movementPattern: 'rotation',
            sets: [
              { id: 'mystery-set-1', isCompleted: true, actualLoad: 155, actualLoadUnit: 'lb', actualReps: 4 },
            ],
          },
        ],
      },
    ],
  })

  assert.deepEqual(model.strengthCards.map((card) => card.exerciseId), ['exercise-unknown-strength'])
  assert.deepEqual(model.defaultStrengthExerciseIds, ['exercise-unknown-strength'])
})

test('mobile analytics Strength cards use shared classification normalization for non-strength filtering', () => {
  const model = getAnalyticsViewModel({
    sessions: [
      {
        id: 'session-strength-classification-3',
        athleteId: 'athlete-1',
        status: 'completed',
        completedAt: '2026-05-22T18:00:00.000Z',
        exercises: [
          {
            id: 'exercise-loaded-carry',
            exerciseId: 'exercise-loaded-carry',
            nameSnapshot: 'Farmer Carry',
            stimulusType: 'Loaded Carry',
            sets: [
              { id: 'carry-set-1', isCompleted: true, actualLoad: 95, actualLoadUnit: 'lb', actualReps: 10 },
            ],
          },
          {
            id: 'exercise-bench-press',
            exerciseId: 'exercise-bench-press',
            nameSnapshot: 'Barbell Bench Press',
            stimulusType: 'Power',
            sets: [
              { id: 'bench-set-1', isCompleted: true, actualLoad: 185, actualLoadUnit: 'lb', actualReps: 6 },
            ],
          },
        ],
      },
    ],
  })

  assert.deepEqual(model.strengthCards.map((card) => card.exerciseId), ['exercise-bench-press'])
  assert.deepEqual(model.defaultStrengthExerciseIds, ['exercise-bench-press'])
})
