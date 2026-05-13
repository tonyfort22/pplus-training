import { getRestTimerModel, getSessionExerciseModels, getSessionHeaderModel } from './session-models.js'

export function getActiveSessionSurfaceModel(session, elapsedSeconds, selectedSet) {
  const baseExerciseModels = getSessionExerciseModels(session)

  return {
    header: getSessionHeaderModel(session, elapsedSeconds),
    restTimer: getRestTimerModel(session, selectedSet)
      ? {
          ...getRestTimerModel(session, selectedSet),
          dismissLabel: 'Dismiss',
        }
      : null,
    sectionTitle: 'Active workout session',
    exercises: baseExerciseModels.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => ({
        ...set,
        loadControl: {
          label: 'Load',
          decrementLabel: '-',
          incrementLabel: '+',
          value: set.actualLoadValue,
        },
        repsControl: {
          label: 'Reps',
          decrementLabel: '-',
          incrementLabel: '+',
          value: set.actualRepsValue,
        },
      })),
    })),
  }
}
