export function createActionCardModel({ title, body, actionLabel, targetKey }) {
  return {
    title,
    body,
    actionLabel,
    targetKey,
  }
}

export function createMetricCardModel({ label, value, detail }) {
  return {
    label,
    value,
    detail,
  }
}
