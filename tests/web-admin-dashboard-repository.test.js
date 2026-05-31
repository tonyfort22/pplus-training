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

test('admin dashboard repository computes real overview metrics from Supabase rows', async () => {
  const repository = createRepository({
    athlete_profiles: [
      { id: 'athlete-current-1', status: 'active', created_at: '2026-05-12T10:00:00.000Z' },
      { id: 'athlete-current-2', status: 'active', created_at: '2026-05-22T10:00:00.000Z' },
      { id: 'athlete-prev-1', status: 'active', created_at: '2026-04-18T10:00:00.000Z' },
      { id: 'athlete-inactive', status: 'inactive', created_at: '2026-05-18T10:00:00.000Z' },
    ],
    programs: [
      { id: 'program-current-1', status: 'active', created_at: '2026-05-03T10:00:00.000Z' },
      { id: 'program-current-2', status: 'draft', created_at: '2026-05-15T10:00:00.000Z' },
      { id: 'program-prev', status: 'active', created_at: '2026-04-10T10:00:00.000Z' },
      { id: 'program-archived', status: 'archived', created_at: '2026-05-20T10:00:00.000Z' },
    ],
    program_workouts: [
      { id: 'assigned-current-1', status: 'scheduled', scheduled_date: '2026-05-06', created_at: '2026-05-01T10:00:00.000Z' },
      { id: 'assigned-current-2', status: 'completed', scheduled_date: '2026-05-08', created_at: '2026-05-02T10:00:00.000Z' },
      { id: 'assigned-current-3', status: 'missed', scheduled_date: '2026-05-21', created_at: '2026-05-10T10:00:00.000Z' },
      { id: 'assigned-prev-1', status: 'scheduled', scheduled_date: '2026-04-12', created_at: '2026-04-04T10:00:00.000Z' },
      { id: 'assigned-future', status: 'scheduled', scheduled_date: '2026-06-02', created_at: '2026-05-29T10:00:00.000Z' },
    ],
    workout_sessions: [
      { id: 'session-current-1', status: 'completed', completed_at: '2026-05-06T14:00:00.000Z', started_at: '2026-05-06T13:00:00.000Z', created_at: '2026-05-06T13:00:00.000Z' },
      { id: 'session-current-2', status: 'completed', completed_at: '2026-05-23T22:00:00.000Z', started_at: '2026-05-23T21:00:00.000Z', created_at: '2026-05-23T21:00:00.000Z' },
      { id: 'session-prev-1', status: 'completed', completed_at: '2026-04-15T09:00:00.000Z', started_at: '2026-04-15T08:00:00.000Z', created_at: '2026-04-15T08:00:00.000Z' },
      { id: 'session-active', status: 'in_progress', completed_at: null, started_at: '2026-05-24T12:00:00.000Z', created_at: '2026-05-24T12:00:00.000Z' },
    ],
    athlete_invitations: [
      { id: 'invite-pending-current', used_at: null, revoked_at: null, expires_at: '2026-06-10T10:00:00.000Z', created_at: '2026-05-25T10:00:00.000Z' },
      { id: 'invite-accepted-current', used_at: '2026-05-26T10:00:00.000Z', revoked_at: null, expires_at: '2026-06-10T10:00:00.000Z', created_at: '2026-05-24T10:00:00.000Z' },
      { id: 'invite-pending-prev', used_at: null, revoked_at: null, expires_at: '2026-05-20T10:00:00.000Z', created_at: '2026-04-20T10:00:00.000Z' },
      { id: 'invite-revoked', used_at: null, revoked_at: '2026-05-20T10:00:00.000Z', expires_at: '2026-06-10T10:00:00.000Z', created_at: '2026-05-19T10:00:00.000Z' },
    ],
  })

  const overview = await repository.getOverview({ range: 'last-month' })

  assert.equal(overview.range, 'last-month')
  assert.equal(overview.summary.athletes.value, '2')
  assert.equal(overview.summary.programs.value, '2')
  assert.equal(overview.summary.sessions.value, '2')
  assert.equal(overview.summary.compliance.value, '67%')
  assert.equal(overview.summary.pendingInvites.value, '1')
  assert.equal(overview.sessionsChart.total, 2)
  assert.equal(overview.sessionsChart.buckets.reduce((total, bucket) => total + bucket.completed, 0), 2)
  assert.equal(overview.sessionsChart.buckets.reduce((total, bucket) => total + bucket.assigned, 0), 3)
  assert.equal(overview.complianceChart.value, '67%')
  assert.equal(overview.complianceChart.buckets.reduce((total, bucket) => total + bucket.completed, 0), 2)
  assert.equal(overview.complianceChart.buckets.reduce((total, bucket) => total + bucket.assigned, 0), 3)
  assert.equal(overview.sessionsByTime.total, 2)
  assert.deepEqual(
    overview.sessionsByTime.buckets.map((bucket) => bucket.label),
    ['Early', 'Morning', 'Afternoon', 'Evening'],
  )
  assert.equal(overview.sessionsByTime.buckets.find((bucket) => bucket.label === 'Afternoon').value, 1)
  assert.equal(overview.sessionsByTime.buckets.find((bucket) => bucket.label === 'Evening').value, 1)
})

test('admin dashboard repository returns honest zero states instead of demo data', async () => {
  const repository = createRepository({
    athlete_profiles: [],
    programs: [],
    program_workouts: [],
    workout_sessions: [],
    athlete_invitations: [],
  })

  const overview = await repository.getOverview({ range: 'last-7-days' })

  assert.equal(overview.summary.athletes.value, '0')
  assert.equal(overview.summary.programs.value, '0')
  assert.equal(overview.summary.sessions.value, '0')
  assert.equal(overview.summary.compliance.value, '0%')
  assert.equal(overview.summary.pendingInvites.value, '0')
  assert.equal(overview.summary.compliance.footerSubtext, 'No assigned sessions in this range')
  assert.equal(overview.sessionsChart.total, 0)
  assert.ok(overview.sessionsChart.buckets.every((bucket) => bucket.completed === 0 && bucket.assigned === 0))
  assert.equal(overview.sessionsByTime.total, 0)
})

test('admin dashboard repository rejects unsupported ranges', async () => {
  const repository = createRepository({
    athlete_profiles: [],
    programs: [],
    program_workouts: [],
    workout_sessions: [],
    athlete_invitations: [],
  })

  await assert.rejects(
    () => repository.getOverview({ range: 'forever' }),
    /Unsupported dashboard range/,
  )
})
