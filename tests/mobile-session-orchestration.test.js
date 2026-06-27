import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  buildImmediateWorkoutSheetPreview,
  buildStartWorkoutPlan,
  createWorkoutSheetProgramWorkoutPreview,
  hasRichSessionStructure,
  mergePersistedSessionResult,
  resolveIncomingSession,
  shouldPreserveIncomingSession,
  shouldUseFallbackWorkout,
} from '../apps/mobile/src/train/session-orchestration.js';
import { orchestrateStartWorkoutFromSheet, scheduleActiveWorkoutOpen, mergeResolvedStartWorkoutSession } from '../apps/mobile/src/train/start-workout-selection.js';
import { orchestrateOpenOrResumeSession } from '../apps/mobile/src/train/open-resume-selection.js';
import { orchestrateCloseProgramSheet, orchestrateOpenProgramSheet } from '../apps/mobile/src/train/open-program-selection.js';
import { orchestrateCloseExerciseDetail, orchestrateOpenExerciseDetail } from '../apps/mobile/src/train/open-exercise-detail-selection.js';
import { orchestrateCoachAthleteSelect, orchestrateCoachAthleteWorkspaceOpen } from '../apps/mobile/src/train/coach-athlete-selection.js';
import { orchestrateCloseActiveWorkout } from '../apps/mobile/src/train/active-workout-selection.js';
import { orchestrateCloseProgramEditView, orchestrateOpenProgramEditView } from '../apps/mobile/src/train/program-edit-selection.js';
import { orchestrateCloseWorkoutEditView, orchestrateOpenWorkoutEditView } from '../apps/mobile/src/train/workout-edit-selection.js';
import { resolveWorkoutOpenPreview } from '../apps/mobile/src/train/workout-open-resolution.js';
import { orchestrateAddExercisesToWorkoutEdit, orchestrateAddWorkoutEditSet, orchestrateDeleteWorkoutEditSet, orchestrateMoveWorkoutEditExercise } from '../apps/mobile/src/train/workout-edit-mutations.js';
import {
  orchestrateAddExercisesToSession,
  orchestrateAddSessionSet,
  orchestrateQuickActualUpdate,
  orchestrateClosePostSetEffortAdjustment,
  orchestrateCompleteSet,
  orchestrateDeleteSessionExercise,
  orchestrateDeleteSessionSet,
  orchestrateDismissRestTimer,
  orchestrateExerciseRestTimeChange,
  orchestrateCreateSessionSuperset,
  orchestrateRemoveSessionSuperset,
  orchestrateFinishWorkout,
  orchestrateDiscardWorkout,
  orchestrateMoveActiveWorkoutExercise,
  orchestratePostSetEffortChange,
  orchestrateRemoveExerciseRestTime,
  orchestrateSessionSetValueChange,
  orchestrateAdjustRestTimer,
  orchestrateWorkoutNotesChange,
  orchestrateWorkoutSettingsChange,
} from '../apps/mobile/src/train/active-workout-mutations.js';
import {
  deriveWorkoutOpenRequestContext,
  getRequestedProgramWorkoutId,
} from '../apps/mobile/src/train/workout-open-request-context.js';
import { applyWorkoutOpenStateTransition } from '../apps/mobile/src/train/workout-open-state-transition.js';
import { orchestrateWorkoutOpen, settleWorkoutOpenSelection } from '../apps/mobile/src/train/workout-open-selection.js';
import { createSessionPersistenceController } from '../apps/mobile/src/train/session-persistence.js';
import {
  getSessionDebugSummary,
  getStartWorkoutTapSummary,
  getWorkoutOpenTapSummary,
  logResolvedIncomingSession,
  logStartWorkoutTap,
  logWorkoutOpenTap,
  logWorkoutOpenOpeningWorkoutSheet,
  logWorkoutOpenPreviewFetchFailed,
  logWorkoutOpenFallbackWorkout,
  logWorkoutOpenFallbackFetchFailed,
  logWorkoutOpenResolvedWorkout,
  logWorkoutOpenMissingProgramWorkoutId,
  logStartWorkoutBlockedMissingStore,
  logStartWorkoutResumeExistingSession,
  logStartWorkoutOpenOptimisticSession,
  logStartWorkoutCreateSession,
  logStartWorkoutFailed,
  logStartWorkoutResolvedSession,
  logStartWorkoutBlockedNoNextSession,
  logStartWorkoutOpenActiveWorkoutView,
} from '../apps/mobile/src/train/session-diagnostics.js';

test('scheduleActiveWorkoutOpen opens the active workout through the interaction handoff', () => {
  const calls = [];

  scheduleActiveWorkoutOpen({
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    runAfterInteractions: (callback) => {
      calls.push(['runAfterInteractions']);
      callback();
    },
  });

  assert.deepEqual(calls, [
    ['runAfterInteractions'],
    ['setIsActiveWorkoutViewOpen', true],
  ]);
});

test('mergeResolvedStartWorkoutSession preserves rich optimistic exercises when Supabase returns a thin started row', () => {
  const mergedSession = mergeResolvedStartWorkoutSession({
    optimisticSession: {
      id: 'pw-upper-b',
      programWorkoutId: 'pw-upper-b',
      status: 'in_progress',
      startedAt: '2026-04-30T02:00:00.000Z',
      elapsedSeconds: 0,
      totalExercisesCount: 1,
      totalSetsCount: 1,
      completedExercisesCount: 0,
      completedSetsCount: 0,
      exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1', isCompleted: false }] }],
    },
    resolvedSession: {
      id: 'session-new',
      programWorkoutId: 'pw-upper-b',
      status: 'in_progress',
      startedAt: '2026-04-30T02:00:01.000Z',
      exercises: [],
      totalExercisesCount: 0,
      totalSetsCount: 0,
    },
  });

  assert.equal(mergedSession.id, 'session-new');
  assert.equal(mergedSession.programWorkoutId, 'pw-upper-b');
  assert.equal(mergedSession.exercises.length, 1);
  assert.equal(mergedSession.totalExercisesCount, 1);
  assert.equal(mergedSession.totalSetsCount, 1);
});

test('mergeResolvedStartWorkoutSession trusts the resolved session when it has its own exercises', () => {
  const mergedSession = mergeResolvedStartWorkoutSession({
    optimisticSession: {
      id: 'pw-upper-b',
      programWorkoutId: 'pw-upper-b',
      status: 'in_progress',
      exercises: [{ id: 'optimistic-exercise' }],
    },
    resolvedSession: {
      id: 'session-new',
      programWorkoutId: 'pw-upper-b',
      status: 'in_progress',
      exercises: [{ id: 'resolved-exercise' }],
    },
  });

  assert.equal(mergedSession.exercises[0].id, 'resolved-exercise');
});

test('resolveIncomingSession preserves the richer in-progress session when the incoming copy is thin but same lineage', () => {
  const currentSession = {
    id: 'session-1',
    programWorkoutId: 'pw-lower-a',
    status: 'in_progress',
    exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1' }] }],
  };
  const nextSession = {
    id: 'session-1',
    programWorkoutId: 'pw-lower-a',
    status: 'in_progress',
    exercises: [],
  };

  const resolvedSession = resolveIncomingSession({
    currentSession,
    nextSession,
    isActiveWorkoutViewOpen: true,
  });

  assert.equal(resolvedSession, currentSession);
});

test('resolveIncomingSession preserves optimistic superset rails when incoming sync is same session without superset metadata', () => {
  const currentSession = {
    id: 'session-rails-1',
    programWorkoutId: 'pw-rails-1',
    status: 'in_progress',
    exercises: [
      { id: 'exercise-1', nameSnapshot: 'Bench Press', supersetGroupId: 'local-superset-exercise-1-exercise-2', supersetOrder: 1, sets: [{ id: 'set-1' }] },
      { id: 'exercise-2', nameSnapshot: 'Pull Up', supersetGroupId: 'local-superset-exercise-1-exercise-2', supersetOrder: 2, sets: [{ id: 'set-2' }] },
    ],
  };
  const incomingWithoutRails = {
    id: 'session-rails-1',
    programWorkoutId: 'pw-rails-1',
    status: 'in_progress',
    exercises: [
      { id: 'exercise-1', nameSnapshot: 'Bench Press', supersetGroupId: null, supersetOrder: null, sets: [{ id: 'set-1' }] },
      { id: 'exercise-2', nameSnapshot: 'Pull Up', supersetGroupId: null, supersetOrder: null, sets: [{ id: 'set-2' }] },
    ],
  };

  const resolvedSession = resolveIncomingSession({
    currentSession,
    nextSession: incomingWithoutRails,
    isActiveWorkoutViewOpen: true,
  });

  assert.equal(resolvedSession, currentSession);
});

test('resolveIncomingSession preserves the rich start handoff session before Active Workout opens', () => {
  const currentSession = {
    id: 'session-speed-c',
    programWorkoutId: 'pw-speed-c',
    status: 'in_progress',
    nameSnapshot: 'Phase 4 Speed Accelerator C',
    exercises: [{ id: 'pwe-speed-1', nameSnapshot: '10-0-5 Lateral Cross Under Push', sets: [{ id: 'pws-speed-1' }] }],
    totalExercisesCount: 1,
    totalSetsCount: 1,
  };
  const thinIncomingSession = {
    id: 'session-speed-c',
    programWorkoutId: 'pw-speed-c',
    status: 'in_progress',
    nameSnapshot: 'Workout Session',
    exercises: [],
    totalExercisesCount: 0,
    totalSetsCount: 0,
  };

  const resolvedSession = resolveIncomingSession({
    currentSession,
    nextSession: thinIncomingSession,
    isStartingWorkout: true,
    isActiveWorkoutViewOpen: false,
  });

  assert.equal(resolvedSession, currentSession);
});

test('resolveIncomingSession preserves the rich start handoff session when sync emits an empty planned shell with no lineage', () => {
  const currentSession = {
    id: 'e4b29f5d-16be-4f31-994e-4509c2d747cc',
    programWorkoutId: 'e4b29f5d-16be-4f31-994e-4509c2d747cc',
    status: 'in_progress',
    nameSnapshot: 'Phase 4 Speed Accelerator C',
    exercises: Array.from({ length: 10 }, (_, index) => ({ id: `exercise-${index + 1}`, sets: [{ id: `set-${index + 1}` }] })),
    totalExercisesCount: 10,
    totalSetsCount: 10,
  };
  const emptyIncomingShell = {
    id: null,
    programWorkoutId: null,
    status: 'planned',
    exercises: [],
    totalExercisesCount: 0,
    totalSetsCount: 0,
  };

  const resolvedSession = resolveIncomingSession({
    currentSession,
    nextSession: emptyIncomingShell,
    isStartingWorkout: true,
    isActiveWorkoutViewOpen: false,
  });

  assert.equal(resolvedSession, currentSession);
});

test('resolveIncomingSession keeps the cleared visible session when a just-discarded session rehydrates from sync', () => {
  const clearedSession = { id: null, status: 'idle', exercises: [] };
  const discardedRehydrate = {
    id: 'session-discarded-1',
    programWorkoutId: 'pw-upper-b',
    status: 'in_progress',
    startedAt: '2026-06-10T19:36:57.672Z',
    exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1' }] }],
  };

  assert.equal(resolveIncomingSession({
    currentSession: clearedSession,
    nextSession: discardedRehydrate,
    ignoredSessionIds: new Set(['session-discarded-1']),
  }), clearedSession);
});

test('shouldPreserveIncomingSession protects an open active workout from stale planned previews', () => {
  assert.equal(shouldPreserveIncomingSession({
    currentSession: {
      id: 'session-1',
      programWorkoutId: 'pw-lower-a',
      status: 'in_progress',
      startedAt: '2026-06-10T19:36:57.672Z',
      exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1' }] }],
    },
    nextSession: {
      id: 'pw-lower-a',
      programWorkoutId: 'pw-lower-a',
      status: 'planned',
      startedAt: null,
      exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1' }] }],
    },
    isActiveWorkoutViewOpen: true,
  }), true);

  assert.equal(shouldPreserveIncomingSession({
    currentSession: {
      id: 'session-1',
      programWorkoutId: 'pw-lower-a',
      status: 'in_progress',
      exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1' }] }],
    },
    nextSession: {
      id: 'session-1',
      programWorkoutId: 'pw-lower-a',
      status: 'in_progress',
      exercises: [],
    },
    isActiveWorkoutViewOpen: true,
  }), true);
});

test('resolveIncomingSession replaces the current session when lineage changes', () => {
  const currentSession = {
    id: 'session-1',
    programWorkoutId: 'pw-lower-a',
    status: 'in_progress',
    exercises: [{ id: 'exercise-1' }],
  };
  const nextSession = {
    id: 'session-2',
    programWorkoutId: 'pw-upper-b',
    status: 'in_progress',
    exercises: [],
  };

  const resolvedSession = resolveIncomingSession({
    currentSession,
    nextSession,
    isActiveWorkoutViewOpen: true,
  });

  assert.equal(resolvedSession, nextSession);
});

test('buildStartWorkoutPlan resumes the stored session when lineage matches the selected workout', () => {
  const startedAt = '2026-04-23T20:00:00.000Z';
  const plan = buildStartWorkoutPlan({
    session: {
      id: 'session-1',
      programWorkoutId: 'pw-upper-b',
      status: 'in_progress',
    },
    storedSessionId: 'session-1',
    selectedWorkoutSessionPreview: {
      programWorkoutId: 'pw-upper-b',
      exercises: [{ id: 'exercise-1' }],
    },
    workoutSheetModel: { programWorkoutId: 'pw-upper-b' },
    selectedProgramWorkoutId: 'pw-upper-b',
    startedAt,
  });

  assert.equal(plan.targetProgramWorkoutId, 'pw-upper-b');
  assert.equal(plan.shouldResumeStoredSession, true);
  assert.equal(plan.resumeSessionId, 'session-1');
  assert.equal(plan.optimisticSession, null);
  assert.equal(plan.shouldStartNewSession, false);
});

test('buildStartWorkoutPlan creates a rich immediate session when resuming a thin stored session for the selected workout', () => {
  const startedAt = '2026-06-13T19:52:00.000Z';
  const plan = buildStartWorkoutPlan({
    session: {
      id: 'session-speed-c',
      programWorkoutId: 'pw-speed-c',
      status: 'in_progress',
      nameSnapshot: 'Workout Session',
      exercises: [],
      totalExercisesCount: 0,
      totalSetsCount: 0,
    },
    storedSessionId: 'session-speed-c',
    selectedWorkoutSessionPreview: null,
    workoutSheetModel: {
      title: 'Workout Session',
      programWorkoutId: 'pw-speed-c',
      exercises: [],
    },
    programWorkout: {
      id: 'pw-speed-c',
      nameSnapshot: 'Phase 4 Speed Accelerator C',
      exercises: [{
        id: 'pwe-speed-1',
        nameSnapshot: '10-0-5 Lateral Cross Under Push',
        sets: [{ id: 'pws-speed-1', prescribedReps: 1 }],
      }],
    },
    selectedProgramWorkoutId: 'pw-speed-c',
    startedAt,
  });

  assert.equal(plan.shouldResumeStoredSession, true);
  assert.equal(plan.resumeSessionId, 'session-speed-c');
  assert.equal(plan.shouldStartNewSession, false);
  assert.equal(plan.optimisticSession?.nameSnapshot, 'Phase 4 Speed Accelerator C');
  assert.equal(plan.optimisticSession?.totalExercisesCount, 1);
  assert.equal(plan.optimisticSession?.totalSetsCount, 1);
  assert.equal(plan.optimisticSession?.exercises?.[0]?.nameSnapshot, '10-0-5 Lateral Cross Under Push');
});

test('buildStartWorkoutPlan prioritizes the explicit selected program workout id over the current workout sheet model when resuming an already active workout', () => {
  const startedAt = '2026-04-23T20:00:00.000Z';
  const plan = buildStartWorkoutPlan({
    session: {
      id: 'session-1',
      programWorkoutId: 'pw-in-progress',
      status: 'in_progress',
    },
    storedSessionId: 'session-1',
    selectedWorkoutSessionPreview: {
      programWorkoutId: 'pw-in-progress',
      exercises: [{ id: 'exercise-1' }],
    },
    workoutSheetModel: { programWorkoutId: 'pw-selected-date' },
    selectedProgramWorkoutId: 'pw-in-progress',
    startedAt,
  });

  assert.equal(plan.targetProgramWorkoutId, 'pw-in-progress');
  assert.equal(plan.shouldResumeStoredSession, true);
  assert.equal(plan.resumeSessionId, 'session-1');
  assert.equal(plan.shouldStartNewSession, false);
});

test('buildStartWorkoutPlan creates an optimistic session when the selected preview matches the requested workout and stored resume is not allowed', () => {
  const startedAt = '2026-04-23T20:00:00.000Z';
  const selectedWorkoutSessionPreview = {
    id: 'preview-1',
    programWorkoutId: 'pw-upper-b',
    status: 'planned',
    elapsedSeconds: 99,
    completedAt: 'old-value',
    activeRestTimer: { isRunning: true },
    exercises: [{ id: 'exercise-1' }],
  };

  const plan = buildStartWorkoutPlan({
    session: {
      id: 'session-other',
      programWorkoutId: 'pw-other',
      status: 'planned',
    },
    storedSessionId: 'session-other',
    selectedWorkoutSessionPreview,
    workoutSheetModel: { programWorkoutId: 'pw-upper-b' },
    selectedProgramWorkoutId: 'pw-upper-b',
    startedAt,
  });

  assert.equal(plan.shouldResumeStoredSession, false);
  assert.equal(plan.resumeSessionId, null);
  assert.equal(plan.shouldStartNewSession, true);
  assert.deepEqual(plan.optimisticSession, {
    ...selectedWorkoutSessionPreview,
    status: 'in_progress',
    startedAt,
    elapsedSeconds: 0,
    completedAt: null,
    discardedAt: null,
    completedExercisesCount: 0,
    completedSetsCount: 0,
    activeRestTimer: null,
    exercises: [{ id: 'exercise-1', status: 'not_started', sets: [] }],
  });
});

test('buildStartWorkoutPlan returns no optimistic session when preview lineage does not match', () => {
  const plan = buildStartWorkoutPlan({
    session: {
      id: 'session-other',
      programWorkoutId: 'pw-other',
      status: 'planned',
    },
    storedSessionId: null,
    selectedWorkoutSessionPreview: {
      id: 'preview-1',
      programWorkoutId: 'pw-preview-other',
      exercises: [{ id: 'exercise-1' }],
    },
    workoutSheetModel: { programWorkoutId: 'pw-upper-b' },
    selectedProgramWorkoutId: 'pw-upper-b',
    startedAt: '2026-04-23T20:00:00.000Z',
  });

  assert.equal(plan.optimisticSession, null);
  assert.equal(plan.shouldStartNewSession, true);
});

test('buildStartWorkoutPlan creates an optimistic session from the visible workout sheet model when no session preview exists', () => {
  const startedAt = '2026-04-23T20:00:00.000Z';
  const plan = buildStartWorkoutPlan({
    session: {
      id: 'session-other',
      programWorkoutId: 'pw-other',
      status: 'planned',
    },
    storedSessionId: null,
    selectedWorkoutSessionPreview: null,
    workoutSheetModel: {
      title: 'Upper B',
      workoutNotes: 'Move fast',
      programWorkoutId: 'pw-upper-b',
      exercises: [{
        id: 'exercise-1',
        exerciseId: 'exercise-1',
        programWorkoutExerciseId: 'pwe-1',
        sortOrder: 1,
        name: 'Bench Press',
        restLabel: '2:00',
        sets: [{
          id: 'set-1',
          programWorkoutSetId: 'pws-1',
          sortOrder: 1,
          setType: 'straight',
          prescribedRestSeconds: 120,
          targetLoadUnit: 'lb',
          load: '135',
          reps: '5',
          effort: '8',
        }],
      }],
    },
    selectedProgramWorkoutId: 'pw-upper-b',
    startedAt,
  });

  assert.equal(plan.shouldResumeStoredSession, false);
  assert.equal(plan.shouldStartNewSession, true);
  assert.equal(plan.optimisticSession?.programWorkoutId, 'pw-upper-b');
  assert.equal(plan.optimisticSession?.status, 'in_progress');
  assert.equal(plan.optimisticSession?.startedAt, startedAt);
  assert.equal(plan.optimisticSession?.exercises?.[0]?.nameSnapshot, 'Bench Press');
  assert.equal(plan.optimisticSession?.exercises?.[0]?.sets?.[0]?.prescribedReps, 5);
});

test('buildStartWorkoutPlan ignores a thin same-lineage session preview and uses the visible workout sheet model', () => {
  const plan = buildStartWorkoutPlan({
    session: {
      id: 'session-other',
      programWorkoutId: 'pw-other',
      status: 'planned',
    },
    storedSessionId: null,
    selectedWorkoutSessionPreview: {
      id: 'completed-session-thin',
      programWorkoutId: 'pw-upper-b',
      status: 'completed',
      exercises: [],
      totalExercisesCount: 0,
      totalSetsCount: 0,
    },
    workoutSheetModel: {
      title: 'Upper B',
      programWorkoutId: 'pw-upper-b',
      exercises: [{
        id: 'exercise-1',
        exerciseId: 'exercise-1',
        programWorkoutExerciseId: 'pwe-1',
        sortOrder: 1,
        name: 'Bench Press',
        sets: [{ id: 'set-1', programWorkoutSetId: 'pws-1', reps: '5', load: '135', effort: '8' }],
      }],
    },
    selectedProgramWorkoutId: 'pw-upper-b',
    startedAt: '2026-04-23T20:00:00.000Z',
  });

  assert.equal(plan.optimisticSession?.id, 'pw-upper-b');
  assert.equal(plan.optimisticSession?.status, 'in_progress');
  assert.equal(plan.optimisticSession?.exercises?.length, 1);
  assert.equal(plan.optimisticSession?.totalExercisesCount, 1);
  assert.equal(plan.optimisticSession?.totalSetsCount, 1);
  assert.equal(plan.optimisticSession?.exercises?.[0]?.nameSnapshot, 'Bench Press');
});

test('buildStartWorkoutPlan falls back to the resolved program workout when the visible sheet model is still thin', () => {
  const plan = buildStartWorkoutPlan({
    session: {
      id: 'session-other',
      programWorkoutId: 'pw-other',
      status: 'planned',
    },
    storedSessionId: null,
    selectedWorkoutSessionPreview: null,
    workoutSheetModel: {
      title: 'Workout Session',
      programWorkoutId: 'pw-speed-c',
      exercises: [],
    },
    programWorkout: {
      id: 'pw-speed-c',
      nameSnapshot: 'Phase 4 Speed Accelerator C',
      exercises: [{
        id: 'pwe-speed-1',
        exerciseId: 'exercise-speed-1',
        sortOrder: 1,
        nameSnapshot: '10-0-5 Lateral Cross Under Push',
        sets: [
          { id: 'pws-speed-1', sortOrder: 1, prescribedReps: 1, prescribedLoad: 0, prescribedRpe: 6 },
          { id: 'pws-speed-2', sortOrder: 2, prescribedReps: 1, prescribedLoad: 0, prescribedRpe: 7 },
        ],
      }],
    },
    selectedProgramWorkoutId: 'pw-speed-c',
    startedAt: '2026-06-13T19:33:00.000Z',
  });

  assert.equal(plan.optimisticSession?.id, 'pw-speed-c');
  assert.equal(plan.optimisticSession?.nameSnapshot, 'Phase 4 Speed Accelerator C');
  assert.equal(plan.optimisticSession?.totalExercisesCount, 1);
  assert.equal(plan.optimisticSession?.totalSetsCount, 2);
  assert.equal(plan.optimisticSession?.exercises?.[0]?.nameSnapshot, '10-0-5 Lateral Cross Under Push');
  assert.equal(plan.optimisticSession?.exercises?.[0]?.sets?.[0]?.prescribedReps, 1);
  assert.equal(plan.optimisticSession?.exercises?.[0]?.sets?.[1]?.prescribedRpe, 7);
});

test('mergeResolvedStartWorkoutSession preserves the visible workout title when the resolved rich session has the same lineage', () => {
  const mergedSession = mergeResolvedStartWorkoutSession({
    optimisticSession: {
      id: 'pw-speed-c',
      programWorkoutId: 'pw-speed-c',
      nameSnapshot: 'Phase 4 Speed Accelerator C',
      exercises: [{ id: 'pwe-speed-1', sets: [{ id: 'pws-speed-1' }] }],
    },
    resolvedSession: {
      id: 'session-speed-c',
      programWorkoutId: 'pw-speed-c',
      nameSnapshot: 'Phase 4 Speed Accelerator',
      exercises: [{ id: 'resolved-exercise-1', sets: [{ id: 'resolved-set-1' }] }],
    },
  });

  assert.equal(mergedSession.nameSnapshot, 'Phase 4 Speed Accelerator C');
  assert.equal(mergedSession.id, 'session-speed-c');
  assert.equal(mergedSession.exercises?.[0]?.id, 'resolved-exercise-1');
});

test('orchestrateStartWorkoutFromSheet opens an optimistic program workout instead of a blank manual session when the sheet model is thin', async () => {
  const setSessionCalls = [];
  const activeViewCalls = [];

  const result = await orchestrateStartWorkoutFromSheet({
    effectiveSessionStore: {
      getCurrentSessionId: () => null,
      startSession: async () => ({
        session: {
          id: 'session-speed-c',
          programWorkoutId: 'pw-speed-c',
          status: 'in_progress',
          nameSnapshot: 'Workout Session',
          exercises: [],
          totalExercisesCount: 0,
          totalSetsCount: 0,
        },
      }),
    },
    session: { id: 'session-other', programWorkoutId: 'pw-other', status: 'planned' },
    workoutSheetModel: {
      title: 'Workout Session',
      programWorkoutId: 'pw-speed-c',
      exercises: [],
    },
    programWorkout: {
      id: 'pw-speed-c',
      nameSnapshot: 'Phase 4 Speed Accelerator C',
      exercises: [{
        id: 'pwe-speed-1',
        nameSnapshot: '10-0-5 Lateral Cross Under Push',
        sets: [{ id: 'pws-speed-1', prescribedReps: 1, prescribedRpe: 6 }],
      }],
    },
    selectedProgramWorkoutId: 'pw-speed-c',
    setSession: (nextSession) => setSessionCalls.push(nextSession),
    setIsActiveWorkoutViewOpen: (nextValue) => activeViewCalls.push(nextValue),
    runAfterInteractions: (callback) => callback(),
  });

  assert.equal(result.outcome, 'optimistic-session-opened');
  assert.equal(activeViewCalls[0], true);
  assert.equal(setSessionCalls[0]?.nameSnapshot, 'Phase 4 Speed Accelerator C');
  assert.equal(setSessionCalls[0]?.totalExercisesCount, 1);
  assert.equal(setSessionCalls[0]?.totalSetsCount, 1);
  assert.equal(setSessionCalls[0]?.exercises?.[0]?.nameSnapshot, '10-0-5 Lateral Cross Under Push');
});

test('orchestrateStartWorkoutFromSheet resumes a thin stored session with the rich program workout immediately', async () => {
  const setSessionCalls = [];
  const activeViewCalls = [];

  const result = await orchestrateStartWorkoutFromSheet({
    effectiveSessionStore: {
      getCurrentSessionId: () => 'session-speed-c',
      resumeSession: async () => ({
        id: 'session-speed-c',
        programWorkoutId: 'pw-speed-c',
        status: 'in_progress',
        nameSnapshot: 'Workout Session',
        exercises: [],
        totalExercisesCount: 0,
        totalSetsCount: 0,
      }),
    },
    session: {
      id: 'session-speed-c',
      programWorkoutId: 'pw-speed-c',
      status: 'in_progress',
      nameSnapshot: 'Workout Session',
      exercises: [],
      totalExercisesCount: 0,
      totalSetsCount: 0,
    },
    workoutSheetModel: {
      title: 'Workout Session',
      programWorkoutId: 'pw-speed-c',
      exercises: [],
    },
    programWorkout: {
      id: 'pw-speed-c',
      nameSnapshot: 'Phase 4 Speed Accelerator C',
      exercises: [{
        id: 'pwe-speed-1',
        nameSnapshot: '10-0-5 Lateral Cross Under Push',
        sets: [{ id: 'pws-speed-1', prescribedReps: 1, prescribedRpe: 6 }],
      }],
    },
    selectedProgramWorkoutId: 'pw-speed-c',
    setSession: (nextSession) => setSessionCalls.push(nextSession),
    setIsActiveWorkoutViewOpen: (nextValue) => activeViewCalls.push(nextValue),
    runAfterInteractions: (callback) => callback(),
  });

  assert.equal(result.outcome, 'resume-session-opened');
  assert.equal(activeViewCalls[0], true);
  assert.equal(result.nextSession?.nameSnapshot, 'Phase 4 Speed Accelerator C');
  assert.equal(setSessionCalls[0]?.nameSnapshot, 'Phase 4 Speed Accelerator C');
  assert.equal(setSessionCalls[0]?.totalExercisesCount, 1);
  assert.equal(setSessionCalls[0]?.totalSetsCount, 1);
  assert.equal(setSessionCalls[0]?.exercises?.[0]?.nameSnapshot, '10-0-5 Lateral Cross Under Push');
});

test('mergePersistedSessionResult preserves optimistic activeRestTimer when the saved session omits it', () => {
  const optimisticSession = {
    id: 'session-1',
    activeRestTimer: {
      exerciseId: 'exercise-1',
      setId: 'set-1',
      isRunning: true,
      remainingSeconds: 87,
    },
  };
  const savedSession = {
    id: 'session-1',
    status: 'in_progress',
  };

  assert.deepEqual(mergePersistedSessionResult({ savedSession, optimisticSession }), {
    ...savedSession,
    activeRestTimer: optimisticSession.activeRestTimer,
  });
});

test('mergePersistedSessionResult uses the saved timer when it exists', () => {
  const optimisticSession = {
    id: 'session-1',
    activeRestTimer: { remainingSeconds: 87 },
  };
  const savedSession = {
    id: 'session-1',
    activeRestTimer: { remainingSeconds: 45 },
  };

  assert.equal(mergePersistedSessionResult({ savedSession, optimisticSession }), savedSession);
});

test('workout-open helpers preserve precedence and fallback rules', () => {
  const requestedDayWorkoutPreview = {
    id: 'preview-id',
    programWorkoutId: 'pw-preview',
    workoutName: 'Preview workout',
    exercises: [{ id: 'exercise-1', name: 'Jump', setCount: 2, defaultRestSeconds: 90 }],
  };

  assert.equal(getRequestedProgramWorkoutId({
    payload: { programWorkoutId: 'pw-payload' },
    requestedDayWorkoutPreview,
    selectedProgramWorkoutId: 'pw-selected',
  }), 'pw-payload');

  assert.equal(getRequestedProgramWorkoutId({
    payload: null,
    requestedDayWorkoutPreview,
    selectedProgramWorkoutId: 'pw-selected',
  }), 'pw-preview');

  assert.equal(getRequestedProgramWorkoutId({
    payload: null,
    requestedDayWorkoutPreview: { id: 'preview-id' },
    selectedProgramWorkoutId: 'pw-selected',
  }), 'preview-id');

  assert.equal(getRequestedProgramWorkoutId({
    payload: null,
    requestedDayWorkoutPreview: null,
    selectedProgramWorkoutId: 'pw-selected',
  }), 'pw-selected');

  const fallbackStore = { getProgramWorkout() {} };
  assert.equal(shouldUseFallbackWorkout({ selectedWorkout: null, effectiveSessionStore: fallbackStore }), true);
  assert.equal(shouldUseFallbackWorkout({ selectedWorkout: { id: 'pw-1', exercises: [] }, effectiveSessionStore: fallbackStore }), true);
  assert.equal(shouldUseFallbackWorkout({ selectedWorkout: { id: 'pw-1', nameSnapshot: 'Saved workout', exercises: [] }, effectiveSessionStore: fallbackStore }), false);
  assert.equal(shouldUseFallbackWorkout({ selectedWorkout: { id: 'pw-1', exercises: [{ id: 'exercise-1' }] }, effectiveSessionStore: fallbackStore }), false);
});

test('buildImmediateWorkoutSheetPreview reuses the loaded workout or synthesizes a lightweight preview', () => {
  const trainStateProgramWorkout = {
    id: 'pw-loaded',
    exercises: [{ id: 'exercise-1' }],
  };

  assert.equal(buildImmediateWorkoutSheetPreview({
    trainStateProgramWorkout,
    requestedProgramWorkoutId: 'pw-loaded',
    requestedDayWorkoutPreview: null,
  }), trainStateProgramWorkout);

  const preview = buildImmediateWorkoutSheetPreview({
    trainStateProgramWorkout,
    requestedProgramWorkoutId: 'pw-preview',
    requestedDayWorkoutPreview: {
      workoutName: 'Sprint A',
      exercises: [{ id: 'exercise-1', name: 'Sled Push', setCount: 3, defaultRestSeconds: 60 }],
    },
  });

  assert.deepEqual(preview, {
    id: 'pw-preview',
    programWorkoutId: 'pw-preview',
    nameSnapshot: '',
    exercises: [],
  });
  assert.equal(hasRichSessionStructure(preview), false);
});

test('deriveWorkoutOpenRequestContext resolves the requested workout-open context before preview fetches run', () => {
  const trainState = {
    programWorkout: {
      id: 'pw-selected',
      workoutName: 'Selected workout',
      exercises: [{ id: 'exercise-selected' }],
    },
    program: {
      calendarWeek: [
        {
          id: 'day-1',
          workoutPreview: {
            id: 'preview-day-1',
            programWorkoutId: 'pw-day-1',
          },
        },
        {
          id: 'day-2',
          workoutPreview: {
            id: 'preview-day-2',
            programWorkoutId: 'pw-day-2',
            workoutName: 'Preview day 2',
            exercises: [{ id: 'exercise-day-2', name: 'Sled Push', setCount: 3, defaultRestSeconds: 60 }],
          },
        },
      ],
    },
  };

  assert.deepEqual(deriveWorkoutOpenRequestContext({
    payload: { selectedDayId: 'day-2' },
    selectedCalendarDayId: 'day-1',
    selectedProgramWorkoutId: 'pw-selected',
    trainState,
  }), {
    requestedCalendarDayId: 'day-2',
    requestedDayWorkoutPreview: {
      id: 'preview-day-2',
      programWorkoutId: 'pw-day-2',
      workoutName: 'Preview day 2',
      exercises: [{ id: 'exercise-day-2', name: 'Sled Push', setCount: 3, defaultRestSeconds: 60 }],
    },
    requestedProgramWorkoutId: 'pw-day-2',
    immediateProgramWorkout: createWorkoutSheetProgramWorkoutPreview({
      workoutPreview: {
        id: 'preview-day-2',
        programWorkoutId: 'pw-day-2',
        workoutName: 'Preview day 2',
        exercises: [{ id: 'exercise-day-2', name: 'Sled Push', setCount: 3, defaultRestSeconds: 60 }],
      },
      programWorkoutId: 'pw-day-2',
    }),
    workoutOpenRequestContext: {
      requestedCalendarDayId: 'day-2',
      requestedDayWorkoutPreview: {
        id: 'preview-day-2',
        programWorkoutId: 'pw-day-2',
        workoutName: 'Preview day 2',
        exercises: [{ id: 'exercise-day-2', name: 'Sled Push', setCount: 3, defaultRestSeconds: 60 }],
      },
      requestedProgramWorkoutId: 'pw-day-2',
    },
  });
});

test('deriveWorkoutOpenRequestContext falls back to the selected day and selected workout id when the requested day has no preview', () => {
  const trainStateProgramWorkout = {
    id: 'pw-selected',
    exercises: [{ id: 'exercise-selected' }],
  };
  const trainState = {
    programWorkout: trainStateProgramWorkout,
    program: {
      calendarWeek: [
        {
          id: 'day-1',
          workoutPreview: null,
        },
      ],
    },
  };

  assert.deepEqual(deriveWorkoutOpenRequestContext({
    payload: null,
    selectedCalendarDayId: 'day-1',
    selectedProgramWorkoutId: 'pw-selected',
    trainState,
  }), {
    requestedCalendarDayId: 'day-1',
    requestedDayWorkoutPreview: null,
    requestedProgramWorkoutId: 'pw-selected',
    immediateProgramWorkout: trainStateProgramWorkout,
    workoutOpenRequestContext: {
      requestedCalendarDayId: 'day-1',
      requestedDayWorkoutPreview: null,
      requestedProgramWorkoutId: 'pw-selected',
    },
  });
});

test('resolveWorkoutOpenPreview keeps the selected workout when the primary fetch returns exercises', async () => {
  const primaryCalls = [];
  let fallbackCalls = 0;
  const selectedWorkout = { id: 'pw-upper-b', exercises: [{ id: 'exercise-1' }] };

  const resolvedWorkout = await resolveWorkoutOpenPreview({
    requestedProgramWorkoutId: 'pw-upper-b',
    effectiveSessionStore: {
      async getProgramWorkout() {
        fallbackCalls += 1;
        return { id: 'pw-upper-b', exercises: [{ id: 'fallback-exercise-1' }] };
      },
    },
    workoutClient: {
      async getProgramWorkoutById(programWorkoutId) {
        primaryCalls.push(programWorkoutId);
        return selectedWorkout;
      },
    },
  });

  assert.equal(resolvedWorkout.selectedWorkout, selectedWorkout);
  assert.equal(resolvedWorkout.selectedWorkoutError, null);
  assert.deepEqual(primaryCalls, ['pw-upper-b']);
  assert.equal(fallbackCalls, 0);
});

test('resolveWorkoutOpenPreview falls back to the session store when the primary fetch is thin', async () => {
  const selectedWorkout = { id: 'pw-upper-b', exercises: [] };
  const fallbackWorkout = { id: 'pw-upper-b', exercises: [{ id: 'exercise-1' }] };

  const resolvedWorkout = await resolveWorkoutOpenPreview({
    requestedProgramWorkoutId: 'pw-upper-b',
    effectiveSessionStore: {
      async getProgramWorkout({ programWorkoutId }) {
        assert.equal(programWorkoutId, 'pw-upper-b');
        return fallbackWorkout;
      },
    },
    workoutClient: {
      async getProgramWorkoutById() {
        return selectedWorkout;
      },
    },
  });

  assert.equal(resolvedWorkout.selectedWorkout, fallbackWorkout);
  assert.equal(resolvedWorkout.selectedWorkoutError, null);
});

test('applyWorkoutOpenStateTransition prefers the resolved workout, falls back to the immediate preview, and clears the session preview', () => {
  const programWorkoutPreviewCalls = [];
  const workoutSessionPreviewCalls = [];
  const immediateProgramWorkout = { id: 'pw-immediate' };
  const selectedWorkout = { id: 'pw-resolved' };

  applyWorkoutOpenStateTransition({
    immediateProgramWorkout,
    selectedWorkout,
    setSelectedProgramWorkoutPreview: (value) => programWorkoutPreviewCalls.push(value),
    setSelectedWorkoutSessionPreview: (value) => workoutSessionPreviewCalls.push(value),
  });

  applyWorkoutOpenStateTransition({
    immediateProgramWorkout,
    selectedWorkout: null,
    setSelectedProgramWorkoutPreview: (value) => programWorkoutPreviewCalls.push(value),
    setSelectedWorkoutSessionPreview: (value) => workoutSessionPreviewCalls.push(value),
  });

  applyWorkoutOpenStateTransition({
    immediateProgramWorkout: null,
    selectedWorkout: null,
    setSelectedProgramWorkoutPreview: (value) => programWorkoutPreviewCalls.push(value),
    setSelectedWorkoutSessionPreview: (value) => workoutSessionPreviewCalls.push(value),
  });

  assert.deepEqual(programWorkoutPreviewCalls, [
    selectedWorkout,
    immediateProgramWorkout,
    null,
  ]);
  assert.deepEqual(workoutSessionPreviewCalls, [null, null, null]);
});

test('orchestrateWorkoutOpen logs, opens the sheet, applies the immediate preview, and then settles the workout selection', async () => {
  const calls = [];
  const selectedWorkout = { id: 'pw-resolved', exercises: [{ id: 'exercise-1' }] };
  const effectiveSessionStore = { async getProgramWorkout() { return null; } };
  const session = { id: 'session-1', programWorkoutId: 'pw-current' };
  const trainState = { programWorkout: { id: 'pw-selected' } };
  const selectedWorkoutSessionPreview = { id: 'session-preview-1' };
  const setSelectedProgramWorkoutPreview = () => {};
  const setSelectedWorkoutSessionPreview = () => {};

  const result = await orchestrateWorkoutOpen({
    targetKey: 'workout',
    payload: { selectedDayId: 'day-1' },
    selectedCalendarDayId: 'day-2',
    selectedProgramWorkoutId: 'pw-selected',
    workoutOpenRequestContext: {
      requestedCalendarDayId: 'day-1',
      requestedDayWorkoutPreview: { id: 'preview-day-1' },
      requestedProgramWorkoutId: 'pw-resolved',
    },
    requestedProgramWorkoutId: 'pw-resolved',
    immediateProgramWorkout: { id: 'pw-immediate' },
    effectiveSessionStore,
    workoutClient: {
      async getProgramWorkoutById(programWorkoutId) {
        assert.equal(programWorkoutId, 'pw-resolved');
        return selectedWorkout;
      },
    },
    session,
    trainState,
    selectedWorkoutSessionPreview,
    logWorkoutOpenTap: (payload) => calls.push(['tap', payload]),
    logWorkoutOpenOpeningWorkoutSheet: () => calls.push(['opening']),
    setIsWorkoutSheetOpen: (value) => calls.push(['sheet', value]),
    setSelectedProgramWorkoutPreview,
    setSelectedWorkoutSessionPreview,
    applyWorkoutOpenStateTransition: (payload) => calls.push(['transition', payload]),
    logResolvedWorkout: (payload) => calls.push(['resolved', payload]),
    logMissingProgramWorkoutId: (payload) => calls.push(['missing', payload]),
  });

  assert.deepEqual(result, {
    resolution: 'resolved-workout',
    selectedWorkout,
  });
  assert.equal(calls.length, 6);
  assert.deepEqual(calls[0], ['tap', {
    targetKey: 'workout',
    payload: { selectedDayId: 'day-1' },
    selectedCalendarDayId: 'day-2',
    selectedProgramWorkoutId: 'pw-selected',
    requestedCalendarDayId: 'day-1',
    requestedDayWorkoutPreview: { id: 'preview-day-1' },
    requestedProgramWorkoutId: 'pw-resolved',
    effectiveSessionStore,
    session,
    trainState,
    selectedWorkoutSessionPreview,
  }]);
  assert.deepEqual(calls[1], ['opening']);
  assert.deepEqual(calls[2], ['sheet', true]);
  assert.equal(calls[3][0], 'transition');
  assert.deepEqual(calls[3][1].immediateProgramWorkout, { id: 'pw-immediate' });
  assert.equal(calls[3][1].selectedWorkout, undefined);
  assert.equal(calls[3][1].setSelectedProgramWorkoutPreview, setSelectedProgramWorkoutPreview);
  assert.equal(calls[3][1].setSelectedWorkoutSessionPreview, setSelectedWorkoutSessionPreview);
  assert.deepEqual(calls[4], ['resolved', {
    requestedProgramWorkoutId: 'pw-resolved',
    selectedWorkout,
  }]);
  assert.equal(calls[5][0], 'transition');
  assert.deepEqual(calls[5][1].immediateProgramWorkout, { id: 'pw-immediate' });
  assert.equal(calls[5][1].selectedWorkout, selectedWorkout);
  assert.equal(calls[5][1].setSelectedProgramWorkoutPreview, setSelectedProgramWorkoutPreview);
  assert.equal(calls[5][1].setSelectedWorkoutSessionPreview, setSelectedWorkoutSessionPreview);
});

test('settleWorkoutOpenSelection resolves and applies the fetched workout when a requested workout id exists', async () => {
  const calls = [];
  const selectedWorkout = { id: 'pw-resolved', exercises: [{ id: 'exercise-1' }] };

  const result = await settleWorkoutOpenSelection({
    requestedProgramWorkoutId: 'pw-resolved',
    immediateProgramWorkout: { id: 'pw-immediate' },
    effectiveSessionStore: { async getProgramWorkout() { return null; } },
    workoutClient: {
      async getProgramWorkoutById(programWorkoutId) {
        assert.equal(programWorkoutId, 'pw-resolved');
        return selectedWorkout;
      },
    },
    logResolvedWorkout: (payload) => calls.push(['resolved', payload]),
    logMissingProgramWorkoutId: (payload) => calls.push(['missing', payload]),
    applyStateTransition: (payload) => calls.push(['apply', payload]),
  });

  assert.deepEqual(result, {
    resolution: 'resolved-workout',
    selectedWorkout,
  });
  assert.deepEqual(calls, [
    ['resolved', {
      requestedProgramWorkoutId: 'pw-resolved',
      selectedWorkout,
    }],
    ['apply', {
      immediateProgramWorkout: { id: 'pw-immediate' },
      selectedWorkout,
    }],
  ]);
});

test('settleWorkoutOpenSelection clears the preview when no workout id or immediate workout exists', async () => {
  const calls = [];

  const result = await settleWorkoutOpenSelection({
    requestedProgramWorkoutId: null,
    immediateProgramWorkout: null,
    logResolvedWorkout: (payload) => calls.push(['resolved', payload]),
    logMissingProgramWorkoutId: (payload) => calls.push(['missing', payload]),
    applyStateTransition: (payload) => calls.push(['apply', payload]),
  });

  assert.deepEqual(result, {
    resolution: 'missing-program-workout-id',
    selectedWorkout: null,
  });
  assert.deepEqual(calls, [
    ['missing', {
      requestedProgramWorkoutId: null,
    }],
    ['apply', {
      immediateProgramWorkout: null,
      selectedWorkout: null,
    }],
  ]);
});

test('settleWorkoutOpenSelection leaves the immediate preview in place when no fetch is needed', async () => {
  const calls = [];

  const result = await settleWorkoutOpenSelection({
    requestedProgramWorkoutId: null,
    immediateProgramWorkout: { id: 'pw-immediate' },
    logResolvedWorkout: (payload) => calls.push(['resolved', payload]),
    logMissingProgramWorkoutId: (payload) => calls.push(['missing', payload]),
    applyStateTransition: (payload) => calls.push(['apply', payload]),
  });

  assert.deepEqual(result, {
    resolution: 'immediate-preview-only',
    selectedWorkout: null,
  });
  assert.deepEqual(calls, []);
});

test('App workout-open branch delegates the remaining orchestration to the workout-open helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const workoutOpenBranch = source.match(/if \(targetKey === 'workout'\) \{[\s\S]*?\n\s+return;\n\s+\}/)?.[0] || '';

  assert.match(source, /workout-open-selection\.js/);
  assert.match(workoutOpenBranch, /await orchestrateWorkoutOpen\(\{/);
  assert.doesNotMatch(workoutOpenBranch, /logWorkoutOpenTap\(\{/);
  assert.doesNotMatch(workoutOpenBranch, /logWorkoutOpenOpeningWorkoutSheet\(\{/);
  assert.doesNotMatch(workoutOpenBranch, /setIsWorkoutSheetOpen\(true\);/);
  assert.doesNotMatch(workoutOpenBranch, /applyWorkoutOpenStateTransition\(\{/);
  assert.doesNotMatch(workoutOpenBranch, /await settleWorkoutOpenSelection\(\{/);
});

test('session orchestration helper stays pure and does not import demo train builders', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/session-orchestration.js'), 'utf8');

  assert.doesNotMatch(source, /createTrainDemoState/);
});


test('session diagnostics helper summarizes nested session details', () => {
  const summary = getSessionDebugSummary({
    id: 'session-1',
    programWorkoutId: 'pw-lower-a',
    status: 'in_progress',
    startedAt: '2026-04-23T20:00:00.000Z',
    elapsedSeconds: 75,
    exercises: [{
      id: 'session-exercise-1',
      exerciseId: 'exercise-1',
      nameSnapshot: 'Trap Bar Deadlift',
      sets: [{ id: 'set-1' }, { id: 'set-2' }],
    }],
    activeRestTimer: {
      exerciseId: 'exercise-1',
      setId: 'set-2',
      isRunning: true,
      remainingSeconds: 33,
    },
  });

  assert.deepEqual(summary, {
    id: 'session-1',
    programWorkoutId: 'pw-lower-a',
    status: 'in_progress',
    startedAt: '2026-04-23T20:00:00.000Z',
    completedAt: null,
    discardedAt: null,
    elapsedSeconds: 75,
    exerciseCount: 1,
    exercises: [{
      id: 'session-exercise-1',
      programWorkoutId: null,
      exerciseId: 'exercise-1',
      name: 'Trap Bar Deadlift',
      setCount: 2,
    }],
    activeRestTimer: {
      exerciseId: 'exercise-1',
      setId: 'set-2',
      isRunning: true,
      remainingSeconds: 33,
    },
  });
});

test('session diagnostics helper logs session sync summaries with preservation status', () => {
  const infoCalls = [];
  const currentSession = {
    id: 'session-1',
    programWorkoutId: 'pw-lower-a',
    status: 'in_progress',
    exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1' }] }],
  };
  const nextSession = {
    id: 'session-1',
    programWorkoutId: 'pw-lower-a',
    status: 'in_progress',
    exercises: [],
  };

  logResolvedIncomingSession({
    logger: {
      info(message, payload) {
        infoCalls.push([message, payload]);
      },
    },
    currentSession,
    nextSession,
    isActiveWorkoutViewOpen: true,
    resolvedSession: currentSession,
  });

  assert.deepEqual(infoCalls, [[
    '[session-sync] resolved',
    {
      isActiveWorkoutViewOpen: true,
      isStartingWorkout: false,
      shouldPreserveCurrentSession: true,
      currentSession: getSessionDebugSummary(currentSession),
      incomingSession: getSessionDebugSummary(nextSession),
      resolvedSession: getSessionDebugSummary(currentSession),
    },
  ]]);
});

test('session diagnostics helper summarizes start-workout tap payloads', () => {
  assert.deepEqual(getStartWorkoutTapSummary({
    effectiveSessionStore: { startSession() {} },
    selectedProgramWorkoutId: 'pw-upper-b',
    session: {
      id: 'session-1',
      programWorkoutId: 'pw-lower-a',
    },
    selectedWorkoutSessionPreview: {
      programWorkoutId: 'pw-preview-a',
    },
    workoutSheetModel: {
      programWorkoutId: 'pw-sheet-a',
    },
  }), {
    hasSessionStore: true,
    selectedProgramWorkoutId: 'pw-upper-b',
    currentSessionId: 'session-1',
    currentSessionProgramWorkoutId: 'pw-lower-a',
    previewProgramWorkoutId: 'pw-preview-a',
    sheetProgramWorkoutId: 'pw-sheet-a',
  });
});

test('session diagnostics helper logs start-workout tap payloads', () => {
  const infoCalls = [];

  logStartWorkoutTap({
    logger: {
      info(message, payload) {
        infoCalls.push([message, payload]);
      },
    },
    effectiveSessionStore: { startSession() {} },
    selectedProgramWorkoutId: 'pw-upper-b',
    session: {
      id: 'session-1',
      programWorkoutId: 'pw-lower-a',
    },
    selectedWorkoutSessionPreview: {
      programWorkoutId: 'pw-preview-a',
    },
    workoutSheetModel: {
      programWorkoutId: 'pw-sheet-a',
    },
  });

  assert.deepEqual(infoCalls, [[
    '[start-workout] tap',
    {
      hasSessionStore: true,
      selectedProgramWorkoutId: 'pw-upper-b',
      currentSessionId: 'session-1',
      currentSessionProgramWorkoutId: 'pw-lower-a',
      previewProgramWorkoutId: 'pw-preview-a',
      sheetProgramWorkoutId: 'pw-sheet-a',
    },
  ]]);
});

test('session diagnostics helper summarizes and logs workout-open tap payloads', () => {
  const loggerCalls = [];
  const payload = { selectedDayId: 'day-2', source: 'calendar' };
  const trainState = {
    programWorkout: {
      id: 'pw-loaded',
      exercises: [{ id: 'exercise-1' }, { id: 'exercise-2' }],
    },
  };
  const session = {
    id: 'session-1',
    programWorkoutId: 'pw-current',
    exercises: [{ id: 'session-exercise-1' }],
  };
  const selectedWorkoutSessionPreview = {
    exercises: [{ id: 'preview-exercise-1' }, { id: 'preview-exercise-2' }, { id: 'preview-exercise-3' }],
  };

  const summary = getWorkoutOpenTapSummary({
    targetKey: 'workout',
    payload,
    selectedCalendarDayId: 'day-1',
    requestedCalendarDayId: 'day-2',
    selectedProgramWorkoutId: 'pw-selected',
    requestedProgramWorkoutId: 'pw-requested',
    effectiveSessionStore: { getProgramWorkout() {} },
    session,
    trainState,
    selectedWorkoutSessionPreview,
  });

  assert.deepEqual(summary, {
    targetKey: 'workout',
    payload,
    selectedCalendarDayId: 'day-1',
    requestedCalendarDayId: 'day-2',
    selectedProgramWorkoutId: 'pw-selected',
    requestedProgramWorkoutId: 'pw-requested',
    hasSessionStore: true,
    currentSessionProgramWorkoutId: 'pw-current',
    currentSessionExerciseCount: 1,
    trainStateProgramWorkoutId: 'pw-loaded',
    trainStateProgramWorkoutExerciseCount: 2,
    selectedPreviewExerciseCount: 3,
  });

  logWorkoutOpenTap({
    logger: {
      info(message, loggedPayload) {
        loggerCalls.push([message, loggedPayload]);
      },
    },
    targetKey: 'workout',
    payload,
    selectedCalendarDayId: 'day-1',
    requestedCalendarDayId: 'day-2',
    selectedProgramWorkoutId: 'pw-selected',
    requestedProgramWorkoutId: 'pw-requested',
    effectiveSessionStore: { getProgramWorkout() {} },
    session,
    trainState,
    selectedWorkoutSessionPreview,
  });

  assert.deepEqual(loggerCalls, [[
    '[workout-open] tap',
    summary,
  ]]);
});

test('App routes workout-open tap diagnostics through the extracted orchestration helper', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const workoutOpenBranch = source.match(/if \(targetKey === 'workout'\) \{[\s\S]*?\n\s+return;\n\s+\}/)?.[0] || '';

  assert.match(source, /workout-open-selection\.js/);
  assert.doesNotMatch(workoutOpenBranch, /logWorkoutOpenTap\s*\(\s*\{/);
  assert.doesNotMatch(workoutOpenBranch, /console\.info\('\[workout-open\] tap',\s*\{/);
});

test('session diagnostics helper logs the remaining workout-open lifecycle events', () => {
  const infoCalls = [];
  const warnCalls = [];
  const logger = {
    info(message, payload) {
      infoCalls.push([message, payload]);
    },
    warn(message, payload) {
      warnCalls.push([message, payload]);
    },
  };

  logWorkoutOpenOpeningWorkoutSheet({ logger });
  logWorkoutOpenPreviewFetchFailed({
    logger,
    requestedProgramWorkoutId: 'pw-preview',
    error: new Error('preview boom'),
  });
  logWorkoutOpenFallbackWorkout({
    logger,
    requestedProgramWorkoutId: 'pw-fallback',
    selectedWorkout: { id: 'pw-selected', exercises: [{ id: 'exercise-1' }] },
    fallbackWorkout: { id: 'pw-fallback', exercises: [{ id: 'exercise-2' }, { id: 'exercise-3' }] },
    selectedWorkoutError: new Error('selected boom'),
  });
  logWorkoutOpenFallbackFetchFailed({
    logger,
    requestedProgramWorkoutId: 'pw-fallback-failed',
    error: new Error('fallback boom'),
  });
  logWorkoutOpenResolvedWorkout({
    logger,
    requestedProgramWorkoutId: 'pw-resolved',
    selectedWorkout: { id: 'pw-picked', exercises: [{ id: 'exercise-4' }, { id: 'exercise-5' }] },
  });
  logWorkoutOpenMissingProgramWorkoutId({
    logger,
    requestedProgramWorkoutId: null,
  });

  assert.deepEqual(infoCalls, [
    ['[workout-open] opening workout sheet', undefined],
    ['[workout-open] fallback workout', {
      requestedProgramWorkoutId: 'pw-fallback',
      selectedWorkoutId: 'pw-selected',
      selectedWorkoutExerciseCount: 1,
      fallbackWorkoutId: 'pw-fallback',
      fallbackWorkoutExerciseCount: 2,
      selectedWorkoutError: 'selected boom',
    }],
    ['[workout-open] resolved workout', {
      requestedProgramWorkoutId: 'pw-resolved',
      resolvedProgramWorkoutId: 'pw-picked',
      resolvedExerciseCount: 2,
    }],
  ]);
  assert.deepEqual(warnCalls, [
    ['[workout-open] preview fetch failed', {
      requestedProgramWorkoutId: 'pw-preview',
      message: 'preview boom',
    }],
    ['[workout-open] fallback fetch failed', {
      requestedProgramWorkoutId: 'pw-fallback-failed',
      message: 'fallback boom',
    }],
    ['[workout-open] missing programWorkoutId', {
      requestedProgramWorkoutId: null,
    }],
  ]);
});

test('App keeps the extracted workout-open lifecycle helpers outside App.js branch wiring', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const workoutOpenBranch = source.match(/if \(targetKey === 'workout'\) \{[\s\S]*?\n\s+return;\n\s+\}/)?.[0] || '';

  assert.match(source, /workout-open-selection\.js/);
  assert.doesNotMatch(workoutOpenBranch, /logWorkoutOpenOpeningWorkoutSheet\s*\(\s*\{/);
  assert.doesNotMatch(workoutOpenBranch, /settleWorkoutOpenSelection\s*\(/);
  assert.doesNotMatch(source, /console\.(info|warn)\('\[workout-open\] (opening workout sheet|preview fetch failed|fallback workout|fallback fetch failed|resolved workout|missing programWorkoutId)'/);
});

test('session diagnostics helper logs the remaining start-workout lifecycle events', () => {
  const infoCalls = [];
  const warnCalls = [];
  const errorCalls = [];
  const logger = {
    info(message, payload) {
      infoCalls.push([message, payload]);
    },
    warn(message) {
      warnCalls.push(message);
    },
    error(message, payload) {
      errorCalls.push([message, payload]);
    },
  };

  logStartWorkoutBlockedMissingStore({ logger });
  logStartWorkoutResumeExistingSession({ logger, sessionId: 'session-7', targetProgramWorkoutId: 'pw-7' });
  logStartWorkoutOpenOptimisticSession({ logger, targetProgramWorkoutId: 'pw-8' });
  logStartWorkoutCreateSession({ logger, targetProgramWorkoutId: 'pw-9', storedSessionId: 'session-9', sessionStatus: 'planned' });
  logStartWorkoutFailed({ logger, error: new Error('boom'), targetProgramWorkoutId: 'pw-10' });
  logStartWorkoutResolvedSession({ logger, nextSession: { id: 'session-11', programWorkoutId: 'pw-11' } });
  logStartWorkoutBlockedNoNextSession({ logger });
  logStartWorkoutOpenActiveWorkoutView({ logger });

  assert.deepEqual(warnCalls, [
    '[start-workout] blocked: missing effectiveSessionStore',
    '[start-workout] blocked: no nextSession returned',
  ]);
  assert.deepEqual(infoCalls, [
    ['[start-workout] resume existing session', { sessionId: 'session-7', targetProgramWorkoutId: 'pw-7' }],
    ['[start-workout] open optimistic session', { targetProgramWorkoutId: 'pw-8' }],
    ['[start-workout] create session', { targetProgramWorkoutId: 'pw-9', storedSessionId: 'session-9', sessionStatus: 'planned' }],
    ['[start-workout] resolved session', { nextSessionId: 'session-11', nextProgramWorkoutId: 'pw-11' }],
    ['[start-workout] open active workout view', undefined],
  ]);
  assert.deepEqual(errorCalls, [[
    '[start-workout] failed',
    {
      message: 'boom',
      targetProgramWorkoutId: 'pw-10',
    },
  ]]);
});

test('session persistence controller saves and merges a non-optimistic update', async () => {
  const nextSession = {
    id: 'session-1',
    activeRestTimer: { remainingSeconds: 33 },
  };
  const savedSession = {
    id: 'session-1',
    status: 'in_progress',
  };
  const setSessionCalls = [];
  const controller = createSessionPersistenceController({
    effectiveSessionStore: {
      async saveSession(session) {
        assert.equal(session, nextSession);
        return savedSession;
      },
    },
    setSession(value) {
      setSessionCalls.push(value);
    },
    optimisticSessionMutationRef: { current: 0 },
    getSessionDebugSummary(value) {
      return value;
    },
  });

  const result = await controller.persistSessionUpdate(nextSession);

  assert.deepEqual(result, {
    ...savedSession,
    activeRestTimer: nextSession.activeRestTimer,
  });
  assert.deepEqual(setSessionCalls, [result]);
});

test('session persistence controller keeps optimistic ordering and ignores stale saves', async () => {
  let resolveFirstSave;
  let resolveSecondSave;
  const setSessionCalls = [];
  const controller = createSessionPersistenceController({
    effectiveSessionStore: {
      saveSession(session) {
        if (session.id === 'session-1') {
          return new Promise((resolve) => {
            resolveFirstSave = resolve;
          });
        }

        return new Promise((resolve) => {
          resolveSecondSave = resolve;
        });
      },
    },
    setSession(value) {
      setSessionCalls.push(value);
    },
    optimisticSessionMutationRef: { current: 0 },
  });
  const firstSession = { id: 'session-1', activeRestTimer: { remainingSeconds: 45 } };
  const secondSession = { id: 'session-2', activeRestTimer: { remainingSeconds: 15 } };

  assert.equal(controller.persistSessionUpdateOptimistic(firstSession), firstSession);
  assert.equal(controller.persistSessionUpdateOptimistic(secondSession), secondSession);
  resolveFirstSave({ id: 'saved-1', activeRestTimer: { remainingSeconds: 99 } });
  await Promise.resolve();
  resolveSecondSave({ id: 'saved-2', status: 'in_progress' });
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(setSessionCalls, [
    firstSession,
    secondSession,
    {
      id: 'saved-2',
      status: 'in_progress',
      activeRestTimer: secondSession.activeRestTimer,
    },
  ]);
});

test('session persistence controller routes optimistic deletions through the matching store method', async () => {
  let resolveDeleteExercise;
  let resolveDeleteSet;
  const setSessionCalls = [];
  const controller = createSessionPersistenceController({
    effectiveSessionStore: {
      deleteSessionExercise(session, payload) {
        assert.equal(session.id, 'session-exercise');
        assert.deepEqual(payload, { exerciseId: 'exercise-1' });
        return new Promise((resolve) => {
          resolveDeleteExercise = resolve;
        });
      },
      deleteSessionSet(session, payload) {
        assert.equal(session.id, 'session-set');
        assert.deepEqual(payload, { setId: 'set-1' });
        return new Promise((resolve) => {
          resolveDeleteSet = resolve;
        });
      },
    },
    setSession(value) {
      setSessionCalls.push(value);
    },
    optimisticSessionMutationRef: { current: 0 },
  });

  const deleteExerciseSession = { id: 'session-exercise', activeRestTimer: { remainingSeconds: 20 } };
  const deleteSetSession = { id: 'session-set', activeRestTimer: { remainingSeconds: 10 } };
  assert.equal(
    controller.persistSessionDeletionOptimistic(deleteExerciseSession, { exerciseId: 'exercise-1' }),
    deleteExerciseSession,
  );
  resolveDeleteExercise({ id: 'saved-exercise', status: 'in_progress' });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(
    controller.persistSessionDeletionOptimistic(deleteSetSession, { setId: 'set-1' }),
    deleteSetSession,
  );
  resolveDeleteSet({ id: 'saved-set', status: 'in_progress' });
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(setSessionCalls, [
    deleteExerciseSession,
    {
      id: 'saved-exercise',
      status: 'in_progress',
      activeRestTimer: deleteExerciseSession.activeRestTimer,
    },
    deleteSetSession,
    {
      id: 'saved-set',
      status: 'in_progress',
      activeRestTimer: deleteSetSession.activeRestTimer,
    },
  ]);
});

test('orchestrateStartWorkoutFromSheet logs the tap, builds the plan, and delegates resume flow through the helper seam', async () => {
  const calls = [];
  const resumedSession = { id: 'session-1', programWorkoutId: 'pw-upper-b', status: 'in_progress' };
  const store = {
    getCurrentSessionId() {
      calls.push(['getCurrentSessionId']);
      return 'session-1';
    },
    async resumeSession(sessionId) {
      calls.push(['resumeSession', sessionId]);
      return resumedSession;
    },
  };

  const result = await orchestrateStartWorkoutFromSheet({
    effectiveSessionStore: store,
    selectedProgramWorkoutId: 'pw-upper-b',
    session: { id: 'session-1', programWorkoutId: 'pw-upper-b', status: 'in_progress' },
    selectedWorkoutSessionPreview: { programWorkoutId: 'pw-upper-b', exercises: [{ id: 'exercise-1' }] },
    workoutSheetModel: { programWorkoutId: 'pw-upper-b' },
    startedAt: '2026-04-30T02:00:00.000Z',
    logStartWorkoutTap: (payload) => calls.push(['tap', payload]),
    setIsStartingWorkout: (value) => calls.push(['setIsStartingWorkout', value]),
    logStartWorkoutResumeExistingSession: (payload) => calls.push(['resume-log', payload]),
    logStartWorkoutResolvedSession: (payload) => calls.push(['resolved-log', payload]),
    logStartWorkoutOpenActiveWorkoutView: () => calls.push(['open-active-log']),
    setSession: (value) => calls.push(['setSession', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    runAfterInteractions: (callback) => {
      calls.push(['runAfterInteractions']);
      callback();
    },
  });

  assert.deepEqual(result, {
    outcome: 'resume-session-opened',
    startWorkoutPlan: {
      currentSessionProgramWorkoutId: 'pw-upper-b',
      optimisticSession: null,
      resumeSessionId: 'session-1',
      shouldResumeStoredSession: true,
      shouldStartNewSession: false,
      targetProgramWorkoutId: 'pw-upper-b',
    },
    nextSession: resumedSession,
    targetProgramWorkoutId: 'pw-upper-b',
  });
  assert.deepEqual(calls, [
    ['tap', {
      effectiveSessionStore: store,
      selectedProgramWorkoutId: 'pw-upper-b',
      session: { id: 'session-1', programWorkoutId: 'pw-upper-b', status: 'in_progress' },
      selectedWorkoutSessionPreview: { programWorkoutId: 'pw-upper-b', exercises: [{ id: 'exercise-1' }] },
      workoutSheetModel: { programWorkoutId: 'pw-upper-b' },
    }],
    ['setIsStartingWorkout', true],
    ['getCurrentSessionId'],
    ['resume-log', { sessionId: 'session-1', targetProgramWorkoutId: 'pw-upper-b' }],
    ['setSession', { id: 'session-1', programWorkoutId: 'pw-upper-b', status: 'in_progress' }],
    ['setIsWorkoutSheetOpen', false],
    ['setIsStartingWorkout', false],
    ['open-active-log'],
    ['runAfterInteractions'],
    ['setIsActiveWorkoutViewOpen', true],
    ['resumeSession', 'session-1'],
    ['resolved-log', { nextSession: resumedSession }],
    ['setSession', resumedSession],
  ]);
});

test('orchestrateStartWorkoutFromSheet passes explicit fresh-start intent through to the session store when resume is not allowed', async () => {
  const calls = []
  const createdSession = { id: 'session-new', programWorkoutId: 'pw-upper-b', status: 'in_progress' }
  const store = {
    getCurrentSessionId() {
      calls.push(['getCurrentSessionId'])
      return 'session-stale'
    },
    async startSession(options) {
      calls.push(['startSession', options])
      return { programWorkoutId: 'pw-upper-b', session: createdSession }
    },
  }

  const result = await orchestrateStartWorkoutFromSheet({
    effectiveSessionStore: store,
    selectedProgramWorkoutId: 'pw-upper-b',
    session: { id: 'session-stale', programWorkoutId: 'pw-old', status: 'planned' },
    selectedWorkoutSessionPreview: { programWorkoutId: 'pw-upper-b', exercises: [{ id: 'exercise-1' }] },
    workoutSheetModel: { programWorkoutId: 'pw-upper-b' },
    startedAt: '2026-04-30T02:00:00.000Z',
    setIsStartingWorkout: (value) => calls.push(['setIsStartingWorkout', value]),
    setSession: (value) => calls.push(['setSession', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    runAfterInteractions: (callback) => {
      calls.push(['runAfterInteractions'])
      callback()
    },
  })

  assert.equal(result.outcome, 'optimistic-session-opened')
  assert.deepEqual(calls.find(([name]) => name === 'startSession'), ['startSession', {
    startedAt: '2026-04-30T02:00:00.000Z',
    programWorkoutId: 'pw-upper-b',
    forceNewSession: true,
  }])
})

test('orchestrateStartWorkoutFromSheet opens the active workout immediately for an already in-progress matching session instead of waiting on resume first', async () => {
  const calls = [];
  const resumedSession = { id: 'session-1', programWorkoutId: 'pw-upper-b', status: 'in_progress' };
  let releaseResume;
  const resumeGate = new Promise((resolve) => { releaseResume = resolve; });
  const store = {
    getCurrentSessionId() {
      calls.push(['getCurrentSessionId']);
      return 'session-1';
    },
    async resumeSession(sessionId) {
      calls.push(['resumeSession', sessionId]);
      await resumeGate;
      return resumedSession;
    },
  };

  const pending = orchestrateStartWorkoutFromSheet({
    effectiveSessionStore: store,
    selectedProgramWorkoutId: 'pw-upper-b',
    session: { id: 'session-1', programWorkoutId: 'pw-upper-b', status: 'in_progress' },
    selectedWorkoutSessionPreview: { programWorkoutId: 'pw-upper-b', exercises: [{ id: 'exercise-1' }] },
    workoutSheetModel: { programWorkoutId: 'pw-upper-b' },
    startedAt: '2026-04-30T02:00:00.000Z',
    setIsStartingWorkout: (value) => calls.push(['setIsStartingWorkout', value]),
    setSession: (value) => calls.push(['setSession', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    runAfterInteractions: (callback) => {
      calls.push(['runAfterInteractions']);
      callback();
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(calls.some(([name, value]) => name === 'setSession' && value?.id === 'session-1'), true);
  assert.deepEqual(calls.slice(0, 7), [
    ['setIsStartingWorkout', true],
    ['getCurrentSessionId'],
    ['setSession', { id: 'session-1', programWorkoutId: 'pw-upper-b', status: 'in_progress' }],
    ['setIsWorkoutSheetOpen', false],
    ['setIsStartingWorkout', false],
    ['runAfterInteractions'],
    ['setIsActiveWorkoutViewOpen', true],
  ]);
  assert.equal(calls.some(([name]) => name === 'runAfterInteractions'), true);

  releaseResume();
  const result = await pending;
  assert.equal(result.outcome, 'resume-session-opened');
  assert.equal(calls.filter(([name]) => name === 'setIsActiveWorkoutViewOpen').length, 1);
});

test('orchestrateStartWorkoutFromSheet opens the active workout immediately for a new workout from the visible sheet model instead of waiting on startSession first', async () => {
  const calls = [];
  let releaseStart;
  const startGate = new Promise((resolve) => { releaseStart = resolve; });
  const createdSession = { id: 'session-new', programWorkoutId: 'pw-upper-b', status: 'in_progress', exercises: [{ id: 'exercise-1' }] };
  const store = {
    getCurrentSessionId() {
      calls.push(['getCurrentSessionId']);
      return null;
    },
    async startSession(options) {
      calls.push(['startSession', options]);
      await startGate;
      return { session: createdSession };
    },
  };

  const pending = orchestrateStartWorkoutFromSheet({
    effectiveSessionStore: store,
    selectedProgramWorkoutId: 'pw-upper-b',
    session: { id: 'session-old', programWorkoutId: 'pw-old', status: 'planned' },
    selectedWorkoutSessionPreview: null,
    workoutSheetModel: {
      title: 'Upper B',
      workoutNotes: '',
      programWorkoutId: 'pw-upper-b',
      exercises: [{
        id: 'exercise-1',
        exerciseId: 'exercise-1',
        programWorkoutExerciseId: 'pwe-1',
        sortOrder: 1,
        name: 'Bench Press',
        restLabel: '2:00',
        sets: [{
          id: 'set-1',
          programWorkoutSetId: 'pws-1',
          sortOrder: 1,
          setType: 'straight',
          prescribedRestSeconds: 120,
          targetLoadUnit: 'lb',
          load: '135',
          reps: '5',
          effort: '8',
        }],
      }],
    },
    startedAt: '2026-04-30T02:00:00.000Z',
    setIsStartingWorkout: (value) => calls.push(['setIsStartingWorkout', value]),
    setSession: (value) => calls.push(['setSession', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    runAfterInteractions: (callback) => {
      calls.push(['runAfterInteractions']);
      callback();
    },
  });

  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(calls.slice(0, 7), [
    ['setIsStartingWorkout', true],
    ['getCurrentSessionId'],
    ['setSession', calls[2][1]],
    ['setIsWorkoutSheetOpen', false],
    ['setIsStartingWorkout', false],
    ['runAfterInteractions'],
    ['setIsActiveWorkoutViewOpen', true],
  ]);
  assert.equal(calls[2][1]?.programWorkoutId, 'pw-upper-b');
  assert.equal(calls[2][1]?.status, 'in_progress');
  assert.equal(calls.some(([name]) => name === 'runAfterInteractions'), true);
  assert.equal(calls.some(([name]) => name === 'startSession'), true);

  releaseStart();
  const result = await pending;
  assert.equal(result.outcome, 'optimistic-session-opened');
  assert.equal(calls.filter(([name]) => name === 'setIsActiveWorkoutViewOpen').length, 1);
});

test('orchestrateStartWorkoutFromSheet ignores a late resolved start session after discard invalidates the request', async () => {
  const calls = [];
  const blockedResolvedSessions = [];
  let releaseStart;
  let isRequestStillActive = true;
  const startGate = new Promise((resolve) => { releaseStart = resolve; });
  const createdSession = { id: 'session-new', programWorkoutId: 'pw-upper-b', status: 'in_progress', exercises: [{ id: 'exercise-1' }] };
  const store = {
    getCurrentSessionId() {
      calls.push(['getCurrentSessionId']);
      return null;
    },
    async startSession(options) {
      calls.push(['startSession', options]);
      await startGate;
      return { session: createdSession };
    },
  };

  const pending = orchestrateStartWorkoutFromSheet({
    effectiveSessionStore: store,
    selectedProgramWorkoutId: 'pw-upper-b',
    session: { id: 'session-old', programWorkoutId: 'pw-old', status: 'planned' },
    selectedWorkoutSessionPreview: null,
    workoutSheetModel: {
      title: 'Upper B',
      programWorkoutId: 'pw-upper-b',
      exercises: [{ id: 'exercise-1', exerciseId: 'exercise-1', name: 'Bench Press', sets: [] }],
    },
    startedAt: '2026-04-30T02:00:00.000Z',
    setIsStartingWorkout: (value) => calls.push(['setIsStartingWorkout', value]),
    setSession: (value) => calls.push(['setSession', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    shouldApplyResolvedSession: () => isRequestStillActive,
    onBlockedResolvedSession: (resolvedSession) => blockedResolvedSessions.push(resolvedSession),
  });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(calls.filter(([name]) => name === 'setSession').length, 1);

  isRequestStillActive = false;
  releaseStart();
  await pending;
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(calls.filter(([name]) => name === 'setSession').length, 1);
  assert.equal(calls.some(([name, value]) => name === 'setSession' && value?.id === 'session-new'), false);
  assert.deepEqual(blockedResolvedSessions, [{ ...createdSession, nameSnapshot: 'Upper B' }]);
});

test('App imports the extracted session persistence and start-workout helper seams', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const handleStartWorkoutSource = source.match(/async function handleStartWorkoutFromSheet\(payload = null\) \{[\s\S]*?\n\s+\}/)?.[0] || '';

  assert.match(source, /session-persistence\.js/);
  assert.match(source, /createSessionPersistenceController/);
  assert.match(source, /session-diagnostics\.js/);
  assert.match(source, /getSessionDebugSummary/);
  assert.match(source, /start-workout-selection\.js/);
  assert.match(source, /orchestrateStartWorkoutFromSheet/);
  assert.match(handleStartWorkoutSource, /const startWorkoutSheetModel = payload\?\.selectedDayId \? todayWorkoutSheetModel : workoutSheetModel;/);
  assert.match(handleStartWorkoutSource, /await orchestrateStartWorkoutFromSheet\(\{/);
  assert.match(handleStartWorkoutSource, /selectedProgramWorkoutId: payload\?\.programWorkoutId \|\| startWorkoutSheetModel\?\.programWorkoutId \|\| currentDateProgramWorkoutId/);
  assert.match(handleStartWorkoutSource, /workoutSheetModel: startWorkoutSheetModel/);
  assert.match(handleStartWorkoutSource, /programWorkout: payload\?\.selectedDayId \? trainState\.programWorkout : resolvedWorkoutSheetProgramWorkout/);
  assert.match(handleStartWorkoutSource, /isActiveWorkoutHandoffPendingRef\.current = true;/);
  assert.match(handleStartWorkoutSource, /const startWorkoutOutcome = await orchestrateStartWorkoutFromSheet\(\{/);
  assert.match(handleStartWorkoutSource, /runAfterInteractions: InteractionManager\.runAfterInteractions/);
  assert.match(handleStartWorkoutSource, /onBlockedResolvedSession: discardResolvedStartWorkoutSession/);
  assert.match(source, /async function discardResolvedStartWorkoutSession\(resolvedSession\) \{[\s\S]*discardWorkoutSession\(\{[\s\S]*session: resolvedSession,[\s\S]*await effectiveSessionStore\?\.saveSession\?\.\(discardedSession\);[\s\S]*effectiveSessionStore\?\.clearSession\?\.\(\);[\s\S]*\}/);
  assert.doesNotMatch(handleStartWorkoutSource, /const startWorkoutPlan = buildStartWorkoutPlan\(\{/);
  assert.doesNotMatch(handleStartWorkoutSource, /effectiveSessionStore\.resumeSession\(/);
  assert.doesNotMatch(handleStartWorkoutSource, /effectiveSessionStore\.startSession\(/);
  assert.doesNotMatch(source, /async function persistSessionUpdate\(/);
  assert.doesNotMatch(source, /function getExerciseDebugSummary\(/);
});

test('orchestrateOpenOrResumeSession resumes an existing same-lineage session and switches to the session tab', async () => {
  const calls = [];
  const resumedSession = { id: 'session-1', programWorkoutId: 'pw-1', status: 'in_progress' };

  const result = await orchestrateOpenOrResumeSession({
    effectiveSessionStore: {
      async resumeSession(sessionId) {
        calls.push(['resumeSession', sessionId]);
        return resumedSession;
      },
    },
    session: { id: 'session-1', programWorkoutId: 'pw-1', status: 'in_progress' },
    selectedProgramWorkoutId: 'pw-1',
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setSession: (value) => calls.push(['setSession', value]),
    setActiveTrainTab: (value) => calls.push(['setActiveTrainTab', value]),
  });

  assert.deepEqual(result, {
    outcome: 'resumed-existing-session',
    nextSession: resumedSession,
    currentSessionProgramWorkoutId: 'pw-1',
  });
  assert.deepEqual(calls, [
    ['setIsWorkoutSheetOpen', false],
    ['resumeSession', 'session-1'],
    ['setSession', resumedSession],
    ['setActiveTrainTab', 'session'],
  ]);
});

test('orchestrateOpenOrResumeSession starts a new session when the current session lineage does not match', async () => {
  const calls = [];
  const startedSession = { id: 'session-2', programWorkoutId: 'pw-2', status: 'in_progress' };

  const result = await orchestrateOpenOrResumeSession({
    effectiveSessionStore: {
      async startSession(payload) {
        calls.push(['startSession', payload]);
        return { session: startedSession };
      },
    },
    session: { id: 'session-1', programWorkoutId: 'pw-1', status: 'in_progress' },
    selectedProgramWorkoutId: 'pw-2',
    startedAt: '2026-04-30T03:00:00.000Z',
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setSession: (value) => calls.push(['setSession', value]),
    setActiveTrainTab: (value) => calls.push(['setActiveTrainTab', value]),
  });

  assert.deepEqual(result, {
    outcome: 'started-new-session',
    nextSession: startedSession,
    currentSessionProgramWorkoutId: 'pw-1',
  });
  assert.deepEqual(calls, [
    ['setIsWorkoutSheetOpen', false],
    ['startSession', {
      startedAt: '2026-04-30T03:00:00.000Z',
      programWorkoutId: 'pw-2',
    }],
    ['setSession', startedSession],
    ['setActiveTrainTab', 'session'],
  ]);
});

test('App open-or-resume handler delegates the remaining inline orchestration to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const handleOpenOrResumeSource = source.match(/async function handleOpenOrResumeSession\(payload = null\) \{[\s\S]*?\n\s+\}/)?.[0] || '';

  assert.match(source, /open-resume-selection\.js/);
  assert.match(handleOpenOrResumeSource, /await orchestrateOpenOrResumeSession\(\{/);
  assert.match(handleOpenOrResumeSource, /selectedProgramWorkoutId: payload\?\.programWorkoutId \|\| selectedProgramWorkoutId/);
  assert.doesNotMatch(handleOpenOrResumeSource, /effectiveSessionStore\.resumeSession\(/);
  assert.doesNotMatch(handleOpenOrResumeSource, /effectiveSessionStore\.startSession\(/);
  assert.doesNotMatch(handleOpenOrResumeSource, /setIsWorkoutSheetOpen\(false\);/);
  assert.doesNotMatch(handleOpenOrResumeSource, /setActiveTrainTab\('session'\);/);
});

test('orchestrateOpenProgramSheet opens the program sheet immediately and hydrates the preview when a current program id exists', async () => {
  const calls = [];
  const trainState = { program: { id: 'program-1', name: 'Offseason' } };
  let resolveProgram;
  const programSheetClient = {
    getProgramById(programId) {
      calls.push(['getProgramById', programId]);
      return new Promise((resolve) => {
        resolveProgram = resolve;
      });
    },
  };

  const result = orchestrateOpenProgramSheet({
    trainState,
    programSheetClient,
    setProgramSheetReturnSurface: (value) => calls.push(['setProgramSheetReturnSurface', value]),
    setSelectedProgramPreview: (value) => calls.push(['setSelectedProgramPreview', value]),
    setIsProgramSheetOpen: (value) => calls.push(['setIsProgramSheetOpen', value]),
  });

  assert.deepEqual(result, {
    outcome: 'opened-and-hydrating',
    currentProgramId: 'program-1',
  });
  assert.deepEqual(calls.slice(0, 4), [
    ['setProgramSheetReturnSurface', null],
    ['setSelectedProgramPreview', { id: 'program-1', name: 'Offseason' }],
    ['setIsProgramSheetOpen', true],
    ['getProgramById', 'program-1'],
  ]);

  resolveProgram({ id: 'program-1', weeks: [{ id: 'week-1' }] });
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(calls[4][0], 'setSelectedProgramPreview');
  const updater = calls[4][1];
  assert.deepEqual(updater({ id: 'program-1', name: 'Offseason' }), {
    id: 'program-1',
    name: 'Offseason',
    weeks: [{ id: 'week-1' }],
  });
});

test('orchestrateOpenProgramSheet supports direct program previews and closes profile view before hydrating', async () => {
  const calls = [];
  let resolveProgram;
  const programSheetClient = {
    getProgramById(programId) {
      calls.push(['getProgramById', programId]);
      return new Promise((resolve) => {
        resolveProgram = resolve;
      });
    },
  };

  const result = orchestrateOpenProgramSheet({
    program: { id: 'program-9', name: 'Spring Prep', summary: 'seed' },
    sourceSurface: 'profile-view',
    closeProfileView: () => calls.push(['closeProfileView']),
    programSheetClient,
    setProgramSheetReturnSurface: (value) => calls.push(['setProgramSheetReturnSurface', value]),
    setSelectedProgramPreview: (value) => calls.push(['setSelectedProgramPreview', value]),
    setIsProgramSheetOpen: (value) => calls.push(['setIsProgramSheetOpen', value]),
  });

  assert.deepEqual(result, {
    outcome: 'opened-and-hydrating',
    currentProgramId: 'program-9',
  });
  assert.deepEqual(calls.slice(0, 5), [
    ['setProgramSheetReturnSurface', 'profile-view'],
    ['setSelectedProgramPreview', { id: 'program-9', name: 'Spring Prep', summary: 'seed' }],
    ['closeProfileView'],
    ['setIsProgramSheetOpen', true],
    ['getProgramById', 'program-9'],
  ]);

  resolveProgram({ id: 'program-9', weeks: [{ id: 'week-9' }] });
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(calls[5][0], 'setSelectedProgramPreview');
  const updater = calls[5][1];
  assert.deepEqual(updater({ id: 'program-9', name: 'Spring Prep', summary: 'seed' }), {
    id: 'program-9',
    name: 'Spring Prep',
    summary: 'seed',
    weeks: [{ id: 'week-9' }],
  });
});

test('orchestrateOpenProgramSheet skips hydration when there is no current program id', () => {
  const calls = [];

  const result = orchestrateOpenProgramSheet({
    trainState: { program: null },
    programSheetClient: {
      getProgramById() {
        calls.push(['getProgramById']);
      },
    },
    setProgramSheetReturnSurface: (value) => calls.push(['setProgramSheetReturnSurface', value]),
    setSelectedProgramPreview: (value) => calls.push(['setSelectedProgramPreview', value]),
    setIsProgramSheetOpen: (value) => calls.push(['setIsProgramSheetOpen', value]),
  });

  assert.deepEqual(result, {
    outcome: 'opened-without-program-id',
    currentProgramId: null,
  });
  assert.deepEqual(calls, [
    ['setProgramSheetReturnSurface', null],
    ['setSelectedProgramPreview', null],
    ['setIsProgramSheetOpen', true],
  ]);
});

test('App program-open branch delegates the open-and-hydrate flow to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const programBranch = source.match(/if \(targetKey === 'program'\) \{[\s\S]*?\n\s+return;\n\s+\}/)?.[0] || '';

  assert.match(source, /open-program-selection\.js/);
  assert.match(programBranch, /orchestrateOpenProgramSheet\(\{/);
  assert.doesNotMatch(programBranch, /programSheetClient\?\.getProgramById\?\./);
  assert.doesNotMatch(programBranch, /setSelectedProgramPreview\(currentProgramId \?/);
});

test('App direct program-detail open delegates the preview-and-hydrate flow to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const detailHandler = source.match(/function handleOpenProgramDetail\(program, sourceSurface = null\) \{[\s\S]*?\n\s+\}/)?.[0] || '';

  assert.match(detailHandler, /orchestrateOpenProgramSheet\(\{/);
  assert.doesNotMatch(detailHandler, /programSheetClient\?\.getProgramById\?\./);
  assert.doesNotMatch(detailHandler, /setSelectedProgramPreview\(program\);/);
  assert.doesNotMatch(detailHandler, /setIsProgramSheetOpen\(true\);/);
});

test('orchestrateCloseProgramSheet reopens the right source surface and clears the program sheet state', () => {
  const calls = [];

  const result = orchestrateCloseProgramSheet({
    programSheetReturnSurface: 'profile-view',
    setIsProgramSheetOpen: (value) => calls.push(['setIsProgramSheetOpen', value]),
    setIsProfileViewOpen: (value) => calls.push(['setIsProfileViewOpen', value]),
    setProgramSheetReturnSurface: (value) => calls.push(['setProgramSheetReturnSurface', value]),
    setSelectedProgramPreview: (value) => calls.push(['setSelectedProgramPreview', value]),
  });

  assert.deepEqual(result, {
    outcome: 'closed-program-sheet',
    programSheetReturnSurface: 'profile-view',
  });
  assert.deepEqual(calls, [
    ['setIsProgramSheetOpen', false],
    ['setIsProfileViewOpen', true],
    ['setProgramSheetReturnSurface', null],
    ['setSelectedProgramPreview', null],
  ]);
});

test('orchestrateCloseProgramSheet no longer reopens the coach athlete workspace because assigned-program review should stay on the home/program path', () => {
  const calls = [];

  const result = orchestrateCloseProgramSheet({
    programSheetReturnSurface: 'coach-athlete-workspace',
    setIsProgramSheetOpen: (value) => calls.push(['setIsProgramSheetOpen', value]),
    setIsCoachAthleteWorkspaceOpen: (value) => calls.push(['setIsCoachAthleteWorkspaceOpen', value]),
    setProgramSheetReturnSurface: (value) => calls.push(['setProgramSheetReturnSurface', value]),
    setSelectedProgramPreview: (value) => calls.push(['setSelectedProgramPreview', value]),
  });

  assert.deepEqual(result, {
    outcome: 'closed-program-sheet',
    programSheetReturnSurface: 'coach-athlete-workspace',
  });
  assert.deepEqual(calls, [
    ['setIsProgramSheetOpen', false],
    ['setProgramSheetReturnSurface', null],
    ['setSelectedProgramPreview', null],
  ]);
});

test('App program-sheet close delegates the return-surface handoff to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const closeHandler = source.match(/function handleCloseProgramSheet\(\) \{[\s\S]*?\n\s+\}/)?.[0] || '';

  assert.match(source, /open-program-selection\.js/);
  assert.match(closeHandler, /orchestrateCloseProgramSheet\(\{/);
  assert.doesNotMatch(closeHandler, /setIsProgramSheetOpen\(false\);/);
  assert.doesNotMatch(closeHandler, /setProgramSheetReturnSurface\(null\);/);
  assert.doesNotMatch(closeHandler, /setSelectedProgramPreview\(null\);/);
});

test('orchestrateOpenExerciseDetail opens the detail view, closes the correct source surface, and hydrates the preview by id', async () => {
  const calls = [];
  let resolveById;
  const logger = { info: (message, payload) => calls.push(['log', message, payload]) };
  const client = {
    getExerciseById(exerciseId) {
      calls.push(['getExerciseById', exerciseId]);
      return new Promise((resolve) => {
        resolveById = resolve;
      });
    },
    async getExerciseByName(name) {
      calls.push(['getExerciseByName', name]);
      return null;
    },
  };

  const result = orchestrateOpenExerciseDetail({
    exercise: { id: 'exercise-1', name: 'Split Squat', videoUrl: 'seed.mp4' },
    sourceSurface: 'workout-sheet',
    exerciseDetailClient: client,
    logger,
    setSelectedExerciseId: (value) => calls.push(['setSelectedExerciseId', value]),
    setSelectedExercisePreview: (value) => calls.push(['setSelectedExercisePreview', value]),
    setExerciseDetailReturnSurface: (value) => calls.push(['setExerciseDetailReturnSurface', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setIsWorkoutEditViewOpen: (value) => calls.push(['setIsWorkoutEditViewOpen', value]),
    setIsProfileViewOpen: (value) => calls.push(['setIsProfileViewOpen', value]),
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    setIsExerciseDetailViewOpen: (value) => calls.push(['setIsExerciseDetailViewOpen', value]),
  });

  assert.deepEqual(result, {
    outcome: 'opened-and-hydrating',
    exerciseId: 'exercise-1',
  });
  assert.deepEqual(calls.slice(0, 7), [
    ['log', '[exercise-detail-open:initial]', {
      sourceSurface: 'workout-sheet',
      exerciseId: 'exercise-1',
      exerciseName: 'Split Squat',
      videoUrl: 'seed.mp4',
    }],
    ['setSelectedExerciseId', 'exercise-1'],
    ['setSelectedExercisePreview', { id: 'exercise-1', name: 'Split Squat', videoUrl: 'seed.mp4' }],
    ['setExerciseDetailReturnSurface', 'workout-sheet'],
    ['setIsWorkoutSheetOpen', false],
    ['setIsExerciseDetailViewOpen', true],
    ['getExerciseById', 'exercise-1'],
  ]);

  resolveById({ id: 'resolved-1', name: 'Rear Foot Elevated Split Squat', videoUrl: 'resolved.mp4', thumbnailUrl: 'thumb.jpg' });
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(calls[7][0], 'log');
  assert.equal(calls[7][1], '[exercise-detail-open:resolved]');
  assert.equal(calls[8][0], 'setSelectedExercisePreview');
  const updater = calls[8][1];
  assert.deepEqual(updater({ id: 'exercise-1', name: 'Split Squat', videoUrl: 'seed.mp4' }), {
    id: 'resolved-1',
    name: 'Rear Foot Elevated Split Squat',
    exerciseId: 'resolved-1',
    videoUrl: 'resolved.mp4',
    thumbnailUrl: 'thumb.jpg',
  });
});

test('orchestrateOpenExerciseDetail falls back to name lookup when id hydration misses and closes profile view when needed', async () => {
  const calls = [];
  let resolveById;
  const client = {
    getExerciseById(exerciseId) {
      calls.push(['getExerciseById', exerciseId]);
      return new Promise((resolve) => {
        resolveById = resolve;
      });
    },
    async getExerciseByName(name) {
      calls.push(['getExerciseByName', name]);
      return { id: 'exercise-2b', name: 'Push Press', videoUrl: 'press.mp4' };
    },
  };

  const result = orchestrateOpenExerciseDetail({
    exercise: { exerciseId: 'exercise-2', nameSnapshot: 'Push Press' },
    sourceSurface: 'profile-view',
    exerciseDetailClient: client,
    logger: { info: () => {} },
    setSelectedExerciseId: (value) => calls.push(['setSelectedExerciseId', value]),
    setSelectedExercisePreview: (value) => calls.push(['setSelectedExercisePreview', value]),
    setExerciseDetailReturnSurface: (value) => calls.push(['setExerciseDetailReturnSurface', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setIsWorkoutEditViewOpen: (value) => calls.push(['setIsWorkoutEditViewOpen', value]),
    setIsProfileViewOpen: (value) => calls.push(['setIsProfileViewOpen', value]),
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    setIsExerciseDetailViewOpen: (value) => calls.push(['setIsExerciseDetailViewOpen', value]),
  });

  assert.deepEqual(result, {
    outcome: 'opened-and-hydrating',
    exerciseId: 'exercise-2',
  });
  assert.deepEqual(calls.slice(0, 5), [
    ['setSelectedExerciseId', 'exercise-2'],
    ['setSelectedExercisePreview', { exerciseId: 'exercise-2', nameSnapshot: 'Push Press' }],
    ['setExerciseDetailReturnSurface', 'profile-view'],
    ['setIsProfileViewOpen', false],
    ['setIsExerciseDetailViewOpen', true],
  ]);

  resolveById(null);
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();

  assert.deepEqual(calls.slice(5, 7), [
    ['getExerciseById', 'exercise-2'],
    ['getExerciseByName', 'Push Press'],
  ]);
});

test('App exercise-detail open delegates the close-source and hydrate flow to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const detailHandler = source.match(/function handleOpenExerciseDetail\(exercise, sourceSurface = null\) \{[\s\S]*?\n\s+\}/)?.[0] || '';

  assert.match(source, /open-exercise-detail-selection\.js/);
  assert.match(detailHandler, /orchestrateOpenExerciseDetail\(\{/);
  assert.doesNotMatch(detailHandler, /setSelectedExerciseId\(/);
  assert.doesNotMatch(detailHandler, /exerciseDetailClient\?\.getExerciseById\?\./);
  assert.doesNotMatch(detailHandler, /setIsExerciseDetailViewOpen\(true\);/);
});

test('orchestrateCloseExerciseDetail reopens the correct source surface and clears the return surface', () => {
  const calls = [];

  const result = orchestrateCloseExerciseDetail({
    exerciseDetailReturnSurface: 'active-workout',
    setIsExerciseDetailViewOpen: (value) => calls.push(['setIsExerciseDetailViewOpen', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setIsWorkoutEditViewOpen: (value) => calls.push(['setIsWorkoutEditViewOpen', value]),
    setIsProfileViewOpen: (value) => calls.push(['setIsProfileViewOpen', value]),
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    setExerciseDetailReturnSurface: (value) => calls.push(['setExerciseDetailReturnSurface', value]),
  });

  assert.deepEqual(result, {
    outcome: 'closed-exercise-detail',
    exerciseDetailReturnSurface: 'active-workout',
  });
  assert.deepEqual(calls, [
    ['setIsExerciseDetailViewOpen', false],
    ['setIsActiveWorkoutViewOpen', true],
    ['setExerciseDetailReturnSurface', null],
  ]);
});

test('App exercise-detail close delegates the return-surface handoff to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const closeHandler = source.match(/async function handleCloseExerciseDetail\(\) \{[\s\S]*?\n\s+\}/)?.[0] || '';

  assert.match(source, /open-exercise-detail-selection\.js/);
  assert.match(closeHandler, /orchestrateCloseExerciseDetail\(\{/);
  assert.doesNotMatch(closeHandler, /setIsExerciseDetailViewOpen\(false\);/);
  assert.doesNotMatch(closeHandler, /setExerciseDetailReturnSurface\(null\);/);
});

test('orchestrateCoachAthleteWorkspaceOpen selects the athlete, closes the picker, and opens the workspace', () => {
  const calls = [];

  const result = orchestrateCoachAthleteWorkspaceOpen({
    payload: { athleteId: 'athlete-1' },
    selectedCoachAthleteId: 'athlete-old',
    setSelectedCoachAthleteId: (value) => calls.push(['setSelectedCoachAthleteId', value]),
    setIsCoachAthletesSheetOpen: (value) => calls.push(['setIsCoachAthletesSheetOpen', value]),
    setIsCoachAthleteWorkspaceOpen: (value) => calls.push(['setIsCoachAthleteWorkspaceOpen', value]),
  });

  assert.deepEqual(result, {
    outcome: 'opened-coach-athlete-workspace',
    nextAthleteId: 'athlete-1',
  });
  assert.deepEqual(calls, [
    ['setSelectedCoachAthleteId', 'athlete-1'],
    ['setIsCoachAthletesSheetOpen', false],
    ['setIsCoachAthleteWorkspaceOpen', true],
  ]);
});

test('orchestrateCoachAthleteSelect selects the athlete, closes coach surfaces, and clears coach metric notices', () => {
  const calls = [];

  const result = orchestrateCoachAthleteSelect({
    payload: null,
    selectedCoachAthleteId: 'athlete-2',
    setSelectedCoachAthleteId: (value) => calls.push(['setSelectedCoachAthleteId', value]),
    setIsCoachAthletesSheetOpen: (value) => calls.push(['setIsCoachAthletesSheetOpen', value]),
    setIsCoachAthleteWorkspaceOpen: (value) => calls.push(['setIsCoachAthleteWorkspaceOpen', value]),
    setCoachMetricNotice: (value) => calls.push(['setCoachMetricNotice', value]),
    setCoachMetricError: (value) => calls.push(['setCoachMetricError', value]),
  });

  assert.deepEqual(result, {
    outcome: 'selected-coach-athlete',
    nextAthleteId: 'athlete-2',
  });
  assert.deepEqual(calls, [
    ['setSelectedCoachAthleteId', 'athlete-2'],
    ['setIsCoachAthletesSheetOpen', false],
    ['setIsCoachAthleteWorkspaceOpen', false],
    ['setCoachMetricNotice', ''],
    ['setCoachMetricError', ''],
  ]);
});

test('App coach-athlete navigation branches delegate to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const workspaceOpenBranch = source.match(/if \(targetKey === 'coach-athlete-workspace-open'\) \{[\s\S]*?\n\s+return;\n\s+\}/)?.[0] || '';
  const athleteSelectBranch = source.match(/if \(targetKey === 'coach-athlete-select'\) \{[\s\S]*?\n\s+return;\n\s+\}/)?.[0] || '';

  assert.match(source, /coach-athlete-selection\.js/);
  assert.match(workspaceOpenBranch, /orchestrateCoachAthleteWorkspaceOpen\(\{/);
  assert.doesNotMatch(workspaceOpenBranch, /setIsCoachAthletesSheetOpen\(false\);/);
  assert.doesNotMatch(workspaceOpenBranch, /setIsCoachAthleteWorkspaceOpen\(true\);/);
  assert.match(athleteSelectBranch, /orchestrateCoachAthleteSelect\(\{/);
  assert.doesNotMatch(athleteSelectBranch, /setIsCoachAthletesSheetOpen\(false\);/);
  assert.doesNotMatch(athleteSelectBranch, /setCoachMetricNotice\(''\);/);
  assert.doesNotMatch(athleteSelectBranch, /setCoachMetricError\(''\);/);
});

test('orchestrateCloseActiveWorkout closes the active workout cleanly without reopening the workout sheet for in-progress sessions', () => {
  const calls = [];
  let deferredCallback = null;

  const result = orchestrateCloseActiveWorkout({
    session: { id: 'session-1', programWorkoutId: 'pw-1', status: 'in_progress' },
    setSelectedWorkoutSessionPreview: (value) => calls.push(['setSelectedWorkoutSessionPreview', value]),
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    runAfterInteractions: (callback) => {
      calls.push(['runAfterInteractions']);
      deferredCallback = callback;
    },
  });

  assert.deepEqual(result, {
    outcome: 'closed-active-workout',
    reopenedWorkoutSheet: false,
    sessionId: 'session-1',
    programWorkoutId: 'pw-1',
  });
  assert.deepEqual(calls, [
    ['setIsActiveWorkoutViewOpen', false],
  ]);
  assert.equal(deferredCallback, null);
});


test('orchestrateCloseActiveWorkout just closes the active workout for non in-progress sessions', () => {
  const calls = [];

  const result = orchestrateCloseActiveWorkout({
    session: {
      id: 'session-8',
      programWorkoutId: 'pw-8',
      status: 'completed',
    },
    setSelectedWorkoutSessionPreview: (value) => calls.push(['setSelectedWorkoutSessionPreview', value]),
    setIsActiveWorkoutViewOpen: (value) => calls.push(['setIsActiveWorkoutViewOpen', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    runAfterInteractions: () => calls.push(['runAfterInteractions']),
  });

  assert.deepEqual(result, {
    outcome: 'closed-active-workout',
    reopenedWorkoutSheet: false,
    sessionId: 'session-8',
    programWorkoutId: 'pw-8',
  });
  assert.deepEqual(calls, [
    ['setIsActiveWorkoutViewOpen', false],
  ]);
});

test('App close-active-workout handler delegates the return-to-sheet handoff to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const closeHandler = source.match(/async function handleCloseActiveWorkout\(\) \{[\s\S]*?\n\s+\}/)?.[0] || '';

  assert.match(source, /active-workout-selection\.js/);
  assert.match(closeHandler, /orchestrateCloseActiveWorkout\(\{/);
  assert.doesNotMatch(closeHandler, /setSelectedWorkoutSessionPreview\(session\);/);
  assert.doesNotMatch(closeHandler, /setIsWorkoutSheetOpen\(true\);/);
  assert.doesNotMatch(closeHandler, /InteractionManager\.runAfterInteractions\(\(\) => \{/);
});

test('orchestrateOpenProgramEditView closes the program sheet and opens the edit view', () => {
  const calls = [];

  const result = orchestrateOpenProgramEditView({
    setIsProgramSheetOpen: (value) => calls.push(['setIsProgramSheetOpen', value]),
    setIsProgramEditViewOpen: (value) => calls.push(['setIsProgramEditViewOpen', value]),
  });

  assert.deepEqual(result, {
    outcome: 'opened-program-edit-view',
  });
  assert.deepEqual(calls, [
    ['setIsProgramSheetOpen', false],
    ['setIsProgramEditViewOpen', true],
  ]);
});

test('orchestrateCloseProgramEditView closes the program edit view and reopens the program sheet', () => {
  const calls = [];

  const result = orchestrateCloseProgramEditView({
    setIsProgramEditViewOpen: (value) => calls.push(['setIsProgramEditViewOpen', value]),
    setIsProgramSheetOpen: (value) => calls.push(['setIsProgramSheetOpen', value]),
  });

  assert.deepEqual(result, {
    outcome: 'closed-program-edit-view',
  });
  assert.deepEqual(calls, [
    ['setIsProgramEditViewOpen', false],
    ['setIsProgramSheetOpen', true],
  ]);
});

test('App program-edit handlers delegate the sheet-to-edit handoff to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const openHandler = source.match(/function handleOpenProgramEditView\(\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const closeHandler = source.match(/function handleCloseProgramEditView\(\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const programSheetRender = source.match(/renderProgramSheet\(\{[\s\S]*?theme: appTheme,[\s\S]*?\}\)/)?.[0] || '';
  const programEditRender = source.match(/<ProgramEditView[\s\S]*?\/\>/)?.[0] || '';

  assert.match(source, /program-edit-selection\.js/);
  assert.match(openHandler, /orchestrateOpenProgramEditView\(\{/);
  assert.doesNotMatch(openHandler, /setIsProgramSheetOpen\(false\);/);
  assert.doesNotMatch(openHandler, /setIsProgramEditViewOpen\(true\);/);
  assert.match(closeHandler, /orchestrateCloseProgramEditView\(\{/);
  assert.doesNotMatch(closeHandler, /setIsProgramEditViewOpen\(false\);/);
  assert.doesNotMatch(closeHandler, /setIsProgramSheetOpen\(true\);/);
  assert.match(programSheetRender, /onEditProgram: handleOpenProgramEditView,/);
  assert.doesNotMatch(programSheetRender, /onEditProgram:\s*\(\)\s*=>\s*\{/);
  assert.doesNotMatch(programSheetRender, /setIsProgramSheetOpen\(false\);/);
  assert.doesNotMatch(programSheetRender, /setIsProgramEditViewOpen\(true\);/);
  assert.match(programEditRender, /onClose=\{handleCloseProgramEditView\}/);
  assert.match(programEditRender, /onSave=\{handleCloseProgramEditView\}/);
  assert.doesNotMatch(programEditRender, /onClose=\{\(\) => \{/);
  assert.doesNotMatch(programEditRender, /onSave=\{\(\) => \{/);
  assert.doesNotMatch(programEditRender, /setIsProgramEditViewOpen\(false\);/);
  assert.doesNotMatch(programEditRender, /setIsProgramSheetOpen\(true\);/);
});

test('orchestrateOpenWorkoutEditView closes the workout sheet and opens the workout edit view', () => {
  const calls = [];

  const result = orchestrateOpenWorkoutEditView({
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
    setIsWorkoutEditViewOpen: (value) => calls.push(['setIsWorkoutEditViewOpen', value]),
  });

  assert.deepEqual(result, {
    outcome: 'opened-workout-edit-view',
  });
  assert.deepEqual(calls, [
    ['setIsWorkoutSheetOpen', false],
    ['setIsWorkoutEditViewOpen', true],
  ]);
});

test('orchestrateCloseWorkoutEditView closes the workout edit view and reopens the workout sheet', () => {
  const calls = [];

  const result = orchestrateCloseWorkoutEditView({
    workoutEditReturnSurface: 'workout-sheet',
    setIsWorkoutEditViewOpen: (value) => calls.push(['setIsWorkoutEditViewOpen', value]),
    setIsWorkoutSheetOpen: (value) => calls.push(['setIsWorkoutSheetOpen', value]),
  });

  assert.deepEqual(result, {
    outcome: 'closed-workout-edit-view',
  });
  assert.deepEqual(calls, [
    ['setIsWorkoutEditViewOpen', false],
    ['setIsWorkoutSheetOpen', true],
  ]);
});

test('App workout-edit open/close handlers delegate the sheet handoff to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const openHandler = source.match(/function handleOpenWorkoutEditView\(\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const closeHandler = source.match(/function handleCloseWorkoutEditView\(\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const workoutSheetRender = source.match(/<WorkoutSheet[\s\S]*?\/\>/)?.[0] || '';
  const workoutEditRender = source.match(/<WorkoutEditView[\s\S]*?\/\>/)?.[0] || '';

  assert.match(source, /workout-edit-selection\.js/);
  assert.match(openHandler, /orchestrateOpenWorkoutEditView\(\{/);
  assert.doesNotMatch(openHandler, /setIsWorkoutSheetOpen\(false\);/);
  assert.doesNotMatch(openHandler, /setIsWorkoutEditViewOpen\(true\);/);
  assert.match(closeHandler, /orchestrateCloseWorkoutEditView\(\{/);
  assert.doesNotMatch(closeHandler, /setIsWorkoutEditViewOpen\(false\);/);
  assert.doesNotMatch(closeHandler, /setIsWorkoutSheetOpen\(true\);/);
  assert.match(workoutSheetRender, /onEditWorkout=\{handleOpenWorkoutEditView\}/);
  assert.doesNotMatch(workoutSheetRender, /onEditWorkout=\{\(\) => \{/);
  assert.doesNotMatch(workoutSheetRender, /setIsWorkoutSheetOpen\(false\);/);
  assert.doesNotMatch(workoutSheetRender, /setIsWorkoutEditViewOpen\(true\);/);
  assert.match(workoutEditRender, /onClose=\{handleCloseWorkoutEditView\}/);
  assert.doesNotMatch(workoutEditRender, /onClose=\{\(\) => \{/);
  assert.doesNotMatch(workoutEditRender, /setIsWorkoutEditViewOpen\(false\);/);
  assert.doesNotMatch(workoutEditRender, /setIsWorkoutSheetOpen\(true\);/);
});

test('resolveWorkoutOpenPreview keeps a fetched zero-exercise workout instead of falling back to the scheduled day workout', async () => {
  const fallbackCalls = [];

  const result = await resolveWorkoutOpenPreview({
    requestedProgramWorkoutId: 'pw-created-1',
    workoutClient: {
      async getProgramWorkoutById(programWorkoutId) {
        assert.equal(programWorkoutId, 'pw-created-1');
        return {
          id: 'pw-created-1',
          nameSnapshot: 'Reopen test workout',
          exercises: [],
        };
      },
    },
    effectiveSessionStore: {
      async getProgramWorkout(payload) {
        fallbackCalls.push(payload);
        return {
          id: 'pw-lower-a',
          nameSnapshot: 'Phase 3 Speed Accelerator A',
          exercises: [{ id: 'exercise-1' }],
        };
      },
    },
  });

  assert.equal(fallbackCalls.length, 0);
  assert.equal(result.selectedWorkout.id, 'pw-created-1');
  assert.equal(result.selectedWorkout.nameSnapshot, 'Reopen test workout');
  assert.equal(result.selectedWorkout.exercises.length, 0);
})

test('orchestrateMoveWorkoutEditExercise updates persisted sort order and reorders the preview session', async () => {
  const calls = [];
  let previewSession = {
    exercises: [
      { id: 'exercise-1', programWorkoutExerciseId: 'pwe-1', sortOrder: 1 },
      { id: 'exercise-2', programWorkoutExerciseId: 'pwe-2', sortOrder: 2 },
    ],
  };

  const result = await orchestrateMoveWorkoutEditExercise({
    exercises: [
      { id: 'exercise-1', programWorkoutExerciseId: 'pwe-1', sortOrder: 1 },
      { id: 'exercise-2', programWorkoutExerciseId: 'pwe-2', sortOrder: 2 },
    ],
    exerciseId: 'exercise-1',
    direction: 'down',
    programSheetClient: {
      updateProgramWorkoutExercise: async (payload) => {
        calls.push(payload);
        return payload;
      },
    },
    setSelectedWorkoutSessionPreview: (updater) => {
      previewSession = updater(previewSession);
    },
  });

  assert.deepEqual(result, { success: true, exerciseId: 'exercise-1', direction: 'down' });
  assert.deepEqual(calls, [
    { programWorkoutExerciseId: 'pwe-1', sortOrder: 0 },
    { programWorkoutExerciseId: 'pwe-2', sortOrder: 1 },
    { programWorkoutExerciseId: 'pwe-1', sortOrder: 2 },
  ]);
  assert.deepEqual(previewSession.exercises.map((exercise) => [exercise.id, exercise.sortOrder]), [
    ['exercise-2', 1],
    ['exercise-1', 2],
  ]);
});

test('orchestrateAddWorkoutEditSet clones the last set into preview session state', async () => {
  let previewSession = {
    totalSetsCount: 1,
    exercises: [
      {
        id: 'exercise-1',
        programWorkoutExerciseId: 'pwe-1',
        sets: [
          {
            id: 'set-1',
            programWorkoutSetId: 'set-1',
            sortOrder: 1,
          },
        ],
      },
    ],
  };

  const result = await orchestrateAddWorkoutEditSet({
    exercises: [
      {
        id: 'exercise-1',
        programWorkoutExerciseId: 'pwe-1',
        sets: [
          {
            id: 'set-1',
            sortOrder: 1,
            setType: 'straight',
            prescribedRestSeconds: 90,
            targetLoadUnit: 'lb',
            effort: '8',
            load: '135',
            reps: '6',
          },
        ],
      },
    ],
    exerciseId: 'exercise-1',
    programSheetClient: {
      createProgramWorkoutSet: async () => ({
        id: 'set-2',
        programWorkoutSetId: 'set-2',
        sortOrder: 2,
        setNumber: 2,
        setType: 'straight',
        prescribedRestSeconds: 90,
        targetLoadUnit: 'lb',
        effort: '8',
        load: '135',
        reps: '6',
      }),
    },
    setSelectedWorkoutSessionPreview: (updater) => {
      previewSession = updater(previewSession);
    },
  });

  assert.equal(result.id, 'set-2');
  assert.equal(previewSession.totalSetsCount, 2);
  assert.equal(previewSession.exercises[0].sets.length, 2);
  assert.equal(previewSession.exercises[0].sets[1].programWorkoutSetId, 'set-2');
});

test('orchestrateAddExercisesToWorkoutEdit persists selected exercises onto the created workout and appends them into preview state', async () => {
  let previewSession = {
    programWorkoutId: 'pw-created-1',
    exercises: [],
    totalExercisesCount: 0,
    totalSetsCount: 0,
  };
  let workoutEditDraft = {
    programWorkoutId: 'pw-created-1',
    exercises: [],
  };
  const persistedCalls = [];

  const result = await orchestrateAddExercisesToWorkoutEdit({
    programWorkoutId: 'pw-created-1',
    exerciseIds: ['exercise-1', 'exercise-2'],
    exerciseLibraryClient: {
      getExerciseById: async (exerciseId) => ({
        id: exerciseId,
        name: exerciseId === 'exercise-1' ? '1-Arm DB Row' : '1-Arm Landmine Push Press',
        thumbnailUrl: null,
        defaultRestSeconds: 75,
        sets: [
          { sortOrder: 1, setType: 'straight', reps: '8', load: '0', effort: '7', targetLoadUnit: 'lb', prescribedRestSeconds: 75, notes: '' },
        ],
      }),
    },
    programSheetClient: {
      createProgramWorkoutExercises: async (payload) => {
        persistedCalls.push(payload);
        return payload.exerciseRecords.map((exercise, index) => ({
          id: `pwe-new-${index + 1}`,
          programWorkoutExerciseId: `pwe-new-${index + 1}`,
          programWorkoutId: payload.programWorkoutId,
          exerciseId: exercise.exerciseId,
          nameSnapshot: exercise.nameSnapshot,
          sortOrder: payload.startSortOrder + index,
          notes: '',
          defaultRestSeconds: exercise.defaultRestSeconds,
          sets: exercise.sets.map((set, setIndex) => ({
            id: `pws-new-${index + 1}-${setIndex + 1}`,
            programWorkoutExerciseId: `pwe-new-${index + 1}`,
            sortOrder: set.sortOrder,
            setType: set.setType,
            reps: set.reps,
            load: set.load,
            effort: set.effort,
            targetLoadUnit: set.targetLoadUnit,
            prescribedRestSeconds: set.prescribedRestSeconds,
            notes: set.notes,
          })),
        }));
      },
    },
    setSelectedWorkoutSessionPreview: (updater) => {
      previewSession = updater(previewSession);
    },
    setWorkoutEditDraftModel: (updater) => {
      workoutEditDraft = typeof updater === 'function' ? updater(workoutEditDraft) : updater;
    },
  });

  assert.equal(persistedCalls.length, 1);
  assert.equal(persistedCalls[0].programWorkoutId, 'pw-created-1');
  assert.equal(persistedCalls[0].exerciseRecords.length, 2);
  assert.equal(result.length, 2);
  assert.equal(previewSession.exercises.length, 2);
  assert.equal(previewSession.exercises[0].programWorkoutExerciseId, 'pwe-new-1');
  assert.equal(previewSession.exercises[0].sets.length, 1);
  assert.equal(workoutEditDraft.exercises.length, 2);
});

test('orchestrateDeleteWorkoutEditSet removes the persisted set from preview session state', async () => {
  let previewSession = {
    totalSetsCount: 2,
    exercises: [
      {
        id: 'exercise-1',
        programWorkoutExerciseId: 'pwe-1',
        sets: [
          { id: 'set-1', programWorkoutSetId: 'set-1', sortOrder: 1 },
          { id: 'set-2', programWorkoutSetId: 'set-2', sortOrder: 2 },
        ],
      },
    ],
  };

  const result = await orchestrateDeleteWorkoutEditSet({
    exercises: [
      {
        id: 'exercise-1',
        programWorkoutExerciseId: 'pwe-1',
        sets: [
          { id: 'set-1', programWorkoutSetId: 'set-1', sortOrder: 1 },
          { id: 'set-2', programWorkoutSetId: 'set-2', sortOrder: 2 },
        ],
      },
    ],
    exerciseId: 'exercise-1',
    setId: 'set-2',
    programSheetClient: {
      deleteProgramWorkoutSet: async ({ programWorkoutSetId }) => ({ success: true, programWorkoutSetId }),
    },
    setSelectedWorkoutSessionPreview: (updater) => {
      previewSession = updater(previewSession);
    },
  });

  assert.deepEqual(result, { success: true, programWorkoutSetId: 'set-2' });
  assert.equal(previewSession.totalSetsCount, 1);
  assert.deepEqual(previewSession.exercises[0].sets.map((set) => [set.id, set.sortOrder]), [['set-1', 1]]);
});

test('App workout-edit mutation handlers delegate to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const moveHandler = source.match(/async function handleMoveWorkoutEditExercise\(exerciseId, direction\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const addHandler = source.match(/async function handleAddWorkoutEditSet\(exerciseId\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const deleteHandler = source.match(/async function handleDeleteWorkoutEditSet\(exerciseId, setId\) \{[\s\S]*?\n\s+\}/)?.[0] || '';

  assert.match(source, /workout-edit-mutations\.js/);
  assert.match(moveHandler, /orchestrateMoveWorkoutEditExercise\(\{/);
  assert.doesNotMatch(moveHandler, /programSheetClient\?\.updateProgramWorkoutExercise\?\.\(/);
  assert.match(addHandler, /orchestrateAddWorkoutEditSet\(\{/);
  assert.doesNotMatch(addHandler, /programSheetClient\?\.createProgramWorkoutSet\?\.\(/);
  assert.match(deleteHandler, /orchestrateDeleteWorkoutEditSet\(\{/);
  assert.doesNotMatch(deleteHandler, /programSheetClient\?\.deleteProgramWorkoutSet\?\.\(/);
});

test('active-workout mutation seam reads findSessionSet from the direct core source path used by the mobile runtime', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/src/train/active-workout-mutations.js'), 'utf8');

  assert.match(source, /findSessionSet/);
  assert.match(source, /from '\.\.\/\.\.\/\.\.\/\.\.\/packages\/core\/src\/index\.js'/);
  assert.doesNotMatch(source, /from '@pplus\/core';/);
});

test('orchestrateCompleteSet persists the completed session and opens post-set effort adjustment when enabled', async () => {
  const calls = [];
  let postSetAdjustment = null;

  await orchestrateCompleteSet({
    session: {
      status: 'in_progress',
      settings: { adjustEffortAfterSet: true },
      exercises: [
        {
          id: 'exercise-1',
          nameSnapshot: 'Back Squat',
          sets: [
            { id: 'set-1', prescribedRpe: 7, actualRpe: null, isCompleted: false },
          ],
        },
      ],
    },
    exerciseId: 'exercise-1',
    setId: 'set-1',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
    setPostSetEffortAdjustment: (value) => {
      postSetAdjustment = value;
    },
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(postSetAdjustment, {
    exerciseId: 'exercise-1',
    setId: 'set-1',
    exerciseTitle: 'Back Squat',
    setNumber: 1,
    currentEffort: 7,
  });
});

test('orchestrateCompleteSet clears post-set effort adjustment when the same set press reverses completion', async () => {
  const calls = [];
  let postSetAdjustment = 'unchanged';

  await orchestrateCompleteSet({
    session: {
      status: 'in_progress',
      settings: { adjustEffortAfterSet: true },
      exercises: [
        {
          id: 'exercise-1',
          nameSnapshot: 'Back Squat',
          sets: [
            { id: 'set-1', prescribedRpe: 7, actualRpe: 8, isCompleted: true, completedAt: '2026-04-21T20:10:00.000Z' },
          ],
        },
      ],
    },
    exerciseId: 'exercise-1',
    setId: 'set-1',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
    setPostSetEffortAdjustment: (value) => {
      postSetAdjustment = value;
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].exercises[0].sets[0].isCompleted, false);
  assert.equal(calls[0].completedSetsCount, 0);
  assert.equal(calls[0].activeRestTimer, null);
  assert.equal(postSetAdjustment, null);
});

test('orchestratePostSetEffortChange persists the new effort and updates local post-set adjustment state', async () => {
  const calls = [];
  let postSetAdjustment = { currentEffort: 7 };

  await orchestratePostSetEffortChange({
    session: {
      status: 'in_progress',
      exercises: [
        {
          id: 'exercise-1',
          sets: [{ id: 'set-1', prescribedRpe: 7, actualRpe: null, isCompleted: false }],
        },
      ],
    },
    nextEffort: 9,
    postSetEffortAdjustment: {
      exerciseId: 'exercise-1',
      setId: 'set-1',
      currentEffort: 7,
    },
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
    setPostSetEffortAdjustment: (updater) => {
      postSetAdjustment = updater(postSetAdjustment);
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(postSetAdjustment.currentEffort, 9);
});

test('orchestrateClosePostSetEffortAdjustment clears the adjustment state', () => {
  const calls = [];
  const result = orchestrateClosePostSetEffortAdjustment({
    setPostSetEffortAdjustment: (value) => calls.push(value),
  });

  assert.deepEqual(result, { outcome: 'closed-post-set-effort-adjustment' });
  assert.deepEqual(calls, [null]);
});

test('orchestrateSessionSetValueChange sanitizes typed values and persists only supported fields', async () => {
  const calls = [];
  const session = {
    status: 'in_progress',
    exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1' }] }],
  };

  await orchestrateSessionSetValueChange({
    session,
    exerciseId: 'exercise-1',
    setId: 'set-1',
    field: 'load',
    nextValue: '135 lb',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
  });

  await orchestrateSessionSetValueChange({
    session,
    exerciseId: 'exercise-1',
    setId: 'set-1',
    field: 'effort',
    nextValue: '',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
  });

  await orchestrateSessionSetValueChange({
    session,
    exerciseId: 'exercise-1',
    setId: 'set-1',
    field: 'distance',
    nextValue: '20 m',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
  });

  await orchestrateSessionSetValueChange({
    session,
    exerciseId: 'exercise-1',
    setId: 'set-1',
    field: 'duration',
    nextValue: '4.2 sec',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
  });

  await orchestrateSessionSetValueChange({
    session,
    exerciseId: 'exercise-1',
    setId: 'set-1',
    field: 'unsupported',
    nextValue: '22',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
  });

  assert.equal(calls.length, 4);
  assert.equal(calls[0].exercises[0].sets[0].actualLoad, 135);
  assert.equal(calls[1].exercises[0].sets[0].actualRpe, null);
  assert.equal(calls[2].exercises[0].sets[0].actualDistance, 20);
  assert.equal(calls[3].exercises[0].sets[0].actualDurationSeconds, 4.2);
});

test('orchestrate active-workout add delete move helpers preserve deletion and adjustment behavior', async () => {
  const updateCalls = [];
  const deletionCalls = [];
  let postSetAdjustment = {
    exerciseId: 'exercise-1',
    setId: 'set-1',
    currentEffort: 8,
  };
  const session = {
    status: 'in_progress',
    settings: { defaultRestSeconds: 90 },
    exercises: [
      {
        id: 'exercise-1',
        nameSnapshot: 'Back Squat',
        sets: [
          { id: 'set-1', sortOrder: 1, prescribedReps: 5, prescribedLoad: 135 },
        ],
      },
      {
        id: 'exercise-2',
        nameSnapshot: 'Bench Press',
        sets: [
          { id: 'set-2', sortOrder: 1, prescribedReps: 8, prescribedLoad: 95 },
        ],
      },
    ],
  };

  await orchestrateAddSessionSet({
    session,
    exerciseId: 'exercise-1',
    persistSessionUpdateOptimistic: (nextSession) => updateCalls.push(['add-set', nextSession]),
  });

  await orchestrateDeleteSessionSet({
    session,
    exerciseId: 'exercise-1',
    setId: 'set-1',
    setPostSetEffortAdjustment: (updater) => {
      postSetAdjustment = updater(postSetAdjustment);
    },
    persistSessionDeletionOptimistic: (nextSession, payload) => deletionCalls.push(['delete-set', nextSession, payload]),
  });

  postSetAdjustment = {
    exerciseId: 'exercise-1',
    setId: 'set-2',
    currentEffort: 8,
  };

  await orchestrateDeleteSessionExercise({
    session,
    exerciseId: 'exercise-1',
    setPostSetEffortAdjustment: (updater) => {
      postSetAdjustment = updater(postSetAdjustment);
    },
    persistSessionDeletionOptimistic: (nextSession, payload) => deletionCalls.push(['delete-exercise', nextSession, payload]),
  });

  await orchestrateMoveActiveWorkoutExercise({
    session,
    exerciseId: 'exercise-2',
    direction: 'up',
    persistSessionUpdateOptimistic: (nextSession) => updateCalls.push(['move-exercise', nextSession]),
  });

  assert.equal(updateCalls.length, 2);
  assert.equal(updateCalls[0][1].exercises[0].sets.length, 2);
  assert.equal(updateCalls[1][1].exercises[0].id, 'exercise-2');
  assert.equal(deletionCalls.length, 2);
  assert.deepEqual(deletionCalls[0][2], { setId: 'set-1' });
  assert.deepEqual(deletionCalls[1][2], { exerciseId: 'exercise-1' });
  assert.equal(postSetAdjustment, null);
});

test('orchestrateAddExercisesToSession hydrates requested exercises and applies session default rest fallback', async () => {
  const calls = [];
  const requestedIds = [];
  const session = {
    status: 'in_progress',
    settings: { defaultRestSeconds: 75 },
    exercises: [],
  };

  await orchestrateAddExercisesToSession({
    session,
    exerciseIds: ['exercise-1', 'exercise-2', 'missing'],
    exerciseDetailClient: {
      getExerciseById: async (exerciseId) => {
        requestedIds.push(exerciseId);
        if (exerciseId === 'missing') return null;
        return {
          id: exerciseId,
          name: exerciseId === 'exercise-1' ? 'Back Squat' : 'Bench Press',
          defaultRestSeconds: null,
          sets: [],
        };
      },
    },
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
  });

  assert.deepEqual(requestedIds, ['exercise-1', 'exercise-2', 'missing']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].exercises.length, 2);
  assert.equal(calls[0].exercises[0].defaultRestSeconds, 75);
});

test('orchestrateAdjustRestTimer and orchestrateDismissRestTimer route rest timer changes through optimistic persistence', async () => {
  const calls = [];
  const session = {
    status: 'in_progress',
    activeRestTimer: {
      exerciseId: 'exercise-1',
      setId: 'set-1',
      isRunning: true,
      remainingSeconds: 60,
    },
    exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1', isCompleted: true }] }],
  };

  await orchestrateAdjustRestTimer({
    session,
    delta: 15,
    persistSessionUpdateOptimistic: (nextSession) => calls.push(['adjust', nextSession]),
  });

  await orchestrateDismissRestTimer({
    session,
    persistSessionUpdateOptimistic: (nextSession) => calls.push(['dismiss', nextSession]),
  });

  assert.equal(calls.length, 2);
  assert.equal(calls[0][1].activeRestTimer.remainingSeconds, 75);
  assert.equal(calls[1][1].activeRestTimer, null);
});

test('orchestrateFinishWorkout only finalizes truthy completed work and clears active-workout finish state on success', async () => {
  const persistCalls = [];
  const adjustmentCalls = [];
  const activeWorkoutCalls = [];
  const activeTrainTabCalls = [];
  const previewCalls = [];
  const emptySession = {
    status: 'in_progress',
    startedAt: '2026-04-30T18:41:00.000Z',
    completedSetsCount: 0,
    exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1', isCompleted: false }] }],
    activeRestTimer: null,
  };
  const session = {
    status: 'in_progress',
    startedAt: '2026-04-30T18:41:00.000Z',
    completedSetsCount: 1,
    completedExercisesCount: 1,
    exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1', isCompleted: true }] }],
    activeRestTimer: { exerciseId: 'exercise-1', setId: 'set-1', isRunning: true, remainingSeconds: 40 },
  };

  await orchestrateFinishWorkout({
    session: emptySession,
    elapsedSeconds: 22,
    completionPayload: { completedAt: '2026-04-30T18:42:00.000Z' },
    persistSessionUpdate: (nextSession) => persistCalls.push(['empty', nextSession]),
    setPostSetEffortAdjustment: (value) => adjustmentCalls.push(['empty', value]),
    setIsActiveWorkoutViewOpen: (value) => activeWorkoutCalls.push(['empty', value]),
    setActiveTrainTab: (value) => activeTrainTabCalls.push(['empty', value]),
    setSelectedWorkoutSessionPreview: (value) => previewCalls.push(['empty', value]),
  });

  await orchestrateFinishWorkout({
    session,
    elapsedSeconds: 123,
    completionPayload: { completedAt: '2026-04-30T18:45:00.000Z', perceivedDifficulty: 8 },
    persistSessionUpdate: (nextSession) => persistCalls.push(['completed', nextSession]),
    setPostSetEffortAdjustment: (value) => adjustmentCalls.push(['completed', value]),
    setIsActiveWorkoutViewOpen: (value) => activeWorkoutCalls.push(['completed', value]),
    setActiveTrainTab: (value) => activeTrainTabCalls.push(['completed', value]),
    setSelectedWorkoutSessionPreview: (value) => previewCalls.push(['completed', value]),
  });

  assert.equal(persistCalls.length, 1);
  assert.equal(persistCalls[0][0], 'completed');
  assert.equal(persistCalls[0][1].status, 'completed');
  assert.equal(persistCalls[0][1].elapsedSeconds, 123);
  assert.equal(persistCalls[0][1].activeRestTimer, null);
  assert.equal(persistCalls[0][1].perceivedDifficulty, 8);
  assert.deepEqual(adjustmentCalls, [['completed', null]]);
  assert.deepEqual(activeWorkoutCalls, [['completed', false]]);
  assert.deepEqual(activeTrainTabCalls, [['completed', 'session']]);
  assert.deepEqual(previewCalls, [['completed', null]]);
});

test('orchestrateDiscardWorkout clears the visible session instead of showing a discarded workout', async () => {
  const optimisticCalls = [];
  const persistedDiscardCalls = [];
  const clearedVisibleSessionCalls = [];
  const adjustmentCalls = [];
  const activeWorkoutCalls = [];
  const session = {
    id: 'session-1',
    status: 'in_progress',
    startedAt: '2026-04-30T18:41:00.000Z',
    exercises: [{ id: 'exercise-1', sets: [{ id: 'set-1', isCompleted: true }] }],
    activeRestTimer: { exerciseId: 'exercise-1', setId: 'set-1', isRunning: true, remainingSeconds: 40 },
  };

  await orchestrateDiscardWorkout({
    session,
    elapsedSeconds: 123,
    setPostSetEffortAdjustment: (value) => adjustmentCalls.push(value),
    setIsActiveWorkoutViewOpen: (value) => activeWorkoutCalls.push(value),
    persistSessionUpdateOptimistic: (nextSession) => optimisticCalls.push(nextSession),
    persistDiscardedSession: async (nextSession) => persistedDiscardCalls.push(nextSession),
    clearVisibleSession: () => clearedVisibleSessionCalls.push('cleared'),
    getNowIsoString: () => '2026-04-30T18:46:00.000Z',
  });

  assert.deepEqual(optimisticCalls, []);
  assert.equal(persistedDiscardCalls.length, 1);
  assert.equal(persistedDiscardCalls[0].status, 'discarded');
  assert.equal(persistedDiscardCalls[0].completedAt, '2026-04-30T18:46:00.000Z');
  assert.deepEqual(clearedVisibleSessionCalls, ['cleared']);
  assert.deepEqual(adjustmentCalls, [null]);
  assert.deepEqual(activeWorkoutCalls, [false]);
});

test('orchestrateQuickActualUpdate persists the computed quick-actual payload', async () => {
  const session = {
    status: 'in_progress',
    exercises: [
      {
        id: 'exercise-1',
        sets: [
          {
            id: 'set-1',
            actualLoad: 95,
            prescribedLoad: 100,
          },
        ],
      },
    ],
  };
  const calls = [];

  await orchestrateQuickActualUpdate({
    session,
    exerciseId: 'exercise-1',
    setId: 'set-1',
    field: 'actualLoad',
    delta: 5,
    persistSessionUpdate: async (nextSession) => {
      calls.push(nextSession);
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].exercises[0].sets[0].actualLoad, 100);
});

test('orchestrateQuickActualUpdate skips persistence when the computed payload is empty', async () => {
  const calls = [];

  await orchestrateQuickActualUpdate({
    session: {
      status: 'in_progress',
      exercises: [],
    },
    exerciseId: 'exercise-1',
    setId: 'set-1',
    field: 'actualLoad',
    delta: 5,
    persistSessionUpdate: async (nextSession) => {
      calls.push(nextSession);
    },
  });

  assert.deepEqual(calls, []);
});

test('orchestrateExerciseRestTimeChange, orchestrateRemoveExerciseRestTime, workout notes, and settings all delegate through optimistic session updates', async () => {
  const calls = [];
  const session = {
    status: 'in_progress',
    settings: { adjustEffortAfterSet: false },
    exercises: [{ id: 'exercise-1', sets: [] }],
  };

  await orchestrateExerciseRestTimeChange({
    session,
    exerciseId: 'exercise-1',
    nextRestSeconds: 75,
    persistSessionUpdateOptimistic: (nextSession) => calls.push(['rest', nextSession]),
  });

  await orchestrateRemoveExerciseRestTime({
    session,
    exerciseId: 'exercise-1',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(['remove-rest', nextSession]),
  });

  await orchestrateWorkoutNotesChange({
    session,
    nextNotes: 'Keep chest up',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(['notes', nextSession]),
  });

  await orchestrateWorkoutSettingsChange({
    session,
    settingsPatch: { adjustEffortAfterSet: true },
    persistSessionUpdateOptimistic: (nextSession) => calls.push(['settings', nextSession]),
  });

  assert.equal(calls.length, 4);
  assert.equal(calls[2][1].notes, 'Keep chest up');
  assert.equal(calls[3][1].settings.adjustEffortAfterSet, true);
});

test('orchestrateRemoveSessionSuperset clears a live superset through optimistic session updates', async () => {
  const calls = [];
  const session = {
    status: 'in_progress',
    exercises: [
      { id: 'exercise-1', supersetGroupId: 'group-1', supersetOrder: 1, sets: [] },
      { id: 'exercise-2', supersetGroupId: 'group-1', supersetOrder: 2, sets: [] },
    ],
  };

  await orchestrateRemoveSessionSuperset({
    session,
    exerciseId: 'exercise-1',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].exercises[0].supersetGroupId, null);
  assert.equal(calls[0].exercises[1].supersetGroupId, null);
});

test('orchestrateCreateSessionSuperset delegates through optimistic session updates', async () => {
  const calls = [];
  const session = {
    status: 'in_progress',
    exercises: [
      { id: 'exercise-1', sortOrder: 1, sets: [] },
      { id: 'exercise-2', sortOrder: 2, sets: [] },
    ],
  };

  await orchestrateCreateSessionSuperset({
    session,
    sourceExerciseId: 'exercise-1',
    targetExerciseId: 'exercise-2',
    persistSessionUpdateOptimistic: (nextSession) => calls.push(nextSession),
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].exercises[0].supersetGroupId, calls[0].exercises[1].supersetGroupId);
  assert.equal(calls[0].exercises[0].supersetOrder, 1);
  assert.equal(calls[0].exercises[1].supersetOrder, 2);
});

test('App active-workout mutation handlers delegate to the extracted helper seam', () => {
  const source = readFileSync(resolve(process.cwd(), 'apps/mobile/App.js'), 'utf8');
  const completeHandler = source.match(/async function handleCompleteSet\(exerciseId, setId\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const effortHandler = source.match(/async function handlePostSetEffortChange\(nextEffort\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const closeEffortHandler = source.match(/function handleClosePostSetEffortAdjustment\(\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const setValueHandler = source.match(/async function handleSessionSetValueChange\(exerciseId, setId, field, nextValue\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const addSetHandler = source.match(/async function handleAddSessionSet\(exerciseId\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const deleteSetHandler = source.match(/async function handleDeleteSessionSet\(exerciseId, setId\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const deleteExerciseHandler = source.match(/async function handleDeleteSessionExercise\(exerciseId\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const moveExerciseHandler = source.match(/async function handleMoveActiveWorkoutExercise\(exerciseId, direction\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const adjustRestTimerHandler = source.match(/async function handleAdjustRestTimer\(delta\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const dismissRestTimerHandler = source.match(/async function handleDismissRestTimer\(\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const finishWorkoutHandler = source.match(/async function handleFinishWorkout\(completionPayload = \{\}\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const discardWorkoutHandler = source.slice(
    source.indexOf('async function handleDiscardWorkout()'),
    source.indexOf('async function handleQuickActualUpdate', source.indexOf('async function handleDiscardWorkout()')),
  );
  const restHandler = source.match(/async function handleExerciseRestTimeChange\(exerciseId, nextRestSeconds\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const createSupersetHandler = source.match(/async function handleCreateSessionSuperset\(sourceExerciseId, targetExerciseId\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const removeSupersetHandler = source.match(/async function handleRemoveSessionSuperset\(exerciseId\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const removeRestHandler = source.match(/async function handleRemoveExerciseRestTime\(exerciseId\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const addExercisesHandler = source.match(/async function handleAddExercisesToSession\(exerciseIds\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const notesHandler = source.match(/async function handleWorkoutNotesChange\(nextNotes\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const settingsHandler = source.match(/async function handleWorkoutSettingsChange\(settingsPatch\) \{[\s\S]*?\n\s+\}/)?.[0] || '';
  const quickActualHandler = source.match(/async function handleQuickActualUpdate\(exerciseId, setId, field, delta\) \{[\s\S]*?\n\s+\}/)?.[0] || '';

  assert.match(source, /active-workout-mutations\.js/);
  assert.match(completeHandler, /orchestrateCompleteSet\(\{/);
  assert.doesNotMatch(completeHandler, /completeWorkoutSessionSet\(/);
  assert.match(effortHandler, /orchestratePostSetEffortChange\(\{/);
  assert.doesNotMatch(effortHandler, /updateSessionSetActuals\(/);
  assert.match(closeEffortHandler, /orchestrateClosePostSetEffortAdjustment\(\{/);
  assert.match(setValueHandler, /orchestrateSessionSetValueChange\(\{/);
  assert.doesNotMatch(setValueHandler, /const fieldMap = \{ effort: 'actualRpe', load: 'actualLoad', reps: 'actualReps' \}/);
  assert.match(addSetHandler, /orchestrateAddSessionSet\(\{/);
  assert.doesNotMatch(addSetHandler, /appendSessionExerciseSet\(/);
  assert.match(deleteSetHandler, /orchestrateDeleteSessionSet\(\{/);
  assert.doesNotMatch(deleteSetHandler, /removeSessionExerciseSet\(/);
  assert.match(deleteExerciseHandler, /orchestrateDeleteSessionExercise\(\{/);
  assert.doesNotMatch(deleteExerciseHandler, /removeSessionExercise\(/);
  assert.match(moveExerciseHandler, /orchestrateMoveActiveWorkoutExercise\(\{/);
  assert.doesNotMatch(moveExerciseHandler, /moveSessionExercise\(/);
  assert.match(adjustRestTimerHandler, /orchestrateAdjustRestTimer\(\{/);
  assert.doesNotMatch(adjustRestTimerHandler, /adjustRestTimer\(session, delta\)/);
  assert.match(dismissRestTimerHandler, /orchestrateDismissRestTimer\(\{/);
  assert.doesNotMatch(dismissRestTimerHandler, /clearRestTimer\(session\)/);
  assert.match(finishWorkoutHandler, /orchestrateFinishWorkout\(\{/);
  assert.doesNotMatch(finishWorkoutHandler, /finishWorkoutSession\(/);
  assert.match(discardWorkoutHandler, /orchestrateDiscardWorkout\(\{/);
  assert.doesNotMatch(discardWorkoutHandler, /discardWorkoutSession\(/);
  assert.match(restHandler, /orchestrateExerciseRestTimeChange\(\{/);
  assert.match(createSupersetHandler, /orchestrateCreateSessionSuperset\(\{/);
  assert.match(createSupersetHandler, /sourceExerciseId/);
  assert.match(createSupersetHandler, /targetExerciseId/);
  assert.doesNotMatch(createSupersetHandler, /createSessionSuperset\(/);
  assert.match(removeSupersetHandler, /orchestrateRemoveSessionSuperset\(\{/);
  assert.doesNotMatch(removeSupersetHandler, /removeSessionSuperset\(/);
  assert.doesNotMatch(restHandler, /updateSessionExerciseRest\(/);
  assert.match(removeRestHandler, /orchestrateRemoveExerciseRestTime\(\{/);
  assert.match(addExercisesHandler, /orchestrateAddExercisesToSession\(\{/);
  assert.doesNotMatch(addExercisesHandler, /appendSessionExercises\(/);
  assert.match(notesHandler, /orchestrateWorkoutNotesChange\(\{/);
  assert.match(settingsHandler, /orchestrateWorkoutSettingsChange\(\{/);
  assert.match(quickActualHandler, /orchestrateQuickActualUpdate\(\{/);
  assert.doesNotMatch(quickActualHandler, /getQuickActualUpdatePayload\(\{/);
  assert.doesNotMatch(quickActualHandler, /await persistSessionUpdate\(updateSessionSetActuals\(session, exerciseId, setId, payload\)\);/);
});
