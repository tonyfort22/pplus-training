export function getAppScreenViewModel({ screen }) {
  if (screen.type === 'train') {
    return {
      type: 'train-surface',
      tabs: screen.tabs,
      content: screen.content,
    }
  }

  if (screen.type === 'analytics') {
    return {
      ...screen,
      type: 'analytics-surface',
    }
  }

  if (screen.type === 'auth') {
    return {
      ...screen,
      type: 'auth-surface',
    }
  }

  if (screen.type === 'loading') {
    return {
      ...screen,
      type: 'loading-surface',
    }
  }

  return {
    type: 'generic-surface',
    screenType: screen.type,
    sections: screen.sections,
  }
}

export function getBottomTabViewItems(tabs) {
  const iconByKey = {
    train: '🏋️',
    progress: '📊',
    team: '👥',
    inbox: '🪪',
  }

  return {
    tabs: tabs.map((tab) => ({
      key: tab.key,
      label: tab.label,
      icon: iconByKey[tab.key] || tab.label,
      isActive: tab.isActive,
    })),
  }
}
