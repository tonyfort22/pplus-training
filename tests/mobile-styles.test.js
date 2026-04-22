import test from 'node:test'
import assert from 'node:assert/strict'
import { styles, statusStyles } from '../apps/mobile/src/screens/styles.js'

test('mobile screen styles exports the shared shell and renderer style keys', () => {
  assert.ok(styles.container)
  assert.ok(styles.appShell)
  assert.ok(styles.brandHeader)
  assert.ok(styles.brandHeaderSide)
  assert.ok(styles.brandLogoWrap)
  assert.ok(styles.brandIconButton)
  assert.ok(styles.topHeader)
  assert.ok(styles.previewBar)
  assert.ok(styles.previewHeaderTopRow)
  assert.ok(styles.trainTabsRow)
  assert.ok(styles.trainTabsPill)
  assert.ok(styles.sectionCard)
  assert.ok(styles.tabBar)
  assert.equal(styles.container.backgroundColor, '#0b1220')
  assert.equal(styles.previewButtonActive.backgroundColor, '#06D6A0')
  assert.equal(styles.trainTabButtonActive.backgroundColor, '#06D6A0')
  assert.equal(styles.progressFill.backgroundColor, '#06D6A0')
  assert.equal(styles.programAccentRail.backgroundColor, '#06D6A0')
})

test('mobile status styles preserves exercise status colors', () => {
  assert.equal(statusStyles.not_started.backgroundColor, '#06D6A0')
  assert.equal(statusStyles.active.backgroundColor, '#7c3aed')
  assert.equal(statusStyles.completed.backgroundColor, '#059669')
  assert.equal(statusStyles.skipped.backgroundColor, '#b45309')
})
