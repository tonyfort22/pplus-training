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
