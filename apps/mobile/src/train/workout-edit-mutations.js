function parseRestLabelToSeconds(restLabel = '0:00') {
  const [minutesPart = '0', secondsPart = '0'] = String(restLabel || '0:00').split(':');
  return ((Number.parseInt(minutesPart, 10) || 0) * 60) + (Number.parseInt(secondsPart, 10) || 0);
}

function formatRestLabel(totalSeconds = 0) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export async function orchestrateMoveWorkoutEditExercise({
  exercises = [],
  exerciseId,
  direction,
  programSheetClient,
  setSelectedWorkoutSessionPreview,
}) {
  const currentIndex = exercises.findIndex((exercise) => exercise.id === exerciseId);
  if (currentIndex < 0) return false;

  const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
  if (targetIndex < 0 || targetIndex >= exercises.length) {
    return false;
  }

  const currentExercise = exercises[currentIndex];
  const targetExercise = exercises[targetIndex];
  if (!currentExercise || !targetExercise) return false;

  if (currentExercise.programWorkoutExerciseId && targetExercise.programWorkoutExerciseId) {
    const temporarySortOrder = 0;

    await programSheetClient?.updateProgramWorkoutExercise?.({
      programWorkoutExerciseId: currentExercise.programWorkoutExerciseId,
      sortOrder: temporarySortOrder,
    });

    await programSheetClient?.updateProgramWorkoutExercise?.({
      programWorkoutExerciseId: targetExercise.programWorkoutExerciseId,
      sortOrder: currentIndex + 1,
    });

    await programSheetClient?.updateProgramWorkoutExercise?.({
      programWorkoutExerciseId: currentExercise.programWorkoutExerciseId,
      sortOrder: targetIndex + 1,
    });
  } else {
    if (currentExercise.programWorkoutExerciseId) {
      await programSheetClient?.updateProgramWorkoutExercise?.({
        programWorkoutExerciseId: currentExercise.programWorkoutExerciseId,
        sortOrder: targetIndex + 1,
      });
    }

    if (targetExercise.programWorkoutExerciseId) {
      await programSheetClient?.updateProgramWorkoutExercise?.({
        programWorkoutExerciseId: targetExercise.programWorkoutExerciseId,
        sortOrder: currentIndex + 1,
      });
    }
  }

  setSelectedWorkoutSessionPreview((currentSession) => {
    if (!currentSession?.exercises?.length) return currentSession;

    const nextExercises = [...currentSession.exercises];
    const previewCurrentIndex = nextExercises.findIndex(
      (exercise) => exercise.id === exerciseId || exercise.programWorkoutExerciseId === currentExercise.programWorkoutExerciseId
    );
    if (previewCurrentIndex < 0) return currentSession;

    const previewTargetIndex = direction === 'up' ? previewCurrentIndex - 1 : previewCurrentIndex + 1;
    if (previewTargetIndex < 0 || previewTargetIndex >= nextExercises.length) return currentSession;

    const [movedExercise] = nextExercises.splice(previewCurrentIndex, 1);
    nextExercises.splice(previewTargetIndex, 0, movedExercise);

    return {
      ...currentSession,
      exercises: nextExercises.map((exercise, index) => ({
        ...exercise,
        sortOrder: index + 1,
      })),
    };
  });

  return { success: true, exerciseId, direction };
}

export async function orchestrateAddWorkoutEditSet({
  exercises = [],
  exerciseId,
  programSheetClient,
  setSelectedWorkoutSessionPreview,
}) {
  const exercise = exercises.find((item) => item.id === exerciseId);
  if (!exercise) return null;

  const lastSet = exercise.sets.at(-1) || null;
  const nextSortOrder = Math.max(0, ...exercise.sets.map((set) => Number(set.sortOrder) || 0)) + 1;

  const persistedSet = await programSheetClient?.createProgramWorkoutSet?.({
    programWorkoutExerciseId: exercise.programWorkoutExerciseId,
    sourceSet: lastSet,
    sortOrder: nextSortOrder,
  });

  if (!persistedSet) {
    return {
      id: `${exerciseId}-local-set-${nextSortOrder}`,
      programWorkoutSetId: null,
      setNumber: nextSortOrder,
      sortOrder: nextSortOrder,
      setType: lastSet?.setType || 'straight',
      prescribedRestSeconds: lastSet?.prescribedRestSeconds ?? 0,
      targetLoadUnit: lastSet?.targetLoadUnit || 'lb',
      effort: lastSet?.effort ?? '',
      load: lastSet?.load ?? '',
      reps: lastSet?.reps ?? '',
    };
  }

  const nextSet = {
    ...persistedSet,
    setNumber: persistedSet.setNumber ?? nextSortOrder,
    sortOrder: persistedSet.sortOrder ?? nextSortOrder,
    setType: persistedSet.setType || lastSet?.setType || 'straight',
    prescribedRestSeconds: persistedSet.prescribedRestSeconds ?? lastSet?.prescribedRestSeconds ?? 0,
    targetLoadUnit: persistedSet.targetLoadUnit || lastSet?.targetLoadUnit || 'lb',
    effort: persistedSet.effort ?? lastSet?.effort ?? '',
    load: persistedSet.load ?? lastSet?.load ?? '',
    reps: persistedSet.reps ?? lastSet?.reps ?? '',
  };

  setSelectedWorkoutSessionPreview((currentSession) => {
    if (!currentSession?.exercises?.length) return currentSession;
    return {
      ...currentSession,
      totalSetsCount: (currentSession.totalSetsCount || 0) + 1,
      exercises: currentSession.exercises.map((currentExercise) =>
        currentExercise.id === exerciseId || currentExercise.programWorkoutExerciseId === exercise.programWorkoutExerciseId
          ? {
              ...currentExercise,
              sets: [
                ...(currentExercise.sets || []),
                {
                  id: nextSet.id,
                  programWorkoutSetId: nextSet.programWorkoutSetId || nextSet.id,
                  sortOrder: nextSet.sortOrder,
                  setType: nextSet.setType,
                  prescribedReps: nextSet.reps === '' ? null : Number(nextSet.reps),
                  prescribedLoad: nextSet.load === '' ? null : Number(nextSet.load),
                  prescribedLoadUnit: nextSet.targetLoadUnit,
                  prescribedRpe: nextSet.effort === '' ? null : Number(nextSet.effort),
                  prescribedRestSeconds: nextSet.prescribedRestSeconds,
                  actualReps: null,
                  actualLoad: null,
                  actualRpe: null,
                  actualRestSeconds: null,
                  isCompleted: false,
                },
              ],
            }
          : currentExercise
      ),
    };
  });

  return nextSet;
}

export async function orchestrateAddExercisesToWorkoutEdit({
  programWorkoutId,
  exerciseIds = [],
  exerciseLibraryClient,
  programSheetClient,
  setSelectedWorkoutSessionPreview,
  setWorkoutEditDraftModel,
}) {
  if (!programWorkoutId || !Array.isArray(exerciseIds) || exerciseIds.length === 0) return [];

  const exerciseRecords = [];
  for (const exerciseId of exerciseIds) {
    const exercise = await exerciseLibraryClient?.getExerciseById?.(exerciseId);
    if (!exercise?.id) continue;
    exerciseRecords.push({
      exerciseId: exercise.id,
      nameSnapshot: exercise.name || '',
      defaultRestSeconds: exercise.defaultRestSeconds ?? null,
      notes: '',
      sets: Array.isArray(exercise.sets)
        ? exercise.sets.map((set, index) => ({
            sortOrder: set.sortOrder ?? index + 1,
            setType: set.setType || 'straight',
            reps: set.reps ?? (set.targetReps == null ? '' : String(set.targetReps)),
            load: set.load ?? (set.targetLoad == null ? '' : String(set.targetLoad)),
            effort: set.effort ?? (set.targetRpe == null ? '' : String(set.targetRpe)),
            targetLoadUnit: set.targetLoadUnit || 'lb',
            prescribedRestSeconds: set.prescribedRestSeconds ?? set.targetRestSeconds ?? exercise.defaultRestSeconds ?? null,
            notes: set.notes || '',
          }))
        : [],
    });
  }

  if (exerciseRecords.length === 0) return [];

  const createdExercises = await programSheetClient?.createProgramWorkoutExercises?.({
    programWorkoutId,
    startSortOrder: 1,
    exerciseRecords,
  });

  const normalizedExercises = (createdExercises || []).map((exercise) => ({
    id: exercise.programWorkoutExerciseId || exercise.id,
    exerciseId: exercise.exerciseId || exercise.id,
    programWorkoutExerciseId: exercise.programWorkoutExerciseId || exercise.id,
    programWorkoutId: exercise.programWorkoutId || programWorkoutId,
    sortOrder: exercise.sortOrder ?? 0,
    sortOrderLabel: String(exercise.sortOrder ?? 0),
    name: exercise.nameSnapshot || exercise.name || '',
    thumbnailIcon: 'dumbbell',
    weightHeader: (exercise.nameSnapshot || exercise.name || '').toLowerCase().includes('assisted') ? '-LB' : 'LB',
    restLabel: formatRestLabel(exercise.defaultRestSeconds ?? 0),
    notes: exercise.notes || '',
    sets: (exercise.sets || []).map((set, index) => ({
      id: set.id,
      programWorkoutSetId: set.id,
      sortOrder: set.sortOrder ?? index + 1,
      setType: set.setType || 'straight',
      prescribedRestSeconds: set.prescribedRestSeconds ?? null,
      targetLoadUnit: set.targetLoadUnit || 'lb',
      setNumber: String(set.sortOrder ?? index + 1),
      effort: set.effort ?? '',
      load: set.load ?? '',
      reps: set.reps ?? '',
    })),
  }));

  setSelectedWorkoutSessionPreview?.((currentSession) => {
    const currentExercises = Array.isArray(currentSession?.exercises) ? currentSession.exercises : [];
    const appendedExercises = normalizedExercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      programWorkoutExerciseId: exercise.programWorkoutExerciseId,
      nameSnapshot: exercise.name,
      sortOrder: exercise.sortOrder,
      defaultRestSeconds: parseRestLabelToSeconds(exercise.restLabel),
      sets: exercise.sets.map((set) => ({
        id: set.id,
        programWorkoutSetId: set.programWorkoutSetId,
        sortOrder: set.sortOrder,
        setType: set.setType,
        prescribedReps: set.reps === '' ? null : Number(set.reps),
        prescribedLoad: set.load === '' ? null : Number(set.load),
        prescribedLoadUnit: set.targetLoadUnit,
        prescribedRpe: set.effort === '' ? null : Number(set.effort),
        prescribedRestSeconds: set.prescribedRestSeconds,
      })),
    }));

    return {
      ...(currentSession || {}),
      programWorkoutId,
      exercises: [...currentExercises, ...appendedExercises],
      totalExercisesCount: currentExercises.length + appendedExercises.length,
      totalSetsCount: [...currentExercises, ...appendedExercises].reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0),
    };
  });

  setWorkoutEditDraftModel?.((currentDraft) => ({
    ...(currentDraft || {}),
    programWorkoutId,
    exercises: [...(currentDraft?.exercises || []), ...normalizedExercises],
  }));

  return normalizedExercises;
}

export async function orchestrateDeleteWorkoutEditSet({
  exercises = [],
  exerciseId,
  setId,
  programSheetClient,
  setSelectedWorkoutSessionPreview,
}) {
  const exercise = exercises.find((item) => item.id === exerciseId);
  if (!exercise) return false;

  const targetSet = exercise.sets.find((set) => set.id === setId);
  if (!targetSet) return false;

  const targetSetId = targetSet.programWorkoutSetId || setId;
  const deleteResult = await programSheetClient?.deleteProgramWorkoutSet?.({
    programWorkoutSetId: targetSet.programWorkoutSetId || setId,
  });

  setSelectedWorkoutSessionPreview((currentSession) => {
    if (!currentSession?.exercises?.length) return currentSession;

    let removedCount = 0;
    const nextExercises = currentSession.exercises.map((currentExercise) => {
      if (!(currentExercise.id === exerciseId || currentExercise.programWorkoutExerciseId === exercise.programWorkoutExerciseId)) {
        return currentExercise;
      }

      const nextSetCount = currentExercise.sets.filter((set) => (set.programWorkoutSetId || set.id) !== targetSetId).length;
      removedCount += (currentExercise.sets?.length || 0) - nextSetCount;
      return {
        ...currentExercise,
        sets: currentExercise.sets.filter((set) => (set.programWorkoutSetId || set.id) !== targetSetId).map((set, index) => ({
          ...set,
          sortOrder: index + 1,
        })),
      };
    });

    if (removedCount === 0) return currentSession;

    const currentTotalSets = currentSession.totalSetsCount || currentSession.exercises.reduce((sum, currentExercise) => sum + (currentExercise.sets?.length || 0), 0);
    return {
      ...currentSession,
      totalSetsCount: Math.max(0, currentTotalSets - removedCount),
      exercises: nextExercises,
    };
  });

  return deleteResult ?? { success: true, programWorkoutSetId: targetSetId };
}
