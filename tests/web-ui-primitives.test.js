import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sharedUiDir = resolve(repoRoot, 'apps/web/components/ui')

const componentPaths = {
  button: resolve(sharedUiDir, 'button.jsx'),
  badge: resolve(sharedUiDir, 'badge.jsx'),
  input: resolve(sharedUiDir, 'input.jsx'),
  select: resolve(sharedUiDir, 'select.jsx'),
  textarea: resolve(sharedUiDir, 'textarea.jsx'),
  checkbox: resolve(sharedUiDir, 'checkbox.jsx'),
  radio: resolve(sharedUiDir, 'radio.jsx'),
  switch: resolve(sharedUiDir, 'switch.jsx'),
  avatar: resolve(sharedUiDir, 'avatar.jsx'),
}

test('phase 2 shared ui primitives exist with simple api seams', () => {
  for (const path of Object.values(componentPaths)) {
    assert.ok(existsSync(path), `expected shared primitive to exist: ${path}`)
  }

  const buttonSource = readFileSync(componentPaths.button, 'utf8')
  const badgeSource = readFileSync(componentPaths.badge, 'utf8')
  const inputSource = readFileSync(componentPaths.input, 'utf8')
  const selectSource = readFileSync(componentPaths.select, 'utf8')
  const textareaSource = readFileSync(componentPaths.textarea, 'utf8')
  const checkboxSource = readFileSync(componentPaths.checkbox, 'utf8')
  const radioSource = readFileSync(componentPaths.radio, 'utf8')
  const switchSource = readFileSync(componentPaths.switch, 'utf8')
  const avatarSource = readFileSync(componentPaths.avatar, 'utf8')

  assert.match(buttonSource, /function Button\(/)
  assert.match(buttonSource, /export \{ Button, buttonVariants \}/)
  assert.match(buttonSource, /variant\s*=\s*"default"/)
  assert.match(buttonSource, /size\s*=\s*"default"/)
  assert.match(buttonSource, /default:/)
  assert.match(buttonSource, /outline:/)
  assert.match(buttonSource, /secondary:/)
  assert.match(buttonSource, /ghost:/)
  assert.match(buttonSource, /destructive:/)
  assert.match(buttonSource, /"icon-sm"/)

  assert.match(badgeSource, /export default function Badge/)
  assert.match(badgeSource, /tone\s*=\s*'neutral'/)
  assert.match(badgeSource, /neutral/)
  assert.match(badgeSource, /success/)
  assert.match(badgeSource, /warning/)
  assert.match(badgeSource, /danger/)

  assert.match(inputSource, /function Input\(/)
  assert.match(inputSource, /export \{ Input \}/)
  assert.match(inputSource, /data-slot="input"/)
  assert.match(selectSource, /function SelectTrigger\(/)
  assert.match(selectSource, /function SelectContent\(/)
  assert.match(selectSource, /export \{/)
  assert.match(textareaSource, /export default function Textarea/)
  assert.match(textareaSource, /ui-textarea/)

  assert.match(checkboxSource, /export default function Checkbox/)
  assert.match(checkboxSource, /type="checkbox"/)
  assert.match(radioSource, /export default function Radio/)
  assert.match(radioSource, /type="radio"/)
  assert.match(switchSource, /export default function Switch/)
  assert.match(switchSource, /pressed/)
  assert.match(switchSource, /onCheckedChange|onChange/)

  assert.match(avatarSource, /export default function Avatar/)
  assert.match(avatarSource, /initials/)
  assert.match(avatarSource, /src/)
})
