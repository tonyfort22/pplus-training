import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'
import { resolveWebBaseUrl } from './base-url.js'

export const ADMIN_ATHLETES_ROW_DETAIL_PATH_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-athletes-row-detail-path',
  route: '/admin/athletes',
  interaction: 'all-athletes-row-opens-selected-athlete-detail-path',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_ATHLETES_CREATE_TEST_ATHLETE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-athletes-create-test-athlete',
  route: '/admin/athletes',
  interaction: 'create-athlete-submits-mocked-post-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_ATHLETES_EDIT_TEST_ATHLETE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-athletes-edit-test-athlete',
  route: '/admin/athletes',
  interaction: 'edit-athlete-submits-mocked-patch-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_ATHLETES_INVITE_TEST_ATHLETE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-athletes-invite-test-athlete-safe-email',
  route: '/admin/athletes',
  interaction: 'invite-athlete-submits-mocked-invite-post-with-safe-email',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_ATHLETES_EXPORT_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-athletes-export-csv-review-download',
  route: '/admin/athletes',
  interaction: 'export-athletes-opens-review-sheet-and-downloads-csv',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_ATHLETES_BULK_ACTION_ZERO_SELECTION_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-athletes-bulk-action-zero-selection-guard',
  route: '/admin/athletes',
  interaction: 'bulk-actions-stays-disabled-and-closed-with-zero-selected-athletes',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

const SAFE_INVITE_EMAIL = 'pplus.safe+invite.workflow@example.com'

const seededAthletes = Object.freeze([
  {
    id: 'athlete-fixture-1',
    name: 'Alex Morgan',
    fullName: 'Alex Morgan',
    firstName: 'Alex',
    lastName: 'Morgan',
    shortcutCode: 'AM',
    avatarUrl: '',
    dateOfBirth: '2010-04-12',
    program: 'Speed Foundation',
    workoutsCompleted: 4,
    workoutsTarget: 8,
    workoutsPercentage: 50,
    lastActive: 'Today',
    status: 'Active',
    hasInvite: false,
    email: 'alex.fixture@example.com',
  },
  {
    id: 'athlete-fixture-2',
    name: 'Jordan Lee',
    fullName: 'Jordan Lee',
    firstName: 'Jordan',
    lastName: 'Lee',
    shortcutCode: 'JL',
    avatarUrl: '',
    dateOfBirth: '2011-09-22',
    program: 'Strength Block',
    workoutsCompleted: 2,
    workoutsTarget: 5,
    workoutsPercentage: 40,
    lastActive: 'Yesterday',
    status: 'Inactive',
    hasInvite: true,
    email: 'jordan.fixture@example.com',
  },
  {
    id: 'athlete-fixture-3',
    name: 'Casey Stone',
    fullName: 'Casey Stone',
    firstName: 'Casey',
    lastName: 'Stone',
    shortcutCode: 'CS',
    avatarUrl: '',
    dateOfBirth: '2012-02-08',
    program: 'Invite Later',
    workoutsCompleted: 0,
    workoutsTarget: 4,
    workoutsPercentage: 0,
    lastActive: 'Not started',
    status: 'Inactive',
    hasInvite: false,
    email: '',
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

async function mockAdminAthleteShellData(page, options = {}) {
  const state = {
    athletes: [...(options.athletes ?? seededAthletes)],
    createdAthleteRequests: [],
    updatedAthleteRequests: [],
    sentInviteRequests: [],
  }

  await page.route('**/api/admin/athletes', async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      const requestBody = request.postDataJSON()
      state.createdAthleteRequests.push(requestBody)

      expect(requestBody).toMatchObject({
        firstName: 'Testy',
        lastName: 'McAthlete',
        inviteeEmail: 'testy.mcathlete+workflow@example.com',
        sendInvite: true,
      })

      const createdAthlete = {
        id: 'athlete-created-fixture',
        name: 'Testy McAthlete',
        fullName: 'Testy McAthlete',
        firstName: 'Testy',
        lastName: 'McAthlete',
        shortcutCode: 'TM',
        avatarUrl: '',
        dateOfBirth: '',
        program: '-',
        workoutsCompleted: 0,
        workoutsTarget: 0,
        workoutsPercentage: 0,
        lastActive: 'Not started',
        status: 'Inactive',
        hasInvite: true,
        email: 'testy.mcathlete+workflow@example.com',
        inviteeEmail: 'testy.mcathlete+workflow@example.com',
      }

      state.athletes = [...state.athletes, createdAthlete]

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ athlete: createdAthlete }),
      })
      return
    }

    if (request.method() === 'PATCH') {
      const requestBody = request.postDataJSON()
      state.updatedAthleteRequests.push(requestBody)

      expect(requestBody).toMatchObject({
        athleteId: 'athlete-fixture-1',
        firstName: 'Alex',
        lastName: 'Updated',
        sendInvite: false,
      })

      const currentAthlete = state.athletes.find((athlete) => athlete.id === requestBody.athleteId)
      const updatedAthlete = {
        ...currentAthlete,
        ...requestBody,
        id: requestBody.athleteId,
        name: 'Alex Updated',
        fullName: 'Alex Updated',
        shortcutCode: 'AU',
        email: currentAthlete?.email ?? '',
        hasInvite: currentAthlete?.hasInvite ?? false,
        status: currentAthlete?.status ?? 'Active',
        program: currentAthlete?.program ?? '-',
        lastActive: currentAthlete?.lastActive ?? 'Today',
        workoutsCompleted: currentAthlete?.workoutsCompleted ?? 0,
        workoutsTarget: currentAthlete?.workoutsTarget ?? 0,
        workoutsPercentage: currentAthlete?.workoutsPercentage ?? 0,
      }

      state.athletes = state.athletes.map((athlete) => (
        athlete.id === requestBody.athleteId ? updatedAthlete : athlete
      ))

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ athlete: updatedAthlete }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ athletes: state.athletes }),
    })
  })

  await page.route('**/api/admin/invites', async (route) => {
    const request = route.request()

    if (request.method() !== 'POST') {
      await route.fulfill({
        status: 405,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Method not allowed' }),
      })
      return
    }

    const requestBody = request.postDataJSON()
    state.sentInviteRequests.push(requestBody)

    expect(requestBody).toMatchObject({
      athleteId: 'athlete-fixture-3',
      inviteeEmail: SAFE_INVITE_EMAIL,
    })

    const invitedAthlete = state.athletes.find((athlete) => athlete.id === requestBody.athleteId)
    const updatedAthlete = {
      ...invitedAthlete,
      hasInvite: true,
      email: requestBody.inviteeEmail,
      inviteeEmail: requestBody.inviteeEmail,
    }

    state.athletes = state.athletes.map((athlete) => (
      athlete.id === requestBody.athleteId ? updatedAthlete : athlete
    ))

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ athlete: updatedAthlete }),
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

test.describe('Admin athletes workflows', () => {
  test('All Athletes table opens expected row/detail path', async ({ page }) => {
    await seedAdminBrowserSession(page)
    await mockAdminAthleteShellData(page)

    await page.goto(`${ADMIN_ATHLETES_ROW_DETAIL_PATH_WORKFLOW_CHECK.route}?athleteId=athlete-fixture-1`, { waitUntil: 'domcontentloaded' })
    await assertCssLoaded(page, { route: ADMIN_ATHLETES_ROW_DETAIL_PATH_WORKFLOW_CHECK.route })

    await expect(page.getByRole('heading', { name: 'All Athletes' })).toBeVisible()
    await expect(page.locator('.admin-dashboard-sidebar-switcher').getByText('Alex Morgan')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open athlete detail for Jordan Lee' })).toBeVisible()

    await page.getByRole('button', { name: 'Open athlete detail for Jordan Lee' }).click()

    await expect(page).toHaveURL(/\/admin\/athletes\?athleteId=athlete-fixture-2/)
    await expect(page.locator('.admin-dashboard-sidebar-switcher').getByText('Jordan Lee')).toBeVisible()
    await expect(page.locator('.admin-dashboard-sidebar-switcher').getByText('Alex Morgan')).toHaveCount(0)
  })

  test('Create test athlete', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const athleteApiState = await mockAdminAthleteShellData(page)

    await page.goto(ADMIN_ATHLETES_CREATE_TEST_ATHLETE_WORKFLOW_CHECK.route, { waitUntil: 'domcontentloaded' })
    await assertCssLoaded(page, { route: ADMIN_ATHLETES_CREATE_TEST_ATHLETE_WORKFLOW_CHECK.route })

    await expect(page.getByRole('heading', { name: 'All Athletes' })).toBeVisible()
    await page.getByRole('button', { name: 'Create athlete' }).click()

    await expect(page.getByRole('heading', { name: 'Create athlete profile' })).toBeVisible()
    await page.getByLabel('First name').fill('Testy')
    await page.getByLabel('Last name').fill('McAthlete')
    await page.getByLabel('Email').fill('testy.mcathlete+workflow@example.com')

    await page.locator('.admin-shell-athletes-create-submit').click()

    await expect(page.getByText('Invitation sent')).toBeVisible()
    await expect(page.getByText('Created a pending athlete account for testy.mcathlete+workflow@example.com and sent the invite.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create athlete profile' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Open athlete detail for Testy McAthlete' })).toBeVisible()
    expect(athleteApiState.createdAthleteRequests).toHaveLength(1)
  })

  test('Edit test athlete', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const athleteApiState = await mockAdminAthleteShellData(page)

    await page.goto(ADMIN_ATHLETES_EDIT_TEST_ATHLETE_WORKFLOW_CHECK.route, { waitUntil: 'domcontentloaded' })
    await assertCssLoaded(page, { route: ADMIN_ATHLETES_EDIT_TEST_ATHLETE_WORKFLOW_CHECK.route })

    await expect(page.getByRole('heading', { name: 'All Athletes' })).toBeVisible()
    const alexRow = page.getByRole('row', { name: /Alex Morgan/ })
    await alexRow.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()

    await expect(page.getByRole('heading', { name: 'Edit athlete profile' })).toBeVisible()
    await expect(page.getByLabel('First name')).toHaveValue('Alex')
    await page.getByLabel('Last name').fill('Updated')

    await page.locator('.admin-shell-athletes-create-submit').click()

    await expect(page.getByText('Athlete updated')).toBeVisible()
    await expect(page.getByText('Changes saved for Alex Updated.')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Edit athlete profile' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Open athlete detail for Alex Updated' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open athlete detail for Alex Morgan' })).toHaveCount(0)
    expect(athleteApiState.updatedAthleteRequests).toHaveLength(1)
  })

  test('Invite test athlete with safe email fixture', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const athleteApiState = await mockAdminAthleteShellData(page)

    await page.goto(ADMIN_ATHLETES_INVITE_TEST_ATHLETE_WORKFLOW_CHECK.route, { waitUntil: 'domcontentloaded' })
    await assertCssLoaded(page, { route: ADMIN_ATHLETES_INVITE_TEST_ATHLETE_WORKFLOW_CHECK.route })

    await expect(page.getByRole('heading', { name: 'All Athletes' })).toBeVisible()
    const caseyRow = page.getByRole('row', { name: /Casey Stone/ })
    await caseyRow.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('menuitem', { name: 'Send invite' }).click()

    await expect(page.getByRole('heading', { name: 'Invite an athlete' })).toBeVisible()
    await expect(page.getByText('Bring a coach-managed athlete into the workspace for Casey Stone.')).toBeVisible()
    await page.getByLabel('Email address').fill(SAFE_INVITE_EMAIL)

    await page.getByRole('button', { name: 'Send invite' }).click()

    await expect(page.getByText('Invitation sent')).toBeVisible()
    await expect(page.getByText(`Sent an athlete invitation for ${SAFE_INVITE_EMAIL}.`)).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Invite an athlete' })).toHaveCount(0)
    expect(athleteApiState.sentInviteRequests).toEqual([
      { athleteId: 'athlete-fixture-3', inviteeEmail: SAFE_INVITE_EMAIL },
    ])
  })

  test('Bulk action zero-selection guard', async ({ page }) => {
    await seedAdminBrowserSession(page)
    await mockAdminAthleteShellData(page)

    await page.goto(ADMIN_ATHLETES_BULK_ACTION_ZERO_SELECTION_WORKFLOW_CHECK.route, { waitUntil: 'domcontentloaded' })
    await assertCssLoaded(page, { route: ADMIN_ATHLETES_BULK_ACTION_ZERO_SELECTION_WORKFLOW_CHECK.route })

    await expect(page.getByRole('heading', { name: 'All Athletes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open athlete detail for Alex Morgan' })).toBeVisible()

    const bulkActionsButton = page.getByRole('button', { name: 'Bulk actions' })
    await expect(bulkActionsButton).toBeVisible()
    await expect(bulkActionsButton).toBeDisabled()
    await expect(bulkActionsButton).toHaveAttribute('aria-disabled', 'true')
    await bulkActionsButton.click({ force: true })
    await expect(page.getByRole('menuitem', { name: 'Export' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Export athletes' })).toHaveCount(0)
  })

  test('Export athletes CSV review/download path', async ({ page }) => {
    await seedAdminBrowserSession(page)
    await mockAdminAthleteShellData(page)

    await page.goto(ADMIN_ATHLETES_EXPORT_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK.route, { waitUntil: 'domcontentloaded' })
    await assertCssLoaded(page, { route: ADMIN_ATHLETES_EXPORT_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK.route })

    await expect(page.getByRole('heading', { name: 'All Athletes' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Open athlete detail for Alex Morgan' })).toBeVisible()
    await page.locator('.admin-shell-athletes-checkbox-input').nth(1).click()
    await page.locator('.admin-shell-athletes-checkbox-input').nth(2).click()
    await page.locator('.admin-shell-athletes-checkbox-input').nth(3).click()
    await page.getByRole('button', { name: 'Bulk actions' }).click()
    await page.getByRole('menuitem', { name: 'Export' }).click()

    await expect(page.getByRole('heading', { name: 'Export athletes' })).toBeVisible()
    await expect(page.getByText('Review the selected athletes before downloading a CSV export.')).toBeVisible()
    await expect(page.getByText('Selected athletes preview')).toBeVisible()
    const exportSheet = page.getByLabel('Export athletes')
    await expect(exportSheet.getByText('Alex Morgan')).toBeVisible()
    await expect(exportSheet.getByText('Jordan Lee')).toBeVisible()
    await expect(exportSheet.getByText('Casey Stone')).toBeVisible()
    await expect(page.getByText(/pplus-athletes-export-\d{4}-\d{2}-\d{2}\.csv/)).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Download CSV' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/^pplus-athletes-export-\d{4}-\d{2}-\d{2}\.csv$/)
    await expect(page.getByText('Athletes export ready')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Export athletes' })).toHaveCount(0)
  })
})
