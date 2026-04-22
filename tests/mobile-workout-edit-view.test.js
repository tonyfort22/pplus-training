import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile workout sheet can open a dedicated workout edit view from the Edit action', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
  const workoutSheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/workout-sheet.js'), 'utf8')

  assert.match(appSource, /const \[isWorkoutEditViewOpen, setIsWorkoutEditViewOpen\] = useState\(false\);/)
  assert.match(appSource, /const workoutEditViewModel = useMemo\(/)
  assert.match(appSource, /<WorkoutEditView[\s\S]*isVisible=\{isWorkoutEditViewOpen\}/)
  assert.match(workoutSheetSource, /onEditWorkout/)
  assert.match(workoutSheetSource, /<Pressable onPress=\{onEditWorkout\}>/)
})

test('mobile workout edit view matches the edit reference structure and uses NativeWind plus Lucide', () => {
  const editViewSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/workout-edit-view.js'), 'utf8')
  const modelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/workout-edit-view-models.js'), 'utf8')

  assert.match(editViewSource, /Cancel/)
  assert.match(editViewSource, /Save/)
  assert.match(editViewSource, /Add notes/)
  assert.match(editViewSource, /Add Notes/)
  assert.match(editViewSource, /Add Set/)
  assert.match(editViewSource, /Link2/)
  assert.match(editViewSource, /Grip/)
  assert.match(editViewSource, /ArrowUpDown/)
  assert.match(editViewSource, /Clock3/)
  assert.match(editViewSource, /Mic/)
  assert.match(editViewSource, /Sparkles/)
  assert.match(editViewSource, /className=/)
  assert.match(editViewSource, /SafeAreaProvider/)
  assert.match(editViewSource, /useSafeAreaInsets/)
  assert.doesNotMatch(editViewSource, /<Text style=\{/) 

  assert.match(editViewSource, /rounded-\[20px\] border border-\[#243041\] bg-\[#111827\]/)
  assert.match(editViewSource, /rounded-\[16px\] border border-indigo-400\/20 bg-\[#312e81\]/)
  assert.match(editViewSource, /border-b border-\[#1f2937\]\/80 py-3/)
  assert.match(editViewSource, /absolute bottom-10 right-5 flex-row items-center overflow-hidden rounded-\[20px\] border border-indigo-400\/20 bg-\[#312e81\]\/95/)
  assert.match(editViewSource, /min-w-\[112px\] justify-center/)
  assert.match(editViewSource, /uppercase tracking-\[1\.6px\]/)

  assert.match(modelSource, /getWorkoutEditViewModel/)
  assert.match(modelSource, /editLabel: 'Save'/)
  assert.match(modelSource, /cancelLabel: 'Cancel'/)
  assert.match(modelSource, /workoutNotesPlaceholder: 'Add notes'/)
  assert.match(modelSource, /exerciseNotesPlaceholder: 'Add Notes'/)
  assert.match(modelSource, /addSetLabel: 'Add Set'/)
})
