import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const layoutPath = resolve(repoRoot, 'apps/web/app/layout.jsx')
const cssPath = resolve(repoRoot, 'apps/web/app/globals.css')
const rulesPath = resolve(repoRoot, 'docs/admin-ui-ruleset.md')
const sharedUiDir = resolve(repoRoot, 'apps/web/components/ui')

test('phase 1 foundations lock the shared web ui-kit base', () => {
  const layoutSource = readFileSync(layoutPath, 'utf8')
  const cssSource = readFileSync(cssPath, 'utf8')
  const rulesSource = readFileSync(rulesPath, 'utf8')

  assert.ok(existsSync(sharedUiDir), 'expected shared apps/web/components/ui directory to exist')

  assert.match(layoutSource, /from 'next\/font\/google'/)
  assert.match(layoutSource, /Geist/)
  assert.match(layoutSource, /className=\{[^}]*geist[^}]*\}/i)
  assert.match(layoutSource, /suppressHydrationWarning/)

  assert.match(cssSource, /:root\s*\{[\s\S]*--ui-font-family:/)
  assert.match(cssSource, /:root\s*\{[\s\S]*--ui-radius-2:/)
  assert.match(cssSource, /:root\s*\{[\s\S]*--ui-space-4:/)
  assert.match(cssSource, /:root\s*\{[\s\S]*--ui-shadow-sm:/)
  assert.match(cssSource, /:root\s*\{[\s\S]*--ui-color-accent:/)
  assert.match(cssSource, /:root\s*\{[\s\S]*--ui-surface-1:/)
  assert.match(cssSource, /:root\s*\{[\s\S]*--ui-border-subtle:/)
  assert.match(cssSource, /:root\s*\{[\s\S]*--ui-focus-ring:/)

  assert.match(cssSource, /html\[data-theme='light'\]\s*\{/)
  assert.match(cssSource, /html\[data-theme='dark'\]\s*\{/)
  assert.match(cssSource, /color-scheme:\s*light;/)
  assert.match(cssSource, /color-scheme:\s*dark;/)

  assert.match(cssSource, /body\s*\{[\s\S]*font-family:\s*var\(--ui-font-family\);/)
  assert.match(cssSource, /body\s*\{[\s\S]*background:\s*var\(--ui-bg\);/)
  assert.match(cssSource, /body\s*\{[\s\S]*color:\s*var\(--ui-fg\);/)

  assert.match(rulesSource, /Geist/i)
  assert.match(rulesSource, /dark \+ light/i)
  assert.match(rulesSource, /green\/teal/i)
  assert.match(rulesSource, /tighter\/systematic/i)
  assert.match(rulesSource, /simple API/i)
  assert.match(rulesSource, /components\/ui/i)
})
