import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile program sheet uses a shared primitive for the smaller workout status checkbox instead of a local hardcoded box', () => {
  const sheetSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'), 'utf8')
  const primitivesSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/ui/primitives.js'), 'utf8')

  assert.match(primitivesSource, /export function AppStatusIconBadge\(/)
  assert.match(primitivesSource, /size = 'md'/)
  assert.match(primitivesSource, /size === 'sm'/)
  assert.match(sheetSource, /from '\.\.\/ui\/primitives\.js'/)
  assert.match(sheetSource, /AppStatusIconBadge/)
  assert.match(sheetSource, /return <AppStatusIconBadge status=\{status\} theme=\{theme\} size="sm" \/>/)
  assert.match(sheetSource, /function ProgramSheetStatusBadge/)
  assert.doesNotMatch(sheetSource, /h-10 w-10 items-center justify-center rounded-\[12px\]/)
})
