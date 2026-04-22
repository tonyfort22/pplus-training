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
    calendarStripTitle: 'This week',
    calendarStripDays: calendarModel.days.map((day) => ({
      id: day.id,
      weekdayLabel: day.weekdayLabel,
      dateNumber: day.dateNumber,
      indicatorTone: day.indicatorTone,
      isSelected: day.isSelected,
      targetKey: day.targetKey,
      actionPayload: day.actionPayload,
    })),
    selectedWorkoutCard: createActionCardModel(getSelectedWorkoutCardModel(workoutModel)),
    programCard: createActionCardModel({
      ...cards.programCard,
      targetKey: 'program',
    }),
    workoutListTitle: 'Program workouts',
    workoutListRows: calendarModel.days
      .filter((day) => day.status !== 'off')
      .map((day) => ({
        id: day.id,
        title: getWorkoutNameFromCalendarTitle(day.title),
        body: `${getDayLabelFromCalendarTitle(day.title)} • ${getDateLabelFromCalendarBody(day.body)} · ${getStatusLabelFromCalendarBody(day.body)}`,
      })),
  }
}

function getSelectedWorkoutCardModel(workoutModel) {
  const totalSets = workoutModel.exercises.reduce((sum, exercise) => sum + exercise.setCount, 0)
  const targetKey = workoutModel.primaryTargetKey === 'calendar' ? 'workout' : workoutModel.primaryTargetKey
  const actionLabel = workoutModel.primaryTargetKey === 'calendar' ? 'Open workout' : workoutModel.primaryActionLabel

  return {
    title: workoutModel.dayLabel,
    body: `${workoutModel.scheduleStatusLabel}. ${workoutModel.workoutName}.`,
    actionLabel,
    actionPayload: workoutModel.actionPayload,
    targetKey,
    variant: 'today-summary',
    workoutName: workoutModel.workoutName,
    scheduledLabel: workoutModel.scheduleStatusLabel,
    summaryLabel: `${workoutModel.exerciseCount} exercises, ${totalSets} total sets`,
    statusLabel: targetKey === 'session' ? 'Ready to log' : workoutModel.scheduleStatusLabel,
    quickSummary: workoutModel.sessionProgressSummary || workoutModel.previewHighlights?.[0]?.body || workoutModel.body,
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
