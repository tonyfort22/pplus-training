import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile program sheet schedule rows place the day label in a left rail with uppercase typography and keep the rest of the row theme-driven', () => {
  const sheetSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'),
    'utf8'
  )
  const primitivesSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/ui/primitives.js'),
    'utf8'
  )

  assert.match(sheetSource, /className=\"w-10 shrink-0 pr-2\"[\s\S]*text-\[11px\] font-semibold uppercase[\s\S]*color: theme\.textSoft[\s\S]*\{entry\.dayLabel\}/)
  assert.match(primitivesSource, /status === 'upcoming'[\s\S]*borderColor: theme\.borderStrong[\s\S]*backgroundColor: theme\.surface[\s\S]*iconColor: theme\.textSoft/)
  assert.match(sheetSource, /entry\.status === 'rest' \? \([\s\S]*\) : \([\s\S]*className=\"flex-1\"[\s\S]*text-\[14px\] font-semibold[\s\S]*\{entry\.workoutLabel\}/)
  assert.match(sheetSource, /entry\.durationLabel \? <Text className=\"text-\[12px\] font-medium\" style=\{\{ color: theme\.textSoft \}\}>\{entry\.durationLabel\}<\/Text> : null/)
  assert.match(sheetSource, /entry\.durationLabel \?[\s\S]*<ProgramSheetStatusBadge status=\{entry\.status\} theme=\{theme\} testID=\{`program-sheet-status-checkbox-\$\{entry\.id\}`\} \/>/)
  assert.doesNotMatch(sheetSource, /\{entry\.dayLabel\} • \{entry\.durationLabel\}/)
  assert.match(sheetSource, /<Pressable className=\"flex-1\"[\s\S]*\{entry\.workoutLabel\}<\/Text>\n\s*<\/Pressable>/)
})

test('mobile program sheet rest rows keep the day label on the left and render a centered rest-day divider treatment', () => {
  const sheetSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'),
    'utf8'
  )

  assert.match(sheetSource, /entry\.status === 'rest' \? \([\s\S]*className=\"flex-1 flex-row items-center gap-3\"/)
  assert.match(sheetSource, /const restDividerColor = entry\.isProgramEnd \? theme\.accent : theme\.borderStrong/)
  assert.match(sheetSource, /const restTextColor = entry\.isProgramEnd \? theme\.accentText : theme\.textSoft/)
  assert.match(sheetSource, /const restLabel = entry\.isProgramEnd \? 'Program End' : 'Rest Day'/)
  assert.match(sheetSource, /className=\"h-px flex-1\" style=\{\{ backgroundColor: restDividerColor \}\} \/>/)
  assert.match(sheetSource, /className=\"text-\[11px\] font-semibold\" style=\{\{ color: restTextColor \}\}>\{restLabel\}<\/Text>/)
  assert.match(sheetSource, /entry\.status === 'rest' \? \([\s\S]*restLabel[\s\S]*\) : \(/)
})

test('mobile program sheet schedule rows do not draw divider lines between days', () => {
  const sheetSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'),
    'utf8'
  )

  assert.doesNotMatch(sheetSource, /function ProgramSheetWeekCard[\s\S]*borderBottomWidth: 1[\s\S]*function ProgramSheetContent/)
  assert.doesNotMatch(sheetSource, /function ProgramSheetWeekCard[\s\S]*borderBottomColor: theme\.border[\s\S]*function ProgramSheetContent/)
})
