import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  MOBILE_VISUAL_DEVICE_CHECK_STATUSES,
  MOBILE_VISUAL_DEVICE_CHECKS,
  getMobileVisualDeviceCheckSummary,
} from '../apps/mobile/testing/mobile-visual-device-checks.js'

const REQUIRED_CHECK_IDS = Object.freeze([
  'program-sheet-day-card-checkbox-layout',
  'active-workout-header-card-layout',
  'active-workout-finish-modal-layout',
  'active-workout-discard-modal-layout',
  'video-chart-bodymap-no-clip',
  'keyboard-primary-actions',
  'loading-skeleton-final-surface-match',
  'light-theme-device-audit',
])

test('mobile visual/device registry covers every required check exactly once', () => {
  const checkIds = MOBILE_VISUAL_DEVICE_CHECKS.map((check) => check.id)

  assert.deepEqual(checkIds, REQUIRED_CHECK_IDS)
  assert.equal(new Set(checkIds).size, checkIds.length)
})

test('each mobile visual/device check is passed or explicitly deferred with a reason', () => {
  for (const check of MOBILE_VISUAL_DEVICE_CHECKS) {
    assert.ok(
      Object.values(MOBILE_VISUAL_DEVICE_CHECK_STATUSES).includes(check.status),
      `Unexpected visual/device status for ${check.id}: ${check.status}`,
    )

    assert.match(check.label, /\S/, `${check.id} needs a label`)
    assert.match(check.layer, /^L5_VISUAL_DEVICE$/, `${check.id} must stay scoped to L5`)
    assert.match(check.maestroFlowPath, /^maestro\/.*\.ya?ml$/, `${check.id} needs a Maestro flow path`)
    assert.equal(existsSync(resolve(process.cwd(), check.maestroFlowPath)), true, `${check.id} Maestro flow must exist`)

    if (check.status === MOBILE_VISUAL_DEVICE_CHECK_STATUSES.PASSED) {
      assert.match(check.proofSummary, /\S/, `${check.id} needs proof summary`)
      assert.ok(check.artifacts.length > 0, `${check.id} needs artifact paths`)

      for (const artifactPath of check.artifacts) {
        assert.equal(existsSync(resolve(process.cwd(), artifactPath)), true, `${check.id} artifact missing: ${artifactPath}`)
      }

      const junitArtifact = check.artifacts.find((artifactPath) => artifactPath.endsWith('.xml'))
      assert.ok(junitArtifact, `${check.id} needs a JUnit XML artifact`)

      const junitSource = readFileSync(resolve(process.cwd(), junitArtifact), 'utf8')
      assert.match(junitSource, /failures="0"/, `${check.id} JUnit proof must have zero failures`)
      assert.match(junitSource, /status="SUCCESS"/, `${check.id} JUnit proof must include SUCCESS status`)
      assert.equal(check.deferReason, null, `${check.id} passed checks must not carry defer reasons`)
    } else {
      assert.equal(check.status, MOBILE_VISUAL_DEVICE_CHECK_STATUSES.DEFERRED)
      assert.match(check.deferReason, /\S/, `${check.id} deferred checks need a reason`)
      assert.match(check.nextProofCommand, /maestro test|xcrun simctl|pnpm --dir apps\/mobile exec expo start/, `${check.id} needs an actionable next proof command`)
      assert.deepEqual(check.artifacts, Object.freeze([]), `${check.id} deferred checks should not pretend artifacts exist`)
      assert.equal(check.proofSummary, null, `${check.id} deferred checks should not pretend proof passed`)
    }
  }
})

test('mobile visual/device summary separates passed and deferred checks', () => {
  const summary = getMobileVisualDeviceCheckSummary()

  assert.equal(summary.total, REQUIRED_CHECK_IDS.length)
  assert.equal(summary.passed + summary.deferred, REQUIRED_CHECK_IDS.length)
  assert.ok(summary.passed >= 1, 'At least one visual/device check should be backed by real artifact proof')
  assert.ok(summary.deferred >= 1, 'Unrun visual/device checks should be explicitly deferred, not implied green')
  assert.deepEqual(summary.blocked, Object.freeze([]))
})
