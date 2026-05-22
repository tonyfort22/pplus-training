'use client'

import { useEffect, useMemo, useState } from 'react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEK_HOURS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00']

const WORKOUT_EVENTS = [
  {
    id: 'calendar-workout-1',
    title: 'Power Skating A',
    startDate: new Date(2026, 4, 4),
    endDate: new Date(2026, 4, 4),
    tone: 'green',
    startHour: '06:00',
    endHour: '07:00',
  },
  {
    id: 'calendar-workout-2',
    title: 'Goalie Edge Control',
    startDate: new Date(2026, 4, 5),
    endDate: new Date(2026, 4, 5),
    tone: 'blue',
    startHour: '07:00',
    endHour: '08:00',
  },
  {
    id: 'calendar-workout-3',
    title: 'Acceleration Tune-Up',
    startDate: new Date(2026, 4, 6),
    endDate: new Date(2026, 4, 6),
    tone: 'amber',
    startHour: '09:00',
    endHour: '10:00',
  },
  {
    id: 'calendar-workout-4',
    title: 'Transition Speed Builder',
    startDate: new Date(2026, 4, 8),
    endDate: new Date(2026, 4, 8),
    tone: 'green',
    startHour: '10:00',
    endHour: '11:00',
  },
  {
    id: 'calendar-workout-5',
    title: 'Overspeed Mechanics',
    startDate: new Date(2026, 4, 9),
    endDate: new Date(2026, 4, 9),
    tone: 'blue',
    startHour: '08:00',
    endHour: '09:00',
  },
]

const ASSIGNABLE_WORKOUTS = [
  {
    id: 'assignable-workout-1',
    title: 'Stride Mechanics Reset',
    tone: 'green',
    durationHours: 1,
  },
  {
    id: 'assignable-workout-2',
    title: 'Reaction Speed Circuit',
    tone: 'blue',
    durationHours: 1,
  },
  {
    id: 'assignable-workout-3',
    title: 'Lateral Power Builder',
    tone: 'amber',
    durationHours: 1,
  },
]

function createAssignmentDraft(date = null, hour = '') {
  return {
    date,
    hour,
    selectedWorkoutId: ASSIGNABLE_WORKOUTS[0].id,
  }
}

function createEventDraft(event = null) {
  if (!event) {
    return {
      selectedWorkoutId: ASSIGNABLE_WORKOUTS[0].id,
      hour: '',
    }
  }

  const matchedTemplate = ASSIGNABLE_WORKOUTS.find((workout) => workout.title === event.title && workout.tone === event.tone)

  return {
    selectedWorkoutId: matchedTemplate?.id ?? ASSIGNABLE_WORKOUTS[0].id,
    hour: event.startHour,
  }
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

function shiftWeek(date, delta) {
  const nextDate = new Date(date)
  nextDate.setDate(date.getDate() + delta * 7)
  return nextDate
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

function getEventsForDate(date, events) {
  return events.filter((event) => isSameDay(event.startDate, date))
}

function getEventEndHour(startHour, durationHours = 1) {
  const startHourNumber = Number.parseInt(startHour.slice(0, 2), 10)
  const nextHour = String(startHourNumber + durationHours).padStart(2, '0')
  return `${nextHour}:00`
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
  return ASSIGNABLE_WORKOUTS.find((workout) => workout.id === templateId) ?? ASSIGNABLE_WORKOUTS[0]
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
  const resolvedScheduledDate = row.scheduled_date ?? row.program_days?.date ?? null

  return {
    id: row.id,
    title: row.name_snapshot,
    startDate: parseScheduledDate(resolvedScheduledDate),
    endDate: parseScheduledDate(resolvedScheduledDate),
    tone: template?.tone ?? 'blue',
    startHour: row.scheduled_start_time?.slice(0, 5) ?? '06:00',
    endHour: row.scheduled_end_time?.slice(0, 5) ?? '07:00',
    workoutTemplateId: row.workout_template_id ?? template.id,
    persisted: true,
  }
}

function mapCalendarEventToAssignmentPayload(event) {
  const matchedTemplate = ASSIGNABLE_WORKOUTS.find((workout) => workout.id === event.workoutTemplateId)
    ?? ASSIGNABLE_WORKOUTS.find((workout) => workout.title === event.title && workout.tone === event.tone)
    ?? ASSIGNABLE_WORKOUTS[0]

  return {
    id: event.id,
    workout_template_id: event.workoutTemplateId ?? matchedTemplate.id,
    name_snapshot: event.title,
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

function getEventToneClasses(tone) {
  if (tone === 'green') {
    return 'border-[#1E5E4E] bg-[#153C35] text-[#7DF5CD]'
  }

  if (tone === 'amber') {
    return 'border-[#6A4A1A] bg-[#3D2B12] text-[#F5D08A]'
  }

  return 'border-[#29496B] bg-[#142235] text-[#8FC7FF]'
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
    <div
      ref={draggable.setNodeRef}
      data-week-event={event.id}
      style={{
        transform,
        opacity: draggable.isDragging ? 0.55 : 1,
      }}
      className="grid gap-2"
    >
      <button
        type="button"
        aria-label="Open event editor"
        className={[
          'grid w-full gap-1 rounded-[16px] border px-3 py-3 text-left shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-opacity hover:opacity-95',
          getEventToneClasses(event.tone),
        ].join(' ')}
        onClick={() => onOpenEventDialog(event.id)}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.12em]">{event.startHour}</div>
        <div className="text-sm font-semibold leading-tight">{event.title}</div>
        <div className="text-xs opacity-80">Ends {event.endHour}</div>
      </button>

      <button
        type="button"
        aria-label="Drag workout"
        className="rounded-[12px] border border-[#24334A] bg-[#0F1728] px-3 py-2 text-[11px] font-medium text-[#DCE6F8] transition-colors hover:border-[#3BE0AF] hover:bg-[#15233A]"
        {...draggable.listeners}
        {...draggable.attributes}
      >
        Drag workout
      </button>
    </div>
  )
}

function WeekSlotDropZone({ slotId, children, showDropHint = false }) {
  const droppable = useDroppable({ id: slotId })

  return (
    <div
      ref={droppable.setNodeRef}
      data-week-slot={slotId}
      className={[
        'min-h-[92px] rounded-[16px] transition-colors',
        droppable.isOver ? 'bg-[#15233A]' : '',
      ].join(' ')}
    >
      {children}
      {showDropHint ? (
        <div className="mt-2 rounded-[12px] border border-dashed border-[#3BE0AF] px-2 py-2 text-[11px] font-medium text-[#7DF5CD]">
          Drop workout here
        </div>
      ) : null}
    </div>
  )
}

function EventOverlayCard({ event }) {
  if (!event) return null

  return (
    <div
      className={[
        'grid min-w-[180px] gap-1 rounded-[16px] border px-3 py-3 text-left shadow-[0_14px_28px_rgba(0,0,0,0.28)]',
        getEventToneClasses(event.tone),
      ].join(' ')}
    >
      <div className="text-xs font-semibold uppercase tracking-[0.12em]">{event.startHour}</div>
      <div className="text-sm font-semibold leading-tight">{event.title}</div>
      <div className="text-xs opacity-80">Ends {event.endHour}</div>
    </div>
  )
}

function StaticEventCard({ event, onOpenEventDialog, showMoveControls = false, moveEventByHours = null }) {
  return (
    <div key={event.id} className="grid gap-2">
      <button
        type="button"
        aria-label="Open event editor"
        data-week-event={event.id}
        className={[
          'grid w-full gap-1 rounded-[16px] border px-3 py-3 text-left shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition-opacity hover:opacity-95',
          getEventToneClasses(event.tone),
        ].join(' ')}
        onClick={() => onOpenEventDialog(event.id)}
      >
        <div className="text-xs font-semibold uppercase tracking-[0.12em]">{event.startHour}</div>
        <div className="text-sm font-semibold leading-tight">{event.title}</div>
        <div className="text-xs opacity-80">Ends {event.endHour}</div>
      </button>

      {showMoveControls && moveEventByHours ? (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className="rounded-[12px] border border-[#24334A] bg-[#0F1728] px-2 py-2 text-[11px] font-medium text-[#DCE6F8] transition-colors hover:border-[#3BE0AF] hover:bg-[#15233A]"
            onClick={() => moveEventByHours(event.id, -1)}
          >
            Move earlier
          </button>
          <button
            type="button"
            className="rounded-[12px] border border-[#24334A] bg-[#0F1728] px-2 py-2 text-[11px] font-medium text-[#DCE6F8] transition-colors hover:border-[#3BE0AF] hover:bg-[#15233A]"
            onClick={() => moveEventByHours(event.id, 1)}
          >
            Move later
          </button>
        </div>
      ) : null}
    </div>
  )
}

function renderMonthGrid(selectedDate, scheduledEvents, openEventDialog) {
  const cells = createCalendarCells(selectedDate)

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#24334A] bg-[#111827] shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
      <div className="grid grid-cols-7 border-b border-[#24334A] bg-[#0F1728]">
        {WEEK_DAYS.map((day) => (
          <div key={day} className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.16em] text-[#6F84A6]">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const events = getEventsForDate(cell.date, scheduledEvents)
          const isToday = isSameDay(cell.date, new Date())

          return (
            <div
              key={cell.date.toISOString()}
              className={[
                'min-h-[148px] border-r border-b border-[#24334A] px-3 py-3',
                cell.currentMonth ? 'bg-[#111827]' : 'bg-[#0F1728]/70',
              ].join(' ')}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span
                  className={[
                    'inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold',
                    cell.currentMonth ? 'text-[#EEF4FF]' : 'text-[#5D708F]',
                    isToday ? 'bg-[#3BE0AF] text-[#0B1120]' : '',
                  ].join(' ')}
                >
                  {cell.date.getDate()}
                </span>
              </div>

              <div className="grid gap-2">
                {events.length
                  ? events.map((event) => (
                      <StaticEventCard key={event.id} event={event} onOpenEventDialog={openEventDialog} />
                    ))
                  : (
                    <div className="rounded-[14px] border border-dashed border-[#24334A] px-3 py-2 text-xs text-[#5D708F]">
                      No workout
                    </div>
                  )}
              </div>
            </div>
          )
        })}
      </div>
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
) {
  const weekDays = createWeekDays(selectedDate)

  return (
    <div className="overflow-hidden rounded-[24px] border border-[#24334A] bg-[#111827] shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
      <div className="border-b border-[#24334A] bg-[#0F1728] px-5 py-4">
        <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F84A6]">Weekly schedule</div>
      </div>

      <div className="grid grid-cols-[92px_repeat(7,minmax(0,1fr))] border-b border-[#24334A] bg-[#0F1728]">
        <div className="border-r border-[#24334A] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#6F84A6]">Time</div>
        {weekDays.map((day) => {
          const isToday = isSameDay(day, new Date())

          return (
            <div key={day.toISOString()} className="border-r border-[#24334A] px-3 py-3 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F84A6]">{WEEK_DAYS[day.getDay()]}</div>
              <div className={['mt-1 text-sm font-semibold', isToday ? 'text-[#3BE0AF]' : 'text-[#EEF4FF]'].join(' ')}>{day.getDate()}</div>
            </div>
          )
        })}
      </div>

      <div className="grid">
        {WEEK_HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[92px_repeat(7,minmax(0,1fr))]">
            <div className="border-r border-b border-[#24334A] bg-[#0F1728] px-4 py-4 text-xs font-medium text-[#8EA0BC]">{hour}</div>
            {weekDays.map((day) => {
              const slotId = encodeWeekSlotId(day, hour)
              const event = getEventsForDate(day, scheduledEvents).find((entry) => entry.startHour === hour)
              const showDropHint = Boolean(activeDragEventId) && activeDragEventId !== event?.id

              return (
                <div key={`${day.toISOString()}-${hour}`} className="border-r border-b border-[#24334A] px-3 py-3">
                  <WeekSlotDropZone slotId={slotId} showDropHint={showDropHint}>
                    {event ? (
                      <div className="min-h-[92px]">
                        <DraggableWeekEventCard event={event} onOpenEventDialog={openEventDialog} />
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            className="rounded-[12px] border border-[#24334A] bg-[#0F1728] px-2 py-2 text-[11px] font-medium text-[#DCE6F8] transition-colors hover:border-[#3BE0AF] hover:bg-[#15233A]"
                            onClick={() => moveEventByHours(event.id, -1)}
                          >
                            Move earlier
                          </button>
                          <button
                            type="button"
                            className="rounded-[12px] border border-[#24334A] bg-[#0F1728] px-2 py-2 text-[11px] font-medium text-[#DCE6F8] transition-colors hover:border-[#3BE0AF] hover:bg-[#15233A]"
                            onClick={() => moveEventByHours(event.id, 1)}
                          >
                            Move later
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="min-h-[92px]">
                        <button
                          type="button"
                          aria-label="Open assignment composer"
                          className="w-full rounded-[14px] border border-dashed border-[#24334A] px-3 py-2 text-left text-xs text-[#5D708F] transition-colors hover:border-[#3BE0AF] hover:text-[#DCE6F8]"
                          onClick={() => openAssignmentDialog(day, hour)}
                        >
                          Assign workout
                        </button>
                      </div>
                    )}
                  </WeekSlotDropZone>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function WorkoutsCalendarView({ selectedAthleteId = '' }) {
  const [selectedDate, setSelectedDate] = useState(() => new Date(2026, 4, 4))
  const [currentView, setCurrentView] = useState('month')
  const [scheduledEvents, setScheduledEvents] = useState(WORKOUT_EVENTS)
  const [hydrationState, setHydrationState] = useState('idle')
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false)
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
  const [assignmentDraft, setAssignmentDraft] = useState(() => createAssignmentDraft())
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [assignmentConflictMessage, setAssignmentConflictMessage] = useState('')
  const [eventConflictMessage, setEventConflictMessage] = useState('')
  const [eventDraft, setEventDraft] = useState(() => createEventDraft())
  const [activeDragEventId, setActiveDragEventId] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const rangeLabel = useMemo(() => {
    return currentView === 'week' ? formatWeekLabel(selectedDate) : formatMonthLabel(selectedDate)
  }, [currentView, selectedDate])

  const selectedTemplate = useMemo(() => {
    return ASSIGNABLE_WORKOUTS.find((workout) => workout.id === assignmentDraft.selectedWorkoutId) ?? ASSIGNABLE_WORKOUTS[0]
  }, [assignmentDraft.selectedWorkoutId])

  const selectedEvent = useMemo(() => {
    return scheduledEvents.find((event) => event.id === selectedEventId) ?? null
  }, [scheduledEvents, selectedEventId])

  const selectedEventTemplate = useMemo(() => {
    return ASSIGNABLE_WORKOUTS.find((workout) => workout.id === eventDraft.selectedWorkoutId) ?? ASSIGNABLE_WORKOUTS[0]
  }, [eventDraft.selectedWorkoutId])

  const activeDragEvent = useMemo(() => {
    return scheduledEvents.find((event) => event.id === activeDragEventId) ?? null
  }, [activeDragEventId, scheduledEvents])

  async function loadPersistedCalendarAssignments() {
    if (!selectedAthleteId) {
      setScheduledEvents([])
      setHydrationState('idle')
      setEventConflictMessage('')
      return
    }

    setHydrationState('loading')

    try {
      const payload = await requestCalendarApi(`?athleteId=${encodeURIComponent(selectedAthleteId)}`)
      const assignments = Array.isArray(payload.assignments) ? payload.assignments : []
      setScheduledEvents(assignments.map(mapAssignmentRowToCalendarEvent).filter((event) => event.startDate && event.startHour))
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
  }, [selectedAthleteId])

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

  function openAssignmentDialog(date, hour) {
    setAssignmentDraft(createAssignmentDraft(date, hour))
    setAssignmentConflictMessage('')
    setIsAssignmentDialogOpen(true)
  }

  function openEventDialog(eventId) {
    const event = scheduledEvents.find((entry) => entry.id === eventId)
    if (!event) {
      return
    }

    setSelectedEventId(eventId)
    setEventDraft(createEventDraft(event))
    setEventConflictMessage('')
    setIsEventDialogOpen(true)
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

  async function createAssignment() {
    if (!assignmentDraft.date || !assignmentDraft.hour) {
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
        tone: selectedTemplate.tone,
        startDate: assignmentDraft.date,
        endDate: assignmentDraft.date,
        startHour: assignmentDraft.hour,
        endHour: getEventEndHour(assignmentDraft.hour, selectedTemplate.durationHours),
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

  async function updateScheduledEvent() {
    if (!selectedEvent || !eventDraft.hour) {
      return
    }

    if (hydrationState !== 'ready') {
      setEventConflictMessage(getPersistenceUnavailableMessage())
      return
    }

    if (
      hasSchedulingConflict({
        events: scheduledEvents,
        date: selectedEvent.startDate,
        startHour: eventDraft.hour,
        excludeEventId: selectedEvent.id,
      })
    ) {
      setEventConflictMessage('Another workout is already scheduled in this slot.')
      return
    }

    try {
      const updatedEvent = await updatePersistedAssignment({
        ...selectedEvent,
        title: selectedEventTemplate.title,
        tone: selectedEventTemplate.tone,
        startHour: eventDraft.hour,
        endHour: getEventEndHour(eventDraft.hour, selectedEventTemplate.durationHours),
        workoutTemplateId: selectedEventTemplate.id,
      })
      setScheduledEvents((currentEvents) => currentEvents.map((event) => {
        if (event.id !== updatedEvent.id) {
          return event
        }

        return updatedEvent
      }))
      setEventConflictMessage('')
      setIsEventDialogOpen(false)
      setSelectedEventId(null)
      setEventDraft(createEventDraft())
    } catch (error) {
      setEventConflictMessage(error?.message || 'Failed to persist scheduled workout changes.')
    }
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
      setIsEventDialogOpen(false)
      setSelectedEventId(null)
      setEventDraft(createEventDraft())
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

  const shiftDate = (delta) => {
    setSelectedDate((currentDate) => {
      return currentView === 'week' ? shiftWeek(currentDate, delta) : shiftMonth(currentDate, delta)
    })
  }

  return (
    <>
      <section className="admin-shell-workouts-calendar-view grid gap-5" aria-label="Workout calendar admin view">
        <div className="admin-shell-workouts-calendar-header grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="grid gap-1">
            <h1 className="admin-shell-athletes-page-title">Workout Calendar</h1>
            <p className="text-sm text-[#8EA0BC]">
              {currentView === 'week'
                ? 'Review scheduled workouts and open slots in a weekly schedule.'
                : 'Review scheduled workouts and upcoming workload in a month view.'}
            </p>
            {eventConflictMessage ? (
              <div className="mt-2 rounded-[14px] border border-[#6A4A1A] bg-[#3D2B12] px-3 py-2 text-sm text-[#F5D08A]">
                {eventConflictMessage}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => setSelectedDate(new Date(2026, 4, 4))}
            >
              Today
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => shiftDate(-1)}
            >
              Previous
            </Button>
            <div className="min-w-[220px] text-center text-sm font-semibold text-[#EEF4FF]">{rangeLabel}</div>
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => shiftDate(1)}
            >
              Next
            </Button>
            <div className="flex items-center gap-1 rounded-[14px] border border-[#24334A] bg-[#111D30] p-1">
              <button
                type="button"
                className={[
                  'rounded-[10px] px-3 py-2 text-sm font-medium transition-colors',
                  currentView === 'month' ? 'bg-[#3BE0AF] text-[#0B1120]' : 'text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]',
                ].join(' ')}
                onClick={() => setCurrentView('month')}
              >
                Month
              </button>
              <button
                type="button"
                className={[
                  'rounded-[10px] px-3 py-2 text-sm font-medium transition-colors',
                  currentView === 'week' ? 'bg-[#3BE0AF] text-[#0B1120]' : 'text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]',
                ].join(' ')}
                onClick={() => setCurrentView('week')}
              >
                Week
              </button>
            </div>
          </div>
        </div>

        {currentView === 'week' ? (
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
        ) : (
          renderMonthGrid(selectedDate, scheduledEvents, openEventDialog)
        )}
      </section>

      <Dialog open={isAssignmentDialogOpen} onOpenChange={setIsAssignmentDialogOpen}>
        <DialogContent className="border-[#24334A] bg-[#111827] text-[#EEF4FF] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Schedule workout</DialogTitle>
            <DialogDescription className="text-[#8EA0BC]">
              Select a workout template and save it into this calendar slot.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="rounded-[16px] border border-[#24334A] bg-[#0F1728] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F84A6]">Slot</div>
              <div className="mt-1 text-sm font-semibold text-[#EEF4FF]">{formatAssignmentSlot(assignmentDraft.date, assignmentDraft.hour)}</div>
            </div>

            {assignmentConflictMessage ? (
              <div className="rounded-[14px] border border-[#6A4A1A] bg-[#3D2B12] px-3 py-2 text-sm text-[#F5D08A]">
                {assignmentConflictMessage}
              </div>
            ) : null}

            <div className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F84A6]">Workout templates</div>
              <div className="grid gap-2">
                {ASSIGNABLE_WORKOUTS.map((workout) => {
                  const isSelected = workout.id === assignmentDraft.selectedWorkoutId

                  return (
                    <button
                      key={workout.id}
                      type="button"
                      className={[
                        'rounded-[16px] border px-4 py-3 text-left transition-colors',
                        isSelected
                          ? 'border-[#3BE0AF] bg-[#153C35] text-[#EEF4FF]'
                          : 'border-[#24334A] bg-[#0F1728] text-[#DCE6F8] hover:border-[#3BE0AF] hover:bg-[#15233A]',
                      ].join(' ')}
                      onClick={() => {
                        setAssignmentDraft((currentDraft) => ({ ...currentDraft, selectedWorkoutId: workout.id }))
                        setAssignmentConflictMessage('')
                      }}
                    >
                      <div className="text-sm font-semibold">{workout.title}</div>
                      <div className="mt-1 text-xs text-inherit opacity-80">{workout.durationHours} hour block</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => {
                setIsAssignmentDialogOpen(false)
                setAssignmentConflictMessage('')
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] border border-[#3BE0AF] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]"
              onClick={createAssignment}
            >
              Save assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="border-[#24334A] bg-[#111827] text-[#EEF4FF] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Edit scheduled workout</DialogTitle>
            <DialogDescription className="text-[#8EA0BC]">
              Update or remove this scheduled workout from the calendar.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="rounded-[16px] border border-[#24334A] bg-[#0F1728] px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F84A6]">Current slot</div>
              <div className="mt-1 text-sm font-semibold text-[#EEF4FF]">{selectedEvent ? formatAssignmentSlot(selectedEvent.startDate, selectedEvent.startHour) : 'No event selected'}</div>
            </div>

            {eventConflictMessage ? (
              <div className="rounded-[14px] border border-[#6A4A1A] bg-[#3D2B12] px-3 py-2 text-sm text-[#F5D08A]">
                {eventConflictMessage}
              </div>
            ) : null}

            <div className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F84A6]">Workout templates</div>
              <div className="grid gap-2">
                {ASSIGNABLE_WORKOUTS.map((workout) => {
                  const isSelected = workout.id === eventDraft.selectedWorkoutId

                  return (
                    <button
                      key={workout.id}
                      type="button"
                      className={[
                        'rounded-[16px] border px-4 py-3 text-left transition-colors',
                        isSelected
                          ? 'border-[#3BE0AF] bg-[#153C35] text-[#EEF4FF]'
                          : 'border-[#24334A] bg-[#0F1728] text-[#DCE6F8] hover:border-[#3BE0AF] hover:bg-[#15233A]',
                      ].join(' ')}
                      onClick={() => {
                        setEventDraft((currentDraft) => ({ ...currentDraft, selectedWorkoutId: workout.id }))
                        setEventConflictMessage('')
                      }}
                    >
                      <div className="text-sm font-semibold">{workout.title}</div>
                      <div className="mt-1 text-xs text-inherit opacity-80">{workout.durationHours} hour block</div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6F84A6]">Start time</div>
              <div className="flex flex-wrap gap-2">
                {WEEK_HOURS.map((hour) => {
                  const isSelected = hour === eventDraft.hour

                  return (
                    <button
                      key={hour}
                      type="button"
                      className={[
                        'rounded-[12px] border px-3 py-2 text-sm transition-colors',
                        isSelected
                          ? 'border-[#3BE0AF] bg-[#153C35] text-[#EEF4FF]'
                          : 'border-[#24334A] bg-[#0F1728] text-[#DCE6F8] hover:border-[#3BE0AF] hover:bg-[#15233A]',
                      ].join(' ')}
                      onClick={() => {
                        setEventDraft((currentDraft) => ({ ...currentDraft, hour }))
                        setEventConflictMessage('')
                      }}
                    >
                      {hour}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] border-[#7A2430] bg-[#2B1117] text-[#F5B7C0] hover:bg-[#34151C] hover:text-[#FFD4DB]"
              onClick={deleteScheduledEvent}
            >
              Delete workout
            </Button>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-[12px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
                onClick={() => {
                  setIsEventDialogOpen(false)
                  setEventConflictMessage('')
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="rounded-[12px] border border-[#3BE0AF] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]"
                onClick={updateScheduledEvent}
              >
                Save changes
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
