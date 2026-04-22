import { getProgramSurfaceModel, getTodayCardsModel, getWorkoutDetailCardModel } from './surface-models.js'
import { createActionCardModel } from '../ui/card-models.js'
import { getTabButtonModels } from '../ui/tab-models.js'

export function getTrainSurfaceModel({
  trainTabs,
  activeTrainTab,
  todayModel,
  workoutModel,
  activeSessionModel,
  completedSessionModel = null,
  discardedSessionModel = null,
}) {
  const tabs = getTabButtonModels({ tabs: trainTabs, activeKey: activeTrainTab })

  if (activeTrainTab === 'today') {
    const cards = getTodayCardsModel(todayModel)

    return {
      tabs,
      surface: {
        type: 'today',
        cards: [
          createActionCardModel({ ...cards.todayCard, targetKey: 'workout' }),
          createActionCardModel({ ...cards.programCard, targetKey: 'program' }),
        ],
      },
    }
  }

  if (activeTrainTab === 'program') {
    return {
      tabs,
      surface: {
        type: 'program',
        card: createActionCardModel({
          ...getProgramSurfaceModel(todayModel),
          targetKey: 'workout',
        }),
      },
    }
  }

  if (activeTrainTab === 'workout') {
    return {
      tabs,
      surface: {
        type: 'workout',
        detailCard: createActionCardModel({
          ...getWorkoutDetailCardModel(workoutModel),
          targetKey: 'session',
        }),
        exerciseSectionTitle: 'Planned exercises',
        exercises: workoutModel.exercises.map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          setCount: exercise.setCount,
          restLabel: exercise.defaultRestLabel,
        })),
      },
    }
  }

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

  return {
    tabs,
    surface: {
      type: 'session',
      session: activeSessionModel,
    },
  }
}
