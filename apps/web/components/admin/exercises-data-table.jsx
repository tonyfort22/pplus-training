'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Archive, Copy, Download, Dumbbell, MoreHorizontal, Plus, Target, Trash2, ChevronDown } from 'lucide-react'
import { parseAsJson, useQueryState } from 'nuqs'

import ExerciseArchiveDialog from '@/components/admin/exercise-archive-dialog'
import ExerciseDeleteDialog from '@/components/admin/exercise-delete-dialog'
import ExerciseEditorDialog from '@/components/admin/exercise-editor-dialog'
import { Filters } from '@/components/reui/filters'
import {
  buildExercisesExportCsv,
  downloadExercisesExportFile,
  exerciseExportColumns,
  getExercisesExportFileName,
} from '@/lib/admin-exercises-export'
import Avatar from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Checkbox from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import MultiCombobox from '@/components/ui/multi-combobox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function formatExerciseSetsLabel(totalSetCount = 0) {
  const normalizedCount = Number.isFinite(totalSetCount) ? totalSetCount : 0
  return `${normalizedCount} set${normalizedCount === 1 ? '' : 's'}`
}

function ExerciseCell({ name, thumbnailUrl = '', totalSetCount = 0 }) {
  return (
    <div className="admin-shell-athletes-name-cell admin-shell-exercises-name-cell">
      <Avatar alt={name} className="admin-shell-athletes-avatar admin-shell-exercises-avatar" initials={name} src={thumbnailUrl} />
      <div className="admin-shell-athletes-name-copy admin-shell-exercises-name-copy">
        <span className="admin-shell-athletes-name-text admin-shell-exercises-name-text">{name}</span>
        <span className="admin-shell-athletes-name-meta admin-shell-exercises-name-meta">{formatExerciseSetsLabel(totalSetCount)}</span>
      </div>
    </div>
  )
}

function RowActionsCell({
  rowId,
  isOpen = false,
  onOpenChange = () => {},
  onEditAction = () => {},
  onDeleteAction = () => {},
}) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="admin-shell-athletes-row-menu admin-shell-exercises-row-menu" aria-label="Open menu">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="admin-shell-athletes-row-menu-icon" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => { onEditAction(); onOpenChange(false) }}>Edit</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { onDeleteAction(rowId); onOpenChange(false) }}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function buildVisiblePageItems(pageCount, currentPageIndex) {
  if (pageCount <= 0) {
    return []
  }

  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, pageIndex) => ({ type: 'page', pageIndex }))
  }

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

function normalizeExerciseFilterValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function normalizeExerciseStatus(value) {
  return String(value ?? '').trim().toLowerCase()
}

function buildSelectFilterOptions(values = []) {
  const seenValues = new Set()

  return values
    .map((value) => String(value ?? '').trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right))
    .filter((value) => {
      const normalizedValue = normalizeExerciseFilterValue(value)
      if (!normalizedValue || seenValues.has(normalizedValue)) {
        return false
      }
      seenValues.add(normalizedValue)
      return true
    })
    .map((value) => ({
      value: normalizeExerciseFilterValue(value),
      label: value,
    }))
}

const categoryOptions = [
  { value: 'strength', label: 'Strength' },
  { value: 'power', label: 'Power' },
  { value: 'mobility', label: 'Mobility' },
  { value: 'speed', label: 'Speed' },
  { value: 'activation', label: 'Activation' },
  { value: 'core', label: 'Core' },
]

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

function createExerciseFormValues(exercise = null) {
  const normalizedExercise = exercise || {}

  return {
    id: normalizedExercise.id || null,
    name: normalizedExercise.name || '',
    videoName: '',
    videoUpload: null,
    videoUrl: normalizedExercise.videoUrl || '',
    thumbnailName: '',
    thumbnailUpload: null,
    thumbnailUrl: normalizedExercise.thumbnailUrl || '',
    sets: normalizedExercise.sets && normalizedExercise.sets !== '-' ? String(normalizedExercise.sets) : '',
    reps: normalizedExercise.reps && normalizedExercise.reps !== '-' ? String(normalizedExercise.reps) : '',
    distance: normalizedExercise.distance && normalizedExercise.distance !== '-' ? String(normalizedExercise.distance) : '',
    weights: normalizedExercise.weights || '',
    duration: normalizedExercise.duration && normalizedExercise.duration !== '-' ? String(normalizedExercise.duration) : '',
    rest: normalizedExercise.rest && normalizedExercise.rest !== '-' ? String(normalizedExercise.rest) : '',
    tempo: normalizedExercise.tempo || '',
    category: normalizedExercise.category || '',
    difficulty: normalizedExercise.difficulty || '',
    status: normalizedExercise.status || 'draft',
    equipmentNeeded: Array.isArray(normalizedExercise.equipmentNeeded) ? normalizedExercise.equipmentNeeded : [],
    primaryMuscleId: normalizedExercise.primaryMuscleId || '',
    secondaryMuscleIds: Array.isArray(normalizedExercise.secondaryMuscleIds) ? normalizedExercise.secondaryMuscleIds : [],
    description: normalizedExercise.description || '',
  }
}

async function uploadExerciseMediaFile({ kind, file, exerciseId = '' }) {
  if (!file) return null

  const formData = new FormData()
  formData.append('kind', kind)
  formData.append('file', file)
  if (exerciseId) {
    formData.append('exerciseId', exerciseId)
  }

  const response = await fetch('/api/admin/exercise-media', {
    method: 'POST',
    body: formData,
  })
  const payload = await response.json()

  if (!response.ok) {
    throw new Error(payload?.error || `Failed to upload exercise ${kind}.`)
  }

  return payload?.publicUrl || null
}

function exerciseMatchesFilter(exercise, filter) {
  if (!filter || !filter.field) return true

  const selectedValues = Array.isArray(filter.values)
    ? filter.values.map(normalizeExerciseFilterValue).filter(Boolean)
    : []

  switch (filter.field) {
    case 'muscle': {
      const muscleValues = Array.isArray(exercise.muscleNames)
        ? exercise.muscleNames.map(normalizeExerciseFilterValue).filter(Boolean)
        : []

      if (filter.operator === 'empty') return muscleValues.length === 0
      if (filter.operator === 'not_empty') return muscleValues.length > 0
      if (selectedValues.length === 0) return true

      const hasMatch = selectedValues.some((selectedValue) => muscleValues.includes(selectedValue))
      if (filter.operator === 'is_not') return !hasMatch
      return hasMatch
    }
    case 'equipment': {
      const equipmentValues = Array.isArray(exercise.equipmentNeeded) && exercise.equipmentNeeded.length > 0
        ? exercise.equipmentNeeded.map(normalizeExerciseFilterValue).filter(Boolean)
        : [normalizeExerciseFilterValue(exercise.equipment)].filter(Boolean)

      if (filter.operator === 'empty') return equipmentValues.length === 0
      if (filter.operator === 'not_empty') return equipmentValues.length > 0
      if (selectedValues.length === 0) return true

      const hasMatch = selectedValues.some((selectedValue) => equipmentValues.includes(selectedValue))
      if (filter.operator === 'is_not') return !hasMatch
      return hasMatch
    }
    case 'movementType': {
      const movementTypeValues = Array.isArray(exercise.movementTypeValues)
        ? exercise.movementTypeValues.map(normalizeExerciseFilterValue).filter(Boolean)
        : []

      if (filter.operator === 'empty') return movementTypeValues.length === 0
      if (filter.operator === 'not_empty') return movementTypeValues.length > 0
      if (selectedValues.length === 0) return true

      const hasMatch = selectedValues.some((selectedValue) => movementTypeValues.includes(selectedValue))
      if (filter.operator === 'is_not') return !hasMatch
      return hasMatch
    }
    default:
      return true
  }
}

function exerciseMatchesFilters(exercise, filters) {
  return filters.every((filter) => exerciseMatchesFilter(exercise, filter))
}

export default function ExercisesDataTable({ searchQuery = '' }) {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editorMuscleOptions, setEditorMuscleOptions] = useState([])
  const [exerciseFilters, setExerciseFilters] = useQueryState(
    'exerciseFilters',
    parseAsJson((value) => (Array.isArray(value) ? value : [])).withDefault([]),
  )
  const [isExerciseEditorOpen, setIsExerciseEditorOpen] = useState(false)
  const [exerciseEditorMode, setExerciseEditorMode] = useState('create')
  const [exerciseFormValues, setExerciseFormValues] = useState(() => createExerciseFormValues())
  const [exerciseEditorError, setExerciseEditorError] = useState('')
  const [isSavingExercise, setIsSavingExercise] = useState(false)
  const [isGeneratingExerciseYoutubeMedia, setIsGeneratingExerciseYoutubeMedia] = useState(false)
  const [isExerciseDeleteDialogOpen, setIsExerciseDeleteDialogOpen] = useState(false)
  const [exercisePendingDelete, setExercisePendingDelete] = useState(null)
  const [selectedDeleteExerciseIds, setSelectedDeleteExerciseIds] = useState([])
  const [exerciseDeleteError, setExerciseDeleteError] = useState('')
  const [isDeletingExercise, setIsDeletingExercise] = useState(false)
  const [exerciseThumbnailUrls, setExerciseThumbnailUrls] = useState({})
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [isBulkExerciseMenuOpen, setIsBulkExerciseMenuOpen] = useState(false)
  const [isAssignMuscleGroupSheetOpen, setIsAssignMuscleGroupSheetOpen] = useState(false)
  const [assignMuscleGroupId, setAssignMuscleGroupId] = useState('')
  const [assignMuscleGroupError, setAssignMuscleGroupError] = useState('')
  const [isAssigningMuscleGroup, setIsAssigningMuscleGroup] = useState(false)
  const [isAssignEquipmentSheetOpen, setIsAssignEquipmentSheetOpen] = useState(false)
  const [assignEquipmentIds, setAssignEquipmentIds] = useState([])
  const [assignEquipmentError, setAssignEquipmentError] = useState('')
  const [isAssigningEquipment, setIsAssigningEquipment] = useState(false)
  const [isExportExerciseSheetOpen, setIsExportExerciseSheetOpen] = useState(false)
  const [selectedExportExerciseIds, setSelectedExportExerciseIds] = useState([])
  const [isExportingExercises, setIsExportingExercises] = useState(false)
  const [isArchiveExerciseDialogOpen, setIsArchiveExerciseDialogOpen] = useState(false)
  const [selectedArchiveExerciseIds, setSelectedArchiveExerciseIds] = useState([])
  const [isArchivingExercises, setIsArchivingExercises] = useState(false)
  const [archiveExerciseMessage, setArchiveExerciseMessage] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  async function requestExercisesApi(path = '/api/admin/exercises', options = {}) {
    const response = await fetch(path, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })
    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.error || 'Failed to save exercise.')
    }

    return payload
  }

  async function loadExercises() {
    setLoading(true)
    setError('')

    try {
      const payload = await requestExercisesApi('/api/admin/exercises', {
        method: 'GET',
      })
      setExercises(Array.isArray(payload?.exercises) ? payload.exercises : [])
      setEditorMuscleOptions(Array.isArray(payload?.muscleOptions) ? payload.muscleOptions : [])
    } catch (loadError) {
      setExercises([])
      setEditorMuscleOptions([])
      setError(loadError?.message || 'Failed to load exercises.')
    } finally {
      setLoading(false)
    }
  }

  function openCreateExerciseDialog() {
    setOpenRowActionMenuId(null)
    setExerciseEditorMode('create')
    setExerciseEditorError('')
    setExerciseFormValues(createExerciseFormValues())
    setIsExerciseEditorOpen(true)
  }

  async function openEditExerciseDialog(exercise) {
    setOpenRowActionMenuId(null)
    setExerciseEditorMode('edit')
    setExerciseEditorError('')
    setExerciseFormValues(createExerciseFormValues(exercise))
    setIsExerciseEditorOpen(true)

    if (!exercise?.id) return

    try {
      const payload = await requestExercisesApi(`/api/admin/exercises/${exercise.id}`, {
        method: 'GET',
      })
      if (payload?.exercise) {
        setExerciseFormValues(createExerciseFormValues(payload.exercise))
      }
    } catch (detailError) {
      setExerciseEditorError(detailError?.message || 'Failed to load saved exercise media.')
    }
  }

  async function handleVideoFileChange(file) {
    try {
      const videoUrl = await uploadExerciseMediaFile({
        kind: 'video',
        file,
        exerciseId: exerciseFormValues.id || '',
      })
      setExerciseFormValues((current) => ({
        ...current,
        videoName: file?.name ?? '',
        videoUpload: null,
        videoUrl: videoUrl || current.videoUrl || '',
      }))
      setExerciseEditorError('')
    } catch (fileError) {
      setExerciseEditorError(fileError?.message || 'Failed to upload the video.')
    }
  }

  async function handleThumbnailFileChange(file) {
    try {
      const thumbnailUrl = await uploadExerciseMediaFile({
        kind: 'thumbnail',
        file,
        exerciseId: exerciseFormValues.id || '',
      })
      setExerciseFormValues((current) => ({
        ...current,
        thumbnailName: file?.name ?? '',
        thumbnailUpload: null,
        thumbnailUrl: thumbnailUrl || current.thumbnailUrl || '',
      }))
      setExerciseEditorError('')
    } catch (fileError) {
      setExerciseEditorError(fileError?.message || 'Failed to upload the thumbnail.')
    }
  }

  async function handleGenerateExerciseYoutubeMedia() {
    const youtubeLink = exerciseFormValues.youtubeLink?.trim() || ''
    if (!youtubeLink) {
      setExerciseEditorError('Paste a YouTube link first.')
      return
    }

    setIsGeneratingExerciseYoutubeMedia(true)
    setExerciseEditorError('')

    try {
      const response = await fetch('/api/admin/exercise-youtube-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          youtubeUrl: youtubeLink,
          exerciseId: exerciseFormValues.id || '',
          exerciseName: exerciseFormValues.name || '',
        }),
      })
      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to generate exercise media from YouTube.')
      }

      setExerciseFormValues((current) => ({
        ...current,
        youtubeLink: payload.youtubeUrl || current.youtubeLink || '',
        videoUrl: payload.videoUrl || current.videoUrl || '',
        videoName: payload.videoName || current.videoName || '',
        videoUpload: null,
        thumbnailUrl: payload.thumbnailUrl || current.thumbnailUrl || '',
        thumbnailName: payload.thumbnailName || current.thumbnailName || '',
        thumbnailUpload: null,
      }))
      setExerciseEditorError('')
    } catch (generationError) {
      setExerciseEditorError(generationError?.message || 'Failed to generate exercise media from YouTube.')
    } finally {
      setIsGeneratingExerciseYoutubeMedia(false)
    }
  }

  function openDeleteExerciseDialog(exerciseId) {
    const selectedExercise = exercises.find((exercise) => exercise.id === exerciseId) || null
    if (!selectedExercise) return

    setOpenRowActionMenuId(null)
    setExerciseDeleteError('')
    setSelectedDeleteExerciseIds([])
    setExercisePendingDelete(selectedExercise)
    setIsExerciseDeleteDialogOpen(true)
  }

  async function handleDeleteExercise() {
    const exerciseIds = selectedDeleteExerciseIds.length > 0
      ? selectedDeleteExerciseIds
      : (exercisePendingDelete?.id ? [exercisePendingDelete.id] : [])
    if (exerciseIds.length === 0) return

    setIsDeletingExercise(true)
    setExerciseDeleteError('')
    try {
      await Promise.all(
        exerciseIds.map((exerciseId) => requestExercisesApi(`/api/admin/exercises/${exerciseId}`, {
          method: 'DELETE',
        })),
      )
      await loadExercises()
      setRowSelection({})
      setIsExerciseDeleteDialogOpen(false)
      setExercisePendingDelete(null)
      setSelectedDeleteExerciseIds([])
      if (exerciseFormValues.id && exerciseIds.includes(exerciseFormValues.id)) {
        setIsExerciseEditorOpen(false)
      }
    } catch (deleteError) {
      setExerciseDeleteError(deleteError?.message || 'Failed to delete exercises.')
    } finally {
      setIsDeletingExercise(false)
    }
  }

  async function handleExerciseEditorSubmit() {
    const payload = {
      ...exerciseFormValues,
      primaryMuscleId: exerciseFormValues.primaryMuscleId,
      secondaryMuscleIds: exerciseFormValues.secondaryMuscleIds,
    }

    setIsSavingExercise(true)
    setExerciseEditorError('')

    try {
      if (exerciseEditorMode === 'edit' && exerciseFormValues.id) {
        await requestExercisesApi(`/api/admin/exercises/${exerciseFormValues.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        })
      } else {
        await requestExercisesApi('/api/admin/exercises', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      }

      await loadExercises()
      setIsExerciseEditorOpen(false)
    } catch (submitError) {
      setExerciseEditorError(submitError?.message || 'Failed to save exercise.')
    } finally {
      setIsSavingExercise(false)
    }
  }

  useEffect(() => {
    loadExercises()
  }, [])

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
        header: 'Exercise',
        meta: { label: 'Exercise' },
        cell: ({ row }) => (
          <ExerciseCell
            name={row.original.name}
            thumbnailUrl={exerciseThumbnailUrls[row.original.id] || row.original.thumbnailUrl || ''}
            totalSetCount={row.original.totalSetCount}
          />
        ),
      },
      {
        accessorKey: 'muscle',
        header: 'Muscle',
        meta: { label: 'Muscle' },
        cell: ({ row }) => <span className="admin-shell-athletes-program-cell">{row.original.muscle}</span>,
      },
      {
        accessorKey: 'sets',
        header: 'Sets',
        meta: { label: 'Sets' },
      },
      {
        accessorKey: 'reps',
        header: 'Reps',
        meta: { label: 'Reps' },
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        meta: { label: 'Duration' },
      },
      {
        accessorKey: 'distance',
        header: 'Distance',
        meta: { label: 'Distance' },
      },
      {
        accessorKey: 'rest',
        header: 'Rest',
        meta: { label: 'Rest' },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => <RowActionsCell rowId={row.original.id} isOpen={openRowActionMenuId === row.original.id} onOpenChange={(isOpen) => setOpenRowActionMenuId(isOpen ? row.original.id : null)} onEditAction={() => openEditExerciseDialog(row.original)} onDeleteAction={openDeleteExerciseDialog} />,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [exerciseThumbnailUrls, openRowActionMenuId],
  )

  const muscleFilterOptions = useMemo(
    () => buildSelectFilterOptions(exercises.flatMap((exercise) => exercise.muscleNames || [])),
    [exercises],
  )
  const equipmentFilterOptions = useMemo(
    () => buildSelectFilterOptions(exercises.flatMap((exercise) => (
      Array.isArray(exercise.equipmentNeeded) && exercise.equipmentNeeded.length > 0
        ? exercise.equipmentNeeded
        : [exercise.equipment]
    ))),
    [exercises],
  )
  const editorEquipmentOptions = useMemo(
    () => equipmentFilterOptions,
    [equipmentFilterOptions],
  )
  const movementTypeFilterOptions = useMemo(
    () => buildSelectFilterOptions(exercises.flatMap((exercise) => exercise.movementTypeValues || [])),
    [exercises],
  )
  const exerciseFilterFields = useMemo(() => {
    const fields = [
      {
        key: 'muscle',
        label: 'Muscle',
        field: 'muscle',
        type: 'select',
        defaultOperator: 'is',
        placeholder: 'Select muscle...',
        allowMultipleValues: true,
        options: muscleFilterOptions,
      },
      {
        key: 'equipment',
        label: 'Equipment',
        field: 'equipment',
        type: 'select',
        defaultOperator: 'is',
        placeholder: 'Select equipment...',
        allowMultipleValues: true,
        options: equipmentFilterOptions,
      },
      {
        key: 'movementType',
        label: 'Movement / Type',
        field: 'movementType',
        type: 'select',
        defaultOperator: 'is',
        placeholder: 'Select movement / type...',
        allowMultipleValues: true,
        options: movementTypeFilterOptions,
      },
    ]

    return fields
  }, [equipmentFilterOptions, movementTypeFilterOptions, muscleFilterOptions])

  const filteredExercises = useMemo(() => {
    const normalizedFilters = Array.isArray(exerciseFilters) ? exerciseFilters : []
    return exercises.filter((exercise) => exerciseMatchesFilters(exercise, normalizedFilters))
  }, [exerciseFilters, exercises])

  const table = useReactTable({
    data: filteredExercises,
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

  const selectedExerciseRows = table.getSelectedRowModel().rows.map((row) => row.original)
  const selectedExerciseCount = selectedExerciseRows.length
  const exportExercisesToReview = useMemo(
    () => exercises.filter((exercise) => selectedExportExerciseIds.includes(exercise.id)),
    [exercises, selectedExportExerciseIds],
  )
  const exportExercisesFileName = getExercisesExportFileName()
  const exportExercisesDisabled = isExportingExercises || exportExercisesToReview.length === 0
  const archiveExercisesToReview = useMemo(
    () => exercises.filter((exercise) => selectedArchiveExerciseIds.includes(exercise.id)),
    [exercises, selectedArchiveExerciseIds],
  )
  const deleteExercisesToReview = useMemo(
    () => exercises.filter((exercise) => selectedDeleteExerciseIds.includes(exercise.id)),
    [exercises, selectedDeleteExerciseIds],
  )
  const exerciseDeleteDialogItems = deleteExercisesToReview.length > 0 ? deleteExercisesToReview : (exercisePendingDelete ? [exercisePendingDelete] : [])
  const archiveEligibleExercises = useMemo(
    () => archiveExercisesToReview.filter((exercise) => normalizeExerciseStatus(exercise.status) !== 'archived'),
    [archiveExercisesToReview],
  )
  const archiveSkippedExercises = useMemo(
    () => archiveExercisesToReview.filter((exercise) => normalizeExerciseStatus(exercise.status) === 'archived'),
    [archiveExercisesToReview],
  )

  useEffect(() => {
    if (selectedExerciseCount === 0) {
      setIsBulkExerciseMenuOpen(false)
    }
  }, [selectedExerciseCount])

  function handleBulkExerciseMenuOpenChange(isOpen) {
    if (isOpen && selectedExerciseCount === 0) {
      setIsBulkExerciseMenuOpen(false)
      return
    }
    setIsBulkExerciseMenuOpen(isOpen)
  }

  function handleDuplicateSelectedExercise() {
    if (selectedExerciseCount !== 1) return
    const selectedExercise = selectedExerciseRows[0]
    setIsBulkExerciseMenuOpen(false)
    setOpenRowActionMenuId(null)
    setExerciseEditorMode('create')
    setExerciseEditorError('')
    setExerciseFormValues(createExerciseFormValues({
      ...selectedExercise,
      id: null,
      name: selectedExercise?.name ? `${selectedExercise.name} copy` : '',
    }))
    setIsExerciseEditorOpen(true)
  }

  function handleAssignMuscleGroupSheetOpenChange(isOpen) {
    setIsAssignMuscleGroupSheetOpen(isOpen)
    if (!isOpen) {
      setAssignMuscleGroupId('')
      setAssignMuscleGroupError('')
    }
  }

  function handleAssignSelectedExercisesToMuscleGroup() {
    if (selectedExerciseCount === 0) return
    setIsBulkExerciseMenuOpen(false)
    setAssignMuscleGroupError('')
    setAssignMuscleGroupId('')
    setIsAssignMuscleGroupSheetOpen(true)
  }

  async function handleConfirmAssignMuscleGroup() {
    if (!assignMuscleGroupId || selectedExerciseCount === 0) return

    setIsAssigningMuscleGroup(true)
    setAssignMuscleGroupError('')

    try {
      await Promise.all(
        selectedExerciseRows.map((exercise) => requestExercisesApi(`/api/admin/exercises/${exercise.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...exercise,
            primaryMuscleId: assignMuscleGroupId,
            secondaryMuscleIds: Array.isArray(exercise.secondaryMuscleIds)
              ? exercise.secondaryMuscleIds.filter((muscleId) => muscleId !== assignMuscleGroupId)
              : [],
          }),
        })),
      )
      await loadExercises()
      setRowSelection({})
      setIsAssignMuscleGroupSheetOpen(false)
      setAssignMuscleGroupId('')
    } catch (assignmentError) {
      setAssignMuscleGroupError(assignmentError?.message || 'Failed to assign muscle group.')
    } finally {
      setIsAssigningMuscleGroup(false)
    }
  }

  function handleAssignEquipmentSheetOpenChange(isOpen) {
    setIsAssignEquipmentSheetOpen(isOpen)
    if (!isOpen) {
      setAssignEquipmentIds([])
      setAssignEquipmentError('')
    }
  }

  function handleAssignSelectedExercisesToEquipment() {
    if (selectedExerciseCount === 0) return
    setIsBulkExerciseMenuOpen(false)
    setAssignEquipmentError('')
    setAssignEquipmentIds([])
    setIsAssignEquipmentSheetOpen(true)
  }

  async function handleConfirmAssignEquipment() {
    if (assignEquipmentIds.length === 0 || selectedExerciseCount === 0) return

    setIsAssigningEquipment(true)
    setAssignEquipmentError('')

    try {
      await Promise.all(
        selectedExerciseRows.map((exercise) => requestExercisesApi(`/api/admin/exercises/${exercise.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...exercise,
            equipmentNeeded: assignEquipmentIds,
          }),
        })),
      )
      await loadExercises()
      setRowSelection({})
      setIsAssignEquipmentSheetOpen(false)
      setAssignEquipmentIds([])
    } catch (assignmentError) {
      setAssignEquipmentError(assignmentError?.message || 'Failed to assign equipment.')
    } finally {
      setIsAssigningEquipment(false)
    }
  }

  function handleExportSelectedExercises() {
    if (selectedExerciseCount === 0) return
    setIsBulkExerciseMenuOpen(false)
    setSelectedExportExerciseIds(selectedExerciseRows.map((exercise) => exercise.id).filter(Boolean))
    setIsExportExerciseSheetOpen(true)
  }

  async function handleConfirmExportExercises() {
    if (exportExercisesDisabled) return
    setIsExportingExercises(true)

    try {
      const csv = buildExercisesExportCsv(exportExercisesToReview)
      downloadExercisesExportFile({
        content: csv,
        fileName: exportExercisesFileName,
      })
      setIsExportExerciseSheetOpen(false)
      setSelectedExportExerciseIds([])
      table.resetRowSelection()
    } finally {
      setIsExportingExercises(false)
    }
  }

  function handleArchiveExerciseDialogOpenChange(isOpen) {
    setIsArchiveExerciseDialogOpen(isOpen)
    if (!isOpen) {
      setSelectedArchiveExerciseIds([])
      setArchiveExerciseMessage('')
    }
  }

  function handleArchiveSelectedExercises() {
    if (selectedExerciseCount === 0) return
    setIsBulkExerciseMenuOpen(false)
    setArchiveExerciseMessage('')
    setSelectedArchiveExerciseIds(selectedExerciseRows.map((exercise) => exercise.id).filter(Boolean))
    setIsArchiveExerciseDialogOpen(true)
  }

  async function handleConfirmArchiveExercises() {
    if (archiveEligibleExercises.length === 0) return

    setIsArchivingExercises(true)
    setArchiveExerciseMessage('')

    try {
      await Promise.all(
        archiveEligibleExercises.map((exercise) => requestExercisesApi(`/api/admin/exercises/${exercise.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...exercise,
            status: 'archived',
          }),
        })),
      )
      await loadExercises()
      setRowSelection({})
      setIsArchiveExerciseDialogOpen(false)
      setSelectedArchiveExerciseIds([])
      setArchiveExerciseMessage('')
    } catch (archiveError) {
      setArchiveExerciseMessage(archiveError?.message || 'Failed to archive exercises.')
    } finally {
      setIsArchivingExercises(false)
    }
  }

  function handleDeleteExerciseDialogOpenChange(isOpen) {
    setIsExerciseDeleteDialogOpen(isOpen)
    if (!isOpen) {
      setExercisePendingDelete(null)
      setSelectedDeleteExerciseIds([])
      setExerciseDeleteError('')
    }
  }

  function handleDeleteSelectedExercises() {
    if (selectedExerciseCount === 0) return
    setIsBulkExerciseMenuOpen(false)
    setExerciseDeleteError('')
    setExercisePendingDelete(null)
    setSelectedDeleteExerciseIds(selectedExerciseRows.map((exercise) => exercise.id).filter(Boolean))
    setIsExerciseDeleteDialogOpen(true)
  }

  useEffect(() => {
    table.getColumn('name')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  useEffect(() => {
    setPagination((current) => ({
      ...current,
      pageIndex: 0,
    }))
  }, [exerciseFilters, searchQuery])

  useEffect(() => {
    if (loading) return undefined

    const visibleExercisesMissingThumbnails = table
      .getRowModel()
      .rows
      .map((row) => row.original)
      .filter((exercise) => exercise?.id && !Object.prototype.hasOwnProperty.call(exerciseThumbnailUrls, exercise.id))

    if (!visibleExercisesMissingThumbnails.length) return undefined

    let isCancelled = false

    Promise.all(
      visibleExercisesMissingThumbnails.map(async (exercise) => {
        const response = await fetch(`/api/admin/exercises/${exercise.id}`, {
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok) {
          return null
        }

        const thumbnailUrl = typeof payload?.exercise?.thumbnailUrl === 'string' ? payload.exercise.thumbnailUrl.trim() : ''
        return [exercise.id, thumbnailUrl]
      }),
    )
      .then((thumbnailEntries) => {
        if (isCancelled) return

        const nextThumbnailEntries = thumbnailEntries.filter(Boolean)
        if (!nextThumbnailEntries.length) return

        setExerciseThumbnailUrls((current) => {
          const next = { ...current }
          nextThumbnailEntries.forEach(([exerciseId, thumbnailUrl]) => {
            next[exerciseId] = thumbnailUrl
          })
          return next
        })
      })
      .catch(() => {
        // Keep the table lean and resilient. Missing row thumbnails should not block the exercise table.
      })

    return () => {
      isCancelled = true
    }
  }, [exerciseThumbnailUrls, loading, pagination.pageIndex, pagination.pageSize, table])

  const emptyStateMessage = loading
    ? 'Loading exercises...'
    : error || (Array.isArray(exerciseFilters) && exerciseFilters.length > 0 ? 'No exercises match the current filters.' : 'No exercises found.')
  const pageSizeOptions = [5, 10, 20, 30]
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)
  const visiblePageItems = buildVisiblePageItems(table.getPageCount(), pagination.pageIndex)
  const skeletonRows = Array.from({ length: pagination.pageSize }, (_, index) => index)
  const selectedAssignMuscleGroup = editorMuscleOptions.find((muscleOption) => muscleOption.value === assignMuscleGroupId) || null

  return (
    <div className="admin-shell-athletes-table-example">
      <div className="flex flex-col gap-3">
        <div className="flex w-full flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-start gap-2">
            <Filters
              filters={Array.isArray(exerciseFilters) ? exerciseFilters : []}
              fields={exerciseFilterFields}
              onChange={setExerciseFilters}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  className="admin-shell-athletes-filter-trigger admin-shell-exercises-filter-trigger rounded-[12px] min-h-[40px] shadow-none"
                >
                  <Plus className="size-4" />
                  Add filter
                </Button>
              }
            />
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-3">
            <DropdownMenu
              open={isBulkExerciseMenuOpen && selectedExerciseCount > 0}
              onOpenChange={handleBulkExerciseMenuOpenChange}
            >
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="admin-shell-athletes-example-columns-button admin-shell-exercises-bulk-actions-button disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Exercise bulk actions"
                  disabled={selectedExerciseCount === 0}
                  aria-disabled={selectedExerciseCount === 0}
                >
                  {selectedExerciseCount > 0 ? `Bulk actions (${selectedExerciseCount})` : 'Bulk actions'}
                  <ChevronDown className="admin-shell-athletes-example-columns-icon" aria-hidden="true" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[210px]">
                <DropdownMenuLabel>{selectedExerciseCount > 0 ? 'Bulk actions' : 'Select exercises first'}</DropdownMenuLabel>
                <DropdownMenuItem className="admin-shell-athletes-bulk-menu-item" disabled={selectedExerciseCount !== 1} onSelect={(event) => {
                  event.preventDefault()
                  handleDuplicateSelectedExercise()
                }}>
                  <Copy className="size-4" aria-hidden="true" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuItem className="admin-shell-athletes-bulk-menu-item" disabled={selectedExerciseCount === 0} onSelect={(event) => {
                  event.preventDefault()
                  handleAssignSelectedExercisesToMuscleGroup()
                }}>
                  <Target className="size-4" aria-hidden="true" />
                  Assign muscle group
                </DropdownMenuItem>
                <DropdownMenuItem className="admin-shell-athletes-bulk-menu-item" disabled={selectedExerciseCount === 0} onSelect={(event) => {
                  event.preventDefault()
                  handleAssignSelectedExercisesToEquipment()
                }}>
                  <Dumbbell className="size-4" aria-hidden="true" />
                  Assign equipment
                </DropdownMenuItem>
                <DropdownMenuItem className="admin-shell-athletes-bulk-menu-item" disabled={selectedExerciseCount === 0} onSelect={(event) => {
                  event.preventDefault()
                  handleExportSelectedExercises()
                }}>
                  <Download className="size-4" aria-hidden="true" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="admin-shell-athletes-bulk-menu-item admin-shell-athletes-bulk-menu-item-danger" disabled={selectedExerciseCount === 0} onSelect={(event) => {
                  event.preventDefault()
                  handleArchiveSelectedExercises()
                }}>
                  <Archive className="size-4" aria-hidden="true" />
                  Archive
                </DropdownMenuItem>
                <DropdownMenuItem className="admin-shell-athletes-bulk-menu-item admin-shell-athletes-bulk-menu-item-danger" disabled={selectedExerciseCount === 0} onSelect={(event) => {
                  event.preventDefault()
                  handleDeleteSelectedExercises()
                }}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="admin-shell-athletes-example-columns-button admin-shell-exercises-columns-button">
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
                      checkIconClassName="text-[var(--admin-shell-primary-button-bg)]"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.columnDef.meta?.label ?? column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              className="admin-shell-athletes-invite-button admin-shell-exercises-create-button self-start rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] md:self-auto"
              onClick={openCreateExerciseDialog}
            >
              Create exercise
            </Button>
          </div>
        </div>
      </div>

      <div className="admin-shell-athletes-table-shell admin-shell-exercises-table-shell">
        <Table className="admin-shell-athletes-table admin-shell-exercises-table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}
                  >
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
                    <Skeleton className="h-4 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[40px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[72px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[72px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[56px]" />
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
                    <TableCell
                      key={cell.id}
                      className={cell.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}
                    >
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

      <ExerciseEditorDialog
        open={isExerciseEditorOpen}
        onOpenChange={setIsExerciseEditorOpen}
        mode={exerciseEditorMode}
        values={exerciseFormValues}
        onValuesChange={setExerciseFormValues}
        equipmentOptions={editorEquipmentOptions}
        muscleOptions={editorMuscleOptions}
        categoryOptions={categoryOptions}
        difficultyOptions={difficultyOptions}
        statusOptions={statusOptions}
        errorMessage={exerciseEditorError}
        isSaving={isSavingExercise}
        isGeneratingYoutubeMedia={isGeneratingExerciseYoutubeMedia}
        onGenerateYoutubeMedia={handleGenerateExerciseYoutubeMedia}
        onThumbnailFileChange={handleThumbnailFileChange}
        onVideoFileChange={handleVideoFileChange}
        onPrimaryAction={handleExerciseEditorSubmit}
      />

      <Sheet open={isExportExerciseSheetOpen} onOpenChange={setIsExportExerciseSheetOpen}>
        <SheetContent side="right" className="admin-shell-exercises-export-sheet border-l border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <SheetHeader className="shrink-0 border-b border-[color:var(--admin-dashboard-card-border)] px-6 py-5 text-left">
            <SheetTitle>Export exercises</SheetTitle>
            <SheetDescription>
              Review the selected exercises before downloading a CSV export.
            </SheetDescription>
          </SheetHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="grid gap-5">
              <div className="admin-shell-exercises-export-summary grid gap-3 rounded-[20px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <div className="grid gap-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Selected exercises</p>
                  <p className="text-2xl font-semibold text-[var(--admin-dashboard-card-text)]">{exportExercisesToReview.length}</p>
                </div>
                <div className="grid gap-2 text-sm text-[var(--admin-dashboard-card-muted)]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Format</span>
                    <span className="font-medium text-[var(--admin-dashboard-card-text)]">CSV</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Filename</span>
                    <span className="truncate font-medium text-[var(--admin-dashboard-card-text)]">{exportExercisesFileName}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Included columns</div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {exerciseExportColumns.map((column) => (
                    <div key={column} className="rounded-[14px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-2 text-sm font-medium text-[var(--admin-dashboard-card-text)]">
                      {column}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3">
                <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-dashboard-card-muted)]">Selected exercise preview</div>
                <div className="grid max-h-[360px] gap-2 overflow-y-auto pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                  {exportExercisesToReview.map((exercise) => (
                    <div key={`export-${exercise.id}`} className="flex items-center justify-between gap-3 rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{exercise.name}</p>
                        <p className="truncate text-sm text-[var(--admin-dashboard-card-muted)]">
                          {Array.isArray(exercise.muscleNames) && exercise.muscleNames.length > 0 ? exercise.muscleNames.join(', ') : 'No muscle assigned'}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="hidden text-sm text-[var(--admin-dashboard-card-muted)] sm:inline">
                          {Array.isArray(exercise.equipmentNeeded) && exercise.equipmentNeeded.length > 0 ? exercise.equipmentNeeded.join(', ') : exercise.equipment || 'No equipment'}
                        </span>
                        <span className="rounded-full border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-2.5 py-1 text-xs font-semibold capitalize text-[var(--admin-dashboard-card-text)]">
                          {exercise.status || 'draft'}
                        </span>
                      </div>
                    </div>
                  ))}
                  {exportExercisesToReview.length === 0 ? (
                    <div className="rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-muted)]">No exercises selected.</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <SheetFooter className="shrink-0 border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
              onClick={() => {
                setIsExportExerciseSheetOpen(false)
                setSelectedExportExerciseIds([])
              }}
              disabled={isExportingExercises}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={exportExercisesDisabled}
              onClick={handleConfirmExportExercises}
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isExportingExercises ? 'Preparing CSV...' : 'Download CSV'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isAssignMuscleGroupSheetOpen} onOpenChange={handleAssignMuscleGroupSheetOpenChange}>
        <SheetContent side="right" className="admin-shell-exercises-assign-muscle-sheet border-l border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-[color:var(--admin-dashboard-card-border)] px-6 py-5 text-left">
              <SheetTitle>Assign muscle group</SheetTitle>
              <SheetDescription>Choose the primary muscle group for the selected exercises.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="rounded-[20px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">Selected exercises</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--admin-dashboard-card-text)]">
                  {selectedExerciseCount} exercise{selectedExerciseCount === 1 ? '' : 's'}
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--admin-dashboard-card-text)]" htmlFor="assign-exercise-muscle-trigger">
                  Primary muscle group
                </label>
                <Select value={assignMuscleGroupId} onValueChange={setAssignMuscleGroupId}>
                  <SelectTrigger id="assign-exercise-muscle-trigger" className="admin-shell-exercises-assign-muscle-select-trigger">
                    <SelectValue placeholder="Select a muscle group" />
                  </SelectTrigger>
                  <SelectContent className="admin-dashboard-dropdown-content admin-shell-exercises-assign-muscle-select-content">
                    {editorMuscleOptions.length > 0 ? editorMuscleOptions.map((muscleOption) => (
                      <SelectItem key={muscleOption.value} value={muscleOption.value} className="admin-shell-exercises-assign-muscle-select-item">
                        {muscleOption.label}
                      </SelectItem>
                    )) : (
                      <SelectItem value="no-muscles" className="admin-shell-exercises-assign-muscle-select-item" disabled>
                        No muscle groups available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {assignMuscleGroupError ? (
                <p className="admin-shell-workout-editor-message rounded-[12px] px-4 py-3 text-sm">{assignMuscleGroupError}</p>
              ) : null}

              {selectedAssignMuscleGroup ? (
                <div className="rounded-[18px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">Muscle group selected</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{selectedAssignMuscleGroup.label}</p>
                </div>
              ) : null}

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Assignment preview</p>
                  <p className="text-xs text-[var(--admin-dashboard-card-muted)]">Selected exercises will use this muscle as their primary group.</p>
                </div>
                <div className="space-y-2">
                  {selectedExerciseRows.map((exercise) => (
                    <div key={exercise.id} className="rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-3">
                      <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{exercise.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--admin-dashboard-card-muted)]">
                        <span>Current: {Array.isArray(exercise.muscleNames) && exercise.muscleNames.length > 0 ? exercise.muscleNames.join(', ') : 'Unassigned'}</span>
                        {exercise.equipment ? <span>{exercise.equipment}</span> : null}
                      </div>
                    </div>
                  ))}
                  {selectedExerciseRows.length === 0 ? (
                    <div className="rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-3 text-sm text-[var(--admin-dashboard-card-muted)]">
                      No exercises selected.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <SheetFooter className="border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-4 sm:flex-row sm:justify-end">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-[12px] min-h-[40px]"
                  onClick={() => handleAssignMuscleGroupSheetOpenChange(false)}
                  disabled={isAssigningMuscleGroup}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
                  disabled={!assignMuscleGroupId || selectedExerciseCount === 0 || isAssigningMuscleGroup}
                  onClick={handleConfirmAssignMuscleGroup}
                >
                  {isAssigningMuscleGroup ? 'Assigning...' : 'Assign muscle group'}
                </Button>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={isAssignEquipmentSheetOpen} onOpenChange={handleAssignEquipmentSheetOpenChange}>
        <SheetContent side="right" className="admin-shell-exercises-assign-equipment-sheet border-l border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] !max-w-[var(--container-lg)]">
          <div className="flex h-full flex-col">
            <SheetHeader className="border-b border-[color:var(--admin-dashboard-card-border)] px-6 py-5 text-left">
              <SheetTitle>Assign equipment</SheetTitle>
              <SheetDescription>Choose the equipment needed for the selected exercises.</SheetDescription>
            </SheetHeader>
            <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <div className="rounded-[20px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--admin-dashboard-card-muted)]">Selected exercises</p>
                <p className="mt-2 text-2xl font-semibold text-[var(--admin-dashboard-card-text)]">
                  {selectedExerciseCount} exercise{selectedExerciseCount === 1 ? '' : 's'}
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]" htmlFor="assign-exercise-equipment">
                  Equipment needed
                </label>
                <MultiCombobox
                  id="assign-exercise-equipment"
                  className="admin-shell-exercise-combobox admin-shell-exercises-assign-equipment-combobox"
                  placeholder="Choose equipment..."
                  searchPlaceholder="Search equipment..."
                  maxVisibleBadges={3}
                  options={editorEquipmentOptions}
                  selectedValues={assignEquipmentIds}
                  onSelectedValuesChange={setAssignEquipmentIds}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">Assignment preview</p>
                  <p className="text-xs text-[var(--admin-dashboard-card-muted)]">Selected exercises will use this equipment list.</p>
                </div>
                <div className="space-y-2">
                  {selectedExerciseRows.map((exercise) => (
                    <div key={exercise.id} className="rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-3">
                      <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{exercise.name}</p>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs text-[var(--admin-dashboard-card-muted)]">
                        <span>Current: {Array.isArray(exercise.equipmentNeeded) && exercise.equipmentNeeded.length > 0 ? exercise.equipmentNeeded.join(', ') : exercise.equipment || 'Unassigned'}</span>
                        {Array.isArray(exercise.muscleNames) && exercise.muscleNames.length > 0 ? <span>{exercise.muscleNames.join(', ')}</span> : null}
                      </div>
                    </div>
                  ))}
                  {selectedExerciseRows.length === 0 ? (
                    <div className="rounded-[16px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] p-3 text-sm text-[var(--admin-dashboard-card-muted)]">
                      No exercises selected.
                    </div>
                  ) : null}
                </div>
              </div>
              {assignEquipmentError ? (
                <div className="rounded-[14px] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-300">
                  {assignEquipmentError}
                </div>
              ) : null}
            </div>
            <SheetFooter className="border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-4 sm:flex-row sm:justify-end">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-[12px] min-h-[40px]"
                  onClick={() => handleAssignEquipmentSheetOpenChange(false)}
                  disabled={isAssigningEquipment}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]"
                  disabled={assignEquipmentIds.length === 0 || selectedExerciseCount === 0 || isAssigningEquipment}
                  onClick={handleConfirmAssignEquipment}
                >
                  {isAssigningEquipment ? 'Assigning...' : 'Assign equipment'}
                </Button>
              </div>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>

      <ExerciseArchiveDialog
        open={isArchiveExerciseDialogOpen}
        onOpenChange={handleArchiveExerciseDialogOpenChange}
        exercises={archiveExercisesToReview}
        eligibleCount={archiveEligibleExercises.length}
        skippedCount={archiveSkippedExercises.length}
        isArchiving={isArchivingExercises}
        message={archiveExerciseMessage}
        onConfirm={handleConfirmArchiveExercises}
      />

      <ExerciseDeleteDialog
        open={isExerciseDeleteDialogOpen}
        onOpenChange={handleDeleteExerciseDialogOpenChange}
        exercises={exerciseDeleteDialogItems}
        exerciseName={exercisePendingDelete?.name || ''}
        isDeleting={isDeletingExercise}
        errorMessage={exerciseDeleteError}
        onConfirmDelete={handleDeleteExercise}
      />

      <div className="admin-shell-athletes-pagination-bar flex flex-wrap items-center justify-end gap-3 py-4 text-sm">
        <span>Rows per page</span>
        <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="admin-shell-athletes-page-size-select h-9 w-[76px] rounded-[10px] px-3 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((pageSizeOption) => (
              <SelectItem key={pageSizeOption} value={String(pageSizeOption)}>
                {pageSizeOption}
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
                <span
                  key={pageItem.key}
                  className="flex h-9 min-w-9 items-center justify-center px-1 text-sm text-[var(--admin-shell-muted)]"
                  aria-hidden="true"
                >
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
