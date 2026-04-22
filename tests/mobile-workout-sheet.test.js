import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile app shell owns a dedicated workout sheet opened from workout taps', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
  const trainScreenSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/train-screen-models.js'), 'utf8')

  assert.match(appSource, /const \[isWorkoutSheetOpen, setIsWorkoutSheetOpen\] = useState\(false\);/)
  assert.match(appSource, /const workoutSheetModel = useMemo\(/)
  assert.match(appSource, /if \(targetKey === 'workout'\) \{[\s\S]*setIsWorkoutSheetOpen\(true\)[\s\S]*return/)
  assert.match(appSource, /<WorkoutSheet[\s\S]*isVisible=\{isWorkoutSheetOpen\}/)

  assert.match(trainScreenSource, /targetKey: 'workout'/)
  assert.match(trainScreenSource, /actionPayload: \{ selectedDayId: day.id \}/)
})

test('mobile workout sheet matches the workout preview reference structure and uses NativeWind plus Lucide', () => {
  const sheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/workout-sheet.js'), 'utf8')
  const modelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/workout-sheet-models.js'), 'utf8')

  assert.match(sheetSource, /Start Workout/)
  assert.match(sheetSource, /Edit/)
  assert.match(sheetSource, /WorkoutSheetExerciseBlock/)
  assert.match(sheetSource, /WorkoutSheetSetTable/)
  assert.match(sheetSource, /Clock3/)
  assert.match(sheetSource, /ArrowUpDown/)
  assert.match(sheetSource, /X/)
  assert.match(sheetSource, /className=/)
  assert.match(sheetSource, /SafeAreaProvider/)
  assert.match(sheetSource, /useSafeAreaInsets/)
  assert.doesNotMatch(sheetSource, /<Text style=\{/)

  assert.match(modelSource, /getWorkoutSheetModel/)
  assert.match(modelSource, /summaryItems/)
  assert.match(modelSource, /Start Workout/)
  assert.match(modelSource, /name: exercise.name/)
  assert.match(modelSource, /weightHeader/)
  assert.match(modelSource, /sets: getExerciseSets/)
})
