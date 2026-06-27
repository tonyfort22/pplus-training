import {
  adjustRestTimer,
  appendSessionExerciseSet,
  completeWorkoutSessionSet,
  updateSessionSetActuals,
  clearRestTimer,
  findSessionSet,
  finishWorkoutSession,
  discardWorkoutSession,
  moveSessionExercise,
  removeSessionExercise,
  createSessionSuperset,
  removeSessionSuperset,
  updateExerciseStatuses,
  updateSessionExerciseRest,
  appendSessionExercises,
  canFinishWorkoutSession,
} from '../../../../packages/core/src/index.js';
import { getQuickActualUpdatePayload } from './session-actions.js';

function applySessionProgress(session) {
  const exercises = Array.isArray(session?.exercises) ? session.exercises : [];
  const totalExercisesCount = exercises.length;
  const totalSetsCount = exercises.reduce((sum, exercise) => sum + ((exercise?.sets || []).length), 0);
  const completedSetsCount = exercises.reduce(
    (sum, exercise) => sum + (exercise.sets || []).filter((set) => set.isCompleted).length,
    0,
  );
  const completedExercisesCount = exercises.filter((exercise) => {
    const sets = exercise.sets || [];
    return sets.length > 0 && sets.every((set) => set.isCompleted);
  }).length;

  return {
    ...session,
    totalExercisesCount,
    totalSetsCount,
    completedSetsCount,
    completedExercisesCount,
  };
}

function removeSessionExerciseSetLocal(session, exerciseId, setId) {
  const currentExercises = Array.isArray(session?.exercises) ? session.exercises : [];
  const targetExercise = currentExercises.find((exercise) => exercise.id === exerciseId) || null;
  if (!targetExercise) return session;

  const currentSets = Array.isArray(targetExercise.sets) ? targetExercise.sets : [];
  if (!currentSets.some((set) => set.id === setId)) return session;

  const nextSession = {
    ...session,
    activeRestTimer:
      session?.activeRestTimer?.exerciseId === exerciseId && session?.activeRestTimer?.setId === setId
        ? null
        : session?.activeRestTimer ?? null,
    exercises: currentExercises.map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;
      return {
        ...exercise,
        sets: currentSets
          .filter((set) => set.id !== setId)
          .map((set, index) => ({
            ...set,
            sortOrder: index + 1,
          })),
      };
    }),
  };

  return applySessionProgress(updateExerciseStatuses(nextSession));
}

export async function orchestrateCompleteSet({
  session,
  exerciseId,
  setId,
  persistSessionUpdateOptimistic,
  setPostSetEffortAdjustment,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;

  const nextSession = completeWorkoutSessionSet(session, exerciseId, setId);
  persistSessionUpdateOptimistic(nextSession);

  const completedSet = findSessionSet(nextSession, exerciseId, setId);
  if (!session.settings?.adjustEffortAfterSet || !completedSet?.isCompleted) {
    setPostSetEffortAdjustment(null);
    return;
  }

  const completedExercise =
    (nextSession.exercises || []).find((exercise) => exercise.id === exerciseId) || null;
  const setNumber =
    (completedExercise?.sets || []).findIndex((set) => set.id === setId) + 1;

  setPostSetEffortAdjustment({
    exerciseId,
    setId,
    exerciseTitle:
      completedExercise?.nameSnapshot || completedExercise?.name || 'Exercise',
    setNumber: setNumber > 0 ? setNumber : 1,
    currentEffort: completedSet?.actualRpe ?? completedSet?.prescribedRpe ?? 0,
  });
}

export async function orchestratePostSetEffortChange({
  session,
  nextEffort,
  postSetEffortAdjustment,
  persistSessionUpdateOptimistic,
  setPostSetEffortAdjustment,
}) {
  if (
    !postSetEffortAdjustment ||
    session.status === 'completed' ||
    session.status === 'discarded'
  ) {
    return;
  }

  persistSessionUpdateOptimistic(
    updateSessionSetActuals(
      session,
      postSetEffortAdjustment.exerciseId,
      postSetEffortAdjustment.setId,
      { actualRpe: nextEffort },
    ),
  );
  setPostSetEffortAdjustment((currentValue) =>
    currentValue
      ? {
          ...currentValue,
          currentEffort: nextEffort,
        }
      : currentValue,
  );
}

export function orchestrateClosePostSetEffortAdjustment({
  setPostSetEffortAdjustment,
}) {
  setPostSetEffortAdjustment(null);

  return {
    outcome: 'closed-post-set-effort-adjustment',
  };
}

export async function orchestrateSessionSetValueChange({
  session,
  exerciseId,
  setId,
  field,
  nextValue,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;

  const fieldMap = {
    effort: 'actualRpe',
    load: 'actualLoad',
    reps: 'actualReps',
    distance: 'actualDistance',
    duration: 'actualDurationSeconds',
  };
  const resolvedField = fieldMap[field];
  if (!resolvedField) return;

  const sanitizedValue = String(nextValue ?? '').replace(/[^0-9.-]/g, '');
  const resolvedValue = sanitizedValue === '' ? null : Number(sanitizedValue);

  persistSessionUpdateOptimistic(
    updateSessionSetActuals(session, exerciseId, setId, { [resolvedField]: resolvedValue }),
  );
}

export async function orchestrateAddSessionSet({
  session,
  exerciseId,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  persistSessionUpdateOptimistic(appendSessionExerciseSet(session, exerciseId));
}

export async function orchestrateDeleteSessionSet({
  session,
  exerciseId,
  setId,
  setPostSetEffortAdjustment,
  persistSessionDeletionOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;

  const nextSession = removeSessionExerciseSetLocal(session, exerciseId, setId);
  if (nextSession === session) return;

  setPostSetEffortAdjustment((currentValue) =>
    currentValue && currentValue.exerciseId === exerciseId && currentValue.setId === setId
      ? null
      : currentValue,
  );
  persistSessionDeletionOptimistic(nextSession, { setId });
}

export async function orchestrateDeleteSessionExercise({
  session,
  exerciseId,
  setPostSetEffortAdjustment,
  persistSessionDeletionOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;

  const nextSession = removeSessionExercise(session, exerciseId);
  if (nextSession === session) return;

  setPostSetEffortAdjustment((currentValue) =>
    currentValue && currentValue.exerciseId === exerciseId ? null : currentValue,
  );
  persistSessionDeletionOptimistic(nextSession, { exerciseId });
}

export async function orchestrateMoveActiveWorkoutExercise({
  session,
  exerciseId,
  direction,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;

  const nextSession = moveSessionExercise(session, exerciseId, direction);
  if (nextSession === session) return;

  persistSessionUpdateOptimistic(nextSession);
}

export async function orchestrateQuickActualUpdate({
  session,
  exerciseId,
  setId,
  field,
  delta,
  persistSessionUpdate,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;

  const payload = getQuickActualUpdatePayload({
    session,
    exerciseId,
    setId,
    field,
    delta,
  });

  if (!payload) return;

  await persistSessionUpdate(updateSessionSetActuals(session, exerciseId, setId, payload));
}

export async function orchestrateAdjustRestTimer({
  session,
  delta,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  persistSessionUpdateOptimistic(adjustRestTimer(session, delta));
}

export async function orchestrateDismissRestTimer({
  session,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  persistSessionUpdateOptimistic(clearRestTimer(session));
}

export async function orchestrateFinishWorkout({
  session,
  elapsedSeconds,
  completionPayload = {},
  persistSessionUpdate,
  setPostSetEffortAdjustment,
  setSelectedWorkoutSessionPreview,
  setIsActiveWorkoutViewOpen,
  setActiveTrainTab,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  if (!canFinishWorkoutSession(session)) return;

  await persistSessionUpdate(finishWorkoutSession({ session, elapsedSeconds, ...completionPayload }));
  setPostSetEffortAdjustment?.(null);
  setSelectedWorkoutSessionPreview?.(null);
  setIsActiveWorkoutViewOpen?.(false);
  setActiveTrainTab?.('session');
}

export async function orchestrateDiscardWorkout({
  session,
  elapsedSeconds,
  setPostSetEffortAdjustment,
  setIsActiveWorkoutViewOpen,
  persistSessionUpdateOptimistic,
  persistDiscardedSession = null,
  clearVisibleSession = null,
  getNowIsoString = () => new Date().toISOString(),
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  const discardedSession = discardWorkoutSession({ session, discardedAt: getNowIsoString(), elapsedSeconds });
  setPostSetEffortAdjustment(null);
  setIsActiveWorkoutViewOpen(false);

  if (typeof clearVisibleSession === 'function') {
    clearVisibleSession();
    if (typeof persistDiscardedSession === 'function') {
      void persistDiscardedSession(discardedSession);
    }
    return;
  }

  persistSessionUpdateOptimistic(discardedSession);
}

export async function orchestrateExerciseRestTimeChange({
  session,
  exerciseId,
  nextRestSeconds,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  persistSessionUpdateOptimistic(
    updateSessionExerciseRest(session, exerciseId, nextRestSeconds),
  );
}

export async function orchestrateRemoveExerciseRestTime({
  session,
  exerciseId,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  persistSessionUpdateOptimistic(updateSessionExerciseRest(session, exerciseId, null));
}

export async function orchestrateCreateSessionSuperset({
  session,
  sourceExerciseId,
  targetExerciseId,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  const nextSession = createSessionSuperset(session, sourceExerciseId, targetExerciseId);
  if (nextSession === session) return;
  persistSessionUpdateOptimistic(nextSession);
}

export async function orchestrateRemoveSessionSuperset({
  session,
  exerciseId,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  const nextSession = removeSessionSuperset(session, exerciseId);
  if (nextSession === session) return;
  persistSessionUpdateOptimistic(nextSession);
}

export async function orchestrateAddExercisesToSession({
  session,
  exerciseIds,
  exerciseDetailClient,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;

  const resolvedExercises = (
    await Promise.all(
      (exerciseIds || []).map((exerciseId) => exerciseDetailClient?.getExerciseById?.(exerciseId)),
    )
  ).filter(Boolean);

  if (!resolvedExercises.length) return;

  persistSessionUpdateOptimistic(
    appendSessionExercises(session, resolvedExercises, {
      defaultRestSeconds: session.settings?.defaultRestSeconds ?? null,
    }),
  );
}

export async function orchestrateWorkoutNotesChange({
  session,
  nextNotes,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  persistSessionUpdateOptimistic({
    ...session,
    notes: nextNotes ?? '',
  });
}

export async function orchestrateWorkoutSettingsChange({
  session,
  settingsPatch,
  persistSessionUpdateOptimistic,
}) {
  if (session.status === 'completed' || session.status === 'discarded') return;
  persistSessionUpdateOptimistic({
    ...session,
    settings: {
      ...session.settings,
      ...settingsPatch,
    },
  });
}
