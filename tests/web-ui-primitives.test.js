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

  assert.match(buttonSource, /export default function Button/)
  assert.match(buttonSource, /variant\s*=\s*'primary'/)
  assert.match(buttonSource, /size\s*=\s*'default'/)
  assert.match(buttonSource, /primary/)
  assert.match(buttonSource, /secondary/)
  assert.match(buttonSource, /ghost/)
  assert.match(buttonSource, /danger/)
  assert.match(buttonSource, /compact/)
  assert.match(buttonSource, /prominent/)

  assert.match(badgeSource, /export default function Badge/)
  assert.match(badgeSource, /tone\s*=\s*'neutral'/)
  assert.match(badgeSource, /neutral/)
  assert.match(badgeSource, /success/)
  assert.match(badgeSource, /warning/)
  assert.match(badgeSource, /danger/)

  assert.match(inputSource, /export default function Input/)
  assert.match(inputSource, /ui-input/)
  assert.match(selectSource, /export default function Select/)
  assert.match(selectSource, /ui-select/)
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
