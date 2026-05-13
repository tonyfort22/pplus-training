import { getTodayCardsModel } from './surface-models.js'
import { createActionCardModel } from '../ui/card-models.js'
import { getTabButtonModels } from '../ui/tab-models.js'

export function getTrainSurfaceModel({
  trainTabs,
  activeTrainTab,
  todayModel,
  calendarModel,
  workoutModel,
  activeSessionModel,
  completedSessionModel = null,
  discardedSessionModel = null,
  persistedWorkoutListRows = [],
  canCreateWorkout = true,
}) {
  const tabs = getTabButtonModels({ tabs: trainTabs, activeKey: activeTrainTab })

  if (activeTrainTab === 'session' && completedSessionModel) {
    return {
      tabs,
      surface: {
        type: 'completed-session',
        summary: completedSessionModel,
      },
    }
  }

  if (activeTrainTab === 'session' && discardedSessionModel) {
    return {
      tabs,
      surface: {
        type: 'discarded-session',
        summary: discardedSessionModel,
      },
    }
  }

  if (activeTrainTab === 'session') {
    return {
      tabs,
      surface: {
        type: 'session',
        session: activeSessionModel,
      },
    }
  }

  return {
    tabs,
    surface: getTrainHomeSurface({ todayModel, calendarModel, workoutModel, persistedWorkoutListRows, canCreateWorkout }),
  }
}

function getTrainHomeSurface({ todayModel, calendarModel, workoutModel, persistedWorkoutListRows = [], canCreateWorkout = true }) {
  const cards = getTodayCardsModel(todayModel)
  const persistedRowByWorkoutId = new Map(
    persistedWorkoutListRows
      .filter((row) => row.actionPayload?.programWorkoutId)
      .map((row) => [row.actionPayload.programWorkoutId, row])
  )
  const calendarWorkoutRows = calendarModel.days.flatMap((day) => {
    if (day.status === 'off') return []

    const primaryWorkout = Array.isArray(day.workouts) ? day.workouts[0] : null
    const primaryRowOverride = primaryWorkout?.id ? persistedRowByWorkoutId.get(primaryWorkout.id) || null : null
    const primaryRow = {
      id: day.id,
      title: primaryRowOverride?.title || getWorkoutNameFromCalendarTitle(day.title),
      body: `${getDayLabelFromCalendarTitle(day.title)} • ${getDateLabelFromCalendarBody(day.body)} · ${getStatusLabelFromCalendarBody(day.body)}`,
      targetKey: 'workout',
      actionPayload: { selectedDayId: day.id, programWorkoutId: primaryWorkout?.id || null },
    }

    const extraRows = Array.isArray(day.workouts)
      ? day.workouts.slice(1).map((workout) => {
          const rowOverride = workout?.id ? persistedRowByWorkoutId.get(workout.id) || null : null
          return {
          id: `${day.id}-${workout.id}`,
          title: rowOverride?.title || workout.nameSnapshot || 'Untitled workout',
          body: `${getDayLabelFromCalendarTitle(day.title)} • ${getDateLabelFromCalendarBody(day.body)} · ${formatWorkoutListStatus(workout.status)}`,
          targetKey: 'workout',
          actionPayload: { selectedDayId: day.id, programWorkoutId: workout.id || null },
        }})
      : []

    return [primaryRow, ...extraRows]
  })
  const seenProgramWorkoutIds = new Set(calendarWorkoutRows.map((row) => row.actionPayload?.programWorkoutId).filter(Boolean))
  const persistedRows = persistedWorkoutListRows.filter((row) => !row.actionPayload?.programWorkoutId || !seenProgramWorkoutIds.has(row.actionPayload.programWorkoutId))
  const workoutListRows = [...calendarWorkoutRows, ...persistedRows]

  const hasAssignedProgram = Boolean(todayModel.programName) && todayModel.programName !== 'No program assigned'

  return {
    type: 'train-home',
    calendarStripTitle: undefined,
    calendarStripDays: calendarModel.days.map((day) => ({
      id: day.id,
      weekdayLabel: day.weekdayLabel,
      dateNumber: day.dateNumber,
      indicatorTone: day.indicatorTone,
      isSelected: day.isSelected,
      targetKey: day.targetKey,
      actionPayload: day.actionPayload,
    })),
    selectedWorkoutHeading: workoutModel.dayLabel,
    selectedWorkoutCard: workoutModel.hasWorkoutData
      ? createActionCardModel(getSelectedWorkoutCardModel(workoutModel))
      : null,
    selectedWorkoutEmptyState: workoutModel.hasWorkoutData
      ? null
      : {
          title: workoutModel.emptyStateTitle,
          body: undefined,
        },
    programSectionTitle: 'My Programs',
    programCard: hasAssignedProgram
      ? createActionCardModel({
          ...cards.programCard,
          title: undefined,
          targetKey: 'program',
        })
      : null,
    programEmptyState: hasAssignedProgram
      ? null
      : {
          title: 'No program available',
          body: undefined,
        },
    workoutListTitle: 'My Workouts',
    workoutEmptyState: {
      title: 'No workout available',
      body: undefined,
    },
    createWorkoutCard: canCreateWorkout
      ? {
          title: 'Create workout',
          subtitle: 'Repeatable workout template',
        }
      : null,
    floatingStartWorkoutButton: workoutModel.hasWorkoutData
      ? {
          kind: 'start-workout',
          label: 'Start Workout',
          targetKey: 'start-workout',
          actionPayload: undefined,
        }
      : null,
    workoutListRows,
  }
}

function getSelectedWorkoutCardModel(workoutModel) {
  const totalSets = workoutModel.exercises.reduce((sum, exercise) => sum + exercise.setCount, 0)
  void totalSets
  const sessionSummary = String(workoutModel.sessionProgressSummary || '')
  const isCompleted = /workout completed|view completed session|summary/i.test(sessionSummary)
  const isDiscarded = /workout discarded|discarded/i.test(sessionSummary)
  const isInProgress = !isCompleted && !isDiscarded && /logged|workout in progress/i.test(sessionSummary)
  const scheduledLabel = getSelectedWorkoutScheduledLabel(workoutModel.scheduleStatusLabel)
  const targetKey = (isCompleted || isDiscarded) ? 'session' : (workoutModel.primaryTargetKey || 'workout')
  const actionLabel = isCompleted
    ? 'View completed session'
    : isDiscarded
      ? 'View discarded session'
      : (workoutModel.primaryActionLabel || 'Open workout')

  return {
    title: undefined,
    body: `${workoutModel.scheduleStatusLabel}. ${workoutModel.workoutName}.`,
    actionLabel,
    actionPayload: workoutModel.actionPayload,
    targetKey,
    variant: 'today-summary',
    workoutName: workoutModel.workoutName,
    scheduledLabel,
    summaryLabel: (isCompleted || isDiscarded) ? (workoutModel.sessionProgressSummary || scheduledLabel) : scheduledLabel,
    statusLabel: isInProgress ? 'In progress' : (isCompleted ? 'Completed' : (isDiscarded ? 'Discarded' : undefined)),
    quickSummary: (isCompleted || isDiscarded)
      ? (workoutModel.sessionProgressSummary || workoutModel.previewHighlights?.[0]?.body || workoutModel.body)
      : (workoutModel.previewHighlights?.[0]?.body || workoutModel.body),
    completionTone: isCompleted ? 'done' : (isInProgress ? 'active' : 'pending'),
  }
}

function getWorkoutNameFromCalendarTitle(title) {
  return title.split(' • ').at(-1)
}

function getDayLabelFromCalendarTitle(title) {
  return title.split(' • ')[0]
}

function getDateLabelFromCalendarBody(body) {
  return body.split(' · ')[0]
}

function getStatusLabelFromCalendarBody(body) {
  return body.split(' · ').at(-1)
}

function getSelectedWorkoutScheduledLabel(scheduleStatusLabel) {
  if (scheduleStatusLabel === 'Today') {
    return 'Scheduled for today'
  }

  return scheduleStatusLabel
}

function formatWorkoutListStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()
  if (normalized === 'scheduled') return 'Scheduled'
  if (normalized === 'completed') return 'Completed'
  if (normalized === 'missed') return 'Missed'
  if (normalized === 'skipped') return 'Skipped'
  if (normalized === 'today') return 'Today'
  if (!normalized) return 'Scheduled'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}
