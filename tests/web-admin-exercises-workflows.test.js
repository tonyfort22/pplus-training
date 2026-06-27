import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import test from 'node:test'

import {
  WEB_BROWSER_SMOKE_HARNESS,
  WEB_TEST_LAYERS,
} from '../apps/web/testing/page-test-manifest.js'

const repoRoot = process.cwd()
const exercisesWorkflowSpecPath = 'apps/web/e2e/admin-exercises-workflows.spec.js'
const exercisesWorkflowSpecFullPath = join(repoRoot, exercisesWorkflowSpecPath)

test('admin Exercises workflow manifest includes create, edit, media, export, and delete/archive L6 checks', () => {
  assert.equal(WEB_BROWSER_SMOKE_HARNESS.adminExercisesSafeWorkflowSpecFile, exercisesWorkflowSpecPath)
  assert.deepEqual(WEB_BROWSER_SMOKE_HARNESS.adminExercisesSafeWorkflowChecks, [
    {
      id: 'admin-exercises-create-test-exercise',
      route: '/admin/exercises',
      interaction: 'create-exercise-submits-mocked-post-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-exercises-edit-test-exercise',
      route: '/admin/exercises',
      interaction: 'edit-exercise-submits-mocked-patch-and-refreshes-table',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-exercises-attach-direct-mp4-media-url',
      route: '/admin/exercises',
      interaction: 'attach-direct-mp4-url-displays-media-preview-and-saves-patch',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-exercises-export-exercises-csv-review-download',
      route: '/admin/exercises',
      interaction: 'export-exercises-opens-review-sheet-and-downloads-csv',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
    {
      id: 'admin-exercises-delete-archive-test-exercise-through-confirmation',
      route: '/admin/exercises',
      interaction: 'archive-and-delete-exercises-through-confirmation-dialogs',
      layer: WEB_TEST_LAYERS.SAFE_WORKFLOW,
    },
  ])
})

test('admin Exercises create test exercise workflow is browser-safe and mocked', () => {
  assert.equal(existsSync(exercisesWorkflowSpecFullPath), true, `missing Exercises workflow spec: ${exercisesWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(exercisesWorkflowSpecFullPath, 'utf8')

  assert.match(workflowSpecSource, /ADMIN_EXERCISES_CREATE_TEST_EXERCISE_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-exercises-create-test-exercise/)
  assert.match(workflowSpecSource, /Create test exercise/)
  assert.match(workflowSpecSource, /create-exercise-submits-mocked-post-and-refreshes-table/)
  assert.match(workflowSpecSource, /WEB_TEST_LAYERS\.SAFE_WORKFLOW/)
  assert.match(workflowSpecSource, /page\.route\(['"]\*\*\/api\/admin\/exercises\*\*['"]/)
  assert.match(workflowSpecSource, /request\.method\(\) === 'POST'/)
  assert.match(workflowSpecSource, /createdExerciseRequests/)
  assert.match(workflowSpecSource, /Test Workflow Exercise/)
  assert.match(workflowSpecSource, /Created by the safe Exercises workflow\./)
  assert.match(workflowSpecSource, /sets:\s*'4'/)
  assert.match(workflowSpecSource, /reps:\s*'8'/)
  assert.match(workflowSpecSource, /duration:\s*'30 sec'/)
  assert.match(workflowSpecSource, /rest:\s*'60 sec'/)
  assert.match(workflowSpecSource, /status:\s*'draft'/)
  assert.match(workflowSpecSource, /await page\.getByRole\(['"]button['"], \{ name: 'Create exercise' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Name['"]\)\.fill\(['"]Test Workflow Exercise['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Sets['"]\)\.fill\(['"]4['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Reps['"]\)\.fill\(['"]8['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Duration['"]\)\.fill\(['"]30 sec['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Rest['"]\)\.fill\(['"]60 sec['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Description['"]\)\.fill\(['"]Created by the safe Exercises workflow\.['"]\)/)
  assert.match(workflowSpecSource, /expect\(exercisesApiState\.createdExerciseRequests\)\.toHaveLength\(1\)/)
})

test('admin Exercises edit test exercise workflow is browser-safe and mocked', () => {
  assert.equal(existsSync(exercisesWorkflowSpecFullPath), true, `missing Exercises workflow spec: ${exercisesWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(exercisesWorkflowSpecFullPath, 'utf8')

  assert.match(workflowSpecSource, /ADMIN_EXERCISES_EDIT_TEST_EXERCISE_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-exercises-edit-test-exercise/)
  assert.match(workflowSpecSource, /Edit test exercise/)
  assert.match(workflowSpecSource, /edit-exercise-submits-mocked-patch-and-refreshes-table/)
  assert.match(workflowSpecSource, /request\.method\(\) === 'PATCH'/)
  assert.match(workflowSpecSource, /updatedExerciseRequests/)
  assert.match(workflowSpecSource, /Updated Workflow Exercise/)
  assert.match(workflowSpecSource, /Updated by the safe Exercises workflow\./)
  assert.match(workflowSpecSource, /expect\(request\.url\(\)\)\.toContain\('\/api\/admin\/exercises\/exercise-1'\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: 'Open menu' \}\)\.first\(\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: 'Edit' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Name['"]\)\.fill\(['"]Updated Workflow Exercise['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Sets['"]\)\.fill\(['"]5['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Reps['"]\)\.fill\(['"]10['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Duration['"]\)\.fill\(['"]45 sec['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Rest['"]\)\.fill\(['"]75 sec['"]\)/)
  assert.match(workflowSpecSource, /getByLabel\(['"]Description['"]\)\.fill\(['"]Updated by the safe Exercises workflow\.['"]\)/)
  assert.match(workflowSpecSource, /expect\(exercisesApiState\.updatedExerciseRequests\)\.toHaveLength\(1\)/)
})

test('admin Exercises direct MP4 media URL workflow displays the attached video preview and saves the URL', () => {
  assert.equal(existsSync(exercisesWorkflowSpecFullPath), true, `missing Exercises workflow spec: ${exercisesWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(exercisesWorkflowSpecFullPath, 'utf8')
  const editorSource = readFileSync(join(repoRoot, 'apps/web/components/admin/exercise-editor-dialog.jsx'), 'utf8')

  assert.match(workflowSpecSource, /ADMIN_EXERCISES_ATTACH_DIRECT_MP4_MEDIA_URL_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-exercises-attach-direct-mp4-media-url/)
  assert.match(workflowSpecSource, /Attach direct MP4 media URL/)
  assert.match(workflowSpecSource, /attach-direct-mp4-url-displays-media-preview-and-saves-patch/)
  assert.match(workflowSpecSource, /const testMp4MediaUrl = 'https:\/\/example\.supabase\.co\/storage\/v1\/object\/public\/exercise-videos\/exercise-1\/test-workflow-media\.mp4'/)
  assert.match(workflowSpecSource, /getByLabel\(['"]MP4 media URL['"]\)\.fill\(testMp4MediaUrl\)/)
  assert.match(workflowSpecSource, /locator\(['"]\.admin-shell-exercises-media-preview['"]\)/)
  assert.match(workflowSpecSource, /locator\(['"]video source\[type="video\/mp4"\]['"]\)/)
  assert.match(workflowSpecSource, /toHaveAttribute\(['"]src['"], testMp4MediaUrl\)/)
  assert.match(workflowSpecSource, /videoUrl:\s*testMp4MediaUrl/)
  assert.match(workflowSpecSource, /expect\(exercisesApiState\.directMp4MediaUrlRequests\)\.toHaveLength\(1\)/)

  assert.match(editorSource, /htmlFor="exercise-video-url"[\s\S]*MP4 media URL/)
  assert.match(editorSource, /id="exercise-video-url"[\s\S]*value=\{values\.videoUrl \|\| ''\}/)
  assert.match(editorSource, /placeholder="https:\/\/.*\.mp4"/)
  assert.match(editorSource, /onChange=\{\(value\) => updateField\('videoUrl', value\)\}/)
})

test('admin Exercises export CSV workflow opens the review sheet and downloads selected exercise data', () => {
  assert.equal(existsSync(exercisesWorkflowSpecFullPath), true, `missing Exercises workflow spec: ${exercisesWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(exercisesWorkflowSpecFullPath, 'utf8')
  const tableSource = readFileSync(join(repoRoot, 'apps/web/components/admin/exercises-data-table.jsx'), 'utf8')

  assert.match(workflowSpecSource, /ADMIN_EXERCISES_EXPORT_EXERCISES_CSV_REVIEW_DOWNLOAD_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-exercises-export-exercises-csv-review-download/)
  assert.match(workflowSpecSource, /Export exercises CSV review\/download path/)
  assert.match(workflowSpecSource, /export-exercises-opens-review-sheet-and-downloads-csv/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: 'Export exercises' \}\)/)
  assert.match(workflowSpecSource, /Review the selected exercises before downloading a CSV export\./)
  assert.match(workflowSpecSource, /Selected exercise preview/)
  assert.match(workflowSpecSource, /page\.waitForEvent\(['"]download['"]\)/)
  assert.match(workflowSpecSource, /suggestedFilename\(\)\)\.toMatch\(\/\^pplus-exercises-export-/)
  assert.match(workflowSpecSource, /readFile\(downloadedPath, 'utf8'\)/)
  assert.match(workflowSpecSource, /\"Exercise ID\",\"Exercise name\",\"Description\"/)
  assert.match(workflowSpecSource, /\"exercise-1\",\"Test Workflow Exercise Fixture\"/)

  assert.match(tableSource, /function handleExportSelectedExercises\(\)[\s\S]*setSelectedExportExerciseIds\(selectedExerciseRows\.map\(\(exercise\) => exercise\.id\)\.filter\(Boolean\)\)/)
  assert.match(tableSource, /SheetTitle>Export exercises<\/SheetTitle>/)
  assert.match(tableSource, /Review the selected exercises before downloading a CSV export\./)
  assert.match(tableSource, /exerciseExportColumns\.map\(\(column\) =>/)
  assert.match(tableSource, /handleConfirmExportExercises/)
  assert.match(tableSource, /buildExercisesExportCsv\(exportExercisesToReview\)/)
  assert.match(tableSource, /downloadExercisesExportFile\(\{[\s\S]*fileName: exportExercisesFileName/)
  assert.match(tableSource, /table\.resetRowSelection\(\)/)
})

test('admin Exercises delete/archive workflow uses confirmation dialogs before mocked mutations', () => {
  assert.equal(existsSync(exercisesWorkflowSpecFullPath), true, `missing Exercises workflow spec: ${exercisesWorkflowSpecPath}`)

  const workflowSpecSource = readFileSync(exercisesWorkflowSpecFullPath, 'utf8')
  const tableSource = readFileSync(join(repoRoot, 'apps/web/components/admin/exercises-data-table.jsx'), 'utf8')
  const archiveDialogSource = readFileSync(join(repoRoot, 'apps/web/components/admin/exercise-archive-dialog.jsx'), 'utf8')
  const deleteDialogSource = readFileSync(join(repoRoot, 'apps/web/components/admin/exercise-delete-dialog.jsx'), 'utf8')

  assert.match(workflowSpecSource, /ADMIN_EXERCISES_DELETE_ARCHIVE_TEST_EXERCISE_WORKFLOW_CHECK/)
  assert.match(workflowSpecSource, /admin-exercises-delete-archive-test-exercise-through-confirmation/)
  assert.match(workflowSpecSource, /Delete\/archive test exercise through confirmation/)
  assert.match(workflowSpecSource, /archive-and-delete-exercises-through-confirmation-dialogs/)
  assert.match(workflowSpecSource, /archivedExerciseRequests/)
  assert.match(workflowSpecSource, /deletedExerciseRequests/)
  assert.match(workflowSpecSource, /request\.method\(\) === 'DELETE'/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: 'Archive exercises' \}\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]dialog['"], \{ name: 'Delete exercise' \}\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: 'Archive' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]menuitem['"], \{ name: 'Delete' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: 'Archive exercises' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /getByRole\(['"]button['"], \{ name: 'Delete exercise' \}\)\.click\(\)/)
  assert.match(workflowSpecSource, /expect\(exercisesApiState\.archivedExerciseRequests\)\.toHaveLength\(1\)/)
  assert.match(workflowSpecSource, /expect\(exercisesApiState\.deletedExerciseRequests\)\.toEqual\(\['exercise-1'\]\)/)

  assert.match(tableSource, /function handleArchiveSelectedExercises\(\)[\s\S]*setSelectedArchiveExerciseIds\(selectedExerciseRows\.map\(\(exercise\) => exercise\.id\)\.filter\(Boolean\)\)[\s\S]*setIsArchiveExerciseDialogOpen\(true\)/)
  assert.match(tableSource, /function handleDeleteSelectedExercises\(\)[\s\S]*setSelectedDeleteExerciseIds\(selectedExerciseRows\.map\(\(exercise\) => exercise\.id\)\.filter\(Boolean\)\)[\s\S]*setIsExerciseDeleteDialogOpen\(true\)/)
  assert.match(tableSource, /<ExerciseArchiveDialog[\s\S]*onConfirm=\{handleConfirmArchiveExercises\}/)
  assert.match(tableSource, /<ExerciseDeleteDialog[\s\S]*onConfirmDelete=\{handleDeleteExercise\}/)

  assert.match(archiveDialogSource, /<DialogTitle>Archive exercises<\/DialogTitle>/)
  assert.match(archiveDialogSource, /Archived exercises can be restored later from archived status\./)
  assert.match(deleteDialogSource, /<DialogTitle>\{isBulkDelete \? 'Delete exercises' : 'Delete exercise'\}<\/DialogTitle>/)
  assert.match(deleteDialogSource, /This cannot be undone\./)
})
