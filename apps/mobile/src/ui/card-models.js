export function createActionCardModel({ title, body, actionLabel, targetKey, actionPayload = null }) {
  return {
    title,
    body,
    actionLabel,
    targetKey,
    actionPayload,
  }
}

export function createMetricCardModel({ label, value, detail }) {
  return {
    label,
    value,
    detail,
  }
}
