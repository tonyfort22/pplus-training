function getWeightHeader(name = '') {
  return name.toLowerCase().includes('assisted') ? '-LB' : 'LB'
}

function getExerciseNotesPlaceholder() {
  return 'Add Notes'
}

function getWorkoutNotesPlaceholder() {
  return 'Add notes'
}

function parseRestLabelToSeconds(restLabel) {
  if (!restLabel || typeof restLabel !== 'string') return 0

  const [minutesPart = '0', secondsPart = '0'] = restLabel.split(':')
  const minutes = Number.parseInt(minutesPart, 10) || 0
  const seconds = Number.parseInt(secondsPart, 10) || 0
  return minutes * 60 + seconds
}

function getExerciseSets(exercise) {
  return exercise.sets.map((set) => ({
    id: set.id,
    programWorkoutSetId: set.programWorkoutSetId || set.id || null,
    sortOrder: set.sortOrder ?? (Number.parseInt(set.setNumber, 10) || 0),
    setType: set.setType || 'straight',
    prescribedRestSeconds: set.prescribedRestSeconds ?? parseRestLabelToSeconds(exercise.restLabel),
    targetLoadUnit: set.targetLoadUnit || 'lb',
    setNumber: set.setNumber,
    effort: set.effort,
    load: set.load,
    reps: set.reps,
  }))
}

export function createEmptyWorkoutEditDraftModel() {
  return {
    programWorkoutId: null,
    title: '',
    workoutNotes: '',
    cancelLabel: 'Cancel',
    editLabel: 'Save',
    workoutNamePlaceholder: 'Workout name',
    workoutNotesPlaceholder: 'Add notes',
    exerciseNotesPlaceholder: 'Add Notes',
    addExerciseLabel: 'Add Exercise',
    deleteLabel: 'Delete Workout',
    addSetLabel: 'Add Set',
    addExerciseSheet: {
      title: 'Exercises',
      searchPlaceholder: 'Search or Create Exercises',
      addButtonLabel: 'Add',
      exercises: [],
    },
    exercises: [],
  }
}

export function getWorkoutEditViewModel({ workoutSheetModel, workoutDraftModel = null }) {
  if (workoutDraftModel) {
    return {
      ...createEmptyWorkoutEditDraftModel(),
      ...workoutDraftModel,
      programWorkoutId: workoutDraftModel.programWorkoutId || null,
      addExerciseSheet: {
        ...createEmptyWorkoutEditDraftModel().addExerciseSheet,
        ...(workoutDraftModel.addExerciseSheet || {}),
        exercises: Array.isArray(workoutDraftModel.addExerciseSheet?.exercises) ? workoutDraftModel.addExerciseSheet.exercises : [],
      },
      exercises: Array.isArray(workoutDraftModel.exercises) ? workoutDraftModel.exercises : [],
    }
  }

  return {
    programWorkoutId: workoutSheetModel.programWorkoutId || null,
    title: workoutSheetModel.title,
    workoutNotes: workoutSheetModel.workoutNotes || workoutSheetModel.notes || '',
    cancelLabel: 'Cancel',
    editLabel: 'Save',
    workoutNamePlaceholder: 'Workout name',
    workoutNotesPlaceholder: 'Add notes',
    exerciseNotesPlaceholder: 'Add Notes',
    addExerciseLabel: 'Add Exercise',
    deleteLabel: 'Delete Workout',
    addSetLabel: 'Add Set',
    addExerciseSheet: {
      title: 'Exercises',
      searchPlaceholder: 'Search or Create Exercises',
      addButtonLabel: 'Add',
      exercises: [],
    },
    exercises: workoutSheetModel.exercises.map((exercise, exerciseIndex) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId || exercise.id,
      programWorkoutExerciseId: exercise.programWorkoutExerciseId || null,
      programWorkoutId: exercise.programWorkoutId || workoutSheetModel.programWorkoutId || null,
      sortOrder: exercise.sortOrder ?? exerciseIndex + 1,
      sortOrderLabel: String(exercise.sortOrder ?? exerciseIndex + 1),
      name: exercise.name,
      thumbnailIcon: exercise.thumbnailIcon,
      weightHeader: getWeightHeader(exercise.name),
      restLabel: exercise.restLabel,
      supersetCount: 1,
      sets: getExerciseSets(exercise),
    })),
  }
}
