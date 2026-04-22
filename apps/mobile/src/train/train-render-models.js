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
      content: {
        type: 'sections',
        sections: [
          {
            type: 'calendar-strip',
            title: trainSurfaceModel.surface.calendarStripTitle,
            days: trainSurfaceModel.surface.calendarStripDays,
          },
          {
            type: 'action-card',
            ...trainSurfaceModel.surface.selectedWorkoutCard,
          },
          {
            type: 'action-card',
            ...trainSurfaceModel.surface.programCard,
          },
          {
            type: 'body-list',
            title: trainSurfaceModel.surface.workoutListTitle,
            rows: trainSurfaceModel.surface.workoutListRows,
          },
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
