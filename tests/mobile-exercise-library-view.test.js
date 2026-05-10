import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('shared exercise library view reuses the app exercise screen shell, selected section, list rows, bottom search bar, and primary action seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/exercise-library-view.js'), 'utf8')

  assert.match(source, /export function ExerciseLibraryView\(/)
  assert.match(source, /AppSheetHeader/)
  assert.match(source, /AppSearchInput/)
  assert.match(source, /AppNoticeCard/)
  assert.match(source, /AppSelectionIndicator/)
  assert.match(source, /AppButton/)
  assert.match(source, /AppSurfaceCard/)
  assert.match(source, /title = 'Exercises'/)
  assert.match(source, /searchPlaceholder = 'Search or Create Exercises'/)
  assert.match(source, /selectedSectionTitle = ''/)
  assert.match(source, /selectedSectionHelperText = ''/)
  assert.match(source, /showSelectedSection = false/)
  assert.match(source, /selectable = false/)
  assert.match(source, /primaryActionLabel = ''/)
  assert.match(source, /<AppSheetHeader theme=\{resolvedTheme\} title=\{title\} onBack=\{onBack\} \/>/)
  assert.match(source, /showSelectedSection \? \(/)
  assert.match(source, /<AppSurfaceCard key=\{exercise\.id\} theme=\{resolvedTheme\} contentClassName="flex-row items-center gap-3 px-4 py-4"/)
  assert.match(source, /placeholder=\{searchPlaceholder\}/)
  assert.match(source, /onPress=\{onPrimaryAction\}/)
  assert.match(source, /label=\{primaryActionLabel\}/)
  assert.match(source, /const isSelected = selectable && selectedExerciseIds\.includes\(exercise\.id\)/)
  assert.match(source, /if \(selectable\) \{[\s\S]*onToggleExercise\?\.\(exercise\.id\)/)
  assert.match(source, /return onPressExercise\?\.\(exercise\)/)
  assert.match(source, /absolute inset-x-0 bottom-0 px-5/)
  assert.match(source, /<View className="gap-3">[\s\S]*<AppSearchInput[\s\S]*\{primaryActionLabel \? \([\s\S]*<AppButton/)
  assert.doesNotMatch(source, /exerciseRowSelected/)
})
