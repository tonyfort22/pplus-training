import { readFile } from 'node:fs/promises'

import { expect, test } from '@playwright/test'

import { WEB_TEST_LAYERS } from '../testing/page-test-manifest.js'
import { assertCssLoaded } from './css-loaded.js'
import { resolveWebBaseUrl } from './base-url.js'
import { assertDestructiveWorkflowSafety } from './destructive-workflow-safety.js'

export const ADMIN_EXERCISES_CREATE_TEST_EXERCISE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-exercises-create-test-exercise',
  route: '/admin/exercises',
  interaction: 'create-exercise-submits-mocked-post-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_EXERCISES_EDIT_TEST_EXERCISE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-exercises-edit-test-exercise',
  route: '/admin/exercises',
  interaction: 'edit-exercise-submits-mocked-patch-and-refreshes-table',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_EXERCISES_ATTACH_DIRECT_MP4_MEDIA_URL_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-exercises-attach-direct-mp4-media-url',
  route: '/admin/exercises',
  interaction: 'attach-direct-mp4-url-displays-media-preview-and-saves-patch',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_EXERCISES_EXPORT_EXERCISES_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-exercises-export-exercises-csv-review-download',
  route: '/admin/exercises',
  interaction: 'export-exercises-opens-review-sheet-and-downloads-csv',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

export const ADMIN_EXERCISES_DELETE_ARCHIVE_TEST_EXERCISE_WORKFLOW_CHECK = Object.freeze({
  id: 'admin-exercises-delete-archive-test-exercise-through-confirmation',
  route: '/admin/exercises',
  interaction: 'archive-and-delete-exercises-through-confirmation-dialogs',
  layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
})

const testMp4MediaUrl = 'https://example.supabase.co/storage/v1/object/public/exercise-videos/exercise-1/test-workflow-media.mp4'

const seededExercises = [
  {
    id: 'exercise-1',
    name: 'Test Workflow Exercise Fixture',
    description: 'Single-leg lateral power and landing quality.',
    difficulty: 'intermediate',
    category: 'strength',
    movementPattern: 'lateral',
    movementTypeValues: ['lateral', 'power'],
    muscle: 'Glutes',
    muscleNames: ['Glutes'],
    primaryMuscleId: 'muscle-glutes',
    secondaryMuscleIds: [],
    equipment: 'Bands',
    equipmentNeeded: ['Bands'],
    totalSetCount: 3,
    exerciseSets: [],
    sets: '3',
    reps: '6/side',
    duration: '-',
    distance: '-',
    weights: '',
    rest: '45 sec',
    tempo: '',
    status: 'active',
    thumbnailUrl: 'https://example.supabase.co/storage/v1/object/public/exercise-thumbnails/exercise-1/thumb.png',
    videoUrl: 'https://example.supabase.co/storage/v1/object/public/exercise-videos/exercise-1/source.mp4',
    createdAt: '2026-06-01T10:00:00Z',
  },
]

const muscleOptions = [
  { value: 'muscle-glutes', label: 'Glutes' },
  { value: 'muscle-quads', label: 'Quads' },
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

function buildExerciseFromForm(requestBody) {
  return {
    id: 'exercise-created-fixture',
    name: requestBody.name,
    description: requestBody.description ?? '',
    difficulty: requestBody.difficulty ?? '',
    category: requestBody.category ?? '',
    movementPattern: '',
    muscle: '-',
    muscleNames: [],
    primaryMuscleId: requestBody.primaryMuscleId ?? '',
    secondaryMuscleIds: requestBody.secondaryMuscleIds ?? [],
    equipment: (requestBody.equipmentNeeded ?? []).join(', '),
    equipmentNeeded: requestBody.equipmentNeeded ?? [],
    totalSetCount: 0,
    exerciseSets: [],
    sets: requestBody.sets ?? '-',
    reps: requestBody.reps ?? '-',
    duration: requestBody.duration ?? '-',
    distance: requestBody.distance ?? '-',
    weights: requestBody.weights ?? '',
    rest: requestBody.rest ?? '-',
    tempo: requestBody.tempo ?? '',
    status: requestBody.status ?? 'draft',
    thumbnailUrl: '',
    videoUrl: requestBody.videoUrl ?? '',
    createdAt: '2026-06-22T10:00:00Z',
  }
}

async function gotoExercisesWorkflow(page, workflowCheck) {
  await page.goto(workflowCheck.route, { waitUntil: 'load' })
  await page.waitForLoadState('networkidle')
  await assertCssLoaded(page, { route: workflowCheck.route })
  await expect(page.getByRole('heading', { name: 'Exercise Library' })).toBeVisible()
}

async function mockAdminExercisesShellData(page) {
  const state = {
    exercises: [...seededExercises],
    createdExerciseRequests: [],
    updatedExerciseRequests: [],
    directMp4MediaUrlRequests: [],
    archivedExerciseRequests: [],
    deletedExerciseRequests: [],
  }

  assertDestructiveWorkflowSafety({
    workflowName: 'Admin Exercises archive/delete workflow',
    apiMocked: true,
    targetRecords: [{ id: 'exercise-1', name: 'Test Workflow Exercise Fixture' }],
  })

  await page.route('**/api/admin/exercises**', async (route) => {
    const request = route.request()

    if (request.method() === 'DELETE') {
      const exerciseId = request.url().split('/api/admin/exercises/')[1]?.split('?')[0]
      expect(exerciseId).toBe('exercise-1')
      state.deletedExerciseRequests.push(exerciseId)
      state.exercises = state.exercises.filter((exercise) => exercise.id !== exerciseId)

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exerciseId }),
      })
      return
    }

    if (request.method() === 'POST') {
      const requestBody = request.postDataJSON()
      state.createdExerciseRequests.push(requestBody)

      expect(requestBody).toMatchObject({
        name: 'Test Workflow Exercise',
        sets: '4',
        reps: '8',
        duration: '30 sec',
        rest: '60 sec',
        status: 'draft',
        description: 'Created by the safe Exercises workflow.',
      })

      const createdExercise = buildExerciseFromForm(requestBody)
      state.exercises = [...state.exercises, createdExercise]

      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ exercise: createdExercise }),
      })
      return
    }

    if (request.method() === 'PATCH') {
      expect(request.url()).toContain('/api/admin/exercises/exercise-1')
      const requestBody = request.postDataJSON()

      if (requestBody.status === 'archived') {
        state.archivedExerciseRequests.push(requestBody)
        expect(requestBody).toMatchObject({
          name: 'Test Workflow Exercise Fixture',
          status: 'archived',
        })

        const archivedExercise = {
          ...state.exercises.find((exercise) => exercise.id === 'exercise-1'),
          ...requestBody,
          status: 'archived',
        }
        state.exercises = state.exercises.map((exercise) => (exercise.id === 'exercise-1' ? archivedExercise : exercise))

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ exercise: archivedExercise }),
        })
        return
      }

      state.updatedExerciseRequests.push(requestBody)

      if (requestBody.videoUrl === testMp4MediaUrl) {
        state.directMp4MediaUrlRequests.push(requestBody)
        expect(requestBody).toMatchObject({
          name: 'Test Workflow Exercise Fixture',
          videoUrl: testMp4MediaUrl,
        })
      } else {
        expect(requestBody).toMatchObject({
          name: 'Updated Workflow Exercise',
          sets: '5',
          reps: '10',
          duration: '45 sec',
          rest: '75 sec',
          status: 'active',
          description: 'Updated by the safe Exercises workflow.',
        })
      }

      const updatedExercise = {
        ...seededExercises[0],
        ...buildExerciseFromForm(requestBody),
        id: 'exercise-1',
        muscle: 'Glutes',
        muscleNames: ['Glutes'],
        primaryMuscleId: requestBody.primaryMuscleId || 'muscle-glutes',
      }
      state.exercises = state.exercises.map((exercise) => (exercise.id === 'exercise-1' ? updatedExercise : exercise))

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exercise: updatedExercise }),
      })
      return
    }

    if (request.method() === 'GET' && request.url().includes('/api/admin/exercises/exercise-1')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ exercise: state.exercises.find((exercise) => exercise.id === 'exercise-1') }),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ exercises: state.exercises, muscleOptions }),
    })
  })

  return state
}

test.describe('Admin Exercises safe workflows', () => {
  test('Create test exercise', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const exercisesApiState = await mockAdminExercisesShellData(page)

    await gotoExercisesWorkflow(page, ADMIN_EXERCISES_CREATE_TEST_EXERCISE_WORKFLOW_CHECK)

    await page.getByRole('button', { name: 'Create exercise' }).click()
    await expect(page.getByRole('heading', { name: 'Create exercise' })).toBeVisible()

    await page.getByLabel('Name').fill('Test Workflow Exercise')
    await page.getByLabel('Sets').fill('4')
    await page.getByLabel('Reps').fill('8')
    await page.getByLabel('Duration').fill('30 sec')
    await page.getByLabel('Rest').fill('60 sec')
    await page.getByLabel('Description').fill('Created by the safe Exercises workflow.')

    await page.getByRole('button', { name: 'Create exercise' }).last().click()

    await expect(
      page.getByRole('row', { name: /^Select row Test Workflow Exercise Test Workflow Exercise 0 sets/ }),
    ).toBeVisible()
    expect(exercisesApiState.createdExerciseRequests).toHaveLength(1)
  })

  test('Edit test exercise', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const exercisesApiState = await mockAdminExercisesShellData(page)

    await gotoExercisesWorkflow(page, ADMIN_EXERCISES_EDIT_TEST_EXERCISE_WORKFLOW_CHECK)

    await page.getByRole('button', { name: 'Open menu' }).first().click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()
    await expect(page.getByRole('heading', { name: 'Edit exercise' })).toBeVisible()

    await page.getByLabel('Name').fill('Updated Workflow Exercise')
    await page.getByLabel('Sets').fill('5')
    await page.getByLabel('Reps').fill('10')
    await page.getByLabel('Duration').fill('45 sec')
    await page.getByLabel('Rest').fill('75 sec')
    await page.getByLabel('Description').fill('Updated by the safe Exercises workflow.')

    await page.getByRole('button', { name: 'Save changes' }).click()

    await expect(page.getByRole('cell', { name: 'Updated Workflow Exercise' })).toBeVisible()
    await expect(page.getByRole('cell', { name: 'Test Workflow Exercise Fixture' })).toHaveCount(0)
    expect(exercisesApiState.updatedExerciseRequests).toHaveLength(1)
  })


  test('Export exercises CSV review/download path', async ({ page }) => {
    await seedAdminBrowserSession(page)
    await mockAdminExercisesShellData(page)

    await gotoExercisesWorkflow(page, ADMIN_EXERCISES_EXPORT_EXERCISES_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK)

    const exerciseRow = page.getByRole('row', { name: /Test Workflow Exercise Fixture/ })
    await expect(exerciseRow).toBeVisible()

    await exerciseRow.getByRole('checkbox', { name: 'Select row' }).check()
    await page.getByRole('button', { name: 'Exercise bulk actions' }).click()
    await page.getByRole('menuitem', { name: 'Export' }).click()

    const exportSheet = page.getByRole('dialog', { name: 'Export exercises' })
    await expect(exportSheet).toBeVisible()
    await expect(exportSheet).toContainText('Review the selected exercises before downloading a CSV export.')
    await expect(exportSheet).toContainText('Selected exercises')
    await expect(exportSheet).toContainText('1')
    await expect(exportSheet).toContainText('Format')
    await expect(exportSheet).toContainText('CSV')
    await expect(exportSheet).toContainText('pplus-exercises-export-')
    await expect(exportSheet).toContainText('Included columns')
    await expect(exportSheet).toContainText('Exercise ID')
    await expect(exportSheet).toContainText('Primary muscle ID')
    await expect(exportSheet).toContainText('Video URL')
    await expect(exportSheet).toContainText('Selected exercise preview')
    await expect(exportSheet).toContainText('Test Workflow Exercise Fixture')
    await expect(exportSheet).toContainText('Glutes')
    await expect(exportSheet).toContainText('Bands')
    await expect(exportSheet).toContainText('active')

    const downloadPromise = page.waitForEvent('download')
    await exportSheet.getByRole('button', { name: 'Download CSV' }).click()
    const download = await downloadPromise

    expect(download.suggestedFilename()).toMatch(/^pplus-exercises-export-\d{4}-\d{2}-\d{2}\.csv$/)
    const downloadedPath = await download.path()
    expect(downloadedPath).toBeTruthy()
    const csvContent = await readFile(downloadedPath, 'utf8')
    expect(csvContent).toContain('"Exercise ID","Exercise name","Description"')
    expect(csvContent).toContain('"exercise-1","Test Workflow Exercise Fixture","Single-leg lateral power and landing quality."')
    expect(csvContent).toContain('"Glutes","muscle-glutes"')
    expect(csvContent).toContain('"Bands","lateral, power","lateral"')
    expect(csvContent).toContain('"https://example.supabase.co/storage/v1/object/public/exercise-videos/exercise-1/source.mp4"')

    await expect(exportSheet).toBeHidden()
    await expect(page.getByRole('button', { name: 'Exercise bulk actions' })).toBeDisabled()
    await expect(exerciseRow.getByRole('checkbox', { name: 'Select row' })).not.toBeChecked()
  })

  test('Delete/archive test exercise through confirmation', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const exercisesApiState = await mockAdminExercisesShellData(page)

    await gotoExercisesWorkflow(page, ADMIN_EXERCISES_DELETE_ARCHIVE_TEST_EXERCISE_WORKFLOW_CHECK)

    const exerciseRow = page.getByRole('row', { name: /Test Workflow Exercise Fixture/ })
    await expect(exerciseRow).toBeVisible()

    await exerciseRow.getByRole('checkbox', { name: 'Select row' }).check()
    await page.getByRole('button', { name: 'Exercise bulk actions' }).click()
    await page.getByRole('menuitem', { name: 'Archive' }).click()

    const archiveDialog = page.getByRole('dialog', { name: 'Archive exercises' })
    await expect(archiveDialog).toBeVisible()
    await expect(archiveDialog).toContainText('Archive selected exercises so they stay out of the active library without being permanently deleted.')
    await expect(archiveDialog).toContainText('1 exercise selected')
    await expect(archiveDialog).toContainText('1 will be archived')
    await expect(archiveDialog).toContainText('Test Workflow Exercise Fixture')
    await archiveDialog.getByRole('button', { name: 'Archive exercises' }).click()

    await expect(archiveDialog).toBeHidden()
    await expect(exerciseRow).toBeVisible()
    await expect(exerciseRow.getByRole('checkbox', { name: 'Select row' })).not.toBeChecked()
    expect(exercisesApiState.archivedExerciseRequests).toHaveLength(1)
    expect(exercisesApiState.archivedExerciseRequests[0]).toMatchObject({
      id: 'exercise-1',
      name: 'Test Workflow Exercise Fixture',
      status: 'archived',
    })

    await page.getByRole('button', { name: 'Open menu' }).first().click()
    await page.getByRole('menuitem', { name: 'Delete' }).click()

    const deleteDialog = page.getByRole('dialog', { name: 'Delete exercise' })
    await expect(deleteDialog).toBeVisible()
    await expect(deleteDialog).toContainText('This exercise will be permanently deleted.')
    await expect(deleteDialog).toContainText('1 exercise selected')
    await expect(deleteDialog).toContainText('This cannot be undone.')
    await expect(deleteDialog).toContainText('Test Workflow Exercise Fixture')
    await deleteDialog.getByRole('button', { name: 'Delete exercise' }).click()

    await expect(deleteDialog).toBeHidden()
    await expect(page.getByRole('row', { name: /Test Workflow Exercise Fixture/ })).toHaveCount(0)
    expect(exercisesApiState.deletedExerciseRequests).toEqual(['exercise-1'])
  })

  test('Attach direct MP4 media URL', async ({ page }) => {
    await seedAdminBrowserSession(page)
    const exercisesApiState = await mockAdminExercisesShellData(page)

    await gotoExercisesWorkflow(page, ADMIN_EXERCISES_ATTACH_DIRECT_MP4_MEDIA_URL_WORKFLOW_CHECK)

    await page.getByRole('button', { name: 'Open menu' }).first().click()
    await page.getByRole('menuitem', { name: 'Edit' }).click()
    await expect(page.getByRole('heading', { name: 'Edit exercise' })).toBeVisible()

    await page.getByLabel('MP4 media URL').fill(testMp4MediaUrl)
    await expect(page.locator('.admin-shell-exercises-media-preview')).toBeVisible()
    await page.getByRole('button', { name: /Medias preview/ }).click()
    await expect(page.locator('video source[type="video/mp4"]')).toHaveAttribute('src', testMp4MediaUrl)
    await expect(page.getByRole('link', { name: /Open/ })).toHaveAttribute('href', testMp4MediaUrl)

    await page.getByRole('button', { name: 'Save changes' }).click()

    await expect(page.getByRole('cell', { name: 'Test Workflow Exercise Fixture' })).toBeVisible()
    expect(exercisesApiState.directMp4MediaUrlRequests).toHaveLength(1)
    expect(exercisesApiState.directMp4MediaUrlRequests[0]).toMatchObject({
      videoUrl: testMp4MediaUrl,
    })
  })
})
