export function getAppScreenViewModel({ screen }) {
  if (screen.type === 'train') {
    return {
      type: 'train-surface',
      tabs: screen.tabs,
      content: screen.content,
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
    inbox: '💬',
  }

  const primaryTabs = tabs
    .filter((tab) => tab.key !== 'inbox')
    .map((tab) => ({
      key: tab.key,
      label: tab.label,
      icon: iconByKey[tab.key] || tab.label,
      isActive: tab.isActive,
    }))

  const inboxTab = tabs.find((tab) => tab.key === 'inbox')

  return {
    primaryTabs,
    utilityTab: inboxTab
      ? {
          key: inboxTab.key,
          label: inboxTab.label,
          icon: iconByKey[inboxTab.key] || inboxTab.label,
          isActive: inboxTab.isActive,
        }
      : null,
  }
}
