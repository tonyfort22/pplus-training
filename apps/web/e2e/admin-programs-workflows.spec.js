import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'
import { resolveWebBaseUrl } from './base-url.js'
import { assertDestructiveWorkflowSafety } from './destructive-workflow-safety.js'


export const ADMIN_PROGRAMS_OPEN_DETAIL_PLANNER_ROUTE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-programs-open-detail-planner-route',
  route: '/admin/programs',
  interaction: 'open-program-detail-planner-route-from-program-name',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_PROGRAMS_CREATE_UNASSIGNED_TEST_PROGRAM_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-programs-create-unassigned-test-program',
  route: '/admin/programs',
  interaction: 'create-unassigned-program-submits-mocked-post-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_PROGRAMS_EDIT_TEST_PROGRAM_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-programs-edit-test-program',
  route: '/admin/programs',
  interaction: 'edit-test-program-submits-mocked-patch-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_PROGRAMS_ASSIGN_TEST_PROGRAM_TO_TEST_ATHLETE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-programs-assign-test-program-to-test-athlete',
  route: '/admin/programs',
  interaction: 'assign-test-program-submits-mocked-assign-athletes-patch-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_PROGRAMS_DUPLICATE_TEST_PROGRAM_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-programs-duplicate-test-program',
  route: '/admin/programs',
  interaction: 'duplicate-test-program-submits-mocked-duplicate-post-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_PROGRAMS_EXPORT_SELECTED_PROGRAMS_CSV_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-programs-export-selected-programs-csv',
  route: '/admin/programs',
  interaction: 'export-selected-programs-reviews-and-downloads-csv',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_PROGRAMS_ARCHIVE_TEST_PROGRAM_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-programs-archive-test-program-through-confirmation',
  route: '/admin/programs',
  interaction: 'archive-test-program-confirms-mocked-patch-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_PROGRAMS_DELETE_TEST_PROGRAM_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-programs-delete-test-program-through-confirmation',
  route: '/admin/programs',
  interaction: 'delete-test-program-confirms-mocked-delete-and-removes-row',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

const seededPrograms = Object.freeze([
  {
    id: 'program-1',
    athleteId: 'athlete-fixture-1',
    coachId: 'coach-fixture-1',
    programType: 'Assigned',
    name: 'Summer strength block',
    athletesLabel: '8 athletes',
    athleteIds: ['athlete-fixture-1', 'athlete-fixture-2'],
    assignedAthleteIds: ['athlete-fixture-1', 'athlete-fixture-2'],
    duration: '8 weeks',
    weekCount: 8,
    workouts: 4,
    exercises: 16,
    startDate: '2026-06-24',
    endDate: '2026-08-18',
    startDateLabel: 'Jun 24',
    endDateLabel: 'Aug 18',
    status: 'Active',
    statusValue: 'active',
    createdDate: '2026-06-10',
    createdAt: '2026-06-10T14:00:00.000Z',
    description: 'Off-season hypertrophy and speed prep.',
  },
  {
    id: 'program-edit-fixture',
    athleteId: null,
    coachId: 'coach-fixture-1',
    programType: 'Unassigned',
    name: 'Test Editable Program',
    athletesLabel: 'Unassigned',
    athleteIds: [],
    assignedAthleteIds: [],
    duration: '4 weeks',
    weekCount: 4,
    workouts: 2,
    exercises: 8,
    startDate: '2026-07-08',
    endDate: '2026-08-04',
    startDateLabel: 'Jul 8',
    endDateLabel: 'Aug 4',
    status: 'Active',
    statusValue: 'active',
    createdDate: '2026-06-11',
    createdAt: '2026-06-11T14:00:00.000Z',
    description: 'Safe editable program fixture.',
  },
  {
    id: 'program-assign-fixture',
    name: 'Test Assignable Program',
    athletesLabel: 'Unassigned',
    athleteIds: [],
    assignedAthleteIds: [],
    duration: '3 weeks',
    weekCount: 3,
    workouts: 3,
    exercises: 9,
    startDate: '2026-07-15',
    endDate: '2026-08-05',
    startDateLabel: 'Jul 15',
    endDateLabel: 'Aug 5',
    status: 'Active',
    statusValue: 'active',
    description: 'Safe assignable program fixture.',
  },
  {
    id: 'program-duplicate-fixture',
    name: 'Test Duplicable Program',
    athletesLabel: 'Unassigned',
    athleteIds: [],
    assignedAthleteIds: [],
    duration: '5 weeks',
    weekCount: 5,
    workouts: 5,
    exercises: 15,
    startDate: '2026-07-22',
    endDate: '2026-08-26',
    startDateLabel: 'Jul 22',
    endDateLabel: 'Aug 26',
    status: 'Active',
    statusValue: 'active',
    description: 'Safe duplicable program fixture.',
  },
  {
    id: 'program-archive-fixture',
    name: 'Test Archivable Program',
    athletesLabel: 'Unassigned',
    athleteIds: [],
    assignedAthleteIds: [],
    duration: '6 weeks',
    weekCount: 6,
    workouts: 6,
    exercises: 18,
    startDate: '2026-07-29',
    endDate: '2026-09-09',
    startDateLabel: 'Jul 29',
    endDateLabel: 'Sep 9',
    status: 'Active',
    statusValue: 'active',
    description: 'Safe archivable program fixture.',
  },
  {
    id: 'program-delete-fixture',
    name: 'Test Deletable Program',
    athletesLabel: 'Unassigned',
    athleteIds: [],
    assignedAthleteIds: [],
    duration: '7 weeks',
    weekCount: 7,
    workouts: 7,
    exercises: 21,
    startDate: '2026-08-05',
    endDate: '2026-09-23',
    startDateLabel: 'Aug 5',
    endDateLabel: 'Sep 23',
    status: 'Active',
    statusValue: 'active',
    description: 'Safe deletable program fixture.',
  },
])

const athleteOptions = Object.freeze([
  { id: 'athlete-fixture-1', name: 'Thomas Thibault', email: 'thomas@example.test', avatarUrl: '' },
  { id: 'athlete-fixture-2', name: 'Maya Singh', email: 'maya@example.test', avatarUrl: '' },
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

function buildProgramFromForm(requestBody, overrides = {}) {
  return {
    id: overrides.id ?? 'program-created-unassigned-fixture',
    name: requestBody.name,
    athletesLabel: 'Unassigned',
    athleteIds: [],
    assignedAthleteIds: [],
    duration: `${Number(requestBody.weeks)} weeks`,
    weekCount: Number(requestBody.weeks),
    workouts: 0,
    exercises: 0,
    startDate: requestBody.startDate,
    endDate: requestBody.endDate,
    startDateLabel: 'Jul 1',
    endDateLabel: 'Jul 14',
    status: 'Active',
    statusValue: 'active',
    description: requestBody.description ?? '',
  }
}

function buildAssignedProgram(program, athleteIds) {
  const assignedAthletes = athleteOptions.filter((athlete) => athleteIds.includes(athlete.id))

  return {
    ...program,
    athletesLabel: assignedAthletes.length === 1 ? assignedAthletes[0].name : `${assignedAthletes.length} athletes`,
    athleteIds,
    assignedAthleteIds: athleteIds,
  }
}

function buildDuplicatedProgram(requestBody) {
  return {
    id: 'program-duplicate-copy-fixture',
    name: requestBody.name,
    athletesLabel: 'Unassigned',
    athleteIds: [],
    assignedAthleteIds: [],
    duration: `${Number(requestBody.weeks)} weeks`,
    weekCount: Number(requestBody.weeks),
    workouts: 5,
    exercises: 15,
    startDate: requestBody.startDate || '',
    endDate: requestBody.endDate || '',
    startDateLabel: 'No start date',
    endDateLabel: 'No end date',
    status: 'Active',
    statusValue: 'active',
    description: requestBody.description ?? '',
  }
}

async function gotoProgramsWorkflow(page, workflowCheck) {
  await page.goto(workflowCheck.route, { waitUntil: 'load' })
  await assertCssLoaded(page, { route: workflowCheck.route })
  await expect(page.getByRole('heading', { name: 'Programs Library' })).toBeVisible()
}

async function mockAdminProgramsShellData(page) {
  const state = {
    programs: [...seededPrograms],
    createdProgramRequests: [],
    updatedProgramRequests: [],
    assignedProgramRequests: [],
    duplicatedProgramRequests: [],
    archivedProgramRequests: [],
    deletedProgramRequests: [],
  }

  assertDestructiveWorkflowSafety({
    workflowName: 'Admin Programs archive/delete workflow',
    apiMocked: true,
    targetRecords: [
      { id: 'program-archive-fixture', name: 'Test Archivable Program' },
      { id: 'program-delete-fixture', name: 'Test Deletable Program' },
    ],
  })

  await page.route('**/api/admin/programs**', async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      const requestBody = request.postDataJSON()

      if (requestBody.action === 'duplicate') {
        state.duplicatedProgramRequests.push(requestBody)

        expect(requestBody).toMatchObject({
          action: 'duplicate',
          sourceProgramId: 'program-duplicate-fixture',
          athleteIds: [],
          name: 'Test Duplicable Program copy',
          weeks: '5',
          startDate: '',
          endDate: '',
          description: 'Duplicated by the safe Programs workflow.',
          copyOptions: {
            details: true,
            athletes: false,
            schedule: true,
            exercises: true,
            notes: true,
          },
        })

        const duplicatedProgram = buildDuplicatedProgram(requestBody)
        state.programs = [...state.programs, duplicatedProgram]

        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ program: duplicatedProgram }),
        })
        return
      }

      state.createdProgramRequests.push(requestBody)

      expect(requestBody).toMatchObject({
        athleteIds: [],
        name: 'Test Workflow Program',
        weeks: '2',
        startDate: '2026-07-01',
        endDate: '2026-07-14',
        description: 'Created by the safe Programs workflow.',
      })

      const createdProgram = buildProgramFromForm(requestBody)
      state.programs = [...state.programs, createdProgram]

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ program: createdProgram }),
      })
      return
    }

    if (request.method() === 'DELETE') {
      const requestBody = request.postDataJSON()
      state.deletedProgramRequests.push(requestBody)

      expect(requestBody).toMatchObject({
        action: 'delete-programs',
        programIds: ['program-delete-fixture'],
      })

      const deletedPrograms = state.programs.filter((program) => requestBody.programIds.includes(program.id))
      state.programs = state.programs.filter((program) => !requestBody.programIds.includes(program.id))

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deletedPrograms }),
      })
      return
    }

    if (request.method() === 'PATCH') {
      const requestBody = request.postDataJSON()

      if (requestBody.action === 'archive-programs') {
        state.archivedProgramRequests.push(requestBody)

        expect(requestBody).toMatchObject({
          action: 'archive-programs',
          programIds: ['program-archive-fixture'],
        })

        const archivedPrograms = state.programs
          .filter((program) => requestBody.programIds.includes(program.id))
          .map((program) => ({ ...program, status: 'Archived', statusValue: 'archived' }))
        const archivedProgramMap = new Map(archivedPrograms.map((program) => [program.id, program]))
        state.programs = state.programs.map((program) => archivedProgramMap.get(program.id) ?? program)

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ archivedPrograms, skippedPrograms: [] }),
        })
        return
      }

      if (requestBody.action === 'assign-athletes') {
        state.assignedProgramRequests.push(requestBody)

        expect(requestBody).toMatchObject({
          action: 'assign-athletes',
          id: 'program-assign-fixture',
          athleteIds: ['athlete-fixture-1'],
        })

        const sourceProgram = state.programs.find((program) => program.id === requestBody.id)
        const assignedProgram = buildAssignedProgram(sourceProgram, requestBody.athleteIds)
        state.programs = state.programs.map((program) => (program.id === assignedProgram.id ? assignedProgram : program))

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ program: assignedProgram }),
        })
        return
      }

      state.updatedProgramRequests.push(requestBody)

      expect(requestBody).toMatchObject({
        id: 'program-edit-fixture',
        athleteIds: [],
        name: 'Updated Test Workflow Program',
        weeks: '4',
        startDate: '2026-07-08',
        endDate: '2026-08-04',
        description: 'Edited by the safe Programs workflow.',
      })

      const updatedProgram = buildProgramFromForm(requestBody, { id: requestBody.id })
      state.programs = state.programs.map((program) => (program.id === updatedProgram.id ? updatedProgram : program))

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ program: updatedProgram }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ programs: state.programs, athleteOptions }),
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

test.describe('Admin Programs workflows', () => {

  test('Open program detail planner route', async ({ page }) => {
    await seedAdminBrowserSession(page)
    await mockAdminProgramsShellData(page)

    await gotoProgramsWorkflow(page, ADMIN_PROGRAMS_OPEN_DETAIL_PLANNER_ROUTE_WORKFLOW_CHECK)
    await expect(page).toHaveURL(/\/admin\/programs\?athleteId=/)

    const plannerProgramLink = page.locator('a[href="/admin/programs/program-1"]', { hasText: 'Summer strength block' })
    await expect(plannerProgramLink).toBeVisible()
    await plannerProgramLink.click()

    await expect(page).toHaveURL(/\/admin\/programs\/program-1(?:\?athleteId=.*)?$/)
    await assertCssLoaded(page, { route: '/admin/programs/program-1' })
    await expect(page.getByRole('heading', { name: 'Program 1' })).toBeVisible()
    await expect(page.locator('.program-planner-page-header')).toBeVisible()
    await expect(page.locator('.program-planner-week-row').first()).toBeVisible()
    await expect(page.locator('.program-planner-day-card').first()).toBeVisible()
    await expect(page.locator('.program-planner-workout-card').first()).toBeVisible()
    await expect(page.getByRole('link', { name: /Back/ })).toHaveAttribute('href', '/admin/programs')
  })

  test('Create unassigned test program', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const programsApiState = await mockAdminProgramsShellData(page)

    await gotoProgramsWorkflow(page, ADMIN_PROGRAMS_CREATE_UNASSIGNED_TEST_PROGRAM_WORKFLOW_CHECK)

    await expect(page.getByRole('heading', { name: 'Programs' })).toBeVisible()
    await expect(page.getByRole('row', { name: /Summer strength block/ })).toBeVisible()

    await page.getByRole('button', { name: 'Create a program' }).click()
    const createSheet = page.getByRole('dialog', { name: 'Create a program' })
    await expect(createSheet).toBeVisible()
    await createSheet.getByLabel('Name').fill('Test Workflow Program')
    await createSheet.getByLabel('Weeks').fill('2')
    await createSheet.getByLabel('Start date').fill('2026-07-01')
    await createSheet.getByLabel('End date').fill('2026-07-14')
    await createSheet.getByLabel('Description').fill('Created by the safe Programs workflow.')
    await createSheet.getByRole('button', { name: 'Create program' }).click()

    const editSheet = page.getByRole('dialog', { name: 'Edit program' })
    await expect(editSheet).toBeVisible()
    await expect(editSheet.getByLabel('Name')).toHaveValue('Test Workflow Program')
    await editSheet.getByRole('button', { name: 'Close' }).click()

    const createdProgramRow = page.getByRole('row', { name: /Test Workflow Program/ })
    await expect(createdProgramRow).toBeVisible()
    await expect(createdProgramRow).toContainText('Unassigned')
    expect(programsApiState.createdProgramRequests).toHaveLength(1)
    expect(programsApiState.createdProgramRequests[0]).toMatchObject({
      athleteIds: [],
      name: 'Test Workflow Program',
      weeks: '2',
      startDate: '2026-07-01',
      endDate: '2026-07-14',
      description: 'Created by the safe Programs workflow.',
    })
  })

  test('Edit test program', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const programsApiState = await mockAdminProgramsShellData(page)

    await gotoProgramsWorkflow(page, ADMIN_PROGRAMS_EDIT_TEST_PROGRAM_WORKFLOW_CHECK)

    const editableProgramRow = page.getByRole('row', { name: /Test Editable Program/ })
    await expect(editableProgramRow).toBeVisible()
    await editableProgramRow.getByLabel('Open menu').click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()

    const editSheet = page.getByRole('dialog', { name: 'Edit program' })
    await expect(editSheet).toBeVisible()
    await editSheet.getByLabel('Name').fill('Updated Test Workflow Program')
    await editSheet.getByLabel('Description').fill('Edited by the safe Programs workflow.')
    await editSheet.getByRole('button', { name: 'Save changes' }).click()

    const updatedProgramRow = page.getByRole('row', { name: /Updated Test Workflow Program/ })
    await expect(updatedProgramRow).toBeVisible()
    await expect(updatedProgramRow).toContainText('Unassigned')
    expect(programsApiState.updatedProgramRequests).toHaveLength(1)
    expect(programsApiState.updatedProgramRequests[0]).toMatchObject({
      id: 'program-edit-fixture',
      athleteIds: [],
      name: 'Updated Test Workflow Program',
      weeks: '4',
      startDate: '2026-07-08',
      endDate: '2026-08-04',
      description: 'Edited by the safe Programs workflow.',
    })
  })

  test('Assign test program to test athlete', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const programsApiState = await mockAdminProgramsShellData(page)

    await gotoProgramsWorkflow(page, ADMIN_PROGRAMS_ASSIGN_TEST_PROGRAM_TO_TEST_ATHLETE_WORKFLOW_CHECK)

    const assignableProgramRow = page.getByRole('row', { name: /Test Assignable Program/ })
    await expect(assignableProgramRow).toBeVisible()
    await expect(assignableProgramRow).toContainText('Unassigned')
    await assignableProgramRow.getByLabel('Open menu').click()
    await page.getByRole('menuitem', { name: 'Assign to athletes' }).click()

    const assignSheet = page.getByRole('dialog', { name: 'Assign to athletes' })
    await expect(assignSheet).toBeVisible()
    await expect(assignSheet.getByText('Test Assignable Program')).toBeVisible()
    await expect(assignSheet.getByText('Thomas Thibault')).toBeVisible()
    await assignSheet.getByRole('button', { name: 'Assign athlete to program' }).first().click()
    await expect(assignSheet.getByText('Added to program')).toBeVisible()
    await assignSheet.getByRole('button', { name: 'Assign athletes' }).click()

    const assignedProgramRow = page.getByRole('row', { name: /Test Assignable Program/ })
    await expect(assignedProgramRow).toBeVisible()
    await expect(assignedProgramRow).toContainText('Thomas Thibault')
    expect(programsApiState.assignedProgramRequests).toHaveLength(1)
    expect(programsApiState.assignedProgramRequests[0]).toMatchObject({
      action: 'assign-athletes',
      id: 'program-assign-fixture',
      athleteIds: ['athlete-fixture-1'],
    })
  })


  test('Export selected programs CSV', async ({ page }) => {
    await seedAdminBrowserSession(page)
    await mockAdminProgramsShellData(page)

    await gotoProgramsWorkflow(page, ADMIN_PROGRAMS_EXPORT_SELECTED_PROGRAMS_CSV_WORKFLOW_CHECK)

    await expect(page.getByRole('row', { name: /Summer strength block/ })).toBeVisible()
    await expect(page.getByRole('row', { name: /Test Editable Program/ })).toBeVisible()
    await page.getByLabel('Select row').nth(0).check()
    await page.getByLabel('Select row').nth(1).check()
    await page.getByRole('button', { name: 'Program bulk actions' }).click()
    await page.getByRole('menuitem', { name: 'Export' }).click()

    const exportSheet = page.getByRole('dialog', { name: 'Export programs' })
    await expect(exportSheet).toBeVisible()
    await expect(exportSheet.getByText('Review the selected programs before downloading a CSV export.')).toBeVisible()
    await expect(exportSheet.getByText('Selected programs', { exact: true })).toBeVisible()
    await expect(exportSheet.getByText('2', { exact: true })).toBeVisible()
    await expect(exportSheet.getByText('Filename')).toBeVisible()
    await expect(exportSheet.getByText(/pplus-programs-export-\d{4}-\d{2}-\d{2}\.csv/)).toBeVisible()
    await expect(exportSheet.getByText('Included columns')).toBeVisible()
    await expect(exportSheet.getByText('Program ID')).toBeVisible()
    await expect(exportSheet.getByText('Assigned athlete IDs')).toBeVisible()
    await expect(exportSheet.getByText('Selected program preview')).toBeVisible()
    await expect(exportSheet.getByText('Summer strength block')).toBeVisible()
    await expect(exportSheet.getByText('Test Editable Program')).toBeVisible()

    const downloadPromise = page.waitForEvent('download')
    await exportSheet.getByRole('button', { name: 'Download CSV' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^pplus-programs-export-\d{4}-\d{2}-\d{2}\.csv$/)

    const downloadStream = await download.createReadStream()
    const chunks = []
    for await (const chunk of downloadStream) chunks.push(chunk)
    const csv = Buffer.concat(chunks).toString('utf8')

    expect(csv).toContain('"Program ID","Athlete ID","Assigned athlete IDs","Coach ID","Program type"')
    expect(csv).toContain('"program-1","athlete-fixture-1","athlete-fixture-1; athlete-fixture-2","coach-fixture-1","Assigned","Summer strength block"')
    expect(csv).toContain('"program-edit-fixture","","","coach-fixture-1","Unassigned","Test Editable Program"')
    await expect(exportSheet).toBeHidden()
    await expect(page.getByRole('button', { name: 'Program bulk actions' })).toBeDisabled()
  })

  test('Duplicate test program', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const programsApiState = await mockAdminProgramsShellData(page)

    await gotoProgramsWorkflow(page, ADMIN_PROGRAMS_DUPLICATE_TEST_PROGRAM_WORKFLOW_CHECK)

    const duplicableProgramRow = page.getByRole('row', { name: /Test Duplicable Program/ })
    await expect(duplicableProgramRow).toBeVisible()
    await expect(duplicableProgramRow).toContainText('Unassigned')
    await duplicableProgramRow.getByLabel('Open menu').click()
    await page.getByRole('menuitem', { name: 'Duplicate' }).click()

    const duplicateSheet = page.getByRole('dialog', { name: 'Duplicate program' })
    await expect(duplicateSheet).toBeVisible()
    await expect(duplicateSheet.getByText('Test Duplicable Program')).toBeVisible()
    await expect(duplicateSheet.getByLabel('Name')).toHaveValue('Test Duplicable Program copy')
    await expect(duplicateSheet.getByLabel('Weeks')).toHaveValue('5')
    await expect(duplicateSheet.getByLabel('Copy Program details')).toBeChecked()
    await expect(duplicateSheet.getByLabel('Copy Assigned athletes')).not.toBeChecked()
    await expect(duplicateSheet.getByLabel('Copy Workout schedule')).toBeChecked()
    await expect(duplicateSheet.getByLabel('Copy Workout exercises and sets')).toBeChecked()
    await expect(duplicateSheet.getByLabel('Copy Notes / descriptions')).toBeChecked()
    await duplicateSheet.getByRole('textbox', { name: 'Description' }).fill('Duplicated by the safe Programs workflow.')
    await duplicateSheet.getByRole('button', { name: 'Duplicate program' }).click()

    const editSheet = page.getByRole('dialog', { name: 'Edit program' })
    await expect(editSheet).toBeVisible()
    await expect(editSheet.getByLabel('Name')).toHaveValue('Test Duplicable Program copy')
    await editSheet.getByRole('button', { name: 'Close' }).click()

    const duplicatedProgramRow = page.getByRole('row', { name: /Test Duplicable Program copy/ })
    await expect(duplicatedProgramRow).toBeVisible()
    await expect(duplicatedProgramRow).toContainText('Unassigned')
    expect(programsApiState.duplicatedProgramRequests).toHaveLength(1)
    expect(programsApiState.duplicatedProgramRequests[0]).toMatchObject({
      action: 'duplicate',
      sourceProgramId: 'program-duplicate-fixture',
      athleteIds: [],
      name: 'Test Duplicable Program copy',
      weeks: '5',
      startDate: '',
      endDate: '',
      description: 'Duplicated by the safe Programs workflow.',
      copyOptions: {
        details: true,
        athletes: false,
        schedule: true,
        exercises: true,
        notes: true,
      },
    })
  })


  test('Delete test program through confirmation', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const programsApiState = await mockAdminProgramsShellData(page)

    await gotoProgramsWorkflow(page, ADMIN_PROGRAMS_DELETE_TEST_PROGRAM_WORKFLOW_CHECK)

    const deletableProgramRow = page.getByRole('row', { name: /Test Deletable Program/ })
    await expect(deletableProgramRow).toBeVisible()
    await expect(deletableProgramRow).toContainText('Active')
    await deletableProgramRow.getByLabel('Open menu').click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()

    const deleteDialog = page.getByRole('dialog', { name: 'Delete program' })
    await expect(deleteDialog).toBeVisible()
    await expect(deleteDialog.getByText('This action cannot be undone.')).toBeVisible()
    await expect(deleteDialog.getByText('Programs selected')).toBeVisible()
    await expect(deleteDialog.getByText('Test Deletable Program')).toBeVisible()
    await deleteDialog.getByRole('button', { name: 'Delete program' }).click()

    await expect(deleteDialog).toBeHidden()
    await expect(page.getByRole('row', { name: /Test Deletable Program/ })).toBeHidden()
    expect(programsApiState.deletedProgramRequests).toHaveLength(1)
    expect(programsApiState.deletedProgramRequests[0]).toMatchObject({
      action: 'delete-programs',
      programIds: ['program-delete-fixture'],
    })
  })

  test('Archive test program through confirmation', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const programsApiState = await mockAdminProgramsShellData(page)

    await gotoProgramsWorkflow(page, ADMIN_PROGRAMS_ARCHIVE_TEST_PROGRAM_WORKFLOW_CHECK)

    const archivableProgramRow = page.getByRole('row', { name: /Test Archivable Program/ })
    await expect(archivableProgramRow).toBeVisible()
    await expect(archivableProgramRow).toContainText('Active')
    await archivableProgramRow.getByLabel('Open menu').click()
    await page.getByRole('menuitem', { name: 'Archive' }).click()

    const archiveDialog = page.getByRole('dialog', { name: 'Archive programs' })
    await expect(archiveDialog).toBeVisible()
    await expect(archiveDialog.getByText('Review the selected programs before moving them out of active workflows.')).toBeVisible()
    await expect(archiveDialog.getByText('Ready to archive')).toBeVisible()
    await expect(archiveDialog.getByText('Test Archivable Program')).toBeVisible()
    await archiveDialog.getByRole('button', { name: 'Archive 1 program' }).click()

    await expect(archiveDialog).toBeHidden()
    const archivedProgramRow = page.getByRole('row', { name: /Test Archivable Program/ })
    await expect(archivedProgramRow).toBeVisible()
    await expect(archivedProgramRow).toContainText('Archived')
    expect(programsApiState.archivedProgramRequests).toHaveLength(1)
    expect(programsApiState.archivedProgramRequests[0]).toMatchObject({
      action: 'archive-programs',
      programIds: ['program-archive-fixture'],
    })
  })
})
