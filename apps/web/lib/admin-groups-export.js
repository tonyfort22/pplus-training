export const groupExportColumns = [
  'Group ID',
  'Name',
  'Description',
  'Access',
  'Status',
  'Athlete count',
  'Athletes',
  'Updated',
]

export function escapeCsvValue(value) {
  const normalizedValue = value == null ? '' : String(value)
  return `"${normalizedValue.replace(/"/g, '""')}"`
}

export function buildGroupsExportCsv(selectedGroups = []) {
  const rows = selectedGroups.map((group) => [
    group.id,
    group.name,
    group.description,
    group.access,
    group.status,
    group.athleteCount ?? group.athletes?.length ?? 0,
    Array.isArray(group.athletes) ? group.athletes.map((athlete) => athlete.name).filter(Boolean).join('; ') : '',
    group.updatedAt ?? group.updated,
  ])

  return [groupExportColumns, ...rows].map((row) => row.map(escapeCsvValue).join(',')).join('\n')
}

export function getGroupsExportFileName(date = new Date()) {
  return `pplus-groups-export-${date.toISOString().slice(0, 10)}.csv`
}

export function downloadGroupsExportFile({ content, fileName, mimeType = 'text/csv;charset=utf-8' }) {
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
