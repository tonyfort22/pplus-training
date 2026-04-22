import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile app shell uses react-native-safe-area-context instead of deprecated react-native SafeAreaView', () => {
  const appSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/App.js'),
    'utf8'
  )

  assert.match(appSource, /from 'react-native-safe-area-context'/)
  assert.match(appSource, /SafeAreaProvider/)
  assert.match(appSource, /<SafeAreaProvider>/)
  assert.match(appSource, /<SafeAreaView style=\{styles\.container\}>/)
  assert.doesNotMatch(appSource, /import\s*\{\s*SafeAreaView\s*\}\s*from 'react-native'/)
})

test('mobile app shell opens the train preview on Calendar so the weekly strip is visible immediately', () => {
  const appSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/App.js'),
    'utf8'
  )

  assert.match(appSource, /const \[activeTrainTab, setActiveTrainTab\] = useState\('calendar'\);/)
  assert.match(appSource, /setActiveTrainTab\('calendar'\)/)
})
