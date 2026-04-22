import { formatClock, formatWorkoutTimer, getSessionProgress } from '../../../../packages/core/src/index.js'

export function getSessionHeaderModel(session, elapsedSeconds) {
  const progress = getSessionProgress(session)

  return {
    eyebrow: 'Train / Session',
    title: session.nameSnapshot || session.name || 'Workout Session',
    finishLabel: session.status === 'completed' ? 'Completed' : 'Finish',
    discardLabel: session.status === 'in_progress' ? 'Discard session' : null,
    workoutTimerLabel: formatWorkoutTimer(elapsedSeconds),
    progressLabel: `${progress.completedSets}/${progress.totalSets} sets, ${progress.completedExercises}/${progress.totalExercises} exercises`,
    progressPercent: progress.completionPercent,
  }
}

export function getRestTimerModel(session, selectedSet) {
  if (!session.activeRestTimer) return null

  return {
    eyebrow: 'Rest timer',
    title: selectedSet ? 'Between completed sets' : 'Active rest block',
    clockLabel: formatClock(session.activeRestTimer.remainingSeconds),
    minusLabel: '-15s',
    plusLabel: '+15s',
  }
}

export function getSessionExerciseModels(session) {
  return (session.exercises || []).map((exercise) => ({
    id: exercise.id,
    title: exercise.nameSnapshot || exercise.name,
    restLabel: formatClock(exercise.defaultRestSeconds || 0),
    status: exercise.status,
    sets: (exercise.sets || []).map((set, index) => ({
      id: set.id,
      title: `Set ${index + 1}`,
      prescribedLabel: `Prescribed: ${set.prescribedLoad ?? '-'} ${set.prescribedLoadUnit || 'lb'} x ${set.prescribedReps ?? '-'} reps, RPE ${set.prescribedRpe ?? '-'}`,
      actualLabel: `Actual: ${set.actualLoad ?? '-'} ${set.actualLoadUnit || set.prescribedLoadUnit || 'lb'} x ${set.actualReps ?? '-'} reps, RPE ${set.actualRpe ?? '-'}`,
      actualLoadValue: set.actualLoad ?? set.prescribedLoad ?? 0,
      actualRepsValue: set.actualReps ?? set.prescribedReps ?? 0,
      isCompleted: set.isCompleted,
      completionLabel: set.isCompleted ? 'Done' : 'Tap left side to complete',
    })),
  }))
}
