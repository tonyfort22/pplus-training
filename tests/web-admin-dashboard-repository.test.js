import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminDashboardRepository } from '../apps/web/lib/admin-dashboard-repository.js'

const now = new Date('2026-05-30T16:00:00.000Z')

function createFetchMock(tableRows) {
  const requests = []
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url: String(url), options })
    const pathname = new URL(String(url)).pathname
    const table = pathname.split('/').pop()
    if (!(table in tableRows)) {
      return new Response(JSON.stringify({ error: `unexpected table ${table}` }), { status: 404 })
    }
    return new Response(JSON.stringify(tableRows[table]), { status: 200 })
  }
  fetchImpl.requests = requests
  return fetchImpl
}

function createRepository(tableRows) {
  return createAdminDashboardRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: createFetchMock(tableRows),
    now,
  })
}

test('admin dashboard repository computes v2 coach overview metrics from Supabase rows', async () => {
  const repository = createRepository({
    athlete_profiles: [
      { id: 'athlete-active-1', status: 'active', created_at: '2026-01-12T10:00:00.000Z' },
      { id: 'athlete-active-2', status: 'active', created_at: '2026-02-12T10:00:00.000Z' },
      { id: 'athlete-active-3', status: 'active', created_at: '2026-03-12T10:00:00.000Z' },
      { id: 'athlete-inactive', status: 'inactive', created_at: '2026-05-18T10:00:00.000Z' },
    ],
    programs: [
      { id: 'program-active', status: 'active', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'program-draft', status: 'draft', created_at: '2026-05-02T10:00:00.000Z' },
      { id: 'program-archived', status: 'archived', created_at: '2026-05-03T10:00:00.000Z' },
    ],
    workout_templates: [
      { id: 'template-warmup', name: 'Stride Warmup', training_type: 'Warmup', status: 'active', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'template-speed', name: 'Acceleration Ladder', training_type: 'Speed Accelerator', status: 'active', created_at: '2026-05-02T10:00:00.000Z' },
      { id: 'template-edge', name: 'Edge Control Circuit', training_type: 'Edge Work', status: 'active', created_at: '2026-05-03T10:00:00.000Z' },
      { id: 'template-conditioning', name: 'Conditioning Burnout', training_type: 'Conditioning', status: 'archived', created_at: '2026-05-04T10:00:00.000Z' },
    ],
    exercises: [
      { id: 'exercise-1', name: 'Crossover Start', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'exercise-2', name: 'Mohawk Turn', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'exercise-3', name: 'Puck Protection', created_at: '2026-05-01T10:00:00.000Z' },
    ],
    program_workouts: [
      { id: 'due-1', athlete_id: 'athlete-active-1', workout_template_id: 'template-warmup', name_snapshot: 'Stride Warmup', status: 'scheduled', scheduled_date: '2026-05-06', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'due-2', athlete_id: 'athlete-active-1', workout_template_id: 'template-speed', name_snapshot: 'Acceleration Ladder', status: 'completed', scheduled_date: '2026-05-08', created_at: '2026-05-02T10:00:00.000Z' },
      { id: 'due-3', athlete_id: 'athlete-active-2', workout_template_id: 'template-edge', name_snapshot: 'Edge Control Circuit', status: 'missed', scheduled_date: '2026-05-21', created_at: '2026-05-10T10:00:00.000Z' },
      { id: 'due-4', athlete_id: 'athlete-active-2', workout_template_id: 'template-edge', name_snapshot: 'Edge Control Circuit', status: 'missed', scheduled_date: '2026-05-22', created_at: '2026-05-10T10:00:00.000Z' },
      { id: 'prev-due-1', athlete_id: 'athlete-active-1', workout_template_id: 'template-warmup', name_snapshot: 'Stride Warmup', status: 'scheduled', scheduled_date: '2026-04-12', created_at: '2026-04-04T10:00:00.000Z' },
      { id: 'future-due', athlete_id: 'athlete-active-3', workout_template_id: 'template-conditioning', name_snapshot: 'Conditioning Burnout', status: 'scheduled', scheduled_date: '2026-06-02', created_at: '2026-05-29T10:00:00.000Z' },
      { id: 'skipped-due', athlete_id: 'athlete-active-3', workout_template_id: 'template-conditioning', name_snapshot: 'Conditioning Burnout', status: 'skipped', scheduled_date: '2026-05-16', created_at: '2026-05-10T10:00:00.000Z' },
    ],
    workout_sessions: [
      { id: 'session-current-1', athlete_id: 'athlete-active-1', program_workout_id: 'due-1', status: 'completed', completed_at: '2026-05-06T14:00:00.000Z', started_at: '2026-05-06T13:00:00.000Z', created_at: '2026-05-06T13:00:00.000Z' },
      { id: 'session-current-2', athlete_id: 'athlete-active-1', program_workout_id: 'due-2', status: 'completed', completed_at: '2026-05-23T22:00:00.000Z', started_at: '2026-05-23T21:00:00.000Z', created_at: '2026-05-23T21:00:00.000Z' },
      { id: 'session-current-3-same-day-same-athlete', athlete_id: 'athlete-active-1', program_workout_id: null, status: 'completed', completed_at: '2026-05-23T23:00:00.000Z', started_at: '2026-05-23T22:30:00.000Z', created_at: '2026-05-23T22:30:00.000Z' },
      { id: 'session-current-4-same-day-new-athlete', athlete_id: 'athlete-active-2', program_workout_id: null, status: 'completed', completed_at: '2026-05-23T15:00:00.000Z', started_at: '2026-05-23T14:00:00.000Z', created_at: '2026-05-23T14:00:00.000Z' },
      { id: 'session-prev-1', athlete_id: 'athlete-active-1', program_workout_id: 'prev-due-1', status: 'completed', completed_at: '2026-04-15T09:00:00.000Z', started_at: '2026-04-15T08:00:00.000Z', created_at: '2026-04-15T08:00:00.000Z' },
      { id: 'session-active', athlete_id: 'athlete-active-2', program_workout_id: 'due-3', status: 'in_progress', completed_at: null, started_at: '2026-05-24T12:00:00.000Z', created_at: '2026-05-24T12:00:00.000Z' },
    ],
    athlete_invitations: [
      { id: 'invite-pending-current', used_at: null, revoked_at: null, expires_at: '2026-06-10T10:00:00.000Z', created_at: '2026-05-25T10:00:00.000Z' },
      { id: 'invite-accepted-current', used_at: '2026-05-26T10:00:00.000Z', revoked_at: null, expires_at: '2026-06-10T10:00:00.000Z', created_at: '2026-05-24T10:00:00.000Z' },
    ],
  })

  const overview = await repository.getOverview({ range: 'last-month' })

  assert.equal(overview.range, 'last-month')
  assert.equal(overview.summary.athletes.value, '3')
  assert.equal(overview.summary.athletes.label, 'Athletes')
  assert.equal(overview.summary.athletes.footerSubtext, '3 active athletes')
  assert.equal(overview.summary.programs.value, '2')
  assert.equal(overview.summary.programs.label, 'Programs')
  assert.equal(overview.summary.workouts.value, '3')
  assert.equal(overview.summary.workouts.label, 'Workouts')
  assert.equal(overview.summary.exercises.value, '3')
  assert.equal(overview.summary.exercises.label, 'Exercises')
  assert.equal(overview.summary.invites.value, '1')
  assert.equal(overview.summary.invites.label, 'Invites')
  assert.equal(overview.trainingExecution.total, 4)
  assert.equal(overview.trainingExecution.dueTotal, 4)
  assert.equal(overview.trainingExecution.missedTotal, 2)
  assert.equal(overview.trainingExecution.buckets.reduce((total, bucket) => total + bucket.completed, 0), 4)
  assert.equal(overview.trainingExecution.buckets.reduce((total, bucket) => total + bucket.assigned, 0), 4)
  assert.equal(overview.trainingExecution.buckets.reduce((total, bucket) => total + bucket.missed, 0), 2)
  assert.equal(overview.workoutResults.title, 'Workout results')
  assert.deepEqual(overview.workoutResults.statusOptions, ['Assigned', 'Completed', 'Missed'])
  assert.deepEqual(overview.workoutResults.categoryOptions, ['Warmup', 'Speed Accelerator', 'Edge Work', 'Conditioning'])
  assert.deepEqual(overview.workoutResults.buckets, [
    { workoutName: 'Stride Warmup', category: 'Warmup', assigned: 1, completed: 1, missed: 0 },
    { workoutName: 'Acceleration Ladder', category: 'Speed Accelerator', assigned: 0, completed: 1, missed: 0 },
    { workoutName: 'Edge Control Circuit', category: 'Edge Work', assigned: 0, completed: 0, missed: 2 },
  ])
  assert.equal(overview.trainingConsistency.value, '1 / 3')
  assert.equal(overview.trainingConsistency.footer, 'Based on completed workout sessions')
  assert.equal(overview.trainingConsistency.heatmapReady, true)
  assert.deepEqual(overview.trainingConsistency.dailyActivity, [
    { date: '2026-05-06', completedSessions: 1, activeAthletes: 1 },
    { date: '2026-05-23', completedSessions: 3, activeAthletes: 2 },
  ])
})

test('admin dashboard repository returns honest v2 zero states instead of demo data', async () => {
  const repository = createRepository({
    athlete_profiles: [],
    programs: [],
    workout_templates: [],
    exercises: [],
    program_workouts: [],
    workout_sessions: [],
    athlete_invitations: [],
  })

  const overview = await repository.getOverview({ range: 'last-7-days' })

  assert.equal(overview.summary.athletes.value, '0')
  assert.equal(overview.summary.programs.value, '0')
  assert.equal(overview.summary.workouts.value, '0')
  assert.equal(overview.summary.exercises.value, '0')
  assert.equal(overview.summary.invites.value, '0')
  assert.equal(overview.trainingExecution.total, 0)
  assert.ok(overview.trainingExecution.buckets.every((bucket) => bucket.completed === 0 && bucket.assigned === 0 && bucket.missed === 0))
  assert.equal(overview.trainingConsistency.value, '0 / 0')
  assert.equal(overview.trainingConsistency.heatmapReady, false)
  assert.deepEqual(overview.trainingConsistency.dailyActivity, [])
})

test('admin dashboard repository rejects unsupported ranges', async () => {
  const repository = createRepository({
    athlete_profiles: [],
    programs: [],
    workout_templates: [],
    exercises: [],
    program_workouts: [],
    workout_sessions: [],
    athlete_invitations: [],
  })

  await assert.rejects(
    () => repository.getOverview({ range: 'forever' }),
    /Unsupported dashboard range/,
  )
})
