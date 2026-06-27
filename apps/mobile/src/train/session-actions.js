import { findSessionSet } from '../../../../packages/core/src/index.js'

export function resolveQuickActualCurrentValue({ currentSet, field }) {
  return Number(currentSet[field] ?? currentSet[`prescribed${field.slice(6)}`] ?? 0)
}

export function clampQuickActualValue(value) {
  return Math.max(0, value)
}

export function getQuickActualUpdatePayload({ session, exerciseId, setId, field, delta }) {
  const currentSet = findSessionSet(session, exerciseId, setId)
  if (!currentSet) return null

  const currentValue = resolveQuickActualCurrentValue({ currentSet, field })
  const nextValue = clampQuickActualValue(currentValue + delta)

  return {
    [field]: nextValue,
  }
}
