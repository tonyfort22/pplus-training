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

  assert.match(sheetSource, /className=\"w-12 shrink-0 pr-2\"[\s\S]*text-\[14px\] font-semibold uppercase[\s\S]*color: theme\.textSoft[\s\S]*\{entry\.dayLabel\}/)
  assert.match(primitivesSource, /status === 'upcoming'[\s\S]*borderColor: theme\.borderStrong[\s\S]*backgroundColor: theme\.surface[\s\S]*iconColor: theme\.textSoft/)
  assert.match(sheetSource, /entry\.status === 'rest' \? \([\s\S]*\) : \([\s\S]*className=\"flex-1 gap-1\"[\s\S]*\{entry\.workoutLabel\}/)
  assert.match(sheetSource, /entry\.status === 'rest' \? \([\s\S]*\) : \([\s\S]*className=\"text-\[14px\]\" style=\{\{ color: theme\.textSoft \}\}>\{entry\.durationLabel\}<\/Text>/)
  assert.match(sheetSource, /entry\.status === 'rest' \? \([\s\S]*\) : \([\s\S]*<ProgramSheetStatusBadge status=\{entry\.status\} theme=\{theme\} \/>/)
  assert.doesNotMatch(sheetSource, /\{entry\.dayLabel\} • \{entry\.durationLabel\}/)
})

test('mobile program sheet rest rows keep the day label on the left and render a centered rest-day divider treatment', () => {
  const sheetSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'),
    'utf8'
  )

  assert.match(sheetSource, /entry\.status === 'rest' \? \([\s\S]*className=\"flex-1 flex-row items-center gap-3\"/)
  assert.match(sheetSource, /entry\.status === 'rest' \? \([\s\S]*className=\"h-px flex-1\" style=\{\{ backgroundColor: theme\.borderStrong \}\} \/>/)
  assert.match(sheetSource, /entry\.status === 'rest' \? \([\s\S]*className=\"text-xs font-semibold\" style=\{\{ color: theme\.textSoft \}\}>Rest Day<\/Text>/)
  assert.match(sheetSource, /entry\.status === 'rest' \? \([\s\S]*Rest Day[\s\S]*\) : \(/)
})

test('mobile program sheet schedule rows do not draw divider lines between days', () => {
  const sheetSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'),
    'utf8'
  )

  assert.doesNotMatch(sheetSource, /function ProgramSheetWeekCard[\s\S]*borderBottomWidth: 1[\s\S]*function ProgramSheetContent/)
  assert.doesNotMatch(sheetSource, /function ProgramSheetWeekCard[\s\S]*borderBottomColor: theme\.border[\s\S]*function ProgramSheetContent/)
})
