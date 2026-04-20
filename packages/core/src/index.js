export function canStartSession(status) {
  return status === 'draft';
}

export function canCompleteSession(status) {
  return status === 'in_progress' || status === 'paused';
}
