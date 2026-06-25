import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminDashboardRepository } from '../apps/web/lib/admin-dashboard-repository.js'

const now = new Date('2026-05-30T16:00:00.000Z')

function createFetchMock(tableRows) {
  return async (url) => {
    const pathname = new URL(String(url)).pathname
    const table = pathname.split('/').pop()
    if (!(table in tableRows)) {
      return new Response(JSON.stringify({ error: `unexpected table ${table}` }), { status: 404 })
    }
    return new Response(JSON.stringify(tableRows[table]), { status: 200 })
  }
}

function createRepository(tableRows) {
  return createAdminDashboardRepository({
    supabaseUrl: 'https://example.supabase.co',
    serviceRoleKey: 'service-role-key',
    fetchImpl: createFetchMock(tableRows),
    now,
  })
}

function baseRows({ programWorkouts = [], workoutSessions = [] } = {}) {
  return {
    athlete_profiles: [],
    programs: [],
    workout_templates: [],
    exercises: [],
    workout_template_exercises: [],
    program_workouts: programWorkouts,
    workout_sessions: workoutSessions,
    athlete_invitations: [],
  }
}

test('dashboard training execution calculates plan completion from due workouts only', async () => {
  const overview = await createRepository(baseRows({
    programWorkouts: [
      { id: 'direct-completed', athlete_id: 'athlete-1', status: 'completed', scheduled_date: '2026-05-06', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'session-completed', athlete_id: 'athlete-1', status: 'scheduled', scheduled_date: '2026-05-07', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'missed-workout', athlete_id: 'athlete-2', status: 'missed', scheduled_date: '2026-05-08', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'open-workout', athlete_id: 'athlete-2', status: 'scheduled', scheduled_date: '2026-05-09', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'future-workout', athlete_id: 'athlete-3', status: 'scheduled', scheduled_date: '2026-06-10', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'skipped-workout', athlete_id: 'athlete-3', status: 'skipped', scheduled_date: '2026-05-10', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'cancelled-workout', athlete_id: 'athlete-3', status: 'cancelled', scheduled_date: '2026-05-11', created_at: '2026-05-01T10:00:00.000Z' },
    ],
    workoutSessions: [
      { id: 'linked-session', athlete_id: 'athlete-1', program_workout_id: 'session-completed', status: 'completed', completed_at: '2026-05-07T14:00:00.000Z', started_at: '2026-05-07T13:00:00.000Z', created_at: '2026-05-07T13:00:00.000Z' },
      { id: 'adhoc-session', athlete_id: 'athlete-4', program_workout_id: null, status: 'completed', completed_at: '2026-05-12T14:00:00.000Z', started_at: '2026-05-12T13:00:00.000Z', created_at: '2026-05-12T13:00:00.000Z' },
      { id: 'in-progress-session', athlete_id: 'athlete-2', program_workout_id: 'open-workout', status: 'in_progress', completed_at: null, started_at: '2026-05-09T13:00:00.000Z', created_at: '2026-05-09T13:00:00.000Z' },
    ],
  })).getOverview({ range: 'last-month' })

  assert.equal(overview.trainingExecution.dueTotal, 4)
  assert.equal(overview.trainingExecution.completedDueTotal, 2)
  assert.equal(overview.trainingExecution.missedTotal, 1)
  assert.equal(overview.trainingExecution.value, '50% completed')
  assert.equal(overview.trainingExecution.trend, '50%')
  assert.equal(overview.trainingExecution.trendDirection, 'negative')
  assert.equal(overview.trainingExecution.footer, '2 of 4 due workouts completed · 1 missed')

  assert.equal(overview.trainingExecution.total, 2)
  assert.equal(overview.trainingExecution.buckets.reduce((sum, bucket) => sum + bucket.completed, 0), 2)
  assert.equal(overview.trainingExecution.buckets.reduce((sum, bucket) => sum + bucket.assigned, 0), 4)
  assert.equal(overview.trainingExecution.buckets.reduce((sum, bucket) => sum + bucket.missed, 0), 1)
})

test('dashboard training execution keeps zero and full completion badge directions honest', async () => {
  const zeroOverview = await createRepository(baseRows({
    programWorkouts: [
      { id: 'due-1', athlete_id: 'athlete-1', status: 'scheduled', scheduled_date: '2026-05-06', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'due-2', athlete_id: 'athlete-2', status: 'missed', scheduled_date: '2026-05-07', created_at: '2026-05-01T10:00:00.000Z' },
    ],
    workoutSessions: [
      { id: 'adhoc-session', athlete_id: 'athlete-3', program_workout_id: null, status: 'completed', completed_at: '2026-05-08T14:00:00.000Z', started_at: '2026-05-08T13:00:00.000Z', created_at: '2026-05-08T13:00:00.000Z' },
    ],
  })).getOverview({ range: 'last-month' })

  assert.equal(zeroOverview.trainingExecution.completedDueTotal, 0)
  assert.equal(zeroOverview.trainingExecution.value, '0% completed')
  assert.equal(zeroOverview.trainingExecution.trend, '0%')
  assert.equal(zeroOverview.trainingExecution.trendDirection, 'neutral')
  assert.equal(zeroOverview.trainingExecution.footer, '0 of 2 due workouts completed · 1 missed')

  const fullOverview = await createRepository(baseRows({
    programWorkouts: [
      { id: 'due-1', athlete_id: 'athlete-1', status: 'completed', scheduled_date: '2026-05-06', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'due-2', athlete_id: 'athlete-2', status: 'scheduled', scheduled_date: '2026-05-07', created_at: '2026-05-01T10:00:00.000Z' },
    ],
    workoutSessions: [
      { id: 'linked-session', athlete_id: 'athlete-2', program_workout_id: 'due-2', status: 'completed', completed_at: '2026-05-07T14:00:00.000Z', started_at: '2026-05-07T13:00:00.000Z', created_at: '2026-05-07T13:00:00.000Z' },
    ],
  })).getOverview({ range: 'last-month' })

  assert.equal(fullOverview.trainingExecution.completedDueTotal, 2)
  assert.equal(fullOverview.trainingExecution.value, '100% completed')
  assert.equal(fullOverview.trainingExecution.trend, '100%')
  assert.equal(fullOverview.trainingExecution.trendDirection, 'positive')
  assert.equal(fullOverview.trainingExecution.footer, '2 of 2 due workouts completed · 0 missed')
})
