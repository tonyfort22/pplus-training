export function canStartSession(status) {
  return status === 'draft';
}

export function canCompleteSession(status) {
  return status === 'in_progress' || status === 'paused';
}

export function formatWorkoutTimer(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

export function formatClock(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function toIsoString(value) {
  if (!value) return new Date().toISOString();
  return typeof value === 'string' ? value : new Date(value).toISOString();
}

function buildSessionCounts(session) {
  const exercises = session.exercises || [];
  const totalExercisesCount = exercises.length;
  const totalSetsCount = exercises.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0);
  const completedSetsCount = exercises.reduce(
    (sum, exercise) => sum + (exercise.sets || []).filter((set) => set.isCompleted).length,
    0
  );
  const completedExercisesCount = exercises.filter((exercise) => {
    const sets = exercise.sets || [];
    return sets.length > 0 && sets.every((set) => set.isCompleted);
  }).length;

  return {
    totalExercisesCount,
    completedExercisesCount,
    totalSetsCount,
    completedSetsCount,
  };
}

function applySessionProgress(session) {
  return {
    ...session,
    ...buildSessionCounts(session),
  };
}

function buildSessionSettings(source = {}) {
  return {
    defaultRestSeconds: source.defaultRestSeconds ?? null,
    autoProgressEnabled: source.autoProgressEnabled ?? false,
    keepAwake: source.keepAwake ?? false,
    adjustEffortAfterSet: source.adjustEffortAfterSet ?? false,
  };
}

export function createWorkoutSession({ programWorkout, startedAt } = {}) {
  const safeWorkout = programWorkout || {};
  const exercises = (safeWorkout.exercises || []).map((exercise) => ({
    id: exercise.id,
    programWorkoutExerciseId: exercise.id,
    exerciseId: exercise.exerciseId,
    nameSnapshot: exercise.nameSnapshot || exercise.name || '',
    sortOrder: exercise.sortOrder || 0,
    notes: exercise.notes || '',
    defaultRestSeconds: exercise.defaultRestSeconds ?? null,
    fatigueMultiplier: exercise.fatigueMultiplier ?? null,
    axialFatigueMultiplier: exercise.axialFatigueMultiplier ?? null,
    skillFatigueMultiplier: exercise.skillFatigueMultiplier ?? null,
    bodyRegion: exercise.bodyRegion ?? null,
    stimulusType: exercise.stimulusType ?? null,
    movementPattern: exercise.movementPattern ?? null,
    muscleTargets: Array.isArray(exercise.muscleTargets) ? exercise.muscleTargets.map((target) => ({ ...target })) : [],
    status: 'not_started',
    sets: (exercise.sets || []).map((set) => ({
      id: set.id,
      programWorkoutSetId: set.id,
      sortOrder: set.sortOrder || 0,
      setType: set.setType || 'straight',
      prescribedReps: set.targetReps ?? null,
      prescribedLoad: set.targetLoad ?? null,
      prescribedLoadUnit: set.targetLoadUnit ?? null,
      prescribedDurationSeconds: set.targetDurationSeconds ?? null,
      prescribedDistance: set.targetDistance ?? null,
      prescribedDistanceUnit: set.targetDistanceUnit ?? null,
      prescribedRpe: set.targetRpe ?? null,
      prescribedRir: set.targetRir ?? null,
      prescribedRestSeconds: set.targetRestSeconds ?? exercise.defaultRestSeconds ?? null,
      actualReps: null,
      actualLoad: null,
      actualLoadUnit: null,
      actualDurationSeconds: null,
      actualDistance: null,
      actualDistanceUnit: null,
      actualRpe: null,
      actualRir: null,
      actualRestSeconds: null,
      completedAt: null,
      isCompleted: false,
      notes: set.notes || '',
    })),
  }));

  return applySessionProgress({
    id: safeWorkout.id,
    athleteId: safeWorkout.athleteId ?? null,
    coachId: safeWorkout.coachId ?? null,
    programId: safeWorkout.programId ?? null,
    programDayId: safeWorkout.programDayId ?? null,
    programWorkoutId: safeWorkout.id ?? null,
    workoutTemplateId: safeWorkout.workoutTemplateId ?? null,
    nameSnapshot: safeWorkout.nameSnapshot || safeWorkout.name || '',
    status: 'in_progress',
    startedAt: toIsoString(startedAt),
    completedAt: null,
    elapsedSeconds: 0,
    notes: '',
    perceivedDifficulty: null,
    settings: buildSessionSettings({
      defaultRestSeconds: safeWorkout.defaultRestSeconds,
      autoProgressEnabled: safeWorkout.autoProgressEnabled,
      keepAwake: safeWorkout.keepAwake,
      adjustEffortAfterSet: safeWorkout.adjustEffortAfterSet,
    }),
    activeRestTimer: null,
    exercises,
  });
}

export function createWorkoutSessionFromTemplate(workoutTemplate) {
  return {
    id: workoutTemplate.id,
    name: workoutTemplate.name,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    completedAt: null,
    elapsedSeconds: 0,
    notes: '',
    activeRestTimer: null,
    exercises: (workoutTemplate.exercises || []).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      defaultRestSeconds: exercise.defaultRestSeconds ?? null,
      notes: exercise.notes || '',
      status: 'not_started',
      sets: (exercise.sets || []).map((set) => ({
        id: set.id,
        setType: set.setType || 'straight',
        prescribedReps: set.prescribedReps ?? null,
        prescribedLoad: set.prescribedLoad ?? null,
        prescribedDurationSeconds: set.prescribedDurationSeconds ?? null,
        prescribedDistance: set.prescribedDistance ?? null,
        prescribedRpe: set.prescribedRpe ?? null,
        prescribedRir: set.prescribedRir ?? null,
        prescribedRestSeconds: set.prescribedRestSeconds ?? exercise.defaultRestSeconds ?? null,
        actualReps: null,
        actualLoad: null,
        actualDurationSeconds: null,
        actualDistance: null,
        actualRpe: null,
        actualRir: null,
        actualRestSeconds: null,
        isCompleted: false,
        completedAt: null,
        notes: ''
      }))
    }))
  };
}

export function completeSessionSet(sessionSet) {
  const nextSet = { ...sessionSet };

  if (nextSet.actualReps == null) nextSet.actualReps = nextSet.prescribedReps ?? null;
  if (nextSet.actualLoad == null) nextSet.actualLoad = nextSet.prescribedLoad ?? null;
  if (nextSet.actualDurationSeconds == null) nextSet.actualDurationSeconds = nextSet.prescribedDurationSeconds ?? null;
  if (nextSet.actualDistance == null) nextSet.actualDistance = nextSet.prescribedDistance ?? null;
  if (nextSet.actualRpe == null) nextSet.actualRpe = nextSet.prescribedRpe ?? null;
  if (nextSet.actualRir == null) nextSet.actualRir = nextSet.prescribedRir ?? null;
  if (nextSet.actualRestSeconds == null) nextSet.actualRestSeconds = nextSet.prescribedRestSeconds ?? null;

  nextSet.isCompleted = true;
  nextSet.completedAt = nextSet.completedAt || new Date().toISOString();

  return nextSet;
}

export function updateSessionSetActuals(session, exerciseId, setId, actuals) {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;

      return {
        ...exercise,
        sets: exercise.sets.map((set) => {
          if (set.id !== setId) return set;

          return {
            ...set,
            ...actuals
          };
        })
      };
    })
  };
}

export function updateSessionExerciseRest(session, exerciseId, nextRestSeconds) {
  return {
    ...session,
    exercises: (session.exercises || []).map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;
      return {
        ...exercise,
        defaultRestSeconds: nextRestSeconds == null ? null : Math.max(0, Number(nextRestSeconds) || 0),
      };
    })
  };
}

export function removeSessionExercise(session, exerciseId) {
  const currentExercises = Array.isArray(session?.exercises) ? session.exercises : [];
  const targetExercise = currentExercises.find((exercise) => exercise.id === exerciseId) || null;
  if (!targetExercise) return session;

  const nextSession = {
    ...session,
    activeRestTimer: session?.activeRestTimer?.exerciseId === exerciseId ? null : session?.activeRestTimer ?? null,
    exercises: currentExercises
      .filter((exercise) => exercise.id !== exerciseId)
      .map((exercise, index) => ({
        ...exercise,
        sortOrder: index + 1,
      })),
  };

  return applySessionProgress(updateExerciseStatuses(nextSession));
}

export function moveSessionExercise(session, exerciseId, direction) {
  const currentExercises = Array.isArray(session?.exercises) ? session.exercises : [];
  const currentIndex = currentExercises.findIndex((exercise) => exercise.id === exerciseId);
  if (currentIndex < 0) return session;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= currentExercises.length) return session;

  const nextExercises = [...currentExercises];
  const [movedExercise] = nextExercises.splice(currentIndex, 1);
  nextExercises.splice(targetIndex, 0, movedExercise);

  return applySessionProgress(updateExerciseStatuses({
    ...session,
    exercises: nextExercises.map((exercise, index) => ({
      ...exercise,
      sortOrder: index + 1,
    })),
  }));
}

export function appendSessionExerciseSet(session, exerciseId) {
  const nextSession = {
    ...session,
    exercises: (session.exercises || []).map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;

      const lastSet = (exercise.sets || []).at(-1) || null;
      const nextSortOrder = Math.max(0, ...(exercise.sets || []).map((set) => Number(set.sortOrder) || 0)) + 1;

      const nextSet = {
        id: `${exerciseId}-session-set-${nextSortOrder}`,
        programWorkoutSetId: null,
        sortOrder: nextSortOrder,
        setType: lastSet?.setType || 'straight',
        prescribedReps: lastSet?.prescribedReps ?? null,
        prescribedLoad: lastSet?.prescribedLoad ?? null,
        prescribedLoadUnit: lastSet?.prescribedLoadUnit ?? null,
        prescribedDurationSeconds: lastSet?.prescribedDurationSeconds ?? null,
        prescribedDistance: lastSet?.prescribedDistance ?? null,
        prescribedDistanceUnit: lastSet?.prescribedDistanceUnit ?? null,
        prescribedRpe: lastSet?.prescribedRpe ?? null,
        prescribedRir: lastSet?.prescribedRir ?? null,
        prescribedRestSeconds: lastSet?.prescribedRestSeconds ?? exercise.defaultRestSeconds ?? null,
        actualReps: null,
        actualLoad: null,
        actualLoadUnit: null,
        actualDurationSeconds: null,
        actualDistance: null,
        actualDistanceUnit: null,
        actualRpe: null,
        actualRir: null,
        actualRestSeconds: null,
        completedAt: null,
        isCompleted: false,
        notes: lastSet?.notes || '',
      };

      return {
        ...exercise,
        sets: [
          ...(exercise.sets || []),
          nextSet,
        ],
      };
    }),
  };

  return applySessionProgress(updateExerciseStatuses(nextSession));
}

function buildSeededSessionSets(exercise, defaultRestSeconds, nextExerciseId) {
  const templateSets = Array.isArray(exercise?.sets) ? exercise.sets : []
  return templateSets.map((set, index) => ({
    id: `local-session-set-${nextExerciseId}-${index + 1}`,
    programWorkoutSetId: null,
    sortOrder: index + 1,
    setType: set.setType || 'straight',
    prescribedReps: set.prescribedReps ?? set.targetReps ?? null,
    prescribedLoad: set.prescribedLoad ?? set.targetLoad ?? null,
    prescribedLoadUnit: set.prescribedLoadUnit ?? set.targetLoadUnit ?? null,
    prescribedDurationSeconds: set.prescribedDurationSeconds ?? set.targetDurationSeconds ?? null,
    prescribedDistance: set.prescribedDistance ?? set.targetDistance ?? null,
    prescribedDistanceUnit: set.prescribedDistanceUnit ?? set.targetDistanceUnit ?? null,
    prescribedRpe: set.prescribedRpe ?? set.targetRpe ?? null,
    prescribedRir: set.prescribedRir ?? set.targetRir ?? null,
    prescribedRestSeconds: set.prescribedRestSeconds ?? set.targetRestSeconds ?? exercise?.defaultRestSeconds ?? defaultRestSeconds,
    actualReps: null,
    actualLoad: null,
    actualLoadUnit: null,
    actualDurationSeconds: null,
    actualDistance: null,
    actualDistanceUnit: null,
    actualRpe: null,
    actualRir: null,
    actualRestSeconds: null,
    completedAt: null,
    isCompleted: false,
    notes: set.notes || '',
  }))
}

export function appendSessionExercises(session, exercisesToAdd = [], { defaultRestSeconds = null } = {}) {
  const existingExercises = Array.isArray(session?.exercises) ? session.exercises : []
  const nextExercises = exercisesToAdd.map((exercise, index) => {
    const nextExerciseId = `local-session-exercise-${exercise.id}-${existingExercises.length + index + 1}`
    const exerciseRestSeconds = exercise.defaultRestSeconds ?? defaultRestSeconds
    return {
      id: nextExerciseId,
      programWorkoutExerciseId: null,
      exerciseId: exercise.id,
      nameSnapshot: exercise.name || 'Exercise',
      thumbnailUrl: exercise.thumbnailUrl ?? null,
      sortOrder: existingExercises.length + index + 1,
      status: 'not_started',
      notes: '',
      defaultRestSeconds: exerciseRestSeconds,
      sets: buildSeededSessionSets(exercise, exerciseRestSeconds, nextExerciseId),
    }
  })

  return applySessionProgress(updateExerciseStatuses({
    ...session,
    exercises: [
      ...existingExercises,
      ...nextExercises,
    ],
  }))
}

export function getSessionProgress(session) {
  const exercises = session.exercises || [];
  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const completedSets = exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.isCompleted).length,
    0
  );
  const completedExercises = exercises.filter((exercise) =>
    exercise.sets.length > 0 && exercise.sets.every((set) => set.isCompleted)
  ).length;

  return {
    totalExercises,
    completedExercises,
    totalSets,
    completedSets,
    completionPercent: totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100)
  };
}

export function updateExerciseStatuses(session) {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      const completedSets = exercise.sets.filter((set) => set.isCompleted).length;

      let status = 'not_started';
      if (completedSets > 0 && completedSets < exercise.sets.length) status = 'active';
      if (exercise.sets.length > 0 && completedSets === exercise.sets.length) status = 'completed';

      return {
        ...exercise,
        status
      };
    })
  };
}

export function completeWorkoutSessionSet(session, exerciseId, setId) {
  return completeWorkoutSet({ session, exerciseId, setId });
}

function resolveCompletedSetRestSeconds(session, exerciseId, completedSet) {
  const exercise = (session.exercises || []).find((item) => item.id === exerciseId) || null;

  return completedSet.actualRestSeconds
    ?? completedSet.prescribedRestSeconds
    ?? exercise?.defaultRestSeconds
    ?? session.settings?.defaultRestSeconds
    ?? 0;
}

export function completeWorkoutSet({ session, exerciseId, setId, actuals = {}, completedAt } = {}) {
  let toggledCompletedSet = null;
  let didUncompleteSet = false;

  const updatedSession = {
    ...session,
    activeRestTimer: null,
    exercises: (session.exercises || []).map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;

      return {
        ...exercise,
        sets: (exercise.sets || []).map((set) => {
          if (set.id !== setId) return set;

          if (set.isCompleted) {
            didUncompleteSet = true;
            return {
              ...set,
              isCompleted: false,
              completedAt: null,
            };
          }

          const withActuals = {
            ...set,
            ...actuals,
            completedAt: completedAt ? toIsoString(completedAt) : set.completedAt,
          };
          toggledCompletedSet = completeSessionSet(withActuals);
          return toggledCompletedSet;
        })
      };
    })
  };

  const sessionWithStatuses = applySessionProgress(updateExerciseStatuses(updatedSession));

  if (didUncompleteSet) {
    return sessionWithStatuses;
  }

  const completedSet = toggledCompletedSet || findSessionSet(sessionWithStatuses, exerciseId, setId);

  if (!completedSet || !completedSet.isCompleted) return sessionWithStatuses;

  return applySessionProgress(startRestTimer(sessionWithStatuses, {
    exerciseId,
    setId,
    remainingSeconds: resolveCompletedSetRestSeconds(sessionWithStatuses, exerciseId, completedSet)
  }));
}

export function startRestTimer(session, timerInput) {
  return {
    ...session,
    activeRestTimer: {
      exerciseId: timerInput.exerciseId,
      setId: timerInput.setId,
      remainingSeconds: timerInput.remainingSeconds,
      startedAt: new Date().toISOString(),
      mode: timerInput.mode || 'timer',
      isRunning: true
    }
  };
}

export function adjustRestTimer(session, secondsDelta) {
  if (!session.activeRestTimer) return session;

  return {
    ...session,
    activeRestTimer: {
      ...session.activeRestTimer,
      remainingSeconds: Math.max(0, session.activeRestTimer.remainingSeconds + secondsDelta)
    }
  };
}

export function clearRestTimer(session) {
  return {
    ...session,
    activeRestTimer: null
  };
}

export function findSessionSet(session, exerciseId, setId) {
  const exercise = session.exercises.find((item) => item.id === exerciseId);
  if (!exercise) return null;
  return exercise.sets.find((set) => set.id === setId) || null;
}

export function canFinishWorkoutSession(session) {
  if (!session) return false;
  return Number(session.completedSetsCount ?? 0) > 0;
}

export function finishWorkoutSession(sessionOrInput) {
  const session = sessionOrInput?.session || sessionOrInput;
  const completedAt = sessionOrInput?.completedAt;
  const elapsedSeconds = sessionOrInput?.elapsedSeconds;
  const perceivedDifficulty = sessionOrInput?.perceivedDifficulty;
  const notes = sessionOrInput?.notes;
  const nextSession = applySessionProgress(updateExerciseStatuses({
    ...session,
    status: 'completed',
    completedAt: toIsoString(completedAt),
    elapsedSeconds: elapsedSeconds ?? session.elapsedSeconds ?? 0,
    perceivedDifficulty: perceivedDifficulty ?? session.perceivedDifficulty ?? null,
    notes: notes ?? session.notes ?? '',
    activeRestTimer: null
  }));

  return nextSession;
}

export function discardWorkoutSession(sessionOrInput) {
  const session = sessionOrInput?.session || sessionOrInput;
  const discardedAt = sessionOrInput?.discardedAt;
  const elapsedSeconds = sessionOrInput?.elapsedSeconds;

  return applySessionProgress(updateExerciseStatuses({
    ...session,
    status: 'discarded',
    completedAt: toIsoString(discardedAt),
    elapsedSeconds: elapsedSeconds ?? session.elapsedSeconds ?? 0,
    activeRestTimer: null
  }));
}
