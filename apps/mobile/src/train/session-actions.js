import { findSessionSet } from '../../../../packages/core/src/index.js'

export function getQuickActualUpdatePayload({ session, exerciseId, setId, field, delta }) {
  const currentSet = findSessionSet(session, exerciseId, setId)
  if (!currentSet) return null

  const currentValue = Number(currentSet[field] ?? currentSet[`prescribed${field.slice(6)}`] ?? 0)
  const nextValue = Math.max(0, currentValue + delta)

  return {
    [field]: nextValue,
  }
}
