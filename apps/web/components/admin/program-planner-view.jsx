'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeft, ArrowRight, ChevronDown, GripVertical, LoaderCircle, MoreHorizontal, Plus, Sparkles, Trash2, Upload } from 'lucide-react'

import AiWorkoutDraftSheet from '@/components/admin/ai-workout-draft-sheet'
import WorkoutTrainingBuilder from '@/components/admin/workout-training-builder'
import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import CompactFileUpload from '@/components/ui/compact-file-upload'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { KanbanBoard, KanbanColumn, KanbanItem } from '@/components/ui/kanban'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Textarea from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { createEmptyProgramWeek, renumberProgramWeeks, reorderWorkoutCards, swapDayLaneContent } from './program-planner-utils'

const ALL_WORKOUT_TEMPLATE_CATEGORIES = 'all'

function clonePlanner(program) {
  return JSON.parse(JSON.stringify(program))
}

function resolvePlannerDayIndex(day = {}) {
  const fromId = String(day.id || '').match(/(\d+)$/)?.[1]
  const fromLabel = String(day.label || '').match(/(\d+)$/)?.[1]
  const parsed = Number(fromId || fromLabel || 0)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

function createPlannerWorkoutDetailsValues(workout = {}, mode = 'edit') {
  const duplicateSuffix = mode === 'duplicate' ? ' copy' : ''

  return {
    name: `${workout.title ?? 'Workout'}${duplicateSuffix}`,
    duration: workout.duration ?? '30 min',
    thumbnailName: workout.thumbnailName ?? '',
    status: workout.status ?? 'active',
    focusArea: workout.focusArea ?? 'main-work',
    description: workout.coachNote ?? '',
  }
}

function createPlannerWorkoutTrainingSections(workout = {}) {
  return (workout.sections ?? []).map((section, sectionIndex) => ({
    id: section.id ?? `planner-section-${sectionIndex + 1}`,
    label: section.title ?? `A${sectionIndex + 1}`,
    isExpanded: true,
    showInstruction: Boolean(section.description),
    instruction: section.description ?? '',
    draftExerciseQuery: '',
    exercises: section.exercises ?? [],
  }))
}

function createDraftWorkoutSetRows(weeks = [], sectionIndex, exerciseIndex) {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return [{ id: `planner-draft-set-${sectionIndex}-${exerciseIndex}-1`, tempo: '', effort: '', side: '', duration: '', distance: '', rest: '', reps: '' }]
  }

  return weeks.flatMap((week, weekIndex) => {
    const setCount = Math.max(1, Number(week?.sets ?? 1))
    return Array.from({ length: setCount }, (_, setIndex) => ({
      id: `planner-draft-set-${sectionIndex}-${exerciseIndex}-${weekIndex}-${setIndex}`,
      tempo: week?.tempo ?? '',
      effort: week?.week ? `Week ${week.week}` : '',
      side: String(week?.reps ?? week?.duration ?? '').toLowerCase().includes('/side') ? 'L/R' : '',
      duration: week?.duration ?? '',
      distance: week?.distance ?? '',
      rest: week?.restSeconds ? `${week.restSeconds}s` : '',
      reps: week?.reps ?? '',
    }))
  })
}

function createDraftWorkoutTrainingSections(draftSections = []) {
  return draftSections.map((section, sectionIndex) => ({
    id: `planner-draft-section-${sectionIndex}`,
    label: section?.label ?? `Section ${sectionIndex + 1}`,
    isExpanded: true,
    showInstruction: Boolean(section?.instructions ?? section?.blockLabel),
    instruction: section?.instructions ?? (section?.blockLabel ? `Block ${section.blockLabel}` : ''),
    draftExerciseQuery: '',
    exercises: (section?.exercises ?? []).map((exercise, exerciseIndex) => ({
      id: `planner-draft-exercise-${sectionIndex}-${exerciseIndex}`,
      title: exercise?.exerciseMatch?.exerciseName || exercise?.name || 'Exercise',
      exerciseId: exercise?.exerciseMatch?.exerciseId || '',
      isExpanded: exerciseIndex === 0,
      showInstruction: Boolean(exercise?.notes),
      instruction: exercise?.notes ?? '',
      sets: createDraftWorkoutSetRows(exercise?.weeks, sectionIndex, exerciseIndex),
    })),
  }))
}

function createWorkoutSectionsFromTrainingSections(trainingSections = []) {
  return trainingSections.map((section, sectionIndex) => ({
    id: section.id ?? `planner-section-${sectionIndex + 1}`,
    title: section.label ?? `A${sectionIndex + 1}`,
    description: section.instruction || summarizeTrainingSection(section),
    exercises: section.exercises ?? [],
  }))
}

function createProgramBlocksFromWorkoutSections(sections = []) {
  return sections.map((section, sectionIndex) => ({
    id: section.id ?? `program-block-${sectionIndex + 1}`,
    title: section.title ?? section.label ?? `A${sectionIndex + 1}`,
    description: section.description ?? section.instruction ?? '',
  }))
}

function summarizeTrainingSection(section = {}) {
  const exerciseCount = section.exercises?.length ?? 0
  const setCount = section.exercises?.reduce((total, exercise) => total + (exercise.sets?.length ?? 0), 0) ?? 0

  if (exerciseCount && setCount) return `${exerciseCount} exercises · ${setCount} sets`
  if (exerciseCount) return `${exerciseCount} exercises configured.`
  return 'Add the first exercise block.'
}

function createPlannerWorkoutFromTrainingSections({ id, title, trainingSections, source = 'manual', sourceFileName = '' }) {
  const sections = createWorkoutSectionsFromTrainingSections(trainingSections)

  return {
    id,
    title,
    source,
    sourceFileName,
    blockLabel: 'Main Work',
    duration: '30 min',
    status: 'active',
    focusArea: 'main-work',
    coachNote: 'Coach-built workout with editable training blocks, exercises, and sets.',
    programBlocks: createProgramBlocksFromWorkoutSections(sections),
    sections,
  }
}

function decorateAiImportPlannerWorkout(workout, acceptedDraft) {
  return {
    ...workout,
    source: 'ai-import',
    sourceFileName: acceptedDraft?.workout?.sourceFileName ?? '',
  }
}

function appendAiWorkoutDraftToPlanner(plannerSnapshot, resolvedTarget, persistedDraftWorkout) {
  return {
    ...plannerSnapshot,
    weeks: plannerSnapshot.weeks.map((week) => week.id === resolvedTarget.weekId ? {
      ...week,
      daySlots: week.daySlots.map((day) => day.id === resolvedTarget.dayId ? { ...day, workouts: [...day.workouts, persistedDraftWorkout] } : day),
    } : week),
  }
}

function removeAcceptedAiWorkoutDraft(drafts = [], acceptedDraft) {
  const acceptedSourceFileName = acceptedDraft?.workout?.sourceFileName
  const acceptedWorkoutName = acceptedDraft?.workout?.name
  let removedDraft = false

  return drafts.filter((draftItem) => {
    if (removedDraft) return true
    const isAcceptedDraft = acceptedSourceFileName
      ? draftItem?.workout?.sourceFileName === acceptedSourceFileName
      : draftItem?.workout?.name === acceptedWorkoutName

    if (!isAcceptedDraft) return true
    removedDraft = true
    return false
  })
}

function normalizePhaseLabel(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/^p(\d+)$/, 'phase $1')
    .replace(/\s+/g, ' ')
}

function resolveProgramPhaseIdForDraft(planner = {}, acceptedDraft = {}) {
  const draftPhaseLabel = normalizePhaseLabel(acceptedDraft?.workout?.phase)
  if (!draftPhaseLabel) return null

  const matchedPhase = planner.phases?.find((phase) => normalizePhaseLabel(phase.name ?? phase.label) === draftPhaseLabel)
  return matchedPhase?.id || null
}

function resolveClickedAiWorkoutDraftTarget(planner = {}, clickedTarget = {}) {
  const clickedWeek = planner.weeks?.find((week) => week.id === clickedTarget?.weekId || week.label === clickedTarget?.weekLabel)
  const clickedDay = clickedWeek?.daySlots?.find((day) => day.id === clickedTarget?.dayId || day.label === clickedTarget?.dayLabel)

  return { week: clickedWeek, day: clickedDay, weekId: clickedWeek?.id ?? clickedTarget?.weekId, dayId: clickedDay?.id ?? clickedTarget?.dayId, usedDraftRouting: false }
}

function resolveAiWorkoutDraftTarget(planner = {}, clickedTarget = {}, acceptedDraft = {}) {
  const clickedResolvedTarget = resolveClickedAiWorkoutDraftTarget(planner, clickedTarget)
  const draftWeekNumber = Number(acceptedDraft?.workout?.weekNumber)
  const draftDayNumber = Number(acceptedDraft?.workout?.dayNumber)

  if (!Number.isInteger(draftWeekNumber) || draftWeekNumber < 1 || !Number.isInteger(draftDayNumber) || draftDayNumber < 1) {
    return clickedResolvedTarget
  }

  const draftWeek = planner.weeks?.[draftWeekNumber - 1]
  const draftDay = draftWeek?.daySlots?.find((day) => day.label === `Day ${draftDayNumber}` || day.id === `day-${draftDayNumber}`)
  if (!draftWeek || !draftDay) return clickedResolvedTarget

  return { week: draftWeek, day: draftDay, weekId: draftWeek.id, dayId: draftDay.id, usedDraftRouting: true }
}

function formatAiWorkoutDraftTargetLabel(target = {}) {
  const weekLabel = target.week?.label ?? target.weekLabel ?? 'Selected week'
  const dayLabel = target.day?.label ?? target.dayLabel ?? 'selected day'
  return `${weekLabel} · ${dayLabel}`
}

function hasDuplicateAiImportSourceFile(day = {}, draft = {}) {
  const sourceFileName = String(draft?.workout?.sourceFileName || '').trim().toLowerCase()
  if (!sourceFileName) return false

  return (day?.workouts ?? []).some((workout) => {
    return workout?.source === 'ai-import'
      && String(workout?.sourceFileName || '').trim().toLowerCase() === sourceFileName
  })
}

function createAiWorkoutDraftDestinationPreview(planner = {}, clickedTarget = {}, draft = {}) {
  const resolvedTarget = resolveAiWorkoutDraftTarget(planner, clickedTarget, draft)
  const clickedTargetLabel = formatAiWorkoutDraftTargetLabel(resolveClickedAiWorkoutDraftTarget(planner, clickedTarget))
  const resolvedTargetLabel = formatAiWorkoutDraftTargetLabel(resolvedTarget)
  const hasDraftRoutingMetadata = Boolean(draft?.workout?.weekNumber || draft?.workout?.dayNumber)
  const usedClickedFallback = hasDraftRoutingMetadata && !resolvedTarget.usedDraftRouting
  const existingWorkoutCount = resolvedTarget.day?.workouts?.length ?? 0
  const duplicateSourceFileName = hasDuplicateAiImportSourceFile(resolvedTarget.day, draft)

  return {
    isFallback: usedClickedFallback,
    shortLabel: resolvedTargetLabel,
    fallbackLabel: clickedTargetLabel,
    existingWorkoutCount,
    duplicateSourceFileName,
    appendWarning: existingWorkoutCount > 0 ? `Target day already has ${existingWorkoutCount} workout${existingWorkoutCount === 1 ? '' : 's'}. This import will append below existing workouts.` : '',
    duplicateWarning: duplicateSourceFileName ? `This PDF file is already imported in ${resolvedTargetLabel}. Accepting will append another reviewed copy.` : '',
    message: usedClickedFallback ? `PDF says Week ${draft?.workout?.weekNumber ?? 'unknown'} · Day ${draft?.workout?.dayNumber ?? 'unknown'}, using clicked lane: ${clickedTargetLabel}` : `Will place into: ${resolvedTargetLabel}`,
  }
}

function formatProgramBlockPreview(block) {
  return block.description || 'No block instructions yet.'
}

function getWorkoutProgramBlocks(workout = {}) {
  return workout.programBlocks ?? createProgramBlocksFromWorkoutSections(workout.sections ?? [])
}

const PLANNER_WORKOUT_TYPE_COLORS = {
  warmup: { bgColor: '#a9d6e5', textColor: '#014f86' },
  speedAccelerator: { bgColor: '#fae0e4', textColor: '#ff7096' },
  edgeWork: { bgColor: '#dec9e9', textColor: '#815ac0' },
  conditioning: { bgColor: '#ffedd8', textColor: '#a47148' },
  fallback: { bgColor: '#dbeafe', textColor: '#1d4ed8' },
}

function normalizeWorkoutTypeKey(value = '') {
  const normalized = String(value || '').trim().toLowerCase().replace(/[\s_-]+/g, ' ')

  if (['warmup', 'warm up'].includes(normalized)) return 'warmup'
  if (['speed accelerator', 'speed'].includes(normalized)) return 'speedAccelerator'
  if (normalized === 'edge work') return 'edgeWork'
  if (normalized === 'conditioning') return 'conditioning'
  return 'fallback'
}

function getWorkoutBlockTypeColors(workout = {}) {
  return PLANNER_WORKOUT_TYPE_COLORS[normalizeWorkoutTypeKey(workout.blockLabel || workout.focusArea)] || PLANNER_WORKOUT_TYPE_COLORS.fallback
}

function getWorkoutBlockBadgeStyle(workout = {}) {
  const typeColors = getWorkoutBlockTypeColors(workout)

  return {
    backgroundColor: workout.blockBgColor || typeColors.bgColor,
    color: workout.blockTextColor || typeColors.textColor,
  }
}

function mapProgramWorkoutSetToBuilderSet(row = {}) {
  return {
    id: row.id,
    reps: row.target_reps == null ? '' : String(row.target_reps),
    duration: row.target_duration_seconds == null ? '' : `${row.target_duration_seconds}s`,
    distance: row.target_distance == null ? '' : `${row.target_distance}${row.target_distance_unit ? ` ${row.target_distance_unit}` : ''}`,
    effort: row.target_rpe == null ? '' : String(row.target_rpe),
    rest: row.target_rest_seconds == null ? '' : `${row.target_rest_seconds}s`,
    tempo: row.notes ?? '',
    side: '',
  }
}

function mapProgramWorkoutTreeToPlannerWorkout(tree = {}) {
  const workout = tree.workout ?? {}
  const blocks = Array.isArray(tree.blocks) && tree.blocks.length ? tree.blocks : [{ id: `${workout.id}-main`, title: workout.workout_templates?.training_type || 'Main Work', instructions: workout.notes ?? '' }]
  const exercises = Array.isArray(tree.exercises) ? tree.exercises : []
  const sets = Array.isArray(tree.sets) ? tree.sets : []
  const setsByExerciseId = sets.reduce((map, setRow) => {
    if (!setRow.program_workout_exercise_id) return map
    if (!map.has(setRow.program_workout_exercise_id)) map.set(setRow.program_workout_exercise_id, [])
    map.get(setRow.program_workout_exercise_id).push(setRow)
    return map
  }, new Map())

  return {
    id: workout.id,
    programWorkoutId: workout.id,
    programDayId: workout.program_day_id ?? null,
    title: workout.name_snapshot || workout.workout_templates?.name || 'Workout',
    source: workout.import_source ?? 'manual',
    sourceFileName: workout.import_source_file_name ?? '',
    blockLabel: workout.workout_templates?.training_type || blocks[0]?.title || 'Main Work',
    blockBgColor: workout.bg_color || workout.workout_templates?.bg_color || null,
    blockTextColor: workout.text_color || workout.workout_templates?.text_color || null,
    duration: workout.workout_templates?.estimated_duration_minutes ? `${workout.workout_templates.estimated_duration_minutes} min` : '30 min',
    status: workout.status || 'scheduled',
    focusArea: workout.workout_templates?.training_type || 'main-work',
    coachNote: workout.notes || workout.workout_templates?.description || '',
    programBlocks: blocks.map((block, blockIndex) => ({
      id: block.id,
      title: block.title || block.block_code || `A${blockIndex + 1}`,
      description: block.instructions || '',
    })),
    sections: blocks.map((block, blockIndex) => ({
      id: block.id,
      title: block.title || block.block_code || `A${blockIndex + 1}`,
      description: block.instructions || '',
      exercises: exercises
        .filter((exercise) => blocks.length === 1 && block.id === `${workout.id}-main` ? !exercise.program_workout_block_id : exercise.program_workout_block_id === block.id)
        .map((exercise) => ({
          id: exercise.id,
          title: exercise.name_snapshot || 'Exercise',
          instruction: exercise.notes || '',
          sets: (setsByExerciseId.get(exercise.id) ?? []).map(mapProgramWorkoutSetToBuilderSet),
        })),
    })),
  }
}

function createProgramWorkoutPayload({ planner, day, detailsValues, trainingSections, sortOrder }) {
  return {
    programId: planner.id,
    programDayId: day?.programDayId,
    name_snapshot: detailsValues.name,
    notes: detailsValues.description,
    status: detailsValues.status === 'active' ? 'scheduled' : detailsValues.status,
    scheduledDate: day?.date ?? null,
    sortOrder,
    trainingSections,
  }
}

function createProgramWorkoutTemplatePayload({ planner, day, template, values, sortOrder }) {
  return {
    programId: planner.id,
    programDayId: day?.programDayId,
    workoutTemplateId: values.workoutTemplateId,
    name_snapshot: template?.name,
    status: 'scheduled',
    startDate: values.startDate,
    endDate: values.startDate,
    startTime: values.startTime,
    endTime: values.endTime,
    scheduledDate: values.startDate,
    sortOrder,
  }
}

function createProgramWorkoutDraftPayload({ planner, day, acceptedDraft, trainingSections, sortOrder }) {
  return {
    createProgramPlanFromDraft: true,
    programId: planner.id,
    programDayId: day?.programDayId,
    programWeekId: day?.programWeekId,
    programPhaseId: resolveProgramPhaseIdForDraft(planner, acceptedDraft),
    workout: acceptedDraft?.workout,
    importSource: 'ai-import',
    importSourceFileName: acceptedDraft?.workout?.sourceFileName ?? '',
    name_snapshot: acceptedDraft?.workout?.name,
    notes: acceptedDraft?.workout?.description ?? acceptedDraft?.workout?.notes ?? '',
    status: 'scheduled',
    scheduledDate: day?.date ?? acceptedDraft?.workout?.startDate ?? null,
    sortOrder,
    trainingSections,
  }
}

function createWorkoutTemplateCreateValues(day = {}) {
  return {
    workoutTemplateId: '',
    startDate: day?.date ?? '',
    startTime: '09:00',
    endTime: '10:00',
  }
}

async function requestWorkoutTemplates() {
  const response = await fetch('/api/admin/workout-templates')
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error || 'Failed to load workout templates.')
  return Array.isArray(body.workoutTemplates) ? body.workoutTemplates : []
}

async function requestProgramDayCreate(payload) {
  const response = await fetch('/api/admin/program-days', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error || 'Failed to save program day.')
  if (!body?.programDay?.id) throw new Error('Program day save response did not include an id.')
  return body.programDay
}

async function requestProgramWorkoutCreate(payload) {
  const response = await fetch('/api/admin/program-workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error || 'Failed to create program workout.')
  const responseTree = body.programWorkoutTree?.programWorkoutTree ?? body.programWorkoutTree
  return mapProgramWorkoutTreeToPlannerWorkout(responseTree)
}

async function requestProgramWorkoutPatch(programWorkoutId, payload) {
  const response = await fetch(`/api/admin/program-workouts/${programWorkoutId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error || 'Failed to save program workout.')
  return mapProgramWorkoutTreeToPlannerWorkout(body.programWorkoutTree)
}

async function requestProgramWorkoutDelete(programWorkoutId) {
  const response = await fetch(`/api/admin/program-workouts/${programWorkoutId}`, {
    method: 'DELETE',
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error || 'Failed to delete program workout.')
  if (body?.programWorkoutId !== programWorkoutId) throw new Error('Program workout delete response did not confirm the requested workout id.')
  return body
}

function getPersistedProgramWorkoutDeleteId(workout = {}) {
  return workout.programWorkoutId || workout.id || null
}

function isLocalAiImportWorkout(workout = {}) {
  return workout.source === 'ai-import' && !workout.programWorkoutId
}

function replacePlannerWorkout(currentPlanner, selectedWorkout, nextWorkout) {
  return {
    ...currentPlanner,
    weeks: currentPlanner.weeks.map((week) => ({
      ...week,
      daySlots: week.daySlots.map((day) => ({
        ...day,
        workouts: day.workouts.map((workout) => (workout.id === selectedWorkout.workout.id ? nextWorkout : workout)),
      })),
    })),
  }
}

function removePlannerWorkout(currentPlanner, pendingDelete) {
  return {
    ...currentPlanner,
    weeks: currentPlanner.weeks.map((week) => ({
      ...week,
      daySlots: week.daySlots.map((day) => {
        const isTargetDay = week.id === pendingDelete.weekId && day.id === pendingDelete.dayId
        if (!isTargetDay) return day
        return {
          ...day,
          workouts: day.workouts.filter((workout) => workout.id !== pendingDelete.workout.id),
        }
      }),
    })),
  }
}

function insertPlannerWorkoutAfterSelected(currentPlanner, selectedWorkout, nextWorkout) {
  return {
    ...currentPlanner,
    weeks: currentPlanner.weeks.map((week) => ({
      ...week,
      daySlots: week.daySlots.map((day) => {
        const selectedWorkoutIndex = day.workouts.findIndex((workout) => workout.id === selectedWorkout.workout.id)
        const isSelectedDay = week.id === selectedWorkout.weekId && day.id === selectedWorkout.dayId
        const isSelectedLabel = week.label === selectedWorkout.weekLabel && day.label === selectedWorkout.dayLabel
        if (selectedWorkoutIndex === -1 && !isSelectedDay && !isSelectedLabel) return day

        const nextWorkouts = [...day.workouts]
        nextWorkouts.splice(selectedWorkoutIndex === -1 ? day.workouts.length : selectedWorkoutIndex + 1, 0, nextWorkout)
        return { ...day, workouts: nextWorkouts }
      }),
    })),
  }
}
function FieldLabel({ children, htmlFor }) {
  return (
    <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor={htmlFor}>
      {children}
    </label>
  )
}

function FieldInput({ id, value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full min-w-0 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] outline-none placeholder:text-[var(--admin-dashboard-card-muted)] focus:border-[var(--admin-shell-accent)]"
      placeholder={placeholder}
    />
  )
}

function DayLane({ day, weekId, weekLabel, onAddWorkout, onImportAiWorkout, onOpenWorkoutEditor, onOpenWorkoutDeleteDialog, onReorderWorkouts, sortable }) {
  const dayId = day.id
  const [expandedWorkoutBlockIds, setExpandedWorkoutBlockIds] = useState(() => new Set())

  function toggleWorkoutBlocks(event, workoutId) {
    event.preventDefault()
    event.stopPropagation()
    setExpandedWorkoutBlockIds((currentIds) => {
      const nextIds = new Set(currentIds)
      if (nextIds.has(workoutId)) {
        nextIds.delete(workoutId)
      } else {
        nextIds.add(workoutId)
      }
      return nextIds
    })
  }

  function openWorkoutDeleteDialogFromMenu(event, deleteContext) {
    event.preventDefault?.()
    event.stopPropagation?.()
    onOpenWorkoutDeleteDialog(deleteContext)
  }

  return (
    <div ref={sortable.setNodeRef} style={sortable.style} className="min-w-[260px] flex-1">
      <Card className="program-planner-day-card h-full rounded-[22px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)]">
        <CardHeader className="gap-3 border-b border-[var(--admin-dashboard-card-border)] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{day.label}</CardTitle>
              <CardDescription className="text-xs text-[var(--admin-dashboard-card-muted)]">{day.summary}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="program-planner-icon-button inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-muted)] hover:border-[var(--admin-shell-primary-button-bg)] hover:text-[var(--admin-shell-primary-button-bg)]"
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
                className="program-planner-icon-button rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-muted)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-primary-button-bg)]"
                onClick={() => onAddWorkout(day.id)}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">Add workout to {day.label}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="program-planner-icon-button rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-muted)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-primary-button-bg)]"
                onClick={() => onImportAiWorkout(day.id)}
              >
                <Sparkles className="h-4 w-4" />
                <span className="sr-only">Import AI Workout into {day.label}</span>
              </Button>
            </div>
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--admin-dashboard-card-muted)]">{day.focus}</p>
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
                      onClick={() => onOpenWorkoutEditor({ mode: 'edit', workout, weekId, dayId, weekLabel, dayLabel: day.label })}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          onOpenWorkoutEditor({ mode: 'edit', workout, weekId, dayId, weekLabel, dayLabel: day.label })
                        }
                      }}
                      className="program-planner-workout-card grid w-full cursor-pointer gap-3 rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4 text-left transition hover:border-[var(--admin-shell-primary-button-bg)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <Badge className="program-planner-workout-training-type-badge border border-transparent" style={getWorkoutBlockBadgeStyle(workout)}>{workout.blockLabel}</Badge>
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{workout.title}</p>
                            {workout.source === 'ai-import' ? (
                              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-shell-primary-button-bg)]">
                                AI import{workout.sourceFileName ? ` · ${workout.sourceFileName}` : ''}
                              </p>
                            ) : null}
                            <p className="text-xs text-[var(--admin-dashboard-card-muted)]">{workout.duration}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={(event) => event.stopPropagation()}
                              className="program-planner-icon-button inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-muted)] hover:text-[var(--admin-shell-primary-button-bg)]"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open workout actions</span>
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Workout actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(event) => event.stopPropagation()} onSelect={() => onOpenWorkoutEditor({ mode: 'edit', workout, weekId, dayId, weekLabel, dayLabel: day.label })}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={(event) => event.stopPropagation()} onSelect={() => onOpenWorkoutEditor({ mode: 'duplicate', workout, weekId, dayId, weekLabel, dayLabel: day.label })}>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(event) => openWorkoutDeleteDialogFromMenu(event, { workout, weekId, dayId, weekLabel, dayLabel: day.label })}
                              onSelect={(event) => openWorkoutDeleteDialogFromMenu(event, { workout, weekId, dayId, weekLabel, dayLabel: day.label })}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="program-planner-workout-blocks grid gap-2">
                        {getWorkoutProgramBlocks(workout)
                          .slice(0, expandedWorkoutBlockIds.has(workout.id) ? getWorkoutProgramBlocks(workout).length : 2)
                          .map((programBlock) => (
                            <div key={programBlock.id} className="program-planner-workout-block rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2">
                              <p className="text-xs font-semibold text-[var(--admin-dashboard-card-text)]">{programBlock.title}</p>
                              <p className="mt-1 text-xs text-[var(--admin-dashboard-card-muted)]">{formatProgramBlockPreview(programBlock)}</p>
                            </div>
                          ))}
                        {getWorkoutProgramBlocks(workout).length > 2 ? (
                          <button
                            type="button"
                            className="program-planner-workout-block-toggle justify-self-start text-xs font-semibold text-[var(--admin-shell-primary-button-bg)] hover:underline"
                            onClick={(event) => toggleWorkoutBlocks(event, workout.id)}
                          >
                            {expandedWorkoutBlockIds.has(workout.id) ? 'Show less' : `Show more (${getWorkoutProgramBlocks(workout).length - 2})`}
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </KanbanItem>
                ))
              ) : (
                <div className="program-planner-empty-workout-card rounded-[18px] border border-dashed border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-8 text-center text-sm text-[var(--admin-dashboard-card-muted)]">
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

function ProgramWeekRow({ week, onAddWorkoutToDay, onImportAiWorkoutToDay, onDeleteWeek, onOpenWorkoutEditor, onOpenWorkoutDeleteDialog, onReorderDayWorkouts, onSwapDayContent }) {
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
    <section className="program-planner-week-row group relative min-w-0 overflow-hidden rounded-[28px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-5 text-[var(--admin-dashboard-card-text)]">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[var(--admin-dashboard-card-muted)]">{week.label}</p>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                data-scroll-direction="left"
                className="program-planner-scroll-button program-planner-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--admin-shell-control-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-muted)] hover:text-[var(--admin-shell-primary-button-bg)]"
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
                className="week-hover-trash-button program-planner-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-muted)] transition hover:border-[var(--ui-color-danger)] hover:text-[var(--ui-color-danger)]"
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
                className="program-planner-scroll-button program-planner-icon-button inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--admin-shell-control-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-muted)] hover:text-[var(--admin-shell-primary-button-bg)]"
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
                    weekId={week.id}
                    weekLabel={week.label}
                    day={day}
                    onAddWorkout={onAddWorkoutToDay}
                    onImportAiWorkout={onImportAiWorkoutToDay}
                    onOpenWorkoutEditor={onOpenWorkoutEditor}
                    onOpenWorkoutDeleteDialog={onOpenWorkoutDeleteDialog}
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

export default function ProgramPlannerView({ program, enableLocalAiImportPersistence = false, allowUnauthenticatedAiWorkoutDrafts = false }) {
  const [planner, setPlanner] = useState(() => clonePlanner(program))
  const [selectedWorkout, setSelectedWorkout] = useState(null)
  const [selectedWorkoutMode, setSelectedWorkoutMode] = useState('edit')
  const [selectedWorkoutEditorTab, setSelectedWorkoutEditorTab] = useState('details')
  const [selectedWorkoutDetailsValues, setSelectedWorkoutDetailsValues] = useState(() => createPlannerWorkoutDetailsValues())
  const [selectedWorkoutTrainingSections, setSelectedWorkoutTrainingSections] = useState([])
  const [workoutPendingDelete, setWorkoutPendingDelete] = useState(null)
  const [createWorkoutTarget, setCreateWorkoutTarget] = useState(null)
  const [workoutTemplateOptions, setWorkoutTemplateOptions] = useState([])
  const [selectedWorkoutTemplateCategory, setSelectedWorkoutTemplateCategory] = useState(ALL_WORKOUT_TEMPLATE_CATEGORIES)
  const [isLoadingWorkoutTemplates, setIsLoadingWorkoutTemplates] = useState(false)
  const [createWorkoutValues, setCreateWorkoutValues] = useState(() => createWorkoutTemplateCreateValues())
  const [createWorkoutError, setCreateWorkoutError] = useState('')
  const [aiWorkoutImportTarget, setAiWorkoutImportTarget] = useState(null)
  const [aiWorkoutImportFiles, setAiWorkoutImportFiles] = useState([])
  const [aiWorkoutDrafts, setAiWorkoutDrafts] = useState([])
  const [isAiWorkoutDraftSheetOpen, setIsAiWorkoutDraftSheetOpen] = useState(false)
  const [aiWorkoutImportError, setAiWorkoutImportError] = useState('')
  const [isCreatingAiWorkoutDraft, setIsCreatingAiWorkoutDraft] = useState(false)
  const [isSavingAiWorkoutImportDay, setIsSavingAiWorkoutImportDay] = useState(false)
  const [isAcceptingAiWorkoutDraft, setIsAcceptingAiWorkoutDraft] = useState(false)

  const workoutTemplateCategories = useMemo(() => {
    return Array.from(new Set(workoutTemplateOptions.map((template) => template.training_type).filter(Boolean))).sort((firstCategory, secondCategory) => firstCategory.localeCompare(secondCategory))
  }, [workoutTemplateOptions])

  const filteredWorkoutTemplateOptions = useMemo(() => {
    if (selectedWorkoutTemplateCategory === ALL_WORKOUT_TEMPLATE_CATEGORIES) return workoutTemplateOptions
    return workoutTemplateOptions.filter((template) => template.training_type === selectedWorkoutTemplateCategory)
  }, [selectedWorkoutTemplateCategory, workoutTemplateOptions])
  const aiWorkoutImportNeedsPersistedDay = Boolean(aiWorkoutImportTarget?.day && !aiWorkoutImportTarget.day.programDayId && !enableLocalAiImportPersistence)
  const aiWorkoutImportNotice = aiWorkoutImportNeedsPersistedDay
    ? 'This day will be saved before reviewing the AI workout.'
    : ''
  const canReviewAiWorkoutDraft = Boolean(aiWorkoutImportFiles.length && !isCreatingAiWorkoutDraft && !isSavingAiWorkoutImportDay)
  const reviewAiWorkoutDraftButtonLabel = !aiWorkoutImportFiles.length
    ? 'Choose PDF first'
    : isSavingAiWorkoutImportDay
      ? 'Saving day…'
      : isCreatingAiWorkoutDraft
        ? 'Reviewing…'
        : aiWorkoutImportNeedsPersistedDay
          ? 'Save day + review'
          : 'Review AI draft'

  const selectedWorkoutTemplateCategoryLabel = selectedWorkoutTemplateCategory === ALL_WORKOUT_TEMPLATE_CATEGORIES
    ? 'Category'
    : selectedWorkoutTemplateCategory

  useEffect(() => {
    setPlanner(clonePlanner(program))
  }, [program])

  function handleDeleteWeek(weekId) {
    setPlanner((currentPlanner) => {
      if (currentPlanner.weeks.length === 1) {
        return currentPlanner
      }

      const nextWeeks = renumberProgramWeeks(currentPlanner.weeks.filter((week) => week.id !== weekId))
      return {
        ...currentPlanner,
        weekCount: nextWeeks.length,
        duration: `${nextWeeks.length} week${nextWeeks.length === 1 ? '' : 's'}`,
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

  async function handleAddWorkout(weekId, dayId) {
    const targetWeek = planner.weeks.find((week) => week.id === weekId)
    const targetDay = targetWeek?.daySlots.find((day) => day.id === dayId)
    setCreateWorkoutTarget({ weekId, dayId, weekLabel: targetWeek?.label, dayLabel: targetDay?.label, day: targetDay })
    setCreateWorkoutValues(createWorkoutTemplateCreateValues(targetDay))
    setSelectedWorkoutTemplateCategory(ALL_WORKOUT_TEMPLATE_CATEGORIES)
    setCreateWorkoutError('')
    setIsLoadingWorkoutTemplates(true)

    try {
      const templates = await requestWorkoutTemplates()
      setWorkoutTemplateOptions(templates)
      setCreateWorkoutValues((currentValues) => ({
        ...currentValues,
        workoutTemplateId: currentValues.workoutTemplateId || templates[0]?.id || '',
      }))
    } catch (error) {
      console.error('Failed to load workout templates.', error)
      setCreateWorkoutError(error.message || 'Failed to load workout templates.')
    } finally {
      setIsLoadingWorkoutTemplates(false)
    }
  }

  function handleCreateWorkoutValueChange(field, value) {
    setCreateWorkoutValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
  }

  function handleWorkoutTemplateCategoryChange(category) {
    setSelectedWorkoutTemplateCategory(category)

    const nextTemplates = category === ALL_WORKOUT_TEMPLATE_CATEGORIES
      ? workoutTemplateOptions
      : workoutTemplateOptions.filter((template) => template.training_type === category)

    setCreateWorkoutValues((currentValues) => ({
      ...currentValues,
      workoutTemplateId: nextTemplates[0]?.id || '',
    }))
  }

  function closeCreateWorkoutSheet() {
    setCreateWorkoutTarget(null)
    setCreateWorkoutError('')
  }

  function handleImportAiWorkout(weekId, dayId) {
    const targetWeek = planner.weeks.find((week) => week.id === weekId)
    const targetDay = targetWeek?.daySlots.find((day) => day.id === dayId)
    setAiWorkoutImportTarget({ weekId, dayId, weekLabel: targetWeek?.label, dayLabel: targetDay?.label, day: targetDay })
    setAiWorkoutImportFiles([])
    setAiWorkoutDrafts([])
    setAiWorkoutImportError('')
  }

  function closeAiWorkoutImport() {
    setAiWorkoutImportTarget(null)
    setAiWorkoutImportFiles([])
    setAiWorkoutDrafts([])
    setAiWorkoutImportError('')
    setIsAiWorkoutDraftSheetOpen(false)
  }

  function handleAiWorkoutImportFilesChange(files) {
    setAiWorkoutImportFiles(Array.isArray(files) ? files : files ? [files] : [])
  }

  async function resolvePersistedAiWorkoutImportTarget() {
    const currentTarget = aiWorkoutImportTarget
    const currentDay = currentTarget?.day
    const currentWeek = currentTarget?.week ?? planner.weeks?.find((week) => week.id === currentTarget?.weekId)
    const programWeekId = currentDay?.programWeekId ?? currentWeek?.programWeekId ?? null
    if (!currentDay) throw new Error('Choose a program day before reviewing the AI draft.')
    if (currentDay.programDayId || enableLocalAiImportPersistence) return currentTarget
    if (!programWeekId) throw new Error('This program week is not persisted yet, so the day cannot be saved.')

    setIsSavingAiWorkoutImportDay(true)
    const programDay = await requestProgramDayCreate({
      programWeekId,
      dayIndex: resolvePlannerDayIndex(currentDay),
      date: currentDay.date ?? null,
      name: currentDay.label ?? null,
      status: 'training',
    })
    const nextDay = {
      ...currentDay,
      programDayId: programDay.id,
      programWeekId: programDay.program_week_id ?? programWeekId,
      date: programDay.date ?? currentDay.date ?? null,
      summary: programDay.date || programDay.name || currentDay.summary,
      focus: programDay.status === 'off' ? 'Off day' : programDay.status === 'recovery' ? 'Recovery' : currentDay.focus,
    }
    const nextTarget = { ...currentTarget, day: nextDay }

    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      weeks: currentPlanner.weeks.map((week) => week.id === currentTarget.weekId ? {
        ...week,
        daySlots: week.daySlots.map((day) => day.id === currentTarget.dayId ? nextDay : day),
      } : week),
    }))
    setAiWorkoutImportTarget(nextTarget)
    return nextTarget
  }

  async function handleCreateAiWorkoutDrafts() {
    setAiWorkoutImportError('')
    if (!aiWorkoutImportFiles[0]) {
      setAiWorkoutImportError('Choose a PDF before reviewing the AI draft.')
      return
    }

    setIsCreatingAiWorkoutDraft(true)
    try {
      const resolvedImportTarget = await resolvePersistedAiWorkoutImportTarget()
      const formData = new FormData()
      aiWorkoutImportFiles.forEach((file) => formData.append('files', file))
      formData.append('programId', planner.id)
      formData.append('programDayId', resolvedImportTarget?.day?.programDayId ?? '')
      formData.append('programWeekId', resolvedImportTarget?.day?.programWeekId ?? '')

      const response = await fetch('/api/admin/ai-workout-drafts', {
        method: 'POST',
        headers: allowUnauthenticatedAiWorkoutDrafts ? { 'x-pplus-planner-ai-import-qa': 'true' } : undefined,
        body: formData,
      })
      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(body?.error || 'Failed to create AI workout drafts.')
      }

      setAiWorkoutDrafts(body.drafts ?? [])
      setIsAiWorkoutDraftSheetOpen(true)
    } catch (error) {
      console.error('Failed to create AI workout drafts.', error)
      setAiWorkoutImportError(error.message || 'Failed to create AI workout drafts.')
    } finally {
      setIsCreatingAiWorkoutDraft(false)
      setIsSavingAiWorkoutImportDay(false)
    }
  }

  async function createPersistedAiWorkoutDraftForTarget({ nextPlanner, acceptedDraft, resolvedTarget, batchIndex = 0 }) {
    const targetDay = resolvedTarget.day
    const nextWorkoutIndex = (targetDay?.workouts?.length ?? 0) + 1
    const trainingSections = createDraftWorkoutTrainingSections(acceptedDraft?.sections ?? [])

    if (!targetDay?.programDayId && !enableLocalAiImportPersistence) {
      throw new Error('This program day is not persisted yet, so an AI workout cannot be created.')
    }

    if (enableLocalAiImportPersistence) {
      return createPlannerWorkoutFromTrainingSections({
        id: `qa-ai-import-${Date.now()}-${batchIndex}`,
        title: acceptedDraft?.workout?.name ?? 'AI imported workout',
        trainingSections,
        source: 'ai-import',
        sourceFileName: acceptedDraft?.workout?.sourceFileName ?? '',
      })
    }

    const createdPlannerWorkout = await requestProgramWorkoutCreate(createProgramWorkoutDraftPayload({
      planner: nextPlanner,
      day: targetDay,
      acceptedDraft,
      trainingSections,
      sortOrder: nextWorkoutIndex,
    }))
    return decorateAiImportPlannerWorkout(createdPlannerWorkout, acceptedDraft)
  }

  async function handleAcceptAiWorkoutDraft(acceptedDraft) {
    if (!aiWorkoutImportTarget) return

    try {
      setIsAcceptingAiWorkoutDraft(true)
      const resolvedTarget = resolveAiWorkoutDraftTarget(planner, aiWorkoutImportTarget, acceptedDraft)
      const persistedDraftWorkout = await createPersistedAiWorkoutDraftForTarget({
        nextPlanner: planner,
        acceptedDraft,
        resolvedTarget,
      })
      setPlanner((currentPlanner) => appendAiWorkoutDraftToPlanner(currentPlanner, resolvedTarget, persistedDraftWorkout))
      const remainingDrafts = removeAcceptedAiWorkoutDraft(aiWorkoutDrafts, acceptedDraft)
      setAiWorkoutDrafts(remainingDrafts)
      if (remainingDrafts.length > 0) {
        setIsAiWorkoutDraftSheetOpen(true)
        return
      }
      closeAiWorkoutImport()
    } catch (error) {
      console.error('Failed to create planner workout from AI draft.', error)
      setAiWorkoutImportError(error.message || 'Failed to create AI workout from draft.')
    } finally {
      setIsAcceptingAiWorkoutDraft(false)
    }
  }

  async function handleAcceptAllRemainingAiWorkoutDrafts(acceptedDrafts = []) {
    if (!aiWorkoutImportTarget) return

    try {
      setIsAcceptingAiWorkoutDraft(true)
      let nextPlanner = planner
      for (const acceptedDraft of acceptedDrafts) {
        const resolvedTarget = resolveAiWorkoutDraftTarget(nextPlanner, aiWorkoutImportTarget, acceptedDraft)
        const persistedDraftWorkout = await createPersistedAiWorkoutDraftForTarget({
          nextPlanner,
          acceptedDraft,
          resolvedTarget,
          batchIndex: acceptedDrafts.indexOf(acceptedDraft),
        })
        nextPlanner = appendAiWorkoutDraftToPlanner(nextPlanner, resolvedTarget, persistedDraftWorkout)
      }

      setPlanner(nextPlanner)
      setAiWorkoutDrafts([])
      closeAiWorkoutImport()
    } catch (error) {
      console.error('Failed to create planner workouts from AI drafts.', error)
      setAiWorkoutImportError(error.message || 'Failed to create AI workouts from drafts.')
    } finally {
      setIsAcceptingAiWorkoutDraft(false)
    }
  }

  async function handleCreateWorkoutFromTemplate() {
    if (!createWorkoutTarget) return

    const targetDay = planner.weeks
      .find((week) => week.id === createWorkoutTarget.weekId || week.label === createWorkoutTarget.weekLabel)
      ?.daySlots.find((day) => day.id === createWorkoutTarget.dayId || day.label === createWorkoutTarget.dayLabel)
    const selectedTemplate = workoutTemplateOptions.find((template) => template.id === createWorkoutValues.workoutTemplateId)
    const nextWorkoutIndex = (targetDay?.workouts?.length ?? 0) + 1

    if (!selectedTemplate?.id) {
      setCreateWorkoutError('Select a workout template first.')
      return
    }
    if (!createWorkoutValues.startDate || !createWorkoutValues.startTime || !createWorkoutValues.endTime) {
      setCreateWorkoutError('Start date, start time, and end time are required.')
      return
    }
    if (!targetDay?.programDayId) {
      setCreateWorkoutError('This program day is not persisted yet, so a template copy cannot be created.')
      return
    }

    try {
      const persistedWorkout = await requestProgramWorkoutCreate(createProgramWorkoutTemplatePayload({
        planner,
        day: targetDay,
        template: selectedTemplate,
        values: createWorkoutValues,
        sortOrder: nextWorkoutIndex,
      }))
      setPlanner((currentPlanner) => ({
        ...currentPlanner,
        weeks: currentPlanner.weeks.map((week) => week.id === createWorkoutTarget.weekId ? {
          ...week,
          daySlots: week.daySlots.map((day) => day.id === createWorkoutTarget.dayId ? { ...day, workouts: [...day.workouts, persistedWorkout] } : day),
        } : week),
      }))
      closeCreateWorkoutSheet()
    } catch (error) {
      console.error('Failed to create planner workout from template.', error)
      setCreateWorkoutError(error.message || 'Failed to create workout from template.')
    }
  }

  function handleOpenWorkoutEditor({ mode = 'edit', workout, weekId, dayId, weekLabel, dayLabel }) {
    if (mode === 'duplicate') {
      setSelectedWorkout({ workout, weekId, dayId, weekLabel, dayLabel, isDraftDuplicate: true })
      setSelectedWorkoutMode(mode)
      setSelectedWorkoutEditorTab('details')
      setSelectedWorkoutDetailsValues(createPlannerWorkoutDetailsValues(workout, 'duplicate'))
      setSelectedWorkoutTrainingSections(createPlannerWorkoutTrainingSections(workout))
      return
    }

    setSelectedWorkout({ workout, weekId, dayId, weekLabel, dayLabel })
    setSelectedWorkoutMode(mode)
    setSelectedWorkoutEditorTab('details')
    setSelectedWorkoutDetailsValues(createPlannerWorkoutDetailsValues(workout, mode))
    setSelectedWorkoutTrainingSections(createPlannerWorkoutTrainingSections(workout))
  }

  function handleSelectedWorkoutDetailsChange(field, value) {
    setSelectedWorkoutDetailsValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
  }

  function handleOpenWorkoutDeleteDialog({ workout, weekId, dayId, weekLabel, dayLabel }) {
    setWorkoutPendingDelete({ workout, weekId, dayId, weekLabel, dayLabel })
  }

  async function handleConfirmWorkoutDelete() {
    if (!workoutPendingDelete) return

    try {
      const shouldDeleteLocalAiImportWorkout = enableLocalAiImportPersistence && isLocalAiImportWorkout(workoutPendingDelete.workout)
      if (!shouldDeleteLocalAiImportWorkout) {
        const persistedProgramWorkoutId = getPersistedProgramWorkoutDeleteId(workoutPendingDelete.workout)
        if (persistedProgramWorkoutId) {
          await requestProgramWorkoutDelete(persistedProgramWorkoutId)
        }
      }
      setPlanner((currentPlanner) => removePlannerWorkout(currentPlanner, workoutPendingDelete))
      setWorkoutPendingDelete(null)
    } catch (error) {
      console.error('Failed to delete planner workout.', error)
    }
  }

  async function handleSaveWorkoutEditor() {
    if (!selectedWorkout) return

    const nextSections = createWorkoutSectionsFromTrainingSections(selectedWorkoutTrainingSections)
    const nextWorkout = {
      ...selectedWorkout.workout,
      source: selectedWorkout.workout.source,
      sourceFileName: selectedWorkout.workout.sourceFileName,
      title: selectedWorkoutDetailsValues.name,
      duration: selectedWorkoutDetailsValues.duration,
      status: selectedWorkoutDetailsValues.status,
      focusArea: selectedWorkoutDetailsValues.focusArea,
      thumbnailName: selectedWorkoutDetailsValues.thumbnailName,
      blockLabel: selectedWorkoutDetailsValues.focusArea === 'main-work' ? 'Main Work' : selectedWorkoutDetailsValues.focusArea,
      coachNote: selectedWorkoutDetailsValues.description,
      programBlocks: createProgramBlocksFromWorkoutSections(nextSections),
      sections: nextSections,
    }

    const selectedDay = planner.weeks
      .find((week) => week.id === selectedWorkout.weekId || week.label === selectedWorkout.weekLabel)
      ?.daySlots.find((day) => day.id === selectedWorkout.dayId || day.label === selectedWorkout.dayLabel)
    const shouldSaveLocalAiImportWorkout = enableLocalAiImportPersistence && selectedWorkout.workout.source === 'ai-import'

    if (shouldSaveLocalAiImportWorkout && selectedWorkoutMode !== 'duplicate') {
      setPlanner((currentPlanner) => replacePlannerWorkout(currentPlanner, selectedWorkout, nextWorkout))
      setSelectedWorkout(null)
      return
    }

    try {
      if (selectedWorkoutMode === 'duplicate') {
        if (shouldSaveLocalAiImportWorkout || !selectedDay?.programDayId) {
          const localDuplicateWorkout = {
            ...nextWorkout,
            id: `${selectedWorkout.workout.id}-copy-${Date.now()}`,
            programWorkoutId: null,
          }
          setPlanner((currentPlanner) => insertPlannerWorkoutAfterSelected(currentPlanner, selectedWorkout, localDuplicateWorkout))
          setSelectedWorkout(null)
          return
        }

        const persistedDuplicateWorkout = await requestProgramWorkoutCreate(createProgramWorkoutPayload({
          planner,
          day: selectedDay,
          detailsValues: selectedWorkoutDetailsValues,
          trainingSections: selectedWorkoutTrainingSections,
          sortOrder: (selectedDay?.workouts?.length ?? 0) + 1,
        }))
        setPlanner((currentPlanner) => insertPlannerWorkoutAfterSelected(currentPlanner, selectedWorkout, persistedDuplicateWorkout))
        setSelectedWorkout(null)
        return
      }

      const shouldCreatePersistedWorkout = !selectedWorkout.workout.programWorkoutId
      const persistedWorkout = shouldCreatePersistedWorkout
        ? await requestProgramWorkoutCreate(createProgramWorkoutPayload({
            planner,
            day: selectedDay,
            detailsValues: selectedWorkoutDetailsValues,
            trainingSections: selectedWorkoutTrainingSections,
            sortOrder: (selectedDay?.workouts?.length ?? 0) + 1,
          }))
        : await requestProgramWorkoutPatch(selectedWorkout.workout.programWorkoutId, {
            details: {
              name_snapshot: selectedWorkoutDetailsValues.name,
              notes: selectedWorkoutDetailsValues.description,
              status: selectedWorkoutDetailsValues.status === 'active' ? 'scheduled' : selectedWorkoutDetailsValues.status,
            },
            trainingSections: selectedWorkoutTrainingSections,
          })

      setPlanner((currentPlanner) => replacePlannerWorkout(currentPlanner, selectedWorkout, persistedWorkout))
    } catch (error) {
      console.error('Failed to save planner workout.', error)
      if (selectedWorkoutMode !== 'duplicate') {
        setPlanner((currentPlanner) => replacePlannerWorkout(currentPlanner, selectedWorkout, nextWorkout))
      }
    }

    setSelectedWorkout(null)
  }

  function handleAddWeek() {
    setPlanner((currentPlanner) => {
      const nextWeeks = renumberProgramWeeks([
        ...currentPlanner.weeks,
        createEmptyProgramWeek(currentPlanner.weeks.length, currentPlanner.title),
      ])

      return {
        ...currentPlanner,
        weekCount: nextWeeks.length,
        duration: `${nextWeeks.length} week${nextWeeks.length === 1 ? '' : 's'}`,
        weeks: nextWeeks,
      }
    })
  }

  return (
    <TooltipProvider delayDuration={120}>
      <div className="grid min-w-0 gap-6">
        <div className="program-planner-page-header grid gap-4">
          <Button asChild variant="ghost" className="program-planner-back-button h-auto w-fit gap-2 rounded-none border-0 bg-transparent p-0 shadow-none hover:bg-transparent">
            <Link href="/admin/programs">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
          </Button>

          <div className="program-planner-heading-row flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="admin-shell-athletes-page-title">{planner.title}</h1>
            <Button type="button" className="min-h-[40px] w-fit rounded-[12px] bg-[var(--admin-shell-primary-button-bg)] text-[var(--admin-shell-primary-button-text)] hover:bg-[var(--admin-shell-primary-button-bg)]" onClick={handleAddWeek}>
              <Plus className="h-4 w-4" />
              Add Week
            </Button>
          </div>
        </div>

        <div className="grid gap-5">
          {planner.weeks.map((week) => (
            <ProgramWeekRow
              key={week.id}
              week={week}
              onAddWorkoutToDay={(dayId) => handleAddWorkout(week.id, dayId)}
              onImportAiWorkoutToDay={(dayId) => handleImportAiWorkout(week.id, dayId)}
              onDeleteWeek={handleDeleteWeek}
              onOpenWorkoutEditor={handleOpenWorkoutEditor}
              onOpenWorkoutDeleteDialog={handleOpenWorkoutDeleteDialog}
              onReorderDayWorkouts={(dayId, activeWorkoutId, overWorkoutId) => handleReorderWorkouts(week.id, dayId, activeWorkoutId, overWorkoutId)}
              onSwapDayContent={handleSwapDayContent}
            />
          ))}
        </div>
      </div>

      {createWorkoutTarget ? (
        <Sheet open={Boolean(createWorkoutTarget)} onOpenChange={(isOpen) => !isOpen && closeCreateWorkoutSheet()}>
          <SheetContent side="right" className="program-planner-create-workout-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
            <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
              <SheetTitle className="text-[var(--admin-dashboard-card-text)]">Create workout</SheetTitle>
              <SheetDescription className="text-[var(--admin-dashboard-card-muted)]">
                {createWorkoutTarget.weekLabel} · {createWorkoutTarget.dayLabel}. Select a workout template, then schedule the copied program workout.
              </SheetDescription>
            </SheetHeader>
            <div className="program-planner-sheet-scroll-content min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid gap-5">
                <div className="program-planner-create-workout-schedule grid w-full gap-4">
                  <div className="grid min-w-0 gap-2">
                    <FieldLabel htmlFor="planner-create-workout-start-date">Start date</FieldLabel>
                    <FieldInput id="planner-create-workout-start-date" type="date" value={createWorkoutValues.startDate} onChange={(value) => handleCreateWorkoutValueChange('startDate', value)} />
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <FieldLabel htmlFor="planner-create-workout-start-time">Start time</FieldLabel>
                    <FieldInput id="planner-create-workout-start-time" type="time" value={createWorkoutValues.startTime} onChange={(value) => handleCreateWorkoutValueChange('startTime', value)} />
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <FieldLabel htmlFor="planner-create-workout-end-time">End time</FieldLabel>
                    <FieldInput id="planner-create-workout-end-time" type="time" value={createWorkoutValues.endTime} onChange={(value) => handleCreateWorkoutValueChange('endTime', value)} />
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="program-planner-workout-templates-heading-row flex items-center justify-between gap-3">
                    <FieldLabel>Workout Templates</FieldLabel>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="admin-shell-athletes-example-columns-button" aria-label="Category">
                          <span className="truncate">{selectedWorkoutTemplateCategoryLabel}</span>
                          <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[220px] rounded-2xl border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-1 text-[var(--admin-dashboard-card-text)]"
                        style={{ boxShadow: 'var(--admin-shell-shadow)' }}
                      >
                        <DropdownMenuItem
                          className="rounded-xl focus:bg-[var(--admin-shell-nav-active-bg)] focus:text-[var(--admin-shell-nav-active-text)] data-[highlighted]:bg-[var(--admin-shell-nav-active-bg)] data-[highlighted]:text-[var(--admin-shell-nav-active-text)]"
                          onClick={() => handleWorkoutTemplateCategoryChange(ALL_WORKOUT_TEMPLATE_CATEGORIES)}
                        >
                          Category
                        </DropdownMenuItem>
                        {workoutTemplateCategories.map((category) => (
                          <DropdownMenuItem
                            key={category}
                            className="rounded-xl focus:bg-[var(--admin-shell-nav-active-bg)] focus:text-[var(--admin-shell-nav-active-text)] data-[highlighted]:bg-[var(--admin-shell-nav-active-bg)] data-[highlighted]:text-[var(--admin-shell-nav-active-text)]"
                            onClick={() => handleWorkoutTemplateCategoryChange(category)}
                          >
                            {category}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {isLoadingWorkoutTemplates ? (
                    <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-5 text-sm text-[var(--admin-dashboard-card-muted)]">Loading workout templates…</div>
                  ) : filteredWorkoutTemplateOptions.length ? (
                    <div className="program-planner-workout-template-list grid gap-3">
                      {filteredWorkoutTemplateOptions.map((template) => {
                        const isSelected = createWorkoutValues.workoutTemplateId === template.id
                        return (
                          <button
                            key={template.id}
                            type="button"
                            className={`program-planner-workout-template-option group grid gap-2 rounded-[16px] border px-4 py-3 text-left transition ${isSelected ? 'border-[var(--admin-shell-primary-button-bg)] bg-[color-mix(in_srgb,var(--admin-shell-primary-button-bg)_12%,transparent)]' : 'border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] hover:border-[var(--admin-shell-primary-button-bg)] hover:bg-[color-mix(in_srgb,var(--admin-shell-primary-button-bg)_12%,transparent)]'}`}
                            onClick={() => handleCreateWorkoutValueChange('workoutTemplateId', template.id)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{template.name}</p>
                              </div>
                              <Badge className="max-w-[150px] shrink min-w-0 whitespace-normal break-words border border-transparent text-center leading-tight sm:max-w-[180px]" style={getWorkoutBlockBadgeStyle({ blockLabel: template.training_type, blockBgColor: template.bg_color, blockTextColor: template.text_color })}>{template.training_type || 'Template'}</Badge>
                            </div>
                            <p className="text-xs text-[var(--admin-dashboard-card-muted)]">{template.section_count ?? 0} blocks · {template.exercise_count ?? 0} exercises · {template.set_count ?? 0} sets · {template.estimated_duration_minutes ?? 60} min</p>
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="rounded-[14px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-5 text-sm text-[var(--admin-dashboard-card-muted)]">No workout templates found for this category.</div>
                  )}
                </div>

                {createWorkoutError ? (
                  <div className="rounded-[12px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{createWorkoutError}</div>
                ) : null}
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5">
              <Button type="button" variant="outline" className="min-h-[40px] rounded-[12px]" onClick={closeCreateWorkoutSheet}>
                Cancel
              </Button>
              <Button type="button" className="min-h-[40px] rounded-[12px] bg-[var(--admin-shell-primary-button-bg)] text-[var(--admin-shell-primary-button-text)] hover:bg-[var(--admin-shell-primary-button-bg)]" onClick={handleCreateWorkoutFromTemplate} disabled={isLoadingWorkoutTemplates || !createWorkoutValues.workoutTemplateId}>
                Create workout
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      {aiWorkoutImportTarget ? (
        <Sheet open={Boolean(aiWorkoutImportTarget) && !isAiWorkoutDraftSheetOpen} onOpenChange={(isOpen) => !isOpen && !isAiWorkoutDraftSheetOpen && closeAiWorkoutImport()}>
          <SheetContent side="right" className="program-planner-ai-import-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
            <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
              <SheetTitle className="text-[var(--admin-dashboard-card-text)]">Import AI Workout</SheetTitle>
              <SheetDescription className="text-[var(--admin-dashboard-card-muted)]">
                {aiWorkoutImportTarget.weekLabel} · {aiWorkoutImportTarget.dayLabel}. Upload a PDF or generate a reviewed draft for this exact day lane.
              </SheetDescription>
            </SheetHeader>
            <div className="program-planner-sheet-scroll-content min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <div className="grid gap-5">
                <div className="rounded-[18px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--admin-shell-primary-button-bg)_14%,transparent)] text-[var(--admin-shell-primary-button-bg)]">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">AI draft review</p>
                      <p className="text-xs text-[var(--admin-dashboard-card-muted)]">The reviewed draft will save back into {aiWorkoutImportTarget.dayLabel}, not the template library.</p>
                    </div>
                  </div>
                  <CompactFileUpload
                    id="planner-ai-workout-import-file"
                    accept="application/pdf,.pdf"
                    multiple
                    buttonLabel="Choose PDFs"
                    helperText="Upload one or more AI workout PDFs, then review each parsed workout draft. No live rows are written until you accept."
                    fileName={aiWorkoutImportFiles.map((file) => file.name).join(', ')}
                    onFileChange={handleAiWorkoutImportFilesChange}
                  />
                </div>

                {aiWorkoutImportError ? (
                  <div className="rounded-[12px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500">{aiWorkoutImportError}</div>
                ) : aiWorkoutImportNotice ? (
                  <div className="rounded-[12px] border border-[var(--admin-shell-primary-button-bg)]/25 bg-[color-mix(in_srgb,var(--admin-shell-primary-button-bg)_10%,transparent)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-muted)]">{aiWorkoutImportNotice}</div>
                ) : null}
              </div>
            </div>
            <div className="shrink-0 flex items-center justify-end gap-3 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5">
              <Button type="button" variant="outline" className="min-h-[40px] rounded-[12px]" onClick={closeAiWorkoutImport}>
                Cancel
              </Button>
              <Button
                type="button"
                className="min-h-[40px] rounded-[12px] bg-[var(--admin-shell-primary-button-bg)] text-[var(--admin-shell-primary-button-text)] hover:bg-[var(--admin-shell-primary-button-bg)] disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCreateAiWorkoutDrafts}
                disabled={!canReviewAiWorkoutDraft}
                title={!aiWorkoutImportFiles.length ? 'Choose a PDF before reviewing the AI draft.' : aiWorkoutImportNotice || undefined}
              >
                {isCreatingAiWorkoutDraft || isSavingAiWorkoutImportDay ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {reviewAiWorkoutDraftButtonLabel}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      ) : null}

      <AiWorkoutDraftSheet
        open={isAiWorkoutDraftSheetOpen}
        onOpenChange={(isOpen) => setIsAiWorkoutDraftSheetOpen(isOpen)}
        title="Review AI workout draft"
        drafts={aiWorkoutDrafts}
        isAccepting={isAcceptingAiWorkoutDraft}
        destinationPreview={(draft) => createAiWorkoutDraftDestinationPreview(planner, aiWorkoutImportTarget, draft)}
        programContext={{
          id: planner.id,
          name: planner.title,
          weekCount: planner.weekCount,
          duration: planner.duration,
          description: planner.description,
        }}
        onCancel={() => setIsAiWorkoutDraftSheetOpen(false)}
        onAccept={handleAcceptAiWorkoutDraft}
        onAcceptAllRemaining={handleAcceptAllRemainingAiWorkoutDrafts}
      />

      {selectedWorkout ? (
        <Sheet open={Boolean(selectedWorkout)} onOpenChange={(isOpen) => !isOpen && setSelectedWorkout(null)}>
        <SheetContent side="right" className="program-planner-sheet border-l border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
            <SheetTitle className="text-[var(--admin-dashboard-card-text)]">{selectedWorkoutMode === 'duplicate' ? 'Duplicate workout' : 'Edit workout'}</SheetTitle>
            <SheetDescription className="text-[var(--admin-dashboard-card-muted)]">
              {selectedWorkout ? `${selectedWorkout.weekLabel} · ${selectedWorkout.dayLabel}` : 'Select a workout card.'}
            </SheetDescription>
            {selectedWorkout?.workout?.source === 'ai-import' ? (
              <div className="mt-3 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[color-mix(in_srgb,var(--admin-shell-primary-button-bg)_10%,transparent)] px-4 py-3 text-xs text-[var(--admin-dashboard-card-muted)]">
                <span className="font-semibold text-[var(--admin-shell-primary-button-bg)]">Imported from AI draft</span>
                {selectedWorkout.workout.sourceFileName ? ` · ${selectedWorkout.workout.sourceFileName}` : ''}
              </div>
            ) : null}
          </SheetHeader>
          <div className="program-planner-sheet-scroll-content min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <Tabs value={selectedWorkoutEditorTab} onValueChange={setSelectedWorkoutEditorTab} className="program-planner-workout-tabs grid gap-5 admin-shell-athletes-create-tabs">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="training">Training</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="grid gap-5">
                <div className="grid min-w-0 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(112px,150px)]">
                  <div className="grid min-w-0 gap-2">
                    <FieldLabel htmlFor="planner-workout-name">Name</FieldLabel>
                    <FieldInput
                      id="planner-workout-name"
                      value={selectedWorkoutDetailsValues.name}
                      onChange={(value) => handleSelectedWorkoutDetailsChange('name', value)}
                      placeholder="Enter workout name"
                    />
                  </div>
                  <div className="grid min-w-0 gap-2">
                    <FieldLabel htmlFor="planner-workout-duration">Duration</FieldLabel>
                    <FieldInput
                      id="planner-workout-duration"
                      value={selectedWorkoutDetailsValues.duration}
                      onChange={(value) => handleSelectedWorkoutDetailsChange('duration', value)}
                      placeholder="60 min"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="planner-workout-thumbnail">Thumbnail</FieldLabel>
                  <CompactFileUpload
                    id="planner-workout-thumbnail"
                    buttonLabel="Choose file"
                    helperText="Drop a workout thumbnail here or click to browse. This field stays local inside the planner for now."
                    fileName={selectedWorkoutDetailsValues.thumbnailName}
                    onFileChange={(file) => handleSelectedWorkoutDetailsChange('thumbnailName', file?.name ?? '')}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="planner-workout-status">Status</FieldLabel>
                    <Select value={selectedWorkoutDetailsValues.status} onValueChange={(value) => handleSelectedWorkoutDetailsChange('status', value)}>
                      <SelectTrigger id="planner-workout-status" className="h-11 rounded-[12px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <FieldLabel htmlFor="planner-workout-focus-area">Focus area</FieldLabel>
                    <Select value={selectedWorkoutDetailsValues.focusArea} onValueChange={(value) => handleSelectedWorkoutDetailsChange('focusArea', value)}>
                      <SelectTrigger id="planner-workout-focus-area" className="h-11 rounded-[12px]">
                        <SelectValue placeholder="Select focus area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main-work">Main Work</SelectItem>
                        <SelectItem value="field-work">Field Work</SelectItem>
                        <SelectItem value="conditioning">Conditioning</SelectItem>
                        <SelectItem value="recovery">Recovery</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-2">
                  <FieldLabel htmlFor="planner-workout-description">Description</FieldLabel>
                  <Textarea
                    id="planner-workout-description"
                    value={selectedWorkoutDetailsValues.description}
                    onChange={(event) => handleSelectedWorkoutDetailsChange('description', event.target.value)}
                    className="min-h-[140px] rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[#3BE0AF]/20"
                    placeholder="Add a short description for this workout"
                  />
                </div>

                <div className="grid gap-2 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3">
                  <FieldLabel>Synced training data</FieldLabel>
                  <p className="text-xs text-[var(--admin-dashboard-card-muted)]">The day card, Details drawer, and Training tab all read from this workout’s blocks, exercises, and sets.</p>
                </div>
              </TabsContent>

              <TabsContent value="training" className="grid gap-5">
                <WorkoutTrainingBuilder sections={selectedWorkoutTrainingSections} onSectionsChange={setSelectedWorkoutTrainingSections} />
              </TabsContent>
            </Tabs>
          </div>
          <div className="shrink-0 flex items-center justify-end gap-3 border-t border-[var(--admin-dashboard-card-border)] px-6 py-5">
            <Button type="button" variant="outline" className="min-h-[40px] rounded-[12px]" onClick={() => setSelectedWorkout(null)}>
              Cancel
            </Button>
            <Button type="button" className="min-h-[40px] rounded-[12px] bg-[var(--admin-shell-primary-button-bg)] text-[var(--admin-shell-primary-button-text)] hover:bg-[var(--admin-shell-primary-button-bg)]" onClick={handleSaveWorkoutEditor}>
              {selectedWorkoutMode === 'duplicate' ? 'Duplicate' : 'Save changes'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      ) : null}

      <Dialog open={Boolean(workoutPendingDelete)} onOpenChange={(isOpen) => !isOpen && setWorkoutPendingDelete(null)}>
        <DialogContent className="border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Delete workout</DialogTitle>
            <DialogDescription>
              {workoutPendingDelete ? (
                <>
                  This will remove <span className="font-semibold text-[var(--admin-dashboard-card-text)]">{workoutPendingDelete.workout.title}</span> from {workoutPendingDelete.weekLabel} · {workoutPendingDelete.dayLabel}.
                </>
              ) : 'This will remove the selected workout from the program day.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" className="min-h-[40px] rounded-[12px]" onClick={() => setWorkoutPendingDelete(null)}>
              Cancel
            </Button>
            <Button type="button" className="min-h-[40px] rounded-[12px] bg-red-500/90 text-white hover:bg-red-500" onClick={handleConfirmWorkoutDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
