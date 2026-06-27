export const exerciseExportColumns = [
  'Exercise ID',
  'Exercise name',
  'Description',
  'Primary muscle',
  'Primary muscle ID',
  'Secondary muscles',
  'Secondary muscle IDs',
  'Equipment',
  'Movement types',
  'Movement pattern',
  'Category',
  'Difficulty',
  'Total sets',
  'Default sets',
  'Default reps',
  'Default duration',
  'Default distance',
  'Default weight',
  'Default rest',
  'Default tempo',
  'Thumbnail URL',
  'Video URL',
  'Created at',
  'Status',
]

export function escapeCsvValue(value) {
  const normalizedValue = value == null ? '' : String(value)
  return `"${normalizedValue.replace(/"/g, '""')}"`
}

function joinValues(values = []) {
  return Array.isArray(values) ? values.filter(Boolean).join(', ') : ''
}

function getPrimaryMuscle(exercise = {}) {
  if (Array.isArray(exercise.muscleNames) && exercise.muscleNames.length > 0) {
    return exercise.muscleNames[0]
  }

  return exercise.muscle ?? ''
}

function getSecondaryMuscles(exercise = {}) {
  return Array.isArray(exercise.muscleNames) ? exercise.muscleNames.slice(1).join(', ') : ''
}

function getSecondaryMuscleIds(exercise = {}) {
  return Array.isArray(exercise.secondaryMuscleIds) ? exercise.secondaryMuscleIds.filter(Boolean).join(', ') : ''
}

function getEquipment(exercise = {}) {
  if (Array.isArray(exercise.equipmentNeeded) && exercise.equipmentNeeded.length > 0) {
    return joinValues(exercise.equipmentNeeded)
  }

  return exercise.equipment ?? ''
}

export function buildExercisesExportRows(selectedExercises = []) {
  return selectedExercises.map((exercise) => [
    exercise.id,
    exercise.name,
    exercise.description,
    getPrimaryMuscle(exercise),
    exercise.primaryMuscleId,
    getSecondaryMuscles(exercise),
    getSecondaryMuscleIds(exercise),
    getEquipment(exercise),
    joinValues(exercise.movementTypeValues),
    exercise.movementPattern,
    exercise.category,
    exercise.difficulty,
    exercise.totalSetCount,
    exercise.sets,
    exercise.reps,
    exercise.duration,
    exercise.distance,
    exercise.weights,
    exercise.rest,
    exercise.tempo,
    exercise.thumbnailUrl,
    exercise.videoUrl,
    exercise.createdAt,
    exercise.status,
  ])
}

export function buildExercisesExportCsv(selectedExercises = []) {
  const rows = buildExercisesExportRows(selectedExercises)

  return [exerciseExportColumns, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n')
}

export function getExercisesExportFileName(date = new Date()) {
  return `pplus-exercises-export-${date.toISOString().slice(0, 10)}.csv`
}

export function downloadExercisesExportFile({ content, fileName, mimeType = 'text/csv;charset=utf-8' }) {
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
