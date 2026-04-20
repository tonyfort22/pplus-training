export function canStartSession(status) {
  return status === 'draft';
}

export function canCompleteSession(status) {
  return status === 'in_progress' || status === 'paused';
}

export function formatWorkoutTimer(totalSeconds) {
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  return `${hh}:${mm}:${ss}`;
}

export function completeSessionSet(sessionSet) {
  const nextSet = { ...sessionSet };

  if (nextSet.actualReps == null) nextSet.actualReps = nextSet.prescribedReps ?? null;
  if (nextSet.actualLoad == null) nextSet.actualLoad = nextSet.prescribedLoad ?? null;
  if (nextSet.actualDurationSeconds == null) nextSet.actualDurationSeconds = nextSet.prescribedDurationSeconds ?? null;
  if (nextSet.actualDistance == null) nextSet.actualDistance = nextSet.prescribedDistance ?? null;
  if (nextSet.actualRpe == null) nextSet.actualRpe = nextSet.prescribedRpe ?? null;
  if (nextSet.actualRir == null) nextSet.actualRir = nextSet.prescribedRir ?? null;
  if (nextSet.actualRestSeconds == null) nextSet.actualRestSeconds = nextSet.prescribedRestSeconds ?? null;

  nextSet.isCompleted = true;
  nextSet.completedAt = nextSet.completedAt || new Date().toISOString();

  return nextSet;
}
