export const BULK_EXPORT_FIELD_GROUPS = [
  {
    id: 'athlete-profile',
    label: 'Athlete profile',
    description: 'Core athlete profile table fields.',
    fields: [
      'id',
      'user_id',
      'coach_id',
      'first_name',
      'last_name',
      'date_of_birth',
      'sport',
      'position',
      'handedness',
      'gender',
      'height_cm',
      'weight_kg',
      'avatar_url',
      'units_preference',
      'weight_unit_preference',
      'distance_unit_preference',
      'theme_preference',
      'status',
      'created_at',
      'updated_at',
    ],
  },
  {
    id: 'invitation',
    label: 'Invitation',
    description: 'Athlete invitation and email delivery fields.',
    fields: [
      'id',
      'coach_id',
      'invitee_email',
      'expires_at',
      'used_at',
      'revoked_at',
      'sent_at',
      'athlete_profile_id',
      'created_by_user_id',
      'created_at',
      'updated_at',
    ],
  },
  {
    id: 'current-program',
    label: 'Current program',
    description: 'Latest assigned program fields for the athlete.',
    fields: [
      'id',
      'athlete_id',
      'coach_id',
      'name',
      'description',
      'start_date',
      'end_date',
      'status',
      'created_at',
      'updated_at',
    ],
  },
  {
    id: 'planned-workouts',
    label: 'Planned workouts',
    description: 'Program workout rows attached to the athlete.',
    fields: [
      'id',
      'athlete_id',
      'coach_id',
      'program_id',
      'program_phase_id',
      'program_day_id',
      'program_workout_id',
      'workout_template_id',
      'name_snapshot',
      'notes',
      'import_source',
      'import_source_file_name',
      'bg_color',
      'text_color',
      'status',
      'sort_order',
      'scheduled_date',
      'scheduled_start_time',
      'scheduled_end_time',
      'created_at',
      'updated_at',
    ],
  },
  {
    id: 'workout-sessions',
    label: 'Workout sessions',
    description: 'Completed and in-progress workout session fields.',
    fields: [
      'id',
      'athlete_id',
      'coach_id',
      'program_id',
      'program_day_id',
      'program_workout_id',
      'workout_template_id',
      'name_snapshot',
      'status',
      'started_at',
      'completed_at',
      'elapsed_seconds',
      'notes',
      'perceived_difficulty',
      'total_exercises_count',
      'completed_exercises_count',
      'total_sets_count',
      'completed_sets_count',
      'created_at',
      'updated_at',
    ],
  },
  {
    id: 'load-summaries',
    label: 'Load summaries',
    description: 'Computed training load summary fields.',
    fields: [
      'id',
      'athlete_id',
      'workout_session_id',
      'completed_sets',
      'completed_reps',
      'volume_load',
      'effort_adjusted_load',
      'session_difficulty',
      'log_date',
      'created_at',
    ],
  },
  {
    id: 'groups',
    label: 'Groups',
    description: 'Group and membership fields connected to the athlete.',
    fields: [
      'athlete_group_id',
      'group_name',
      'group_description',
      'access_level',
      'group_status',
      'created_by_user_id',
      'archived_at',
      'group_created_at',
      'group_updated_at',
      'membership_id',
      'added_by_user_id',
      'membership_created_at',
      'membership_updated_at',
    ],
  },
]

export const DEFAULT_BULK_EXPORT_FIELDS = BULK_EXPORT_FIELD_GROUPS.map((fieldGroup) => fieldGroup.id)

function valueFromObject(source, fieldName) {
  if (!source || typeof source !== 'object') return undefined
  return source[fieldName]
}

function valueFromCollection(collection, fieldName, aliases = {}) {
  if (!Array.isArray(collection) || collection.length === 0) return undefined
  return collection
    .map((item) => valueFromObject(item, fieldName) ?? valueFromObject(item, aliases[fieldName]))
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map(String)
    .join(' | ')
}

export function getBulkExportFieldValue(athlete, groupId, fieldName) {
  if (groupId === 'athlete-profile') {
    const profileFields = {
      id: athlete.id,
      user_id: athlete.userId,
      coach_id: athlete.coachId,
      first_name: athlete.firstName,
      last_name: athlete.lastName,
      date_of_birth: athlete.dateOfBirth,
      sport: athlete.sport,
      position: athlete.position,
      handedness: athlete.handedness,
      gender: athlete.gender,
      height_cm: athlete.heightCm,
      weight_kg: athlete.weightKg,
      avatar_url: athlete.avatarUrl,
      units_preference: athlete.unitsPreference,
      weight_unit_preference: athlete.weightUnitPreference,
      distance_unit_preference: athlete.distanceUnitPreference,
      theme_preference: athlete.themePreference,
      status: athlete.status,
      created_at: athlete.createdAt,
      updated_at: athlete.updatedAt,
    }
    return profileFields[fieldName]
  }

  if (groupId === 'invitation') {
    const invitationValue = valueFromObject(athlete.invitation, fieldName)
    if (invitationValue !== undefined) return invitationValue

    const invitationFields = {
      invitee_email: athlete.inviteeEmail,
      athlete_profile_id: athlete.id,
      sent_at: athlete.hasInvite ? 'stored invitation' : '',
    }
    return invitationFields[fieldName]
  }

  if (groupId === 'current-program') {
    const programValue = valueFromObject(athlete.currentProgram, fieldName)
    if (programValue !== undefined) return programValue

    const currentProgramFields = {
      athlete_id: athlete.id,
      name: athlete.program,
      status: athlete.program && athlete.program !== '-' ? 'Assigned' : '',
    }
    return currentProgramFields[fieldName]
  }

  if (groupId === 'planned-workouts') {
    const plannedWorkoutValue = valueFromCollection(athlete.plannedWorkouts, fieldName, {
      program_workout_id: 'id',
    })
    if (plannedWorkoutValue !== undefined) return plannedWorkoutValue

    const plannedWorkoutFields = {
      athlete_id: athlete.id,
      program_workout_id: athlete.currentProgramWorkoutId,
      status: athlete.workoutsTarget > 0 ? 'Planned' : '',
      name_snapshot: athlete.program,
    }
    return plannedWorkoutFields[fieldName]
  }

  if (groupId === 'workout-sessions') {
    const workoutSessionValue = valueFromCollection(athlete.workoutSessions, fieldName)
    if (workoutSessionValue !== undefined) return workoutSessionValue

    const workoutSessionFields = {
      athlete_id: athlete.id,
      status: athlete.workoutsCompleted > 0 ? 'Completed sessions' : '',
      completed_sets_count: athlete.workoutsCompleted,
    }
    return workoutSessionFields[fieldName]
  }

  if (groupId === 'load-summaries') {
    const loadSummaryValue = valueFromCollection(athlete.loadSummaries, fieldName)
    if (loadSummaryValue !== undefined) return loadSummaryValue

    const loadSummaryFields = {
      athlete_id: athlete.id,
      completed_sets: athlete.workoutsCompleted,
    }
    return loadSummaryFields[fieldName]
  }

  if (groupId === 'groups') {
    return valueFromCollection(athlete.groups, fieldName)
  }

  return ''
}

export function formatBulkExportCsvValue(value) {
  if (value === null || value === undefined) return ''
  const stringValue = String(value)
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

export function buildBulkExportCsv(athletesToExport, selectedFieldGroupIds) {
  const selectedGroups = BULK_EXPORT_FIELD_GROUPS.filter((fieldGroup) => selectedFieldGroupIds.includes(fieldGroup.id))
  const exportColumns = selectedGroups.flatMap((fieldGroup) => (
    fieldGroup.fields.map((fieldName) => ({
      groupId: fieldGroup.id,
      fieldName,
      header: `${fieldGroup.id}.${fieldName}`,
    }))
  ))
  const headers = ['export_row', 'athlete_name', ...exportColumns.map((column) => column.header)]
  const rows = athletesToExport.map((athlete, index) => [
    index + 1,
    athlete.name,
    ...exportColumns.map((column) => getBulkExportFieldValue(athlete, column.groupId, column.fieldName)),
  ])

  return [headers, ...rows]
    .map((row) => row.map(formatBulkExportCsvValue).join(','))
    .join('\n')
}

export function getBulkExportFileName(date = new Date()) {
  return `pplus-athletes-export-${date.toISOString().slice(0, 10)}.csv`
}

export function downloadBulkExportFile({ content, fileName, mimeType = 'text/csv;charset=utf-8' }) {
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
