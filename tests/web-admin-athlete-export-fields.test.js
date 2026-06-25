import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BULK_EXPORT_FIELD_GROUPS,
  DEFAULT_BULK_EXPORT_FIELDS,
  buildBulkExportCsv,
  getBulkExportFieldValue,
} from '../apps/web/lib/admin-athlete-export.js'

function exportedHeaders(csv) {
  return csv.split('\n')[0].split(',')
}

function exportedValues(csv) {
  return csv.split('\n')[1].split(',')
}

function createExportAthlete(overrides = {}) {
  return {
    id: 'athlete-1',
    userId: 'user-1',
    coachId: 'coach-1',
    name: 'Jordan Alvarez',
    firstName: 'Jordan',
    lastName: 'Alvarez',
    dateOfBirth: '2009-04-12',
    sport: 'Hockey',
    position: 'Forward',
    handedness: 'Right',
    gender: 'Male',
    heightCm: 178,
    weightKg: 75,
    avatarUrl: 'https://cdn.pplus.test/jordan.png',
    unitsPreference: 'metric',
    weightUnitPreference: 'kg',
    distanceUnitPreference: 'km',
    themePreference: 'dark',
    status: 'Inactive',
    createdAt: '2026-06-01T10:00:00.000Z',
    updatedAt: '2026-06-02T10:00:00.000Z',
    invitation: {
      id: 'invite-1',
      coach_id: 'coach-1',
      invitee_email: 'jordan@example.com',
      expires_at: '2026-06-08T10:00:00.000Z',
      used_at: null,
      revoked_at: null,
      sent_at: '2026-06-01T10:05:00.000Z',
      athlete_profile_id: 'athlete-1',
      created_by_user_id: 'coach-user-1',
      created_at: '2026-06-01T10:01:00.000Z',
      updated_at: '2026-06-01T10:05:00.000Z',
    },
    currentProgram: {
      id: 'program-1',
      athlete_id: 'athlete-1',
      coach_id: 'coach-1',
      name: 'Summer Strength',
      description: 'Offseason block',
      start_date: '2026-06-10',
      end_date: '2026-08-10',
      status: 'active',
      created_at: '2026-06-03T10:00:00.000Z',
      updated_at: '2026-06-04T10:00:00.000Z',
    },
    plannedWorkouts: [
      {
        id: 'planned-1',
        athlete_id: 'athlete-1',
        coach_id: 'coach-1',
        program_id: 'program-1',
        program_phase_id: 'phase-1',
        program_day_id: 'day-1',
        workout_template_id: 'template-1',
        name_snapshot: 'Lower Body',
        notes: 'Keep it crisp',
        import_source: 'ai_pdf',
        import_source_file_name: 'block.pdf',
        bg_color: '#003F1D',
        text_color: '#3BE0AF',
        status: 'scheduled',
        sort_order: 2,
        scheduled_date: '2026-06-11',
        scheduled_start_time: '09:00',
        scheduled_end_time: '10:00',
        created_at: '2026-06-03T10:00:00.000Z',
        updated_at: '2026-06-03T11:00:00.000Z',
      },
    ],
    workoutSessions: [
      {
        id: 'session-1',
        athlete_id: 'athlete-1',
        coach_id: 'coach-1',
        program_id: 'program-1',
        program_day_id: 'day-1',
        program_workout_id: 'planned-1',
        workout_template_id: 'template-1',
        name_snapshot: 'Lower Body',
        status: 'completed',
        started_at: '2026-06-11T09:00:00.000Z',
        completed_at: '2026-06-11T09:50:00.000Z',
        elapsed_seconds: 3000,
        notes: 'Good pace',
        perceived_difficulty: 7,
        total_exercises_count: 4,
        completed_exercises_count: 4,
        total_sets_count: 12,
        completed_sets_count: 12,
        created_at: '2026-06-11T09:00:00.000Z',
        updated_at: '2026-06-11T09:50:00.000Z',
      },
    ],
    loadSummaries: [
      {
        id: 'load-1',
        athlete_id: 'athlete-1',
        workout_session_id: 'session-1',
        completed_sets: 12,
        completed_reps: 96,
        volume_load: 4800,
        effort_adjusted_load: 5760,
        session_difficulty: 7,
        log_date: '2026-06-11',
        created_at: '2026-06-11T10:00:00.000Z',
      },
    ],
    groups: [
      {
        athlete_group_id: 'group-1',
        group_name: 'U18 Prep',
        group_description: 'Main training group',
        access_level: 'full',
        group_status: 'active',
        created_by_user_id: 'coach-user-1',
        archived_at: null,
        group_created_at: '2026-05-01T10:00:00.000Z',
        group_updated_at: '2026-05-02T10:00:00.000Z',
        membership_id: 'membership-1',
        added_by_user_id: 'coach-user-1',
        membership_created_at: '2026-05-03T10:00:00.000Z',
        membership_updated_at: '2026-05-04T10:00:00.000Z',
      },
    ],
    ...overrides,
  }
}

test('athlete bulk export field groups include hidden database identifiers where required', () => {
  const fieldGroups = Object.fromEntries(BULK_EXPORT_FIELD_GROUPS.map((fieldGroup) => [fieldGroup.id, fieldGroup.fields]))

  assert.deepEqual(DEFAULT_BULK_EXPORT_FIELDS, Object.keys(fieldGroups))
  assert.ok(fieldGroups['athlete-profile'].includes('id'))
  assert.ok(fieldGroups['athlete-profile'].includes('user_id'))
  assert.ok(fieldGroups['athlete-profile'].includes('coach_id'))
  assert.ok(fieldGroups.invitation.includes('id'))
  assert.ok(fieldGroups.invitation.includes('created_by_user_id'))
  assert.ok(fieldGroups['current-program'].includes('athlete_id'))
  assert.ok(fieldGroups['planned-workouts'].includes('program_workout_id'))
  assert.ok(fieldGroups['workout-sessions'].includes('program_workout_id'))
  assert.ok(fieldGroups['load-summaries'].includes('workout_session_id'))
  assert.ok(fieldGroups.groups.includes('membership_id'))
  assert.ok(fieldGroups.groups.includes('added_by_user_id'))
})

test('athlete bulk export CSV includes hidden database field headers and values', () => {
  const csv = buildBulkExportCsv([createExportAthlete()], DEFAULT_BULK_EXPORT_FIELDS)
  const headers = exportedHeaders(csv)
  const values = exportedValues(csv)
  const valueByHeader = Object.fromEntries(headers.map((header, index) => [header, values[index]]))

  assert.equal(valueByHeader.export_row, '1')
  assert.equal(valueByHeader.athlete_name, 'Jordan Alvarez')
  assert.equal(valueByHeader['athlete-profile.id'], 'athlete-1')
  assert.equal(valueByHeader['athlete-profile.user_id'], 'user-1')
  assert.equal(valueByHeader['athlete-profile.coach_id'], 'coach-1')
  assert.equal(valueByHeader['invitation.id'], 'invite-1')
  assert.equal(valueByHeader['invitation.created_by_user_id'], 'coach-user-1')
  assert.equal(valueByHeader['current-program.id'], 'program-1')
  assert.equal(valueByHeader['planned-workouts.program_workout_id'], 'planned-1')
  assert.equal(valueByHeader['workout-sessions.program_workout_id'], 'planned-1')
  assert.equal(valueByHeader['load-summaries.workout_session_id'], 'session-1')
  assert.equal(valueByHeader['groups.athlete_group_id'], 'group-1')
  assert.equal(valueByHeader['groups.membership_id'], 'membership-1')
})

test('athlete bulk export field values preserve fallbacks for current visible athlete rows', () => {
  const athlete = createExportAthlete({
    invitation: null,
    inviteeEmail: 'fallback@example.com',
    hasInvite: true,
    currentProgram: null,
    program: 'Visible Program',
    workoutsTarget: 3,
    workoutsCompleted: 2,
    plannedWorkouts: [],
    workoutSessions: [],
    loadSummaries: [],
    groups: [],
  })

  assert.equal(getBulkExportFieldValue(athlete, 'invitation', 'invitee_email'), 'fallback@example.com')
  assert.equal(getBulkExportFieldValue(athlete, 'invitation', 'athlete_profile_id'), 'athlete-1')
  assert.equal(getBulkExportFieldValue(athlete, 'invitation', 'sent_at'), 'stored invitation')
  assert.equal(getBulkExportFieldValue(athlete, 'current-program', 'athlete_id'), 'athlete-1')
  assert.equal(getBulkExportFieldValue(athlete, 'current-program', 'name'), 'Visible Program')
  assert.equal(getBulkExportFieldValue(athlete, 'planned-workouts', 'status'), 'Planned')
  assert.equal(getBulkExportFieldValue(athlete, 'workout-sessions', 'completed_sets_count'), 2)
})
