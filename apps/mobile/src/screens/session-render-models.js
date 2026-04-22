export function getSessionRenderModel({ sessionRenderPlan, sessionStatus }) {
  return sessionRenderPlan.map((section) => {
    if (section.type === 'session-header') {
      return {
        ...section,
        type: 'session-header-card',
        isCompleted: sessionStatus === 'completed',
        isDiscarded: sessionStatus === 'discarded',
      }
    }

    if (section.type === 'rest-timer') {
      return {
        ...section,
        type: 'rest-timer-card',
      }
    }

    return {
      type: 'session-exercise-card',
      title: section.title,
      exercises: section.exercises.map((exercise) => ({
        ...exercise,
        sets: exercise.sets.map((set) => ({
          ...set,
          completionTone: set.isCompleted ? 'done' : 'todo',
        })),
      })),
    }
  })
}
