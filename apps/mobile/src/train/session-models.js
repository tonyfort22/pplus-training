import { formatClock, formatWorkoutTimer, getSessionProgress } from '../../../../packages/core/src/index.js'

export function getSessionHeaderModel(session, elapsedSeconds) {
  const progress = getSessionProgress(session)
  const nextUpSet = getNextUpSet(session)
  const allSetsLogged = progress.totalSets > 0 && progress.completedSets === progress.totalSets

  return {
    eyebrow: 'Train / Session',
    title: session.nameSnapshot || session.name || 'Workout Session',
    finishLabel: session.status === 'completed' ? 'Completed' : allSetsLogged ? 'View summary' : 'Finish',
    discardLabel: session.status === 'in_progress' ? 'Discard session' : null,
    workoutTimerLabel: formatWorkoutTimer(elapsedSeconds),
    nextUpLabel: allSetsLogged ? 'All sets logged. Finish to open the session summary.' : nextUpSet ? `Next up: ${nextUpSet.exerciseTitle} ${nextUpSet.setTitle} • ${nextUpSet.loadLabel} x ${nextUpSet.repsLabel}` : 'All sets logged',
    progressLabel: `${progress.completedSets}/${progress.totalSets} sets, ${progress.completedExercises}/${progress.totalExercises} exercises`,
    progressPercent: progress.completionPercent,
  }
}

export function getRestTimerModel(session, selectedSet) {
  if (!session.activeRestTimer) return null

  const nextUpSet = getNextUpSet(session)
  const completedSetContext = getCompletedSetContext(session, selectedSet)

  return {
    eyebrow: 'Rest timer',
    title: `${completedSetContext.exerciseTitle} • ${completedSetContext.setTitle} complete`,
    body: nextUpSet ? `Recover, then roll straight into ${nextUpSet.setTitle}.` : 'Recover, then finish the session summary when ready.',
    clockLabel: formatClock(session.activeRestTimer.remainingSeconds),
    minusLabel: '-15s',
    plusLabel: '+15s',
  }
}

export function getSessionExerciseModels(session) {
  const nextUpSet = getNextUpSet(session)

  return (session.exercises || []).map((exercise) => ({
    id: exercise.id,
    title: exercise.nameSnapshot || exercise.name,
    restLabel: formatClock(exercise.defaultRestSeconds || 0),
    status: exercise.status,
    sets: (exercise.sets || []).map((set, index) => {
      const isReadyNow = !set.isCompleted && nextUpSet?.exerciseId === exercise.id && nextUpSet?.setId === set.id

      return {
        id: set.id,
        title: `Set ${index + 1}`,
        prescribedLabel: `Prescribed: ${set.prescribedLoad ?? '-'} ${set.prescribedLoadUnit || 'lb'} x ${set.prescribedReps ?? '-'} reps, RPE ${set.prescribedRpe ?? '-'}`,
        actualLabel: `Actual: ${set.actualLoad ?? '-'} ${set.actualLoadUnit || set.prescribedLoadUnit || 'lb'} x ${set.actualReps ?? '-'} reps, RPE ${set.actualRpe ?? '-'}`,
        actualLoadValue: set.actualLoad ?? set.prescribedLoad ?? 0,
        actualRepsValue: set.actualReps ?? set.prescribedReps ?? 0,
        isCompleted: set.isCompleted,
        completionLabel: set.isCompleted ? 'Done' : isReadyNow ? 'Ready now' : 'Later',
      }
    }),
  }))
}

function getNextUpSet(session) {
  for (const exercise of session.exercises || []) {
    for (let index = 0; index < (exercise.sets || []).length; index += 1) {
      const set = exercise.sets[index]
      if (set.isCompleted) continue

      return {
        exerciseId: exercise.id,
        setId: set.id,
        exerciseTitle: exercise.nameSnapshot || exercise.name,
        setTitle: `Set ${index + 1}`,
        loadLabel: `${set.prescribedLoad ?? '-'} ${set.prescribedLoadUnit || 'lb'}`,
        repsLabel: `${set.prescribedReps ?? '-'}`,
      }
    }
  }

  return null
}

function getCompletedSetContext(session, selectedSet) {
  const exerciseId = session.activeRestTimer?.exerciseId
  const setId = session.activeRestTimer?.setId

  for (const exercise of session.exercises || []) {
    if (exerciseId && exercise.id !== exerciseId) continue

    for (let index = 0; index < (exercise.sets || []).length; index += 1) {
      const set = exercise.sets[index]
      if (setId && set.id !== setId) continue

      if (selectedSet && set.id !== selectedSet.id) continue

      return {
        exerciseTitle: exercise.nameSnapshot || exercise.name,
        setTitle: `Set ${index + 1}`,
      }
    }
  }

  return {
    exerciseTitle: 'Exercise',
    setTitle: 'Last set',
  }
}
