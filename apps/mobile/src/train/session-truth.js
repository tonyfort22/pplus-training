export function getComparableProgramWorkoutId(value) {
  if (value == null) return null
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }

  return value.programWorkoutId
    || value?.actionPayload?.programWorkoutId
    || value.id
    || null
}

export function doesSessionMatchWorkout(session, workoutLike) {
  const sessionProgramWorkoutId = getComparableProgramWorkoutId(session)
  const workoutProgramWorkoutId = getComparableProgramWorkoutId(workoutLike)

  return Boolean(
    sessionProgramWorkoutId
    && workoutProgramWorkoutId
    && sessionProgramWorkoutId === workoutProgramWorkoutId
  )
}

export function isSameSessionLineage(left, right) {
  if (!left || !right) return false
  if (left.id && right.id && left.id === right.id) return true
  return doesSessionMatchWorkout(left, right)
}
