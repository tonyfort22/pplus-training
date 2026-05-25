'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, MoreHorizontal, PlusIcon } from 'lucide-react'

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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Textarea from '@/components/ui/textarea'

const programAthleteCandidates = [
  {
    id: 'program-athlete-01',
    name: 'Mason Lee',
    detail: 'Speed Development · Active',
  },
  {
    id: 'program-athlete-02',
    name: 'Noah Smith',
    detail: 'Off-Season Strength · Active',
  },
  {
    id: 'program-athlete-03',
    name: 'Ethan Carter',
    detail: 'Preseason Ramp-Up · Needs review',
  },
]

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
    name: program.name ?? '',
    weeks: program.duration?.split(' ')?.[0] ?? '',
    startDate: program.startDate ?? '',
    endDate: program.endDate ?? '',
    description: program.description ?? '',
  }
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
  return (
    <Badge tone="success" className="border-transparent bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 normal-case tracking-normal">
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
        <DropdownMenuItem>Assign</DropdownMenuItem>
        <DropdownMenuItem>Archive</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ProgramsDataTable({ searchQuery = '' }) {
  const [programs, setPrograms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreateProgramDialogOpen, setIsCreateProgramDialogOpen] = useState(false)
  const [programDialogMode, setProgramDialogMode] = useState('create')
  const [selectedProgramId, setSelectedProgramId] = useState(null)
  const [programFormValues, setProgramFormValues] = useState(() => createProgramFormValues())
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
    setSelectedProgramId(null)
    setProgramFormValues(createProgramFormValues())
    setIsCreateProgramDialogOpen(true)
  }

  function openEditProgramDialog(programId) {
    const selectedProgram = programs.find((program) => program.id === programId)

    if (!selectedProgram) {
      return
    }

    setProgramDialogMode('edit')
    setSelectedProgramId(programId)
    setProgramFormValues(createProgramFormValues(selectedProgram))
    setIsCreateProgramDialogOpen(true)
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
        }
      } catch (loadError) {
        if (!cancelled) {
          setPrograms([])
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

  const table = useReactTable({
    data: programs,
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
    if (openRowActionMenuId || !pendingRowAction) return

    if (pendingRowAction.type === 'edit') {
      openEditProgramDialog(pendingRowAction.programId)
    }

    setPendingRowAction(null)
  }, [openRowActionMenuId, pendingRowAction])

  const emptyStateMessage = loading
    ? 'Loading programs...'
    : error || 'No programs found.'

  return (
    <div className="admin-shell-athletes-table-example">
      <div className="admin-shell-athletes-example-controls flex items-center justify-between gap-3">
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
          className="admin-shell-athletes-invite-button bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d] rounded-[12px] min-h-[40px]"
        >
          Create a program
        </Button>
      </div>

      <Dialog
        open={isCreateProgramDialogOpen}
        onOpenChange={(isOpen) => {
          setIsCreateProgramDialogOpen(isOpen)

          if (!isOpen) {
            setPendingRowAction(null)
          }
        }}
      >
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[720px]">
          <div className="border-b border-[#24334A] px-6 py-5">
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
            <Tabs defaultValue="details" className="grid gap-5">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="athletes">Athletes</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="grid gap-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#DCE6F8]" htmlFor="create-program-name">
                      Name
                    </label>
                    <input
                      id="create-program-name"
                      type="text"
                      value={programFormValues.name}
                      onChange={(event) => setProgramFormValues((current) => ({ ...current, name: event.target.value }))}
                      className="h-11 rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] outline-none placeholder:text-[#70809E] focus:border-[#3BE0AF]"
                      placeholder="Enter program name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#DCE6F8]" htmlFor="create-program-weeks">
                      Weeks
                    </label>
                    <input
                      id="create-program-weeks"
                      type="number"
                      min="1"
                      value={programFormValues.weeks}
                      onChange={(event) => setProgramFormValues((current) => ({ ...current, weeks: event.target.value }))}
                      className="h-11 rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] outline-none placeholder:text-[#70809E] focus:border-[#3BE0AF]"
                      placeholder="Enter total weeks"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#DCE6F8]" htmlFor="create-program-start-date">
                      Start date
                    </label>
                    <input
                      id="create-program-start-date"
                      type="date"
                      value={programFormValues.startDate}
                      onChange={(event) => setProgramFormValues((current) => ({ ...current, startDate: event.target.value }))}
                      className="h-11 rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] outline-none focus:border-[#3BE0AF]"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-[#DCE6F8]" htmlFor="create-program-end-date">
                      End date
                    </label>
                    <input
                      id="create-program-end-date"
                      type="date"
                      value={programFormValues.endDate}
                      onChange={(event) => setProgramFormValues((current) => ({ ...current, endDate: event.target.value }))}
                      className="h-11 rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] outline-none focus:border-[#3BE0AF]"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-[#DCE6F8]" htmlFor="create-program-description">
                    Description
                  </label>
                  <Textarea
                    id="create-program-description"
                    value={programFormValues.description}
                    onChange={(event) => setProgramFormValues((current) => ({ ...current, description: event.target.value }))}
                    className="min-h-[140px] rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 py-3 text-sm text-[#DCE6F8] placeholder:text-[#70809E] focus-visible:border-[#3BE0AF] focus-visible:ring-[#3BE0AF]/20"
                    placeholder="Add a short description for this program"
                  />
                </div>
              </TabsContent>

              <TabsContent value="athletes" className="grid gap-3">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[#DCE6F8]">Athletes</p>
                  <p className="text-sm text-[#8EA0BC]">Add athletes to this program using the shared item-group pattern.</p>
                </div>

                <ItemGroup className="gap-0">
                  {programAthleteCandidates.map((athlete, index) => (
                    <div key={athlete.id}>
                      <Item className="rounded-none px-0 py-3 text-[#DCE6F8] shadow-none transition-colors hover:bg-transparent">
                        <ItemMedia>
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2B3D57] bg-[#162235] text-sm font-semibold text-[#EEF4FF]">
                            {getInitials(athlete.name)}
                          </div>
                        </ItemMedia>
                        <ItemContent className="gap-1">
                          <ItemTitle className="text-[#EEF4FF]">{athlete.name}</ItemTitle>
                          <ItemDescription className="text-[#8EA0BC]">{athlete.detail}</ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-full border border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
                          >
                            <PlusIcon className="h-4 w-4" />
                            <span className="sr-only">Add athlete to program</span>
                          </Button>
                        </ItemActions>
                      </Item>
                      {index !== programAthleteCandidates.length - 1 ? <ItemSeparator className="bg-[#24334A]" /> : null}
                    </div>
                  ))}
                </ItemGroup>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="border-t border-[#24334A] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => setIsCreateProgramDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]"
            >
              {programDialogMode === 'edit' ? 'Save changes' : 'Create'}
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
            {table.getRowModel().rows?.length ? (
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

      <div className="flex items-center justify-between py-4 text-sm text-[#8EA0BC]">
        <div>{table.getFilteredRowModel().rows.length} program(s)</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
