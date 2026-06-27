import test from 'node:test'
import assert from 'node:assert/strict'

import {
  adminBottomNavigation,
  adminNavigation,
  buildAdminPath,
  findAdminRoute,
} from '../apps/web/components/admin/admin-navigation.js'

const expectedTopRoutes = [
  { id: 'dashboard', label: 'Dashboard', icon: 'house', href: '/admin/dashboard' },
  { id: 'athletes', label: 'Athletes', icon: 'users', href: '/admin/athletes' },
  { id: 'programs', label: 'Programs', icon: 'calendar-range', href: '/admin/programs' },
  { id: 'workouts', label: 'Workouts', icon: 'dumbbell', href: '/admin/workouts' },
  { id: 'exercises', label: 'Exercises', icon: 'footprints', href: '/admin/exercises' },
  { id: 'support', label: 'Support', icon: 'message-circle', href: '/admin/support' },
]

const expectedChildRoutes = new Map([
  ['athletes', ['/admin/athletes', '/admin/athletes/invites', '/admin/athletes/groups', '/admin/athletes/rankings']],
  ['programs', ['/admin/programs']],
  ['workouts', ['/admin/workouts', '/admin/workouts/calendar']],
  ['exercises', ['/admin/exercises']],
  ['settings', ['/admin/settings', '/admin/settings/account']],
])

function flattenNavigation(groups) {
  return groups.flatMap((group) => [group, ...(group.items || [])])
}

test('admin sidebar route config keeps the approved top and bottom route groups stable', () => {
  assert.equal(Object.isFrozen(adminNavigation), true, 'top admin navigation should be immutable')
  assert.equal(Object.isFrozen(adminBottomNavigation), true, 'bottom admin navigation should be immutable')

  assert.deepEqual(
    adminNavigation.map(({ id, label, icon, href }) => ({ id, label, icon, href })),
    expectedTopRoutes,
  )

  assert.deepEqual(
    adminBottomNavigation.map(({ id, label, icon, href }) => ({ id, label, icon, href })),
    [{ id: 'settings', label: 'Settings', icon: 'settings', href: '/admin/settings' }],
  )

  for (const group of [...adminNavigation, ...adminBottomNavigation]) {
    assert.equal(group.defaultHref, group.href, `${group.id} defaultHref should match href`)
    assert.equal(typeof group.title, 'string', `${group.id} should expose a page title`)
    assert.equal(typeof group.description, 'string', `${group.id} should expose a page description`)
    assert.equal(Object.isFrozen(group), true, `${group.id} group should be immutable`)

    for (const item of group.items || []) {
      assert.equal(typeof item.title, 'string', `${item.id} should expose a page title`)
      assert.equal(typeof item.description, 'string', `${item.id} should expose a page description`)
      assert.equal(Object.isFrozen(item), true, `${item.id} item should be immutable`)
    }
  }

  assert.equal(adminNavigation.find((group) => group.id === 'support').external, true, 'Support should remain an external admin tab')
})

test('admin sidebar route config maps every nested item to a real admin route contract', () => {
  const allGroups = [...adminNavigation, ...adminBottomNavigation]
  const allEntries = flattenNavigation(allGroups)
  const ids = allEntries.map((entry) => entry.id)
  const hrefs = allEntries.map((entry) => entry.href)

  assert.equal(new Set(ids).size, ids.length, 'sidebar route ids should be unique')
  assert.equal(hrefs.every((href) => href.startsWith('/admin/')), true, 'sidebar hrefs should stay inside admin routes')

  for (const group of allGroups) {
    const expectedRoutes = expectedChildRoutes.get(group.id)
    if (!expectedRoutes) {
      assert.equal(group.items, undefined, `${group.id} should not expose unexpected nested items`)
      continue
    }

    assert.deepEqual(group.items.map((item) => item.href), expectedRoutes, `${group.id} children should match approved route order`)
  }
})

test('admin sidebar route resolver returns the active group and item for every configured route', () => {
  for (const group of [...adminNavigation, ...adminBottomNavigation]) {
    const groupRoute = findAdminRoute(group.href)
    assert.equal(groupRoute.currentGroup.id, group.id, `${group.href} should resolve its group`)
    assert.equal(groupRoute.currentItem.href, group.items?.[0]?.href || group.href, `${group.href} should resolve its default item`)

    for (const item of group.items || []) {
      const itemRoute = findAdminRoute(item.href)
      assert.equal(itemRoute.currentGroup.id, group.id, `${item.href} should resolve parent group ${group.id}`)
      assert.equal(itemRoute.currentItem.id, item.id, `${item.href} should resolve item ${item.id}`)
    }
  }

  assert.equal(findAdminRoute('/admin/not-a-real-section'), null)
  assert.equal(buildAdminPath('workouts'), '/admin/workouts')
  assert.equal(buildAdminPath('workouts', 'calendar'), '/admin/workouts/calendar')
})
