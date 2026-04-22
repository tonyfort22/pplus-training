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
    surface: getTrainHomeSurface({ todayModel, calendarModel, workoutModel }),
  }
}

function getTrainHomeSurface({ todayModel, calendarModel, workoutModel }) {
  const cards = getTodayCardsModel(todayModel)

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
    selectedWorkoutCard: createActionCardModel(getSelectedWorkoutCardModel(workoutModel)),
    programSectionTitle: 'My Programs',
    programCard: createActionCardModel({
      ...cards.programCard,
      title: undefined,
      targetKey: 'program',
    }),
    workoutListTitle: 'My Workouts',
    workoutListRows: calendarModel.days
      .filter((day) => day.status !== 'off')
      .map((day) => ({
        id: day.id,
        title: getWorkoutNameFromCalendarTitle(day.title),
        body: `${getDayLabelFromCalendarTitle(day.title)} • ${getDateLabelFromCalendarBody(day.body)} · ${getStatusLabelFromCalendarBody(day.body)}`,
        targetKey: 'workout',
        actionPayload: { selectedDayId: day.id },
      })),
  }
}

function getSelectedWorkoutCardModel(workoutModel) {
  const totalSets = workoutModel.exercises.reduce((sum, exercise) => sum + exercise.setCount, 0)
  const targetKey = 'workout'
  const actionLabel = 'Open workout'

  return {
    title: undefined,
    body: `${workoutModel.scheduleStatusLabel}. ${workoutModel.workoutName}.`,
    actionLabel,
    actionPayload: workoutModel.actionPayload,
    targetKey,
    variant: 'today-summary',
    workoutName: workoutModel.workoutName,
    scheduledLabel: getSelectedWorkoutScheduledLabel(workoutModel.scheduleStatusLabel),
    summaryLabel: getSelectedWorkoutScheduledLabel(workoutModel.scheduleStatusLabel),
    statusLabel: undefined,
    quickSummary: workoutModel.sessionProgressSummary || workoutModel.previewHighlights?.[0]?.body || workoutModel.body,
    completionTone: workoutModel.scheduleStatusLabel === 'Completed' ? 'done' : 'pending',
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
