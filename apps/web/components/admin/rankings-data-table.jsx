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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function RankCell({ rank, badgeSrc = '' }) {
  if (badgeSrc) {
    return <img src={badgeSrc} alt={`Rank ${rank}`} className="admin-shell-rankings-rank-badge-image" />
  }

  return <span className="admin-shell-rankings-rank-number">{rank}</span>
}

function NameCell({ name, ageLabel, avatarUrl = '' }) {
  return (
    <div className="admin-shell-athletes-name-cell">
      <Avatar alt={name} className="admin-shell-athletes-avatar" initials={getInitials(name)} src={avatarUrl || undefined} />
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
        <span className="admin-shell-athletes-workouts-label">{workoutsCompleted}/{workoutsTarget}</span>
        <span className="admin-shell-athletes-workouts-percent">{workoutsPercentage}%</span>
      </div>
      <Progress className="admin-shell-athletes-workouts-progress" value={workoutsPercentage} />
    </div>
  )
}

function StatusCell({ status }) {
  const tone = status === 'Inactive' ? 'danger' : status === 'Active' ? 'success' : 'warning'
  const className =
    status === 'Inactive'
      ? 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-inactive normal-case tracking-normal'
      : status === 'Active'
        ? 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-active normal-case tracking-normal'
        : 'admin-shell-athletes-status-badge admin-shell-athletes-status-badge-pending normal-case tracking-normal'

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
        <DropdownMenuItem>Review workout progress</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function RankingsDataTable({ searchQuery = '' }) {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rowSelection, setRowSelection] = useState({})
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  useEffect(() => {
    let cancelled = false

    async function loadRankings() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch('/api/admin/rankings', {
          cache: 'no-store',
        })
        const payload = await response.json()

        if (!response.ok) {
          throw new Error(payload?.error || 'Failed to load rankings.')
        }

        if (!cancelled) {
          setRankings(Array.isArray(payload?.rankings) ? payload.rankings : [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setRankings([])
          setError(loadError?.message || 'Failed to load rankings.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRankings()

    return () => {
      cancelled = true
    }
  }, [])

  const columns = useMemo(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            className="admin-shell-athletes-checkbox-input"
            checked={table.getIsAllPageRowsSelected()}
            onChange={(event) => table.toggleAllPageRowsSelected(event.target.checked)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            className="admin-shell-athletes-checkbox-input"
            checked={row.getIsSelected()}
            onChange={(event) => row.toggleSelected(event.target.checked)}
            aria-label="Select row"
          />
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
        cell: ({ row }) => <NameCell name={row.original.name} ageLabel={row.original.ageLabel} avatarUrl={row.original.avatarUrl} />,
      },
      {
        accessorKey: 'program',
        header: 'Program',
        meta: { label: 'Program' },
        cell: ({ row }) => <span className="admin-shell-athletes-program-cell">{row.original.program}</span>,
      },
      {
        accessorKey: 'workoutsPercentage',
        header: 'Workout progress',
        meta: { label: 'Workout progress' },
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

  const emptyStateMessage = error || (searchQuery ? 'No athletes match the current ranking search.' : 'No ranked athletes found.')
  const pageSizeOptions = [5, 10, 20, 30]
  const totalRows = table.getFilteredRowModel().rows.length
  const pageStart = totalRows === 0 ? 0 : pagination.pageIndex * pagination.pageSize + 1
  const pageEnd = Math.min((pagination.pageIndex + 1) * pagination.pageSize, totalRows)
  const pageNumbers = Array.from({ length: table.getPageCount() }, (_, index) => index)
  const skeletonRows = Array.from({ length: pagination.pageSize }, (_, rowIndex) => rowIndex)

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
                <TableRow key={`skeleton-${rowIndex}`} className={rowIndex % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}>
                  <TableCell><Skeleton className="h-4 w-4 rounded-[4px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[140px]" />
                        <Skeleton className="h-3 w-[96px]" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[84px]" />
                      <Skeleton className="h-2 w-[132px] rounded-full" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-[88px]" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-[132px] rounded-full" /></TableCell>
                  <TableCell className="admin-shell-athletes-actions-cell"><Skeleton className="ml-auto h-8 w-8 rounded-full" /></TableCell>
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

      <div className="admin-shell-athletes-pagination-bar flex items-center justify-end gap-3 py-4 text-sm">
        <span>Rows per page</span>
        <Select value={String(pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
          <SelectTrigger className="h-9 w-[76px] rounded-[10px] px-3 text-sm">
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
