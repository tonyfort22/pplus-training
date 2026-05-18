'use client'

import { useState } from 'react'

import {
  ArrowUpAZ,
  ArrowUpZA,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Search,
  Send,
} from 'lucide-react'

import Avatar from '../ui/avatar'
import AdminButton from './ui/admin-button'

const inviteRows = [
  { id: 'invite-1', checked: true, name: 'Thomas Thibault', email: 'thomas@gmail.com', role: 'Athlete', joinDate: '5/17/2026', status: 'Active' },
  { id: 'invite-2', checked: true, name: 'Thomas Thibault', email: 'thomas@gmail.com', role: 'Athlete', joinDate: '5/17/2026', status: 'Pending' },
  { id: 'invite-3', checked: true, name: 'Thomas Thibault', email: 'thomas@gmail.com', role: 'Athlete', joinDate: '5/17/2026', status: 'Active' },
  { id: 'invite-4', checked: true, name: 'Thomas Thibault', email: 'thomas@gmail.com', role: 'Athlete', joinDate: '5/17/2026', status: 'Pending' },
  { id: 'invite-5', checked: true, name: 'Thomas Thibault', email: 'thomas@gmail.com', role: 'Athlete', joinDate: '5/17/2026', status: 'Pending' },
  { id: 'invite-6', checked: false, name: 'Thomas Thibault', email: 'thomas@gmail.com', role: 'Athlete', joinDate: '5/17/2026', status: 'Pending' },
  { id: 'invite-7', checked: false, name: 'Thomas Thibault', email: 'thomas@gmail.com', role: 'Athlete', joinDate: '5/17/2026', status: 'Pending' },
  { id: 'invite-8', checked: false, name: 'Thomas Thibault', email: 'thomas@gmail.com', role: 'Athlete', joinDate: '5/17/2026', status: 'Pending' },
  { id: 'invite-9', checked: false, name: 'Thomas Thibault', email: 'thomas@gmail.com', role: 'Athlete', joinDate: '5/17/2026', status: 'Pending' },
  { id: 'invite-10', checked: false, name: 'Thomas Thibault', email: 'thomas@gmail.com', role: 'Athlete', joinDate: '5/17/2026', status: 'Pending' },
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
    <span className="admin-shell-invites-sort-label">
      <button type="button" className="admin-shell-invites-sort-button" aria-label={`Sort ${children} ${sortDirection}`} onClick={toggleSortDirection}>
        <span>{children}</span>
        <SortIcon className="admin-shell-invites-sort-icon" aria-hidden="true" />
      </button>
    </span>
  )
}

function InviteStatusBadge({ status }) {
  const isPending = status === 'Pending'

  return (
    <span className={[
      'admin-shell-invites-status-badge',
      isPending ? 'admin-shell-invites-status-badge-pending' : '',
    ].filter(Boolean).join(' ')}>
      <span
        className={[
          'admin-shell-invites-status-dot',
          isPending ? 'admin-shell-invites-status-dot-pending' : '',
        ].filter(Boolean).join(' ')}
        aria-hidden="true"
      />
      {status}
    </span>
  )
}

export default function InvitesListView() {
  return (
    <section className="admin-shell-invites-view" aria-label="Athlete invites admin view">
      <div className="admin-shell-invites-toolbar">
        <h1 className="admin-shell-invites-page-title">Invites</h1>

        <div className="admin-shell-invites-toolbar-actions">
          <label className="admin-shell-invites-top-search" aria-label="Search for an athlete by name">
            <Search className="admin-shell-invites-top-search-icon" aria-hidden="true" />
            <input type="text" readOnly value="" placeholder="Search for an athlete by name..." />
          </label>

          <AdminButton
            type="button"
            variant="primary"
            size="default"
            className="admin-shell-invites-invite-button"
            leadingIcon={<Send className="admin-shell-invites-invite-button-icon" aria-hidden="true" />}
          >
            Invite an athlete
          </AdminButton>
        </div>
      </div>

      <section className="admin-shell-invites-table-card" aria-label="Invites table card">
        <div className="admin-shell-invites-table-shell">
          <table className="admin-shell-invites-table">
            <thead>
              <tr>
                <th className="admin-shell-invites-checkbox-cell">
                  <input type="checkbox" readOnly aria-label="Select all invites" />
                </th>
                <th>
                  <SortLabel>Athlete name</SortLabel>
                </th>
                <th>
                  <SortLabel>Role</SortLabel>
                </th>
                <th>
                  <SortLabel>Join date</SortLabel>
                </th>
                <th>
                  <SortLabel>Status</SortLabel>
                </th>
                <th className="admin-shell-invites-actions-cell" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {inviteRows.map((invite, index) => (
                <tr key={invite.id} className={index % 2 === 0 ? 'admin-shell-invites-row-even' : 'admin-shell-invites-row-odd'}>
                  <td className="admin-shell-invites-checkbox-cell">
                    <input type="checkbox" readOnly checked={invite.checked} aria-label={`Select ${invite.name}`} />
                  </td>
                  <td>
                    <div className="admin-shell-invites-name-cell">
                      <Avatar src="/admin/logo_pplus_training.svg" alt={invite.name} className="admin-shell-invites-avatar" />
                      <span className="admin-shell-invites-name-copy">
                        <span className="admin-shell-invites-name-text">{invite.name}</span>
                        <span className="admin-shell-invites-name-meta">{invite.email}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <button type="button" className="admin-shell-invites-role-chip" aria-label={`Role for ${invite.name}`}>
                      <span>{invite.role}</span>
                      <ChevronDown className="admin-shell-invites-role-chip-icon" aria-hidden="true" />
                    </button>
                  </td>
                  <td className="admin-shell-invites-join-date-cell">{invite.joinDate}</td>
                  <td>
                    <InviteStatusBadge status={invite.status} />
                  </td>
                  <td className="admin-shell-invites-actions-cell">
                    <button type="button" className="admin-shell-invites-row-menu" aria-label={`Open actions for ${invite.name}`}>
                      <MoreHorizontal className="admin-shell-invites-row-menu-icon" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-shell-invites-pagination">
        <span className="admin-shell-invites-pagination-count">1 - 10 of 256</span>

        <div className="admin-shell-invites-pagination-controls">
          <span className="admin-shell-invites-pagination-label">Rows per page:</span>
          <button type="button" className="admin-shell-invites-rows-button">
            <span>10</span>
            <ChevronDown className="admin-shell-invites-rows-button-icon" aria-hidden="true" />
          </button>
          <button type="button" className="admin-shell-invites-pagination-arrow" aria-label="Previous page">
            <ChevronLeft className="admin-shell-invites-pagination-arrow-icon" aria-hidden="true" />
          </button>
          <button type="button" className="admin-shell-invites-pagination-arrow" aria-label="Next page">
            <ChevronRight className="admin-shell-invites-pagination-arrow-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
