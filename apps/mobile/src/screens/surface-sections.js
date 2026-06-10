import { createMetricCardModel } from '../ui/card-models.js'

export function getGroupsSections(groups = []) {
  const rows = groups.map((group) => ({
    id: group.id,
    title: group.name || group.title || 'Untitled group',
    body: group.athleteCountLabel || `${group.athleteCount || 0} ${(group.athleteCount || 0) === 1 ? 'athlete' : 'athletes'}`,
    targetKey: 'group',
    actionPayload: { groupId: group.id },
  }))

  return [
    {
      type: 'section-heading',
      title: 'Groups',
    },
    ...(rows.length
      ? [{
          type: 'body-list',
          rows,
        }]
      : [{
          type: 'empty-state-card',
          title: 'No groups yet',
          body: 'Create a group to organize athletes.',
        }]),
    {
      type: 'create-workout-card',
      title: 'Create a group',
      subtitle: 'A regroupment of athletes',
      targetKey: 'create-group',
      actionPayload: null,
    },
  ]
}

export function getProgressSections(progressModel) {
  return [
    {
      type: 'header',
      eyebrow: progressModel.header.eyebrow,
      title: progressModel.header.title,
      body: progressModel.header.body,
    },
    {
      type: 'metrics-grid',
      items: progressModel.metrics.map((metric) => createMetricCardModel(metric)),
    },
    {
      type: 'body-with-rows',
      title: progressModel.readinessInterpretation.title,
      body: progressModel.readinessInterpretation.body,
      rows: progressModel.readinessInterpretation.rows.map((row) => ({
        title: row.title,
        body: row.body,
      })),
    },
    {
      type: 'body',
      title: progressModel.trainingLoad.title,
      body: progressModel.trainingLoad.body,
    },
    {
      type: 'body-with-rows',
      title: progressModel.muscleFatigue.title,
      body: progressModel.muscleFatigue.body,
      rows: progressModel.muscleFatigue.rows.map((row) => ({
        title: row.title,
        body: row.body,
      })),
    },
    {
      type: 'body',
      title: progressModel.performanceSnapshots.title,
      body: progressModel.performanceSnapshots.body,
    },
    {
      type: 'body-with-rows',
      title: progressModel.recentMomentum.title,
      rows: progressModel.recentMomentum.rows.map((row) => ({
        title: row.title,
        body: row.body,
      })),
    },
    {
      type: 'body-with-rows',
      title: progressModel.exerciseBreakdown.title,
      rows: progressModel.exerciseBreakdown.rows.map((row) => ({
        title: row.title,
        body: row.body,
      })),
    },
  ]
}

export function getPlaceholderSections(placeholderModel) {
  if (placeholderModel.actionLabel && placeholderModel.targetKey) {
    return [
      {
        type: 'action-card',
        title: placeholderModel.title,
        body: placeholderModel.body,
        actionLabel: placeholderModel.actionLabel,
        targetKey: placeholderModel.targetKey,
        actionPayload: placeholderModel.actionPayload || null,
      },
    ]
  }

  return [
    {
      type: 'body',
      title: placeholderModel.title,
      body: placeholderModel.body,
    },
  ]
}
