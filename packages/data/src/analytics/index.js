function roundMetric(value, decimals = 1) {
  const factor = 10 ** decimals
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor
}

function resolveEffortMultiplier(effort) {
  const numericEffort = Number(effort)
  if (!Number.isFinite(numericEffort) || numericEffort <= 0) return 1
  if (numericEffort <= 5) return 0.8
  if (numericEffort <= 6) return 0.9
  if (numericEffort <= 7) return 1
  if (numericEffort <= 8) return 1.1
  if (numericEffort <= 9) return 1.2
  return 1.3
}

function getSetBaseWorkScore(set) {
  const load = Number(set?.actualLoad ?? set?.prescribedLoad ?? null)
  const reps = Number(set?.actualReps ?? set?.prescribedReps ?? null)
  const durationSeconds = Number(set?.actualDurationSeconds ?? set?.prescribedDurationSeconds ?? null)
  const distance = Number(set?.actualDistance ?? set?.prescribedDistance ?? null)

  if (Number.isFinite(load) && load > 0 && Number.isFinite(reps) && reps > 0) {
    return {
      score: load * reps,
      load,
      reps,
      sourceMetric: 'load_reps',
    }
  }

  if (Number.isFinite(reps) && reps > 0) {
    return {
      score: reps,
      load: null,
      reps,
      sourceMetric: 'reps',
    }
  }

  if (Number.isFinite(durationSeconds) && durationSeconds > 0) {
    return {
      score: durationSeconds,
      load: null,
      reps: null,
      sourceMetric: 'duration',
    }
  }

  if (Number.isFinite(distance) && distance > 0) {
    return {
      score: distance,
      load: null,
      reps: null,
      sourceMetric: 'distance',
    }
  }

  return {
    score: 0,
    load: null,
    reps: null,
    sourceMetric: 'none',
  }
}

function estimateOneRepMax(load, reps) {
  if (load == null || reps == null) return null
  const numericLoad = Number(load)
  const numericReps = Number(reps)
  if (!Number.isFinite(numericLoad) || !Number.isFinite(numericReps) || numericLoad <= 0 || numericReps <= 0) {
    return null
  }
  return roundMetric(numericLoad * (1 + numericReps / 30), 1)
}

function getCompletedSetsForExercise(exercise) {
  return (exercise?.sets || []).filter((set) => set?.isCompleted)
}

export function buildCompletedSessionAnalyticsPayload(session) {
  if (!session || session.status !== 'completed') return null

  let completedSetsTotal = 0
  let completedRepsTotal = 0
  let volumeLoadTotal = 0
  let effortAdjustedLoadTotal = 0

  const exercisePerformanceSnapshots = (session.exercises || []).flatMap((exercise) => {
    const completedSets = getCompletedSetsForExercise(exercise)
    if (!completedSets.length) return []

    const strongestSet = completedSets.reduce((bestSet, currentSet) => {
      const bestLoad = Number(bestSet?.actualLoad ?? bestSet?.prescribedLoad ?? 0)
      const currentLoad = Number(currentSet?.actualLoad ?? currentSet?.prescribedLoad ?? 0)
      return currentLoad > bestLoad ? currentSet : bestSet
    }, completedSets[0])

    const strongestLoad = strongestSet?.actualLoad ?? strongestSet?.prescribedLoad ?? null
    const strongestReps = strongestSet?.actualReps ?? strongestSet?.prescribedReps ?? null

    for (const set of completedSets) {
      const workScore = getSetBaseWorkScore(set)
      const effort = set?.actualRpe ?? set?.prescribedRpe ?? null
      const effortMultiplier = resolveEffortMultiplier(effort)
      const fatigueMultiplier = Number(exercise?.fatigueMultiplier)
      const resolvedFatigueMultiplier = Number.isFinite(fatigueMultiplier) && fatigueMultiplier > 0 ? fatigueMultiplier : 1

      completedSetsTotal += 1
      if (Number.isFinite(workScore.reps) && workScore.reps > 0) {
        completedRepsTotal += workScore.reps
      }
      volumeLoadTotal += workScore.score
      effortAdjustedLoadTotal += workScore.score * effortMultiplier
    }

    return [{
      athleteId: session.athleteId ?? null,
      exerciseId: exercise.exerciseId ?? null,
      workoutSessionId: session.id ?? null,
      workoutSessionExerciseId: exercise.id ?? null,
      metricType: 'strength',
      load: strongestLoad,
      reps: strongestReps,
      sets: completedSets.length,
      durationSeconds: null,
      distance: null,
      unit: strongestSet?.actualLoadUnit ?? strongestSet?.prescribedLoadUnit ?? null,
      bodyRegion: exercise.bodyRegion ?? null,
      logDate: String(session.completedAt || session.startedAt || '').slice(0, 10) || null,
      estimatedOneRepMax: estimateOneRepMax(strongestLoad, strongestReps),
      notes: session.notes || '',
    }]
  }).filter((row) => row.exerciseId)

  const muscleLoadEvents = (session.exercises || []).flatMap((exercise) => {
    const completedSets = getCompletedSetsForExercise(exercise)
    if (!completedSets.length) return []

    const fatigueMultiplier = Number(exercise?.fatigueMultiplier)
    const resolvedFatigueMultiplier = Number.isFinite(fatigueMultiplier) && fatigueMultiplier > 0 ? fatigueMultiplier : 1
    const muscleTargets = Array.isArray(exercise?.muscleTargets) && exercise.muscleTargets.length
      ? exercise.muscleTargets
      : []

    return completedSets.flatMap((set) => {
      const workScore = getSetBaseWorkScore(set)
      const effort = set?.actualRpe ?? set?.prescribedRpe ?? null
      const effortMultiplier = resolveEffortMultiplier(effort)
      const setStressScore = workScore.score * effortMultiplier * resolvedFatigueMultiplier

      return muscleTargets.map((target) => ({
        athleteId: session.athleteId ?? null,
        workoutSessionId: session.id ?? null,
        workoutSessionExerciseId: exercise.id ?? null,
        workoutSessionSetId: set.id ?? null,
        exerciseId: exercise.exerciseId ?? null,
        muscleId: target.muscleId ?? null,
        subMuscleId: target.subMuscleId ?? null,
        isSubMuscle: Boolean(target.subMuscleId),
        eventDate: String(session.completedAt || session.startedAt || '').slice(0, 10) || null,
        percent: target.percent ?? null,
        score: roundMetric(setStressScore * Number(target.percent ?? 0), 1),
      }))
    })
  }).filter((row) => row.muscleId)

  return {
    sessionId: session.id ?? null,
    athleteId: session.athleteId ?? null,
    completedAt: session.completedAt ?? null,
    sessionLoadSummary: {
      athleteId: session.athleteId ?? null,
      workoutSessionId: session.id ?? null,
      completedSets: completedSetsTotal,
      completedReps: completedRepsTotal,
      volumeLoad: roundMetric(volumeLoadTotal, 1),
      effortAdjustedLoad: roundMetric(effortAdjustedLoadTotal, 1),
      sessionDifficulty: session.perceivedDifficulty ?? null,
      logDate: String(session.completedAt || session.startedAt || '').slice(0, 10) || null,
    },
    exercisePerformanceSnapshots,
    muscleLoadEvents,
  }
}

export function createAnalyticsRepository(db) {
  return {
    db,
    buildCompletedSessionAnalyticsPayload,
    async persistCompletedSessionAnalytics(session) {
      const payload = buildCompletedSessionAnalyticsPayload(session)
      if (!payload) return null

      if (typeof db?.saveSessionLoadSummary === 'function' || typeof db?.saveExercisePerformanceSnapshots === 'function' || typeof db?.saveMuscleLoadEvents === 'function') {
        const sessionLoadSummary = typeof db?.saveSessionLoadSummary === 'function'
          ? await db.saveSessionLoadSummary(payload.sessionLoadSummary)
          : payload.sessionLoadSummary
        const exercisePerformanceSnapshots = typeof db?.saveExercisePerformanceSnapshots === 'function'
          ? await db.saveExercisePerformanceSnapshots(payload.exercisePerformanceSnapshots)
          : payload.exercisePerformanceSnapshots
        const muscleLoadEvents = typeof db?.saveMuscleLoadEvents === 'function'
          ? await db.saveMuscleLoadEvents(payload.muscleLoadEvents)
          : payload.muscleLoadEvents

        return {
          ...payload,
          sessionLoadSummary,
          exercisePerformanceSnapshots,
          muscleLoadEvents,
        }
      }

      if (typeof db?.saveCompletedSessionAnalytics === 'function') {
        return db.saveCompletedSessionAnalytics(payload)
      }
      return payload
    },
    async getAthleteProgressSummary(athleteId) {
      return {
        athleteId,
        fatigue: [],
        performance: []
      };
    }
  };
}
