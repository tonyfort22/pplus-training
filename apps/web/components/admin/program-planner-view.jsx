'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, ArrowRight, GripVertical, MoreHorizontal, Plus, Trash2 } from 'lucide-react'

import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KanbanBoard, KanbanColumn, KanbanItem } from '@/components/ui/kanban'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { createFixedDaySlots, reorderWorkoutCards, swapDayLaneContent } from './program-planner-utils'

function clonePlanner(program) {
  return JSON.parse(JSON.stringify(program))
}

function getNextWeekId(weeks = []) {
  const highestWeekNumber = weeks.reduce((maxWeekNumber, week) => {
    const matchedWeekNumber = Number.parseInt(String(week.id ?? '').replace(/^week-/, ''), 10)
    return Number.isFinite(matchedWeekNumber) ? Math.max(maxWeekNumber, matchedWeekNumber) : maxWeekNumber
  }, 0)

  return `week-${highestWeekNumber + 1}`
}

function DayLane({ day, onAddWorkout, onOpenWorkoutDetails, onReorderWorkouts, sortable }) {
  return (
    <div ref={sortable.setNodeRef} style={sortable.style} className="min-w-[260px] flex-1">
      <Card className="h-full rounded-[22px] border-[#24334A] bg-[#111827] shadow-[0_18px_40px_rgba(0,0,0,0.26)]">
        <CardHeader className="gap-3 border-b border-[#24334A] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-sm font-semibold text-[#EEF4FF]">{day.label}</CardTitle>
              <CardDescription className="text-xs text-[#8EA0BC]">{day.summary}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#24334A] bg-[#0F1728] text-[#8EA0BC] hover:border-[#3BE0AF] hover:text-[#EEF4FF]"
                    {...sortable.attributes}
                    {...sortable.listeners}
                  >
                    <GripVertical className="h-4 w-4" />
                    <span className="sr-only">Swap day content</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent sideOffset={6}>Swap day content</TooltipContent>
              </Tooltip>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full border border-[#24334A] bg-[#0F1728] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
                onClick={() => onAddWorkout(day.id)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add workout to {day.label}</span>
              </Button>
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#60708F]">{day.focus}</p>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 py-4">
          <KanbanBoard
            className="gap-3"
            onDragEnd={({ active, over }) => {
              if (!over || active.id === over.id) return
              onReorderWorkouts(day.id, active.id, over.id)
            }}
          >
            <KanbanColumn columnId={day.id} itemIds={day.workouts.map((workout) => workout.id)}>
              {day.workouts.length ? (
                day.workouts.map((workout) => (
                  <KanbanItem key={workout.id} id={workout.id} columnId={day.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => onOpenWorkoutDetails(workout, day.label)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onOpenWorkoutDetails(workout, day.label)
                        }
                      }}
                      className="grid w-full cursor-pointer gap-3 rounded-[18px] border border-[#24334A] bg-[#0F1728] p-4 text-left shadow-[0_10px_24px_rgba(0,0,0,0.22)] transition hover:border-[#355176]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <Badge className="border border-transparent bg-[#153C35] text-[#7DF5CD]">{workout.blockLabel}</Badge>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-[#EEF4FF]">{workout.title}</p>
                            <p className="text-xs text-[#8EA0BC]">{workout.duration}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={(event) => event.stopPropagation()}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#24334A] bg-[#111D30] text-[#8EA0BC] hover:text-[#EEF4FF]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open workout actions</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Workout actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => onOpenWorkoutDetails(workout, day.label)}>Workout details</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate workout</DropdownMenuItem>
                            <DropdownMenuItem>Archive workout</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="grid gap-2">
                        {workout.sections.slice(0, 2).map((section) => (
                          <div key={section.id} className="rounded-[14px] border border-[#24334A] bg-[#101A2A] px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold text-[#DCE6F8]">{section.title}</p>
                              <button
                                type="button"
                                onClick={(event) => event.stopPropagation()}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#24334A] bg-[#111D30] text-[#8EA0BC] hover:text-[#EEF4FF]"
                              >
                                <MoreHorizontal className="h-3.5 w-3.5" />
                                <span className="sr-only">Open section actions</span>
                              </button>
                            </div>
                            <p className="mt-1 text-xs text-[#8EA0BC]">{section.description}</p>
                          </div>
                        ))}
                        {workout.sections.length > 2 ? <p className="text-xs text-[#6F84A6]">+{workout.sections.length - 2} more sections</p> : null}
                      </div>
                    </div>
                  </KanbanItem>
                ))
              ) : (
                <div className="rounded-[18px] border border-dashed border-[#2B3D57] bg-[#0F1728] px-4 py-8 text-center text-sm text-[#6F84A6]">
                  No workouts yet.
                </div>
              )}
            </KanbanColumn>
          </KanbanBoard>
        </CardContent>
      </Card>
    </div>
  )
}

function ProgramWeekRow({ week, onAddWorkoutToDay, onDeleteWeek, onOpenWorkoutDetails, onReorderDayWorkouts, onSwapDayContent }) {
  const weekSliderRef = useRef(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  function scrollWeekSlider(direction) {
    const sliderStep = 640
    weekSliderRef.current?.scrollBy({ left: direction * sliderStep, behavior: 'smooth' })
  }

  return (
    <section className="group relative min-w-0 overflow-hidden rounded-[28px] border border-dashed border-[#2A415F] bg-[#0B1120]/70 p-5 shadow-[0_22px_50px_rgba(0,0,0,0.32)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#8EA0BC]">{week.label}</p>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-scroll-direction="left"
                className="program-planner-scroll-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#24334A] bg-[#0F1728] text-[#8EA0BC] hover:border-[#3BE0AF] hover:text-[#EEF4FF]"
                onClick={() => scrollWeekSlider(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Scroll week left</span>
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>Scroll week left</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="week-hover-trash-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#24334A] bg-[#0F1728] text-[#8EA0BC] transition hover:border-[#EF6F7A] hover:text-[#F7A7AE]"
                onClick={() => onDeleteWeek(week.id)}
              >
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete {week.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>Delete week</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-scroll-direction="right"
                className="program-planner-scroll-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#24334A] bg-[#0F1728] text-[#8EA0BC] hover:border-[#3BE0AF] hover:text-[#EEF4FF]"
                onClick={() => scrollWeekSlider(1)}
              >
                <ArrowRight className="h-4 w-4" />
                <span className="sr-only">Scroll week right</span>
              </button>
            </TooltipTrigger>
            <TooltipContent sideOffset={8}>Scroll week right</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return
          onSwapDayContent(week.id, active.id, over.id)
        }}
      >
        <div className="program-planner-scroll-shell relative min-w-0 overflow-hidden">
          <div ref={weekSliderRef} className="program-planner-scroll-track overflow-x-auto scroll-smooth pb-2">
            <SortableContext items={week.daySlots.map((day) => day.id)} strategy={horizontalListSortingStrategy}>
              <div className="grid min-w-[1960px] auto-cols-[260px] grid-flow-col gap-4">
                {week.daySlots.map((day) => (
                  <SortableDayLane
                    key={day.id}
                    day={day}
                    onAddWorkout={onAddWorkoutToDay}
                    onOpenWorkoutDetails={onOpenWorkoutDetails}
                    onReorderWorkouts={onReorderDayWorkouts}
                  />
                ))}
              </div>
            </SortableContext>
          </div>
        </div>
      </DndContext>
    </section>
  )
}

function SortableDayLane(props) {
  const { day } = props
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: day.id,
    data: {
      type: 'day-lane',
    },
  })

  return (
    <DayLane
      {...props}
      sortable={{
        attributes,
        listeners,
        setNodeRef,
        style: {
          transform: CSS.Transform.toString(transform),
          transition,
        },
      }}
    />
  )
}

export default function ProgramPlannerView({ program }) {
  const [planner, setPlanner] = useState(() => clonePlanner(program))
  const [selectedWorkout, setSelectedWorkout] = useState(null)

  useEffect(() => {
    setPlanner(clonePlanner(program))
  }, [program])

  const totalWorkouts = planner.weeks.reduce((total, week) => {
    return total + week.daySlots.reduce((weekTotal, day) => weekTotal + day.workouts.length, 0)
  }, 0)

  function handleAddWeek() {
    setPlanner((currentPlanner) => {
      const nextWeekNumber = currentPlanner.weeks.length + 1
      const nextWeekId = getNextWeekId(currentPlanner.weeks)

      return {
        ...currentPlanner,
        weekCount: nextWeekNumber,
        weeks: [
          ...currentPlanner.weeks,
          {
            id: nextWeekId,
            label: `Week ${nextWeekNumber}`,
            focus: 'New weekly focus',
            summary: 'Fresh week shell ready for coach adjustments.',
            daySlots: createFixedDaySlots(),
          },
        ],
      }
    })
  }

  function handleDeleteWeek(weekId) {
    setPlanner((currentPlanner) => {
      if (currentPlanner.weeks.length === 1) {
        return currentPlanner
      }

      const nextWeeks = currentPlanner.weeks.filter((week) => week.id !== weekId)
      return {
        ...currentPlanner,
        weekCount: nextWeeks.length,
        weeks: nextWeeks,
      }
    })
  }

  function handleSwapDayContent(weekId, activeDayId, overDayId) {
    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      weeks: currentPlanner.weeks.map((week) => {
        if (week.id !== weekId) {
          return week
        }

        return {
          ...week,
          daySlots: swapDayLaneContent(week.daySlots, activeDayId, overDayId),
        }
      }),
    }))
  }

  function handleReorderWorkouts(weekId, dayId, activeWorkoutId, overWorkoutId) {
    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      weeks: currentPlanner.weeks.map((week) => {
        if (week.id !== weekId) {
          return week
        }

        return {
          ...week,
          daySlots: reorderWorkoutCards(week.daySlots, dayId, dayId, activeWorkoutId, overWorkoutId),
        }
      }),
    }))
  }

  function handleAddWorkout(weekId, dayId) {
    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      weeks: currentPlanner.weeks.map((week) => {
        if (week.id !== weekId) {
          return week
        }

        return {
          ...week,
          daySlots: week.daySlots.map((day) => {
            if (day.id !== dayId) {
              return day
            }

            return {
              ...day,
              workouts: [
                ...day.workouts,
                {
                  id: `${week.id}-${day.id}-workout-${day.workouts.length + 1}`,
                  title: `New workout ${day.workouts.length + 1}`,
                  blockLabel: 'Main Work',
                  duration: '30 min',
                  coachNote: 'Stub workout card added locally for planner testing.',
                  sections: [{ id: `${week.id}-${day.id}-section-1`, title: 'A1', description: 'Add the first exercise block.' }],
                },
              ],
            }
          }),
        }
      }),
    }))
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="grid min-w-0 gap-6">
        <Card className="rounded-[30px] border-[#24334A] bg-[#0F1728] shadow-[0_30px_70px_rgba(0,0,0,0.34)]">
          <CardHeader className="grid gap-5 px-6 py-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="outline" className="rounded-[12px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]">
                  <Link href="/admin/programs">
                    <ArrowLeft className="h-4 w-4" />
                    Back to programs
                  </Link>
                </Button>
                <span className="program-planner-header-kicker inline-flex items-center rounded-full border border-[#24334A] bg-[#111D30] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8EA0BC]">
                  Program planner
                </span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <h1 className="text-3xl font-semibold text-[#EEF4FF]">{planner.title}</h1>
                  <p className="max-w-3xl text-sm text-[#8EA0BC]">{planner.goal}</p>
                </div>

                <div className="program-planner-header-summary-card grid gap-3 rounded-[20px] border border-[#24334A] bg-[#111D30] px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#60708F]">Coach-managed progression plan</p>
                    <p className="text-sm text-[#A8B7CD]">Schedule summary</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-[#DCE6F8] sm:justify-end">
                    <span>{planner.athleteLabel}</span>
                    <span>{planner.duration}</span>
                    <span>{planner.weekCount} weeks</span>
                    <span>{totalWorkouts} workouts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:self-center">
              <Button type="button" variant="outline" className="rounded-[12px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]">
                Assign program
              </Button>
              <Button type="button" className="rounded-[12px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]" onClick={handleAddWeek}>
                <Plus className="h-4 w-4" />
                Add week
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid gap-5">
          {planner.weeks.map((week) => (
            <ProgramWeekRow
              key={week.id}
              week={week}
              onAddWorkoutToDay={(dayId) => handleAddWorkout(week.id, dayId)}
              onDeleteWeek={handleDeleteWeek}
              onOpenWorkoutDetails={(workout, dayLabel) => setSelectedWorkout({ workout, weekLabel: week.label, dayLabel })}
              onReorderDayWorkouts={(dayId, activeWorkoutId, overWorkoutId) => handleReorderWorkouts(week.id, dayId, activeWorkoutId, overWorkoutId)}
              onSwapDayContent={handleSwapDayContent}
            />
          ))}
        </div>
      </div>

      <Sheet open={Boolean(selectedWorkout)} onOpenChange={(isOpen) => !isOpen && setSelectedWorkout(null)}>
        <SheetContent side="right" className="border-l border-[#24334A] bg-[#0F1728] text-[#DCE6F8] sm:max-w-[420px]">
          <SheetHeader className="border-b border-[#24334A] px-6 py-5">
            <SheetTitle className="text-[#EEF4FF]">Workout details</SheetTitle>
            <SheetDescription className="text-[#8EA0BC]">
              {selectedWorkout ? `${selectedWorkout.weekLabel} · ${selectedWorkout.dayLabel}` : 'Select a workout card.'}
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-4 px-6 py-6">
            <div className="space-y-2">
              <Badge className="border border-transparent bg-[#153C35] text-[#7DF5CD]">{selectedWorkout?.workout.blockLabel ?? 'Main Work'}</Badge>
              <h3 className="text-xl font-semibold text-[#EEF4FF]">{selectedWorkout?.workout.title ?? 'Workout'}</h3>
              <p className="text-sm text-[#8EA0BC]">{selectedWorkout?.workout.coachNote ?? 'Pick a workout card to inspect the section stack.'}</p>
            </div>
            <div className="grid gap-3">
              {(selectedWorkout?.workout.sections ?? []).map((section) => (
                <div key={section.id} className="rounded-[16px] border border-[#24334A] bg-[#111D30] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#EEF4FF]">{section.title}</p>
                    <span className="text-xs uppercase tracking-[0.16em] text-[#60708F]">Section</span>
                  </div>
                  <p className="mt-2 text-sm text-[#8EA0BC]">{section.description}</p>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  )
}
