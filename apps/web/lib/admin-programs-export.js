export const programExportColumns = [
  'Program ID',
  'Athlete ID',
  'Assigned athlete IDs',
  'Coach ID',
  'Program type',
  'Program',
  'Athletes',
  'Week count',
  'Duration',
  'Workouts',
  'Exercises',
  'Created date',
  'Created at',
  'Start date',
  'End date',
  'Description',
  'Status',
]

export function escapeCsvValue(value) {
  const normalizedValue = value == null ? '' : String(value)
  return `"${normalizedValue.replace(/"/g, '""')}"`
}

function joinList(values = []) {
  return Array.isArray(values) ? values.filter(Boolean).join('; ') : ''
}

export function buildProgramsExportRows(selectedPrograms = []) {
  return selectedPrograms.map((program) => [
    program.id,
    program.athleteId,
    joinList(program.assignedAthleteIds),
    program.coachId,
    program.programType,
    program.name,
    program.athletesLabel,
    program.weekCount,
    program.duration,
    program.workouts,
    program.exercises,
    program.createdDate,
    program.createdAt,
    program.startDate,
    program.endDate,
    program.description,
    program.status,
  ])
}

export function buildProgramsExportCsv(selectedPrograms = []) {
  const rows = buildProgramsExportRows(selectedPrograms)

  return [programExportColumns, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n')
}

export function getProgramsExportFileName(date = new Date()) {
  return `pplus-programs-export-${date.toISOString().slice(0, 10)}.csv`
}

export function downloadProgramsExportFile({ content, fileName, mimeType = 'text/csv;charset=utf-8' }) {
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
