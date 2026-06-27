import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import {
  MOBILE_TEST_ARTIFACT_ALLOWED_FILES,
  MOBILE_TEST_ARTIFACT_RETENTION_STATUSES,
  assertMobileTestArtifactsCleanedOrListed,
  formatMobileTestArtifactInventory,
  getMobileTestArtifactInventory,
} from '../apps/mobile/testing/mobile-test-artifact-inventory.js'

test('mobile test artifact inventory reports cleaned when artifact root is absent', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'pplus-mobile-artifacts-clean-'))
  const inventory = getMobileTestArtifactInventory({
    cwd,
    visualChecks: Object.freeze([]),
    safeWorkflowChecks: Object.freeze([]),
  })

  assert.equal(inventory.artifactRoot, 'apps/mobile/testing/artifacts')
  assert.equal(inventory.status, MOBILE_TEST_ARTIFACT_RETENTION_STATUSES.CLEANED)
  assert.deepEqual(inventory.existingArtifactFiles, Object.freeze([]))
  assert.equal(formatMobileTestArtifactInventory(inventory), 'Artifacts: cleaned (apps/mobile/testing/artifacts)')
  assert.deepEqual(assertMobileTestArtifactsCleanedOrListed({
    cwd,
    visualChecks: Object.freeze([]),
    safeWorkflowChecks: Object.freeze([]),
  }), inventory)
})

test('mobile test artifact inventory lists retained proof from visual and safe workflow registries', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'pplus-mobile-artifacts-listed-'))
  const proofFiles = [
    'apps/mobile/testing/artifacts/progress_charts_check/visual-media-chart-bodymap-junit.xml',
    'apps/mobile/testing/artifacts/progress_charts_check/visual-media-chart-bodymap-console.log',
    'apps/mobile/testing/artifacts/progress_charts_check/visual-media-chart-bodymap-final.png',
    'apps/mobile/testing/artifacts/safe_workflow_passed/maestro-junit.xml',
  ]

  for (const artifactPath of proofFiles) {
    mkdirSync(join(cwd, artifactPath.split('/').slice(0, -1).join('/')), { recursive: true })
    writeFileSync(join(cwd, artifactPath), 'proof')
  }

  const inventory = getMobileTestArtifactInventory({
    cwd,
    visualChecks: Object.freeze([
      Object.freeze({
        status: 'passed',
        artifacts: Object.freeze(proofFiles.slice(0, 3)),
      }),
      Object.freeze({
        status: 'deferred',
        artifacts: Object.freeze([]),
      }),
    ]),
    safeWorkflowChecks: Object.freeze([
      Object.freeze({
        status: 'passed',
        artifacts: Object.freeze([proofFiles[3]]),
      }),
    ]),
  })

  assert.equal(inventory.status, MOBILE_TEST_ARTIFACT_RETENTION_STATUSES.LISTED_RETAINED_PROOF)
  assert.deepEqual(inventory.unlistedArtifactFiles, Object.freeze([]))
  assert.deepEqual(inventory.listedButMissingArtifactFiles, Object.freeze([]))
  assert.deepEqual(inventory.retainedScenarioDirs, Object.freeze([
    'apps/mobile/testing/artifacts/progress_charts_check',
    'apps/mobile/testing/artifacts/safe_workflow_passed',
  ]))
  assert.match(formatMobileTestArtifactInventory(inventory), /Artifacts: listed retained proof under apps\/mobile\/testing\/artifacts/)
  assert.match(formatMobileTestArtifactInventory(inventory), /apps\/mobile\/testing\/artifacts\/progress_charts_check/)
})

test('mobile test artifact inventory fails when leftover artifact files are not listed', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'pplus-mobile-artifacts-leftover-'))
  const leftoverPath = 'apps/mobile/testing/artifacts/unlisted_debug/maestro-console.log'
  mkdirSync(join(cwd, 'apps/mobile/testing/artifacts/unlisted_debug'), { recursive: true })
  writeFileSync(join(cwd, leftoverPath), 'leftover')

  assert.throws(
    () => assertMobileTestArtifactsCleanedOrListed({
      cwd,
      visualChecks: Object.freeze([]),
      safeWorkflowChecks: Object.freeze([]),
    }),
    /Unlisted mobile test artifacts remain after mobile test run\.\n- apps\/mobile\/testing\/artifacts\/unlisted_debug\/maestro-console\.log/,
  )
})

test('mobile test artifact inventory fails when listed retained proof is missing', () => {
  const cwd = mkdtempSync(join(tmpdir(), 'pplus-mobile-artifacts-missing-'))
  mkdirSync(join(cwd, 'apps/mobile/testing/artifacts'), { recursive: true })

  assert.throws(
    () => assertMobileTestArtifactsCleanedOrListed({
      cwd,
      visualChecks: Object.freeze([
        Object.freeze({
          status: 'passed',
          artifacts: Object.freeze(['apps/mobile/testing/artifacts/missing_check/maestro-junit.xml']),
        }),
      ]),
      safeWorkflowChecks: Object.freeze([]),
    }),
    /Listed mobile test artifacts are missing\.\n- apps\/mobile\/testing\/artifacts\/missing_check\/maestro-junit\.xml/,
  )
})

test('mobile test artifact inventory allowlist is limited to the runner-owned output artifact', () => {
  assert.deepEqual(MOBILE_TEST_ARTIFACT_ALLOWED_FILES, Object.freeze([
    'apps/mobile/testing/pnpm-test-mobile-output.txt',
  ]))
})
