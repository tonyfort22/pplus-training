function resolveAthleteName(athlete = {}) {
  const firstLast = [athlete.firstName, athlete.lastName]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
  return firstLast || athlete.name || athlete.fullName || athlete.email || 'Untitled athlete'
}

function buildAthleteOption(athlete = {}) {
  return {
    id: athlete.id,
    name: resolveAthleteName(athlete),
    thumbnailUrl: athlete.avatarUrl || athlete.avatar_url || athlete.photoUrl || null,
  }
}

function buildAddAthleteSheet(availableAthletes = []) {
  return {
    title: 'Athletes',
    searchPlaceholder: 'Search or Create Athletes',
    addButtonLabel: 'Add',
    athletes: availableAthletes.map(buildAthleteOption),
  }
}

function normalizeCoachAthleteId(athleteId) {
  const value = String(athleteId || '').trim()
  return value.startsWith('coach-athlete-') ? value.slice('coach-athlete-'.length) : value
}

function resolveSelectedAthletes({ athletes = [], athleteIds = [], availableAthletes = [] } = {}) {
  if (Array.isArray(athletes) && athletes.length > 0) {
    return athletes
  }

  const athleteOptions = availableAthletes.map(buildAthleteOption)
  const optionsById = new Map()
  for (const athlete of athleteOptions) {
    if (!athlete?.id) continue
    optionsById.set(athlete.id, athlete)
    optionsById.set(normalizeCoachAthleteId(athlete.id), athlete)
  }

  return (Array.isArray(athleteIds) ? athleteIds : [])
    .map((athleteId) => optionsById.get(athleteId) || optionsById.get(normalizeCoachAthleteId(athleteId)) || null)
    .filter(Boolean)
}

function resolveSelectedAthleteIds(athletes = []) {
  return athletes.map((athlete) => athlete.id).filter(Boolean)
}

export function createEmptyGroupEditDraftModel({ availableAthletes = [] } = {}) {
  return {
    groupId: null,
    title: '',
    namePlaceholder: 'Group name',
    cancelLabel: 'Cancel',
    saveLabel: 'Save',
    addAthletesLabel: 'Add Athletes',
    deleteLabel: 'Delete Group',
    athletes: [],
    selectedAthleteIds: [],
    addAthleteSheet: buildAddAthleteSheet(availableAthletes),
  }
}

export function getGroupEditViewModel({ group = null, groupDraftModel = null, availableAthletes = [] } = {}) {
  if (groupDraftModel) {
    const athletes = Array.isArray(groupDraftModel.athletes) ? groupDraftModel.athletes : []
    return {
      ...createEmptyGroupEditDraftModel({ availableAthletes }),
      ...groupDraftModel,
      groupId: groupDraftModel.groupId || groupDraftModel.id || null,
      title: groupDraftModel.title || groupDraftModel.name || '',
      athletes,
      selectedAthleteIds: resolveSelectedAthleteIds(athletes),
      addAthleteSheet: buildAddAthleteSheet(availableAthletes),
    }
  }

  if (!group) {
    return createEmptyGroupEditDraftModel({ availableAthletes })
  }

  const athletes = resolveSelectedAthletes({
    athletes: group.athletes,
    athleteIds: group.athleteIds,
    availableAthletes,
  })
  return {
    ...createEmptyGroupEditDraftModel({ availableAthletes }),
    groupId: group.id || group.groupId || null,
    title: group.name || group.title || '',
    athletes,
    selectedAthleteIds: resolveSelectedAthleteIds(athletes),
    addAthleteSheet: buildAddAthleteSheet(availableAthletes),
  }
}
