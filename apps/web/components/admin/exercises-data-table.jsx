'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, MoreHorizontal, Plus } from 'lucide-react'
import { parseAsJson, useQueryState } from 'nuqs'

import ExerciseEditorDialog from '@/components/admin/exercise-editor-dialog'
import { Filters } from '@/components/reui/filters'
import Avatar from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import Checkbox from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function formatExerciseSetsLabel(totalSetCount = 0) {
  const normalizedCount = Number.isFinite(totalSetCount) ? totalSetCount : 0
  return `${normalizedCount} set${normalizedCount === 1 ? '' : 's'}`
}

function ExerciseCell({ name, thumbnailUrl = '', totalSetCount = 0 }) {
  return (
    <div className="admin-shell-athletes-name-cell">
      <Avatar alt={name} className="admin-shell-athletes-avatar" initials={name} src={thumbnailUrl} />
      <div className="admin-shell-athletes-name-copy">
        <span className="admin-shell-athletes-name-text">{name}</span>
        <span className="admin-shell-athletes-name-meta">{formatExerciseSetsLabel(totalSetCount)}</span>
      </div>
    </div>
  )
}

function RowActionsCell({
  rowId,
  isOpen = false,
  onOpenChange = () => {},
  onEditAction = () => {},
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
        <DropdownMenuItem onSelect={() => onOpenChange(false)}>Delete</DropdownMenuItem>
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
    sets: normalizedExercise.totalSetCount ? String(normalizedExercise.totalSetCount) : '',
    reps: '',
    distance: '',
    weights: '',
    duration: '',
    rest: normalizedExercise.rest && normalizedExercise.rest !== '-' ? String(normalizedExercise.rest) : '',
    tempo: '',
    category: normalizedExercise.category || '',
    difficulty: normalizedExercise.difficulty || '',
    status: 'draft',
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
      const equipmentValue = normalizeExerciseFilterValue(exercise.equipment)

      if (filter.operator === 'empty') return !equipmentValue
      if (filter.operator === 'not_empty') return Boolean(equipmentValue)
      if (selectedValues.length === 0) return true

      const hasMatch = selectedValues.includes(equipmentValue)
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
    'filters',
    parseAsJson((value) => (Array.isArray(value) ? value : [])).withDefault([]),
  )
  const [isExerciseEditorOpen, setIsExerciseEditorOpen] = useState(false)
  const [exerciseEditorMode, setExerciseEditorMode] = useState('create')
  const [exerciseFormValues, setExerciseFormValues] = useState(() => createExerciseFormValues())
  const [exerciseEditorError, setExerciseEditorError] = useState('')
  const [isSavingExercise, setIsSavingExercise] = useState(false)
  const [exerciseThumbnailUrls, setExerciseThumbnailUrls] = useState({})
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const saveDisclaimer = 'V1 saves real exercise fields: name, description, difficulty, category as stimulus type, the first equipment value as default equipment, primary/secondary muscle roles, thumbnail upload, and video upload.'

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
        cell: ({ row }) => <RowActionsCell rowId={row.original.id} isOpen={openRowActionMenuId === row.original.id} onOpenChange={(isOpen) => setOpenRowActionMenuId(isOpen ? row.original.id : null)} onEditAction={() => openEditExerciseDialog(row.original)} />,
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
    () => buildSelectFilterOptions(exercises.map((exercise) => exercise.equipment)),
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

          <Button
            type="button"
            className="admin-shell-athletes-invite-button self-start rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d] md:self-auto"
            onClick={openCreateExerciseDialog}
          >
            Create exercise
          </Button>
        </div>

        <div className="flex w-full flex-wrap items-center justify-start gap-2">
          <Filters
            filters={Array.isArray(exerciseFilters) ? exerciseFilters : []}
            fields={exerciseFilterFields}
            onChange={setExerciseFilters}
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

      <div className="admin-shell-athletes-table-shell">
        <Table className="admin-shell-athletes-table">
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
        saveDisclaimer={saveDisclaimer}
        onThumbnailFileChange={handleThumbnailFileChange}
        onVideoFileChange={handleVideoFileChange}
        onPrimaryAction={handleExerciseEditorSubmit}
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
