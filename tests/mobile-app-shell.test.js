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

test('mobile app shell no longer renders the preview state control in the top header', () => {
  const shellSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'),
    'utf8'
  )

  assert.doesNotMatch(shellSource, /Preview state/)
  assert.doesNotMatch(shellSource, /previewStates\?\.length/)
  assert.doesNotMatch(shellSource, /onPreviewStatePress/)
})

test('mobile app shell opens a dedicated program sheet from the program card instead of navigating away', () => {
  const appSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/App.js'),
    'utf8'
  )
  const sheetSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/screens/program-sheet.js'),
    'utf8'
  )
  const iconsSource = readFileSync(
    resolve(process.cwd(), 'apps/mobile/src/assets/ppht-icons.js'),
    'utf8'
  )

  assert.match(appSource, /const \[isProgramSheetOpen, setIsProgramSheetOpen\] = useState\(false\);/)
  assert.match(appSource, /const programSheetModel = useMemo\(/)
  assert.match(appSource, /if \(targetKey === 'program'\) \{[\s\S]*setIsProgramSheetOpen\(true\)[\s\S]*return/)
  assert.match(appSource, /renderProgramSheet\(\{[\s\S]*isVisible: isProgramSheetOpen/)
  assert.match(sheetSource, /from 'lucide-react-native'/)
  assert.match(sheetSource, /className=/)
  assert.match(sheetSource, /Modal/)
  assert.match(sheetSource, /CalendarDays/)
  assert.match(sheetSource, /Dumbbell/)
  assert.match(sheetSource, /Check/)
  assert.match(sheetSource, /X/)
  assert.doesNotMatch(sheetSource, /pphtCalendarDotsSvg/)
  assert.doesNotMatch(sheetSource, /pphtBarbellSvg/)
  assert.doesNotMatch(sheetSource, /pphtChatTextSvg/)
  assert.match(iconsSource, /export const pphtCheckSvg/)
})
