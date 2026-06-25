import { expect } from '@playwright/test'

export const SAFE_RECORD_FIXTURE_ENV = Object.freeze({
  coachId: 'PPLUS_WEB_SAFE_COACH_ID',
  athleteId: 'PPLUS_WEB_SAFE_ATHLETE_ID',
  groupId: 'PPLUS_WEB_SAFE_GROUP_ID',
  exerciseId: 'PPLUS_WEB_SAFE_EXERCISE_ID',
  workoutTemplateId: 'PPLUS_WEB_SAFE_WORKOUT_TEMPLATE_ID',
  programId: 'PPLUS_WEB_SAFE_PROGRAM_ID',
})

export function readSafeRecordFixtureIds(env = process.env, options = {}) {
  const fixtureEnv = options.fixtureEnv ?? SAFE_RECORD_FIXTURE_ENV

  return Object.freeze(Object.fromEntries(
    Object.entries(fixtureEnv).map(([key, envName]) => [key, String(env?.[envName] || '').trim()]),
  ))
}

export function requireSafeRecordFixtureId(key, env = process.env, options = {}) {
  const fixtureEnv = options.fixtureEnv ?? SAFE_RECORD_FIXTURE_ENV
  const envName = fixtureEnv[key]

  expect(envName, `unknown safe fixture record key: ${key}`).toBeTruthy()

  const fixtureIds = readSafeRecordFixtureIds(env, { fixtureEnv })
  const fixtureId = fixtureIds[key]

  expect(
    fixtureId,
    `set ${envName} to a dedicated safe fixture record ID before running browser smoke tests that mutate or inspect ${key}`,
  ).toBeTruthy()

  return fixtureId
}
