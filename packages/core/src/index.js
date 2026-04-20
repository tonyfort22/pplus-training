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

export function createWorkoutSessionFromTemplate(workoutTemplate) {
  return {
    id: workoutTemplate.id,
    name: workoutTemplate.name,
    status: 'in_progress',
    startedAt: new Date().toISOString(),
    completedAt: null,
    elapsedSeconds: 0,
    notes: '',
    exercises: (workoutTemplate.exercises || []).map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      defaultRestSeconds: exercise.defaultRestSeconds || 0,
      notes: exercise.notes || '',
      status: 'not_started',
      sets: (exercise.sets || []).map((set) => ({
        id: set.id,
        setType: set.setType || 'straight',
        prescribedReps: set.prescribedReps ?? null,
        prescribedLoad: set.prescribedLoad ?? null,
        prescribedDurationSeconds: set.prescribedDurationSeconds ?? null,
        prescribedDistance: set.prescribedDistance ?? null,
        prescribedRpe: set.prescribedRpe ?? null,
        prescribedRir: set.prescribedRir ?? null,
        prescribedRestSeconds: set.prescribedRestSeconds ?? exercise.defaultRestSeconds ?? null,
        actualReps: null,
        actualLoad: null,
        actualDurationSeconds: null,
        actualDistance: null,
        actualRpe: null,
        actualRir: null,
        actualRestSeconds: null,
        isCompleted: false,
        completedAt: null,
        notes: ''
      }))
    }))
  };
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

export function getSessionProgress(session) {
  const exercises = session.exercises || [];
  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const completedSets = exercises.reduce(
    (sum, exercise) => sum + exercise.sets.filter((set) => set.isCompleted).length,
    0
  );
  const completedExercises = exercises.filter((exercise) =>
    exercise.sets.length > 0 && exercise.sets.every((set) => set.isCompleted)
  ).length;

  return {
    totalExercises,
    completedExercises,
    totalSets,
    completedSets,
    completionPercent: totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100)
  };
}

export function updateExerciseStatuses(session) {
  return {
    ...session,
    exercises: session.exercises.map((exercise) => {
      const completedSets = exercise.sets.filter((set) => set.isCompleted).length;

      let status = 'not_started';
      if (completedSets > 0 && completedSets < exercise.sets.length) status = 'active';
      if (exercise.sets.length > 0 && completedSets === exercise.sets.length) status = 'completed';

      return {
        ...exercise,
        status
      };
    })
  };
}

export function completeWorkoutSessionSet(session, exerciseId, setId) {
  const updatedSession = {
    ...session,
    exercises: session.exercises.map((exercise) => {
      if (exercise.id !== exerciseId) return exercise;

      return {
        ...exercise,
        sets: exercise.sets.map((set) => {
          if (set.id !== setId || set.isCompleted) return set;
          return completeSessionSet(set);
        })
      };
    })
  };

  return updateExerciseStatuses(updatedSession);
}

export function finishWorkoutSession(session) {
  return {
    ...session,
    status: 'completed',
    completedAt: new Date().toISOString()
  };
}
