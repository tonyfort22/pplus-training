import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'
import { resolveWebBaseUrl } from './base-url.js'
import { assertDestructiveWorkflowSafety } from './destructive-workflow-safety.js'

export const ADMIN_INVITES_REVOKE_TEST_INVITE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-invites-revoke-test-invite-through-confirmation',
  route: '/admin/athletes/invites',
  interaction: 'revoke-test-invite-submits-mocked-patch-through-confirmation',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

const seededInvites = Object.freeze([
  {
    id: 'invite-cancel-fixture',
    athleteProfileId: 'athlete-cancel-fixture',
    name: 'Thomas Thibault',
    email: 'thomas.cancel.workflow@example.com',
    role: 'Athlete',
    sent: 'Today',
    status: 'Pending',
    createdAt: '2026-06-22T14:00:00.000Z',
    expiresAt: '2026-06-29T14:00:00.000Z',
    usedAt: null,
    revokedAt: null,
  },
  {
    id: 'invite-accepted-fixture',
    athleteProfileId: 'athlete-accepted-fixture',
    name: 'Maya Singh',
    email: 'maya.accepted.workflow@example.com',
    role: 'Athlete',
    sent: 'Yesterday',
    status: 'Accepted',
    createdAt: '2026-06-21T14:00:00.000Z',
    expiresAt: '2026-06-28T14:00:00.000Z',
    usedAt: '2026-06-21T15:00:00.000Z',
    revokedAt: null,
  },
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

async function mockAdminInvitesShellData(page) {
  const state = {
    invites: [...seededInvites],
    canceledInviteRequests: [],
  }

  assertDestructiveWorkflowSafety({
    workflowName: 'Admin Invites cancel workflow',
    apiMocked: true,
    targetRecords: [{ id: 'invite-cancel-fixture', email: 'thomas.cancel.workflow@example.com' }],
  })

  await page.route('**/api/admin/invites**', async (route) => {
    const request = route.request()

    if (request.method() === 'PATCH') {
      const requestBody = request.postDataJSON()
      state.canceledInviteRequests.push(requestBody)

      expect(requestBody).toEqual({ inviteId: 'invite-cancel-fixture' })

      const currentInvite = state.invites.find((invite) => invite.id === requestBody.inviteId)
      const canceledInvite = {
        ...currentInvite,
        status: 'Canceled',
        revokedAt: '2026-06-22T15:00:00.000Z',
      }

      state.invites = state.invites.map((invite) => (
        invite.id === requestBody.inviteId ? canceledInvite : invite
      ))

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ invite: canceledInvite }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ invites: state.invites }),
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

test.describe('Admin invites workflows', () => {
  test('Revoke/cancel test invite through confirmation', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const invitesApiState = await mockAdminInvitesShellData(page)

    await page.goto(ADMIN_INVITES_REVOKE_TEST_INVITE_WORKFLOW_CHECK.route, { waitUntil: 'domcontentloaded' })
    await assertCssLoaded(page, { route: ADMIN_INVITES_REVOKE_TEST_INVITE_WORKFLOW_CHECK.route })

    await expect(page.getByRole('heading', { name: 'Invites' })).toBeVisible()
    const thomasRow = page.getByRole('row', { name: /Thomas Thibault/ })
    await expect(thomasRow).toBeVisible()

    await thomasRow.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('menuitem', { name: 'Cancel invite' }).click()

    let cancelDialog = page.getByRole('dialog', { name: 'Cancel invite' })
    await expect(cancelDialog).toBeVisible()
    await expect(cancelDialog.getByText('This invite link will be revoked')).toBeVisible()
    await expect(cancelDialog.getByText('Thomas Thibault')).toBeVisible()
    await cancelDialog.getByRole('button', { name: 'Keep invite' }).click()
    await expect(cancelDialog).toHaveCount(0)
    expect(invitesApiState.canceledInviteRequests).toEqual([])

    await thomasRow.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('menuitem', { name: 'Cancel invite' }).click()

    cancelDialog = page.getByRole('dialog', { name: 'Cancel invite' })
    await expect(cancelDialog).toBeVisible()
    await cancelDialog.getByRole('button', { name: 'Cancel invite' }).click()

    await expect(page.getByText('Invite canceled')).toBeVisible()
    await expect(page.getByText('This athlete invitation was revoked.')).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Cancel invite' })).toHaveCount(0)
    await expect(page.getByRole('row', { name: /Thomas Thibault/ }).getByText('Canceled')).toBeVisible()
    expect(invitesApiState.canceledInviteRequests).toEqual([{ inviteId: 'invite-cancel-fixture' }])
  })
})
