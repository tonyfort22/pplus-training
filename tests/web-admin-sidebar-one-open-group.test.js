import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getActiveExpandableAdminGroupId,
  getNextExpandedAdminGroupId,
} from '../apps/web/components/admin/admin-navigation.js'

test('admin sidebar one-open behavior expands the active route group by default', () => {
  assert.equal(getActiveExpandableAdminGroupId('/admin/athletes/groups'), 'athletes')
  assert.equal(getActiveExpandableAdminGroupId('/admin/workouts/calendar?athleteId=athlete-1'), 'workouts')
  assert.equal(getActiveExpandableAdminGroupId('/admin/settings/account#security'), 'settings')
})

test('admin sidebar one-open behavior ignores leaf-only groups for expansion', () => {
  assert.equal(getActiveExpandableAdminGroupId('/admin/dashboard'), null)
  assert.equal(getActiveExpandableAdminGroupId('/admin/support'), null)
  assert.equal(getActiveExpandableAdminGroupId('/admin/unknown'), null)
})

test('admin sidebar one-open behavior replaces the open group when another group opens', () => {
  assert.equal(getNextExpandedAdminGroupId('athletes', 'workouts', true), 'workouts')
  assert.equal(getNextExpandedAdminGroupId('workouts', 'settings', true), 'settings')
})

test('admin sidebar one-open behavior only closes the group that toggled closed', () => {
  assert.equal(getNextExpandedAdminGroupId('workouts', 'workouts', false), null)
  assert.equal(getNextExpandedAdminGroupId('settings', 'workouts', false), 'settings')
})
