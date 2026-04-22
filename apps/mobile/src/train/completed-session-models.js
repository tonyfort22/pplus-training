import { formatWorkoutTimer, getSessionProgress } from '../../../../packages/core/src/index.js'
import { createActionCardModel, createMetricCardModel } from '../ui/card-models.js'
import { getSessionExerciseModels } from './session-models.js'

export function getCompletedSessionSurfaceModel(session) {
  const progress = getSessionProgress(session)
  const exerciseModels = getSessionExerciseModels(session)
  const strongestSet = getStrongestCompletedSet(session)

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
    highlights: {
      title: 'Session recap',
      rows: [
        {
          id: 'completed-outcome',
          title: 'Outcome',
          body: 'This completed session feeds progress, adherence, and athlete history.',
        },
        {
          id: 'completed-work',
          title: 'Work completed',
          body: `${progress.completedSets}/${progress.totalSets} sets across ${progress.completedExercises}/${progress.totalExercises} exercises were logged as actual work.`,
        },
        {
          id: 'completed-strongest-set',
          title: 'Strongest set',
          body: strongestSet
            ? `${strongestSet.exerciseTitle} ${strongestSet.setTitle} hit ${strongestSet.loadLabel} x ${strongestSet.repsLabel}.`
            : 'No strongest set available from the completed work.',
        },
      ],
    },
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

function getStrongestCompletedSet(session) {
  let strongestSet = null

  for (const exercise of getSessionExerciseModels(session)) {
    for (const set of exercise.sets) {
      if (!set.isCompleted) continue

      const load = Number(set.actualLoadValue || 0)
      if (!strongestSet || load > strongestSet.loadValue) {
        strongestSet = {
          exerciseTitle: exercise.title,
          setTitle: set.title,
          loadLabel: `${set.actualLoadValue} ${extractLoadUnit(set.actualLabel)}`,
          repsLabel: `${set.actualRepsValue}`,
          loadValue: load,
        }
      }
    }
  }

  return strongestSet
}

function extractLoadUnit(actualLabel) {
  const match = actualLabel.match(/Actual:\s+[-\d.]+\s+(\w+)\s+x/)
  return match ? match[1] : 'lb'
}
