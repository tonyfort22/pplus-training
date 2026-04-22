export function createActionCardModel({ title, body, actionLabel, targetKey, actionPayload = null, ...rest }) {
  return {
    title,
    body,
    actionLabel,
    targetKey,
    actionPayload,
    ...rest,
  }
}

export function createMetricCardModel({ label, value, detail }) {
  return {
    label,
    value,
    detail,
  }
}
