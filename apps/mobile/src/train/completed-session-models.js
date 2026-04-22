import { formatWorkoutTimer, getSessionProgress } from '../../../../packages/core/src/index.js'
import { createActionCardModel, createMetricCardModel } from '../ui/card-models.js'
import { getSessionExerciseModels } from './session-models.js'

export function getCompletedSessionSurfaceModel(session) {
  const progress = getSessionProgress(session)
  const exerciseModels = getSessionExerciseModels(session)

  return {
    header: {
      eyebrow: 'Train / Session',
      title: 'Session complete',
      body: `${session.nameSnapshot || session.name || 'Workout'} logged and ready to feed progress.`,
    },
    metrics: [
      createMetricCardModel({
        label: 'Duration',
        value: formatWorkoutTimer(session.elapsedSeconds || 0),
        detail: `${progress.completedSets}/${progress.totalSets} sets completed`,
      }),
      createMetricCardModel({
        label: 'Exercises',
        value: `${progress.completedExercises}/${progress.totalExercises}`,
        detail: 'Completed exercises out of the planned session',
      }),
      createMetricCardModel({
        label: 'Adherence',
        value: `${progress.completionPercent}%`,
        detail: 'Actual completed work recorded against the plan',
      }),
    ],
    exerciseResults: {
      title: 'Logged exercises',
      rows: exerciseModels.map((exercise) => ({
        id: exercise.id,
        title: exercise.title,
        body: buildExerciseResultBody(exercise),
      })),
    },
    nextAction: createActionCardModel({
      title: 'Session saved',
      body: 'Head back to Today and keep the athlete flow moving.',
      actionLabel: 'Back to today',
      targetKey: 'today',
    }),
  }
}

function buildExerciseResultBody(exercise) {
  const completedSets = exercise.sets.filter((set) => set.isCompleted)
  const lastCompletedSet = completedSets[completedSets.length - 1]
  const completedCount = completedSets.length
  const totalCount = exercise.sets.length

  if (!lastCompletedSet) {
    return `${completedCount}/${totalCount} sets completed.`
  }

  return `${completedCount}/${totalCount} sets completed. Final set: ${lastCompletedSet.actualLabel}`
}
