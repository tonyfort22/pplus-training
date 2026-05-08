export function orchestrateCloseActiveWorkout({
  session,
  setSelectedWorkoutSessionPreview,
  setIsActiveWorkoutViewOpen,
  setIsWorkoutSheetOpen,
  runAfterInteractions,
}) {
  void session;
  void setSelectedWorkoutSessionPreview;
  void setIsWorkoutSheetOpen;
  void runAfterInteractions;
  setIsActiveWorkoutViewOpen(false);
  return {
    outcome: 'closed-active-workout',
    reopenedWorkoutSheet: false,
    sessionId: session?.id ?? null,
    programWorkoutId: session?.programWorkoutId ?? null,
  };
}
