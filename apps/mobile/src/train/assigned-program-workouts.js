export function getPreferredAssignedWorkout(dayWorkouts = []) {
  return dayWorkouts.find((workout) => String(workout?.nameSnapshot || '').trim()) || dayWorkouts[0] || null
}

export function getPreferredAssignedWorkoutName(dayWorkouts = [], fallbackDayName = null) {
  const preferredWorkout = getPreferredAssignedWorkout(dayWorkouts)
  return preferredWorkout?.nameSnapshot || fallbackDayName || 'Rest Day'
}
