export function getPreviewStateButtonModels({ states, activeKey }) {
  return states.map((state) => ({
    ...state,
    isActive: state.key === activeKey,
  }))
}
