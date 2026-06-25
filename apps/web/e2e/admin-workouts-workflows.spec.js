import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'
import { resolveWebBaseUrl } from './base-url.js'
import { assertDestructiveWorkflowSafety } from './destructive-workflow-safety.js'

export const ADMIN_WORKOUTS_CREATE_TEST_WORKOUT_TEMPLATE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-workouts-create-test-workout-template',
  route: '/admin/workouts',
  interaction: 'create-workout-template-submits-mocked-post-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_WORKOUTS_EDIT_TEST_WORKOUT_TEMPLATE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-workouts-edit-test-workout-template',
  route: '/admin/workouts',
  interaction: 'edit-workout-template-submits-mocked-patch-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_WORKOUTS_ASSIGN_WORKOUT_TEMPLATE_TO_TEST_PROGRAM_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-workouts-assign-workout-template-to-test-program',
  route: '/admin/workouts',
  interaction: 'assign-workout-template-submits-mocked-program-assignment-patch-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_WORKOUTS_EXPORT_WORKOUTS_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-workouts-export-workouts-csv-review-download',
  route: '/admin/workouts',
  interaction: 'export-workouts-opens-review-sheet-and-downloads-csv',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_WORKOUTS_DELETE_ARCHIVE_TEST_WORKOUT_THROUGH_CONFIRMATION_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-workouts-delete-archive-test-workout-through-confirmation',
  route: '/admin/workouts',
  interaction: 'archive-and-delete-workouts-through-confirmation-dialogs',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_WORKOUTS_OPEN_WORKOUT_CALENDAR_ROUTE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-workouts-open-workout-calendar-route',
  route: '/admin/workouts',
  interaction: 'open-workout-calendar-route-from-workouts-sidebar-nav',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_WORKOUTS_CALENDAR_FIXTURE_EXPECTED_DATE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-workouts-calendar-fixture-appears-on-expected-date',
  route: '/admin/workouts/calendar',
  interaction: 'calendar-fixture-renders-in-scheduled-date-cell',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

const seededWorkoutTemplates = [
  {
    id: 'workout-1',
    coach_id: 'coach-1',
    name: 'Explosive first step',
    category: 'On ice',
    focus_area: 'speed',
    training_type: 'Speed',
    estimated_duration_minutes: 45,
    section_count: 2,
    exercise_count: 6,
    set_count: 18,
    thumbnail_url: 'https://example.com/explosive-first-step.png',
    bg_color: '#103F2F',
    text_color: '#F8FAFC',
    created_at: '2026-06-01T10:00:00Z',
    updated_at: '2026-06-08T15:45:00Z',
    status: 'active',
    description: 'Acceleration mechanics and short burst power.',
  },
  {
    id: 'workout-archive-fixture',
    coach_id: 'coach-1',
    name: 'Test Archivable Workout Template',
    category: 'On ice',
    focus_area: 'speed',
    training_type: 'Speed',
    estimated_duration_minutes: 45,
    section_count: 2,
    exercise_count: 6,
    set_count: 18,
    thumbnail_url: 'https://example.com/test-archivable-workout-template.png',
    bg_color: '#103F2F',
    text_color: '#F8FAFC',
    created_at: '2026-06-02T10:00:00Z',
    updated_at: '2026-06-09T15:45:00Z',
    status: 'active',
    description: 'Safe archivable workout fixture.',
  },
  {
    id: 'workout-delete-fixture',
    coach_id: 'coach-1',
    name: 'Test Deletable Workout Template',
    category: 'On ice',
    focus_area: 'edge-work',
    training_type: 'Edge Work',
    estimated_duration_minutes: 35,
    section_count: 1,
    exercise_count: 4,
    set_count: 12,
    thumbnail_url: 'https://example.com/test-deletable-workout-template.png',
    bg_color: '#1E1B4B',
    text_color: '#F8FAFC',
    created_at: '2026-06-03T10:00:00Z',
    updated_at: '2026-06-10T15:45:00Z',
    status: 'draft',
    description: 'Safe deletable workout fixture.',
  },
]

const seededPrograms = [
  { id: 'program-1', name: 'Summer strength block', duration: '8 weeks', weekCount: 8, status: 'active' },
  { id: 'program-2', name: 'Speed and power', duration: '6 weeks', weekCount: 6, status: 'draft' },
]

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

function buildWorkoutTemplateFromForm(requestBody) {
  return {
    id: 'workout-template-created-fixture',
    name: requestBody.name,
    description: requestBody.description ?? '',
    training_type: requestBody.focusArea ?? '',
    estimated_duration_minutes: Number.parseInt(requestBody.duration, 10),
    section_count: 0,
    exercise_count: 0,
    set_count: 0,
    status: requestBody.status ?? 'active',
    trainingSections: [],
  }
}

function buildUpdatedWorkoutTemplateFromForm(currentTemplate, requestBody) {
  return {
    ...currentTemplate,
    name: requestBody.name,
    description: requestBody.description ?? '',
    training_type: requestBody.focusArea ?? '',
    estimated_duration_minutes: Number.parseInt(requestBody.duration, 10),
    status: requestBody.status ?? 'active',
    trainingSections: currentTemplate.trainingSections ?? [],
  }
}

async function gotoWorkoutsWorkflow(page, workflowCheck) {
  await page.goto(workflowCheck.route, { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  await assertCssLoaded(page, { route: workflowCheck.route })
  await expect(page.getByRole('heading', { name: 'Workout Library' })).toBeVisible()
}

async function mockAdminWorkoutsShellData(page) {
  const state = {
    workoutTemplates: [...seededWorkoutTemplates],
    createdWorkoutTemplateRequests: [],
    updatedWorkoutTemplateRequests: [],
    assignedWorkoutTemplateRequests: [],
    archivedWorkoutTemplateRequests: [],
    deletedWorkoutTemplateRequests: [],
    calendarAssignmentRequests: [],
  }

  assertDestructiveWorkflowSafety({
    workflowName: 'Admin Workouts archive/delete workflow',
    apiMocked: true,
    targetRecords: [
      { id: 'workout-archive-fixture', name: 'Test Archivable Workout Template' },
      { id: 'workout-delete-fixture', name: 'Test Deletable Workout Template' },
    ],
  })

  await page.route('**/api/admin/workout-templates**', async (route) => {
    const request = route.request()

    if (request.method() === 'POST') {
      const requestBody = request.postDataJSON()
      state.createdWorkoutTemplateRequests.push(requestBody)

      expect(requestBody).toMatchObject({
        name: 'Test Workflow Workout Template',
        duration: '45',
        status: 'active',
        focusArea: '',
        description: 'Created by the safe Workouts workflow.',
      })

      const createdWorkoutTemplate = buildWorkoutTemplateFromForm(requestBody)
      state.workoutTemplates = [...state.workoutTemplates, createdWorkoutTemplate]

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ workoutTemplate: createdWorkoutTemplate }),
      })
      return
    }

    if (request.method() === 'PATCH') {
      const requestBody = request.postDataJSON()

      if (requestBody.action === 'assign-workout-templates-to-program') {
        state.assignedWorkoutTemplateRequests.push(requestBody)

        expect(requestBody).toMatchObject({
          action: 'assign-workout-templates-to-program',
          programId: 'program-1',
          workoutTemplateIds: ['workout-1'],
        })

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            assignedWorkouts: [
              {
                id: 'program-workout-1',
                program_id: 'program-1',
                workout_template_id: 'workout-1',
                workoutTemplateId: 'workout-1',
                name: 'Explosive first step',
              },
            ],
            skippedWorkouts: [],
          }),
        })
        return
      }

      if (requestBody.action === 'archive-workout-templates') {
        state.archivedWorkoutTemplateRequests.push(requestBody)

        expect(requestBody).toMatchObject({
          action: 'archive-workout-templates',
          workoutTemplateIds: ['workout-archive-fixture'],
        })

        const archivedWorkouts = state.workoutTemplates.filter((template) => requestBody.workoutTemplateIds.includes(template.id))
        state.workoutTemplates = state.workoutTemplates.map((template) => {
          return requestBody.workoutTemplateIds.includes(template.id) ? { ...template, status: 'archived' } : template
        })

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ archivedWorkouts, skippedWorkouts: [] }),
        })
        return
      }

      state.updatedWorkoutTemplateRequests.push(requestBody)

      expect(requestBody).toMatchObject({
        id: 'workout-1',
        name: 'Updated Workflow Workout Template',
        duration: '55',
        status: 'active',
        focusArea: 'speed',
        description: 'Updated by the safe Workouts workflow.',
      })

      const currentTemplate = state.workoutTemplates.find((template) => template.id === requestBody.id)
      const updatedWorkoutTemplate = buildUpdatedWorkoutTemplateFromForm(currentTemplate, requestBody)
      state.workoutTemplates = state.workoutTemplates.map((template) => {
        return template.id === requestBody.id ? updatedWorkoutTemplate : template
      })

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ workoutTemplate: updatedWorkoutTemplate }),
      })
      return
    }

    if (request.method() === 'DELETE') {
      const requestBody = request.postDataJSON()
      state.deletedWorkoutTemplateRequests.push(requestBody)

      expect(requestBody).toMatchObject({
        workoutTemplateIds: ['workout-delete-fixture'],
      })

      const deletedWorkouts = state.workoutTemplates.filter((template) => requestBody.workoutTemplateIds.includes(template.id))
      state.workoutTemplates = state.workoutTemplates.filter((template) => !requestBody.workoutTemplateIds.includes(template.id))

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deletedWorkouts }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ workoutTemplates: state.workoutTemplates }),
    })
  })

  await page.route('**/api/admin/programs**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ programs: seededPrograms, athleteOptions: [] }),
    })
  })

  await page.route('**/api/admin/workout-calendar**', async (route) => {
    state.calendarAssignmentRequests.push(route.request().url())

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        assignments: [
          {
            id: 'calendar-route-assignment-1',
            workout_template_id: 'workout-1',
            name_snapshot: 'Calendar route speed session',
            training_type: 'Speed',
            scheduled_date: '2026-05-04',
            scheduled_start_time: '08:00:00',
            scheduled_end_time: '09:00:00',
            workout_templates: {
              id: 'workout-1',
              name: 'Calendar route speed session',
              training_type: 'Speed',
              bg_color: '#DDFBF2',
              text_color: '#0F5F4A',
              section_count: 2,
              exercise_count: 6,
              set_count: 18,
              estimated_duration_minutes: 45,
              status: 'active',
            },
          },
        ],
      }),
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

test.describe('Admin Workouts workflows', () => {
  test('Create test workout template', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const workoutsApiState = await mockAdminWorkoutsShellData(page)

    await gotoWorkoutsWorkflow(page, ADMIN_WORKOUTS_CREATE_TEST_WORKOUT_TEMPLATE_WORKFLOW_CHECK)

    await expect(page.getByRole('heading', { name: 'Workout Library' })).toBeVisible()
    await expect(page.getByRole('row', { name: /Explosive first step/ })).toBeVisible()

    await page.getByRole('button', { name: 'Create workout' }).click()
    const createSheet = page.getByRole('dialog', { name: 'Create workout' })
    await expect(createSheet).toBeVisible()
    await createSheet.getByLabel('Name').fill('Test Workflow Workout Template')
    await createSheet.getByLabel('Duration').fill('45')
    await createSheet.getByLabel('Description').fill('Created by the safe Workouts workflow.')

    await createSheet.getByRole('button', { name: 'Create workout' }).click()

    await expect.poll(() => workoutsApiState.createdWorkoutTemplateRequests.length).toBe(1)
    expect(workoutsApiState.createdWorkoutTemplateRequests).toHaveLength(1)
    expect(workoutsApiState.createdWorkoutTemplateRequests[0]).toMatchObject({
      name: 'Test Workflow Workout Template',
      duration: '45',
      description: 'Created by the safe Workouts workflow.',
    })

    await expect(createSheet).toBeHidden()
    await expect(page.getByRole('row', { name: /Test Workflow Workout Template/ })).toBeVisible()
    await expect(page.getByRole('row', { name: /Test Workflow Workout Template/ })).toContainText('45 min')
    await expect(page.getByRole('row', { name: /Test Workflow Workout Template/ })).toContainText('0')
  })



  test('Assign workout template to test program', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const workoutsApiState = await mockAdminWorkoutsShellData(page)

    await gotoWorkoutsWorkflow(page, ADMIN_WORKOUTS_ASSIGN_WORKOUT_TEMPLATE_TO_TEST_PROGRAM_WORKFLOW_CHECK)

    await expect(page.getByRole('heading', { name: 'Workout Library' })).toBeVisible()
    const workoutRow = page.getByRole('row', { name: /Explosive first step/ })
    await expect(workoutRow).toBeVisible()

    await workoutRow.getByRole('checkbox', { name: 'Select row' }).check()
    await page.getByRole('button', { name: 'Workout bulk actions' }).click()
    await page.getByRole('menuitem', { name: 'Assign to program' }).click()

    const assignSheet = page.getByRole('dialog', { name: 'Assign to program' })
    await expect(assignSheet).toBeVisible()
    await expect(assignSheet).toContainText('Selected workouts')
    await expect(assignSheet).toContainText('Explosive first step')

    await assignSheet.getByRole('combobox', { name: 'Target program' }).click()
    await page.getByRole('option', { name: 'Summer strength block' }).click()
    await expect(assignSheet).toContainText('Program selected')
    await expect(assignSheet).toContainText('Summer strength block')

    await assignSheet.getByRole('button', { name: 'Confirm assignment' }).click()

    await expect.poll(() => workoutsApiState.assignedWorkoutTemplateRequests.length).toBe(1)
    expect(workoutsApiState.assignedWorkoutTemplateRequests).toHaveLength(1)
    expect(workoutsApiState.assignedWorkoutTemplateRequests[0]).toMatchObject({
      action: 'assign-workout-templates-to-program',
      programId: 'program-1',
      workoutTemplateIds: ['workout-1'],
    })

    await expect(assignSheet).toBeHidden()
    await expect(page.getByText('Assigned 1 workout to Summer strength block.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bulk actions' })).toBeDisabled()
    await expect(workoutRow.getByRole('checkbox', { name: 'Select row' })).not.toBeChecked()
  })

  test('Export workouts CSV review/download path', async ({ page }) => {
    await seedAdminBrowserSession(page)
    await mockAdminWorkoutsShellData(page)

    await gotoWorkoutsWorkflow(page, ADMIN_WORKOUTS_EXPORT_WORKOUTS_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK)

    await expect(page.getByRole('heading', { name: 'Workout Library' })).toBeVisible()
    const workoutRow = page.getByRole('row', { name: /Explosive first step/ })
    await expect(workoutRow).toBeVisible()

    await workoutRow.getByRole('checkbox', { name: 'Select row' }).check()
    await page.getByRole('button', { name: 'Workout bulk actions' }).click()
    await page.getByRole('menuitem', { name: 'Export' }).click()

    const exportSheet = page.getByRole('dialog', { name: 'Export workouts' })
    await expect(exportSheet).toBeVisible()
    await expect(exportSheet).toContainText('Review the selected workouts before downloading a CSV export.')
    await expect(exportSheet).toContainText('Selected workouts')
    await expect(exportSheet).toContainText('1')
    await expect(exportSheet).toContainText('Format')
    await expect(exportSheet).toContainText('CSV')
    await expect(exportSheet).toContainText('pplus-workouts-export-')
    await expect(exportSheet).toContainText('Included columns')
    await expect(exportSheet).toContainText('Workout template ID')
    await expect(exportSheet).toContainText('Coach ID')
    await expect(exportSheet).toContainText('Workout name')
    await expect(exportSheet).toContainText('Selected workout preview')
    await expect(exportSheet).toContainText('Explosive first step')
    await expect(exportSheet).toContainText('Speed · 6 exercises')
    await expect(exportSheet).toContainText('45 min · 18 sets')

    const downloadPromise = page.waitForEvent('download')
    await exportSheet.getByRole('button', { name: 'Download CSV' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/^pplus-workouts-export-\d{4}-\d{2}-\d{2}\.csv$/)
    const downloadedPath = await download.path()
    expect(downloadedPath).toBeTruthy()
    const csvContent = await readFile(downloadedPath, 'utf8')
    expect(csvContent).toContain('"Workout template ID","Coach ID","Workout name"')
    expect(csvContent).toContain('"workout-1","coach-1","Explosive first step"')
    expect(csvContent).toContain('"Acceleration mechanics and short burst power."')
    expect(csvContent).toContain('"speed","Speed","45","45 min","2","6","18"')

    await expect(exportSheet).toBeHidden()
    await expect(page.getByRole('button', { name: 'Bulk actions' })).toBeDisabled()
    await expect(workoutRow.getByRole('checkbox', { name: 'Select row' })).not.toBeChecked()
  })

  test('Delete/archive test workout through confirmation', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const workoutsApiState = await mockAdminWorkoutsShellData(page)

    await gotoWorkoutsWorkflow(page, ADMIN_WORKOUTS_DELETE_ARCHIVE_TEST_WORKOUT_THROUGH_CONFIRMATION_WORKFLOW_CHECK)

    await expect(page.getByRole('heading', { name: 'Workout Library' })).toBeVisible()
    const archiveWorkoutRow = page.getByRole('row', { name: /Test Archivable Workout Template/ })
    await expect(archiveWorkoutRow).toBeVisible()

    await archiveWorkoutRow.getByRole('checkbox', { name: 'Select row' }).check()
    await page.getByRole('button', { name: 'Workout bulk actions' }).click()
    await page.getByRole('menuitem', { name: 'Archive' }).click()

    const archiveDialog = page.getByRole('dialog', { name: 'Archive workouts' })
    await expect(archiveDialog).toBeVisible()
    await expect(archiveDialog).toContainText('Archive selected workouts so they stay out of the active library without being permanently deleted.')
    await expect(archiveDialog).toContainText('1 workout selected')
    await expect(archiveDialog).toContainText('Archived workouts can be restored later from archived status.')
    await expect(archiveDialog).toContainText('Test Archivable Workout Template')
    await expect(archiveDialog).toContainText('45 min · 6 exercises · 18 sets · Speed')

    await archiveDialog.getByRole('button', { name: 'Archive workouts' }).click()

    await expect.poll(() => workoutsApiState.archivedWorkoutTemplateRequests.length).toBe(1)
    expect(workoutsApiState.archivedWorkoutTemplateRequests).toHaveLength(1)
    expect(workoutsApiState.archivedWorkoutTemplateRequests[0]).toMatchObject({
      action: 'archive-workout-templates',
      workoutTemplateIds: ['workout-archive-fixture'],
    })

    await expect(archiveDialog).toBeHidden()
    await expect(page.getByText('Archived 1 workout.')).toBeVisible()
    await expect(archiveWorkoutRow.getByRole('checkbox', { name: 'Select row' })).not.toBeChecked()
    await expect(archiveWorkoutRow).toContainText('Archived')

    const deleteWorkoutRow = page.getByRole('row', { name: /Test Deletable Workout Template/ })
    await expect(deleteWorkoutRow).toBeVisible()
    await deleteWorkoutRow.getByRole('checkbox', { name: 'Select row' }).check()
    await page.getByRole('button', { name: 'Workout bulk actions' }).click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()

    const deleteDialog = page.getByRole('dialog', { name: 'Delete workouts' })
    await expect(deleteDialog).toBeVisible()
    await expect(deleteDialog).toContainText('Delete selected workouts permanently. This cannot be undone.')
    await expect(deleteDialog).toContainText('1 workout selected')
    await expect(deleteDialog).toContainText('This removes the selected workout templates from the library.')
    await expect(deleteDialog).toContainText('Test Deletable Workout Template')
    await expect(deleteDialog).toContainText('35 min · 4 exercises · 12 sets · Edge Work')

    await deleteDialog.getByRole('button', { name: 'Delete workouts' }).click()

    await expect.poll(() => workoutsApiState.deletedWorkoutTemplateRequests.length).toBe(1)
    expect(workoutsApiState.deletedWorkoutTemplateRequests).toHaveLength(1)
    expect(workoutsApiState.deletedWorkoutTemplateRequests[0]).toMatchObject({
      workoutTemplateIds: ['workout-delete-fixture'],
    })

    await expect(deleteDialog).toBeHidden()
    await expect(page.getByText('Deleted 1 workout.')).toBeVisible()
    await expect(page.getByRole('row', { name: /Test Deletable Workout Template/ })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Bulk actions' })).toBeDisabled()
  })

  test('Edit test workout template', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const workoutsApiState = await mockAdminWorkoutsShellData(page)

    await gotoWorkoutsWorkflow(page, ADMIN_WORKOUTS_EDIT_TEST_WORKOUT_TEMPLATE_WORKFLOW_CHECK)

    await expect(page.getByRole('heading', { name: 'Workout Library' })).toBeVisible()
    const originalWorkoutRow = page.getByRole('row', { name: /Explosive first step/ })
    await expect(originalWorkoutRow).toBeVisible()

    await originalWorkoutRow.getByRole('button', { name: 'Open menu' }).click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()

    const editSheet = page.getByRole('dialog', { name: 'Edit workout' })
    await expect(editSheet).toBeVisible()
    await editSheet.getByLabel('Name').fill('Updated Workflow Workout Template')
    await editSheet.getByLabel('Duration').fill('55')
    await editSheet.getByLabel('Description').fill('Updated by the safe Workouts workflow.')

    await editSheet.getByRole('button', { name: 'Save changes' }).click()

    await expect.poll(() => workoutsApiState.updatedWorkoutTemplateRequests.length).toBe(1)
    expect(workoutsApiState.updatedWorkoutTemplateRequests).toHaveLength(1)
    expect(workoutsApiState.updatedWorkoutTemplateRequests[0]).toMatchObject({
      id: 'workout-1',
      name: 'Updated Workflow Workout Template',
      duration: '55',
      description: 'Updated by the safe Workouts workflow.',
    })

    await expect(editSheet).toBeHidden()
    await expect(page.getByRole('row', { name: /Updated Workflow Workout Template/ })).toBeVisible()
    await expect(page.getByRole('row', { name: /Updated Workflow Workout Template/ })).toContainText('55 min')
    await expect(page.getByRole('row', { name: /Explosive first step/ })).not.toBeVisible()
  })

  test('Open workout calendar route', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const workoutsApiState = await mockAdminWorkoutsShellData(page)

    await gotoWorkoutsWorkflow(page, ADMIN_WORKOUTS_OPEN_WORKOUT_CALENDAR_ROUTE_WORKFLOW_CHECK)

    await page.getByRole('link', { name: 'Calendar' }).click()

    await expect(page).toHaveURL(/\/admin\/workouts\/calendar/)
    await expect(page.getByRole('region', { name: 'Workout calendar admin view' })).toBeVisible()
    await expect(page.locator('.admin-shell-workouts-calendar-month-grid')).toBeVisible()
    await expect(page.getByText('Calendar route speed session')).toBeVisible()
    await expect.poll(() => workoutsApiState.calendarAssignmentRequests.length).toBe(1)
    expect(workoutsApiState.calendarAssignmentRequests).toHaveLength(1)
  })

  test('Calendar fixture workout appears on expected date', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const workoutsApiState = await mockAdminWorkoutsShellData(page)

    await page.goto(ADMIN_WORKOUTS_CALENDAR_FIXTURE_EXPECTED_DATE_WORKFLOW_CHECK.route, { waitUntil: 'load' })
    await assertCssLoaded(page, { route: ADMIN_WORKOUTS_CALENDAR_FIXTURE_EXPECTED_DATE_WORKFLOW_CHECK.route })

    await expect(page.getByRole('region', { name: 'Workout calendar admin view' })).toBeVisible()
    await expect(page.locator('.admin-shell-workouts-calendar-month-grid')).toBeVisible()

    const expectedDateSlot = page.locator('[data-month-slot="month-slot:2026-05-04T04:00:00.000Z"]')
    await expect(expectedDateSlot).toBeVisible()
    await expect(expectedDateSlot.getByRole('button', { name: '4' })).toBeVisible()
    await expect(expectedDateSlot.getByText('Calendar route speed session')).toBeVisible()

    const wrongDateSlot = page.locator('[data-month-slot="month-slot:2026-05-05T04:00:00.000Z"]')
    await expect(wrongDateSlot).toBeVisible()
    await expect(wrongDateSlot.getByText('Calendar route speed session')).toHaveCount(0)

    await expect.poll(() => workoutsApiState.calendarAssignmentRequests.length).toBe(1)
    expect(workoutsApiState.calendarAssignmentRequests).toHaveLength(1)
  })
})
