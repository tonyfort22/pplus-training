import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('exercise multi-select view matches shared picker thumbnail and keyboard search behavior', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/exercise-multi-select-view.js'), 'utf8')

  assert.match(source, /import \{ useEffect, useState \} from 'react'/)
  assert.match(source, /import \{ Image, Keyboard, Modal, Platform, Pressable, ScrollView, Text, View \} from 'react-native'/)
  assert.match(source, /import \{ Dumbbell, Info \} from 'lucide-react-native'/)
  assert.match(source, /const \[isSearchFocused, setIsSearchFocused\] = useState\(false\)/)
  assert.match(source, /const \[keyboardHeight, setKeyboardHeight\] = useState\(0\)/)
  assert.match(source, /Keyboard\.addListener\(showEvent, \(event\) => \{[\s\S]*setKeyboardHeight\(Math\.max\(0, event\.endCoordinates\?\.height \|\| 0\)\)/)
  assert.match(source, /const keyboardBottomOffset = Math\.max\(keyboardHeight - insets\.bottom, 0\)/)
  assert.match(source, /const bottomControlsHeight = isSearchFocused \|\| keyboardHeight > 0 \? 86 : 96/)
  assert.match(source, /contentContainerStyle=\{\{ paddingBottom: scrollBottomPadding \}\}/)
  assert.match(source, /<View className="absolute inset-x-0 px-5" style=\{\{ bottom: keyboardBottomOffset, paddingBottom: safeBottom, backgroundColor: resolvedTheme\.background \}\}>/)
  assert.match(source, /<AppSearchInput[\s\S]*onFocus=\{\(\) => setIsSearchFocused\(true\)\}[\s\S]*onBlur=\{\(\) => setIsSearchFocused\(false\)\}/)
  assert.match(source, /<Dumbbell color=\{resolvedTheme\.iconMuted\} size=\{22\} strokeWidth=\{2\.2\} \/>/)
  assert.doesNotMatch(source, /🏋️/)
})
