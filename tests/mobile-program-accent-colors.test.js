import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile program card and program sheet use green primary accents instead of purple', () => {
  const cardsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/ui/cards.js'), 'utf8')
  const sheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'), 'utf8')

  assert.match(cardsSource, /bg-emerald-700|bg-emerald-600|bg-emerald-500/)
  assert.doesNotMatch(cardsSource, /bg-violet-700/)
  assert.doesNotMatch(cardsSource, /bg-violet-500/)

  assert.match(sheetSource, /text-emerald-400|text-emerald-500/)
  assert.match(sheetSource, /color="#06D6A0"/)
  assert.match(sheetSource, /bg-emerald-700|bg-emerald-600|bg-emerald-500/)
  assert.doesNotMatch(sheetSource, /#8b5cf6/)
  assert.doesNotMatch(sheetSource, /text-violet-500/)
  assert.doesNotMatch(sheetSource, /bg-violet-700/)
  assert.doesNotMatch(sheetSource, /bg-violet-500/)
})
