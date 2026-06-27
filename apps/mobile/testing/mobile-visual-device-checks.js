import { MOBILE_LAYER_L5 } from './mobile-surface-manifest.js'

export const MOBILE_VISUAL_DEVICE_CHECK_STATUSES = Object.freeze({
  PASSED: 'passed',
  DEFERRED: 'deferred',
})

const noArtifacts = Object.freeze([])

function passedCheck({ id, label, maestroFlowPath, artifacts, proofSummary }) {
  return Object.freeze({
    id,
    label,
    layer: MOBILE_LAYER_L5,
    status: MOBILE_VISUAL_DEVICE_CHECK_STATUSES.PASSED,
    maestroFlowPath,
    artifacts: Object.freeze(artifacts),
    proofSummary,
    deferReason: null,
    nextProofCommand: null,
  })
}

function deferredCheck({ id, label, maestroFlowPath, deferReason, nextProofCommand }) {
  return Object.freeze({
    id,
    label,
    layer: MOBILE_LAYER_L5,
    status: MOBILE_VISUAL_DEVICE_CHECK_STATUSES.DEFERRED,
    maestroFlowPath,
    artifacts: noArtifacts,
    proofSummary: null,
    deferReason,
    nextProofCommand,
  })
}

export const MOBILE_VISUAL_DEVICE_CHECKS = Object.freeze([
  deferredCheck({
    id: 'program-sheet-day-card-checkbox-layout',
    label: 'Program Sheet day/card/checkbox visual layout',
    maestroFlowPath: 'maestro/program-sheet-day-card-checkbox-visual-check.yaml',
    deferReason: 'Source selectors and Maestro flow exist, but no current retained passing JUnit plus screenshot artifact was found for this exact visual check in the artifact registry.',
    nextProofCommand: 'pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear && maestro test --device "$MAESTRO_DEVICE_UDID" --format JUNIT --output apps/mobile/testing/artifacts/program_sheet_day_card_checkbox_layout/maestro-junit.xml maestro/program-sheet-day-card-checkbox-visual-check.yaml && xcrun simctl io "$MAESTRO_DEVICE_UDID" screenshot apps/mobile/testing/artifacts/program_sheet_day_card_checkbox_layout/screenshot.png',
  }),
  deferredCheck({
    id: 'active-workout-header-card-layout',
    label: 'Active Workout header/card visual layout',
    maestroFlowPath: 'maestro/active-workout-header-card-visual-check.yaml',
    deferReason: 'The dedicated visual flow exists, but there is no retained passing JUnit plus screenshot artifact for the current safe active-workout header/card run.',
    nextProofCommand: 'pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear && maestro test --device "$MAESTRO_DEVICE_UDID" --format JUNIT --output apps/mobile/testing/artifacts/active_workout_header_card_layout/maestro-junit.xml maestro/active-workout-header-card-visual-check.yaml && xcrun simctl io "$MAESTRO_DEVICE_UDID" screenshot apps/mobile/testing/artifacts/active_workout_header_card_layout/screenshot.png',
  }),
  deferredCheck({
    id: 'active-workout-finish-modal-layout',
    label: 'Active Workout finish modal visual layout',
    maestroFlowPath: 'maestro/active-workout-finish-modal-visual-check.yaml',
    deferReason: 'The finish-modal flow is present, but this pass has not retained a current passing screenshot/JUnit pair after opening the modal on device.',
    nextProofCommand: 'pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear && maestro test --device "$MAESTRO_DEVICE_UDID" --format JUNIT --output apps/mobile/testing/artifacts/active_workout_finish_modal_layout/maestro-junit.xml maestro/active-workout-finish-modal-visual-check.yaml && xcrun simctl io "$MAESTRO_DEVICE_UDID" screenshot apps/mobile/testing/artifacts/active_workout_finish_modal_layout/screenshot.png',
  }),
  deferredCheck({
    id: 'active-workout-discard-modal-layout',
    label: 'Active Workout discard modal visual layout',
    maestroFlowPath: 'maestro/active-workout-discard-modal-visual-check.yaml',
    deferReason: 'The discard-modal flow is present, but this pass has not retained a current passing screenshot/JUnit pair after opening the confirmation on device.',
    nextProofCommand: 'pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear && maestro test --device "$MAESTRO_DEVICE_UDID" --format JUNIT --output apps/mobile/testing/artifacts/active_workout_discard_modal_layout/maestro-junit.xml maestro/active-workout-discard-modal-visual-check.yaml && xcrun simctl io "$MAESTRO_DEVICE_UDID" screenshot apps/mobile/testing/artifacts/active_workout_discard_modal_layout/screenshot.png',
  }),
  passedCheck({
    id: 'video-chart-bodymap-no-clip',
    label: 'Exercise video preview, chart, and body-map no-clip visual proof',
    maestroFlowPath: 'maestro/visual-media-chart-bodymap-no-clip.yaml',
    artifacts: [
      'apps/mobile/testing/artifacts/progress_charts_check/visual-media-chart-bodymap-junit.xml',
      'apps/mobile/testing/artifacts/progress_charts_check/visual-media-chart-bodymap-console.log',
      'apps/mobile/testing/artifacts/progress_charts_check/visual-media-chart-bodymap-final.png',
    ],
    proofSummary: 'Retained iPhone 17 Pro Maestro JUnit reports 1/1 flow passed with zero failures and a final screenshot artifact is present.',
  }),
  deferredCheck({
    id: 'keyboard-primary-actions',
    label: 'Keyboard-open primary actions remain visible',
    maestroFlowPath: 'maestro/auth-keyboard-primary-action-smoke.yaml',
    deferReason: 'Keyboard-safe source contracts and flow file exist, but no retained current keyboard-open screenshot/JUnit pair was found for this checklist pass.',
    nextProofCommand: 'pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear && maestro test --device "$MAESTRO_DEVICE_UDID" --format JUNIT --output apps/mobile/testing/artifacts/keyboard_primary_actions/maestro-junit.xml maestro/auth-keyboard-primary-action-smoke.yaml && xcrun simctl io "$MAESTRO_DEVICE_UDID" screenshot apps/mobile/testing/artifacts/keyboard_primary_actions/screenshot.png',
  }),
  deferredCheck({
    id: 'loading-skeleton-final-surface-match',
    label: 'Loading skeleton and final surface geometry match',
    maestroFlowPath: 'maestro/loading-skeleton-final-surface-visual-check.yaml',
    deferReason: 'Historical skeleton artifacts exist under apps/mobile/testing/artifacts, but this registry has no current retained canonical Maestro flow result for the final checklist pass.',
    nextProofCommand: 'pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear && maestro test --device "$MAESTRO_DEVICE_UDID" --format JUNIT --output apps/mobile/testing/artifacts/loading_skeleton_final_surface_match/maestro-junit.xml maestro/loading-skeleton-final-surface-visual-check.yaml && xcrun simctl io "$MAESTRO_DEVICE_UDID" screenshot apps/mobile/testing/artifacts/loading_skeleton_final_surface_match/final.png',
  }),
  deferredCheck({
    id: 'light-theme-device-audit',
    label: 'Light theme visible device audit',
    maestroFlowPath: 'maestro/light-theme-device-audit.yaml',
    deferReason: 'Historical light-theme artifacts exist, but the stricter light-theme requirement needs a current proof that the Theme screen actually switched to Light before counting downstream screenshots.',
    nextProofCommand: 'pnpm --dir apps/mobile exec expo start --lan --port 8084 --clear && maestro test --device "$MAESTRO_DEVICE_UDID" --format JUNIT --output apps/mobile/testing/artifacts/light_theme_device_audit/maestro-junit.xml maestro/light-theme-device-audit.yaml && xcrun simctl io "$MAESTRO_DEVICE_UDID" screenshot apps/mobile/testing/artifacts/light_theme_device_audit/screenshot.png',
  }),
])

export function getMobileVisualDeviceCheckSummary() {
  const passedChecks = MOBILE_VISUAL_DEVICE_CHECKS.filter((check) => check.status === MOBILE_VISUAL_DEVICE_CHECK_STATUSES.PASSED)
  const deferredChecks = MOBILE_VISUAL_DEVICE_CHECKS.filter((check) => check.status === MOBILE_VISUAL_DEVICE_CHECK_STATUSES.DEFERRED)
  const blockedChecks = MOBILE_VISUAL_DEVICE_CHECKS.filter(
    (check) => !Object.values(MOBILE_VISUAL_DEVICE_CHECK_STATUSES).includes(check.status),
  )

  return Object.freeze({
    total: MOBILE_VISUAL_DEVICE_CHECKS.length,
    passed: passedChecks.length,
    deferred: deferredChecks.length,
    blocked: Object.freeze(blockedChecks.map((check) => check.id)),
    passedCheckIds: Object.freeze(passedChecks.map((check) => check.id)),
    deferredCheckIds: Object.freeze(deferredChecks.map((check) => check.id)),
  })
}
