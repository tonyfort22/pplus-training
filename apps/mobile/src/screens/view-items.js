export function getGenericSectionViewItems(sections) {
  return sections.map((section, index) => ({
    ...section,
    key: getGenericSectionKey(section, index),
  }))
}

export function getSessionViewItems(sections) {
  return sections.map((section, index) => {
    if (section.type !== 'session-exercise-card') {
      return {
        ...section,
        key: getSessionSectionKey(section, index),
      }
    }

    return {
      ...section,
      key: getSessionSectionKey(section, index),
      exercises: section.exercises.map((exercise) => ({
        ...exercise,
        key: `exercise-${exercise.id}`,
        sets: exercise.sets.map((set) => ({
          ...set,
          key: `set-${set.id}`,
        })),
      })),
    }
  })
}

function getGenericSectionKey(section, index) {
  if (section.type === 'metrics-grid') {
    return 'metrics-grid'
  }

  return section.title || `${section.type}-${index}`
}

function getSessionSectionKey(section, index) {
  if (section.type === 'rest-timer-card') {
    return 'rest-timer'
  }

  if (section.type === 'session-header-card') {
    return `session-header-${section.title}`
  }

  return section.title || `${section.type}-${index}`
}
