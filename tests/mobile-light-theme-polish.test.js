import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { getAppTheme } from '../apps/mobile/src/theme/app-theme.js'

test('light theme uses the cooler PPLUS mint palette instead of the older generic emerald tokens', () => {
  const theme = getAppTheme('light')

  assert.equal(theme.background, '#F5F7FC')
  assert.equal(theme.border, '#DCE4EE')
  assert.equal(theme.text, '#161C2D')
  assert.equal(theme.textMuted, '#737B8C')
  assert.equal(theme.textSoft, '#9AA3B2')
  assert.equal(theme.accent, '#06D6A0')
  assert.equal(theme.accentSoft, '#A7F3D0')
  assert.equal(theme.accentTint, '#ECFDF5')
  assert.equal(theme.accentSurface, '#ECFDF5')
  assert.equal(theme.accentBorder, '#A7F3D0')
  assert.equal(theme.accentText, '#06D6A0')
  assert.equal(theme.logoText, '#06D6A0')
})

test('train-home shell spacing and card rhythm are tuned to the reference layout', () => {
  const stylesSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/styles.js'), 'utf8')
  const primitivesSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/ui/primitives.js'), 'utf8')
  const cardsSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/ui/cards.js'), 'utf8')
  const renderersSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/renderers.js'), 'utf8')
  const shellSource = readFileSync(resolve(process.cwd(), 'apps/mobile/src/screens/shell-renderers.js'), 'utf8')

  assert.match(stylesSource, /scrollContent:\s*\{[\s\S]*padding: 24,[\s\S]*gap: 24,[\s\S]*paddingBottom: 24,/)
  assert.match(stylesSource, /shellScrollView:\s*\{[\s\S]*flex: 1,[\s\S]*\}/)
  assert.match(stylesSource, /activeAthleteBanner:\s*\{[\s\S]*marginHorizontal: -24,[\s\S]*marginTop: -8,[\s\S]*marginBottom: 4,[\s\S]*backgroundColor: theme\.accentSurface,[\s\S]*borderRadius: 0,[\s\S]*borderWidth: 0,[\s\S]*paddingHorizontal: 16,[\s\S]*paddingVertical: 12,/)
  assert.match(stylesSource, /calendarStripCard:\s*\{[\s\S]*borderRadius: 24,[\s\S]*paddingTop: 20,[\s\S]*paddingBottom: 18,[\s\S]*paddingHorizontal: 20,/)
  assert.match(stylesSource, /todayCard:\s*\{[\s\S]*borderRadius: 24,[\s\S]*padding: 20,[\s\S]*gap: 16,/)
  assert.match(stylesSource, /programCard:\s*\{[\s\S]*borderRadius: 24,[\s\S]*padding: 20,[\s\S]*gap: 16,/)
  assert.match(stylesSource, /bottomNavWrap:\s*\{[\s\S]*backgroundColor: theme\.background,[\s\S]*paddingTop: 8,[\s\S]*paddingHorizontal: 24,[\s\S]*paddingBottom: 16,[\s\S]*alignItems: 'stretch',[\s\S]*gap: 12,/)
  assert.doesNotMatch(stylesSource.slice(stylesSource.indexOf('bottomNavWrap: {'), stylesSource.indexOf('bottomNavMainPill: {')), /position: 'absolute'|left: 24|right: 24|bottom: 16/)
  assert.match(stylesSource, /bottomNavMainPill:\s*\{[\s\S]*backgroundColor: theme\.surface,[\s\S]*padding: 10,[\s\S]*shadowOpacity: 0\.08,[\s\S]*shadowRadius: 18,/)
  assert.match(stylesSource, /bottomNavTab:\s*\{[\s\S]*flex: 1,[\s\S]*minHeight: 52,[\s\S]*paddingVertical: 14,/)
  assert.doesNotMatch(stylesSource, /bottomNavUtilityButton:\s*\{[\s\S]*width: 60,[\s\S]*height: 60,[\s\S]*backgroundColor: theme\.surface,/)

  assert.match(primitivesSource, /contentClassName = 'gap-3 px-6 py-5'/)
  assert.match(primitivesSource, /containerClassName = 'rounded-\[24px\] overflow-hidden'/)
  assert.match(primitivesSource, /rounded-\[20px\] px-5 py-4/)
  assert.match(primitivesSource, /rounded-\[20px\] px-5 py-3\.5/)
  assert.match(cardsSource, /contentClassName="gap-4 pl-6 pr-5 py-5"/)
  assert.match(cardsSource, /text-\[20px\] font-bold/)
  assert.match(cardsSource, /theme\.accentSoft/)
  assert.match(renderersSource, /rounded-\[24px\]/)
  assert.match(renderersSource, /min-h-\[44px\] min-w-\[40px\]/)
  assert.match(renderersSource, /text-\[24px\] font-bold/)
  assert.match(shellSource, /text-\[16px\] font-medium/)
})
