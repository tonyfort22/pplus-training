export function orchestrateOpenExerciseDetail({
  exercise = null,
  sourceSurface = null,
  exerciseDetailClient = null,
  logger = console,
  setSelectedExerciseId = () => {},
  setSelectedExercisePreview = () => {},
  setExerciseDetailReturnSurface = () => {},
  setIsWorkoutSheetOpen = () => {},
  setIsWorkoutEditViewOpen = () => {},
  setIsProfileViewOpen = () => {},
  setIsActiveWorkoutViewOpen = () => {},
  setIsExerciseDetailViewOpen = () => {},
} = {}) {
  const exerciseId = exercise?.exerciseId || exercise?.id;
  if (!exerciseId) {
    return {
      outcome: 'blocked-missing-exercise-id',
      exerciseId: null,
    };
  }

  logger.info?.('[exercise-detail-open:initial]', {
    sourceSurface,
    exerciseId,
    exerciseName: exercise?.name || exercise?.nameSnapshot || null,
    videoUrl: exercise?.videoUrl || null,
  });

  setSelectedExerciseId(exerciseId);
  setSelectedExercisePreview(exercise);
  setExerciseDetailReturnSurface(sourceSurface);

  if (sourceSurface === 'workout-sheet') {
    setIsWorkoutSheetOpen(false);
  }
  if (sourceSurface === 'workout-edit') {
    setIsWorkoutEditViewOpen(false);
  }
  if (sourceSurface === 'profile-view') {
    setIsProfileViewOpen(false);
  }
  if (sourceSurface === 'active-workout') {
    setIsActiveWorkoutViewOpen(false);
  }

  setIsExerciseDetailViewOpen(true);

  exerciseDetailClient?.getExerciseById?.(exerciseId)
    .then(async (resolvedExerciseById) => {
      const exerciseName = exercise?.name || exercise?.nameSnapshot || null;
      const resolvedExerciseByName = !resolvedExerciseById && exerciseName
        ? await exerciseDetailClient?.getExerciseByName?.(exerciseName)
        : null;
      const resolvedExercise = resolvedExerciseById || resolvedExerciseByName || null;

      logger.info?.('[exercise-detail-open:resolved]', {
        exerciseId,
        exerciseName,
        resolvedBy: resolvedExerciseById ? 'id' : resolvedExerciseByName ? 'name' : 'none',
        resolvedExerciseId: resolvedExercise?.id ?? null,
        resolvedVideoUrl: resolvedExercise?.videoUrl ?? null,
      });
      if (!resolvedExercise) return;

      setSelectedExercisePreview((current) => {
        if (!current) return current;
        const currentExerciseId = current.exerciseId || current.id;
        if (currentExerciseId !== exerciseId) return current;
        return {
          ...current,
          ...resolvedExercise,
          exerciseId: current.exerciseId || resolvedExercise.id || exerciseId,
          videoUrl: resolvedExercise.videoUrl || current.videoUrl || null,
          thumbnailUrl: resolvedExercise.thumbnailUrl || current.thumbnailUrl || null,
          name: resolvedExercise.name || current.name,
        };
      });
    })
    .catch(() => {});

  return {
    outcome: 'opened-and-hydrating',
    exerciseId,
  };
}

export function orchestrateCloseExerciseDetail({
  exerciseDetailReturnSurface = null,
  setIsExerciseDetailViewOpen = () => {},
  setIsWorkoutSheetOpen = () => {},
  setIsWorkoutEditViewOpen = () => {},
  setIsProfileViewOpen = () => {},
  setIsActiveWorkoutViewOpen = () => {},
  setExerciseDetailReturnSurface = () => {},
} = {}) {
  setIsExerciseDetailViewOpen(false);

  if (exerciseDetailReturnSurface === 'workout-sheet') {
    setIsWorkoutSheetOpen(true);
  }
  if (exerciseDetailReturnSurface === 'workout-edit') {
    setIsWorkoutEditViewOpen(true);
  }
  if (exerciseDetailReturnSurface === 'profile-view') {
    setIsProfileViewOpen(true);
  }
  if (exerciseDetailReturnSurface === 'active-workout') {
    setIsActiveWorkoutViewOpen(true);
  }

  setExerciseDetailReturnSurface(null);

  return {
    outcome: 'closed-exercise-detail',
    exerciseDetailReturnSurface,
  };
}
