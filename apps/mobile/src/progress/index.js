export function getProgressSurfaceModel({ sessions = [] } = {}) {
  const completedSessions = sessions.filter((session) => session.status === 'completed')
  const squatPerformance = getBestExercisePerformance(completedSessions, 'Back Squat')
  const squatEstimate = squatPerformance ? estimateOneRepMax(squatPerformance.actualLoad, squatPerformance.actualReps) : null
  const totalLoadScore = Math.round(
    completedSessions.reduce((sum, session) => sum + getSessionLoadVolume(session), 0) / 100
  )
  const readiness = getReadinessLabel(totalLoadScore)
  const fatigueRows = buildFatigueRows(completedSessions)
  const adherence = completedSessions.length > 0 ? '100% adherence' : 'No completed sessions yet'

  return {
    header: {
      eyebrow: 'Progress',
      title: 'Performance & recovery',
      body: 'This is where the athlete should see results from completed training, not just the workouts themselves.',
    },
    metrics: [
      {
        label: 'Back Squat est. 1RM',
        value: squatEstimate ? `${squatEstimate} lb` : '--',
        detail: squatEstimate
          ? `Best completed set came from ${squatPerformance.actualLoad} lb x ${squatPerformance.actualReps} reps`
          : 'Complete squat sessions to unlock a trend line',
      },
      {
        label: 'Weekly load',
        value: String(totalLoadScore),
        detail: `${completedSessions.length} completed sessions contributing to the current load score`,
      },
      {
        label: 'Readiness',
        value: readiness,
        detail: readiness === 'Low'
          ? 'Recovery is clear and ready for more completed work'
          : 'Solid work logged, but fatigue is starting to accumulate',
      },
    ],
    trainingLoad: {
      title: 'Training load',
      body: `${completedSessions.length} completed sessions are currently feeding this load view. The score comes from actual load x reps across logged sets.`,
    },
    muscleFatigue: {
      title: 'Muscle fatigue',
      body: 'This surface now reflects which lower-body groups are carrying the most completed work from logged sessions.',
      rows: fatigueRows,
    },
    performanceSnapshots: {
      title: 'Performance snapshots',
      body: completedSessions.length > 0
        ? `${adherence} across the current sample, with progress driven only by completed actual work.`
        : 'No completed sessions yet. Finish a workout to start building adherence and performance snapshots.',
    },
    recentMomentum: {
      title: 'Recent momentum',
      rows: buildRecentMomentumRows(completedSessions),
    },
    exerciseBreakdown: {
      title: 'Exercise breakdown',
      rows: buildExerciseBreakdownRows(completedSessions),
    },
  }
}

export function getPlaceholderSurfaceModel(title, body) {
  return { title, body }
}

function getBestExercisePerformance(sessions, exerciseNamePart) {
  const normalized = exerciseNamePart.toLowerCase()
  let bestSet = null

  for (const session of sessions) {
    for (const exercise of session.exercises || []) {
      const name = (exercise.nameSnapshot || exercise.name || '').toLowerCase()
      if (!name.includes(normalized)) continue

      for (const set of exercise.sets || []) {
        if (!set.isCompleted || set.actualLoad == null || set.actualReps == null) continue
        const estimate = estimateOneRepMax(set.actualLoad, set.actualReps)
        if (!bestSet || estimate > estimateOneRepMax(bestSet.actualLoad, bestSet.actualReps)) {
          bestSet = {
            actualLoad: set.actualLoad,
            actualReps: set.actualReps,
            estimate,
          }
        }
      }
    }
  }

  return bestSet
}

function estimateOneRepMax(load, reps) {
  return Math.round(load * (1 + reps / 30))
}

function getSessionLoadVolume(session) {
  return (session.exercises || []).reduce((sessionSum, exercise) => {
    return sessionSum + (exercise.sets || []).reduce((setSum, set) => {
      if (!set.isCompleted || set.actualLoad == null || set.actualReps == null) return setSum
      return setSum + set.actualLoad * set.actualReps
    }, 0)
  }, 0)
}

function getReadinessLabel(totalLoadScore) {
  if (totalLoadScore >= 70) return 'Moderate'
  return 'Low'
}

function buildFatigueRows(sessions) {
  const totals = {
    Quads: 0,
    Hamstrings: 0,
    Glutes: 0,
  }

  for (const session of sessions) {
    for (const exercise of session.exercises || []) {
      const volume = (exercise.sets || []).reduce((sum, set) => {
        if (!set.isCompleted || set.actualLoad == null || set.actualReps == null) return sum
        return sum + set.actualLoad * set.actualReps
      }, 0)
      const name = (exercise.nameSnapshot || exercise.name || '').toLowerCase()

      if (name.includes('squat')) {
        totals.Quads += volume
        totals.Glutes += Math.round(volume * 0.6)
      }

      if (name.includes('deadlift') || name.includes('rdl')) {
        totals.Hamstrings += volume
        totals.Glutes += Math.round(volume * 0.5)
      }
    }
  }

  return Object.entries(totals).map(([title, volume]) => ({
    title,
    body: getFatigueLabel(volume),
  }))
}

function buildRecentMomentumRows(sessions) {
  if (sessions.length === 0) {
    return [
      {
        title: 'No completed work yet',
        body: 'Finish a workout to start building recent momentum from actual completed sessions.',
      },
    ]
  }

  const sortedSessions = [...sessions]
    .sort((left, right) => new Date(right.completedAt || 0).getTime() - new Date(left.completedAt || 0).getTime())
    .slice(0, 3)

  return sortedSessions.map((session, index) => {
      const bestSet = getSessionBestSet(session)
      const bestSetCopy = bestSet
        ? `${estimateOneRepMax(bestSet.actualLoad, bestSet.actualReps)} lb est. 1RM from ${bestSet.exerciseName} (${bestSet.actualLoad} x ${bestSet.actualReps})`
        : 'Completed session logged with no usable strength set yet.'
      const trendCopy = getMomentumTrendCopy({
        currentBestSet: bestSet,
        previousBestSet: index < sortedSessions.length - 1 ? getSessionBestSet(sortedSessions[index + 1]) : null,
      })

      return {
        title: `${formatSessionDate(session.completedAt)} • ${session.nameSnapshot || session.workoutName || 'Completed session'}`,
        body: `${session.completedSetsCount} of ${session.totalSetsCount} sets completed. ${bestSetCopy} ${trendCopy}`.trim(),
      }
    })
}

function getMomentumTrendCopy({ currentBestSet, previousBestSet }) {
  if (!currentBestSet || !previousBestSet) {
    return 'First completed session in this sample.'
  }

  const currentEstimate = estimateOneRepMax(currentBestSet.actualLoad, currentBestSet.actualReps)
  const previousEstimate = estimateOneRepMax(previousBestSet.actualLoad, previousBestSet.actualReps)
  const delta = currentEstimate - previousEstimate

  if (delta > 0) {
    return `Trending up. +${delta} lb vs last completed session.`
  }

  if (delta < 0) {
    return `Trending down. ${delta} lb vs last completed session.`
  }

  return 'Holding steady. Flat vs last completed session.'
}

function buildExerciseBreakdownRows(sessions) {
  return [
    buildExerciseBreakdownRow({
      title: 'Squat pattern',
      sessions,
      exerciseNamePart: 'Back Squat',
      emptyCopy: 'Complete squat sessions to unlock this breakdown.',
    }),
    buildExerciseBreakdownRow({
      title: 'Hinge pattern',
      sessions,
      exerciseNamePart: 'Romanian Deadlift',
      emptyCopy: 'Complete hinge sessions to unlock this breakdown.',
    }),
  ]
}

function buildExerciseBreakdownRow({ title, sessions, exerciseNamePart, emptyCopy }) {
  const bestSet = getBestExercisePerformance(sessions, exerciseNamePart)
  if (!bestSet) {
    return {
      title,
      body: emptyCopy,
    }
  }

  const recentPerformances = getRecentExercisePerformances(sessions, exerciseNamePart)
  const current = recentPerformances[0] || null
  const previous = recentPerformances[1] || null
  const trendCopy = getMomentumTrendCopy({
    currentBestSet: current,
    previousBestSet: previous,
  })

  return {
    title,
    body: `${bestSet.estimate} lb best estimate from ${bestSet.actualLoad} x ${bestSet.actualReps}. ${trendCopy}`,
  }
}

function getRecentExercisePerformances(sessions, exerciseNamePart) {
  const normalized = exerciseNamePart.toLowerCase()

  return [...sessions]
    .sort((left, right) => new Date(right.completedAt || 0).getTime() - new Date(left.completedAt || 0).getTime())
    .map((session) => getSessionBestSetByExerciseNamePart(session, normalized))
    .filter(Boolean)
    .slice(0, 2)
}

function getSessionBestSetByExerciseNamePart(session, exerciseNamePart) {
  let bestSet = null

  for (const exercise of session.exercises || []) {
    const name = (exercise.nameSnapshot || exercise.name || '').toLowerCase()
    if (!name.includes(exerciseNamePart)) continue

    for (const set of exercise.sets || []) {
      if (!set.isCompleted || set.actualLoad == null || set.actualReps == null) continue

      const estimate = estimateOneRepMax(set.actualLoad, set.actualReps)
      if (!bestSet || estimate > bestSet.estimate) {
        bestSet = {
          actualLoad: set.actualLoad,
          actualReps: set.actualReps,
          estimate,
        }
      }
    }
  }

  return bestSet
}

function getSessionBestSet(session) {
  let bestSet = null

  for (const exercise of session.exercises || []) {
    for (const set of exercise.sets || []) {
      if (!set.isCompleted || set.actualLoad == null || set.actualReps == null) continue

      const estimate = estimateOneRepMax(set.actualLoad, set.actualReps)
      if (!bestSet || estimate > bestSet.estimate) {
        bestSet = {
          exerciseName: exercise.nameSnapshot || exercise.name || 'Exercise',
          actualLoad: set.actualLoad,
          actualReps: set.actualReps,
          estimate,
        }
      }
    }
  }

  return bestSet
}

function formatSessionDate(value) {
  if (!value) return 'Recent session'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Recent session'

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'America/Toronto',
  })
}

function getFatigueLabel(volume) {
  if (volume >= 3000) return 'High fatigue'
  if (volume >= 1200) return 'Moderate fatigue'
  return 'Low fatigue'
}
