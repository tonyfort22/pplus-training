import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workoutTrainingBuilderPath = resolve(repoRoot, 'apps/web/components/admin/workout-training-builder.jsx')
const workoutsCalendarViewPath = resolve(repoRoot, 'apps/web/components/admin/workouts-calendar-view.jsx')

test('training builder keeps section accordions collapsed on load', () => {
  const workoutTrainingBuilderSource = readFileSync(workoutTrainingBuilderPath, 'utf8')

  assert.match(workoutTrainingBuilderSource, /function createExercise\(id, title, defaultSets = \[], overrides = \{\}\) \{[\s\S]*isExpanded:\s*overrides\.isExpanded \?\? false,/)
  assert.match(workoutTrainingBuilderSource, /function createSection\(label, exercises = \[], overrides = \{\}\) \{[\s\S]*isExpanded:\s*overrides\.isExpanded \?\? false,/)
  assert.match(workoutTrainingBuilderSource, /createSection\('A1',[\s\S]*isExpanded:\s*false/)
  assert.match(workoutTrainingBuilderSource, /createSection\('A2',[\s\S]*isExpanded:\s*false/)
  assert.match(workoutTrainingBuilderSource, /createExercise\('exercise-skater-hops', 'Skater hops', EXERCISE_LIBRARY\[0\]\.defaultSets, \{ isExpanded: false \}\)/)
  assert.match(workoutTrainingBuilderSource, /createExercise\('exercise-sled-sprint', 'Sled sprint', EXERCISE_LIBRARY\[1\]\.defaultSets, \{ isExpanded: false \}\)/)
  assert.match(workoutTrainingBuilderSource, /createExercise\('exercise-copenhagen-plank', 'Copenhagen plank', EXERCISE_LIBRARY\[2\]\.defaultSets, \{ isExpanded: false \}\)/)
  assert.match(workoutTrainingBuilderSource, /createExercise\('exercise-spirit-bike', 'Spirit Bike sprint', EXERCISE_LIBRARY\[3\]\.defaultSets, \{ isExpanded: false \}\)/)
})

test('calendar workout tree mapping opens only the first exercise inside each section', () => {
  const workoutsCalendarViewSource = readFileSync(workoutsCalendarViewPath, 'utf8')

  assert.match(workoutsCalendarViewSource, /blockExercises\.map\(\(exercise, exerciseIndex\) => \(\{[\s\S]*isExpanded:\s*exerciseIndex === 0,/)
})
