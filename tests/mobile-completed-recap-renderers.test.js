import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile shared renderers show badge labels inside body-list rows for completed recap callouts', () => {
  const renderersSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/renderers.js'), 'utf8')

  assert.match(renderersSource, /section\.type === 'body-list'/)
  assert.match(renderersSource, /row\.badgeLabel/)
  assert.match(renderersSource, /row\.actionLabel/)
  assert.match(renderersSource, /text-\[12px\] font-bold uppercase tracking-\[1px\]/)
  assert.match(renderersSource, /styles\.theme\.accentText/)
})
