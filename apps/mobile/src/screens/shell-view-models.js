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
  return tabs.map((tab) => ({
    key: tab.key,
    label: tab.label,
    isActive: tab.isActive,
  }))
}
