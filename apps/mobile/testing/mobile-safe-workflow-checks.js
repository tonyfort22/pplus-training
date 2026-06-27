import { MOBILE_LAYER_L6 } from './mobile-surface-manifest.js'
import {
  MOBILE_SMOKE_SETUP_SCENARIOS,
  buildMobileSmokeMaestroCommand,
} from './mobile-simulator-smoke-setup.js'

export const MOBILE_SAFE_WORKFLOW_CHECK_STATUSES = Object.freeze({
  PASSED: 'passed',
  DEFERRED: 'deferred',
})

const noArtifacts = Object.freeze([])

function createSafeWorkflowCheck({ id, scenarioId, status, deferReason, artifacts = noArtifacts, proofSummary = null }) {
  const scenario = MOBILE_SMOKE_SETUP_SCENARIOS[scenarioId]
  const proofCommand = buildMobileSmokeMaestroCommand(scenarioId)

  if (!scenario) {
    throw new Error(`Unknown safe workflow smoke scenario: ${scenarioId}`)
  }

  return Object.freeze({
    id,
    scenarioId,
    label: scenario.label,
    layer: MOBILE_LAYER_L6,
    status,
    maestroFlowPath: scenario.maestroFlowPath,
    workflowSafety: scenario.workflowSafety,
    liveRecordSafety: scenario.workflowSafety.liveRecordSafety,
    artifacts: Object.freeze(artifacts),
    proofSummary,
    deferReason,
    proofCommand: status === MOBILE_SAFE_WORKFLOW_CHECK_STATUSES.PASSED ? proofCommand : null,
    nextProofCommand: status === MOBILE_SAFE_WORKFLOW_CHECK_STATUSES.DEFERRED ? proofCommand : null,
  })
}

function deferredSafeWorkflowCheck({ id, scenarioId, deferReason }) {
  return createSafeWorkflowCheck({
    id,
    scenarioId,
    status: MOBILE_SAFE_WORKFLOW_CHECK_STATUSES.DEFERRED,
    deferReason,
  })
}

export const MOBILE_SAFE_WORKFLOW_CHECKS = Object.freeze([
  deferredSafeWorkflowCheck({
    id: 'invited-athlete-completion-safe-fixture',
    scenarioId: 'invited_athlete_completion_safe_fixture',
    deferReason: 'Source contracts prove the invitation completion safe fixture uses mocked API data and avoids remote fetches, but there is no retained passing Maestro JUnit plus screenshot artifact for the workflow UI run.',
  }),
  deferredSafeWorkflowCheck({
    id: 'coach-athlete-switching-safe-fixture',
    scenarioId: 'coach_athlete_switching_safe_fixture',
    deferReason: 'Source contracts prove the coach athlete switching fixture uses seeded local bootstrap with zero remote fetches, but the current registry has no retained passing Maestro JUnit plus screenshot artifact for the switching flow.',
  }),
  deferredSafeWorkflowCheck({
    id: 'start-workout-safe-fixture',
    scenarioId: 'start_workout_safe_fixture',
    deferReason: 'Source contracts prove start-workout uses a local session store with zero remote session writes, but no current retained Maestro proof artifact exists for the safe workflow UI run.',
  }),
  deferredSafeWorkflowCheck({
    id: 'log-set-safe-fixture',
    scenarioId: 'log_set_safe_fixture',
    deferReason: 'Source contracts prove log-set uses the local session store and mocked persistence only, but there is no retained passing Maestro JUnit plus screenshot artifact for the log-set interaction.',
  }),
  deferredSafeWorkflowCheck({
    id: 'profile-group-update-safe-fixture',
    scenarioId: 'profile_group_update_safe_fixture',
    deferReason: 'Source contracts prove profile/group updates use mocked update clients and local bootstrap state, but this pass has no retained passing Maestro JUnit plus screenshot artifact for the profile/group edit flow.',
  }),
])

export function getMobileSafeWorkflowCheckSummary() {
  const passedChecks = MOBILE_SAFE_WORKFLOW_CHECKS.filter((check) => check.status === MOBILE_SAFE_WORKFLOW_CHECK_STATUSES.PASSED)
  const deferredChecks = MOBILE_SAFE_WORKFLOW_CHECKS.filter((check) => check.status === MOBILE_SAFE_WORKFLOW_CHECK_STATUSES.DEFERRED)
  const blockedChecks = MOBILE_SAFE_WORKFLOW_CHECKS.filter(
    (check) => !Object.values(MOBILE_SAFE_WORKFLOW_CHECK_STATUSES).includes(check.status),
  )

  return Object.freeze({
    total: MOBILE_SAFE_WORKFLOW_CHECKS.length,
    passed: passedChecks.length,
    deferred: deferredChecks.length,
    blocked: Object.freeze(blockedChecks.map((check) => check.id)),
    passedCheckIds: Object.freeze(passedChecks.map((check) => check.id)),
    deferredCheckIds: Object.freeze(deferredChecks.map((check) => check.id)),
  })
}
