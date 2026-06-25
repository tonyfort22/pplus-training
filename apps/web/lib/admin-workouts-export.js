export const workoutExportColumns = [
  'Workout template ID',
  'Coach ID',
  'Workout name',
  'Description',
  'Category',
  'Focus area',
  'Training type',
  'Duration minutes',
  'Display duration',
  'Sections',
  'Exercises',
  'Sets',
  'Thumbnail URL',
  'Background color',
  'Text color',
  'Created at',
  'Updated at',
  'Status',
]

export function escapeCsvValue(value) {
  const normalizedValue = value == null ? '' : String(value)
  return `"${normalizedValue.replace(/"/g, '""')}"`
}

export function buildWorkoutsExportRows(selectedWorkouts = []) {
  return selectedWorkouts.map((workout) => [
    workout.id,
    workout.coachId,
    workout.name,
    workout.description,
    workout.category,
    workout.focusAreaRaw ?? workout.focusArea,
    workout.trainingType,
    workout.estimatedDurationMinutes,
    workout.duration,
    workout.sections,
    workout.exerciseCount,
    workout.setCount,
    workout.thumbnailUrl,
    workout.backgroundColor,
    workout.textColor,
    workout.createdAt,
    workout.updatedAt,
    workout.status,
  ])
}

export function buildWorkoutsExportCsv(selectedWorkouts = []) {
  const rows = buildWorkoutsExportRows(selectedWorkouts)

  return [workoutExportColumns, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n')
}

export function getWorkoutsExportFileName(date = new Date()) {
  return `pplus-workouts-export-${date.toISOString().slice(0, 10)}.csv`
}

export function downloadWorkoutsExportFile({ content, fileName, mimeType = 'text/csv;charset=utf-8' }) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
