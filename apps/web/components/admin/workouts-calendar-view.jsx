'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Columns,
  Grid2x2,
  Grid3x3,
  List,
  Plus,
} from 'lucide-react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

import { Button } from '@/components/ui/button'
import WorkoutEditorDialog from '@/components/admin/workout-editor-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00']
const REFERENCE_TODAY = new Date(2026, 4, 25)
const REFERENCE_MONTH_RANGE_LABEL = 'May 1, 2026 - May 31, 2026'

const WORKOUT_TYPE_COLORS = {
  warmup: { bgColor: '#a9d6e5', textColor: '#014f86' },
  speedAccelerator: { bgColor: '#fae0e4', textColor: '#ff7096' },
  edgeWork: { bgColor: '#dec9e9', textColor: '#815ac0' },
  conditioning: { bgColor: '#ffedd8', textColor: '#a47148' },
  fallback: { bgColor: '#dbeafe', textColor: '#1d4ed8' },
}

const WORKOUT_EVENTS = [
  {
    id: 'calendar-workout-1',
    title: 'Power Skating A',
    startDate: new Date(2026, 4, 4),
    endDate: new Date(2026, 4, 4),
    trainingType: 'Warmup',
    bgColor: WORKOUT_TYPE_COLORS.warmup.bgColor,
    textColor: WORKOUT_TYPE_COLORS.warmup.textColor,
    startHour: '06:00',
    endHour: '07:00',
  },
  {
    id: 'calendar-workout-2',
    title: 'Goalie Edge Control',
    startDate: new Date(2026, 4, 5),
    endDate: new Date(2026, 4, 5),
    trainingType: 'Edge Work',
    bgColor: WORKOUT_TYPE_COLORS.edgeWork.bgColor,
    textColor: WORKOUT_TYPE_COLORS.edgeWork.textColor,
    startHour: '07:00',
    endHour: '08:00',
  },
  {
    id: 'calendar-workout-3',
    title: 'Acceleration Tune-Up',
    startDate: new Date(2026, 4, 6),
    endDate: new Date(2026, 4, 6),
    trainingType: 'Speed Accelerator',
    bgColor: WORKOUT_TYPE_COLORS.speedAccelerator.bgColor,
    textColor: WORKOUT_TYPE_COLORS.speedAccelerator.textColor,
    startHour: '09:00',
    endHour: '10:00',
  },
  {
    id: 'calendar-workout-4',
    title: 'Transition Speed Builder',
    startDate: new Date(2026, 4, 8),
    endDate: new Date(2026, 4, 8),
    trainingType: 'Conditioning',
    bgColor: WORKOUT_TYPE_COLORS.conditioning.bgColor,
    textColor: WORKOUT_TYPE_COLORS.conditioning.textColor,
    startHour: '10:00',
    endHour: '11:00',
  },
  {
    id: 'calendar-workout-5',
    title: 'Overspeed Mechanics',
    startDate: new Date(2026, 4, 9),
    endDate: new Date(2026, 4, 9),
    trainingType: 'Speed Accelerator',
    bgColor: WORKOUT_TYPE_COLORS.speedAccelerator.bgColor,
    textColor: WORKOUT_TYPE_COLORS.speedAccelerator.textColor,
    startHour: '08:00',
    endHour: '09:00',
  },
]

const ASSIGNABLE_WORKOUTS = [
  {
    id: 'assignable-workout-1',
    title: 'Stride Mechanics Reset',
    trainingType: 'Warmup',
    bgColor: WORKOUT_TYPE_COLORS.warmup.bgColor,
    textColor: WORKOUT_TYPE_COLORS.warmup.textColor,
    durationHours: 1,
  },
  {
    id: 'assignable-workout-2',
    title: 'Reaction Speed Circuit',
    trainingType: 'Speed Accelerator',
    bgColor: WORKOUT_TYPE_COLORS.speedAccelerator.bgColor,
    textColor: WORKOUT_TYPE_COLORS.speedAccelerator.textColor,
    durationHours: 1,
  },
  {
    id: 'assignable-workout-3',
    title: 'Lateral Power Builder',
    trainingType: 'Edge Work',
    bgColor: WORKOUT_TYPE_COLORS.edgeWork.bgColor,
    textColor: WORKOUT_TYPE_COLORS.edgeWork.textColor,
    durationHours: 1,
  },
]

const DEBUG_DENSE_DAY_EVENTS = [
  { id: 'debug-dense-day-1', title: 'Edge Warmup Flow', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Warmup', bgColor: WORKOUT_TYPE_COLORS.warmup.bgColor, textColor: WORKOUT_TYPE_COLORS.warmup.textColor, startHour: '06:00', endHour: '07:00', workoutTemplateId: 'assignable-workout-1', typeLabel: 'Warmup', persisted: false },
  { id: 'debug-dense-day-2', title: 'Explosive Start Circuit', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Speed Accelerator', bgColor: WORKOUT_TYPE_COLORS.speedAccelerator.bgColor, textColor: WORKOUT_TYPE_COLORS.speedAccelerator.textColor, startHour: '06:00', endHour: '07:00', workoutTemplateId: 'assignable-workout-2', typeLabel: 'Speed Accelerator', persisted: false },
  { id: 'debug-dense-day-3', title: 'Crossover Timing Builder', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Edge Work', bgColor: WORKOUT_TYPE_COLORS.edgeWork.bgColor, textColor: WORKOUT_TYPE_COLORS.edgeWork.textColor, startHour: '07:00', endHour: '08:00', workoutTemplateId: 'assignable-workout-3', typeLabel: 'Edge Work', persisted: false },
  { id: 'debug-dense-day-4', title: 'Goal Line Escape Reps', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Warmup', bgColor: WORKOUT_TYPE_COLORS.warmup.bgColor, textColor: WORKOUT_TYPE_COLORS.warmup.textColor, startHour: '07:00', endHour: '08:00', workoutTemplateId: 'assignable-workout-1', typeLabel: 'Warmup', persisted: false },
  { id: 'debug-dense-day-5', title: 'Blue Line Quick Feet', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Speed Accelerator', bgColor: WORKOUT_TYPE_COLORS.speedAccelerator.bgColor, textColor: WORKOUT_TYPE_COLORS.speedAccelerator.textColor, startHour: '08:00', endHour: '09:00', workoutTemplateId: 'assignable-workout-2', typeLabel: 'Speed Accelerator', persisted: false },
  { id: 'debug-dense-day-6', title: 'Inside Edge Recovery Block', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Conditioning', bgColor: WORKOUT_TYPE_COLORS.conditioning.bgColor, textColor: WORKOUT_TYPE_COLORS.conditioning.textColor, startHour: '08:00', endHour: '09:00', workoutTemplateId: 'assignable-workout-3', typeLabel: 'Conditioning', persisted: false },
  { id: 'debug-dense-day-7', title: 'Neutral Zone Burst Ladder', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Warmup', bgColor: WORKOUT_TYPE_COLORS.warmup.bgColor, textColor: WORKOUT_TYPE_COLORS.warmup.textColor, startHour: '09:00', endHour: '10:00', workoutTemplateId: 'assignable-workout-1', typeLabel: 'Warmup', persisted: false },
  { id: 'debug-dense-day-8', title: 'Transition Pace Builder', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Speed Accelerator', bgColor: WORKOUT_TYPE_COLORS.speedAccelerator.bgColor, textColor: WORKOUT_TYPE_COLORS.speedAccelerator.textColor, startHour: '09:00', endHour: '10:00', workoutTemplateId: 'assignable-workout-2', typeLabel: 'Speed Accelerator', persisted: false },
  { id: 'debug-dense-day-9', title: 'Overspeed Push Set', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Edge Work', bgColor: WORKOUT_TYPE_COLORS.edgeWork.bgColor, textColor: WORKOUT_TYPE_COLORS.edgeWork.textColor, startHour: '10:00', endHour: '11:00', workoutTemplateId: 'assignable-workout-3', typeLabel: 'Edge Work', persisted: false },
  { id: 'debug-dense-day-10', title: 'Corner Battle Footwork', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Warmup', bgColor: WORKOUT_TYPE_COLORS.warmup.bgColor, textColor: WORKOUT_TYPE_COLORS.warmup.textColor, startHour: '10:00', endHour: '11:00', workoutTemplateId: 'assignable-workout-1', typeLabel: 'Warmup', persisted: false },
  { id: 'debug-dense-day-11', title: 'High Tempo Relay', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Speed Accelerator', bgColor: WORKOUT_TYPE_COLORS.speedAccelerator.bgColor, textColor: WORKOUT_TYPE_COLORS.speedAccelerator.textColor, startHour: '11:00', endHour: '12:00', workoutTemplateId: 'assignable-workout-2', typeLabel: 'Speed Accelerator', persisted: false },
  { id: 'debug-dense-day-12', title: 'Stride Reset Cooldown', startDate: new Date(2026, 4, 18), endDate: new Date(2026, 4, 18), trainingType: 'Conditioning', bgColor: WORKOUT_TYPE_COLORS.conditioning.bgColor, textColor: WORKOUT_TYPE_COLORS.conditioning.textColor, startHour: '12:00', endHour: '13:00', workoutTemplateId: 'assignable-workout-3', typeLabel: 'Conditioning', persisted: false },
]

const DEBUG_DENSE_DAY_DATE = new Date(2026, 4, 18)

function createAssignmentDraft(date = null, hour = '', selectedWorkoutId = null) {
  return {
    date,
    hour,
    endDate: date,
    endHour: hour ? getEventEndHour(hour) : '',
    selectedWorkoutId,
  }
}

function normalizeWorkoutTemplateOption(template) {
  if (!template?.id) {
    return null
  }

  const resolvedTrainingType = template.training_type ?? template.trainingType ?? 'Workout'
  const resolvedTypeColors = getWorkoutTypeColors(resolvedTrainingType)
  const estimatedDurationMinutes = Number.parseInt(template.estimated_duration_minutes ?? template.estimatedDurationMinutes ?? '60', 10)
  const safeEstimatedDurationMinutes = Number.isNaN(estimatedDurationMinutes) ? 60 : Math.max(estimatedDurationMinutes, 30)
  const exerciseCount = Number.parseInt(template.exercise_count ?? template.exerciseCount ?? '0', 10)
  const setCount = Number.parseInt(template.set_count ?? template.setCount ?? '0', 10)
  const sectionCount = Number.parseInt(template.section_count ?? template.sectionCount ?? '0', 10)

  return {
    id: template.id,
    title: template.name ?? template.title ?? 'Workout',
    trainingType: resolvedTrainingType,
    bgColor: template.bg_color ?? template.bgColor ?? resolvedTypeColors.bgColor,
    textColor: template.text_color ?? template.textColor ?? resolvedTypeColors.textColor,
    estimatedDurationMinutes: safeEstimatedDurationMinutes,
    durationHours: Math.max(Math.round(safeEstimatedDurationMinutes / 60), 1),
    exerciseCount: Number.isNaN(exerciseCount) ? 0 : exerciseCount,
    setCount: Number.isNaN(setCount) ? 0 : setCount,
    sectionCount: Number.isNaN(sectionCount) ? 0 : sectionCount,
  }
}

function formatDateInputValue(date) {
  if (!date) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function parseDateInputValue(value) {
  if (!value) return null

  const [rawYear = '0', rawMonth = '1', rawDay = '1'] = String(value).split('-')
  const year = Number.parseInt(rawYear, 10)
  const month = Number.parseInt(rawMonth, 10)
  const day = Number.parseInt(rawDay, 10)

  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
    return null
  }

  return new Date(year, month - 1, day)
}

function createProgramWorkoutEditorDraft(event, {
  athleteId = '',
  dayPlaylistEventIds = [],
  dayPlaylistIndex = 0,
  dayPlaylistRawCount = 0,
} = {}) {
  if (!event) {
    return null
  }

  return {
    calendarEventId: event.id,
    athleteId: (event.athleteId ?? athleteId) || null,
    programId: event.programId ?? null,
    programWorkoutId: event.programWorkoutId ?? event.id,
    workoutTemplateId: event.workoutTemplateId ?? null,
    title: event.title,
    scheduledDate: formatDateForApi(event.startDate),
    scheduledStartTime: event.startHour ?? '',
    scheduledEndTime: event.endHour ?? '',
    dayPlaylistEventIds,
    dayPlaylistIndex,
    dayPlaylistRawCount,
  }
}

function createWorkoutEditorDetailsValues(programWorkoutTree = null) {
  const workout = programWorkoutTree?.workout ?? null
  const workoutTemplate = workout?.workout_templates ?? null
  const normalizedTemplateStatus = String(workoutTemplate?.status ?? '').trim().toLowerCase()
  const normalizedWorkoutStatus = String(workout?.status ?? '').trim().toLowerCase()
  const resolvedStatus = ['active', 'draft', 'archived'].includes(normalizedTemplateStatus)
    ? normalizedTemplateStatus
    : ['active', 'draft', 'archived'].includes(normalizedWorkoutStatus)
      ? normalizedWorkoutStatus
      : 'active'
  const thumbnailName = (() => {
    const thumbnailUrl = String(workoutTemplate?.thumbnail_url ?? '').trim()
    if (!thumbnailUrl) return ''
    try {
      return decodeURIComponent(thumbnailUrl.split('/').pop() || '')
    } catch {
      return thumbnailUrl.split('/').pop() || ''
    }
  })()

  return {
    name: workout?.name_snapshot ?? '',
    duration: workoutTemplate?.estimated_duration_minutes ? `${workoutTemplate.estimated_duration_minutes} min` : '',
    thumbnailName,
    program: '',
    trainer: '',
    equipmentNeeded: [],
    category: '',
    difficulty: '',
    status: resolvedStatus,
    focusArea: String(workoutTemplate?.training_type ?? '').trim().toLowerCase().replace(/\s+/g, '-'),
    description: workout?.notes ?? workoutTemplate?.description ?? '',
  }
}

function mapProgramWorkoutTreeToTrainingSections(programWorkoutTree = null) {
  const blocks = Array.isArray(programWorkoutTree?.blocks) ? programWorkoutTree.blocks : []
  const exercises = Array.isArray(programWorkoutTree?.exercises) ? programWorkoutTree.exercises : []
  const sets = Array.isArray(programWorkoutTree?.sets) ? programWorkoutTree.sets : []

  const effectiveBlocks = blocks.length > 0
    ? blocks
    : [{ id: '__synthetic-block__', block_code: 'A1', title: 'A1', instructions: '', sort_order: 0 }]

  return effectiveBlocks.map((block, blockIndex) => {
    const blockExercises = exercises.filter((exercise) => {
      if (blocks.length > 0) {
        return exercise.program_workout_block_id === block.id
      }

      return blockIndex === 0
    })

    return {
      id: block.id,
      label: block.block_code ?? block.title ?? `A${blockIndex + 1}`,
      isExpanded: blockIndex === 0,
      showInstruction: Boolean(block.instructions),
      instruction: block.instructions ?? '',
      draftExerciseQuery: '',
      exercises: blockExercises.map((exercise, exerciseIndex) => ({
        id: exercise.id,
        title: exercise.name_snapshot,
        isExpanded: exerciseIndex === 0,
        showInstruction: Boolean(exercise.notes),
        instruction: exercise.notes ?? '',
        sets: sets
          .filter((setRow) => setRow.program_workout_exercise_id === exercise.id)
          .map((setRow) => ({
            id: setRow.id,
            tempo: setRow.notes ?? '',
            effort: setRow.target_rpe != null ? `${setRow.target_rpe}/10` : '',
            side: '',
            duration: setRow.target_duration_seconds != null ? `${setRow.target_duration_seconds} sec` : '',
            distance: setRow.target_distance != null ? `${setRow.target_distance}${setRow.target_distance_unit ? ` ${setRow.target_distance_unit}` : ''}` : '',
            rest: setRow.target_rest_seconds != null ? String(setRow.target_rest_seconds) : '',
            reps: setRow.target_reps != null ? String(setRow.target_reps) : '',
          })),
      })),
    }
  })
}

function createCalendarCells(selectedDate) {
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)
  const leadingDays = monthStart.getDay()
  const cells = []

  for (let index = leadingDays - 1; index >= 0; index -= 1) {
    const date = new Date(year, month, -index)
    cells.push({ date, currentMonth: false })
  }

  for (let day = 1; day <= monthEnd.getDate(); day += 1) {
    cells.push({ date: new Date(year, month, day), currentMonth: true })
  }

  const trailingDays = (7 - (cells.length % 7)) % 7
  for (let day = 1; day <= trailingDays; day += 1) {
    const date = new Date(year, month + 1, day)
    cells.push({ date, currentMonth: false })
  }

  return cells
}

function getWeekStart(date) {
  const weekStart = new Date(date)
  weekStart.setDate(date.getDate() - date.getDay())
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

function createWeekDays(selectedDate) {
  const weekStart = getWeekStart(selectedDate)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + index)
    return date
  })
}

function shiftMonth(date, delta) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1)
}

function shiftDay(date, delta) {
  const nextDate = new Date(date)
  nextDate.setDate(date.getDate() + delta)
  return nextDate
}

function shiftWeek(date, delta) {
  const nextDate = new Date(date)
  nextDate.setDate(date.getDate() + delta * 7)
  return nextDate
}

function shiftYear(date, delta) {
  return new Date(date.getFullYear() + delta, date.getMonth(), 1)
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function formatMonthLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatMonthRangeLabel(date) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const monthStart = new Date(year, month, 1)
  const monthEnd = new Date(year, month + 1, 0)

  return `${new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(monthStart)} - ${new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(monthEnd)}`
}

function formatWeekLabel(date) {
  const weekDays = createWeekDays(date)
  const weekStart = weekDays[0]
  const weekEnd = weekDays[6]
  const startMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(weekStart)
  const endMonth = new Intl.DateTimeFormat('en-US', { month: 'short' }).format(weekEnd)

  if (weekStart.getFullYear() === weekEnd.getFullYear()) {
    return `${startMonth} ${weekStart.getDate()} - ${endMonth} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
  }

  return `${startMonth} ${weekStart.getDate()}, ${weekStart.getFullYear()} - ${endMonth} ${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function formatYearLabel(date) {
  return String(date.getFullYear())
}

function formatAssignmentSlot(date, hour) {
  if (!date || !hour) return 'Choose a week slot'

  return `${new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date)} at ${hour}`
}

function encodeWeekSlotId(date, hour) {
  return `week-slot:${date.toISOString()}:${hour}`
}

function parseWeekSlotId(slotId = '') {
  if (!slotId.startsWith('week-slot:')) {
    return null
  }

  const parts = slotId.split(':')
  const hour = `${parts.at(-2)}:${parts.at(-1)}`
  const isoDate = parts.slice(1, -2).join(':')
  return {
    date: new Date(isoDate),
    hour,
  }
}

function encodeMonthSlotId(date) {
  return `month-slot:${date.toISOString()}`
}

function parseMonthSlotId(slotId = '') {
  if (!slotId.startsWith('month-slot:')) {
    return null
  }

  const isoDate = slotId.slice('month-slot:'.length)
  return { date: new Date(isoDate) }
}

function getEventsForDate(date, events) {
  return events.filter((event) => isSameDay(event.startDate, date))
}

function getEventEndHour(startHour, durationHours = 1) {
  const startHourNumber = Number.parseInt(startHour.slice(0, 2), 10)
  const nextHour = String(startHourNumber + durationHours).padStart(2, '0')
  return `${nextHour}:00`
}

const WEEK_SLOT_HEIGHT = 88

function convertHourStringToMinutes(hour = '00:00') {
  const [rawHour = '0', rawMinute = '0'] = String(hour).split(':')
  const parsedHour = Number.parseInt(rawHour, 10)
  const parsedMinute = Number.parseInt(rawMinute, 10)
  return (Number.isNaN(parsedHour) ? 0 : parsedHour) * 60 + (Number.isNaN(parsedMinute) ? 0 : parsedMinute)
}

function getWeekViewBoundsInMinutes() {
  const startMinutes = convertHourStringToMinutes(WEEK_HOURS[0])
  const lastHourStartMinutes = convertHourStringToMinutes(WEEK_HOURS[WEEK_HOURS.length - 1])
  return {
    startMinutes,
    endMinutes: lastHourStartMinutes + 60,
  }
}

function getWeekEventLayout(event) {
  const { startMinutes: calendarStartMinutes, endMinutes: calendarEndMinutes } = getWeekViewBoundsInMinutes()
  const startMinutes = Math.max(convertHourStringToMinutes(event.startHour), calendarStartMinutes)
  const endMinutes = Math.min(convertHourStringToMinutes(event.endHour), calendarEndMinutes)
  const durationMinutes = Math.max(endMinutes - startMinutes, 30)
  const topOffset = ((startMinutes - calendarStartMinutes) / 60) * WEEK_SLOT_HEIGHT
  const height = Math.max((durationMinutes / 60) * WEEK_SLOT_HEIGHT, 44)

  return {
    topOffset,
    height,
  }
}

function hasSchedulingConflict({ events, date, startHour, excludeEventId = null }) {
  return events.some((event) => {
    if (excludeEventId && event.id === excludeEventId) {
      return false
    }

    return isSameDay(event.startDate, date) && event.startHour === startHour
  })
}

function getTemplateById(templateId) {
  return ASSIGNABLE_WORKOUTS.find((workout) => workout.id === templateId) ?? null
}

function getWorkoutTypeColors(trainingType = '') {
  const normalizedTrainingType = String(trainingType || '').trim().toLowerCase()

  if (normalizedTrainingType === 'warmup') {
    return WORKOUT_TYPE_COLORS.warmup
  }

  if (normalizedTrainingType === 'speed accelerator') {
    return WORKOUT_TYPE_COLORS.speedAccelerator
  }

  if (normalizedTrainingType === 'edge work') {
    return WORKOUT_TYPE_COLORS.edgeWork
  }

  if (normalizedTrainingType === 'conditioning') {
    return WORKOUT_TYPE_COLORS.conditioning
  }

  return WORKOUT_TYPE_COLORS.fallback
}

function formatDateForApi(date) {
  if (!date) return null
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function parseScheduledDate(dateValue) {
  if (!dateValue) return null
  return new Date(`${dateValue}T04:00:00.000Z`)
}

function mapAssignmentRowToCalendarEvent(row) {
  const template = getTemplateById(row.workout_template_id)
  const resolvedScheduledDate = row.program_days?.date ?? row.scheduled_date ?? null
  const resolvedTrainingType = row.workout_templates?.training_type ?? row.training_type ?? template?.trainingType ?? 'Workout'
  const resolvedTypeColors = getWorkoutTypeColors(resolvedTrainingType)

  return {
    id: row.id,
    programWorkoutId: row.id,
    athleteId: row.athlete_id ?? null,
    programId: row.program_id ?? null,
    title: row.name_snapshot || row.workout_templates?.name || 'Workout',
    startDate: parseScheduledDate(resolvedScheduledDate),
    endDate: parseScheduledDate(resolvedScheduledDate),
    trainingType: resolvedTrainingType,
    bgColor: resolvedTypeColors.bgColor,
    textColor: resolvedTypeColors.textColor,
    startHour: row.scheduled_start_time?.slice(0, 5) ?? '06:00',
    endHour: row.scheduled_end_time?.slice(0, 5) ?? '07:00',
    workoutTemplateId: row.workout_template_id ?? template?.id ?? null,
    persisted: true,
  }
}

function mapCalendarEventToAssignmentPayload(event) {
  const matchedTemplate = ASSIGNABLE_WORKOUTS.find((workout) => workout.id === event.workoutTemplateId)
    ?? ASSIGNABLE_WORKOUTS.find((workout) => workout.title === event.title)
    ?? ASSIGNABLE_WORKOUTS[0]

  return {
    id: event.id,
    workout_template_id: event.workoutTemplateId ?? matchedTemplate.id,
    name_snapshot: event.title,
    bg_color: event.bgColor ?? matchedTemplate.bgColor,
    text_color: event.textColor ?? matchedTemplate.textColor,
    status: 'scheduled',
    scheduled_date: formatDateForApi(event.startDate),
    scheduled_start_time: `${event.startHour}:00`,
    scheduled_end_time: `${event.endHour}:00`,
  }
}

function getPersistenceUnavailableMessage() {
  return 'Persistence unavailable until web Supabase env is configured.'
}

async function requestCalendarApi(path = '', options = {}) {
  const response = await fetch(`/api/admin/workout-calendar${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload?.error || 'Workout calendar request failed.'
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

async function requestProgramWorkoutApi(path = '', options = {}) {
  const response = await fetch(`/api/admin/program-workouts${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload?.error || 'Program workout request failed.'
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

async function requestWorkoutTemplatesApi() {
  const response = await fetch('/api/admin/workout-templates', {
    headers: {
      'Content-Type': 'application/json',
    },
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = payload?.error || 'Workout templates request failed.'
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  return payload
}

function getEventCardStyle(event) {
  return {
    backgroundColor: event.bgColor ?? WORKOUT_TYPE_COLORS.fallback.bgColor,
    color: event.textColor ?? WORKOUT_TYPE_COLORS.fallback.textColor,
    borderColor: event.textColor ?? WORKOUT_TYPE_COLORS.fallback.textColor,
  }
}

function getEventDotStyle(event) {
  return {
    backgroundColor: event.textColor ?? WORKOUT_TYPE_COLORS.fallback.textColor,
  }
}

function getEventTypeLabel(event) {
  if (event.typeLabel) {
    return event.typeLabel
  }

  return event.trainingType ?? 'Workout'
}

function buildDayPlaylistEventIds(events) {
  const playlistKeys = new Set()

  return events.flatMap((event) => {
    const playlistKey = `${event.startHour ?? '06:00'}-${event.title.trim().toLowerCase()}`
    if (playlistKeys.has(playlistKey)) {
      return []
    }

    playlistKeys.add(playlistKey)
    return [event.id]
  })
}

function DraggableWeekEventCard({ event, onOpenEventDialog }) {
  const draggable = useDraggable({
    id: event.id,
    data: {
      eventId: event.id,
      weekEvent: true,
    },
  })

  const transform = draggable.transform
    ? `translate3d(${Math.round(draggable.transform.x)}px, ${Math.round(draggable.transform.y)}px, 0)`
    : undefined

  return (
    <button
      ref={draggable.setNodeRef}
      data-week-event={event.id}
      style={{
        ...getEventCardStyle(event),
        transform,
        opacity: draggable.isDragging ? 0.55 : 1,
      }}
      type="button"
      aria-label="Open event editor"
      className="admin-shell-workouts-calendar-event-card grid h-full w-full min-w-0 cursor-grab touch-none select-none gap-1 rounded-[12px] border px-3 py-2 text-left transition-all hover:-translate-y-[1px] hover:opacity-95 active:cursor-grabbing"
      onClick={() => onOpenEventDialog(event.id)}
      {...draggable.listeners}
      {...draggable.attributes}
    >
      <div className="min-w-0 break-words text-[12px] font-semibold leading-[1.3] line-clamp-2">{event.title}</div>
      <div className="text-[11px] font-medium opacity-80">{event.startHour} - {event.endHour}</div>
    </button>
  )
}

function WeekSlotDropZone({ slotId, children }) {
  const droppable = useDroppable({ id: slotId })

  return (
    <div
      ref={droppable.setNodeRef}
      data-week-slot={slotId}
      className={[
        'min-h-[92px] rounded-[16px] transition-colors',
        droppable.isOver ? 'bg-[var(--admin-dashboard-control-hover-bg)]' : '',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function EventOverlayCard({ event }) {
  if (!event) return null

  return (
    <div
      className="grid min-w-[180px] gap-1 rounded-[16px] border px-3 py-3 text-left"
      style={getEventCardStyle(event)}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.12em]">{event.startHour}</div>
      <div className="text-sm font-semibold leading-tight">{event.title}</div>
      <div className="text-xs opacity-80">Ends {event.endHour}</div>
    </div>
  )
}

function DraggableMonthEventCard({ event, onOpenEventDialog }) {
  const draggable = useDraggable({
    id: event.id,
    data: {
      eventId: event.id,
      monthEvent: true,
    },
  })

  const transform = draggable.transform
    ? `translate3d(${Math.round(draggable.transform.x)}px, ${Math.round(draggable.transform.y)}px, 0)`
    : undefined

  return (
    <button
      ref={draggable.setNodeRef}
      type="button"
      aria-label="Open event editor"
      data-week-event={event.id}
      style={{
        ...getEventCardStyle(event),
        transform,
        opacity: draggable.isDragging ? 0.55 : 1,
      }}
      className="admin-shell-workouts-calendar-event-card grid min-h-[44px] w-full min-w-0 cursor-grab touch-none select-none gap-1 rounded-[10px] border px-2 py-1.5 text-left text-[11px] leading-[1.25] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3BE0AF] active:cursor-grabbing"
      onClick={() => onOpenEventDialog(event.id)}
      {...draggable.listeners}
      {...draggable.attributes}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="event-dot hidden h-2 w-2 shrink-0 rounded-full max-[900px]:inline-flex" style={getEventDotStyle(event)} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">{event.startHour}</span>
      </div>
      <div className="min-w-0 break-words text-[11px] font-semibold leading-[1.25] line-clamp-2">{event.title}</div>
    </button>
  )
}

function MonthDayDropZone({ slotId, children }) {
  const droppable = useDroppable({ id: slotId })

  return (
    <div
      ref={droppable.setNodeRef}
      data-month-slot={slotId}
      className={[
        'grid min-h-0 rounded-[12px] transition-colors',
        droppable.isOver ? 'bg-[var(--admin-dashboard-control-hover-bg)]' : '',
      ].join(' ')}
    >
      {children}
    </div>
  )
}

function StaticEventCard({ event, onOpenEventDialog }) {
  return (
    <button
      type="button"
      aria-label="Open event editor"
      data-week-event={event.id}
      className="admin-shell-workouts-calendar-event-card grid min-h-[44px] w-full min-w-0 gap-1 rounded-[10px] border px-2 py-1.5 text-left text-[11px] leading-[1.25] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3BE0AF]"
      style={getEventCardStyle(event)}
      onClick={() => onOpenEventDialog(event.id)}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="event-dot hidden h-2 w-2 shrink-0 rounded-full max-[900px]:inline-flex" style={getEventDotStyle(event)} />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">{event.startHour}</span>
      </div>
      <div className="min-w-0 break-words text-[11px] font-semibold leading-[1.25] line-clamp-2">{event.title}</div>
    </button>
  )
}

function renderMonthGrid(selectedDate, scheduledEvents, openEventDialog, openMonthOverflow) {
  const cells = createCalendarCells(selectedDate)

  return (
    <div className="admin-shell-workouts-calendar-month-grid overflow-x-auto rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)]">
      <div className="min-w-[840px] lg:min-w-[720px]">
        <div className="grid grid-cols-7 divide-x divide-[var(--admin-dashboard-card-border)] border-b border-[var(--admin-dashboard-card-border)]">
          {WEEK_DAYS.map((day) => (
            <div key={day} className="flex items-center justify-center py-2">
              <span className="text-xs font-medium text-[var(--admin-dashboard-card-muted)]">{day}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 overflow-hidden">
          {cells.map((cell) => {
            const events = getEventsForDate(cell.date, scheduledEvents)
            const isToday = isSameDay(cell.date, new Date())
            const visibleEvents = events.slice(0, 3)
            const slotId = encodeMonthSlotId(cell.date)

            return (
              <MonthDayDropZone key={cell.date.toISOString()} slotId={slotId}>
                <div className={['flex min-h-[128px] flex-col gap-1 border-l border-t border-[var(--admin-dashboard-card-border)] py-1.5 lg:pb-2 lg:pt-1', cell.date.getDay() === 0 ? 'border-l-0' : ''].join(' ')}>
                  <button
                    type="button"
                    onClick={() => openMonthOverflow(cell.date)}
                    className={[
                      'flex h-6 w-6 translate-x-1 items-center justify-center rounded-full text-xs font-semibold hover:bg-[var(--admin-dashboard-control-hover-bg)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3BE0AF] lg:px-2',
                      !cell.currentMonth ? 'opacity-20' : '',
                      isToday ? 'bg-[#3BE0AF] font-bold text-[#0B1120] hover:bg-[#3BE0AF]' : 'text-[var(--admin-dashboard-card-text)]',
                    ].join(' ')}
                  >
                    {cell.date.getDate()}
                  </button>

                  <div className={['grid gap-1 px-1.5 sm:px-2 lg:h-[94px] lg:gap-2 lg:px-0', !cell.currentMonth ? 'opacity-50' : ''].join(' ')}>
                    {[0, 1, 2].map((position) => {
                      const event = visibleEvents[position]
                      const eventKey = event ? `event-${event.id}-${position}` : `empty-${position}`

                      return (
                        <div key={eventKey} className="flex-1 px-2.5">
                          {event ? (
                            <DraggableMonthEventCard event={event} onOpenEventDialog={openEventDialog} />
                          ) : null}
                        </div>
                      )
                    })}
                  </div>

                  {events.length > 3 ? (
                    <button
                      type="button"
                      aria-label="Open workout overflow for day"
                      className={['h-4.5 px-1.5 text-left text-xs font-semibold text-[var(--admin-dashboard-card-muted)] hover:text-[var(--admin-dashboard-card-text)]', !cell.currentMonth ? 'opacity-50' : ''].join(' ')}
                      onClick={() => openMonthOverflow(cell.date)}
                    >
                      <span className="sm:hidden">+{events.length - 3}</span>
                      <span className="hidden sm:inline">{events.length - 3} more...</span>
                    </button>
                  ) : null}
                </div>
              </MonthDayDropZone>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function renderDayGrid(
  selectedDate,
  scheduledEvents,
  openAssignmentDialog,
  openEventDialog,
  moveEventByHours,
  activeDragEventId,
) {
  return renderWeekGrid(
    selectedDate,
    scheduledEvents,
    openAssignmentDialog,
    openEventDialog,
    moveEventByHours,
    activeDragEventId,
    { singleDay: true },
  )
}

function renderYearGrid(selectedDate, scheduledEvents, setSelectedDate, setCurrentView) {
  const year = selectedDate.getFullYear()
  const months = Array.from({ length: 12 }, (_, monthIndex) => new Date(year, monthIndex, 1))

  return (
    <div className="grid gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {months.map((monthDate) => {
        const cells = createCalendarCells(monthDate).slice(0, 35)
        const monthEvents = scheduledEvents.filter((event) => {
          return event.startDate.getFullYear() === year && event.startDate.getMonth() === monthDate.getMonth()
        })

        return (
          <button
            key={monthDate.toISOString()}
            type="button"
            className="grid gap-3 rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-4 text-left hover:border-[var(--admin-shell-accent)]"
            onClick={() => {
              setSelectedDate(monthDate)
              setCurrentView('month')
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{new Intl.DateTimeFormat('en-US', { month: 'long' }).format(monthDate)}</div>
              <div className="text-xs text-[var(--admin-dashboard-card-muted)]">{monthEvents.length} workout{monthEvents.length === 1 ? '' : 's'}</div>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[var(--admin-dashboard-card-muted)]">
              {WEEK_DAYS.map((day) => <span key={day}>{day.slice(0, 1)}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-[var(--admin-dashboard-card-text)]">
              {cells.map((cell) => {
                const hasEvents = getEventsForDate(cell.date, scheduledEvents).length > 0
                return (
                  <span
                    key={cell.date.toISOString()}
                    className={[
                      'grid h-7 place-items-center rounded-[8px]',
                      cell.currentMonth ? 'bg-[var(--admin-dashboard-card-bg)]' : 'bg-[var(--admin-dashboard-card-bg)]/50 text-[var(--admin-dashboard-card-soft)]',
                      hasEvents ? 'ring-1 ring-[#3BE0AF]/45' : '',
                    ].join(' ')}
                  >
                    {cell.date.getDate()}
                  </span>
                )
              })}
            </div>
          </button>
        )
      })}
    </div>
  )
}

function renderAgendaView(selectedDate, scheduledEvents, openEventDialog) {
  const agendaEvents = [...scheduledEvents]
    .filter((event) => {
      return event.startDate.getFullYear() === selectedDate.getFullYear() && event.startDate.getMonth() === selectedDate.getMonth()
    })
    .sort((left, right) => {
      const leftKey = `${left.startDate.toISOString()}-${left.startHour}`
      const rightKey = `${right.startDate.toISOString()}-${right.startHour}`
      return leftKey.localeCompare(rightKey)
    })

  const groupedEvents = agendaEvents.reduce((groups, event) => {
    const key = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(event.startDate)
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(event)
    return groups
  }, {})

  return (
    <div className="grid gap-4">
      {Object.entries(groupedEvents).length ? Object.entries(groupedEvents).map(([dayLabel, dayEvents]) => (
        <div key={dayLabel} className="grid gap-3">
          <div className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{dayLabel}</div>
          <div className="grid gap-2">
            {dayEvents.map((event) => (
              <button
                key={event.id}
                type="button"
                className="grid gap-1 rounded-[14px] border px-3 py-3 text-left"
                style={getEventCardStyle(event)}
                onClick={() => openEventDialog(event.id)}
              >
                <div className="text-xs font-semibold opacity-80">{event.startHour} - {event.endHour}</div>
                <div className="text-sm font-semibold">{event.title}</div>
              </button>
            ))}
          </div>
        </div>
      )) : (
        <div className="rounded-[18px] border border-dashed border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-6 text-sm text-[var(--admin-dashboard-card-muted)]">No workouts scheduled for this month.</div>
      )}
    </div>
  )
}

function renderWeekGrid(
  selectedDate,
  scheduledEvents,
  openAssignmentDialog,
  openEventDialog,
  moveEventByHours,
  activeDragEventId,
  options = {},
) {
  const singleDay = options.singleDay === true
  const weekDays = singleDay ? [selectedDate] : createWeekDays(selectedDate)
  const { startMinutes: calendarStartMinutes, endMinutes: calendarEndMinutes } = getWeekViewBoundsInMinutes()
  const calendarHeight = WEEK_HOURS.length * WEEK_SLOT_HEIGHT

  return (
    <div className="admin-shell-workouts-calendar-week-grid overflow-x-auto rounded-[24px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)]">
      <div className="min-w-[280px] sm:min-w-[560px]">
        <div className="border-b border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-5 py-4">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">{singleDay ? 'Daily schedule' : 'Weekly schedule'}</div>
        </div>

        <div className={`grid ${singleDay ? 'grid-cols-[92px_minmax(0,1fr)]' : 'grid-cols-[92px_repeat(7,minmax(0,1fr))]'} border-b border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)]`}>
          <div className="border-r border-[var(--admin-dashboard-card-border)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">Time</div>
          {weekDays.map((day) => {
            const isToday = isSameDay(day, new Date())

            return (
              <div key={day.toISOString()} className="border-r border-[var(--admin-dashboard-card-border)] px-3 py-3 text-center last:border-r-0">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">{singleDay ? new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(day) : WEEK_DAYS[day.getDay()]}</div>
                <div className={['mt-1 text-sm font-semibold', isToday ? 'text-[#3BE0AF]' : 'text-[var(--admin-dashboard-card-text)]'].join(' ')}>{day.getDate()}</div>
              </div>
            )
          })}
        </div>

        <div className={`grid ${singleDay ? 'grid-cols-[92px_minmax(0,1fr)]' : 'grid-cols-[92px_repeat(7,minmax(0,1fr))]'}`}>
          <div className="border-r border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)]">
            {WEEK_HOURS.map((hour) => (
              <div
                key={hour}
                className="border-b border-[var(--admin-dashboard-card-border)] px-4 py-3 text-xs font-medium text-[var(--admin-dashboard-card-muted)]"
                style={{ height: `${WEEK_SLOT_HEIGHT}px` }}
              >
                {hour}
              </div>
            ))}
          </div>

          {weekDays.map((day) => {
            const dayEvents = getEventsForDate(day, scheduledEvents)
              .filter((event) => {
                const eventStartMinutes = convertHourStringToMinutes(event.startHour)
                return eventStartMinutes >= calendarStartMinutes && eventStartMinutes < calendarEndMinutes
              })
              .sort((left, right) => convertHourStringToMinutes(left.startHour) - convertHourStringToMinutes(right.startHour))

            return (
              <div key={day.toISOString()} className="relative border-r border-[var(--admin-dashboard-card-border)] last:border-r-0" style={{ height: `${calendarHeight}px` }}>
                <div className="absolute inset-0">
                  {WEEK_HOURS.map((hour) => {
                    const slotId = encodeWeekSlotId(day, hour)

                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className="relative border-b border-[var(--admin-dashboard-card-border)] px-2 py-2"
                        style={{ height: `${WEEK_SLOT_HEIGHT}px` }}
                      >
                        <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-[var(--admin-dashboard-chart-header-divider)]" />
                        <WeekSlotDropZone slotId={slotId}>
                          <button
                            type="button"
                            aria-label="Open assignment composer"
                            className="absolute inset-0 z-0 w-full rounded-[12px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#3BE0AF]"
                            onClick={() => openAssignmentDialog(day, hour)}
                          >
                            <span className="sr-only">Assign workout</span>
                          </button>
                        </WeekSlotDropZone>
                      </div>
                    )
                  })}
                </div>

                <div className="pointer-events-none absolute inset-0 z-10">
                  {dayEvents.map((event) => {
                    const layout = getWeekEventLayout(event)

                    return (
                      <div
                        key={event.id}
                        className="pointer-events-none absolute inset-x-2.5"
                        style={{ top: `${layout.topOffset + 6}px`, height: `${Math.max(layout.height - 12, 32)}px` }}
                      >
                        <div className="pointer-events-auto h-full">
                          <DraggableWeekEventCard event={event} onOpenEventDialog={openEventDialog} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function WorkoutsCalendarView({ selectedAthleteId = '', onOpenProgramWorkoutEditor = null }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const forceDenseDayPreview = searchParams.get('debugDenseDay') === '1'
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 4, 4))
  const [currentView, setCurrentView] = useState('month')
  const [scheduledEvents, setScheduledEvents] = useState([])
  const [hydrationState, setHydrationState] = useState('idle')
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [assignmentDraft, setAssignmentDraft] = useState(() => createAssignmentDraft())
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [workoutTemplateOptions, setWorkoutTemplateOptions] = useState([])
  const [workoutTemplateHydrationState, setWorkoutTemplateHydrationState] = useState('idle')
  const [workoutTemplatePagination, setWorkoutTemplatePagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  })
  const [isMonthOverflowDialogOpen, setIsMonthOverflowDialogOpen] = useState(false)
  const [monthOverflowDate, setMonthOverflowDate] = useState(null)
  const [dayPlaylistEventIds, setDayPlaylistEventIds] = useState([])
  const [dayPlaylistRawCount, setDayPlaylistRawCount] = useState(0)
  const [dayPlaylistIndex, setDayPlaylistIndex] = useState(0)
  const [completedDayPlaylistEventIds, setCompletedDayPlaylistEventIds] = useState([])
  const [assignmentConflictMessage, setAssignmentConflictMessage] = useState('')
  const [eventConflictMessage, setEventConflictMessage] = useState('')
  const [activeDragEventId, setActiveDragEventId] = useState(null)
  const [isProgramWorkoutEditorOpen, setIsProgramWorkoutEditorOpen] = useState(false)
  const [programWorkoutEditorDraft, setProgramWorkoutEditorDraft] = useState(null)
  const [programWorkoutEditorLoadState, setProgramWorkoutEditorLoadState] = useState('idle')
  const [programWorkoutEditorError, setProgramWorkoutEditorError] = useState('')
  const [programWorkoutEditorDetailsValues, setProgramWorkoutEditorDetailsValues] = useState(() => createWorkoutEditorDetailsValues())
  const [programWorkoutEditorTrainingSections, setProgramWorkoutEditorTrainingSections] = useState([])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const rangeLabel = useMemo(() => {
    switch (currentView) {
      case 'day':
        return formatDayLabel(selectedDate)
      case 'week':
        return formatWeekLabel(selectedDate)
      case 'year':
        return formatYearLabel(selectedDate)
      case 'agenda':
        return formatMonthRangeLabel(selectedDate)
      default:
        return selectedDate.getFullYear() === 2026 && selectedDate.getMonth() === 4
          ? REFERENCE_MONTH_RANGE_LABEL
          : formatMonthRangeLabel(selectedDate)
    }
  }, [currentView, selectedDate])

  const monthLabel = useMemo(() => {
    switch (currentView) {
      case 'day':
        return new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(selectedDate)
      case 'week':
        return 'Week view'
      case 'year':
        return formatYearLabel(selectedDate)
      case 'agenda':
        return 'Agenda'
      default:
        return formatMonthLabel(selectedDate)
    }
  }, [currentView, selectedDate])
  const referenceDateBadgeMonth = 'MAY'
  const referenceDateBadgeDay = String(REFERENCE_TODAY.getDate())

  const selectedTemplate = useMemo(() => {
    return workoutTemplateOptions.find((workout) => workout.id === assignmentDraft.selectedWorkoutId) ?? workoutTemplateOptions[0] ?? null
  }, [assignmentDraft.selectedWorkoutId, workoutTemplateOptions])

  const workoutTemplatePageSizeOptions = [5, 10, 20, 30]
  const visibleWorkoutTemplateOptions = useMemo(() => {
    const startIndex = workoutTemplatePagination.pageIndex * workoutTemplatePagination.pageSize
    return workoutTemplateOptions.slice(startIndex, startIndex + workoutTemplatePagination.pageSize)
  }, [workoutTemplateOptions, workoutTemplatePagination])
  const workoutTemplatePageCount = Math.max(1, Math.ceil(workoutTemplateOptions.length / workoutTemplatePagination.pageSize))
  const workoutTemplatePageNumbers = Array.from({ length: workoutTemplatePageCount }, (_, index) => index)
  const workoutTemplatePageStart = workoutTemplateOptions.length === 0 ? 0 : workoutTemplatePagination.pageIndex * workoutTemplatePagination.pageSize + 1
  const workoutTemplatePageEnd = Math.min((workoutTemplatePagination.pageIndex + 1) * workoutTemplatePagination.pageSize, workoutTemplateOptions.length)
  const workoutTemplateSkeletonRows = Array.from({ length: workoutTemplatePagination.pageSize }, (_, rowIndex) => rowIndex)

  const calendarEvents = useMemo(() => {
    if (!forceDenseDayPreview) {
      return scheduledEvents
    }

    const scheduledEventIds = new Set(scheduledEvents.map((event) => event.id))
    return [...scheduledEvents, ...DEBUG_DENSE_DAY_EVENTS.filter((event) => !scheduledEventIds.has(event.id))]
  }, [forceDenseDayPreview, scheduledEvents])
  const referenceEventCountLabel = '44 workouts'

  const selectedEvent = useMemo(() => {
    return calendarEvents.find((event) => event.id === selectedEventId) ?? null
  }, [calendarEvents, selectedEventId])

  const monthOverflowEvents = useMemo(() => {
    if (!monthOverflowDate) {
      return []
    }

    return [...getEventsForDate(monthOverflowDate, calendarEvents)].sort((left, right) => {
      const leftHour = left.startHour ?? '06:00'
      const rightHour = right.startHour ?? '06:00'
      return leftHour.localeCompare(rightHour)
    })
  }, [calendarEvents, monthOverflowDate])

  const activeDayPlaylistEvents = useMemo(() => {
    return dayPlaylistEventIds
      .map((eventId) => calendarEvents.find((event) => event.id === eventId) ?? null)
      .filter(Boolean)
  }, [calendarEvents, dayPlaylistEventIds])

  const unresolvedDayPlaylistEventIds = useMemo(() => {
    return activeDayPlaylistEvents
      .map((event) => event.id)
      .filter((eventId) => !completedDayPlaylistEventIds.includes(eventId))
  }, [activeDayPlaylistEvents, completedDayPlaylistEventIds])

  const activeDayPlaylistDedupedCount = activeDayPlaylistEvents.length
  const activeDayPlaylistRawCount = dayPlaylistRawCount
  const isDayPlaylistActive = activeDayPlaylistEvents.length > 1

  const activeDragEvent = useMemo(() => {
    return calendarEvents.find((event) => event.id === activeDragEventId) ?? null
  }, [activeDragEventId, calendarEvents])

  function updateCalendarQueryParams(updates = {}) {
    const nextParams = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') {
        nextParams.delete(key)
        return
      }

      nextParams.set(key, String(value))
    })

    const nextQueryString = nextParams.toString()
    router.replace(`${pathname}${nextQueryString ? `?${nextQueryString}` : ''}`, { scroll: false })
  }

  function closeProgramWorkoutEditorSeam() {
    setIsProgramWorkoutEditorOpen(false)
    setProgramWorkoutEditorDraft(null)
    setProgramWorkoutEditorLoadState('idle')
    setProgramWorkoutEditorError('')
    setProgramWorkoutEditorDetailsValues(createWorkoutEditorDetailsValues())
    setProgramWorkoutEditorTrainingSections([])
    updateCalendarQueryParams({
      calendarOverlay: null,
      calendarProgramWorkoutId: null,
      calendarScheduledDate: null,
      calendarStartTime: null,
      calendarEndTime: null,
      calendarDayPlaylistIndex: null,
      calendarDayPlaylistCount: null,
    })
  }

  useEffect(() => {
    if (!forceDenseDayPreview) {
      return
    }

    setCurrentView('month')
    setSelectedDate(new Date(DEBUG_DENSE_DAY_DATE.getFullYear(), DEBUG_DENSE_DAY_DATE.getMonth(), 1))
    setMonthOverflowDate(new Date(DEBUG_DENSE_DAY_DATE))
    setIsMonthOverflowDialogOpen(true)
  }, [forceDenseDayPreview])

  useEffect(() => {
    if (!isAssignmentDialogOpen) {
      return
    }

    if (assignmentDraft.selectedWorkoutId) {
      return
    }

    const firstTemplateId = workoutTemplateOptions[0]?.id ?? null
    if (!firstTemplateId) {
      return
    }

    setAssignmentDraft((currentDraft) => ({
      ...currentDraft,
      selectedWorkoutId: currentDraft.selectedWorkoutId ?? firstTemplateId,
    }))
  }, [assignmentDraft.selectedWorkoutId, isAssignmentDialogOpen, workoutTemplateOptions])

  useEffect(() => {
    setWorkoutTemplatePagination((current) => {
      const maxPageIndex = Math.max(0, Math.ceil(workoutTemplateOptions.length / current.pageSize) - 1)
      if (current.pageIndex <= maxPageIndex) {
        return current
      }

      return {
        ...current,
        pageIndex: maxPageIndex,
      }
    })
  }, [workoutTemplateOptions.length])

  async function loadWorkoutTemplateOptions() {
    setWorkoutTemplateHydrationState('loading')

    try {
      const payload = await requestWorkoutTemplatesApi()
      const hydratedWorkoutTemplates = (Array.isArray(payload.workoutTemplates) ? payload.workoutTemplates : [])
        .map(normalizeWorkoutTemplateOption)
        .filter(Boolean)
      setWorkoutTemplateOptions(hydratedWorkoutTemplates)
      setWorkoutTemplatePagination((current) => ({
        ...current,
        pageIndex: 0,
      }))
      setWorkoutTemplateHydrationState('ready')
    } catch (error) {
      setWorkoutTemplateOptions([])
      setWorkoutTemplateHydrationState('error')
      setAssignmentConflictMessage(error?.message || 'Failed to load workout templates.')
    }
  }

  async function loadPersistedCalendarAssignments() {
    if (forceDenseDayPreview) {
      setScheduledEvents(WORKOUT_EVENTS)
      setHydrationState('ready')
      setEventConflictMessage('')
      return
    }

    setHydrationState('loading')

    try {
      const calendarAssignmentsPath = selectedAthleteId
        ? `?athleteId=${encodeURIComponent(selectedAthleteId)}`
        : ''
      const payload = await requestCalendarApi(calendarAssignmentsPath)
      const assignments = Array.isArray(payload.assignments) ? payload.assignments : []
      const hydratedEvents = assignments
        .map(mapAssignmentRowToCalendarEvent)
        .filter((event) => event.startDate && event.startHour)
      setScheduledEvents(hydratedEvents)

      const firstHydratedEvent = [...hydratedEvents].sort((left, right) => left.startDate - right.startDate)[0]
      if (firstHydratedEvent?.startDate) {
        setSelectedDate(new Date(firstHydratedEvent.startDate))
      }

      setHydrationState('ready')
      setEventConflictMessage('')
    } catch (error) {
      if (error?.status === 503) {
        setHydrationState('unavailable')
        setEventConflictMessage(getPersistenceUnavailableMessage())
        return
      }

      setHydrationState('error')
      setEventConflictMessage(error?.message || 'Failed to load persisted workout calendar assignments.')
    }
  }

  useEffect(() => {
    loadPersistedCalendarAssignments()
  }, [forceDenseDayPreview, selectedAthleteId])

  useEffect(() => {
    loadWorkoutTemplateOptions()
  }, [])

  async function createPersistedAssignment(event) {
    const payload = {
      ...mapCalendarEventToAssignmentPayload(event),
      athlete_id: selectedAthleteId || null,
    }
    const response = await requestCalendarApi('', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return mapAssignmentRowToCalendarEvent(response.assignment)
  }

  async function updatePersistedAssignment(event) {
    const payload = mapCalendarEventToAssignmentPayload(event)
    const response = await requestCalendarApi('', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    })
    return mapAssignmentRowToCalendarEvent(response.assignment)
  }

  async function deletePersistedAssignment(eventId) {
    await requestCalendarApi(`?id=${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
    })
  }

  function openMonthOverflow(date) {
    setMonthOverflowDate(date)
    setIsMonthOverflowDialogOpen(true)
  }

  function openAllDayWorkouts(events) {
    const firstEvent = events[0]
    if (!firstEvent) {
      return
    }

    const eventIds = buildDayPlaylistEventIds(events)
    setDayPlaylistEventIds(eventIds)
    setDayPlaylistRawCount(events.length)
    setCompletedDayPlaylistEventIds([])
    setDayPlaylistIndex(0)
    openEventDialog(firstEvent.id, { dayPlaylistEventIds: eventIds, dayPlaylistIndex: 0, dayPlaylistRawCount: events.length })
  }

  async function openProgramWorkoutEditorWithDraft(nextProgramWorkoutEditorDraft) {
    if (!nextProgramWorkoutEditorDraft?.programWorkoutId) {
      setProgramWorkoutEditorError('Program workout ID missing for editor handoff.')
      setIsProgramWorkoutEditorOpen(true)
      setProgramWorkoutEditorLoadState('error')
      return
    }

    setProgramWorkoutEditorDraft(nextProgramWorkoutEditorDraft)
    setIsProgramWorkoutEditorOpen(true)
    setProgramWorkoutEditorLoadState('loading')
    setProgramWorkoutEditorError('')

    try {
      const payload = await requestProgramWorkoutApi(`/${encodeURIComponent(nextProgramWorkoutEditorDraft.programWorkoutId)}`)
      const programWorkoutTree = payload?.programWorkoutTree ?? null
      setProgramWorkoutEditorDetailsValues(createWorkoutEditorDetailsValues(programWorkoutTree))
      setProgramWorkoutEditorTrainingSections(mapProgramWorkoutTreeToTrainingSections(programWorkoutTree))
      setProgramWorkoutEditorLoadState('ready')
    } catch (error) {
      setProgramWorkoutEditorError(error?.message || 'Failed to load program workout editor data.')
      setProgramWorkoutEditorLoadState('error')
    }
  }

  async function saveProgramWorkoutEditor() {
    if (!programWorkoutEditorDraft?.programWorkoutId) {
      setProgramWorkoutEditorError('Program workout ID missing for save.')
      return
    }

    setProgramWorkoutEditorLoadState('saving')
    setProgramWorkoutEditorError('')

    try {
      const detailsPayload = {
        name_snapshot: programWorkoutEditorDetailsValues.name,
        notes: programWorkoutEditorDetailsValues.description,
        status: programWorkoutEditorDetailsValues.status,
        scheduled_date: programWorkoutEditorDraft.scheduledDate,
        scheduled_start_time: programWorkoutEditorDraft.scheduledStartTime ? `${programWorkoutEditorDraft.scheduledStartTime}:00` : null,
        end_date: programWorkoutEditorDraft.scheduledDate,
        scheduled_end_time: programWorkoutEditorDraft.scheduledEndTime ? `${programWorkoutEditorDraft.scheduledEndTime}:00` : null,
      }

      const payload = await requestProgramWorkoutApi(`/${encodeURIComponent(programWorkoutEditorDraft.programWorkoutId)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          details: detailsPayload,
          trainingSections: programWorkoutEditorTrainingSections,
        }),
      })

      const programWorkoutTree = payload?.programWorkoutTree ?? null
      setProgramWorkoutEditorDetailsValues(createWorkoutEditorDetailsValues(programWorkoutTree))
      setProgramWorkoutEditorTrainingSections(mapProgramWorkoutTreeToTrainingSections(programWorkoutTree))
      await loadPersistedCalendarAssignments()
      setProgramWorkoutEditorLoadState('ready')
      closeProgramWorkoutEditorSeam()
    } catch (error) {
      setProgramWorkoutEditorError(error?.message || 'Failed to save program workout changes.')
      setProgramWorkoutEditorLoadState('error')
    }
  }

  function openAssignmentDialog(date, hour) {
    setSelectedEventId(null)
    closeProgramWorkoutEditorSeam()
    setDayPlaylistEventIds([])
    setDayPlaylistRawCount(0)
    setCompletedDayPlaylistEventIds([])
    setDayPlaylistIndex(0)
    setAssignmentDraft(createAssignmentDraft(date, hour))
    setAssignmentConflictMessage('')
    setEventConflictMessage('')
    setIsAssignmentDialogOpen(true)
  }

  function openEventDialog(
    eventId,
    { dayPlaylistEventIds: nextPlaylistEventIds = [], dayPlaylistIndex: nextDayPlaylistIndex = 0, dayPlaylistRawCount: nextDayPlaylistRawCount = 0 } = {},
  ) {
    const event = calendarEvents.find((entry) => entry.id === eventId)
    if (!event) {
      return
    }

    setIsMonthOverflowDialogOpen(false)
    setMonthOverflowDate(null)
    setSelectedEventId(eventId)
    setDayPlaylistEventIds(nextPlaylistEventIds)
    setDayPlaylistRawCount(nextDayPlaylistRawCount || nextPlaylistEventIds.length)
    if (!nextPlaylistEventIds.length) {
      setCompletedDayPlaylistEventIds([])
    }
    setDayPlaylistIndex(nextDayPlaylistIndex)
    setAssignmentDraft(createAssignmentDraft(event.startDate, event.startHour, event.workoutTemplateId))
    setAssignmentConflictMessage('')
    setEventConflictMessage('')

    const nextProgramWorkoutEditorDraft = createProgramWorkoutEditorDraft(event, {
      athleteId: selectedAthleteId,
      dayPlaylistEventIds: nextPlaylistEventIds,
      dayPlaylistIndex: nextDayPlaylistIndex,
      dayPlaylistRawCount: nextDayPlaylistRawCount || nextPlaylistEventIds.length,
    })

    setIsAssignmentDialogOpen(false)
    updateCalendarQueryParams({
      calendarOverlay: 'program-workout-editor',
      calendarProgramWorkoutId: nextProgramWorkoutEditorDraft?.programWorkoutId,
      calendarScheduledDate: nextProgramWorkoutEditorDraft?.scheduledDate,
      calendarStartTime: nextProgramWorkoutEditorDraft?.scheduledStartTime,
      calendarEndTime: nextProgramWorkoutEditorDraft?.scheduledEndTime,
      calendarDayPlaylistIndex: nextProgramWorkoutEditorDraft ? nextProgramWorkoutEditorDraft.dayPlaylistIndex + 1 : null,
      calendarDayPlaylistCount: nextProgramWorkoutEditorDraft?.dayPlaylistRawCount || null,
    })

    if (typeof onOpenProgramWorkoutEditor === 'function') {
      onOpenProgramWorkoutEditor(nextProgramWorkoutEditorDraft)
      return
    }

    void openProgramWorkoutEditorWithDraft(nextProgramWorkoutEditorDraft)
  }

  function goToDayPlaylistEvent(nextIndex) {
    const nextEvent = activeDayPlaylistEvents[nextIndex]
    if (!nextEvent) {
      return
    }

    openEventDialog(nextEvent.id, {
      dayPlaylistEventIds,
      dayPlaylistIndex: nextIndex,
      dayPlaylistRawCount,
    })
  }

  function reopenMonthOverflowFromPlaylist() {
    const overflowDate = selectedEvent?.startDate ?? monthOverflowDate
    if (!overflowDate) {
      return
    }

    setIsAssignmentDialogOpen(false)
    closeProgramWorkoutEditorSeam()
    setMonthOverflowDate(new Date(overflowDate))
    setIsMonthOverflowDialogOpen(true)
  }

  async function moveEventToSlot(eventId, date, hour) {
    const event = scheduledEvents.find((entry) => entry.id === eventId)
    if (!event) {
      return false
    }

    if (hydrationState !== 'ready') {
      setEventConflictMessage(getPersistenceUnavailableMessage())
      return false
    }

    if (!WEEK_HOURS.includes(hour)) {
      setEventConflictMessage('Cannot move past the calendar time range.')
      return false
    }

    if (
      hasSchedulingConflict({
        events: scheduledEvents,
        date,
        startHour: hour,
        excludeEventId: event.id,
      })
    ) {
      setEventConflictMessage('Another workout is already scheduled in this slot.')
      return false
    }

    try {
      const updatedEvent = await updatePersistedAssignment({
        ...event,
        startDate: date,
        endDate: date,
        startHour: hour,
        endHour: getEventEndHour(hour),
      })
      setScheduledEvents((currentEvents) => currentEvents.map((currentEvent) => {
        if (currentEvent.id !== event.id) {
          return currentEvent
        }

        return updatedEvent
      }))
      setEventConflictMessage('')
      return true
    } catch (error) {
      setEventConflictMessage(error?.message || 'Failed to persist drag move.')
      return false
    }
  }

  async function moveMonthEventToDate(eventId, date) {
    const event = scheduledEvents.find((entry) => entry.id === eventId)
    if (!event) {
      return false
    }

    return moveEventToSlot(eventId, date, event.startHour)
  }

  function handleWeekEventDragStart(event) {
    setActiveDragEventId(String(event.active.id))
  }

  async function handleWeekEventDragEnd(event) {
    const eventId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : ''
    const targetSlot = parseWeekSlotId(overId)

    if (targetSlot) {
      await moveEventToSlot(eventId, targetSlot.date, targetSlot.hour)
    }

    setActiveDragEventId(null)
  }

  async function handleMonthEventDragEnd(event) {
    const eventId = String(event.active.id)
    const overId = event.over?.id ? String(event.over.id) : ''
    const targetSlot = parseMonthSlotId(overId)

    if (targetSlot) {
      await moveMonthEventToDate(eventId, targetSlot.date)
    }

    setActiveDragEventId(null)
  }

  async function createAssignment() {
    if (!selectedTemplate) {
      setAssignmentConflictMessage('Choose a real workout template before saving.')
      return
    }

    if (!assignmentDraft.date || !assignmentDraft.hour || !assignmentDraft.endDate || !assignmentDraft.endHour) {
      setAssignmentConflictMessage('Choose a start date/time and end date/time before saving.')
      return
    }

    if (!isSameDay(assignmentDraft.date, assignmentDraft.endDate)) {
      setAssignmentConflictMessage('End date must match the start date for calendar workout scheduling.')
      return
    }

    if (convertHourStringToMinutes(assignmentDraft.endHour) <= convertHourStringToMinutes(assignmentDraft.hour)) {
      setAssignmentConflictMessage('End time must be after the start time.')
      return
    }

    if (hydrationState !== 'ready') {
      setAssignmentConflictMessage(getPersistenceUnavailableMessage())
      return
    }

    if (
      hasSchedulingConflict({
        events: scheduledEvents,
        date: assignmentDraft.date,
        startHour: assignmentDraft.hour,
      })
    ) {
      setAssignmentConflictMessage('Another workout is already scheduled in this slot.')
      return
    }

    try {
      const createdEvent = await createPersistedAssignment({
        id: null,
        title: selectedTemplate.title,
        trainingType: selectedTemplate.trainingType,
        bgColor: selectedTemplate.bgColor,
        textColor: selectedTemplate.textColor,
        startDate: assignmentDraft.date,
        endDate: assignmentDraft.endDate,
        startHour: assignmentDraft.hour,
        endHour: assignmentDraft.endHour,
        workoutTemplateId: selectedTemplate.id,
      })
      setScheduledEvents((currentEvents) => [...currentEvents, createdEvent])
      setAssignmentConflictMessage('')
      setIsAssignmentDialogOpen(false)
      setAssignmentDraft(createAssignmentDraft())
    } catch (error) {
      setAssignmentConflictMessage(error?.message || 'Failed to persist workout assignment.')
    }
  }

  async function updateScheduledEvent({ advanceToNext = false } = {}) {
    if (!selectedEvent || !assignmentDraft.hour) {
      return false
    }

    if (hydrationState !== 'ready') {
      setEventConflictMessage(getPersistenceUnavailableMessage())
      return false
    }

    if (
      hasSchedulingConflict({
        events: scheduledEvents,
        date: selectedEvent.startDate,
        startHour: assignmentDraft.hour,
        excludeEventId: selectedEvent.id,
      })
    ) {
      setEventConflictMessage('Another workout is already scheduled in this slot.')
      return false
    }

    try {
      const updatedEvent = await updatePersistedAssignment({
        ...selectedEvent,
        title: selectedTemplate.title,
        trainingType: selectedTemplate.trainingType,
        bgColor: selectedTemplate.bgColor,
        textColor: selectedTemplate.textColor,
        startHour: assignmentDraft.hour,
        endHour: getEventEndHour(assignmentDraft.hour, selectedTemplate.durationHours),
        workoutTemplateId: selectedTemplate.id,
      })
      setScheduledEvents((currentEvents) => currentEvents.map((event) => {
        if (event.id !== updatedEvent.id) {
          return event
        }

        return updatedEvent
      }))
      setEventConflictMessage('')
      setAssignmentConflictMessage('')
      setCompletedDayPlaylistEventIds((currentIds) => currentIds.includes(selectedEvent.id) ? currentIds : [...currentIds, selectedEvent.id])

      if (advanceToNext && dayPlaylistIndex < activeDayPlaylistEvents.length - 1) {
        const nextUnresolvedEventId = unresolvedDayPlaylistEventIds.find((eventId) => eventId !== selectedEvent.id)
        const nextEventId = nextUnresolvedEventId ?? activeDayPlaylistEvents[dayPlaylistIndex + 1]?.id ?? null
        if (nextEventId) {
          const nextIndex = activeDayPlaylistEvents.findIndex((event) => event.id === nextEventId)
          const nextEvent = activeDayPlaylistEvents[nextIndex]
          if (nextEvent && nextIndex >= 0) {
            setSelectedEventId(nextEvent.id)
            setDayPlaylistIndex(nextIndex)
            setAssignmentDraft(createAssignmentDraft(nextEvent.startDate, nextEvent.startHour, nextEvent.workoutTemplateId))
            return true
          }
        }
      }

      setSelectedEventId(null)
      setAssignmentDraft(createAssignmentDraft())
      setIsAssignmentDialogOpen(false)
      return true
    } catch (error) {
      setEventConflictMessage(error?.message || 'Failed to persist scheduled workout changes.')
      return false
    }
  }

  async function saveAndAdvanceDayPlaylist() {
    await updateScheduledEvent({ advanceToNext: true })
  }

  async function deleteScheduledEvent() {
    if (!selectedEvent) {
      return
    }

    if (hydrationState !== 'ready') {
      setEventConflictMessage(getPersistenceUnavailableMessage())
      return
    }

    try {
      await deletePersistedAssignment(selectedEvent.id)
      setScheduledEvents((currentEvents) => currentEvents.filter((event) => event.id !== selectedEvent.id))
      setEventConflictMessage('')
      setAssignmentConflictMessage('')
      setSelectedEventId(null)
      setAssignmentDraft(createAssignmentDraft())
      setIsAssignmentDialogOpen(false)
    } catch (error) {
      setEventConflictMessage(error?.message || 'Failed to delete persisted workout assignment.')
    }
  }

  async function moveEventByHours(eventId, direction) {
    const event = scheduledEvents.find((entry) => entry.id === eventId)
    if (!event) {
      return
    }

    const currentIndex = WEEK_HOURS.indexOf(event.startHour)
    const nextIndex = currentIndex + direction

    if (nextIndex < 0 || nextIndex >= WEEK_HOURS.length) {
      setEventConflictMessage('Cannot move past the calendar time range.')
      return
    }

    const nextHour = WEEK_HOURS[nextIndex]
    await moveEventToSlot(event.id, event.startDate, nextHour)
  }

  function changeCalendarView(nextView) {
    setCurrentView(nextView)
    setActiveDragEventId(null)
    setEventConflictMessage('')
    setAssignmentConflictMessage('')
    setIsMonthOverflowDialogOpen(false)
    setMonthOverflowDate(null)
  }

  const shiftDate = (delta) => {
    setSelectedDate((currentDate) => {
      switch (currentView) {
        case 'day':
          return shiftDay(currentDate, delta)
        case 'week':
          return shiftWeek(currentDate, delta)
        case 'year':
          return shiftYear(currentDate, delta)
        case 'agenda':
          return shiftMonth(currentDate, delta)
        default:
          return shiftMonth(currentDate, delta)
      }
    })
  }

  const renderedCalendarView = useMemo(() => {
    switch (currentView) {
      case 'day':
        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleWeekEventDragStart} onDragEnd={handleWeekEventDragEnd}>
            {renderDayGrid(
              selectedDate,
              scheduledEvents,
              openAssignmentDialog,
              openEventDialog,
              moveEventByHours,
              activeDragEventId,
            )}
            <DragOverlay>
              <EventOverlayCard event={activeDragEvent} />
            </DragOverlay>
          </DndContext>
        )
      case 'week':
        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleWeekEventDragStart} onDragEnd={handleWeekEventDragEnd}>
            {renderWeekGrid(
              selectedDate,
              scheduledEvents,
              openAssignmentDialog,
              openEventDialog,
              moveEventByHours,
              activeDragEventId,
            )}
            <DragOverlay>
              <EventOverlayCard event={activeDragEvent} />
            </DragOverlay>
          </DndContext>
        )
      case 'year':
        return renderYearGrid(selectedDate, calendarEvents, setSelectedDate, setCurrentView)
      case 'agenda':
        return renderAgendaView(selectedDate, calendarEvents, openEventDialog)
      default:
        return (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleWeekEventDragStart} onDragEnd={handleMonthEventDragEnd}>
            {renderMonthGrid(selectedDate, calendarEvents, openEventDialog, openMonthOverflow)}
            <DragOverlay>
              <EventOverlayCard event={activeDragEvent} />
            </DragOverlay>
          </DndContext>
        )
    }
  }, [
    activeDragEvent,
    activeDragEventId,
    calendarEvents,
    currentView,
    openAssignmentDialog,
    openEventDialog,
    openMonthOverflow,
    scheduledEvents,
    selectedDate,
    sensors,
  ])

  return (
    <>
      <section className="admin-shell-workouts-calendar-view grid gap-5 text-[var(--admin-dashboard-card-text)]" aria-label="Workout calendar admin view">
        <div className="admin-shell-workouts-calendar-header grid gap-4 border-b border-[var(--admin-dashboard-card-border)] pb-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-start gap-4">
              <button
                type="button"
                className="grid h-[72px] w-[72px] place-items-center rounded-[20px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)]"
                onClick={() => setSelectedDate(REFERENCE_TODAY)}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--admin-dashboard-card-muted)]">{referenceDateBadgeMonth}</span>
                <span className="text-2xl font-black leading-none">{referenceDateBadgeDay}</span>
              </button>

              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-[var(--admin-dashboard-card-text)]">
                    {monthLabel}
                  </span>
                  <span className="rounded-md border border-[var(--admin-dashboard-card-border)] px-1.5 py-0.5 text-xs font-medium text-[var(--admin-dashboard-card-text)]">
                    {referenceEventCountLabel}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="size-6.5 px-0 rounded-r-none border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
                    onClick={() => shiftDate(-1)}
                  >
                    <ChevronLeft className="size-4.5" />
                  </Button>

                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">{rangeLabel}</p>

                  <Button
                    type="button"
                    variant="outline"
                    className="size-6.5 px-0 rounded-l-none border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
                    onClick={() => shiftDate(1)}
                  >
                    <ChevronRight className="size-4.5" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-1.5 sm:flex-row sm:justify-between">
              <div className="flex w-full flex-wrap items-center gap-1.5">
                <div className="inline-flex first:rounded-r-none last:rounded-l-none [&:not(:first-child):not(:last-child)]:rounded-none">
                  <Button
                    type="button"
                    aria-label="View by day"
                    variant={currentView === 'day' ? 'default' : 'outline'}
                    size="icon"
                    className="rounded-r-none border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] [&_svg]:size-5"
                    onClick={() => changeCalendarView('day')}
                  >
                    <List strokeWidth={1.8} />
                    <span className="sr-only">Day</span>
                  </Button>
                  <Button
                    type="button"
                    aria-label="View by week"
                    variant={currentView === 'week' ? 'default' : 'outline'}
                    size="icon"
                    className="-ml-px rounded-none border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] [&_svg]:size-5"
                    onClick={() => changeCalendarView('week')}
                  >
                    <Columns strokeWidth={1.8} />
                    <span className="sr-only">Week</span>
                  </Button>
                  <Button
                    type="button"
                    aria-label="View by month"
                    variant={currentView === 'month' ? 'default' : 'outline'}
                    size="icon"
                    className="-ml-px rounded-none border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] [&_svg]:size-5"
                    onClick={() => changeCalendarView('month')}
                  >
                    <Grid2x2 strokeWidth={1.8} />
                    <span className="sr-only">Month</span>
                  </Button>
                  <Button
                    type="button"
                    aria-label="View by year"
                    variant={currentView === 'year' ? 'default' : 'outline'}
                    size="icon"
                    className="-ml-px rounded-none border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] [&_svg]:size-5"
                    onClick={() => changeCalendarView('year')}
                  >
                    <Grid3x3 strokeWidth={1.8} />
                    <span className="sr-only">Year</span>
                  </Button>
                  <Button
                    type="button"
                    aria-label="View by agenda"
                    variant={currentView === 'agenda' ? 'default' : 'outline'}
                    size="icon"
                    className="-ml-px rounded-l-none border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] [&_svg]:size-5"
                    onClick={() => changeCalendarView('agenda')}
                  >
                    <CalendarRange strokeWidth={1.8} />
                    <span className="sr-only">Agenda</span>
                  </Button>
                </div>
              </div>

              <Button
                type="button"
                className="w-full sm:w-auto min-h-[40px] rounded-[10px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
                onClick={() => openAssignmentDialog(selectedDate, WEEK_HOURS[0])}
              >
                <Plus className="size-4" />
                Add Workout
              </Button>
            </div>
          </div>
        </div>

        <div className="grid min-w-0 gap-5">
          <div className="grid gap-5">
            {renderedCalendarView}
          </div>
        </div>
      </section>

      <Dialog open={isMonthOverflowDialogOpen} onOpenChange={(open) => {
        setIsMonthOverflowDialogOpen(open)
        if (!open) {
          setMonthOverflowDate(null)
        }
      }}>
        <DialogContent className="fixed inset-x-2 bottom-2 top-auto z-50 grid w-full max-w-[calc(100%-1rem)] translate-y-0 gap-4 rounded-t-[28px] rounded-b-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-5 text-[var(--admin-dashboard-card-text)] shadow-[0_-24px_80px_rgba(0,0,0,0.5)] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-bottom-[18%] data-[state=open]:slide-in-from-bottom-[18%] sm:left-1/2 sm:right-auto sm:bottom-auto sm:top-[50%] sm:max-w-[420px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] sm:shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <DialogHeader>
            <DialogTitle>{monthOverflowEvents.length} workout{monthOverflowEvents.length === 1 ? '' : 's'}</DialogTitle>
            <DialogDescription className="text-[var(--admin-dashboard-card-muted)]">
              Review the hidden workouts for this day and open any one to edit it.
            </DialogDescription>
          </DialogHeader>

            <div className="grid gap-3 py-2">
              {monthOverflowDate ? (
                <div className="grid gap-2 rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">Day</div>
                      <div className="mt-1 text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(monthOverflowDate)}</div>
                    </div>
                    <div className="rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-shell-nav-active-bg)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-shell-nav-active-text)]">
                      Sorted by time
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-between gap-3 border-t border-[var(--admin-dashboard-card-border)] pt-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">Workout count</div>
                  <div className="mt-1 text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{monthOverflowEvents.length} total workouts</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-[12px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
                  onClick={() => openAllDayWorkouts(monthOverflowEvents)}
                >
                  Open all in day
                </Button>
              </div>

              <div className="grid gap-2">
                {monthOverflowEvents.map((event) => {
                  const typeLabel = event.typeLabel ?? getEventTypeLabel(event)

                  return (
                    <button
                      key={event.id}
                      type="button"
                      className="grid w-full min-w-0 overflow-hidden gap-1.5 rounded-[16px] border px-3 py-3 text-left transition-all hover:-translate-y-[1px] hover:opacity-95"
                      style={getEventCardStyle(event)}
                      onClick={() => openEventDialog(event.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">{event.startHour}</div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full h-2.5 w-2.5" style={getEventDotStyle(event)} />
                          <span className="rounded-full border border-current/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">{typeLabel}</span>
                        </div>
                      </div>
                      <div className="min-w-0 break-words text-[13px] font-semibold leading-[1.35] line-clamp-2">{event.title}</div>
                      <div className="text-[11px] text-inherit opacity-75">Ends {event.endHour}</div>
                    </button>
                  )
                })}
              </div>
          </div>

          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
              onClick={() => {
                setIsMonthOverflowDialogOpen(false)
                setMonthOverflowDate(null)
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignmentDialogOpen} onOpenChange={(open) => {
        setIsAssignmentDialogOpen(open)
        if (!open) {
          setSelectedEventId(null)
          setDayPlaylistEventIds([])
          setCompletedDayPlaylistEventIds([])
          setDayPlaylistIndex(0)
          setWorkoutTemplatePagination((current) => ({ ...current, pageIndex: 0, pageSize: 5 }))
          setAssignmentDraft(createAssignmentDraft())
          setAssignmentConflictMessage('')
          setEventConflictMessage('')
        }
      }}>
        <DialogContent pageScrollable className="admin-shell-workouts-calendar-add-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[640px]">
          <div className="grid gap-4 p-6">
            <DialogHeader>
              <DialogTitle>Add Workout</DialogTitle>
              <DialogDescription className="text-[var(--admin-dashboard-card-muted)]">
                Pick a workout template, start date/time, and end date/time before handing the new assignment to the shared program workout flow.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              {(assignmentConflictMessage || eventConflictMessage) ? (
                <div className="rounded-[14px] border border-[#f59e0b]/40 bg-[#fef3c7] px-3 py-2 text-sm text-[#92400e]">
                  {assignmentConflictMessage || eventConflictMessage}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">Start date</span>
                  <input
                    type="date"
                    className="h-11 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BE0AF]/20"
                    value={formatDateInputValue(assignmentDraft.date)}
                    onChange={(event) => {
                      const nextDate = parseDateInputValue(event.target.value)
                      setAssignmentDraft((currentDraft) => ({
                        ...currentDraft,
                        date: nextDate,
                        endDate: currentDraft.endDate && nextDate && !isSameDay(currentDraft.endDate, currentDraft.date ?? nextDate)
                          ? nextDate
                          : currentDraft.endDate ?? nextDate,
                      }))
                      setAssignmentConflictMessage('')
                      setEventConflictMessage('')
                    }}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">Start time</span>
                  <input
                    type="time"
                    step="3600"
                    min="06:00"
                    max="23:00"
                    className="h-11 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BE0AF]/20"
                    value={assignmentDraft.hour}
                    onChange={(event) => {
                      const nextHour = event.target.value
                      setAssignmentDraft((currentDraft) => ({
                        ...currentDraft,
                        hour: nextHour,
                        endHour: currentDraft.endHour || getEventEndHour(nextHour || '06:00'),
                      }))
                      setAssignmentConflictMessage('')
                      setEventConflictMessage('')
                    }}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">End date</span>
                  <input
                    type="date"
                    className="h-11 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BE0AF]/20"
                    value={formatDateInputValue(assignmentDraft.endDate)}
                    onChange={(event) => {
                      const nextDate = parseDateInputValue(event.target.value)
                      setAssignmentDraft((currentDraft) => ({ ...currentDraft, endDate: nextDate }))
                      setAssignmentConflictMessage('')
                      setEventConflictMessage('')
                    }}
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">End time</span>
                  <input
                    type="time"
                    step="3600"
                    min="06:00"
                    max="23:59"
                    className="h-11 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3BE0AF]/20"
                    value={assignmentDraft.endHour}
                    onChange={(event) => {
                      setAssignmentDraft((currentDraft) => ({ ...currentDraft, endHour: event.target.value }))
                      setAssignmentConflictMessage('')
                      setEventConflictMessage('')
                    }}
                  />
                </label>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">Workout templates</div>
                <div className="grid gap-2">
                  {workoutTemplateHydrationState === 'loading'
                    ? workoutTemplateSkeletonRows.map((rowIndex) => (
                        <div key={`workout-template-skeleton-${rowIndex}`} className="rounded-[16px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3">
                          <div className="flex flex-col gap-2">
                            <Skeleton className="h-4 w-[160px] bg-[#1B2A40]" />
                            <Skeleton className="h-3 w-[112px] bg-[#1B2A40]" />
                            <Skeleton className="h-3 w-[88px] bg-[#1B2A40]" />
                          </div>
                        </div>
                      ))
                    : null}

                  {workoutTemplateHydrationState === 'error' && !workoutTemplateOptions.length ? (
                    <div className="rounded-[16px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
                      Real workout templates could not be loaded.
                    </div>
                  ) : null}

                  {workoutTemplateHydrationState === 'ready' && !workoutTemplateOptions.length ? (
                    <div className="rounded-[16px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-muted)]">
                      No active workout templates found.
                    </div>
                  ) : null}

                  {visibleWorkoutTemplateOptions.map((workout) => {
                    const isSelected = workout.id === assignmentDraft.selectedWorkoutId
                    const exerciseCountLabel = `${workout.exerciseCount} exercise${workout.exerciseCount === 1 ? '' : 's'}`
                    const setCountLabel = `${workout.setCount} set${workout.setCount === 1 ? '' : 's'}`

                    return (
                      <button
                        key={workout.id}
                        type="button"
                        className={[
                          'rounded-[16px] border px-4 py-3 text-left transition-colors',
                          isSelected
                            ? 'border-[var(--admin-shell-accent)] bg-[var(--admin-shell-nav-active-bg)] text-[var(--admin-dashboard-card-text)]'
                            : 'border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] hover:border-[var(--admin-shell-accent)] hover:bg-[var(--admin-dashboard-control-hover-bg)]',
                        ].join(' ')}
                        onClick={() => {
                          setAssignmentDraft((currentDraft) => ({ ...currentDraft, selectedWorkoutId: workout.id }))
                          setAssignmentConflictMessage('')
                          setEventConflictMessage('')
                        }}
                      >
                        <div className="text-sm font-semibold">{workout.title}</div>
                        <div className="mt-1 text-xs text-inherit opacity-80">{exerciseCountLabel}</div>
                        <div className="mt-1 text-xs text-inherit opacity-70">{setCountLabel}</div>
                      </button>
                    )
                  })}
                </div>

                {workoutTemplateHydrationState === 'ready' && workoutTemplateOptions.length > 0 ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-sm text-[var(--admin-dashboard-card-muted)]">
                    <div className="flex items-center gap-2">
                      <span>Rows per page</span>
                      <Select
                        value={String(workoutTemplatePagination.pageSize)}
                        onValueChange={(value) => {
                          const nextPageSize = Number(value)
                          setWorkoutTemplatePagination({
                            pageIndex: 0,
                            pageSize: nextPageSize,
                          })
                        }}
                      >
                        <SelectTrigger className="h-9 w-[76px] rounded-[10px] !border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-3 text-sm text-[var(--admin-dashboard-card-text)]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {workoutTemplatePageSizeOptions.map((option) => (
                            <SelectItem key={option} value={String(option)}>{option}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-3">
                      <span>{workoutTemplatePageStart} - {workoutTemplatePageEnd} of {workoutTemplateOptions.length}</span>
                      <nav className="flex items-center gap-1" aria-label="Workout template pagination">
                        <button
                          type="button"
                          aria-label="Go to previous workout template page"
                          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] transition hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)] disabled:opacity-50"
                          onClick={() => setWorkoutTemplatePagination((current) => ({ ...current, pageIndex: Math.max(0, current.pageIndex - 1) }))}
                          disabled={workoutTemplatePagination.pageIndex === 0}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        {workoutTemplatePageNumbers.map((pageNumber) => (
                          <button
                            key={`workout-template-page-${pageNumber}`}
                            type="button"
                            className={[
                              'flex h-9 min-w-9 items-center justify-center rounded-[10px] border px-3 text-sm transition',
                              workoutTemplatePagination.pageIndex === pageNumber
                                ? 'border-[#3BE0AF] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]'
                                : 'border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]',
                            ].join(' ')}
                            onClick={() => setWorkoutTemplatePagination((current) => ({ ...current, pageIndex: pageNumber }))}
                          >
                            {pageNumber + 1}
                          </button>
                        ))}
                        <button
                          type="button"
                          aria-label="Go to next workout template page"
                          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] transition hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)] disabled:opacity-50"
                          onClick={() => setWorkoutTemplatePagination((current) => ({ ...current, pageIndex: Math.min(workoutTemplatePageCount - 1, current.pageIndex + 1) }))}
                          disabled={workoutTemplatePagination.pageIndex >= workoutTemplatePageCount - 1}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </nav>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <DialogFooter className="flex flex-col gap-3 border-t border-[var(--admin-dashboard-card-border)] pt-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="min-h-[40px] rounded-[12px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
                onClick={() => {
                  setIsAssignmentDialogOpen(false)
                  setSelectedEventId(null)
                  setDayPlaylistEventIds([])
                  setCompletedDayPlaylistEventIds([])
                  setDayPlaylistIndex(0)
                  setWorkoutTemplatePagination((current) => ({ ...current, pageIndex: 0, pageSize: 5 }))
                  setAssignmentDraft(createAssignmentDraft())
                  setAssignmentConflictMessage('')
                  setEventConflictMessage('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="min-h-[40px] rounded-[12px] border border-[var(--admin-shell-accent)] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
                onClick={createAssignment}
              >
                Create workout
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      <WorkoutEditorDialog
        open={isProgramWorkoutEditorOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeProgramWorkoutEditorSeam()
          }
        }}
        mode="edit"
        title="Edit workout"
        description={programWorkoutEditorDraft?.title ? `Update ${programWorkoutEditorDraft.title} below.` : 'Update this workout below.'}
        detailsValues={programWorkoutEditorDetailsValues}
        onDetailsChange={setProgramWorkoutEditorDetailsValues}
        trainingSections={programWorkoutEditorTrainingSections}
        onTrainingSectionsChange={setProgramWorkoutEditorTrainingSections}
        showTrainingTab
        primaryActionLabel={programWorkoutEditorLoadState === 'saving' ? 'Saving...' : 'Save changes'}
        onPrimaryAction={programWorkoutEditorLoadState === 'loading' ? undefined : saveProgramWorkoutEditor}
      />
    </>
  )
}
