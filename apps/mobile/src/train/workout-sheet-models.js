function getEffortLabel(index) {
  return String(6 + index)
}

function getExerciseThumbnailIcon(name) {
  const lowerName = name.toLowerCase()

  if (lowerName.includes('pull')) return 'arrow-down'
  if (lowerName.includes('press')) return 'arrow-up'
  if (lowerName.includes('squat') || lowerName.includes('deadlift')) return 'dumbbell'
  if (lowerName.includes('jump') || lowerName.includes('sprint')) return 'zap'
  return 'dumbbell'
}

function getWeightHeader(name) {
  return name.toLowerCase().includes('assisted') ? '-LB' : 'LB'
}

function getExerciseSets(exercise, dayId) {
  if (exercise.sets?.length) {
    return exercise.sets.map((set, index) => ({
      id: set.id,
      setNumber: String(index + 1),
      effort: String(set.targetRpe ?? set.prescribedRpe ?? 6 + index),
      load: String(set.targetLoad ?? set.prescribedLoad ?? 0),
      reps: String(set.targetReps ?? set.prescribedReps ?? 0),
    }))
  }

  const defaultReps = dayId === 'wed' ? 8 : 5
  const defaultLoad = exercise.name.toLowerCase().includes('assisted') ? 0 : 100

  return Array.from({ length: exercise.setCount || 4 }, (_, index) => ({
    id: `${exercise.id}-set-${index + 1}`,
    setNumber: String(index + 1),
    effort: getEffortLabel(index),
    load: String(defaultLoad),
    reps: String(defaultReps),
  }))
}

function getSummaryItems(workoutModel, totalSets) {
  return [
    { id: 'summary-exercises', label: `${workoutModel.exerciseCount} Exercises` },
    { id: 'summary-sets', label: `${totalSets} sets` },
    { id: 'summary-duration', label: workoutModel.estimatedDurationLabel || estimateDurationLabel(totalSets) },
  ]
}

function estimateDurationLabel(totalSets) {
  if (totalSets >= 20) return 'Est. 1h 4m'
  if (totalSets >= 16) return 'Est. 52m'
  if (totalSets >= 12) return 'Est. 45m'
  return 'Est. 32m'
}

export function getWorkoutSheetModel({ workoutModel, session, selectedDayId }) {
  const totalSets = workoutModel.exercises.reduce((sum, exercise) => sum + (exercise.setCount || exercise.sets?.length || 0), 0)
  const ctaLabel = 'Start Workout'

  return {
    title: workoutModel.workoutName,
    summaryItems: getSummaryItems(workoutModel, totalSets),
    editLabel: 'Edit',
    ctaLabel,
    exercises: workoutModel.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      thumbnailIcon: getExerciseThumbnailIcon(exercise.name),
      weightHeader: getWeightHeader(exercise.name),
      restLabel: exercise.defaultRestLabel,
      utilityIcon: 'arrow-up-down',
      sets: getExerciseSets(exercise, selectedDayId),
    })),
  }
}
