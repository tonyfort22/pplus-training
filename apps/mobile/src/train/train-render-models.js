function createEmptyCardSection(emptyState) {
  return {
    type: 'empty-state-card',
    variant: 'empty-card',
    title: emptyState.title,
    body: emptyState.body,
  }
}

export function getTrainRenderModel({ trainSurfaceModel, sessionSections }) {
  if (trainSurfaceModel.surface.type === 'completed-session' || trainSurfaceModel.surface.type === 'discarded-session') {
    return {
      tabs: trainSurfaceModel.tabs,
      showTabs: true,
      content: {
        type: 'sections',
        sections: [
          {
            type: 'header-card',
            ...trainSurfaceModel.surface.summary.header,
          },
          {
            type: 'metrics-grid',
            items: trainSurfaceModel.surface.summary.metrics,
          },
          ...(trainSurfaceModel.surface.summary.highlights
            ? [
                {
                  type: 'body-list',
                  title: trainSurfaceModel.surface.summary.highlights.title,
                  rows: trainSurfaceModel.surface.summary.highlights.rows,
                },
              ]
            : []),
          ...(trainSurfaceModel.surface.summary.exerciseResults
            ? [
                {
                  type: 'body-list',
                  title: trainSurfaceModel.surface.summary.exerciseResults.title,
                  rows: trainSurfaceModel.surface.summary.exerciseResults.rows,
                },
              ]
            : []),
          {
            type: 'action-card',
            ...trainSurfaceModel.surface.summary.nextAction,
          },
        ],
      },
    }
  }

  if (trainSurfaceModel.surface.type === 'session') {
    return {
      tabs: trainSurfaceModel.tabs,
      showTabs: true,
      content: {
        type: 'session-sections',
        sections: sessionSections,
      },
    }
  }

  if (trainSurfaceModel.surface.type === 'train-home') {
    return {
      tabs: trainSurfaceModel.tabs,
      showTabs: false,
      floatingStartWorkoutButton: trainSurfaceModel.surface.floatingStartWorkoutButton ?? null,
      content: {
        type: 'sections',
        sections: [
          {
            type: 'calendar-strip',
            title: trainSurfaceModel.surface.calendarStripTitle,
            days: trainSurfaceModel.surface.calendarStripDays,
          },
          {
            type: 'section-heading',
            title: trainSurfaceModel.surface.selectedWorkoutHeading,
          },
          trainSurfaceModel.surface.selectedWorkoutCard
            ? {
                type: 'action-card',
                ...trainSurfaceModel.surface.selectedWorkoutCard,
              }
            : createEmptyCardSection(trainSurfaceModel.surface.selectedWorkoutEmptyState),
          {
            type: 'section-heading',
            title: trainSurfaceModel.surface.programSectionTitle,
          },
          trainSurfaceModel.surface.programCard
            ? {
                type: 'action-card',
                ...trainSurfaceModel.surface.programCard,
              }
            : createEmptyCardSection(trainSurfaceModel.surface.programEmptyState),
          {
            type: 'section-heading',
            title: trainSurfaceModel.surface.workoutListTitle,
          },
          ...(trainSurfaceModel.surface.workoutListRows.length > 0
            ? [{
                type: 'body-list',
                title: undefined,
                rows: trainSurfaceModel.surface.workoutListRows,
              }]
            : [createEmptyCardSection(trainSurfaceModel.surface.workoutEmptyState)]),
          ...(trainSurfaceModel.surface.createWorkoutCard
            ? [{
                type: 'create-workout-card',
                title: trainSurfaceModel.surface.createWorkoutCard.title,
                subtitle: trainSurfaceModel.surface.createWorkoutCard.subtitle,
                targetKey: 'create-workout',
              }]
            : []),
        ],
      },
    }
  }

  return {
    tabs: trainSurfaceModel.tabs,
    content: {
      type: 'sections',
      sections: [],
    },
  }
}
