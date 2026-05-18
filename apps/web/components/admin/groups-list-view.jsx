'use client'

import { useState } from 'react'

import {
  ArrowUpAZ,
  ArrowUpZA,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Search,
} from 'lucide-react'

import AdminButton from './ui/admin-button'

const groupRows = [
  { id: 'group-1', checked: true, name: 'Group 1', athletesLabel: '7 athletes', access: 'Public', createdDate: '5/17/2026', status: 'Active' },
  { id: 'group-2', checked: true, name: 'Groupe 2', athletesLabel: '7 athletes', access: 'Private', createdDate: '5/17/2026', status: 'Active' },
  { id: 'group-3', checked: true, name: 'Groupe 3', athletesLabel: '7 athletes', access: 'Public', createdDate: '5/17/2026', status: 'Active' },
  { id: 'group-4', checked: true, name: 'Groupe 4', athletesLabel: '7 athletes', access: 'Public', createdDate: '5/17/2026', status: 'Active' },
  { id: 'group-5', checked: true, name: 'Groupe 5', athletesLabel: '7 athletes', access: 'Public', createdDate: '5/17/2026', status: 'Active' },
  { id: 'group-6', checked: false, name: 'Groupe 6', athletesLabel: '7 athletes', access: 'Public', createdDate: '5/17/2026', status: 'Active' },
  { id: 'group-7', checked: false, name: 'Groupe 7', athletesLabel: '7 athletes', access: 'Private', createdDate: '5/17/2026', status: 'Active' },
  { id: 'group-8', checked: false, name: 'Groupe 8', athletesLabel: '7 athletes', access: 'Private', createdDate: '5/17/2026', status: 'Active' },
  { id: 'group-9', checked: false, name: 'Groupe 9', athletesLabel: '7 athletes', access: 'Private', createdDate: '5/17/2026', status: 'Active' },
  { id: 'group-10', checked: false, name: 'Groupe 10', athletesLabel: '7 athletes', access: 'Private', createdDate: '5/17/2026', status: 'Active' },
]

const sortIconMap = {
  ascending: ArrowUpAZ,
  descending: ArrowUpZA,
}

function SortLabel({ children }) {
  const [sortDirection, setSortDirection] = useState('ascending')
  const SortIcon = sortIconMap[sortDirection]

  function toggleSortDirection() {
    setSortDirection((currentDirection) => (currentDirection === 'ascending' ? 'descending' : 'ascending'))
  }

  return (
    <span className="admin-shell-groups-sort-label">
      <button type="button" className="admin-shell-groups-sort-button" aria-label={`Sort ${children} ${sortDirection}`} onClick={toggleSortDirection}>
        <span>{children}</span>
        <SortIcon className="admin-shell-groups-sort-icon" aria-hidden="true" />
      </button>
    </span>
  )
}

function GroupStatusBadge({ status }) {
  return (
    <span className="admin-shell-groups-status-badge">
      <span className="admin-shell-groups-status-dot" aria-hidden="true" />
      {status}
    </span>
  )
}

export default function GroupsListView() {
  return (
    <section className="admin-shell-groups-view" aria-label="Athlete groups admin view">
      <div className="admin-shell-groups-toolbar">
        <h1 className="admin-shell-groups-page-title">Groups</h1>

        <div className="admin-shell-groups-toolbar-actions">
          <label className="admin-shell-groups-top-search" aria-label="Search for a group by name">
            <Search className="admin-shell-groups-top-search-icon" aria-hidden="true" />
            <input type="text" readOnly value="" placeholder="Search for a group by name..." />
          </label>

          <AdminButton
            type="button"
            variant="primary"
            size="default"
            className="admin-shell-groups-create-button"
            leadingIcon={<Plus className="admin-shell-groups-create-button-icon" aria-hidden="true" />}
          >
            Create a group
          </AdminButton>
        </div>
      </div>

      <section className="admin-shell-groups-table-card" aria-label="Groups table card">
        <div className="admin-shell-groups-table-shell">
          <table className="admin-shell-groups-table">
            <thead>
              <tr>
                <th className="admin-shell-groups-checkbox-cell">
                  <input type="checkbox" readOnly aria-label="Select all groups" />
                </th>
                <th>
                  <SortLabel>Group name</SortLabel>
                </th>
                <th>
                  <SortLabel>Access</SortLabel>
                </th>
                <th>
                  <SortLabel>Created date</SortLabel>
                </th>
                <th>
                  <SortLabel>Status</SortLabel>
                </th>
                <th className="admin-shell-groups-actions-cell" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {groupRows.map((group, index) => (
                <tr key={group.id} className={index % 2 === 0 ? 'admin-shell-groups-row-even' : 'admin-shell-groups-row-odd'}>
                  <td className="admin-shell-groups-checkbox-cell">
                    <input type="checkbox" readOnly checked={group.checked} aria-label={`Select ${group.name}`} />
                  </td>
                  <td>
                    <span className="admin-shell-groups-name-copy">
                      <span className="admin-shell-groups-name-text">{group.name}</span>
                      <span className="admin-shell-groups-name-meta">{group.athletesLabel}</span>
                    </span>
                  </td>
                  <td>
                    <button type="button" className="admin-shell-groups-access-chip" aria-label={`Access for ${group.name}`}>
                      <span>{group.access}</span>
                      <ChevronDown className="admin-shell-groups-access-chip-icon" aria-hidden="true" />
                    </button>
                  </td>
                  <td className="admin-shell-groups-created-date-cell">{group.createdDate}</td>
                  <td>
                    <GroupStatusBadge status={group.status} />
                  </td>
                  <td className="admin-shell-groups-actions-cell">
                    <button type="button" className="admin-shell-groups-row-menu" aria-label={`Open actions for ${group.name}`}>
                      <MoreHorizontal className="admin-shell-groups-row-menu-icon" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-shell-groups-pagination">
        <span className="admin-shell-groups-pagination-count">1 - 10 of 256</span>

        <div className="admin-shell-groups-pagination-controls">
          <span className="admin-shell-groups-pagination-label">Rows per page:</span>
          <button type="button" className="admin-shell-groups-rows-button">
            <span>10</span>
            <ChevronDown className="admin-shell-groups-rows-button-icon" aria-hidden="true" />
          </button>
          <button type="button" className="admin-shell-groups-pagination-arrow" aria-label="Previous page">
            <ChevronLeft className="admin-shell-groups-pagination-arrow-icon" aria-hidden="true" />
          </button>
          <button type="button" className="admin-shell-groups-pagination-arrow" aria-label="Next page">
            <ChevronRight className="admin-shell-groups-pagination-arrow-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
