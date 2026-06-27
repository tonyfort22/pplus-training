import test from 'node:test'
import assert from 'node:assert/strict'

import { createAdminRankingRouteHandlers } from '../apps/web/lib/admin-ranking-route-handlers.js'
import { createAdminRankingRepository } from '../apps/web/lib/admin-ranking-repository.js'

function createRepository(overrides = {}) {
  const calls = []
  const repository = {
    async listRankings() {
      calls.push(['listRankings'])
      if (overrides.listRankingsError) throw overrides.listRankingsError
      return overrides.listRankingsPayload ?? {
        source: 'athlete_workout_progress',
        sourceDescription: 'Rankings are derived from live athlete workout progress.',
        rankings: [{ id: 'ranking-1', rank: 1, name: 'Avery Stone' }],
      }
    },
  }

  return { repository, calls }
}

test('admin rankings GET route returns the repository ranking payload unchanged', async () => {
  const payload = {
    source: 'athlete_workout_progress',
    sourceDescription: 'Rankings are derived from live athlete workout progress.',
    rankings: [{ id: 'ranking-1', rank: 1, name: 'Avery Stone' }],
  }
  const { repository, calls } = createRepository({ listRankingsPayload: payload })
  const handlers = createAdminRankingRouteHandlers({ repository })

  const response = await handlers.GET()

  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), payload)
  assert.deepEqual(calls, [['listRankings']])
})

test('admin rankings GET route preserves repository error status and message', async () => {
  const error = new Error('Ranking source unavailable')
  error.status = 503
  const { repository } = createRepository({ listRankingsError: error })
  const handlers = createAdminRankingRouteHandlers({ repository })

  const response = await handlers.GET()

  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: 'Ranking source unavailable' })
})

test('admin rankings GET route creates the Supabase-backed repository lazily so PR builds do not need local secrets', async () => {
  const calls = []
  const { repository } = createRepository()
  const handlers = createAdminRankingRouteHandlers({
    createRepository() {
      calls.push(['createRepository'])
      return repository
    },
  })

  assert.deepEqual(calls, [])

  const response = await handlers.GET()

  assert.equal(response.status, 200)
  assert.deepEqual(calls, [['createRepository']])
})

test('admin ranking repository derives sorted ranking rows from athlete workout progress', async () => {
  const calls = []
  const athleteRepository = {
    async listAthletes() {
      calls.push(['listAthletes'])
      return [
        {
          id: 'athlete-low',
          name: 'Zoe Low',
          dateOfBirth: null,
          avatarUrl: 'zoe.png',
          program: 'Offseason',
          workoutsCompleted: 4,
          workoutsTarget: 5,
          workoutsPercentage: 80,
          lastActive: '2026-06-01',
          status: 'Active',
        },
        {
          id: 'athlete-alpha',
          name: 'Aaron Alpha',
          dateOfBirth: '2010-01-15',
          avatarUrl: 'aaron.png',
          program: 'Speed',
          workoutsCompleted: 5,
          workoutsTarget: 5,
          workoutsPercentage: 100,
          lastActive: '2026-06-04',
          status: 'Active',
        },
        {
          id: 'athlete-beta',
          name: 'Blair Beta',
          dateOfBirth: '2011-02-20',
          avatarUrl: '',
          program: 'Strength',
          workoutsCompleted: 5,
          workoutsTarget: 5,
          workoutsPercentage: 100,
          lastActive: '2026-06-03',
          status: 'Active',
        },
        {
          id: 'athlete-completed-tiebreak',
          name: 'Casey Complete',
          dateOfBirth: 'not-a-date',
          program: 'Strength',
          workoutsCompleted: 3,
          workoutsTarget: 3,
          workoutsPercentage: 100,
          lastActive: '',
          status: '',
        },
      ]
    },
  }
  const repository = createAdminRankingRepository({ athleteRepository })

  const result = await repository.listRankings()

  assert.deepEqual(calls, [['listAthletes']])
  assert.equal(result.source, 'athlete_workout_progress')
  assert.match(result.sourceDescription, /live athlete workout progress/i)
  assert.deepEqual(
    result.rankings.map((ranking) => ranking.id),
    ['athlete-alpha', 'athlete-beta', 'athlete-completed-tiebreak', 'athlete-low'],
  )
  assert.deepEqual(
    result.rankings.map(({ rank, badgeSrc }) => ({ rank, badgeSrc })),
    [
      { rank: 1, badgeSrc: '/admin/gold_badge.svg' },
      { rank: 2, badgeSrc: '/admin/silver_badge.svg' },
      { rank: 3, badgeSrc: '/admin/bronze_badget.svg' },
      { rank: 4, badgeSrc: '' },
    ],
  )
  assert.equal(result.rankings[0].name, 'Aaron Alpha')
  assert.equal(result.rankings[0].workoutsCompleted, 5)
  assert.equal(result.rankings[0].workoutsTarget, 5)
  assert.equal(result.rankings[0].workoutsPercentage, 100)
  assert.match(result.rankings[0].ageLabel, /^\d+ year old$/)
  assert.equal(result.rankings[2].ageLabel, 'Date of birth unavailable')
  assert.equal(result.rankings[2].lastActive, 'Never')
  assert.equal(result.rankings[2].status, 'Inactive')
})

test('admin ranking repository returns an empty ranking list when athlete rows are unavailable', async () => {
  const repository = createAdminRankingRepository({
    athleteRepository: {
      async listAthletes() {
        return null
      },
    },
  })

  const result = await repository.listRankings()

  assert.deepEqual(result.rankings, [])
  assert.equal(result.source, 'athlete_workout_progress')
})
