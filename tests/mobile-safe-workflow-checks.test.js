import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  MOBILE_SAFE_WORKFLOW_CHECK_STATUSES,
  MOBILE_SAFE_WORKFLOW_CHECKS,
  getMobileSafeWorkflowCheckSummary,
} from '../apps/mobile/testing/mobile-safe-workflow-checks.js'
import {
  MOBILE_SMOKE_SETUP_SCENARIOS,
  buildMobileSmokeMaestroCommand,
} from '../apps/mobile/testing/mobile-simulator-smoke-setup.js'

const REQUIRED_SAFE_WORKFLOW_IDS = Object.freeze([
  'invited-athlete-completion-safe-fixture',
  'coach-athlete-switching-safe-fixture',
  'start-workout-safe-fixture',
  'log-set-safe-fixture',
  'profile-group-update-safe-fixture',
])

const REQUIRED_SCENARIO_IDS_BY_CHECK_ID = Object.freeze({
  'invited-athlete-completion-safe-fixture': 'invited_athlete_completion_safe_fixture',
  'coach-athlete-switching-safe-fixture': 'coach_athlete_switching_safe_fixture',
  'start-workout-safe-fixture': 'start_workout_safe_fixture',
  'log-set-safe-fixture': 'log_set_safe_fixture',
  'profile-group-update-safe-fixture': 'profile_group_update_safe_fixture',
})

test('mobile safe workflow registry covers every required workflow exactly once', () => {
  const checkIds = MOBILE_SAFE_WORKFLOW_CHECKS.map((check) => check.id)

  assert.deepEqual(checkIds, REQUIRED_SAFE_WORKFLOW_IDS)
  assert.equal(new Set(checkIds).size, checkIds.length)
})

test('each mobile safe workflow is passed or explicitly deferred with a reason', () => {
  for (const check of MOBILE_SAFE_WORKFLOW_CHECKS) {
    assert.ok(
      Object.values(MOBILE_SAFE_WORKFLOW_CHECK_STATUSES).includes(check.status),
      `Unexpected safe workflow status for ${check.id}: ${check.status}`,
    )

    const scenarioId = REQUIRED_SCENARIO_IDS_BY_CHECK_ID[check.id]
    const scenario = MOBILE_SMOKE_SETUP_SCENARIOS[scenarioId]

    assert.ok(scenario, `${check.id} must map to a known smoke scenario`)
    assert.equal(check.scenarioId, scenarioId, `${check.id} must expose the exact smoke scenario id`)
    assert.match(check.label, /\S/, `${check.id} needs a label`)
    assert.match(check.layer, /^L6_SAFE_WORKFLOW$/, `${check.id} must stay scoped to L6`)
    assert.equal(check.maestroFlowPath, scenario.maestroFlowPath, `${check.id} must use the scenario-owned Maestro flow`)
    assert.equal(existsSync(resolve(process.cwd(), check.maestroFlowPath)), true, `${check.id} Maestro flow must exist`)

    assert.equal(check.workflowSafety.mode, scenario.workflowSafety.mode, `${check.id} must relay scenario workflow safety mode`)
    assert.equal(check.workflowSafety.proof, scenario.workflowSafety.proof, `${check.id} must relay scenario workflow safety proof`)
    assert.equal(check.liveRecordSafety.mode, 'no_live_records', `${check.id} must not leave unsafe live test records behind`)
    assert.equal(check.liveRecordSafety.proof, scenario.workflowSafety.liveRecordSafety.proof, `${check.id} must relay live record residue proof`)
    assert.deepEqual(check.liveRecordSafety.tables, Object.freeze([]), `${check.id} no-live-record workflows should not name live DB tables`)
    assert.deepEqual(check.liveRecordSafety.recordIdMarkers, Object.freeze([]), `${check.id} no-live-record workflows should not name live record markers`)
    assert.equal(check.liveRecordSafety.cleanupCommand, null, `${check.id} should not need live DB cleanup`)

    const nextCommand = check.status === MOBILE_SAFE_WORKFLOW_CHECK_STATUSES.DEFERRED
      ? check.nextProofCommand
      : check.proofCommand
    assert.equal(nextCommand, buildMobileSmokeMaestroCommand(scenarioId), `${check.id} proof command must be generated from the smoke registry`)

    if (check.status === MOBILE_SAFE_WORKFLOW_CHECK_STATUSES.PASSED) {
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
      assert.equal(check.status, MOBILE_SAFE_WORKFLOW_CHECK_STATUSES.DEFERRED)
      assert.match(check.deferReason, /\S/, `${check.id} deferred checks need a reason`)
      assert.match(check.nextProofCommand, /maestro test|xcrun simctl|pnpm --dir apps\/mobile exec expo start|MAESTRO_DEVICE_UDID/, `${check.id} needs an actionable next proof command`)
      assert.deepEqual(check.artifacts, Object.freeze([]), `${check.id} deferred checks should not pretend artifacts exist`)
      assert.equal(check.proofSummary, null, `${check.id} deferred checks should not pretend proof passed`)
    }
  }
})

test('mobile safe workflow summary separates passed and deferred workflows', () => {
  const summary = getMobileSafeWorkflowCheckSummary()

  assert.equal(summary.total, REQUIRED_SAFE_WORKFLOW_IDS.length)
  assert.equal(summary.passed + summary.deferred, REQUIRED_SAFE_WORKFLOW_IDS.length)
  assert.equal(summary.blocked.length, 0)
  assert.ok(summary.deferred >= 1, 'Unrun safe workflow tests should be explicitly deferred, not implied green')
})
