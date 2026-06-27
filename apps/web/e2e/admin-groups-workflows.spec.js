import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'
import { resolveWebBaseUrl } from './base-url.js'
import { assertDestructiveWorkflowSafety } from './destructive-workflow-safety.js'

export const ADMIN_GROUPS_CREATE_EDIT_DELETE_TEST_GROUP_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-groups-create-edit-delete-test-group',
  route: '/admin/athletes/groups',
  interaction: 'create-edit-delete-test-group-through-mocked-crud',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

const seededGroups = Object.freeze([
  {
    id: 'group-fixture-1',
    name: 'Off-season forwards',
    description: 'Summer development group for forwards.',
    athleteIds: ['athlete-fixture-1'],
    athletes: [
      { id: 'athlete-fixture-1', name: 'Alex Morgan', avatarUrl: '' },
    ],
    athleteCount: 1,
    athleteCountLabel: '1 athlete',
    access: 'Private',
    accessLevel: 'private',
    updated: 'Today',
    status: 'Active',
    statusValue: 'active',
  },
  {
    id: 'group-fixture-2',
    name: 'Goalie return-to-play',
    description: 'Archived goalie rehab group.',
    athleteIds: [],
    athletes: [],
    athleteCount: 0,
    athleteCountLabel: '0 athletes',
    access: 'Private',
    accessLevel: 'private',
    updated: 'Yesterday',
    status: 'Archived',
    statusValue: 'archived',
  },
])

const athleteOptions = Object.freeze([
  { id: 'athlete-fixture-1', name: 'Alex Morgan', avatarUrl: '' },
  { id: 'athlete-fixture-2', name: 'Jordan Lee', avatarUrl: '' },
])

const programOptions = Object.freeze([
  { id: 'program-fixture-1', name: 'Speed Foundation', workouts: 4 },
])

async function seedAdminBrowserSession(page) {
  const cookieUrl = resolveWebBaseUrl()
  await page.context().addCookies([
    {
      name: 'pplus_admin_access_token',
      value: 'browser-smoke-access-token',
      url: cookieUrl,
      httpOnly: true,
      sameSite: 'Lax',
    },
    {
      name: 'pplus_admin_refresh_token',
      value: 'browser-smoke-refresh-token',
      url: cookieUrl,
      httpOnly: true,
      sameSite: 'Lax',
    },
  ])
}

function buildGroupFromForm(requestBody, overrides = {}) {
  const athleteIds = Array.isArray(requestBody.athleteIds) ? requestBody.athleteIds : []
  const athletes = athleteOptions.filter((athlete) => athleteIds.includes(athlete.id))

  return {
    id: overrides.id ?? requestBody.groupId ?? 'group-created-fixture',
    name: requestBody.name,
    description: requestBody.description ?? '',
    athleteIds,
    athletes,
    athleteCount: athletes.length,
    athleteCountLabel: `${athletes.length} athlete${athletes.length === 1 ? '' : 's'}`,
    access: requestBody.accessLevel === 'public' ? 'Public' : 'Private',
    accessLevel: requestBody.accessLevel ?? 'private',
    updated: 'Just now',
    status: 'Active',
    statusValue: 'active',
  }
}

async function mockAdminGroupsShellData(page) {
  const state = {
    groups: [...seededGroups],
    createdGroupRequests: [],
    updatedGroupRequests: [],
    deletedGroupRequests: [],
  }

  assertDestructiveWorkflowSafety({
    workflowName: 'Admin Groups delete workflow',
    apiMocked: true,
    targetRecords: [{ id: 'group-created-fixture', name: 'Test Workflow Group' }],
  })

  await page.route('**/api/admin/groups**', async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      const requestBody = request.postDataJSON()
      state.createdGroupRequests.push(requestBody)

      expect(requestBody).toMatchObject({
        name: 'Test Workflow Group',
        description: 'Created by the safe browser workflow.',
        accessLevel: 'private',
      })

      const createdGroup = buildGroupFromForm(requestBody)
      state.groups = [...state.groups, createdGroup]

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ group: createdGroup }),
      })
      return
    }

    if (request.method() === 'PATCH') {
      const requestBody = request.postDataJSON()

      if (requestBody.action === 'update') {
        state.updatedGroupRequests.push(requestBody)

        expect(requestBody).toMatchObject({
          action: 'update',
          groupId: 'group-created-fixture',
          name: 'Updated Workflow Group',
          description: 'Edited by the safe browser workflow.',
          accessLevel: 'public',
        })

        const updatedGroup = buildGroupFromForm(requestBody)
        state.groups = state.groups.map((group) => (
          group.id === requestBody.groupId ? updatedGroup : group
        ))

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ group: updatedGroup }),
        })
        return
      }

      if (requestBody.action === 'delete') {
        state.deletedGroupRequests.push(requestBody)

        expect(requestBody).toEqual({
          action: 'delete',
          groupId: 'group-created-fixture',
        })

        state.groups = state.groups.filter((group) => group.id !== requestBody.groupId)

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ result: { deletedCount: 1 } }),
        })
        return
      }

      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: `Unhandled group workflow action: ${requestBody.action}` }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ groups: state.groups, athleteOptions, programOptions }),
    })
  })

  await page.route('**/admin/api/settings/profile', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ profile: { name: 'Anthony Fortugno', email: 'tonyfortugno22@gmail.com', avatarUrl: '' } }),
    })
  })

  return state
}

test.describe('Admin groups workflows', () => {
  test('Create/edit/delete test group', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const groupsApiState = await mockAdminGroupsShellData(page)

    await page.goto(ADMIN_GROUPS_CREATE_EDIT_DELETE_TEST_GROUP_WORKFLOW_CHECK.route, { waitUntil: 'domcontentloaded' })
    await assertCssLoaded(page, { route: ADMIN_GROUPS_CREATE_EDIT_DELETE_TEST_GROUP_WORKFLOW_CHECK.route })

    await expect(page.getByRole('heading', { name: 'Groups' })).toBeVisible()
    await expect(page.getByRole('row', { name: /Off-season forwards/ })).toBeVisible()

    await page.getByRole('button', { name: 'Create group' }).click()
    const createSheet = page.getByRole('dialog', { name: 'Create a group' })
    await expect(createSheet).toBeVisible()
    await createSheet.getByLabel('Name').fill('Test Workflow Group')
    await createSheet.getByLabel('Description').fill('Created by the safe browser workflow.')
    await createSheet.getByRole('button', { name: 'Create group' }).click()

    await expect(page.getByRole('dialog', { name: 'Create a group' })).toHaveCount(0)
    await expect(page.getByRole('row', { name: /Test Workflow Group/ })).toBeVisible()
    expect(groupsApiState.createdGroupRequests).toHaveLength(1)

    const createdGroupRow = page.getByRole('row', { name: /Test Workflow Group/ })
    await createdGroupRow.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()

    const editSheet = page.getByRole('dialog', { name: 'Edit group' })
    await expect(editSheet).toBeVisible()
    await expect(editSheet.getByLabel('Name')).toHaveValue('Test Workflow Group')
    await editSheet.getByLabel('Name').fill('Updated Workflow Group')
    await editSheet.getByLabel('Description').fill('Edited by the safe browser workflow.')
    await editSheet.getByLabel('Access').click()
    await page.getByRole('menuitem', { name: 'Public' }).click()
    await editSheet.getByRole('button', { name: 'Save changes' }).click()

    await expect(page.getByRole('dialog', { name: 'Edit group' })).toHaveCount(0)
    await expect(page.getByRole('row', { name: /Updated Workflow Group/ })).toBeVisible()
    await expect(page.getByRole('row', { name: /Test Workflow Group/ })).toHaveCount(0)
    expect(groupsApiState.updatedGroupRequests).toHaveLength(1)

    const updatedGroupRow = page.getByRole('row', { name: /Updated Workflow Group/ })
    await updatedGroupRow.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()

    let deleteDialog = page.getByRole('dialog', { name: 'Delete group' })
    await expect(deleteDialog).toBeVisible()
    await expect(deleteDialog.getByText('This group will be permanently deleted.')).toBeVisible()
    await deleteDialog.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByRole('dialog', { name: 'Delete group' })).toHaveCount(0)
    expect(groupsApiState.deletedGroupRequests).toEqual([])

    await updatedGroupRow.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()
    deleteDialog = page.getByRole('dialog', { name: 'Delete group' })
    await expect(deleteDialog).toBeVisible()
    await deleteDialog.getByRole('button', { name: 'Delete group' }).click()

    await expect(page.getByRole('dialog', { name: 'Delete group' })).toHaveCount(0)
    await expect(page.getByRole('row', { name: /Updated Workflow Group/ })).toHaveCount(0)
    expect(groupsApiState.deletedGroupRequests).toEqual([{ action: 'delete', groupId: 'group-created-fixture' }])
  })
})
