import { getProgramSurfaceModel, getTodayCardsModel, getWorkoutDetailCardModel } from './surface-models.js'
import { getTabButtonModels } from '../ui/tab-models.js'

export function getTrainSurfaceModel({ trainTabs, activeTrainTab, todayModel, workoutModel, activeSessionModel }) {
  const tabs = getTabButtonModels({ tabs: trainTabs, activeKey: activeTrainTab })

  if (activeTrainTab === 'today') {
    const cards = getTodayCardsModel(todayModel)

    return {
      tabs,
      surface: {
        type: 'today',
        cards: [
          { ...cards.todayCard, targetTab: 'workout' },
          { ...cards.programCard, targetTab: 'program' },
        ],
      },
    }
  }

  if (activeTrainTab === 'program') {
    return {
      tabs,
      surface: {
        type: 'program',
        card: {
          ...getProgramSurfaceModel(todayModel),
          targetTab: 'workout',
        },
      },
    }
  }

  if (activeTrainTab === 'workout') {
    return {
      tabs,
      surface: {
        type: 'workout',
        detailCard: {
          ...getWorkoutDetailCardModel(workoutModel),
          targetTab: 'session',
        },
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

  return {
    tabs,
    surface: {
      type: 'session',
      session: activeSessionModel,
    },
  }
}
