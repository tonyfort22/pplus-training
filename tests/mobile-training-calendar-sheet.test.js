import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile app shell opens a dedicated training calendar screen from the top-right header icon', () => {
  const appSource = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8')
  const shellSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'), 'utf8')

  assert.match(appSource, /const \[isTrainingCalendarOpen, setIsTrainingCalendarOpen\] = useState\(false\);/)
  assert.match(appSource, /const trainingCalendarModel = useMemo\(/)
  assert.match(appSource, /<TrainingCalendarSheet[\s\S]*isVisible=\{isTrainingCalendarOpen\}/)
  assert.match(shellSource, /onUtilityHeaderPress/)
  assert.match(shellSource, /<Pressable style=\{styles\.brandIconButton\} onPress=\{onUtilityHeaderPress\}>/)
})

test('mobile training calendar screen matches the calendar reference structure', () => {
  const sheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/training-calendar-sheet.js'), 'utf8')
  const modelSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/training-calendar-models.js'), 'utf8')

  assert.match(sheetSource, /Training Calendar/)
  assert.match(sheetSource, /Load more/)
  assert.match(sheetSource, /WeekBadge/)
  assert.match(sheetSource, /TrainingCalendarDayRow/)
  assert.match(sheetSource, /Rest Day/)
  assert.match(sheetSource, /Check/)
  assert.match(sheetSource, /X/)
  assert.match(sheetSource, /ChevronLeft/)
  assert.match(sheetSource, /Modal/)
  assert.match(sheetSource, /Back/)
  assert.match(sheetSource, /w-\[84px\]/)
  assert.match(sheetSource, /justify-start/)
  assert.match(sheetSource, /w-\[52px\] items-center/)
  assert.match(sheetSource, /text-center text-\[20px\] font-semibold text-white/)
  assert.match(sheetSource, /useSafeAreaInsets/)
  assert.match(sheetSource, /SafeAreaProvider/)
  assert.match(sheetSource, /function TrainingCalendarSheetContent\(\{ onClose, model \}\)/)
  assert.match(sheetSource, /const insets = useSafeAreaInsets\(\)/)
  assert.match(sheetSource, /paddingTop: Math\.max\(insets\.top, 16\)/)
  assert.match(sheetSource, /export function TrainingCalendarSheet\(\{ isVisible, onClose, model \}\)/)
  assert.match(sheetSource, /Pressable className="w-\[84px\] flex-row items-center justify-start gap-2 rounded-\[14px\] border border-\[#243041\] bg-\[#111827\] px-3 py-2 focus:outline-none" onPress=\{onClose\}/)
  assert.match(sheetSource, /SafeAreaView className="flex-1 bg-\[#0b1220\]"/)
  assert.match(sheetSource, /bg-\[#111827\]/)
  assert.match(sheetSource, /border-\[#243041\]/)
  assert.doesNotMatch(sheetSource, /bg-\[#1f1f2b\]/)
  assert.doesNotMatch(sheetSource, /bg-\[#2c2e3a\]/)
  assert.doesNotMatch(sheetSource, /bg-\[#2a2c37\]/)

  assert.match(modelSource, /getTrainingCalendarModel/)
  assert.match(modelSource, /Apr 5 - Apr 11/)
  assert.match(modelSource, /Apr 12 - Apr 18/)
  assert.match(modelSource, /Rest Day/)
  assert.match(modelSource, /weekLabel: 'Week 1'/)
})
