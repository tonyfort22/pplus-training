import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile program sheet inner cards use the same dark card background family as the rest of the app', () => {
  const sheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'), 'utf8')

  assert.match(sheetSource, /ProgramSheetWeekCard/)
  assert.match(sheetSource, /model\.routines\.map/)
  assert.doesNotMatch(sheetSource, /bg-slate-800 p-\[18px\]/)
  assert.doesNotMatch(sheetSource, /bg-slate-800 px-4/)
  assert.doesNotMatch(sheetSource, /bg-slate-900 p-\[18px\]/)
  assert.doesNotMatch(sheetSource, /bg-slate-900 px-4/)
  assert.match(sheetSource, /bg-\[#111827\] p-\[18px\]/)
  assert.match(sheetSource, /bg-\[#111827\] px-4/)
})
