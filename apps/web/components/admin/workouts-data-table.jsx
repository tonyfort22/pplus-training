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

import { Filters } from '@/components/reui/filters'
import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Checkbox from '@/components/ui/checkbox'
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import MultiCombobox from '@/components/ui/multi-combobox'
import WorkoutEditorDialog from '@/components/admin/workout-editor-dialog'
import { createInitialTrainingSections } from '@/components/admin/workout-training-builder'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Textarea from '@/components/ui/textarea'

function formatWorkoutDuration(minutes) {
  const parsedMinutes = Number.parseInt(minutes ?? '', 10)
  if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
    return '--'
  }

  return `${parsedMinutes} min`
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
    focusArea: template.training_type ?? '--',
    status: String(template.status ?? 'active').replace(/^./, (value) => value.toUpperCase()),
  }
}

const programOptions = [
  { value: 'program-1', label: 'Program 1' },
  { value: 'program-2', label: 'Program 2' },
  { value: 'program-3', label: 'Program 3' },
]

const trainerOptions = [
  { value: 'thibault', label: 'Thibault' },
  { value: 'anthony', label: 'Anthony' },
  { value: 'mason', label: 'Mason' },
]

const equipmentOptions = [
  { value: 'dumbbells', label: 'Dumbbells' },
  { value: 'sled', label: 'Sled' },
  { value: 'spirit-bike', label: 'Spirit Bike' },
  { value: 'cable', label: 'Cable' },
  { value: 'trap-bar', label: 'Trap Bar' },
  { value: 'stability-ball', label: 'Stability Ball' },
  { value: 'bike', label: 'Bike' },
]

const categoryOptions = [
  { value: 'speed', label: 'Speed' },
  { value: 'conditioning', label: 'Conditioning' },
  { value: 'strength', label: 'Strength' },
]

const difficultyOptions = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

const focusAreaOptions = [
  { value: 'acceleration', label: 'Acceleration' },
  { value: 'edge-work', label: 'Edge Work' },
  { value: 'conditioning', label: 'Conditioning' },
]

function createWorkoutFormValues(selectedWorkout = null) {
  return {
    name: selectedWorkout?.name ?? '',
    duration: selectedWorkout?.duration ?? '',
    thumbnailName: '',
    program: '',
    trainer: '',
    equipmentNeeded: [],
    category: '',
    difficulty: '',
    status: selectedWorkout?.status?.toLowerCase?.() ?? 'active',
    focusArea: selectedWorkout?.focusArea && selectedWorkout.focusArea !== '--' ? selectedWorkout.focusArea.toLowerCase().replace(/\s+/g, '-') : '',
    description: '',
  }
}

function StatusCell({ status }) {
  return (
    <Badge tone="success" className="border-transparent bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 normal-case tracking-normal">
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
    <div className="flex flex-col gap-1">
      <span className="font-medium text-[#EEF4FF]">{workout?.name ?? 'Workout'}</span>
      <span className="text-xs text-[#8EA0BC]">{exerciseCountLabel}</span>
      <span className="text-xs text-[#6F84A6]">{setCountLabel}</span>
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
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onSelect={() => {
            onEditAction()
            onOpenChange(false)
          }}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onDuplicateAction()
            onOpenChange(false)
          }}
        >
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>Archive</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function FieldLabel({ children, htmlFor }) {
  return (
    <label className="text-sm font-medium text-[#DCE6F8]" htmlFor={htmlFor}>
      {children}
    </label>
  )
}

function normalizeWorkoutStatus(status) {
  return String(status ?? '').trim().toLowerCase()
}

function normalizeWorkoutFocusArea(focusArea) {
  return String(focusArea ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
}

function parseWorkoutDurationValue(value) {
  if (value === null || value === undefined) return null

  const match = String(value).match(/\d+(?:\.\d+)?/)
  if (!match) return null

  const parsedValue = Number(match[0])
  return Number.isFinite(parsedValue) ? parsedValue : null
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

  if (operator === 'between') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={firstValue}
          onChange={(event) => onChange([event.target.value, secondValue])}
          placeholder={startPlaceholder}
          className="h-8 w-28 rounded-[10px] !border-0 bg-[#0F1728] px-3 text-sm text-[#DCE6F8] shadow-none outline-none placeholder:text-[#70809E] focus-visible:!border-0 focus-visible:ring-0"
        />
        <span className="text-xs text-[#8EA0BC]">to</span>
        <input
          type="number"
          value={secondValue}
          onChange={(event) => onChange([firstValue, event.target.value])}
          placeholder={endPlaceholder}
          className="h-8 w-28 rounded-[10px] !border-0 bg-[#0F1728] px-3 text-sm text-[#DCE6F8] shadow-none outline-none placeholder:text-[#70809E] focus-visible:!border-0 focus-visible:ring-0"
        />
      </div>
    )
  }

  return (
    <input
      type="number"
      value={firstValue}
      onChange={(event) => onChange([event.target.value])}
      placeholder={singleValuePlaceholder}
      className="h-8 w-28 rounded-[10px] !border-0 bg-[#0F1728] px-3 text-sm text-[#DCE6F8] shadow-none outline-none placeholder:text-[#70809E] focus-visible:!border-0 focus-visible:ring-0"
    />
  )
}

const workoutFilterFields = [
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
    options: [
      { value: 'acceleration', label: 'Acceleration' },
      { value: 'edge-work', label: 'Edge Work' },
      { value: 'conditioning', label: 'Conditioning' },
    ],
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

function workoutMatchesFilter(workout, filter) {
  if (!filter?.field) return true

  const values = Array.isArray(filter.values) ? filter.values : []
  const primaryValue = values[0]
  const secondaryValue = values[1]

  switch (filter.field) {
    case 'status': {
      const workoutStatus = normalizeWorkoutStatus(workout.status)
      if (filter.operator === 'empty') return !workout.status
      if (filter.operator === 'not_empty') return Boolean(workout.status)
      const selectedStatus = normalizeWorkoutStatus(primaryValue)
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
      if (filter.operator === 'empty') return !workout.duration
      if (filter.operator === 'not_empty') return Boolean(workout.duration)
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
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [pendingRowAction, setPendingRowAction] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  })

  function openCreateWorkoutDialog() {
    setWorkoutDialogMode('create')
    setSelectedWorkoutId(null)
    setWorkoutTrainingSections([])
    setWorkoutFormValues(createWorkoutFormValues())
    setIsCreateWorkoutDialogOpen(true)
  }

  function openEditWorkoutDialog(workoutId) {
    const selectedWorkout = workoutsData.find((workout) => workout.id === workoutId)

    if (!selectedWorkout) return

    setWorkoutDialogMode('edit')
    setSelectedWorkoutId(workoutId)
    setWorkoutTrainingSections(createInitialTrainingSections())
    setWorkoutFormValues(createWorkoutFormValues(selectedWorkout))
    setIsCreateWorkoutDialogOpen(true)
  }

  function openDuplicateWorkoutDialog(workoutId) {
    const selectedWorkout = workoutsData.find((workout) => workout.id === workoutId)

    if (!selectedWorkout) return

    setWorkoutDialogMode('duplicate')
    setSelectedWorkoutId(workoutId)
    setWorkoutTrainingSections(createInitialTrainingSections())
    setWorkoutFormValues(createWorkoutFormValues(selectedWorkout))
    setIsCreateWorkoutDialogOpen(true)
  }

  function handleCreateWorkout() {
    const nextWorkoutId = `workout-${Date.now()}`

    setSelectedWorkoutId(nextWorkoutId)
    setWorkoutDialogMode('edit')
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
        header: 'Focus Area',
        meta: { label: 'Focus Area' },
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
            onOpenChange={(isOpen) => {
              setOpenRowActionMenuId(isOpen ? row.original.id : null)
            }}
            onEditAction={() => setPendingRowAction({ type: 'edit', workoutId: row.original.id })}
            onDuplicateAction={() => setPendingRowAction({ type: 'duplicate', workoutId: row.original.id })}
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
        const response = await fetch('/api/admin/workout-templates')
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

  useEffect(() => {
    if (openRowActionMenuId || !pendingRowAction) return

    if (pendingRowAction.type === 'edit') {
      openEditWorkoutDialog(pendingRowAction.workoutId)
    } else if (pendingRowAction.type === 'duplicate') {
      openDuplicateWorkoutDialog(pendingRowAction.workoutId)
    }

    setPendingRowAction(null)
  }, [openRowActionMenuId, pendingRowAction])

  const emptyStateMessage = error || (workoutFilters.length > 0 ? 'No workouts match the current filters.' : 'No workouts found.')
  const pageSizeOptions = [5, 10, 20, 30]
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)
  const pageNumbers = Array.from({ length: table.getPageCount() }, (_, index) => index)
  const skeletonRows = Array.from({ length: pagination.pageSize }, (_, rowIndex) => rowIndex)

  return (
    <div className="admin-shell-athletes-table-example">
      <div className="grid gap-3">
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
            Create a workout
          </Button>
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-2">
          <Filters
            filters={workoutFilters}
            fields={workoutFilterFields}
            onChange={setWorkoutFilters}
            trigger={
              <Button
                type="button"
                variant="outline"
                className="rounded-[12px] min-h-[40px] !border !border-[#24334A] bg-transparent text-[#DCE6F8] shadow-none hover:bg-[#15233A] hover:text-[#EEF4FF]"
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
            setPendingRowAction(null)
            setWorkoutDialogMode('create')
            setSelectedWorkoutId(null)
            setWorkoutTrainingSections([])
            setWorkoutFormValues(createWorkoutFormValues())
          }
        }}
        mode={workoutDialogMode}
        title={workoutDialogMode === 'edit' ? 'Edit workout' : workoutDialogMode === 'duplicate' ? 'Duplicate workout' : 'Workout'}
        description={
          workoutDialogMode === 'edit'
            ? `Update ${workoutFormValues.name || selectedWorkoutId || 'this workout'} below.`
            : workoutDialogMode === 'duplicate'
              ? `Duplicate ${workoutFormValues.name || selectedWorkoutId || 'this workout'} into a new workout.`
              : 'Fill out the information below.'
        }
        detailsValues={workoutFormValues}
        onDetailsChange={setWorkoutFormValues}
        trainingSections={workoutTrainingSections}
        onTrainingSectionsChange={setWorkoutTrainingSections}
        showTrainingTab={workoutDialogMode !== 'create'}
        primaryActionLabel={workoutDialogMode === 'edit' ? 'Save changes' : workoutDialogMode === 'duplicate' ? 'Create copy' : 'Create'}
        onPrimaryAction={workoutDialogMode === 'create' ? handleCreateWorkout : undefined}
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
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-[#8EA0BC]">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end gap-3 py-4 text-sm text-[#8EA0BC]">
        <span>Rows per page</span>
        <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="h-9 w-[76px] rounded-[10px] !border-[#24334A] bg-[#111D30] px-3 text-sm text-[#DCE6F8]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((option) => (
              <SelectItem key={option} value={String(option)}>{option}</SelectItem>
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
          ‹
        </button>
        {pageNumbers.map((pageNumber) => (
          <button
            key={`page-${pageNumber}`}
            type="button"
            className={`admin-shell-athletes-example-pagination-button ${pagination.pageIndex === pageNumber ? 'bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]' : ''}`}
            onClick={() => table.setPageIndex(pageNumber)}
          >
            {pageNumber + 1}
          </button>
        ))}
        <button
          type="button"
          aria-label="Go to next page"
          className="admin-shell-athletes-example-pagination-button"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          ›
        </button>
      </div>
    </div>
  )
}
