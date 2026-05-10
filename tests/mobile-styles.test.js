import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

test('mobile screen styles defines the shared shell and returns theme-aware app styles', () => {
  const stylesSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/styles.js'), 'utf8')

  assert.match(stylesSource, /export function createAppStyles\(theme\)/)
  assert.match(stylesSource, /const styles = StyleSheet\.create\(/)
  assert.match(stylesSource, /container:/)
  assert.match(stylesSource, /appShell:/)
  assert.match(stylesSource, /brandHeader:/)
  assert.match(stylesSource, /topHeader:/)
  assert.match(stylesSource, /previewBar:/)
  assert.match(stylesSource, /trainTabsPill:/)
  assert.match(stylesSource, /calendarStripCard:/)
  assert.match(stylesSource, /todayCard:/)
  assert.match(stylesSource, /programCard:/)
  assert.match(stylesSource, /workoutListCard:/)
  assert.match(stylesSource, /programSheetPanel:/)
  assert.match(stylesSource, /programSheetWeekCard:/)
  assert.match(stylesSource, /programSheetStatusBadge:/)
  assert.match(stylesSource, /return \{ \.\.\.styles, theme \}/)

  assert.match(stylesSource, /backgroundColor: theme\.background/)
  assert.match(stylesSource, /backgroundColor: theme\.surface/)
  assert.match(stylesSource, /borderColor: theme\.border/)
  assert.match(stylesSource, /color: theme\.text/)
  assert.match(stylesSource, /color: theme\.textMuted|color: theme\.textSoft/)
  assert.match(stylesSource, /backgroundColor: theme\.accent/)
  assert.doesNotMatch(stylesSource, /resolvedTheme\./)
})

test('mobile status styles preserves a named status palette for explicit badge colors', () => {
  const stylesSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/styles.js'), 'utf8')

  assert.match(stylesSource, /const STATUS_COLOR_TOKENS = \{/)
  assert.match(stylesSource, /notStarted: '#06D6A0'/)
  assert.match(stylesSource, /active: '#7c3aed'/)
  assert.match(stylesSource, /completed: '#059669'/)
  assert.match(stylesSource, /skipped: '#b45309'/)
  assert.match(stylesSource, /export const statusStyles = \{[\s\S]*not_started: \{ backgroundColor: STATUS_COLOR_TOKENS\.notStarted \}/)
  assert.match(stylesSource, /active: \{ backgroundColor: STATUS_COLOR_TOKENS\.active \}/)
  assert.match(stylesSource, /completed: \{ backgroundColor: STATUS_COLOR_TOKENS\.completed \}/)
  assert.match(stylesSource, /skipped: \{ backgroundColor: STATUS_COLOR_TOKENS\.skipped \}/)
})
