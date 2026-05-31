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

import WorkoutEditorDialog from '@/components/admin/workout-editor-dialog'
import { Filters } from '@/components/reui/filters'
import Badge from '@/components/ui/badge'
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

function StatusCell({ status }) {
  return (
    <Badge tone="success" className="normal-case tracking-normal">
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
        <DropdownMenuLabel>Workout actions</DropdownMenuLabel>
        <DropdownMenuItem onSelect={() => { onEditAction(); onOpenChange(false) }}>Open workout</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { onDuplicateAction(); onOpenChange(false) }}>Duplicate workout</DropdownMenuItem>
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
  const [workoutEditorMessage, setWorkoutEditorMessage] = useState('')
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const saveDisclaimer = 'No workout template save endpoint is wired yet. This view displays real workout template data and opens the shared editor without pretending to persist unsupported create, edit, duplicate, or archive actions.'

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

  function openCreateWorkoutDialog() {
    setOpenRowActionMenuId(null)
    setWorkoutDialogMode('create')
    setSelectedWorkoutId(null)
    setWorkoutTrainingSections([])
    setWorkoutFormValues(createWorkoutFormValues())
    setWorkoutEditorMessage('Create is not saved yet because the current workout template API only exposes listing.')
    setIsCreateWorkoutDialogOpen(true)
  }

  function openEditWorkoutDialog(workout) {
    if (!workout) return

    setOpenRowActionMenuId(null)
    setWorkoutDialogMode('edit')
    setSelectedWorkoutId(workout.id)
    setWorkoutTrainingSections([])
    setWorkoutFormValues(createWorkoutFormValues(workout))
    setWorkoutEditorMessage('Edits are not saved yet because no workout template detail or save endpoint is wired in this app.')
    setIsCreateWorkoutDialogOpen(true)
  }

  function openDuplicateWorkoutDialog(workout) {
    if (!workout) return

    setOpenRowActionMenuId(null)
    setWorkoutDialogMode('duplicate')
    setSelectedWorkoutId(workout.id)
    setWorkoutTrainingSections([])
    setWorkoutFormValues(createWorkoutFormValues(workout))
    setWorkoutEditorMessage('Duplicate is not saved yet because no workout template creation endpoint is wired in this app.')
    setIsCreateWorkoutDialogOpen(true)
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

  useEffect(() => {
    let isMounted = true

    async function loadWorkouts() {
      setLoading(true)
      setError('')

      try {
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

        if (isMounted) {
          setWorkoutsData(nextWorkouts)
        }
      } catch (loadError) {
        if (isMounted) {
          setWorkoutsData([])
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
          <Button
            type="button"
            onClick={openCreateWorkoutDialog}
            className="admin-shell-athletes-invite-button self-start rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d] md:self-auto"
          >
            Create workout
          </Button>
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
        title={workoutDialogMode === 'edit' ? 'Open workout' : workoutDialogMode === 'duplicate' ? 'Duplicate workout' : 'Create workout'}
        description={
          workoutDialogMode === 'edit'
            ? `Review ${workoutFormValues.name || selectedWorkoutId || 'this workout'} below.`
            : workoutDialogMode === 'duplicate'
              ? `Prepare a copy of ${workoutFormValues.name || selectedWorkoutId || 'this workout'} below.`
              : 'Prepare a new workout template below.'
        }
        detailsValues={workoutFormValues}
        onDetailsChange={setWorkoutFormValues}
        trainingSections={workoutTrainingSections}
        onTrainingSectionsChange={setWorkoutTrainingSections}
        showTrainingTab={workoutDialogMode !== 'create'}
        primaryActionLabel={workoutDialogMode === 'edit' ? 'Save changes' : workoutDialogMode === 'duplicate' ? 'Create copy' : 'Create'}
        onPrimaryAction={null}
        focusAreaOptions={focusAreaOptions}
        statusOptions={statusOptions}
        saveDisclaimer={saveDisclaimer}
        errorMessage={workoutEditorMessage}
      />

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
