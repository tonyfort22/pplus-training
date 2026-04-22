export function getProgramSurfaceModel(todayModel) {
  return {
    title: 'Program overview',
    body: `${todayModel.programName} is currently in ${todayModel.programWeekLabel}. ${todayModel.completionLabel}. This area should hold the weekly structure, training calendar, and scheduled workout progression.`,
    actionLabel: 'See today’s workout',
  }
}

export function getTodayCardsModel(todayModel) {
  return {
    todayCard: {
      title: todayModel.heroTitle,
      body: `You have ${todayModel.workoutName} ${todayModel.scheduledLabel.toLowerCase()}. ${todayModel.quickSummary}`,
      actionLabel: todayModel.primaryActionLabel,
    },
    programCard: {
      title: 'Program snapshot',
      body: `${todayModel.programName}, ${todayModel.programWeekLabel}. ${todayModel.completionLabel}.`,
      actionLabel: 'View program',
    },
  }
}

export function getWorkoutDetailCardModel(workoutModel) {
  return {
    title: 'Workout detail',
    body: `${workoutModel.workoutName} contains ${workoutModel.exerciseCount} exercises in this scaffold, with prescribed sets, loads, reps, and planned rest. This is the preview before starting or continuing the session.`,
    actionLabel: 'Go to session',
  }
}
