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
  const progressCopy = workoutModel.sessionProgressSummary ? ` ${workoutModel.sessionProgressSummary}` : ''
  const primaryFocusCopy = workoutModel.previewHighlights?.[0]?.body ? ` Primary focus: ${workoutModel.previewHighlights[0].body}` : ''

  return {
    title: 'Workout detail',
    body: `${workoutModel.dayLabel} · ${workoutModel.scheduleStatusLabel}. ${workoutModel.workoutName} contains ${workoutModel.exerciseCount} exercises in this scaffold, with prescribed sets, loads, reps, and planned rest.${primaryFocusCopy}${progressCopy} This is the preview before starting or continuing the session.`,
    actionLabel: workoutModel.primaryActionLabel || 'Go to session',
    actionPayload: workoutModel.actionPayload || null,
    actionTargetKey: workoutModel.primaryTargetKey || null,
  }
}

export function getCalendarDetailCardModel(calendarModel) {
  return {
    title: calendarModel.title,
    body: calendarModel.body,
    actionLabel: calendarModel.actionLabel,
    actionPayload: calendarModel.actionPayload || null,
    actionTargetKey: calendarModel.actionTargetKey || null,
    rows: calendarModel.days,
  }
}
