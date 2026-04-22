export function getSessionSections(activeSessionModel) {
  const sections = [
    {
      type: 'session-header',
      eyebrow: activeSessionModel.header.eyebrow,
      title: activeSessionModel.header.title,
      finishLabel: activeSessionModel.header.finishLabel,
      discardLabel: activeSessionModel.header.discardLabel,
      workoutTimerLabel: activeSessionModel.header.workoutTimerLabel,
      nextUpLabel: activeSessionModel.header.nextUpLabel,
      progressLabel: activeSessionModel.header.progressLabel,
      progressPercent: activeSessionModel.header.progressPercent,
    },
  ]

  if (activeSessionModel.restTimer) {
    sections.push({
      type: 'rest-timer',
      eyebrow: activeSessionModel.restTimer.eyebrow,
      title: activeSessionModel.restTimer.title,
      body: activeSessionModel.restTimer.body,
      dismissLabel: activeSessionModel.restTimer.dismissLabel,
      clockLabel: activeSessionModel.restTimer.clockLabel,
      minusLabel: activeSessionModel.restTimer.minusLabel,
      plusLabel: activeSessionModel.restTimer.plusLabel,
    })
  }

  sections.push({
    type: 'session-exercise-list',
    title: activeSessionModel.sectionTitle,
    exercises: activeSessionModel.exercises.map((exercise) => ({
      id: exercise.id,
      title: exercise.title,
      restLabel: exercise.restLabel,
      status: exercise.status,
      sets: exercise.sets.map((set) => ({
        id: set.id,
        title: set.title,
        prescribedLabel: set.prescribedLabel,
        actualLabel: set.actualLabel,
        isCompleted: set.isCompleted,
        isCurrent: set.completionLabel === 'Ready now',
        completionLabel: set.completionLabel,
        loadControl: { ...set.loadControl },
        repsControl: { ...set.repsControl },
      })),
    })),
  })

  return sections
}
