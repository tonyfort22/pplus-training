export function orchestrateOpenWorkoutEditView({
  setIsWorkoutSheetOpen,
  setIsWorkoutEditViewOpen,
  setWorkoutEditReturnSurface,
  nextReturnSurface,
  setWorkoutEditDraftModel,
  workoutDraftModel,
}) {
  setIsWorkoutSheetOpen(false);
  setWorkoutEditReturnSurface?.(nextReturnSurface ?? 'workout-sheet');
  setWorkoutEditDraftModel?.(workoutDraftModel ?? null);
  setIsWorkoutEditViewOpen(true);

  return {
    outcome: 'opened-workout-edit-view',
  };
}

export function orchestrateCloseWorkoutEditView({
  workoutEditReturnSurface,
  setIsWorkoutEditViewOpen,
  setIsWorkoutSheetOpen,
  setWorkoutEditReturnSurface,
  setWorkoutEditDraftModel,
}) {
  setIsWorkoutEditViewOpen(false);
  setWorkoutEditDraftModel?.(null);
  setWorkoutEditReturnSurface?.(null);
  setIsWorkoutSheetOpen(workoutEditReturnSurface === 'workout-sheet');

  return {
    outcome: 'closed-workout-edit-view',
  };
}
