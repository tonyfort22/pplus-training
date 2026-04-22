export function getTrainRenderModel({ trainSurfaceModel, sessionSections }) {
  if (trainSurfaceModel.surface.type === 'completed-session' || trainSurfaceModel.surface.type === 'discarded-session') {
    return {
      tabs: trainSurfaceModel.tabs,
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
      content: {
        type: 'session-sections',
        sections: sessionSections,
      },
    }
  }

  if (trainSurfaceModel.surface.type === 'today') {
    return {
      tabs: trainSurfaceModel.tabs,
      content: {
        type: 'sections',
        sections: trainSurfaceModel.surface.cards.map((card) => ({
          type: 'action-card',
          ...card,
        })),
      },
    }
  }

  if (trainSurfaceModel.surface.type === 'program') {
    return {
      tabs: trainSurfaceModel.tabs,
      content: {
        type: 'sections',
        sections: [
          {
            type: 'action-card',
            ...trainSurfaceModel.surface.card,
          },
        ],
      },
    }
  }

  if (trainSurfaceModel.surface.type === 'calendar') {
    return {
      tabs: trainSurfaceModel.tabs,
      content: {
        type: 'sections',
        sections: [
          {
            type: 'action-card',
            ...trainSurfaceModel.surface.detailCard,
          },
          {
            type: 'calendar-strip',
            title: trainSurfaceModel.surface.calendarStripTitle,
            days: trainSurfaceModel.surface.calendarStripDays,
          },
          {
            type: 'body-list',
            title: trainSurfaceModel.surface.selectedDayPlanTitle,
            rows: trainSurfaceModel.surface.selectedDayPlanRows,
          },
        ],
      },
    }
  }

  return {
    tabs: trainSurfaceModel.tabs,
    content: {
      type: 'sections',
      sections: [
        {
          type: 'action-card',
          ...trainSurfaceModel.surface.detailCard,
        },
        {
          type: 'body-list',
          title: trainSurfaceModel.surface.previewSectionTitle,
          rows: trainSurfaceModel.surface.previewHighlights,
        },
        {
          type: 'body-list',
          title: trainSurfaceModel.surface.exerciseSectionTitle,
          rows: trainSurfaceModel.surface.exercises.map((exercise) => ({
            id: exercise.id,
            title: exercise.name,
            body: `${exercise.setCount} sets, default rest ${exercise.restLabel}`,
          })),
        },
      ],
    },
  }
}
