import { formatWorkoutTimer, getSessionProgress } from '../../../../packages/core/src/index.js'
import { createActionCardModel, createMetricCardModel } from '../ui/card-models.js'

export function getDiscardedSessionSurfaceModel(session) {
  const progress = getSessionProgress(session)

  return {
    header: {
      eyebrow: 'Train / Session',
      title: 'Session discarded',
      body: `${session.nameSnapshot || session.name || 'Workout'} was abandoned before completion and should not feed analytics.`,
    },
    metrics: [
      createMetricCardModel({
        label: 'Time invested',
        value: formatWorkoutTimer(session.elapsedSeconds || 0),
        detail: 'Logged time before the session was abandoned',
      }),
      createMetricCardModel({
        label: 'Sets logged',
        value: `${progress.completedSets}/${progress.totalSets}`,
        detail: 'Completed sets before the discard action',
      }),
      createMetricCardModel({
        label: 'Result',
        value: 'Not saved',
        detail: 'Discarded sessions should not count toward adherence or progress',
      }),
    ],
    nextAction: createActionCardModel({
      title: 'Start clean next time',
      body: 'Go back to Today and restart the session when the athlete is ready.',
      actionLabel: 'Back to today',
      targetKey: 'today',
    }),
  }
}
