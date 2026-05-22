'use client'

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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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

const groups = [
  { id: 'group-01', name: 'Group 1', athletes: '7 athletes', access: 'Public', updated: 'Today, 8:30 AM', status: 'Active' },
  { id: 'group-02', name: 'Groupe 2', athletes: '11 athletes', access: 'Private', updated: 'Yesterday, 4:10 PM', status: 'Active' },
  { id: 'group-03', name: 'Groupe 3', athletes: '9 athletes', access: 'Public', updated: 'May 16, 10:05 AM', status: 'Archived' },
  { id: 'group-04', name: 'Groupe 4', athletes: '14 athletes', access: 'Private', updated: 'May 14, 6:45 PM', status: 'Active' },
  { id: 'group-05', name: 'Groupe 5', athletes: '6 athletes', access: 'Public', updated: 'May 13, 7:20 AM', status: 'Active' },
]

const groupAthleteCandidates = [
  {
    id: 'group-athlete-01',
    name: 'Mason Lee',
    detail: 'Speed Development · Active',
  },
  {
    id: 'group-athlete-02',
    name: 'Noah Smith',
    detail: 'Off-Season Strength · Active',
  },
  {
    id: 'group-athlete-03',
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

function GroupCell({ name, athletes }) {
  return (
    <div className="admin-shell-athletes-name-copy">
      <span className="admin-shell-athletes-name-text">{name}</span>
      <span className="admin-shell-athletes-name-meta">{athletes}</span>
    </div>
  )
}

function AccessCell({ access }) {
  return (
    <Badge tone="neutral" className="border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] normal-case tracking-normal">
      {access}
    </Badge>
  )
}

function StatusCell({ status }) {
  const tone = status === 'Archived' ? 'warning' : 'success'
  const className =
    status === 'Archived'
      ? 'border-transparent bg-amber-500/15 text-amber-300 hover:bg-amber-500/20 normal-case tracking-normal'
      : 'border-transparent bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 normal-case tracking-normal'

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
  onArchiveAction = () => {},
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
            onArchiveAction()
            onOpenChange(false)
          }}
        >
          Archive
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onDeleteAction()
            onOpenChange(false)
          }}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function GroupsDataTable({ searchQuery = '' }) {
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState(false)
  const [isArchiveGroupDialogOpen, setIsArchiveGroupDialogOpen] = useState(false)
  const [isDeleteGroupDialogOpen, setIsDeleteGroupDialogOpen] = useState(false)
  const [openRowActionMenuId, setOpenRowActionMenuId] = useState(null)
  const [pendingRowAction, setPendingRowAction] = useState(null)
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  })

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
        header: 'Group',
        meta: { label: 'Group' },
        cell: ({ row }) => <GroupCell name={row.original.name} athletes={row.original.athletes} />,
      },
      {
        accessorKey: 'athletes',
        header: 'Athletes',
        meta: { label: 'Athletes' },
        cell: ({ row }) => <span className="admin-shell-athletes-program-cell">{row.original.athletes}</span>,
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
            isOpen={openRowActionMenuId === row.original.id}
            onOpenChange={(isOpen) => {
              setOpenRowActionMenuId(isOpen ? row.original.id : null)
            }}
            onEditAction={() => setPendingRowAction({ type: 'edit', groupId: row.original.id })}
            onArchiveAction={() => setPendingRowAction({ type: 'archive', groupId: row.original.id })}
            onDeleteAction={() => setPendingRowAction({ type: 'delete', groupId: row.original.id })}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [openRowActionMenuId],
  )

  const table = useReactTable({
    data: groups,
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
      setIsCreateGroupDialogOpen(true)
    } else if (pendingRowAction.type === 'archive') {
      setIsArchiveGroupDialogOpen(true)
    } else if (pendingRowAction.type === 'delete') {
      setIsDeleteGroupDialogOpen(true)
    }

    setPendingRowAction(null)
  }, [openRowActionMenuId, pendingRowAction])

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
          onClick={() => setIsCreateGroupDialogOpen(true)}
          className="admin-shell-athletes-invite-button bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d] rounded-[12px] min-h-[40px]"
        >
          Create a group
        </Button>
      </div>

      <Dialog open={isCreateGroupDialogOpen} onOpenChange={setIsCreateGroupDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[560px]">
          <div className="border-b border-[#24334A] px-6 py-5">
            <DialogHeader>
              <DialogTitle>Create a group</DialogTitle>
              <DialogDescription>Create a coach-managed group for organizing athletes inside the workspace.</DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 px-6 py-6">
            <div className="grid gap-2">
              <label className="text-sm font-medium text-[#DCE6F8]" htmlFor="create-group-name">
                Name
              </label>
              <input
                id="create-group-name"
                className="h-11 rounded-[12px] border border-[#24334A] bg-[#111D30] px-4 text-sm text-[#DCE6F8] outline-none placeholder:text-[#70809E] focus:border-[#3BE0AF]"
                placeholder="Enter group name"
                type="text"
              />
            </div>

            <div className="grid gap-3">
              <div className="space-y-1">
                <p className="text-sm font-medium text-[#DCE6F8]">Athletes</p>
                <p className="text-sm text-[#8EA0BC]">Add athletes to this group using the shared item-group pattern.</p>
              </div>

              <ItemGroup className="gap-0">
                {groupAthleteCandidates.map((athlete, index) => (
                  <div key={athlete.id}>
                    <Item
                      className="rounded-none px-0 py-3 text-[#DCE6F8] shadow-none transition-colors hover:bg-transparent"
                    >
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
                          <span className="sr-only">Add athlete to group</span>
                        </Button>
                      </ItemActions>
                    </Item>
                    {index !== groupAthleteCandidates.length - 1 ? <ItemSeparator className="bg-[#24334A]" /> : null}
                  </div>
                ))}
              </ItemGroup>
            </div>
          </div>

          <DialogFooter className="border-t border-[#24334A] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => setIsCreateGroupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-[#3BE0AF] text-[#0B1120] hover:bg-[#35c89d]"
            >
              Create group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isArchiveGroupDialogOpen} onOpenChange={setIsArchiveGroupDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[560px]">
          <div className="px-6 py-5">
            <DialogHeader>
              <DialogTitle>Archive group</DialogTitle>
              <DialogDescription>This group will be archived and removed from active group access.</DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="border-t border-[#24334A] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => setIsArchiveGroupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500"
            >
              Archive group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteGroupDialogOpen} onOpenChange={setIsDeleteGroupDialogOpen}>
        <DialogContent className="admin-shell-athletes-invite-dialog border border-[#24334A] bg-[#0F1728] p-0 text-[#DCE6F8] shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:max-w-[560px]">
          <div className="px-6 py-5">
            <DialogHeader>
              <DialogTitle>Delete group</DialogTitle>
              <DialogDescription>This group will be permanently deleted from the groups list.</DialogDescription>
            </DialogHeader>
          </div>

          <DialogFooter className="border-t border-[#24334A] px-6 py-5 sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A] hover:text-[#EEF4FF]"
              onClick={() => setIsDeleteGroupDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="rounded-[12px] min-h-[40px] bg-red-500/90 text-white hover:bg-red-500"
            >
              Delete group
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
            {table.getRowModel().rows?.length ? (
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
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-[#8EA0BC]">
                  No groups found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4 text-sm text-[#8EA0BC]">
        <div>{table.getFilteredRowModel().rows.length} group(s)</div>
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
