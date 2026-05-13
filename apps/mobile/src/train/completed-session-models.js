import { formatWorkoutTimer, getSessionProgress } from '../../../../packages/core/src/index.js'
import { createActionCardModel, createMetricCardModel } from '../ui/card-models.js'
import { getSessionExerciseModels } from './session-models.js'

export function getCompletedSessionSurfaceModel(session, { completedSessions = [] } = {}) {
  const progress = getSessionProgress(session)
  const exerciseModels = getSessionExerciseModels(session)
  const strongestSet = getStrongestCompletedSet(session)
  const priorCompletedSessions = getPriorCompletedSessions({ session, completedSessions })
  const durationLabel = formatWorkoutTimer(session.elapsedSeconds || 0)
  const difficultyValue = Number(session?.perceivedDifficulty ?? 0)
  const hasDifficulty = Number.isFinite(difficultyValue) && difficultyValue > 0

  const metrics = [
    createMetricCardModel({
      label: 'Duration',
      value: durationLabel,
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
  ]

  if (hasDifficulty) {
    metrics.push(createMetricCardModel({
      label: 'Difficulty',
      value: `${difficultyValue}/10`,
      detail: 'Athlete-rated session difficulty at completion',
    }))
  }

  const highlights = [
    {
      id: 'completed-outcome',
      title: 'Outcome',
      body: 'This workout was saved and ready to feed progress, adherence, and athlete history.',
    },
  ]
  const prResults = buildPrExerciseResults({ exerciseModels, priorCompletedSessions })

  if (hasDifficulty) {
    highlights.push({
      id: 'completed-difficulty',
      title: 'Session difficulty',
      body: `Athlete marked this session ${difficultyValue}/10 difficulty at completion.`,
    })
  }

  if (session?.notes) {
    highlights.push({
      id: 'completed-notes',
      title: 'Workout notes',
      body: session.notes,
    })
  }

  if (prResults.length > 0) {
    highlights.push({
      id: 'completed-pr-summary',
      title: 'New PRs',
      body: `${prResults.length} new PR${prResults.length === 1 ? '' : 's'} today: ${prResults.map((result) => result.exerciseTitle).join(', ')}.`,
    })
  }

  highlights.push(
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
  )

  return {
    header: {
      eyebrow: 'Train / Session',
      title: 'Workout Completed',
      body: `${session.nameSnapshot || session.name || 'Workout'} wrapped up in ${durationLabel}. Review the key work before moving on.`,
    },
    metrics,
    highlights: {
      title: 'Workout recap',
      rows: highlights,
    },
    exerciseResults: {
      title: 'Exercise breakdown',
      rows: exerciseModels.map((exercise) => {
        const prResult = getExercisePrResult({ exercise, priorCompletedSessions })
        return {
          id: exercise.id,
          title: exercise.title,
          body: buildExerciseResultBody(exercise, priorCompletedSessions),
          badgeLabel: prResult ? 'NEW PR' : undefined,
          actionLabel: prResult ? 'View history' : undefined,
          targetKey: prResult ? 'exercise-detail' : undefined,
          actionPayload: prResult ? {
            sourceSurface: 'completed-session',
            exercise: {
              id: exercise.id,
              exerciseId: exercise.exerciseId,
              title: exercise.title,
              name: exercise.name || exercise.title,
              entryContext: {
                type: 'completed-session-pr',
                historyMode: 'best',
                previousBestLabel: `${prResult.previousBestSet.loadLabel} x ${prResult.previousBestSet.repsLabel} reps`,
              },
            },
          } : undefined,
        }
      }),
    },
    nextAction: createActionCardModel({
      title: 'Keep moving',
      body: 'Continue back to Today and keep the athlete flow moving.',
      actionLabel: 'Continue',
      targetKey: 'today',
    }),
  }
}

function buildExerciseResultBody(exercise, priorCompletedSessions = []) {
  const completedSets = exercise.sets.filter((set) => set.isCompleted)
  const completedCount = completedSets.length
  const totalCount = exercise.sets.length
  const bestCompletedSet = getBestCompletedExerciseSet(completedSets)

  if (!bestCompletedSet) {
    return `${completedCount}/${totalCount} sets completed.`
  }

  const prResult = getExercisePrResult({ exercise, priorCompletedSessions, bestCompletedSet })
  const baseSummary = `${completedCount}/${totalCount} sets completed. Best set: ${bestCompletedSet.loadLabel} x ${bestCompletedSet.repsLabel} reps (${bestCompletedSet.title}).`

  if (!prResult) {
    return baseSummary
  }

  return `${baseSummary} New PR. Previous best: ${prResult.previousBestSet.loadLabel} x ${prResult.previousBestSet.repsLabel} reps.`
}

function getBestCompletedExerciseSet(completedSets) {
  let bestSet = null

  for (const set of completedSets) {
    const loadValue = Number(set.actualLoadValue || 0)
    const repsValue = Number(set.actualRepsValue || 0)
    const nextBest = {
      title: set.title,
      loadLabel: `${set.actualLoadValue} ${extractLoadUnit(set.actualLabel)}`,
      repsLabel: `${set.actualRepsValue}`,
      loadValue,
      repsValue,
    }

    if (!bestSet || isExercisePr(nextBest, bestSet) || (loadValue === bestSet.loadValue && repsValue === bestSet.repsValue)) {
      bestSet = nextBest
    }
  }

  return bestSet
}

function getPriorCompletedSessions({ session, completedSessions = [] }) {
  return completedSessions.filter((candidate) => {
    if (!candidate || candidate.status !== 'completed') return false
    if (candidate === session) return false

    const sameIdentity = candidate.id && session?.id && candidate.id === session.id
    const sameCompletion = candidate.completedAt && session?.completedAt && candidate.completedAt === session.completedAt
    return !(sameIdentity && sameCompletion) && !sameCompletion
  })
}

function buildPrExerciseResults({ exerciseModels, priorCompletedSessions }) {
  return exerciseModels
    .map((exercise) => getExercisePrResult({ exercise, priorCompletedSessions }))
    .filter(Boolean)
}

function getExercisePrResult({ exercise, priorCompletedSessions, bestCompletedSet = null }) {
  const resolvedBestSet = bestCompletedSet || getBestCompletedExerciseSet(exercise.sets.filter((set) => set.isCompleted))
  if (!resolvedBestSet) return null

  const previousBestSet = getHistoricalBestExerciseSet(priorCompletedSessions, exercise)
  if (!previousBestSet || !isExercisePr(resolvedBestSet, previousBestSet)) {
    return null
  }

  return {
    exerciseId: exercise.id,
    exerciseTitle: exercise.title,
    bestCompletedSet: resolvedBestSet,
    previousBestSet,
  }
}

function getHistoricalBestExerciseSet(completedSessions, exercise) {
  let historicalBest = null

  for (const completedSession of completedSessions) {
    for (const completedExercise of getSessionExerciseModels(completedSession)) {
      if (!isSameExercise(completedExercise, exercise)) continue

      const exerciseBest = getBestCompletedExerciseSet(completedExercise.sets.filter((set) => set.isCompleted))
      if (!exerciseBest) continue

      if (!historicalBest || isExercisePr(exerciseBest, historicalBest) || (exerciseBest.loadValue === historicalBest.loadValue && exerciseBest.repsValue === historicalBest.repsValue)) {
        historicalBest = exerciseBest
      }
    }
  }

  return historicalBest
}

function isSameExercise(leftExercise, rightExercise) {
  const leftTitle = String(leftExercise?.title || '').trim().toLowerCase()
  const rightTitle = String(rightExercise?.title || '').trim().toLowerCase()
  return leftTitle && rightTitle && leftTitle === rightTitle
}

function isExercisePr(candidateSet, referenceSet) {
  if (!referenceSet) return true
  if (candidateSet.loadValue > referenceSet.loadValue) return true
  if (candidateSet.loadValue === referenceSet.loadValue && candidateSet.repsValue > referenceSet.repsValue) return true
  return false
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
