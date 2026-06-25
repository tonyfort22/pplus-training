import test from 'node:test'
import assert from 'node:assert/strict'

import {
  adminBottomNavigation,
  adminNavigation,
  getAdminRouteState,
  isAdminRouteActive,
  normalizeAdminPath,
} from '../apps/web/components/admin/admin-navigation.js'

const allGroups = [...adminNavigation, ...adminBottomNavigation]
const groupById = new Map(allGroups.map((group) => [group.id, group]))

function activeState(groupId, currentPath) {
  return getAdminRouteState(groupById.get(groupId), currentPath)
}

test('admin active route selection normalizes query strings hashes and trailing slashes', () => {
  assert.equal(normalizeAdminPath('/admin/workouts/calendar?athleteId=athlete-1'), '/admin/workouts/calendar')
  assert.equal(normalizeAdminPath('/admin/settings/account#security'), '/admin/settings/account')
  assert.equal(normalizeAdminPath('/admin/programs/'), '/admin/programs')
  assert.equal(normalizeAdminPath(''), '')
})

test('admin active route selection treats configured parent routes as active for deeper admin paths', () => {
  assert.equal(isAdminRouteActive('/admin/programs/program-1', '/admin/programs'), true)
  assert.equal(isAdminRouteActive('/admin/workouts/calendar?athleteId=athlete-1', '/admin/workouts/calendar'), true)
  assert.equal(isAdminRouteActive('/admin/settings/account/security', '/admin/settings/account'), true)
  assert.equal(isAdminRouteActive('/admin/athleteship', '/admin/athletes'), false)
  assert.equal(isAdminRouteActive('/admin/support', '/admin/support'), true)
})

test('admin active route selection resolves the active sidebar group without lighting unrelated groups', () => {
  const programsState = activeState('programs', '/admin/programs/program-1')
  const athletesState = activeState('athletes', '/admin/programs/program-1')

  assert.equal(programsState.groupHref, '/admin/programs')
  assert.equal(programsState.isActive, true)
  assert.equal(programsState.currentItem.id, 'programs-library')
  assert.equal(athletesState.isActive, false)
  assert.equal(athletesState.currentItem, null)
})

test('admin active route selection picks the deepest configured child item for nested paths', () => {
  const calendarState = activeState('workouts', '/admin/workouts/calendar?athleteId=athlete-1')
  const settingsState = activeState('settings', '/admin/settings/account/security')
  const supportState = activeState('support', '/admin/support')

  assert.equal(calendarState.isActive, true)
  assert.equal(calendarState.hasActiveChild, true)
  assert.equal(calendarState.currentItem.id, 'workouts-calendar')

  assert.equal(settingsState.isActive, true)
  assert.equal(settingsState.hasActiveChild, true)
  assert.equal(settingsState.currentItem.id, 'settings-account')

  assert.equal(supportState.isActive, true)
  assert.equal(supportState.hasActiveChild, false)
  assert.equal(supportState.currentItem.id, 'support')
})
