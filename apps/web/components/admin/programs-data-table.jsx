'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { parseAsJson, useQueryState } from 'nuqs'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, CircleAlert, CircleCheckBig, LoaderCircle, MoreHorizontal, Plus, Trash2, X } from 'lucide-react'

import { Filters } from '@/components/reui/filters'
import { useToast } from '@/hooks/use-toast'
import Badge from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Checkbox from '@/components/ui/checkbox'
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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '@/components/ui/item'
import { Input } from '@/components/ui/input'
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

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function createProgramFormValues(program = {}) {
  return {
    athleteIds: Array.isArray(program.athleteIds)
      ? program.athleteIds.filter(Boolean)
      : program.athleteId
        ? [program.athleteId]
        : [],
    name: program.name ?? '',
    weeks: program.duration?.split(' ')?.[0] ?? '',
    startDate: program.startDate ?? '',
    endDate: program.endDate ?? '',
    description: program.description ?? '',
  }
}


function normalizeProgramFilterValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function parseProgramDateValue(value) {
  if (!value) return null
  const parsedDate = new Date(`${value}T12:00:00Z`)
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate.getTime()
}

function parseProgramMetricValue(value) {
  if (value === null || value === undefined || value === '') return null
  const normalized = Number(String(value).replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(normalized) ? normalized : null
}

const programFilterRangeInputClassName = 'h-8 w-28 !border-0 bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] shadow-none placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:!border-0 focus-visible:ring-0'
const programFilterRangeSeparatorClassName = 'text-xs text-[var(--admin-dashboard-card-muted)]'

function ProgramRangeFilterValue({
  values = [],
  onChange = () => {},
  operator = 'between',
  type = 'number',
  startPlaceholder = 'Min',
  endPlaceholder = 'Max',
}) {
  const [firstValue = '', secondValue = ''] = values
  const singleValuePlaceholder = operator === 'before' ? 'Before' : operator === 'after' ? 'After' : operator === 'greater_than' ? 'Min' : operator === 'less_than' ? 'Max' : 'Value'

  if (operator === 'between') {
    return (
      <div className="flex items-center gap-2">
        <Input
          type={type}
          value={firstValue}
          onChange={(event) => onChange([event.target.value, secondValue])}
          placeholder={startPlaceholder}
          className={programFilterRangeInputClassName}
        />
        <span className={programFilterRangeSeparatorClassName}>to</span>
        <Input
          type={type}
          value={secondValue}
          onChange={(event) => onChange([firstValue, event.target.value])}
          placeholder={endPlaceholder}
          className={programFilterRangeInputClassName}
        />
      </div>
    )
  }

  return (
    <Input
      type={type}
      value={firstValue}
      onChange={(event) => onChange([event.target.value])}
      placeholder={singleValuePlaceholder}
      className={programFilterRangeInputClassName}
    />
  )
}

const programFilterFields = [
  {
    key: 'status',
    label: 'Status',
    field: 'status',
    type: 'select',
    defaultOperator: 'is',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
      { value: 'draft', label: 'Draft' },
      { value: 'unknown', label: 'Unknown' },
    ],
  },
  {
    key: 'programType',
    label: 'Program type',
    field: 'programType',
    type: 'select',
    defaultOperator: 'is',
    options: [
      { value: 'assigned', label: 'Assigned' },
      { value: 'unassigned', label: 'Unassigned' },
    ],
  },
  {
    key: 'createdDate',
    label: 'Created date',
    field: 'createdDate',
    type: 'custom',
    defaultOperator: 'between',
    operators: [
      { value: 'between', label: 'between' },
      { value: 'before', label: 'before' },
      { value: 'after', label: 'after' },
      { value: 'empty', label: 'is empty' },
      { value: 'not_empty', label: 'is not empty' },
    ],
    customRenderer: ({ values, onChange, operator }) => (
      <ProgramRangeFilterValue values={values} onChange={onChange} operator={operator} type="date" startPlaceholder="Start date" endPlaceholder="End date" />
    ),
  },
  {
    key: 'startDate',
    label: 'Start date',
    field: 'startDate',
    type: 'custom',
    defaultOperator: 'between',
    operators: [
      { value: 'between', label: 'between' },
      { value: 'before', label: 'before' },
      { value: 'after', label: 'after' },
      { value: 'empty', label: 'is empty' },
      { value: 'not_empty', label: 'is not empty' },
    ],
    customRenderer: ({ values, onChange, operator }) => (
      <ProgramRangeFilterValue values={values} onChange={onChange} operator={operator} type="date" startPlaceholder="Start date" endPlaceholder="End date" />
    ),
  },
  {
    key: 'endDate',
    label: 'End date',
    field: 'endDate',
    type: 'custom',
    defaultOperator: 'between',
    operators: [
      { value: 'between', label: 'between' },
      { value: 'before', label: 'before' },
      { value: 'after', label: 'after' },
      { value: 'empty', label: 'is empty' },
      { value: 'not_empty', label: 'is not empty' },
    ],
    customRenderer: ({ values, onChange, operator }) => (
      <ProgramRangeFilterValue values={values} onChange={onChange} operator={operator} type="date" startPlaceholder="Start date" endPlaceholder="End date" />
    ),
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
      <ProgramRangeFilterValue values={values} onChange={onChange} operator={operator} startPlaceholder="Min weeks" endPlaceholder="Max weeks" />
    ),
  },
]

function programMatchesFilter(program, filter) {
  if (!filter?.field) return true

  const values = Array.isArray(filter.values) ? filter.values : []
  const primaryValue = values[0]
  const secondaryValue = values[1]

  switch (filter.field) {
    case 'status': {
      const programStatus = normalizeProgramFilterValue(program.status)
      if (filter.operator === 'empty') return !program.status
      if (filter.operator === 'not_empty') return Boolean(program.status)
      const selectedStatus = normalizeProgramFilterValue(primaryValue)
      if (!selectedStatus) return true
      if (filter.operator === 'is_not') return programStatus != selectedStatus
      return programStatus == selectedStatus
    }
    case 'programType': {
      const programType = normalizeProgramFilterValue(program.programType)
      if (filter.operator === 'empty') return !program.programType
      if (filter.operator === 'not_empty') return Boolean(program.programType)
      const selectedType = normalizeProgramFilterValue(primaryValue)
      if (!selectedType) return true
      if (filter.operator === 'is_not') return programType != selectedType
      return programType == selectedType
    }
    case 'createdDate':
    case 'startDate':
    case 'endDate': {
      const programDate = parseProgramDateValue(program[filter.field])
      const startDate = parseProgramDateValue(primaryValue)
      const endDate = parseProgramDateValue(secondaryValue)
      if (filter.operator === 'empty') return !program[filter.field]
      if (filter.operator === 'not_empty') return Boolean(program[filter.field])
      if (!programDate) return false
      if (filter.operator === 'before') return startDate ? programDate < startDate : true
      if (filter.operator === 'after') return startDate ? programDate > startDate : true
      if (startDate && endDate) return programDate >= startDate && programDate <= endDate
      if (startDate) return programDate >= startDate
      if (endDate) return programDate <= endDate
      return true
    }
    case 'duration': {
      const durationValue = parseProgramMetricValue(program.duration)
      const minDuration = parseProgramMetricValue(primaryValue)
      const maxDuration = parseProgramMetricValue(secondaryValue)
      if (filter.operator === 'empty') return !program.duration || program.duration === '-'
      if (filter.operator === 'not_empty') return Boolean(program.duration && program.duration !== '-')
      if (durationValue === null) return false
      if (filter.operator === 'greater_than') return minDuration === null ? true : durationValue > minDuration
      if (filter.operator === 'less_than') return minDuration === null ? true : durationValue < minDuration
      if (minDuration !== null && maxDuration !== null) return durationValue >= minDuration && durationValue <= maxDuration
      if (minDuration !== null) return durationValue >= minDuration
      if (maxDuration !== null) return durationValue <= maxDuration
      return true
    }
    default:
      return true
  }
}

function programMatchesFilters(program, filters) {
  return filters.every((filter) => programMatchesFilter(program, filter))
}

function ProgramCell({ programId, name, athletesLabel }) {
  return (
    <div className="admin-shell-athletes-name-copy">
      <Link href={`/admin/programs/${programId}`} className="admin-shell-athletes-name-text transition hover:text-[#3BE0AF]">
        {name}
      </Link>
      <span className="admin-shell-athletes-name-meta">{athletesLabel}</span>
    </div>
  )
}

function StatusCell({ status }) {
  const tone = status === 'Archived' ? 'danger' : status === 'Draft' || status === 'Unknown' ? 'warning' : 'success'
  const className =
    status === 'Archived'
      ? 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-inactive normal-case tracking-normal'
      : status === 'Draft' || status === 'Unknown'
        ? 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-pending normal-case tracking-normal'
        : 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-active normal-case tracking-normal'

  return (
    <Badge tone={tone} className={className}>
      {status}
    </Badge>
  )
}

function RowActionsCell({
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
        <DropdownMenuItem
          onSelect={() => {
            onEditAction()
            onOpenChange(false)
          }}
        >
          Edit
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ProgramsDataTable({ searchQuery = '' }) {
  const { toastManager } = useToast()
  const [programs, setPrograms] = useState([])
  const [athleteOptions, setAthleteOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [programFilters, setProgramFilters] = useQueryState(
    'filters',
    parseAsJson((value) => (Array.isArray(value) ? value : [])).withDefault([]),
  )
  const [isCreateProgramDialogOpen, setIsCreateProgramDialogOpen] = useState(false)
  const [programToast, setProgramToast] = useState(null)
  const [programDialogMode, setProgramDialogMode] = useState('create')
  const [activeProgramDialogTab, setActiveProgramDialogTab] = useState('details')
  const [selectedProgramId, setSelectedProgramId] = useState(null)
  const [programFormValues, setProgramFormValues] = useState(() => createProgramFormValues())
  const [isSavingProgram, setIsSavingProgram] = useState(false)
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [pendingRowAction, setPendingRowAction] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  function openCreateProgramDialog() {
    setProgramDialogMode('create')
    setActiveProgramDialogTab('details')
    setSelectedProgramId(null)
    setProgramFormValues(createProgramFormValues())
    setIsCreateProgramDialogOpen(true)
  }

  function dismissProgramToast() {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('pplus-program-toast')
    }
    setProgramToast(null)
  }

  function queueProgramToast(toastInput) {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem('pplus-program-toast', JSON.stringify(toastInput))
  }

  function flushQueuedProgramToast() {
    if (typeof window === 'undefined') return
    const queuedToast = window.sessionStorage.getItem('pplus-program-toast')
    if (!queuedToast) return

    window.sessionStorage.removeItem('pplus-program-toast')

    try {
      const parsedToast = JSON.parse(queuedToast)
      if (parsedToast?.title) {
        showProgramToast(parsedToast)
      }
    } catch {
      window.sessionStorage.removeItem('pplus-program-toast')
    }
  }

  function showProgramToast({ title = 'Notice', description = '', variant = 'info', duration }) {
    setProgramToast({
      id: `program-toast-${Date.now()}`,
      title,
      description,
      variant,
      duration: typeof duration === 'number' ? duration : variant === 'loading' ? 0 : 4500,
    })
  }

  function openEditProgramDialog(programId) {
    const selectedProgram = programs.find((program) => program.id === programId)

    if (!selectedProgram) {
      return
    }

    setProgramDialogMode('edit')
    setActiveProgramDialogTab('details')
    setSelectedProgramId(programId)
    setProgramFormValues(createProgramFormValues(selectedProgram))
    setIsCreateProgramDialogOpen(true)
  }

  function upsertProgram(nextProgram) {
    if (!nextProgram?.id) return

    setPrograms((current) => {
      const existingIndex = current.findIndex((program) => program.id === nextProgram.id)
      if (existingIndex === -1) {
        return [...current, nextProgram]
      }

      const nextPrograms = current.slice()
      nextPrograms[existingIndex] = nextProgram
      return nextPrograms
    })
  }

  async function handleSaveProgram() {
    const payload = {
      athleteIds: programFormValues.athleteIds,
      name: programFormValues.name,
      weeks: programFormValues.weeks,
      startDate: programFormValues.startDate,
      endDate: programFormValues.endDate,
      description: programFormValues.description,
    }
    const isEditingProgram = programDialogMode === 'edit'

    setIsSavingProgram(true)
    setError('')

    const loadingToastId = toastManager.show({
      title: isEditingProgram ? 'Saving program...' : 'Creating program...',
      variant: 'loading',
      duration: 0,
      data: { close: true },
    })
    showProgramToast({
      title: isEditingProgram ? 'Saving program...' : 'Creating program...',
      variant: 'loading',
      duration: 0,
    })

    try {
      const response = await fetch('/api/admin/programs', {
        method: isEditingProgram ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(isEditingProgram ? { id: selectedProgramId, ...payload } : payload),
      })
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || `Failed to ${isEditingProgram ? 'update' : 'create'} program.`)
      }

      const nextProgram = result?.program ?? null
      if (!nextProgram?.id) {
        throw new Error('Program save did not return a valid program.')
      }

      const successToast = {
        title: isEditingProgram ? 'Program updated' : 'Program created',
        description: isEditingProgram
          ? `Saved changes to ${nextProgram?.name || 'this program'}.`
          : `Created ${nextProgram?.name || 'this program'} and opened it for further editing.`,
        variant: 'success',
        data: { close: true },
      }

      toastManager.dismiss(loadingToastId)
      dismissProgramToast()

      upsertProgram(nextProgram)
      setSelectedProgramId(nextProgram.id)
      setProgramFormValues(createProgramFormValues(nextProgram))
      setRefreshKey((current) => current + 1)

      if (isEditingProgram) {
        setIsCreateProgramDialogOpen(false)
      } else {
        setProgramDialogMode('edit')
        setActiveProgramDialogTab('details')
      }

      queueProgramToast(successToast)
      showProgramToast(successToast)
      window.setTimeout(() => {
        toastManager.show(successToast)
      }, 0)
    } catch (saveError) {
      const errorToast = {
        title: isEditingProgram ? 'Failed to save program' : 'Failed to create program',
        description: saveError?.message || (isEditingProgram ? 'We could not save this program right now.' : 'We could not create this program right now.'),
        variant: 'error',
        duration: 6000,
        data: { close: true },
      }

      toastManager.dismiss(loadingToastId)
      dismissProgramToast()
      queueProgramToast(errorToast)
      showProgramToast(errorToast)
      window.setTimeout(() => {
        toastManager.show(errorToast)
      }, 0)
      setError(saveError?.message || 'Failed to save program.')
    } finally {
      setIsSavingProgram(false)
    }
  }

  function handleSelectProgramAthlete(athleteId) {
    const nextAthleteId = String(athleteId ?? '').trim()
    if (!nextAthleteId) return

    setError('')
    setProgramFormValues((current) => ({
      ...current,
      athleteIds: [nextAthleteId],
    }))
  }

  function handleClearProgramAthlete() {
    setError('')
    setProgramFormValues((current) => ({
      ...current,
      athleteIds: [],
    }))
  }

  useEffect(() => {
    let cancelled = false

    async function loadPrograms() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/admin/programs', {
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load programs.')
        }

        if (!cancelled) {
          setPrograms(Array.isArray(payload?.programs) ? payload.programs : [])
          setAthleteOptions(Array.isArray(payload?.athleteOptions) ? payload.athleteOptions : [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setPrograms([])
          setAthleteOptions([])
          setError(loadError?.message || 'Failed to load programs.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadPrograms()

    return () => {
      cancelled = true
    }
  }, [refreshKey])

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
        header: 'Program',
        meta: { label: 'Program' },
        cell: ({ row }) => <ProgramCell programId={row.original.id} name={row.original.name} athletesLabel={row.original.athletesLabel} />,
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        meta: { label: 'Duration' },
      },
      {
        accessorKey: 'workouts',
        header: 'Workouts',
        meta: { label: 'Workouts' },
      },
      {
        accessorKey: 'exercises',
        header: 'Exercises',
        meta: { label: 'Exercises' },
      },
      {
        accessorKey: 'createdDate',
        header: 'Created date',
        meta: { label: 'Created date' },
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
            onEditAction={() => setPendingRowAction({ type: 'edit', programId: row.original.id })}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openRowActionMenuId],
  )

  const selectedProgram = useMemo(() => programs.find((program) => program.id === selectedProgramId) ?? null, [programs, selectedProgramId])
  const isProgramPersisted = programDialogMode === 'edit' && Boolean(selectedProgramId)

  const filteredPrograms = useMemo(() => {
    const normalizedFilters = Array.isArray(programFilters) ? programFilters : []
    return programs.filter((program) => programMatchesFilters(program, normalizedFilters))
  }, [programFilters, programs])

  const table = useReactTable({
    data: filteredPrograms,
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
  }, [programFilters, searchQuery])

  useEffect(() => {
    flushQueuedProgramToast()
  }, [])

  useEffect(() => {
    if (!programToast?.id || !programToast.duration || programToast.duration <= 0) return undefined

    const timeoutId = window.setTimeout(() => {
      dismissProgramToast()
    }, programToast.duration)

    return () => window.clearTimeout(timeoutId)
  }, [programToast])

  useEffect(() => {
    if (openRowActionMenuId || !pendingRowAction) return

    if (pendingRowAction.type === 'edit') {
      openEditProgramDialog(pendingRowAction.programId)
    }

    setPendingRowAction(null)
  }, [openRowActionMenuId, pendingRowAction])

  const emptyStateMessage = error || (programFilters.length > 0 ? 'No programs match the current filters.' : 'No programs found.')
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
            onClick={openCreateProgramDialog}
            className="admin-shell-athletes-invite-button self-start rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] md:self-auto"
          >
            Create a program
          </Button>
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-2">
          <Filters
            filters={programFilters}
            fields={programFilterFields}
            onChange={setProgramFilters}
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

      {programToast ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[120] flex justify-end px-4 pb-4 sm:px-6 sm:pb-6">
          <div className="flex w-full max-w-[420px] flex-col gap-3">
            <div
              className={[
                'pointer-events-auto flex w-full items-start gap-3 rounded-[16px] border px-4 py-3 text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)] transition-all duration-200',
                programToast.variant === 'loading'
                  ? 'border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)]'
                  : programToast.variant === 'success'
                    ? 'border-[var(--admin-shell-accent)] bg-[var(--admin-dashboard-card-bg)]'
                    : 'border-red-200 bg-[var(--admin-dashboard-card-bg)]',
              ].join(' ')}
            >
              <div className="mt-0.5 shrink-0">
                {programToast.variant === 'loading' ? (
                  <LoaderCircle className="size-4 animate-spin text-[var(--admin-dashboard-card-muted)]" />
                ) : programToast.variant === 'success' ? (
                  <CircleCheckBig className="size-4 text-[var(--admin-shell-accent)]" />
                ) : (
                  <CircleAlert className="size-4 text-[#F87171]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--admin-dashboard-card-text)]">{programToast.title}</p>
                {programToast.description ? <p className="mt-1 text-sm leading-5 text-[var(--admin-dashboard-card-muted)]">{programToast.description}</p> : null}
              </div>
              <button
                type="button"
                className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[var(--admin-dashboard-card-muted)] transition-colors hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
                onClick={dismissProgramToast}
                aria-label="Dismiss toast"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog
        open={isCreateProgramDialogOpen}
        onOpenChange={(isOpen) => {
          setIsCreateProgramDialogOpen(isOpen)

          if (!isOpen) {
            setPendingRowAction(null)
            setProgramDialogMode('create')
            setSelectedProgramId(null)
            setActiveProgramDialogTab('details')
            setProgramFormValues(createProgramFormValues())
          }
        }}
      >
        <DialogContent
          pageScrollable
          className="admin-shell-athletes-invite-dialog border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)] sm:max-w-[720px]"
        >
          <div className="shrink-0 border-b border-[var(--admin-dashboard-card-border)] px-6 py-5">
            <DialogHeader>
              <DialogTitle>{programDialogMode === 'edit' ? 'Edit program' : 'Create a program'}</DialogTitle>
              <DialogDescription>
                {programDialogMode === 'edit'
                  ? `Update ${programFormValues.name || selectedProgramId || 'this program'} with the schedule details below.`
                  : 'Set up a coach-managed program with the core schedule details below.'}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-6 py-6">
            <Tabs
              value={activeProgramDialogTab}
              onValueChange={(nextTab) => {
                if (!isProgramPersisted && nextTab === 'athletes') return
                setActiveProgramDialogTab(nextTab)
              }}
              className="grid gap-5 admin-shell-athletes-create-tabs"
            >
              {isProgramPersisted ? (
                <TabsList className="admin-shell-program-dialog-tabs-list">
                  <TabsTrigger value="details" className="admin-shell-program-dialog-tabs-trigger">Details</TabsTrigger>
                  <TabsTrigger value="athletes" className="admin-shell-program-dialog-tabs-trigger">Athletes</TabsTrigger>
                </TabsList>
              ) : null}

              <TabsContent value="details" className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor="create-program-name">
                      Name
                    </label>
                    <input
                      id="create-program-name"
                      type="text"
                      value={programFormValues.name}
                      onChange={(event) => setProgramFormValues((current) => ({ ...current, name: event.target.value }))}
                      className="h-11 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] outline-none placeholder:text-[var(--admin-dashboard-card-muted)] focus:border-[var(--admin-shell-accent)]"
                      placeholder="Enter program name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor="create-program-weeks">
                      Weeks
                    </label>
                    <input
                      id="create-program-weeks"
                      type="number"
                      min="1"
                      value={programFormValues.weeks}
                      onChange={(event) => setProgramFormValues((current) => ({ ...current, weeks: event.target.value }))}
                      disabled={isProgramPersisted}
                      className="h-11 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] outline-none placeholder:text-[var(--admin-dashboard-card-muted)] focus:border-[var(--admin-shell-accent)] disabled:cursor-not-allowed disabled:opacity-60"
                      placeholder="Enter total weeks"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor="create-program-start-date">
                      Start date
                    </label>
                    <input
                      id="create-program-start-date"
                      type="date"
                      value={programFormValues.startDate}
                      onChange={(event) => setProgramFormValues((current) => ({ ...current, startDate: event.target.value }))}
                      className="h-11 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] outline-none focus:border-[var(--admin-shell-accent)]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor="create-program-end-date">
                      End date
                    </label>
                    <input
                      id="create-program-end-date"
                      type="date"
                      value={programFormValues.endDate}
                      onChange={(event) => setProgramFormValues((current) => ({ ...current, endDate: event.target.value }))}
                      className="h-11 rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] outline-none focus:border-[var(--admin-shell-accent)]"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor="create-program-description">
                    Description
                  </label>
                  <Textarea
                    id="create-program-description"
                    value={programFormValues.description}
                    onChange={(event) => setProgramFormValues((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-[140px] rounded-[12px] border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[var(--admin-shell-accent)] focus-visible:ring-[var(--admin-shell-accent)]/20"
                    placeholder="Add a short description for this program"
                  />
                </div>
              </TabsContent>

              <TabsContent value="athletes" className="grid gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--admin-dashboard-card-text)]">Athlete assignment</p>
                  <p className="text-sm text-[var(--admin-dashboard-card-muted)]">Select one athlete from the real athlete list, or leave this program unassigned.</p>
                  <p className="text-xs text-[var(--admin-dashboard-card-muted)]">{programFormValues.athleteIds.length === 1 ? '1 athlete assigned' : 'No athlete assigned'}</p>
                </div>

                <ItemGroup className="gap-0">
                  {athleteOptions.map((athlete, index) => {
                    const isSelectedAthlete = programFormValues.athleteIds.includes(athlete.id)

                    return (
                      <div key={athlete.id}>
                        <Item className="rounded-none px-0 py-3 text-[var(--admin-dashboard-card-text)] shadow-none transition-colors hover:bg-transparent">
                          <ItemMedia>
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-shell-avatar-bg)] text-sm font-semibold text-[var(--admin-dashboard-card-text)]">
                              {getInitials(athlete.name)}
                            </div>
                          </ItemMedia>
                          <ItemContent className="gap-1">
                            <ItemTitle className="text-[var(--admin-dashboard-card-text)]">{athlete.name}</ItemTitle>
                            <ItemDescription className="text-[var(--admin-dashboard-card-muted)]">{isSelectedAthlete ? 'Added to program' : 'Available to add'}</ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (isSelectedAthlete) {
                                  handleClearProgramAthlete()
                                  return
                                }
                                handleSelectProgramAthlete(athlete.id)
                              }}
                              className="h-9 w-9 rounded-full border border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
                            >
                              {isSelectedAthlete ? <Trash2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                              <span className="sr-only">{isSelectedAthlete ? 'Clear athlete assignment' : 'Assign athlete to program'}</span>
                            </Button>
                          </ItemActions>
                        </Item>
                        {index != athleteOptions.length - 1 ? <ItemSeparator className="bg-[var(--admin-dashboard-card-border)]" /> : null}
                      </div>
                    )
                  })}
                </ItemGroup>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="border-t border-[var(--admin-dashboard-card-border)] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-dashboard-control-hover-bg)] hover:text-[var(--admin-dashboard-card-text)]"
              onClick={() => setIsCreateProgramDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSavingProgram}
              onClick={() => {
                void handleSaveProgram()
              }}
              className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingProgram ? (programDialogMode === 'edit' ? 'Saving...' : 'Creating...') : programDialogMode === 'edit' ? 'Save changes' : 'Create'}
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
                <TableRow key={`skeleton-${rowIndex}`} className={rowIndex % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}>
                  <TableCell>
                    <Skeleton className="h-4 w-4 rounded-[4px]" />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[160px]" />
                      <Skeleton className="h-3 w-[112px]" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[72px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[72px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[72px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[88px]" />
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
                <TableCell colSpan={columns.length} className="admin-shell-athletes-empty-state h-24 text-center">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="admin-shell-athletes-pagination-bar flex items-center justify-end gap-3 py-4 text-sm">
        <span>Rows per page</span>
        <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="h-9 w-[76px] rounded-[10px] !border-[var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-3 text-sm text-[var(--admin-dashboard-card-text)]">
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
            className={`admin-shell-athletes-example-pagination-button ${pagination.pageIndex === pageNumber ? 'admin-shell-athletes-example-pagination-button-active' : ''}`}
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
