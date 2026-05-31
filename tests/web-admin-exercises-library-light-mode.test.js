import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const exercisesDataTablePath = resolve(repoRoot, 'apps/web/components/admin/exercises-data-table.jsx')
const exercisesLibraryViewPath = resolve(repoRoot, 'apps/web/components/admin/exercises-library-view.jsx')
const exerciseEditorDialogPath = resolve(repoRoot, 'apps/web/components/admin/exercise-editor-dialog.jsx')
const adminExerciseRepositoryPath = resolve(repoRoot, 'apps/web/lib/admin-exercise-repository.js')

test('exercise library uses admin light-mode controls and direct Supabase mp4 video URLs', () => {
  const tableSource = readFileSync(exercisesDataTablePath, 'utf8')
  const viewSource = readFileSync(exercisesLibraryViewPath, 'utf8')
  const repositorySource = readFileSync(adminExerciseRepositoryPath, 'utf8')

  assert.match(viewSource, /admin-shell-exercises-library-view/)
  assert.match(viewSource, /admin-shell-athletes-page-title/)
  assert.match(tableSource, /admin-shell-athletes-filter-trigger/)
  assert.match(tableSource, /admin-shell-athletes-pagination-bar/)
  assert.match(tableSource, /admin-shell-athletes-page-size-select/)
  assert.match(tableSource, /admin-shell-athletes-empty-state/)
  assert.match(tableSource, /Create exercise/)

  assert.match(repositorySource, /'thumbnail_url'/)
  assert.match(repositorySource, /'video_url'/)
  assert.match(repositorySource, /normalizeDirectExerciseVideoUrl/)
  assert.match(repositorySource, /input\?\.video_url/)
  assert.match(repositorySource, /bucket:\s*'exercise-videos'/)
  assert.match(repositorySource, /contentType:\s*normalizedUpload\.contentType \|\| contentType \|\| 'video\/mp4'/)
  assert.doesNotMatch(tableSource, /youtube\.com|youtu\.be|YouTube|youtube/i)

  assert.doesNotMatch(tableSource, /className="rounded-\[12px\] min-h-\[40px\] !border !border-\[#24334A\] bg-transparent text-\[#DCE6F8\]/)
  assert.doesNotMatch(tableSource, /className="h-9 w-\[76px\] rounded-\[10px\] !border-\[#24334A\] bg-\[#111D30\]/)
  assert.doesNotMatch(tableSource, /className="h-24 text-center text-\[#8EA0BC\]"/)
})

test('exercise editor dialog seam uses admin theme tokens instead of hard-coded dark colors', () => {
  const dialogSource = readFileSync(exerciseEditorDialogPath, 'utf8')

  assert.match(dialogSource, /DialogContent[\s\S]*?var\(--admin-dashboard-card-bg\)/)
  assert.match(dialogSource, /DialogContent[\s\S]*?var\(--admin-dashboard-card-border\)/)
  assert.match(dialogSource, /DialogContent[\s\S]*?var\(--admin-dashboard-card-text\)/)
  assert.match(dialogSource, /FieldInput[\s\S]*?var\(--admin-dashboard-control-bg\)/)
  assert.match(dialogSource, /FieldInput[\s\S]*?var\(--admin-dashboard-card-muted\)/)
  assert.match(dialogSource, /Textarea[\s\S]*?var\(--admin-dashboard-control-bg\)/)

  assert.doesNotMatch(dialogSource, /border-\[#24334A\]|bg-\[#0F1728\]|bg-\[#111D30\]|text-\[#DCE6F8\]|text-\[#EEF4FF\]|placeholder:text-\[#70809E\]/)
})
