function getWeightHeader(name) {
  return name.toLowerCase().includes('assisted') ? '-LB' : 'LB'
}

function getExerciseNotesPlaceholder() {
  return 'Add Notes'
}

function getWorkoutNotesPlaceholder() {
  return 'Add notes'
}

function getExerciseSets(exercise) {
  return exercise.sets.map((set) => ({
    id: set.id,
    setNumber: set.setNumber,
    effort: set.effort,
    load: set.load,
    reps: set.reps,
  }))
}

export function getWorkoutEditViewModel({ workoutSheetModel }) {
  return {
    title: workoutSheetModel.title,
    cancelLabel: 'Cancel',
    editLabel: 'Save',
    workoutNotesPlaceholder: 'Add notes',
    exerciseNotesPlaceholder: 'Add Notes',
    addSetLabel: 'Add Set',
    exercises: workoutSheetModel.exercises.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      thumbnailIcon: exercise.thumbnailIcon,
      weightHeader: getWeightHeader(exercise.name),
      restLabel: exercise.restLabel,
      supersetCount: 1,
      sets: getExerciseSets(exercise),
    })),
  }
}
