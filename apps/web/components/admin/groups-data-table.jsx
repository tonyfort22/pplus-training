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

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import Textarea from '@/components/ui/textarea'
import { Filters } from '@/components/reui/filters'

function getAthleteInitials(name = '') {
  const initials = String(name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
  return initials || 'PP'
}

function GroupAvatarStack({ athletes = [] }) {
  const visibleAthletes = Array.isArray(athletes) ? athletes.slice(0, 4) : []
  const overflowCount = Array.isArray(athletes) && athletes.length > visibleAthletes.length ? athletes.length - visibleAthletes.length : 0

  if (!visibleAthletes.length) {
    return (
      <div className="flex -space-x-2" aria-label="No athlete memberships yet">
        <Avatar className="size-8 border-2 border-[var(--admin-dashboard-card-bg)] bg-[var(--admin-dashboard-card-soft)] text-[10px] text-[var(--admin-dashboard-card-muted)]">
          <AvatarFallback>--</AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div className="flex -space-x-2" aria-label={`${athletes.length} group athlete${athletes.length === 1 ? '' : 's'}`}>
      {visibleAthletes.map((athlete) => (
        <Avatar key={athlete.id || athlete.name} className="size-8 border-2 border-[var(--admin-dashboard-card-bg)] bg-[var(--admin-dashboard-card-soft)] text-[10px] text-[var(--admin-dashboard-card-text)] hover:z-10">
          <AvatarImage src={athlete.avatarUrl} alt={athlete.name} className="border-2 border-[var(--admin-dashboard-card-bg)] hover:z-10" />
          <AvatarFallback>{getAthleteInitials(athlete.name)}</AvatarFallback>
        </Avatar>
      ))}
      {overflowCount ? (
        <span className="relative inline-flex size-8 items-center justify-center rounded-full border-2 border-[var(--admin-dashboard-card-bg)] bg-[var(--admin-dashboard-card-muted)] text-[10px] font-semibold text-[var(--admin-dashboard-card-bg)] hover:z-10">
          +{overflowCount}
        </span>
      ) : null}
    </div>
  )
}

function GroupCell({ name, athletes = [], description = '' }) {
  return (
    <div className="admin-shell-athletes-name-copy gap-2">
      <span className="admin-shell-athletes-name-text">{name}</span>
      <GroupAvatarStack athletes={athletes} />
      {description ? <span className="line-clamp-2 text-xs text-[var(--admin-dashboard-card-soft)]">{description}</span> : null}
    </div>
  )
}

function AccessCell({ access }) {
  return (
    <Badge tone="neutral" className="admin-shell-groups-access-badge normal-case tracking-normal">
      {access}
    </Badge>
  )
}

function StatusCell({ status }) {
  const isArchived = status === 'Archived'
  return (
    <Badge
      tone={isArchived ? 'warning' : 'success'}
      className={
        isArchived
          ? 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-pending normal-case tracking-normal'
          : 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-active normal-case tracking-normal'
      }
    >
      {status}
    </Badge>
  )
}

function GroupDialogField({ htmlFor, label, children }) {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-[var(--admin-dashboard-card-text)]" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  )
}

function RowActionsCell({
  status = 'Active',
  isOpen = false,
  onOpenChange = () => {},
  onEditAction = () => {},
  onAssignProgramAction = () => {},
  onArchiveAction = () => {},
  onUnarchiveAction = () => {},
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
        <DropdownMenuItem onSelect={() => { onAssignProgramAction(); onOpenChange(false) }}>Assign program</DropdownMenuItem>
        {status === 'Archived' ? (
          <DropdownMenuItem onSelect={() => { onUnarchiveAction(); onOpenChange(false) }}>Unarchive</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => { onArchiveAction(); onOpenChange(false) }}>Archive</DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={() => { onDeleteAction(); onOpenChange(false) }}>Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function createGroupFormValues(group = null) {
  return {
    name: group?.name ?? '',
    description: group?.description ?? '',
    accessLevel: group?.accessLevel ?? 'private',
    athleteIds: Array.isArray(group?.athleteIds) ? group.athleteIds : [],
  }
}

function normalizeGroupFilterValue(value) {
  return String(value ?? '').trim().toLowerCase()
}

function parseGroupAthleteCount(value) {
  if (value === null || value === undefined || value === '') return null
  const normalizedValue = Number(value)
  return Number.isFinite(normalizedValue) ? normalizedValue : null
}

const groupFilterRangeInputClassName = 'h-8 w-28 !border-0 bg-[var(--admin-dashboard-card-bg)] text-[var(--admin-dashboard-card-text)] shadow-none placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:!border-0 focus-visible:ring-0'
const groupFilterRangeSeparatorClassName = 'text-xs text-[var(--admin-dashboard-card-muted)]'

function GroupRangeFilterValue({ values = [], onChange = () => {}, operator = 'between' }) {
  const [firstValue = '', secondValue = ''] = values
  const singleValuePlaceholder = operator === 'greater_than' ? 'Min' : operator === 'less_than' ? 'Max' : 'Value'

  if (operator === 'between') {
    return (
      <div className="flex items-center gap-2">
        <Input type="number" value={firstValue} onChange={(event) => onChange([event.target.value, secondValue])} placeholder="Min" className={groupFilterRangeInputClassName} />
        <span className={groupFilterRangeSeparatorClassName}>to</span>
        <Input type="number" value={secondValue} onChange={(event) => onChange([firstValue, event.target.value])} placeholder="Max" className={groupFilterRangeInputClassName} />
      </div>
    )
  }

  return <Input type="number" value={firstValue} onChange={(event) => onChange([event.target.value])} placeholder={singleValuePlaceholder} className={groupFilterRangeInputClassName} />
}

const groupFilterFields = [
  {
    key: 'status',
    label: 'Status',
    field: 'status',
    type: 'select',
    defaultOperator: 'is',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'archived', label: 'Archived' },
    ],
  },
  {
    key: 'access',
    label: 'Access',
    field: 'access',
    type: 'select',
    defaultOperator: 'is',
    options: [
      { value: 'private', label: 'Private' },
      { value: 'public', label: 'Public' },
    ],
  },
  {
    key: 'athleteCount',
    label: 'Athlete count',
    field: 'athleteCount',
    type: 'custom',
    defaultOperator: 'between',
    operators: [
      { value: 'between', label: 'between' },
      { value: 'greater_than', label: 'greater than' },
      { value: 'less_than', label: 'less than' },
      { value: 'empty', label: 'is empty' },
      { value: 'not_empty', label: 'is not empty' },
    ],
    customRenderer: ({ values, onChange, operator }) => <GroupRangeFilterValue values={values} onChange={onChange} operator={operator} />,
  },
]

function groupMatchesFilter(group, filter) {
  if (!filter?.field) return true
  const values = Array.isArray(filter.values) ? filter.values : []
  const primaryValue = values[0]
  const secondaryValue = values[1]

  switch (filter.field) {
    case 'status': {
      const groupStatus = normalizeGroupFilterValue(group.statusValue || group.status)
      if (filter.operator === 'empty') return !group.statusValue && !group.status
      if (filter.operator === 'not_empty') return Boolean(group.statusValue || group.status)
      const selectedStatus = normalizeGroupFilterValue(primaryValue)
      if (!selectedStatus) return true
      if (filter.operator === 'is_not') return groupStatus !== selectedStatus
      return groupStatus === selectedStatus
    }
    case 'access': {
      const groupAccess = normalizeGroupFilterValue(group.accessLevel || group.access)
      if (filter.operator === 'empty') return !group.accessLevel && !group.access
      if (filter.operator === 'not_empty') return Boolean(group.accessLevel || group.access)
      const selectedAccess = normalizeGroupFilterValue(primaryValue)
      if (!selectedAccess) return true
      if (filter.operator === 'is_not') return groupAccess !== selectedAccess
      return groupAccess === selectedAccess
    }
    case 'athleteCount': {
      const groupAthleteCount = parseGroupAthleteCount(group.athleteCount)
      const minCount = parseGroupAthleteCount(primaryValue)
      const maxCount = parseGroupAthleteCount(secondaryValue)
      if (filter.operator === 'empty') return group.athleteCount === null || group.athleteCount === undefined
      if (filter.operator === 'not_empty') return group.athleteCount !== null && group.athleteCount !== undefined
      if (groupAthleteCount === null) return false
      if (filter.operator === 'greater_than') return minCount === null ? true : groupAthleteCount > minCount
      if (filter.operator === 'less_than') return minCount === null ? true : groupAthleteCount < minCount
      if (minCount !== null && maxCount !== null) return groupAthleteCount >= minCount && groupAthleteCount <= maxCount
      if (minCount !== null) return groupAthleteCount >= minCount
      if (maxCount !== null) return groupAthleteCount <= maxCount
      return true
    }
    default:
      return true
  }
}

function groupMatchesFilters(group, filters) {
  return filters.every((filter) => groupMatchesFilter(group, filter))
}

export default function GroupsDataTable({ searchQuery = '' }) {
  const [groups, setGroups] = useState([])
  const [athleteOptions, setAthleteOptions] = useState([])
  const [programOptions, setProgramOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateEditGroupDialogOpen, setIsCreateEditGroupDialogOpen] = useState(false)
  const [isArchiveGroupDialogOpen, setIsArchiveGroupDialogOpen] = useState(false)
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false)
  const [isAssignProgramDialogOpen, setIsAssignProgramDialogOpen] = useState(false)
  const [groupDialogMode, setGroupDialogMode] = useState('create')
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [groupFormValues, setGroupFormValues] = useState(() => createGroupFormValues())
  const [isSavingGroup, setIsSavingGroup] = useState(false)
  const [isArchivingGroup, setIsArchivingGroup] = useState(false)
  const [isDeletingGroup, setIsDeletingGroup] = useState(false)
  const [isAssigningProgram, setIsAssigningProgram] = useState(false)
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [pendingRowAction, setPendingRowAction] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [groupFilters, setGroupFilters] = useQueryState(
    'groupFilters',
    parseAsJson((value) => (Array.isArray(value) ? value : [])).withDefault([]),
  )
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  useEffect(() => {
    let cancelled = false
    async function loadGroups() {
      setLoading(true)
      setError('')
      try {
        const response = await fetch('/api/admin/groups', { cache: 'no-store' })
        const payload = await response.json()
        if (!response.ok) throw new Error(payload?.error || 'Failed to load groups.')
        if (!cancelled) {
          setGroups(Array.isArray(payload?.groups) ? payload.groups : [])
          setAthleteOptions(Array.isArray(payload?.athleteOptions) ? payload.athleteOptions : [])
          setProgramOptions(Array.isArray(payload?.programOptions) ? payload.programOptions : [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setGroups([])
          setAthleteOptions([])
          setProgramOptions([])
          setError(loadError?.message || 'Failed to load groups.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadGroups()
    return () => { cancelled = true }
  }, [refreshKey])

  const selectedGroup = useMemo(() => groups.find((group) => group.id === selectedGroupId) ?? null, [groups, selectedGroupId])

  const columns = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <div className="admin-shell-athletes-checkbox-cell">
          <Checkbox className="admin-shell-athletes-checkbox-input" checked={table.getIsAllPageRowsSelected()} onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)} aria-label="Select all" />
        </div>
      ),
      cell: ({ row }) => (
        <div className="admin-shell-athletes-checkbox-cell">
          <Checkbox className="admin-shell-athletes-checkbox-input" checked={row.getIsSelected()} onChange={(event) => row.toggleSelected(event.target.checked)} aria-label="Select row" />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: 'Group',
      meta: { label: 'Group' },
      cell: ({ row }) => <GroupCell name={row.original.name} athletes={row.original.athletes} description={row.original.description} />,
    },
    {
      accessorKey: 'athleteCountLabel',
      header: 'Athletes',
      meta: { label: 'Athletes' },
      cell: ({ row }) => <span className="admin-shell-athletes-program-cell">{row.original.athleteCountLabel}</span>,
    },
    {
      accessorKey: 'access',
      header: 'Access',
      meta: { label: 'Access' },
      cell: ({ row }) => <AccessCell access={row.original.access} />,
    },
    {
      accessorKey: 'updated',
      header: 'Updated',
      meta: { label: 'Updated' },
      cell: ({ row }) => <span className="admin-shell-athletes-last-active-cell">{row.original.updated}</span>,
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
          status={row.original.status}
          isOpen={openRowActionMenuId === row.original.id}
          onOpenChange={(isOpen) => setOpenRowActionMenuId(isOpen ? row.original.id : null)}
          onEditAction={() => setPendingRowAction({ type: 'edit', groupId: row.original.id })}
          onAssignProgramAction={() => setPendingRowAction({ type: 'assign-program', groupId: row.original.id })}
          onArchiveAction={() => setPendingRowAction({ type: 'archive', groupId: row.original.id })}
          onUnarchiveAction={() => setPendingRowAction({ type: 'unarchive', groupId: row.original.id })}
          onDeleteAction={() => setPendingRowAction({ type: 'delete', groupId: row.original.id })}
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ], [openRowActionMenuId])

  const filteredGroups = useMemo(() => {
    const normalizedFilters = Array.isArray(groupFilters) ? groupFilters : []
    return groups.filter((group) => groupMatchesFilters(group, normalizedFilters))
  }, [groupFilters, groups])

  const table = useReactTable({
    data: filteredGroups,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: { rowSelection, columnFilters, columnVisibility, pagination },
  })

  useEffect(() => {
    table.getColumn('name')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  useEffect(() => {
    if (openRowActionMenuId || !pendingRowAction) return
    if (pendingRowAction.type === 'edit') {
      openEditGroupDialog(pendingRowAction.groupId)
    } else if (pendingRowAction.type === 'archive') {
      setSelectedGroupId(pendingRowAction.groupId)
      setIsArchiveGroupDialogOpen(true)
    } else if (pendingRowAction.type === 'unarchive') {
      void handleUnarchiveGroup(pendingRowAction.groupId)
    } else if (pendingRowAction.type === 'delete') {
      setSelectedGroupId(pendingRowAction.groupId)
      setIsDeleteGroupDialogOpen(true)
    } else if (pendingRowAction.type === 'assign-program') {
      setSelectedGroupId(pendingRowAction.groupId)
      setSelectedProgramId('')
      setIsAssignProgramDialogOpen(true)
    }
    setPendingRowAction(null)
  }, [openRowActionMenuId, pendingRowAction])

  function openCreateGroupDialog() {
    setGroupDialogMode('create')
    setSelectedGroupId(null)
    setGroupFormValues(createGroupFormValues())
    setIsCreateEditGroupDialogOpen(true)
  }

  function openEditGroupDialog(groupId) {
    const group = groups.find((item) => item.id === groupId) ?? null
    setGroupDialogMode('edit')
    setSelectedGroupId(groupId)
    setGroupFormValues(createGroupFormValues(group))
    setIsCreateEditGroupDialogOpen(true)
  }

  function updateGroupFormValue(key, value) {
    setGroupFormValues((currentValues) => ({ ...currentValues, [key]: value }))
  }

  function toggleAthleteMembership(athleteId) {
    setGroupFormValues((currentValues) => {
      const hasAthlete = currentValues.athleteIds.includes(athleteId)
      return {
        ...currentValues,
        athleteIds: hasAthlete ? currentValues.athleteIds.filter((currentId) => currentId !== athleteId) : [...currentValues.athleteIds, athleteId],
      }
    })
  }

  async function handleGroupSubmit() {
    setIsSavingGroup(true)
    setError('')
    try {
      const response = await fetch('/api/admin/groups', {
        method: groupDialogMode === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupDialogMode === 'edit' ? { action: 'update', groupId: selectedGroupId, ...groupFormValues } : groupFormValues),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to save group.')
      setIsCreateEditGroupDialogOpen(false)
      setSelectedGroupId(null)
      setGroupDialogMode('create')
      setGroupFormValues(createGroupFormValues())
      setRefreshKey((currentValue) => currentValue + 1)
    } catch (submitError) {
      setError(submitError?.message || 'Failed to save group.')
    } finally {
      setIsSavingGroup(false)
    }
  }

  async function handleArchiveGroup() {
    if (!selectedGroupId) return
    setIsArchivingGroup(true)
    setError('')
    try {
      const response = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', groupId: selectedGroupId }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to archive group.')
      setIsArchiveGroupDialogOpen(false)
      setSelectedGroupId(null)
      setRefreshKey((currentValue) => currentValue + 1)
    } catch (archiveError) {
      setError(archiveError?.message || 'Failed to archive group.')
    } finally {
      setIsArchivingGroup(false)
    }
  }

  async function handleUnarchiveGroup(groupId = selectedGroupId) {
    if (!groupId) return
    setError('')
    try {
      const response = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unarchive', groupId }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to unarchive group.')
      setSelectedGroupId(null)
      setRefreshKey((currentValue) => currentValue + 1)
    } catch (unarchiveError) {
      setError(unarchiveError?.message || 'Failed to unarchive group.')
    }
  }

  async function handleDeleteGroup() {
    if (!selectedGroupId) return
    setIsDeletingGroup(true)
    setError('')
    try {
      const response = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', groupId: selectedGroupId }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to delete group.')
      setIsDeleteGroupDialogOpen(false)
      setSelectedGroupId(null)
      setRefreshKey((currentValue) => currentValue + 1)
    } catch (deleteError) {
      setError(deleteError?.message || 'Failed to delete group.')
    } finally {
      setIsDeletingGroup(false)
    }
  }

  async function handleAssignProgram() {
    if (!selectedGroupId || !selectedProgramId) return
    setIsAssigningProgram(true)
    setError('')
    try {
      const response = await fetch('/api/admin/groups', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign-program', groupId: selectedGroupId, sourceProgramId: selectedProgramId }),
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload?.error || 'Failed to assign program.')
      setIsAssignProgramDialogOpen(false)
      setSelectedProgramId('')
      setSelectedGroupId(null)
      setRefreshKey((currentValue) => currentValue + 1)
    } catch (assignError) {
      setError(assignError?.message || 'Failed to assign program.')
    } finally {
      setIsAssigningProgram(false)
    }
  }

  const emptyStateMessage = error || (groupFilters.length > 0 ? 'No groups match the current filters.' : 'No groups found.')
  const pageSizeOptions = [5, 10, 20, 30]
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)
  const pageNumbers = Array.from({ length: table.getPageCount() }, (_, index) => index)
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
              {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>
                  {column.columnDef.meta?.label ?? column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" onClick={openCreateGroupDialog} className="admin-shell-athletes-invite-button self-start rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)] md:self-auto">Create group</Button>
        </div>
        <div className="flex w-full flex-wrap items-center justify-start gap-2">
          <Filters
            filters={groupFilters}
            fields={groupFilterFields}
            onChange={setGroupFilters}
            trigger={
              <Button type="button" variant="outline" className="admin-shell-athletes-filter-trigger rounded-[12px] min-h-[40px] shadow-none">
                <Plus className="size-4" />
                Add filter
              </Button>
            }
          />
        </div>
      </div>

      <Dialog open={isCreateEditGroupDialogOpen} onOpenChange={setIsCreateEditGroupDialogOpen}>
        <DialogContent pageScrollable className="admin-shell-athletes-invite-dialog border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)] sm:max-w-[720px]">
          <div className="border-b border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <DialogHeader>
              <DialogTitle>{groupDialogMode === 'edit' ? 'Edit group' : 'Create a group'}</DialogTitle>
              <DialogDescription>{groupDialogMode === 'edit' ? 'Manage memberships, access, and naming for this group.' : 'Create a new coach-managed athlete group.'}</DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-5 px-6 py-6">
            <div className="grid gap-4 md:grid-cols-2">
              <GroupDialogField htmlFor="create-group-name" label="Name">
                <Input id="create-group-name" className="h-11 rounded-[12px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20" placeholder="Off-season forwards" value={groupFormValues.name} onChange={(event) => updateGroupFormValue('name', event.target.value)} />
              </GroupDialogField>
              <GroupDialogField htmlFor="create-group-access-level" label="Access">
                <Select value={groupFormValues.accessLevel} onValueChange={(value) => updateGroupFormValue('accessLevel', value)}>
                  <SelectTrigger id="create-group-access-level" className="h-11 rounded-[12px]"><SelectValue placeholder="Select access" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="public">Public</SelectItem>
                  </SelectContent>
                </Select>
              </GroupDialogField>
            </div>
            <GroupDialogField htmlFor="create-group-description" label="Description">
              <Textarea id="create-group-description" className="min-h-[120px] rounded-[12px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-text)] placeholder:text-[var(--admin-dashboard-card-muted)] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20" placeholder="Optional notes about who belongs in this group." value={groupFormValues.description} onChange={(event) => updateGroupFormValue('description', event.target.value)} />
            </GroupDialogField>
            <div className="grid gap-3">
              <div>
                <h3 className="text-sm font-medium text-[var(--admin-dashboard-card-text)]">Manage memberships</h3>
                <p className="mt-1 text-sm text-[var(--admin-dashboard-card-muted)]">Add or remove athlete memberships for this group.</p>
              </div>
              <div className="max-h-[280px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="grid gap-2">
                  {athleteOptions.length ? athleteOptions.map((athlete) => {
                    const isChecked = groupFormValues.athleteIds.includes(athlete.id)
                    return (
                      <label key={athlete.id} className="flex items-center justify-between gap-3 rounded-[12px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-3 text-sm text-[var(--admin-dashboard-card-text)]">
                        <span>{athlete.name}</span>
                        <Checkbox className="admin-shell-athletes-checkbox-input" checked={isChecked} onChange={() => toggleAthleteMembership(athlete.id)} aria-label={`Toggle ${athlete.name} membership`} />
                      </label>
                    )
                  }) : <div className="rounded-[12px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] px-3 py-4 text-sm text-[var(--admin-dashboard-card-muted)]">No athletes available.</div>}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)]" onClick={() => setIsCreateEditGroupDialogOpen(false)}>Cancel</Button>
            <Button type="button" disabled={isSavingGroup} className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]" onClick={handleGroupSubmit}>{isSavingGroup ? 'Saving...' : groupDialogMode === 'edit' ? 'Save group' : 'Create group'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAssignProgramDialogOpen} onOpenChange={setIsAssignProgramDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)] sm:max-w-[620px]">
          <div className="border-b border-[color:var(--admin-dashboard-card-border)] px-6 py-5">
            <DialogHeader>
              <DialogTitle>Assign program</DialogTitle>
              <DialogDescription>Clone a source program to each athlete in this group as a bulk action.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-5 px-6 py-6">
            <div className="rounded-[12px] border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] px-4 py-3 text-sm text-[var(--admin-dashboard-card-muted)]">
              <div className="font-medium text-[var(--admin-dashboard-card-text)]">{selectedGroup?.name ?? 'Selected group'}</div>
              <div className="mt-3 flex items-center gap-3">
                <GroupAvatarStack athletes={selectedGroup?.athletes ?? []} />
                <span>{selectedGroup?.athleteCountLabel ?? '0 athletes'}</span>
              </div>
            </div>
            <GroupDialogField htmlFor="assign-program-select" label="Program">
              <Select value={selectedProgramId} onValueChange={setSelectedProgramId}>
                <SelectTrigger id="assign-program-select" className="h-11 rounded-[12px]"><SelectValue placeholder="Select a program" /></SelectTrigger>
                <SelectContent>
                  {programOptions.map((program) => <SelectItem key={program.id} value={program.id}>{program.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </GroupDialogField>
          </div>
          <DialogFooter className="border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)]" onClick={() => setIsAssignProgramDialogOpen(false)}>Cancel</Button>
            <Button type="button" disabled={isAssigningProgram || !selectedProgramId} className="rounded-[12px] min-h-[40px] bg-[var(--admin-shell-primary-button-bg)] text-[#0B1120] hover:bg-[var(--admin-shell-primary-button-bg)]" onClick={handleAssignProgram}>{isAssigningProgram ? 'Assigning...' : 'Assign program'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isArchiveGroupDialogOpen} onOpenChange={setIsArchiveGroupDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)] sm:max-w-[560px]">
          <div className="px-6 py-5">
            <DialogHeader>
              <DialogTitle>Archive group</DialogTitle>
              <DialogDescription>Archive this group and remove it from active access.</DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)]" onClick={() => setIsArchiveGroupDialogOpen(false)}>Cancel</Button>
            <Button type="button" disabled={isArchivingGroup} className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500" onClick={handleArchiveGroup}>{isArchivingGroup ? 'Archiving...' : 'Archive group'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-card-bg)] p-0 text-[var(--admin-dashboard-card-text)] shadow-[var(--admin-shell-shadow)] sm:max-w-[560px]">
          <div className="px-6 py-5">
            <DialogHeader>
              <DialogTitle>Delete group</DialogTitle>
              <DialogDescription>Permanently delete this group and remove all memberships.</DialogDescription>
            </DialogHeader>
          </div>
          <DialogFooter className="border-t border-[color:var(--admin-dashboard-card-border)] px-6 py-5 sm:justify-end gap-3">
            <Button type="button" variant="outline" className="rounded-[12px] min-h-[40px] border-[color:var(--admin-dashboard-card-border)] bg-[var(--admin-dashboard-control-bg)] text-[var(--admin-dashboard-card-text)] hover:bg-[var(--admin-shell-nav-active-bg)] hover:text-[var(--admin-shell-nav-active-text)]" onClick={() => setIsDeleteGroupDialogOpen(false)}>Cancel</Button>
            <Button type="button" disabled={isDeletingGroup} className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500" onClick={handleDeleteGroup}>{isDeletingGroup ? 'Deleting...' : 'Delete group'}</Button>
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
            {loading ? skeletonRows.map((rowIndex) => (
              <TableRow key={`skeleton-${rowIndex}`} className={rowIndex % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}>
                <TableCell>
                  <Skeleton className="h-4 w-4 rounded-[4px]" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[140px]" />
                    <Skeleton className="h-3 w-[110px]" />
                    <Skeleton className="h-3 w-[180px]" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[72px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-[88px] rounded-full" />
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
            )) : table.getRowModel().rows?.length ? table.getRowModel().rows.map((row, index) => (
              <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined} className={index % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cell.column.id === 'actions' ? 'admin-shell-athletes-actions-cell' : ''}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                ))}
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={columns.length} className="admin-shell-athletes-empty-state h-24 text-center">{emptyStateMessage}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="admin-shell-athletes-pagination-bar flex items-center justify-end gap-3 py-4 text-sm">
        <span>Rows per page</span>
        <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="admin-shell-athletes-page-size-select h-9 w-[76px] rounded-[10px] px-3 text-sm">
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
