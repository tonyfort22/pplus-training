import test from 'node:test'
import assert from 'node:assert/strict'
import { getAuthScreenModel } from '../apps/mobile/src/auth/auth-screen-models.js'

test('getAuthScreenModel builds the sign-in surface by default', () => {
  const model = getAuthScreenModel()

  assert.equal(model.type, 'auth')
  assert.equal(model.roleOptions.length, 2)
  assert.equal(model.roleOptions[0].id, 'athlete')
  assert.equal(model.roleOptions[1].id, 'coach')
  assert.equal(model.selectedRoleId, 'athlete')
  assert.equal(model.fields.length, 2)
  assert.equal(model.fields[0].id, 'email')
  assert.match(model.header.title, /welcome back athlete/i)
  assert.equal(model.submitLabel, 'Sign in')
})

test('getAuthScreenModel builds the sign-up surface with role selection and the extra profile fields', () => {
  const model = getAuthScreenModel({
    mode: 'sign_up',
    isSubmitting: true,
    errorMessage: 'Nope',
    noticeMessage: 'Check your email',
    values: { firstName: 'Thomas', email: 'athlete@pplus.app', role: 'coach' },
  })

  assert.equal(model.selectedRoleId, 'coach')
  assert.match(model.header.title, /coach account/i)
  assert.equal(model.fields.length, 5)
  assert.equal(model.fields[0].value, 'Thomas')
  assert.equal(model.errorMessage, 'Nope')
  assert.equal(model.noticeMessage, 'Check your email')
  assert.equal(model.submitLabel, 'Creating account...')
})

test('getAuthScreenModel adds a coach email linkage field for athlete sign-up only', () => {
  const athleteModel = getAuthScreenModel({
    mode: 'sign_up',
    values: { role: 'athlete', coachEmail: 'coach@pplus.app' },
  })
  const coachModel = getAuthScreenModel({
    mode: 'sign_up',
    values: { role: 'coach' },
  })

  assert.equal(athleteModel.fields.length, 6)
  assert.equal(athleteModel.fields[2].id, 'coachEmail')
  assert.match(athleteModel.fields[2].label, /coach email/i)
  assert.equal(athleteModel.fields[2].value, 'coach@pplus.app')
  assert.equal(coachModel.fields.some((field) => field.id === 'coachEmail'), false)
})

test('getAuthScreenModel builds the forgot-password surface with reset copy', () => {
  const model = getAuthScreenModel({
    mode: 'forgot_password',
    isSubmitting: true,
    values: { email: 'athlete@pplus.app' },
  })

  assert.equal(model.header.title, 'Reset your password')
  assert.equal(model.fields.length, 1)
  assert.equal(model.fields[0].id, 'email')
  assert.equal(model.submitLabel, 'Sending reset link...')
  assert.equal(model.helperLabel, 'Back to sign in')
  assert.equal(model.secondaryActionLabel, null)
})

test('getAuthScreenModel marks auth controls disabled while a request is submitting', () => {
  const model = getAuthScreenModel({
    mode: 'sign_in',
    isSubmitting: true,
    noticeMessage: 'Signed out. Sign back in when you are ready.',
  })

  assert.equal(model.submitDisabled, true)
  assert.equal(model.noticeMessage, 'Signed out. Sign back in when you are ready.')
  assert.equal(model.roleOptions.every((option) => option.isDisabled === true), true)
  assert.equal(model.fields.every((field) => field.isDisabled === true), true)
  assert.equal(model.helperDisabled, true)
  assert.equal(model.secondaryActionDisabled, true)
})
