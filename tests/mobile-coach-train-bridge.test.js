import test from 'node:test'
import assert from 'node:assert/strict'

import { hydrateCoachTrainBridge } from '../apps/mobile/src/train/coach-train-bridge.js'
import { createDemoCompletedSessions, createDemoProgramWorkout } from '../apps/mobile/src/train/index.js'

test('hydrateCoachTrainBridge carries completed session history into coach train state so exercise detail progress can plot real PR data', async () => {
  const programWorkout = createDemoProgramWorkout()
  const completedSessions = createDemoCompletedSessions(programWorkout)

  const bridge = await hydrateCoachTrainBridge({
    athleteId: 'athlete-1',
    currentUserId: 'coach-1',
    accessToken: 'token',
    todayIsoDate: '2026-04-20',
    programClient: {
      async getAssignedProgramForAthlete() {
        return {
          id: 'assigned-1',
          name: 'Training Program',
          weeks: [{
            weekIndex: 1,
            days: [{
              id: 'day-1',
              date: '2026-04-20',
              workouts: [programWorkout],
            }],
          }],
        }
      },
    },
    workoutClient: {
      async getInProgressSessionByProgramWorkoutId() {
        return null
      },
      async getInProgressSessionByAthleteId() {
        return null
      },
      async getCompletedSessionsByAthleteId() {
        return completedSessions
      },
    },
    createTrainSessionStoreOverride() {
      return {
        async getProgramWorkout() {
          return programWorkout
        },
        async syncCurrentSession() {
          return null
        },
        getCurrentSession() {
          return null
        },
      }
    },
  })

  assert.equal(Array.isArray(bridge.trainState?.completedSessions), true)
  assert.equal(bridge.trainState.completedSessions.length, completedSessions.length)
  assert.equal(bridge.trainState.completedSessions[0].status, 'completed')
  assert.equal(bridge.trainState.completedSessions[0].exercises[0].nameSnapshot, 'Barbell Back Squat')
})

test('hydrateCoachTrainBridge strips coach-athlete UI ids before hitting REST-facing clients', async () => {
  const calls = []
  const programWorkout = {
    ...createDemoProgramWorkout(),
    id: 'program-workout-1',
    athleteId: 'f8a72b19-c5c6-4da1-8793-27d80635a444',
  }

  const bridge = await hydrateCoachTrainBridge({
    athleteId: 'coach-athlete-f8a72b19-c5c6-4da1-8793-27d80635a444',
    currentUserId: 'coach-1',
    accessToken: 'token',
    todayIsoDate: '2026-04-20',
    programClient: {
      async getAssignedProgramForAthlete(athleteId) {
        calls.push(['getAssignedProgramForAthlete', athleteId])
        return {
          id: 'assigned-1',
          name: 'Training Program',
          weeks: [{
            weekIndex: 1,
            days: [{
              id: 'day-1',
              date: '2026-04-20',
              workouts: [programWorkout],
            }],
          }],
        }
      },
    },
    workoutClient: {
      async getInProgressSessionByProgramWorkoutId(programWorkoutId) {
        calls.push(['getInProgressSessionByProgramWorkoutId', programWorkoutId])
        return null
      },
      async getInProgressSessionByAthleteId(athleteId) {
        calls.push(['getInProgressSessionByAthleteId', athleteId])
        return null
      },
      async getCompletedSessionsByAthleteId(athleteId) {
        calls.push(['getCompletedSessionsByAthleteId', athleteId])
        return []
      },
    },
    createTrainSessionStoreOverride({ currentAthleteId }) {
      calls.push(['createTrainSessionStore', currentAthleteId])
      return {
        async getProgramWorkout() {
          return programWorkout
        },
        async syncCurrentSession({ programWorkoutId }) {
          calls.push(['syncCurrentSession', currentAthleteId, programWorkoutId])
          return null
        },
        getCurrentSession() {
          return null
        },
      }
    },
  })

  assert.equal(bridge.trainState?.programWorkout?.athleteId, 'f8a72b19-c5c6-4da1-8793-27d80635a444')
  assert.deepEqual(calls, [
    ['createTrainSessionStore', 'f8a72b19-c5c6-4da1-8793-27d80635a444'],
    ['getAssignedProgramForAthlete', 'f8a72b19-c5c6-4da1-8793-27d80635a444'],
    ['getCompletedSessionsByAthleteId', 'f8a72b19-c5c6-4da1-8793-27d80635a444'],
    ['syncCurrentSession', 'f8a72b19-c5c6-4da1-8793-27d80635a444', 'program-workout-1'],
    ['getInProgressSessionByProgramWorkoutId', 'program-workout-1'],
    ['getInProgressSessionByAthleteId', 'f8a72b19-c5c6-4da1-8793-27d80635a444'],
  ])
})

test('hydrateCoachTrainBridge does not sync demo program workout ids when the assigned program has no workout today', async () => {
  const calls = []

  const bridge = await hydrateCoachTrainBridge({
    athleteId: 'coach-athlete-f8a72b19-c5c6-4da1-8793-27d80635a444',
    currentUserId: 'coach-1',
    accessToken: 'token',
    todayIsoDate: '2026-04-20',
    programClient: {
      async getAssignedProgramForAthlete() {
        return {
          id: 'assigned-1',
          name: 'Training Program',
          weeks: [{
            weekIndex: 1,
            days: [{
              id: 'day-1',
              date: '2026-04-20',
              workouts: [],
            }],
          }],
        }
      },
    },
    workoutClient: {
      async getInProgressSessionByProgramWorkoutId(programWorkoutId) {
        calls.push(['getInProgressSessionByProgramWorkoutId', programWorkoutId])
        return null
      },
      async getInProgressSessionByAthleteId(athleteId) {
        calls.push(['getInProgressSessionByAthleteId', athleteId])
        return null
      },
      async getCompletedSessionsByAthleteId() {
        return []
      },
    },
    createTrainSessionStoreOverride() {
      return {
        async getProgramWorkout() {
          return null
        },
        async syncCurrentSession({ programWorkoutId }) {
          calls.push(['syncCurrentSession', programWorkoutId])
          return null
        },
        getCurrentSession() {
          return null
        },
      }
    },
  })

  assert.equal(bridge.trainState?.programWorkout?.id || null, null)
  assert.equal(bridge.trainState?.session?.programWorkoutId || null, null)
  assert.equal(bridge.trainState?.session?.id || null, null)
  assert.deepEqual(calls, [
    ['syncCurrentSession', null],
    ['getInProgressSessionByAthleteId', 'f8a72b19-c5c6-4da1-8793-27d80635a444'],
  ])
})
