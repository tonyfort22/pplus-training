import { programPlannerSeed } from './program-planner-data'

const fixedDayDefinitions = [
  { id: 'day-1', label: 'Day 1' },
  { id: 'day-2', label: 'Day 2' },
  { id: 'day-3', label: 'Day 3' },
  { id: 'day-4', label: 'Day 4' },
  { id: 'day-5', label: 'Day 5' },
  { id: 'day-6', label: 'Day 6' },
  { id: 'day-7', label: 'Day 7' },
]

function cloneSection(section = {}) {
  return {
    id: section.id ?? '',
    title: section.title ?? '',
    description: section.description ?? '',
    exercises: Array.isArray(section.exercises) ? section.exercises.map((exercise) => ({
      ...exercise,
      sets: Array.isArray(exercise.sets) ? exercise.sets.map((set) => ({ ...set })) : [],
    })) : [],
  }
}

function cloneWorkout(workout = {}) {
  return {
    id: workout.id ?? '',
    title: workout.title ?? '',
    blockLabel: workout.blockLabel ?? 'Main Work',
    duration: workout.duration ?? '0 min',
    coachNote: workout.coachNote ?? '',
    sections: Array.isArray(workout.sections) ? workout.sections.map(cloneSection) : [],
  }
}

export function createFixedDaySlots(daySlots = []) {
  return fixedDayDefinitions.map((definition) => {
    const source = daySlots.find((slot) => slot.id === definition.id) ?? {}

    return {
      id: definition.id,
      programDayId: source.programDayId ?? null,
      date: source.date ?? null,
      label: definition.label,
      summary: source.summary ?? 'No work assigned',
      focus: source.focus ?? 'Open day',
      workouts: Array.isArray(source.workouts) ? source.workouts.map(cloneWorkout) : [],
    }
  })
}

function cloneWeek(week = {}, index = 0) {
  return {
    id: week.id ?? `week-${index + 1}`,
    label: week.label ?? `Week ${index + 1}`,
    focus: week.focus ?? 'Weekly focus',
    summary: week.summary ?? 'Coach-managed weekly structure.',
    daySlots: createFixedDaySlots(week.daySlots),
  }
}

function cloneProgram(program = {}) {
  return {
    id: program.id ?? 'program-1',
    title: program.title ?? 'Program',
    athleteLabel: program.athleteLabel ?? '0 athletes',
    duration: program.duration ?? '0 weeks',
    weekCount: program.weekCount ?? program.weeks?.length ?? 0,
    goal: program.goal ?? '',
    description: program.description ?? '',
    weeks: Array.isArray(program.weeks) ? program.weeks.map(cloneWeek) : [],
  }
}

function buildFallbackPlanner(programId) {
  const fallbackWeek = cloneWeek({ id: 'week-1', label: 'Week 1', focus: 'Training content', summary: 'Coach-managed weekly structure.' }, 0)

  return {
    id: programId || 'training-content',
    title: 'Training content',
    athleteLabel: '0 athletes',
    duration: '1 week',
    weekCount: 1,
    goal: 'Training content',
    description: 'Open this training content to start building the plan.',
    weeks: [fallbackWeek],
  }
}

export function createProgramPlannerFromAdminProgram(program = {}) {
  if (Array.isArray(program.weeks) && program.weeks.length > 0) {
    return cloneProgram({
      id: program.id,
      title: program.name || 'Untitled program',
      athleteLabel: program.athletesLabel || 'Unassigned',
      duration: program.duration || `${program.weeks.length} week${program.weeks.length === 1 ? '' : 's'}`,
      weekCount: program.weeks.length,
      goal: program.description || '',
      description: program.description || '',
      weeks: program.weeks,
    })
  }

  const parsedWeekCount = Number(program.weekCount ?? String(program.duration ?? '').match(/\d+/)?.[0] ?? 0)
  const weekCount = Math.max(1, Number.isFinite(parsedWeekCount) ? Math.floor(parsedWeekCount) : 0)

  return cloneProgram({
    id: program.id,
    title: program.name || 'Untitled program',
    athleteLabel: program.athletesLabel || 'Unassigned',
    duration: program.duration || `${weekCount} week${weekCount === 1 ? '' : 's'}`,
    weekCount,
    goal: program.description || '',
    description: program.description || '',
    weeks: Array.from({ length: weekCount }, (_, index) => ({
      id: `week-${index + 1}`,
      label: `Week ${index + 1}`,
      focus: program.name || 'Training content',
      summary: 'Coach-managed weekly structure.',
      daySlots: createFixedDaySlots(),
    })),
  })
}

export function getProgramPlannerById(programId) {
  const matchedProgram = programPlannerSeed.find((program) => program.id === programId)
  return matchedProgram ? cloneProgram(matchedProgram) : buildFallbackPlanner(programId)
}

export function createEmptyProgramWeek(index = 0, programTitle = 'Training content') {
  return cloneWeek(
    {
      id: `week-${index + 1}`,
      label: `Week ${index + 1}`,
      focus: programTitle || 'Training content',
      summary: 'Coach-managed weekly structure.',
      daySlots: createFixedDaySlots(),
    },
    index,
  )
}

export function renumberProgramWeeks(weeks = []) {
  return weeks.map((week, index) => ({
    ...week,
    id: `week-${index + 1}`,
    label: `Week ${index + 1}`,
  }))
}

export function swapDayLaneContent(daySlots, activeDayId, overDayId) {
  if (!activeDayId || !overDayId || activeDayId === overDayId) {
    return createFixedDaySlots(daySlots)
  }

  const sourceDay = daySlots.find((slot) => slot.id === activeDayId)
  const targetDay = daySlots.find((slot) => slot.id === overDayId)

  if (!sourceDay || !targetDay) {
    return createFixedDaySlots(daySlots)
  }

  return createFixedDaySlots(
    daySlots.map((slot) => {
      if (slot.id === activeDayId) {
        return {
          ...slot,
          summary: targetDay.summary,
          focus: targetDay.focus,
          workouts: targetDay.workouts,
        }
      }

      if (slot.id === overDayId) {
        return {
          ...slot,
          summary: sourceDay.summary,
          focus: sourceDay.focus,
          workouts: sourceDay.workouts,
        }
      }

      return slot
    }),
  )
}

export function reorderWorkoutCards(daySlots, sourceDayId, targetDayId, activeWorkoutId, overWorkoutId) {
  if (!sourceDayId || !targetDayId || !activeWorkoutId || !overWorkoutId) {
    return createFixedDaySlots(daySlots)
  }

  const nextDaySlots = createFixedDaySlots(daySlots)
  const sourceDay = nextDaySlots.find((slot) => slot.id === sourceDayId)
  const targetDay = nextDaySlots.find((slot) => slot.id === targetDayId)

  if (!sourceDay || !targetDay) {
    return nextDaySlots
  }

  const sourceWorkoutIndex = sourceDay.workouts.findIndex((workout) => workout.id === activeWorkoutId)
  if (sourceWorkoutIndex === -1) {
    return nextDaySlots
  }

  const [movedWorkout] = sourceDay.workouts.splice(sourceWorkoutIndex, 1)

  if (sourceDayId === targetDayId) {
    const targetIndex = targetDay.workouts.findIndex((workout) => workout.id === overWorkoutId)
    targetDay.workouts.splice(targetIndex === -1 ? targetDay.workouts.length : targetIndex, 0, movedWorkout)
    return nextDaySlots
  }

  const targetIndex = targetDay.workouts.findIndex((workout) => workout.id === overWorkoutId)
  targetDay.workouts.splice(targetIndex === -1 ? targetDay.workouts.length : targetIndex, 0, movedWorkout)
  return nextDaySlots
}
