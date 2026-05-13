export function applyWorkoutOpenStateTransition({
  immediateProgramWorkout = null,
  selectedWorkout = null,
  setSelectedProgramWorkoutPreview = () => {},
  setSelectedWorkoutSessionPreview = () => {},
} = {}) {
  setSelectedWorkoutSessionPreview(null);
  setSelectedProgramWorkoutPreview(selectedWorkout?.id ? selectedWorkout : (immediateProgramWorkout?.id ? immediateProgramWorkout : null));
}
