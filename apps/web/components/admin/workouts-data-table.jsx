'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Bot, ChevronDown, FileText, LoaderCircle, MoreHorizontal, Plus, Trash2, Upload } from 'lucide-react'
import { parseAsJson, useQueryState } from 'nuqs'

import AiWorkoutDraftSheet from '@/components/admin/ai-workout-draft-sheet'
import WorkoutEditorDialog from '@/components/admin/workout-editor-dialog'
import { Filters } from '@/components/reui/filters'
import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Checkbox from '@/components/ui/checkbox'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function formatWorkoutDuration(minutes) {
  const parsedMinutes = Number.parseInt(minutes ?? '', 10)
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    return '--'
  }

  return `${parsedMinutes} min`
}

function formatWorkoutStatus(status) {
  const normalizedStatus = String(status ?? 'active').trim()
  if (!normalizedStatus) return 'Active'
  return normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)
}

function formatWorkoutFocusArea(focusArea) {
  const normalizedFocusArea = String(focusArea ?? '').trim()
  return normalizedFocusArea || '--'
}

function formatFileSize(sizeInBytes) {
  const parsedSize = Number(sizeInBytes ?? 0)
  if (!Number.isFinite(parsedSize) || parsedSize <= 0) return '0Bytes'

  if (parsedSize < 1024) return `${parsedSize}Bytes`
  if (parsedSize < 1024 * 1024) return `${(parsedSize / 1024).toFixed(2)}KB`

  return `${(parsedSize / (1024 * 1024)).toFixed(2)}MB`
}

function mapWorkoutTemplateToWorkoutRow(template = {}) {
  return {
    id: template.id,
    name: template.name ?? 'Workout',
    duration: formatWorkoutDuration(template.estimated_duration_minutes),
    sections: template.section_count ?? '--',
    exercises: template.exercise_count ?? '--',
    exerciseCount: template.exercise_count ?? 0,
    setCount: template.set_count ?? 0,
    focusArea: formatWorkoutFocusArea(template.training_type),
    status: formatWorkoutStatus(template.status),
    description: template.description ?? '',
    thumbnailUrl: template.thumbnail_url ?? '',
    trainingSections: Array.isArray(template.trainingSections) ? template.trainingSections : [],
  }
}

function createWorkoutFormValues(selectedWorkout = null) {
  return {
    id: selectedWorkout?.id ?? null,
    name: selectedWorkout?.name ?? '',
    duration: selectedWorkout?.duration ?? '',
    thumbnailName: '',
    status: selectedWorkout?.status?.toLowerCase?.() ?? 'active',
    focusArea: selectedWorkout?.focusArea && selectedWorkout.focusArea !== '--' ? normalizeWorkoutFocusArea(selectedWorkout.focusArea) : '',
    description: selectedWorkout?.description ?? '',
  }
}

function collapseTrainingSectionsOnLoad(sections = []) {
  return Array.isArray(sections)
    ? sections.map((section) => ({
      ...section,
      isExpanded: false,
    }))
    : []
}

function StatusCell({ status }) {
  const normalizedStatus = String(status ?? '').trim().toLowerCase()
  const statusClassName = normalizedStatus === 'inactive' || normalizedStatus === 'archived'
    ? 'admin-shell-workouts-status-badge admin-shell-workouts-status-badge-inactive normal-case tracking-normal'
    : 'admin-shell-workouts-status-badge admin-shell-workouts-status-badge-active normal-case tracking-normal'

  return (
    <Badge className={statusClassName}>
      {status}
    </Badge>
  )
}

function WorkoutNameCell({ workout }) {
  const exerciseCount = Number(workout?.exerciseCount ?? 0)
  const setCount = Number(workout?.setCount ?? 0)
  const exerciseCountLabel = `${exerciseCount} exercise${exerciseCount === 1 ? '' : 's'}`
  const setCountLabel = `${setCount} set${setCount === 1 ? '' : 's'}`

  return (
    <div className="admin-shell-athletes-name-cell">
      <div className="admin-shell-athletes-name-copy">
        <span className="admin-shell-athletes-name-text">{workout?.name ?? 'Workout'}</span>
        <span className="admin-shell-athletes-name-meta">{exerciseCountLabel}</span>
        <span className="admin-shell-athletes-name-meta">{setCountLabel}</span>
      </div>
    </div>
  )
}

function RowActionsCell({
  isOpen = false,
  onOpenChange = () => {},
  onEditAction = () => {},
  onDuplicateAction = () => {},
  onDeleteAction = () => {},
}) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="admin-shell-athletes-row-menu" aria-label="Open menu">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="admin-shell-athletes-row-menu-icon" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => { onEditAction(); onOpenChange(false) }}>Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { onDuplicateAction(); onOpenChange(false) }}>Duplicate</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { onDeleteAction(); onOpenChange(false) }}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function normalizeWorkoutFilterValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeWorkoutFocusArea(focusArea) {
  return normalizeWorkoutFilterValue(focusArea).replace(/\s+/g, '-')
}

function createDraftWorkoutSetRows(weeks = [], sectionIndex, exerciseIndex) {
  if (!Array.isArray(weeks) || weeks.length === 0) {
    return [
      {
        id: `draft-set-${sectionIndex}-${exerciseIndex}-1`,
        tempo: '',
        effort: '',
        side: '',
        duration: '',
        distance: '',
        rest: '',
        reps: '',
      },
    ]
  }

  return weeks.flatMap((week, weekIndex) => {
    const setCount = Math.max(1, Number(week?.sets ?? 1))
    return Array.from({ length: setCount }, (_, setIndex) => ({
      id: `draft-set-${sectionIndex}-${exerciseIndex}-${weekIndex}-${setIndex}`,
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
    id: `draft-section-${sectionIndex}-${normalizeWorkoutFocusArea(section?.label ?? 'section')}`,
    label: section?.label ?? `Section ${sectionIndex + 1}`,
    isExpanded: true,
    showInstruction: Boolean(section?.blockLabel),
    instruction: section?.blockLabel ? `Block ${section.blockLabel}` : '',
    draftExerciseQuery: '',
    exercises: (section?.exercises ?? []).map((exercise, exerciseIndex) => ({
      id: `draft-exercise-${sectionIndex}-${exerciseIndex}`,
      title: exercise?.exerciseMatch?.exerciseName || exercise?.name || 'Exercise',
      exerciseId: exercise?.exerciseMatch?.exerciseId || '',
      isExpanded: exerciseIndex === 0,
      showInstruction: Boolean(exercise?.notes),
      instruction: exercise?.notes ?? '',
      sets: createDraftWorkoutSetRows(exercise?.weeks, sectionIndex, exerciseIndex),
    })),
  }))
}

function createDraftWorkoutFormValues(acceptedDraft) {
  return {
    id: null,
    name: acceptedDraft?.workout?.name ?? '',
    duration: '',
    thumbnailName: '',
    status: 'active',
    focusArea: normalizeWorkoutFocusArea(acceptedDraft?.workout?.trainingType ?? ''),
    description: acceptedDraft?.workout?.description ?? acceptedDraft?.workout?.notes ?? '',
  }
}

function createDraftWorkoutTemplatePayload(acceptedDraft, trainingSections) {
  return {
    name: acceptedDraft?.workout?.name ?? 'AI imported workout',
    description: acceptedDraft?.workout?.description ?? acceptedDraft?.workout?.notes ?? '',
    focusArea: normalizeWorkoutFocusArea(acceptedDraft?.workout?.trainingType ?? ''),
    status: 'active',
    trainingSections,
  }
}

function mapProgramOption(program = {}) {
  return {
    id: program.id,
    name: program.name ?? 'Untitled program',
    description: program.description ?? '',
    weekCount: program.weekCount ?? '',
    duration: program.duration ?? '',
  }
}

function parseWorkoutDurationValue(value) {
  if (value === null || value === undefined) return null

  const match = String(value).match(/\d+(?:\.\d+)?/)
  if (!match) return null

  const parsedValue = Number(match[0])
  return Number.isFinite(parsedValue) ? parsedValue : null
}

function buildSelectFilterOptions(values = []) {
  const seenValues = new Set()

  return values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .filter((value) => {
      const normalizedValue = normalizeWorkoutFocusArea(value)
      if (!normalizedValue || seenValues.has(normalizedValue)) {
        return false
      }
      seenValues.add(normalizedValue)
      return true
    })
    .map((value) => ({
      value: normalizeWorkoutFocusArea(value),
      label: value,
    }))
}

function buildVisiblePageItems(pageCount, currentPageIndex) {
  if (pageCount <= 0) return []
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, pageIndex) => ({ type: 'page', pageIndex }))

  const clampedCurrentPageIndex = Math.max(0, Math.min(currentPageIndex, pageCount - 1))
  const visibleIndexes = new Set([0, pageCount - 1, clampedCurrentPageIndex])

  for (let pageIndex = clampedCurrentPageIndex - 1; pageIndex <= clampedCurrentPageIndex + 1; pageIndex += 1) {
    if (pageIndex > 0 && pageIndex < pageCount - 1) {
      visibleIndexes.add(pageIndex)
    }
  }

  const sortedIndexes = [...visibleIndexes].sort((left, right) => left - right)
  const visibleItems = []

  sortedIndexes.forEach((pageIndex, index) => {
    const previousPageIndex = sortedIndexes[index - 1]
    if (typeof previousPageIndex === 'number' && pageIndex - previousPageIndex > 1) {
      visibleItems.push({ type: 'ellipsis', key: `ellipsis-${previousPageIndex}-${pageIndex}` })
    }
    visibleItems.push({ type: 'page', pageIndex })
  })

  return visibleItems
}

function WorkoutRangeFilterValue({
  values = [],
  onChange = () => {},
  operator = 'between',
  startPlaceholder = 'Min min',
  endPlaceholder = 'Max min',
}) {
  const [firstValue = '', secondValue = ''] = values
  const singleValuePlaceholder = operator === 'greater_than' ? 'Min min' : operator === 'less_than' ? 'Max min' : 'Value'
  const inputClassName = 'h-8 w-28 rounded-[10px] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] shadow-none placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:ring-[#3BE0AF]/20'

  if (operator === 'between') {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={firstValue}
          onChange={(event) => onChange([event.target.value, secondValue])}
          placeholder={startPlaceholder}
          className={inputClassName}
        />
        <span className="text-xs text-[var(--admin-dashboard-card-muted)]">to</span>
        <Input
          type="number"
          value={secondValue}
          onChange={(event) => onChange([firstValue, event.target.value])}
          placeholder={endPlaceholder}
          className={inputClassName}
        />
      </div>
    )
  }

  return (
    <Input
      type="number"
      value={firstValue}
      onChange={(event) => onChange([event.target.value])}
      placeholder={singleValuePlaceholder}
      className={inputClassName}
    />
  )
}

function createWorkoutFilterFields(focusAreaOptions = []) {
  return [
    {
      key: 'status',
      label: 'Status',
      field: 'status',
      type: 'select',
      defaultOperator: 'is',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'draft', label: 'Draft' },
        { value: 'archived', label: 'Archived' },
      ],
    },
    {
      key: 'focusArea',
      label: 'Focus area',
      field: 'focusArea',
      type: 'select',
      defaultOperator: 'is',
      options: focusAreaOptions,
    },
    {
      key: 'duration',
      label: 'Duration',
      field: 'duration',
      type: 'custom',
      defaultOperator: 'between',
      operators: [
        { value: 'between', label: 'between' },
        { value: 'greater_than', label: 'greater than' },
        { value: 'less_than', label: 'less than' },
        { value: 'empty', label: 'is empty' },
        { value: 'not_empty', label: 'is not empty' },
      ],
      customRenderer: ({ values, onChange, operator }) => (
        <WorkoutRangeFilterValue values={values} onChange={onChange} operator={operator} startPlaceholder="Min min" endPlaceholder="Max min" />
      ),
    },
  ]
}

function workoutMatchesFilter(workout, filter) {
  if (!filter?.field) return true

  const values = Array.isArray(filter.values) ? filter.values : []
  const primaryValue = values[0]
  const secondaryValue = values[1]

  switch (filter.field) {
    case 'status': {
      const workoutStatus = normalizeWorkoutFilterValue(workout.status)
      if (filter.operator === 'empty') return !workout.status
      if (filter.operator === 'not_empty') return Boolean(workout.status)
      const selectedStatus = normalizeWorkoutFilterValue(primaryValue)
      if (!selectedStatus) return true
      if (filter.operator === 'is_not') return workoutStatus !== selectedStatus
      return workoutStatus === selectedStatus
    }
    case 'focusArea': {
      const workoutFocusArea = normalizeWorkoutFocusArea(workout.focusArea)
      if (filter.operator === 'empty') return !workout.focusArea || workout.focusArea === '--'
      if (filter.operator === 'not_empty') return Boolean(workout.focusArea) && workout.focusArea !== '--'
      const selectedFocusArea = normalizeWorkoutFocusArea(primaryValue)
      if (!selectedFocusArea) return true
      if (filter.operator === 'is_not') return workoutFocusArea !== selectedFocusArea
      return workoutFocusArea === selectedFocusArea
    }
    case 'duration': {
      const workoutDuration = parseWorkoutDurationValue(workout.duration)
      const minDuration = parseWorkoutDurationValue(primaryValue)
      const maxDuration = parseWorkoutDurationValue(secondaryValue)
      if (filter.operator === 'empty') return !workout.duration || workout.duration === '--'
      if (filter.operator === 'not_empty') return Boolean(workout.duration) && workout.duration !== '--'
      if (workoutDuration === null) return false
      if (filter.operator === 'greater_than') return minDuration === null ? true : workoutDuration > minDuration
      if (filter.operator === 'less_than') return minDuration === null ? true : workoutDuration < minDuration
      if (minDuration !== null && maxDuration !== null) return workoutDuration >= minDuration && workoutDuration <= maxDuration
      if (minDuration !== null) return workoutDuration >= minDuration
      if (maxDuration !== null) return workoutDuration <= maxDuration
      return true
    }
    default:
      return true
  }
}

function workoutMatchesFilters(workout, filters) {
  return filters.every((filter) => workoutMatchesFilter(workout, filter))
}

export default function WorkoutsDataTable({ searchQuery = '' }) {
  const [workoutsData, setWorkoutsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [workoutFilters, setWorkoutFilters] = useQueryState(
    'filters',
    parseAsJson((value) => (Array.isArray(value) ? value : [])).withDefault([]),
  )
  const [isCreateWorkoutDialogOpen, setIsCreateWorkoutDialogOpen] = useState(false)
  const [workoutDialogMode, setWorkoutDialogMode] = useState('create')
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null)
  const [workoutTrainingSections, setWorkoutTrainingSections] = useState([])
  const [workoutFormValues, setWorkoutFormValues] = useState(() => createWorkoutFormValues())
  const [isAiWorkoutImportDialogOpen, setIsAiWorkoutImportDialogOpen] = useState(false)
  const [isWorkoutAiProcessing, setIsWorkoutAiProcessing] = useState(false)
  const [isAiWorkoutDraftSheetOpen, setIsAiWorkoutDraftSheetOpen] = useState(false)
  const [aiWorkoutDrafts, setAiWorkoutDrafts] = useState([])
  const [acceptedAiWorkoutDraft, setAcceptedAiWorkoutDraft] = useState(null)
  const [programOptions, setProgramOptions] = useState([])
  const [workoutImportFiles, setWorkoutImportFiles] = useState([])
  const [aiWorkoutImportError, setAiWorkoutImportError] = useState('')
  const [workoutEditorMessage, setWorkoutEditorMessage] = useState('')
  const [isSavingWorkoutTemplate, setIsSavingWorkoutTemplate] = useState(false)
  const [isDeleteWorkoutDialogOpen, setIsDeleteWorkoutDialogOpen] = useState(false)
  const [selectedDeleteWorkoutId, setSelectedDeleteWorkoutId] = useState(null)
  const [isDeletingWorkoutTemplate, setIsDeletingWorkoutTemplate] = useState(false)
  const [deleteWorkoutMessage, setDeleteWorkoutMessage] = useState('')
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const saveDisclaimer = ''
  const workoutAiProcessingAbortRef = useRef(null)

  const focusAreaOptions = useMemo(
    () => buildSelectFilterOptions(workoutsData.map((workout) => workout.focusArea).filter((value) => value && value !== '--')),
    [workoutsData],
  )
  const statusOptions = useMemo(
    () => buildSelectFilterOptions(workoutsData.map((workout) => workout.status)),
    [workoutsData],
  )
  const workoutFilterFields = useMemo(
    () => createWorkoutFilterFields(focusAreaOptions),
    [focusAreaOptions],
  )
  const workoutImportPreviewFiles = useMemo(() => workoutImportFiles.map((file) => ({
    file,
    previewUrl: URL.createObjectURL(file),
  })), [workoutImportFiles])

  useEffect(() => {
    return () => {
      workoutImportPreviewFiles.forEach((previewFile) => {
        URL.revokeObjectURL(previewFile.previewUrl)
      })
    }
  }, [workoutImportPreviewFiles])

  useEffect(() => {
    return () => {
      workoutAiProcessingAbortRef.current?.abort()
    }
  }, [])

  function openCreateWorkoutDialog() {
    setOpenRowActionMenuId(null)
    setWorkoutDialogMode('create')
    setSelectedWorkoutId(null)
    setWorkoutTrainingSections([])
    setWorkoutFormValues(createWorkoutFormValues())
    setWorkoutEditorMessage('')
    setIsCreateWorkoutDialogOpen(true)
  }

  function handleWorkoutImportPdfUpload(event) {
    const selectedFiles = Array.from(event.target.files ?? [])
    const pdfFiles = selectedFiles.filter((file) => file.type === 'application/pdf' || file.name?.toLowerCase?.().endsWith('.pdf'))

    if (pdfFiles.length === 0) return

    setWorkoutImportFiles((currentFiles) => {
      const currentFileKeys = new Set(currentFiles.map((file) => `${file.name}-${file.size}-${file.lastModified}`))
      const newPdfFiles = pdfFiles.filter((file) => !currentFileKeys.has(`${file.name}-${file.size}-${file.lastModified}`))

      return [...currentFiles, ...newPdfFiles]
    })
    setIsAiWorkoutImportDialogOpen(true)
    setAiWorkoutImportError('')
    event.target.value = ''
  }

  function removeWorkoutImportFile(fileName) {
    setWorkoutImportFiles((currentFiles) => currentFiles.filter((file) => file.name !== fileName))
  }

  function handleWorkoutImportPdfButtonClick() {
    if (workoutImportFiles.length > 0) {
      setAiWorkoutImportError('')
      setIsAiWorkoutImportDialogOpen(true)
      return
    }

    document.getElementById('workout-import-pdf-upload')?.click()
  }

  async function handleGenerateWorkoutImportDraft() {
    if (workoutImportFiles.length === 0 || isWorkoutAiProcessing) return

    workoutAiProcessingAbortRef.current?.abort()
    const abortController = new AbortController()
    workoutAiProcessingAbortRef.current = abortController
    setAiWorkoutImportError('')
    setIsWorkoutAiProcessing(true)

    try {
      const formData = new FormData()
      workoutImportFiles.forEach((file) => formData.append('files', file))

      const response = await fetch('/api/admin/ai-workout-drafts', {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      })
      const body = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(body?.error || 'Failed to create AI workout drafts.')
      }

      setAiWorkoutDrafts(body.drafts ?? [])
      setIsAiWorkoutImportDialogOpen(false)
      setIsAiWorkoutDraftSheetOpen(true)
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('Failed to create AI workout drafts.', error)
        setAiWorkoutImportError(error.message || 'Failed to create AI workout drafts.')
      }
    } finally {
      if (workoutAiProcessingAbortRef.current === abortController) {
        workoutAiProcessingAbortRef.current = null
      }
      setIsWorkoutAiProcessing(false)
    }
  }

  function handleCancelWorkoutAiProcessing() {
    workoutAiProcessingAbortRef.current?.abort()
    workoutAiProcessingAbortRef.current = null
    setIsWorkoutAiProcessing(false)
  }

  function handleAcceptAiWorkoutDraft(acceptedDraft) {
    setAcceptedAiWorkoutDraft(acceptedDraft)
    setIsAiWorkoutDraftSheetOpen(false)
  }

  function openCreateWorkoutFromAcceptedDraft() {
    if (!acceptedAiWorkoutDraft) return

    setOpenRowActionMenuId(null)
    setWorkoutDialogMode('draft')
    setSelectedWorkoutId(null)
    setWorkoutFormValues(createDraftWorkoutFormValues(acceptedAiWorkoutDraft))
    setWorkoutTrainingSections(collapseTrainingSectionsOnLoad(createDraftWorkoutTrainingSections(acceptedAiWorkoutDraft.sections)))
    setWorkoutEditorMessage('')
    setIsCreateWorkoutDialogOpen(true)
  }

  function openEditWorkoutDialog(workout) {
    if (!workout) return

    setOpenRowActionMenuId(null)
    setWorkoutDialogMode('edit')
    setSelectedWorkoutId(workout.id)
    setWorkoutTrainingSections(collapseTrainingSectionsOnLoad(workout.trainingSections))
    setWorkoutFormValues(createWorkoutFormValues(workout))
    setWorkoutEditorMessage('')
    setIsCreateWorkoutDialogOpen(true)
  }

  function openDuplicateWorkoutDialog(workout) {
    if (!workout) return

    setOpenRowActionMenuId(null)
    setWorkoutDialogMode('duplicate')
    setSelectedWorkoutId(workout.id)
    setWorkoutTrainingSections(collapseTrainingSectionsOnLoad(workout.trainingSections))
    setWorkoutFormValues(createWorkoutFormValues(workout))
    setWorkoutEditorMessage('')
    setIsCreateWorkoutDialogOpen(true)
  }

  function openDeleteWorkoutDialog(workout) {
    if (!workout) return

    setOpenRowActionMenuId(null)
    setSelectedDeleteWorkoutId(workout.id)
    setDeleteWorkoutMessage('')
    setIsDeleteWorkoutDialogOpen(true)
  }

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <div className="admin-shell-athletes-checkbox-cell">
            <Checkbox
              className="admin-shell-athletes-checkbox-input"
              checked={table.getIsAllPageRowsSelected()}
              onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="admin-shell-athletes-checkbox-cell">
            <Checkbox
              className="admin-shell-athletes-checkbox-input"
              checked={row.getIsSelected()}
              onChange={(event) => row.toggleSelected(event.target.checked)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: 'Workout',
        meta: { label: 'Workout' },
        cell: ({ row }) => <WorkoutNameCell workout={row.original} />,
      },
      {
        accessorKey: 'sections',
        header: 'Sections',
        meta: { label: 'Sections' },
      },
      {
        accessorKey: 'exercises',
        header: 'Exercises',
        meta: { label: 'Exercises' },
      },
      {
        accessorKey: 'focusArea',
        header: 'Focus area',
        meta: { label: 'Focus area' },
        cell: ({ row }) => <span className="admin-shell-athletes-program-cell">{row.original.focusArea}</span>,
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        meta: { label: 'Duration' },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { label: 'Status' },
        cell: ({ row }) => <StatusCell status={row.original.status} />,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <RowActionsCell
            isOpen={openRowActionMenuId === row.original.id}
            onOpenChange={(isOpen) => setOpenRowActionMenuId(isOpen ? row.original.id : null)}
            onEditAction={() => openEditWorkoutDialog(row.original)}
            onDuplicateAction={() => openDuplicateWorkoutDialog(row.original)}
            onDeleteAction={() => openDeleteWorkoutDialog(row.original)}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openRowActionMenuId],
  )

  const filteredWorkouts = useMemo(() => {
    const normalizedFilters = Array.isArray(workoutFilters) ? workoutFilters : []
    return workoutsData.filter((workout) => workoutMatchesFilters(workout, normalizedFilters))
  }, [workoutFilters, workoutsData])

  const table = useReactTable({
    data: filteredWorkouts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      rowSelection,
      columnFilters,
      columnVisibility,
      pagination,
    },
  })

  async function reloadWorkoutTemplates() {
    const response = await fetch('/api/admin/workout-templates', {
      cache: 'no-store',
    })
    const payload = await response.json().catch(() => ({}))

    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to load workouts.')
    }

    const nextWorkouts = Array.isArray(payload.workoutTemplates)
      ? payload.workoutTemplates.map(mapWorkoutTemplateToWorkoutRow)
      : []
    setWorkoutsData(nextWorkouts)
    return nextWorkouts
  }

  async function handleWorkoutTemplatePrimaryAction() {
    setIsSavingWorkoutTemplate(true)
    setWorkoutEditorMessage('')
    try {
      const isEdit = workoutDialogMode === 'edit'
      const isDraftPlanCreate = workoutDialogMode === 'draft'
      const draftProgramAssignment = acceptedAiWorkoutDraft?.programAssignment ?? { mode: 'new' }
      const saveUrl = isDraftPlanCreate && draftProgramAssignment.mode === 'unassigned'
        ? '/api/admin/workout-templates'
        : isDraftPlanCreate
          ? '/api/admin/program-workouts'
          : '/api/admin/workout-templates'
      const draftPayload = draftProgramAssignment.mode === 'unassigned'
        ? createDraftWorkoutTemplatePayload(acceptedAiWorkoutDraft, workoutTrainingSections)
        : {
          createProgramPlanFromDraft: true,
          programId: draftProgramAssignment.mode === 'existing' ? draftProgramAssignment.programId : undefined,
          workout: acceptedAiWorkoutDraft?.workout,
          trainingSections: workoutTrainingSections,
        }
      const response = await fetch(saveUrl, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isDraftPlanCreate ? draftPayload : {
          id: isEdit ? selectedWorkoutId : undefined,
          ...workoutFormValues,
          focusArea: workoutFormValues.focusArea === 'none' ? '' : workoutFormValues.focusArea,
          trainingSections: undefined,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to save workout template.')
      }
      if (isDraftPlanCreate) {
        setAcceptedAiWorkoutDraft(null)
        if (draftProgramAssignment.mode === 'unassigned') {
          await reloadWorkoutTemplates()
          setWorkoutEditorMessage('Workout saved as unassigned.')
        } else if (draftProgramAssignment.mode === 'existing') {
          setWorkoutEditorMessage('Workout added to existing program.')
        } else {
          setWorkoutEditorMessage('Program plan created from draft.')
        }
      } else {
        await reloadWorkoutTemplates()
      }
      setIsCreateWorkoutDialogOpen(false)
    } catch (saveError) {
      setWorkoutEditorMessage(saveError?.message || 'Failed to save workout template.')
    } finally {
      setIsSavingWorkoutTemplate(false)
    }
  }

  async function handleDeleteWorkoutTemplate() {
    if (!selectedDeleteWorkoutId) return

    setIsDeletingWorkoutTemplate(true)
    setDeleteWorkoutMessage('')
    try {
      const response = await fetch('/api/admin/workout-templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedDeleteWorkoutId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to delete workout template.')
      }
      await reloadWorkoutTemplates()
      setIsDeleteWorkoutDialogOpen(false)
      setSelectedDeleteWorkoutId(null)
    } catch (deleteError) {
      setDeleteWorkoutMessage(deleteError?.message || 'Failed to delete workout template.')
    } finally {
      setIsDeletingWorkoutTemplate(false)
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadWorkouts() {
      setLoading(true)
      setError('')

      try {
        const [workoutResponse, programResponse] = await Promise.all([
          fetch('/api/admin/workout-templates', { cache: 'no-store' }),
          fetch('/api/admin/programs', { cache: 'no-store' }),
        ])
        const workoutPayload = await workoutResponse.json().catch(() => ({}))
        const programPayload = await programResponse.json().catch(() => ({}))

        if (!workoutResponse.ok) {
          throw new Error(workoutPayload?.error || 'Failed to load workouts.')
        }
        if (!programResponse.ok) {
          throw new Error(programPayload?.error || 'Failed to load programs.')
        }

        const nextWorkouts = Array.isArray(workoutPayload.workoutTemplates)
          ? workoutPayload.workoutTemplates.map(mapWorkoutTemplateToWorkoutRow)
          : []
        const nextProgramOptions = Array.isArray(programPayload.programs)
          ? programPayload.programs.map(mapProgramOption).filter((programOption) => programOption.id)
          : []

        if (isMounted) {
          setWorkoutsData(nextWorkouts)
          setProgramOptions(nextProgramOptions)
        }
      } catch (loadError) {
        if (isMounted) {
          setWorkoutsData([])
          setProgramOptions([])
          setError(loadError?.message || 'Failed to load workouts.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadWorkouts()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    table.getColumn('name')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  useEffect(() => {
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }))
  }, [workoutFilters, searchQuery])

  const emptyStateMessage = loading
    ? 'Loading workouts...'
    : error || (Array.isArray(workoutFilters) && workoutFilters.length > 0 ? 'No workouts match the current filters.' : 'No workouts found.')
  const pageSizeOptions = [5, 10, 20, 30]
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)
  const visiblePageItems = buildVisiblePageItems(table.getPageCount(), pagination.pageIndex)
  const skeletonRows = Array.from({ length: pagination.pageSize }, (_, rowIndex) => rowIndex)

  return (
    <div className="admin-shell-athletes-table-example">
      <div className="flex flex-col gap-3">
        <div className="flex w-full items-center justify-between gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="admin-shell-athletes-example-columns-button">
                Columns
                <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  >
                    {column.columnDef.meta?.label ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <div aria-label="Workout import PDF upload">
              <Button
                type="button"
                variant="outline"
                onClick={handleWorkoutImportPdfButtonClick}
                className="cursor-pointer rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
              >
                <Upload className="size-4" aria-hidden="true" />
                Upload PDF
              </Button>
              <input
                id="workout-import-pdf-upload"
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={handleWorkoutImportPdfUpload}
              />
            </div>
            <Button
              type="button"
              onClick={openCreateWorkoutDialog}
              className="admin-shell-athletes-invite-button self-start rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] md:self-auto"
            >
              Create workout
            </Button>
          </div>
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-2">
          <Filters
            filters={Array.isArray(workoutFilters) ? workoutFilters : []}
            fields={workoutFilterFields}
            onChange={setWorkoutFilters}
            trigger={
              <Button
                type="button"
                variant="outline"
                className="admin-shell-athletes-filter-trigger rounded-[12px] min-h-[40px] shadow-none"
              >
                <Plus className="size-4" />
                Add filter
              </Button>
            }
          />
        </div>
      </div>

      {acceptedAiWorkoutDraft ? (
        <div className="rounded-[18px] border border-[#3BE0AF]/30 bg-[#3BE0AF]/10 p-4 text-[var(--admin-dashboard-card-text)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[#06B686]">Draft accepted</p>
              <p className="text-base font-semibold text-[var(--admin-dashboard-card-text)]">{acceptedAiWorkoutDraft.workout.name}</p>
              <p className="text-sm text-[var(--admin-dashboard-card-muted)]">Reviewed draft is ready for workout creation.</p>
              <p className="text-xs text-[var(--admin-dashboard-card-muted)]">
                {acceptedAiWorkoutDraft.sections?.length ?? 0} sections · {acceptedAiWorkoutDraft.workout.trainingType}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
                onClick={openCreateWorkoutFromAcceptedDraft}
              >
                Create program plan from draft
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-[12px] min-h-[40px] border-[#3BE0AF]/40 bg-[#3BE0AF]/10 text-[#06B686] hover:bg-[#3BE0AF]/15 hover:text-[#06B686]"
                onClick={() => setIsAiWorkoutDraftSheetOpen(true)}
              >
                Edit reviewed draft
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <WorkoutEditorDialog
        open={isCreateWorkoutDialogOpen}
        onOpenChange={(isOpen) => {
          setIsCreateWorkoutDialogOpen(isOpen)

          if (!isOpen) {
            setWorkoutDialogMode('create')
            setSelectedWorkoutId(null)
            setWorkoutTrainingSections([])
            setWorkoutFormValues(createWorkoutFormValues())
            setWorkoutEditorMessage('')
          }
        }}
        mode={workoutDialogMode}
        title={workoutDialogMode === 'edit' ? 'Edit workout' : workoutDialogMode === 'duplicate' ? 'Duplicate workout' : workoutDialogMode === 'draft' ? 'Create program plan from draft' : 'Create workout'}
        description={
          workoutDialogMode === 'edit'
            ? 'Update the information below.'
            : workoutDialogMode === 'duplicate'
              ? 'Update the information below.'
              : workoutDialogMode === 'draft'
                ? 'Review the accepted draft before creating the program plan.'
                : 'Fill out the information below.'
        }
        detailsValues={workoutFormValues}
        onDetailsChange={setWorkoutFormValues}
        trainingSections={workoutTrainingSections}
        onTrainingSectionsChange={setWorkoutTrainingSections}
        showTrainingTab={workoutDialogMode !== 'create'}
        primaryActionLabel={isSavingWorkoutTemplate ? 'Saving...' : workoutDialogMode === 'edit' ? 'Save changes' : workoutDialogMode === 'duplicate' ? 'Duplicate workout' : workoutDialogMode === 'draft' ? 'Create program plan' : 'Create workout'}
        onPrimaryAction={isSavingWorkoutTemplate ? null : handleWorkoutTemplatePrimaryAction}
        focusAreaOptions={focusAreaOptions}
        statusOptions={statusOptions}
        saveDisclaimer={saveDisclaimer}
        errorMessage={workoutEditorMessage}
      />

      <Dialog open={isAiWorkoutImportDialogOpen} onOpenChange={setIsAiWorkoutImportDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[760px]">
          {isWorkoutAiProcessing ? (
            <Empty className="min-h-[420px] border-0 bg-transparent p-0">
              <EmptyHeader>
                <EmptyMedia
                  variant="icon"
                  className="size-14 rounded-[16px] border border-[#3BE0AF]/20 bg-[#3BE0AF]/10 text-[#3BE0AF]"
                >
                  <LoaderCircle className="size-6 animate-spin text-[#3BE0AF]" aria-hidden="true" />
                </EmptyMedia>
                <EmptyTitle className="text-xl font-semibold text-[var(--admin-dashboard-card-text)]">Processing your request</EmptyTitle>
                <EmptyDescription className="max-w-[280px] text-center text-sm leading-6 text-[var(--admin-dashboard-card-muted)]">
                  Please wait while we process your<br />request. Do not refresh the page.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
                  onClick={handleCancelWorkoutAiProcessing}
                >
                  Cancel
                </Button>
              </EmptyContent>
            </Empty>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Generate workout with AI</DialogTitle>
                <DialogDescription>Upload some workouts PDF, review the files and then generate the first AI draft.</DialogDescription>
              </DialogHeader>

              <div className="space-y-5">
                {aiWorkoutImportError ? (
                  <div className="rounded-[14px] border border-[var(--ui-danger-border)] bg-[var(--ui-danger-surface)] px-4 py-3 text-sm font-medium text-[var(--ui-danger)]">
                    {aiWorkoutImportError}
                  </div>
                ) : null}

                <input
                  id="workout-import-dialog-pdf-upload"
                  type="file"
                  accept="application/pdf"
                  multiple
                  className="sr-only"
                  onChange={handleWorkoutImportPdfUpload}
                />

                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Files ({workoutImportFiles.length})</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      asChild
                      className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
                    >
                      <label htmlFor="workout-import-dialog-pdf-upload" className="cursor-pointer">
                        <Upload className="size-4" aria-hidden="true" />
                        Add files
                      </label>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
                      onClick={() => setWorkoutImportFiles([])}
                      disabled={workoutImportFiles.length === 0}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Remove all
                    </Button>
                  </div>
                </div>

                <div className="overflow-hidden rounded-[16px] border border-[var(--admin-dashboard-card-border)]">
                  <Table>
                    <TableHeader className="[&_tr]:border-[color:var(--admin-dashboard-card-border)]">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="[&_tr]:border-[color:var(--admin-dashboard-card-border)]">
                      {workoutImportFiles.length > 0 ? (
                        workoutImportPreviewFiles.map((previewFile) => (
                          <TableRow key={`${previewFile.file.name}-${previewFile.file.size}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-muted)]">
                                  <FileText className="size-4" aria-hidden="true" />
                                </span>
                                <a
                                  href={previewFile.previewUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-medium text-[var(--admin-dashboard-card-text)] transition hover:text-[#3BE0AF]"
                                >
                                  {previewFile.file.name}
                                </a>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className="rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-2 py-1 text-xs font-medium text-[var(--admin-dashboard-card-text)] normal-case tracking-normal">
                                PDF
                              </Badge>
                            </TableCell>
                            <TableCell className="text-[var(--admin-dashboard-card-muted)]">{formatFileSize(previewFile.file.size)}</TableCell>
                            <TableCell className="text-right">
                              <button
                                type="button"
                                className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] text-[var(--admin-dashboard-card-muted)] transition hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
                                aria-label={`Remove ${previewFile.file.name}`}
                                onClick={() => removeWorkoutImportFile(previewFile.file.name)}
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="py-8 text-center text-sm text-[var(--admin-dashboard-card-muted)]">
                            No PDF files selected.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter className="sm:flex-row sm:justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-shell-text-strong)]"
                  onClick={() => setIsAiWorkoutImportDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
                  disabled={workoutImportFiles.length === 0}
                  onClick={handleGenerateWorkoutImportDraft}
                >
                  <Bot className="size-4" aria-hidden="true" />
                  Generate with AI
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AiWorkoutDraftSheet
        open={isAiWorkoutDraftSheetOpen}
        onOpenChange={setIsAiWorkoutDraftSheetOpen}
        drafts={aiWorkoutDrafts}
        programOptions={programOptions}
        onCancel={() => setIsAiWorkoutDraftSheetOpen(false)}
        onAccept={handleAcceptAiWorkoutDraft}
      />

      <Dialog open={isDeleteWorkoutDialogOpen} onOpenChange={setIsDeleteWorkoutDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Delete workout</DialogTitle>
            <DialogDescription>This workout will be permanently deleted.</DialogDescription>
          </DialogHeader>
          {deleteWorkoutMessage ? (
            <p className="admin-shell-workout-editor-message rounded-[12px] px-4 py-3 text-sm">
              {deleteWorkoutMessage}
            </p>
          ) : null}
          <DialogFooter className="sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px]"
              onClick={() => setIsDeleteWorkoutDialogOpen(false)}
              disabled={isDeletingWorkoutTemplate}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500"
              onClick={handleDeleteWorkoutTemplate}
              disabled={isDeletingWorkoutTemplate}
            >
              {isDeletingWorkoutTemplate ? 'Deleting...' : 'Delete workout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="admin-shell-athletes-table-shell">
        <Table className="admin-shell-athletes-table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              skeletonRows.map((rowIndex) => (
                <TableRow
                  key={`skeleton-${rowIndex}`}
                  className={rowIndex % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}
                >
                  <TableCell>
                    <Skeleton className="h-4 w-4 rounded-[4px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[180px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[64px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[64px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[96px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[72px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-[96px] rounded-full" />
                  </TableCell>
                  <TableCell className="admin-shell-athletes-actions-cell">
                    <Skeleton className="ml-auto h-8 w-8 rounded-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={index % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="admin-shell-athletes-row-even">
                <TableCell colSpan={columns.length} className="admin-shell-athletes-empty-state py-10 text-center">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="admin-shell-athletes-pagination-bar flex flex-wrap items-center justify-end gap-3 py-4 text-sm">
        <span>Rows per page</span>
        <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="admin-shell-athletes-page-size-select h-9 w-[76px] rounded-[10px] px-3 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>{pageStart} - {pageEnd} of {totalRows}</span>
        <button
          type="button"
          aria-label="Go to previous page"
          className="admin-shell-athletes-example-pagination-button"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {visiblePageItems.map((pageItem) => {
            if (pageItem.type === 'ellipsis') {
              return (
                <span key={pageItem.key} className="flex h-9 min-w-9 items-center justify-center px-1 text-sm text-[var(--admin-dashboard-card-muted)]" aria-hidden="true">
                  ...
                </span>
              )
            }

            return (
              <button
                key={pageItem.pageIndex}
                type="button"
                className={[
                  'admin-shell-athletes-example-pagination-button',
                  pageItem.pageIndex === pagination.pageIndex ? 'admin-shell-athletes-example-pagination-button-active' : '',
                ].join(' ')}
                onClick={() => table.setPageIndex(pageItem.pageIndex)}
                aria-label={`Go to page ${pageItem.pageIndex + 1}`}
                aria-current={pageItem.pageIndex === pagination.pageIndex ? 'page' : undefined}
              >
                {pageItem.pageIndex + 1}
              </button>
            )
          })}
        </div>
        <button
          type="button"
          aria-label="Go to next page"
          className="admin-shell-athletes-example-pagination-button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  )
}
