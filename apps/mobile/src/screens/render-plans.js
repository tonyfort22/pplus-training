export function getGenericSectionRenderPlan(sections) {
  return sections.map((section) => {
    if (section.type === 'header') {
      return {
        type: 'header-card',
        eyebrow: section.eyebrow,
        title: section.title,
        body: section.body,
      }
    }

    if (section.type === 'metrics-grid') {
      return {
        type: 'metrics-grid',
        items: section.items,
      }
    }

    if (section.type === 'section-heading') {
      return {
        type: 'section-heading',
        title: section.title,
      }
    }

    if (section.type === 'body-list') {
      return {
        type: 'body-list',
        title: section.title,
        rows: section.rows,
      }
    }

    if (section.type === 'action-card') {
      return {
        type: 'action-card',
        title: section.title,
        body: section.body,
        actionLabel: section.actionLabel,
        targetKey: section.targetKey,
      }
    }

    if (section.type === 'empty-state-card') {
      return {
        type: 'empty-state-card',
        title: section.title,
        body: section.body,
      }
    }

    if (section.type === 'create-workout-card') {
      return {
        type: 'create-workout-card',
        title: section.title,
        subtitle: section.subtitle,
        targetKey: section.targetKey,
      }
    }

    return {
      type: 'body-card',
      title: section.title,
      body: section.body,
      rows: section.rows || null,
    }
  })
}

export function getSessionSectionRenderPlan(sections) {
  return sections.map((section) => ({ ...section }))
}
