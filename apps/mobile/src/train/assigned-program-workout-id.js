export function getAssignedProgramWorkoutIdForDate(assignedProgram, todayIsoDate) {
  const weeks = Array.isArray(assignedProgram?.weeks) ? assignedProgram.weeks : []
  for (const week of weeks) {
    for (const day of week.days || []) {
      if (day?.date !== todayIsoDate) continue
      const workout = Array.isArray(day.workouts) ? day.workouts[0] : null
      if (workout?.id) {
        return workout.id
      }
    }
  }
  return null
}
