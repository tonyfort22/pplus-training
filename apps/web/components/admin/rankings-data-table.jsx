'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { ChevronDown, MoreHorizontal } from 'lucide-react'

import Avatar from '@/components/ui/avatar'
import Badge from '@/components/ui/badge'
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
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const rankings = [
  { id: 'ranking-01', rank: 1, badgeSrc: '/admin/gold_badge.svg', name: 'Thomas Thibault', ageLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsCompleted: 34, workoutsTarget: 40, workoutsPercentage: 85, lastActive: 'May 17, 2026', status: 'Active' },
  { id: 'ranking-02', rank: 2, badgeSrc: '/admin/silver_badge.svg', name: 'Mason Lee', ageLabel: '1/01/2011 (15 year old)', program: 'Speed Development', workoutsCompleted: 29, workoutsTarget: 40, workoutsPercentage: 72.5, lastActive: 'May 16, 2026', status: 'Active' },
  { id: 'ranking-03', rank: 3, badgeSrc: '/admin/bronze_badget.svg', name: 'Noah Smith', ageLabel: '1/01/2011 (15 year old)', program: 'Off-Season Strength', workoutsCompleted: 28, workoutsTarget: 40, workoutsPercentage: 70, lastActive: 'May 15, 2026', status: 'Watch' },
  { id: 'ranking-04', rank: 4, name: 'Lucas Bennett', ageLabel: '1/01/2011 (15 year old)', program: 'Return to Play', workoutsCompleted: 21, workoutsTarget: 40, workoutsPercentage: 52.5, lastActive: 'May 14, 2026', status: 'Watch' },
  { id: 'ranking-05', rank: 5, name: 'Oliver James', ageLabel: '1/01/2011 (15 year old)', program: 'In-Season Maintenance', workoutsCompleted: 16, workoutsTarget: 40, workoutsPercentage: 40, lastActive: 'May 13, 2026', status: 'Inactive' },
]

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function RankCell({ badgeSrc = '', rank }) {
  return badgeSrc ? (
    <img src={badgeSrc} alt={`Rank ${rank} badge`} className="h-8 w-8 object-contain" />
  ) : (
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#24334A] bg-[#111D30] text-sm font-semibold text-[#DCE6F8]">
      {rank}
    </span>
  )
}

function NameCell({ name, ageLabel }) {
  return (
    <div className="admin-shell-athletes-name-cell">
      <Avatar alt={name} className="admin-shell-athletes-avatar" initials={getInitials(name)} />
      <div className="admin-shell-athletes-name-copy">
        <span className="admin-shell-athletes-name-text">{name}</span>
        <span className="admin-shell-athletes-name-meta">{ageLabel}</span>
      </div>
    </div>
  )
}

function WorkoutsCell({ workoutsCompleted, workoutsTarget, workoutsPercentage }) {
  return (
    <div className="admin-shell-athletes-workouts-cell">
      <div className="admin-shell-athletes-workouts-header">
        <span className="admin-shell-athletes-workouts-label">{workoutsCompleted} / {workoutsTarget}</span>
        <span className="admin-shell-athletes-workouts-percent">{workoutsPercentage}%</span>
      </div>
      <Progress className="admin-shell-athletes-workouts-progress" value={workoutsPercentage} />
    </div>
  )
}

function StatusCell({ status }) {
  const tone = status === 'Active' ? 'success' : status === 'Watch' ? 'warning' : 'danger'
  const className =
    status === 'Active'
      ? 'border-transparent bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20 normal-case tracking-normal'
      : status === 'Watch'
        ? 'border-transparent bg-amber-500/15 text-amber-300 hover:bg-amber-500/20 normal-case tracking-normal'
        : 'border-transparent bg-red-500/15 text-red-300 hover:bg-red-500/20 normal-case tracking-normal'

  return (
    <Badge tone={tone} className={className}>
      {status}
    </Badge>
  )
}

function RowActionsCell() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="admin-shell-athletes-row-menu" aria-label="Open menu">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="admin-shell-athletes-row-menu-icon" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem>View athlete</DropdownMenuItem>
        <DropdownMenuItem>Open program</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Compare ranking</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function RankingsDataTable({ searchQuery = '' }) {
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
        accessorKey: 'rank',
        header: 'Rank',
        meta: { label: 'Rank' },
        cell: ({ row }) => <RankCell rank={row.original.rank} badgeSrc={row.original.badgeSrc} />,
      },
      {
        accessorKey: 'name',
        header: 'Name',
        meta: { label: 'Name' },
        cell: ({ row }) => <NameCell name={row.original.name} ageLabel={row.original.ageLabel} />,
      },
      {
        accessorKey: 'program',
        header: 'Program',
        meta: { label: 'Program' },
        cell: ({ row }) => <span className="admin-shell-athletes-program-cell">{row.original.program}</span>,
      },
      {
        accessorKey: 'workoutsPercentage',
        header: 'Workouts',
        meta: { label: 'Workouts' },
        cell: ({ row }) => (
          <WorkoutsCell
            workoutsCompleted={row.original.workoutsCompleted}
            workoutsTarget={row.original.workoutsTarget}
            workoutsPercentage={row.original.workoutsPercentage}
          />
        ),
      },
      {
        accessorKey: 'lastActive',
        header: 'Last active',
        meta: { label: 'Last active' },
        cell: ({ row }) => <span className="admin-shell-athletes-last-active-cell">{row.original.lastActive}</span>,
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
        cell: () => <RowActionsCell />,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [],
  )

  const table = useReactTable({
    data: rankings,
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
        <Button type="button" variant="outline" className="rounded-[12px] min-h-[40px] border-[#24334A] bg-[#111D30] text-[#DCE6F8] hover:bg-[#15233A]">
          Leaderboard window
        </Button>
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
                  No ranked athletes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4 text-sm text-[#8EA0BC]">
        <div>{table.getFilteredRowModel().rows.length} ranked athlete(s)</div>
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
