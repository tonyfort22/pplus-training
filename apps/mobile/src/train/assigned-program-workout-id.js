import { getPreferredAssignedWorkout } from './assigned-program-workouts.js'

export function getAssignedProgramWorkoutIdForDate(assignedProgram, todayIsoDate) {
  const weeks = Array.isArray(assignedProgram?.weeks) ? assignedProgram.weeks : []
  for (const week of weeks) {
    for (const day of week.days || []) {
      if (day?.date !== todayIsoDate) continue
      const dayWorkouts = Array.isArray(day.workouts) ? day.workouts : []
      const workout = getPreferredAssignedWorkout(dayWorkouts)
      if (workout?.id) {
        return workout.id
      }
    }
  }
  return null
}
