import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile program sheet labels the routine tile section as Workouts', () => {
  const sheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'), 'utf8')

  assert.match(sheetSource, />Workouts</)
  assert.doesNotMatch(sheetSource, />Routines</)
})
