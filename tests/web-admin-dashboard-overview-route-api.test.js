import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminDashboardRouteHandlers } from '../apps/web/lib/admin-dashboard-route-handlers.js'

function dashboardRequest(path = '/api/admin/dashboard/overview') {
  return new Request(`https://admin.pplus.test${path}`, { method: 'GET' })
}

function createOverview(range = 'last-month') {
  return {
    range,
    rangeLabel: range === 'last-7-days' ? 'Last 7 days' : 'Last month',
    generatedAt: '2026-06-20T12:00:00.000Z',
    summary: {
      athletes: {
        id: 'athletes',
        label: 'Athletes',
        value: '4',
        change: '75% active',
        changeDirection: 'positive',
        footerHeadline: 'Total athletes',
        footerSubtext: '3 active athletes',
      },
      programs: {
        id: 'programs',
        label: 'Programs',
        value: '2',
        change: '50% assigned',
        changeDirection: 'positive',
        footerHeadline: 'Total programs',
        footerSubtext: '1 of 2 assigned programs',
      },
      workouts: {
        id: 'workouts',
        label: 'Workouts',
        value: '3',
        change: '100% assigned',
        changeDirection: 'positive',
        footerHeadline: 'Total workouts',
        footerSubtext: '3 of 3 assigned workouts',
      },
      exercises: {
        id: 'exercises',
        label: 'Exercises',
        value: '3',
        change: '67% used',
        changeDirection: 'positive',
        footerHeadline: 'Total exercises',
        footerSubtext: '2 of 3 used in workouts',
      },
      invites: {
        id: 'invites',
        label: 'Invites',
        value: '2',
        change: '50% accepted',
        changeDirection: 'positive',
        footerHeadline: 'Total athlete invites',
        footerSubtext: '1 of 2 accepted invites',
      },
    },
    trainingExecution: {
      title: 'Training execution',
      total: 4,
      dueTotal: 4,
      missedTotal: 2,
      completedDueTotal: 2,
      trendDirection: 'negative',
      value: '50% completed',
      trend: '50%',
      rangeLabel: range === 'last-7-days' ? 'Last 7 days' : 'Last month',
      buckets: [
        { label: 'W1', completed: 2, assigned: 2, missed: 0 },
        { label: 'W2', completed: 2, assigned: 2, missed: 2 },
      ],
      legend: ['Completed', 'Assigned', 'Missed'],
      footer: '2 of 4 due workouts completed · 2 missed',
    },
    workoutResults: {
      title: 'Workout results',
      categoryOptions: ['Warmup', 'Speed Accelerator'],
      buckets: [
        { workoutName: 'Stride Warmup', category: 'Warmup', assigned: 1, completed: 1, missed: 0 },
      ],
    },
    trainingConsistency: {
      title: 'Training consistency',
      value: '1 / 3',
      footer: 'Based on completed workout sessions',
      heatmapReady: true,
      activeThisWeek: 1,
      activeAthleteCount: 3,
      dailyActivity: [
        { date: '2026-05-23', completedSessions: 3, activeAthletes: 2 },
      ],
    },
  }
}

const expectedSummaryKeys = ['athletes', 'programs', 'workouts', 'exercises', 'invites']

function assertOverviewShape(overview) {
  assert.equal(typeof overview.range, 'string')
  assert.equal(typeof overview.rangeLabel, 'string')
  assert.match(overview.generatedAt, /^\d{4}-\d{2}-\d{2}T/)
  assert.deepEqual(Object.keys(overview.summary), expectedSummaryKeys)

  for (const key of expectedSummaryKeys) {
    assert.deepEqual(Object.keys(overview.summary[key]), [
      'id',
      'label',
      'value',
      'change',
      'changeDirection',
      'footerHeadline',
      'footerSubtext',
    ])
  }

  assert.deepEqual(Object.keys(overview.trainingExecution), [
    'title',
    'total',
    'dueTotal',
    'missedTotal',
    'completedDueTotal',
    'trendDirection',
    'value',
    'trend',
    'rangeLabel',
    'buckets',
    'legend',
    'footer',
  ])
  assert.ok(overview.trainingExecution.buckets.every((bucket) => (
    typeof bucket.label === 'string'
    && Number.isFinite(bucket.completed)
    && Number.isFinite(bucket.assigned)
    && Number.isFinite(bucket.missed)
  )))

  assert.deepEqual(Object.keys(overview.workoutResults), ['title', 'categoryOptions', 'buckets'])
  assert.ok(overview.workoutResults.buckets.every((bucket) => (
    typeof bucket.workoutName === 'string'
    && typeof bucket.category === 'string'
    && Number.isFinite(bucket.assigned)
    && Number.isFinite(bucket.completed)
    && Number.isFinite(bucket.missed)
  )))

  assert.deepEqual(Object.keys(overview.trainingConsistency), [
    'title',
    'value',
    'footer',
    'heatmapReady',
    'activeThisWeek',
    'activeAthleteCount',
    'dailyActivity',
  ])
  assert.ok(overview.trainingConsistency.dailyActivity.every((day) => (
    /^\d{4}-\d{2}-\d{2}$/.test(day.date)
    && Number.isFinite(day.completedSessions)
    && Number.isFinite(day.activeAthletes)
  )))
}

test('dashboard overview API returns the stable overview payload shape and default range', async () => {
  const repositoryCalls = []
  const handlers = createAdminDashboardRouteHandlers({
    createRepository: () => ({
      async getOverview(payload) {
        repositoryCalls.push(payload)
        return createOverview(payload.range)
      },
    }),
  })

  const response = await handlers.overview(dashboardRequest())
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(repositoryCalls, [{ range: 'last-month' }])
  assert.deepEqual(Object.keys(payload), ['overview'])
  assertOverviewShape(payload.overview)
})

test('dashboard overview API passes allowed range query values through to the repository', async () => {
  const repositoryCalls = []
  const handlers = createAdminDashboardRouteHandlers({
    createRepository: () => ({
      async getOverview(payload) {
        repositoryCalls.push(payload)
        return createOverview(payload.range)
      },
    }),
  })

  const response = await handlers.overview(dashboardRequest('/api/admin/dashboard/overview?range=last-7-days'))
  const payload = await response.json()

  assert.equal(response.status, 200)
  assert.deepEqual(repositoryCalls, [{ range: 'last-7-days' }])
  assert.equal(payload.overview.range, 'last-7-days')
  assertOverviewShape(payload.overview)
})
