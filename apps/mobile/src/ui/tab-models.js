export function getTabButtonModels({ tabs, activeKey }) {
  return (tabs || []).map((tab) => ({
    ...tab,
    isActive: tab.key === activeKey,
  }))
}
