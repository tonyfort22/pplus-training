import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile program card and program sheet use green primary accents instead of purple', () => {
  const cardsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/ui/cards.js'), 'utf8')
  const sheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'), 'utf8')

  assert.match(cardsSource, /theme\.accent/)
  assert.match(cardsSource, /theme\.accentSoft/)
  assert.doesNotMatch(cardsSource, /bg-violet-700/)
  assert.doesNotMatch(cardsSource, /bg-violet-500/)

  assert.match(sheetSource, /CalendarDays color=\{theme\.accent\}/)
  assert.match(sheetSource, /Dumbbell color=\{theme\.accent\}/)
  assert.match(sheetSource, /color: resolvedTheme\.accent \}/)
  assert.match(sheetSource, /resolvedTheme\.accentSoft/)
  assert.doesNotMatch(sheetSource, /#8b5cf6/)
  assert.doesNotMatch(sheetSource, /text-violet-500/)
  assert.doesNotMatch(sheetSource, /bg-violet-700/)
  assert.doesNotMatch(sheetSource, /bg-violet-500/)
})
