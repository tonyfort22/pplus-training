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
  X,
} from 'lucide-react'

import Dialog from '../ui/dialog'
import AdminButton from './ui/admin-button'

const athleteRows = Array.from({ length: 10 }, (_, index) => ({
  id: `thomas-thibault-${index + 1}`,
  checked: index === 0 || index === 1 || index === 4 || index === 7,
  name: 'Thomas Thibault',
  dobAgeLabel: '1/01/2011 (15 year old)',
  program: 'Training Program',
  workoutsLabel: '12 / 40',
  workoutsProgress: 30,
  lastActive: '5/17/2026',
  status: 'Active',
}))

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
    <span className="admin-shell-athletes-sort-label">
      <button type="button" className="admin-shell-athletes-sort-button" aria-label={`Sort ${children} ${sortDirection}`} onClick={toggleSortDirection}>
        <span>{children}</span>
        <SortIcon className="admin-shell-athletes-sort-icon" aria-hidden="true" />
      </button>
    </span>
  )
}

function InviteAthleteIllustration() {
  return (
    <img
      src="/admin/invite_athlete_img.svg"
      alt="Invite athlete illustration"
      className="admin-shell-athletes-invite-dialog-illustration"
    />
  )
}

export default function AthletesListView() {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)

  return (
    <section className="admin-shell-athletes-view" aria-label="All athletes admin view">
      <div className="admin-shell-athletes-toolbar">
        <h1 className="admin-shell-athletes-page-title">All Athletes</h1>

        <div className="admin-shell-athletes-toolbar-actions">
          <label className="admin-shell-athletes-top-search" aria-label="Search for an athlete by name">
            <Search className="admin-shell-athletes-top-search-icon" aria-hidden="true" />
            <input type="text" readOnly value="" placeholder="Search for an athlete by name..." />
          </label>

          <AdminButton
            type="button"
            variant="primary"
            size="default"
            className="admin-shell-athletes-invite-button"
            leadingIcon={<Send className="admin-shell-athletes-invite-button-icon" aria-hidden="true" />}
            onClick={() => setIsInviteDialogOpen(true)}
          >
            Invite an athlete
          </AdminButton>
        </div>
      </div>

      <section className="admin-shell-athletes-table-card" aria-label="All Athletes table card">
        <div className="admin-shell-athletes-table-shell">
          <table className="admin-shell-athletes-table">
            <thead>
              <tr>
                <th className="admin-shell-athletes-checkbox-cell">
                  <input type="checkbox" readOnly aria-label="Select all athletes" />
                </th>
                <th>
                  <SortLabel>Athlete name</SortLabel>
                </th>
                <th>
                  <SortLabel>Program</SortLabel>
                </th>
                <th>
                  <SortLabel>Workouts</SortLabel>
                </th>
                <th>
                  <SortLabel>Last active</SortLabel>
                </th>
                <th>
                  <SortLabel>Status</SortLabel>
                </th>
                <th className="admin-shell-athletes-actions-cell" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {athleteRows.map((athlete, index) => (
                <tr key={athlete.id} className={index % 2 === 0 ? 'admin-shell-athletes-row-even' : 'admin-shell-athletes-row-odd'}>
                  <td className="admin-shell-athletes-checkbox-cell">
                    <input type="checkbox" readOnly checked={athlete.checked} aria-label={`Select ${athlete.name}`} />
                  </td>
                  <td>
                    <div className="admin-shell-athletes-name-cell">
                      <span className="admin-shell-athletes-avatar" aria-hidden="true">
                        TT
                      </span>
                      <span className="admin-shell-athletes-name-copy">
                        <span className="admin-shell-athletes-name-text">{athlete.name}</span>
                        <span className="admin-shell-athletes-name-meta">{athlete.dobAgeLabel}</span>
                      </span>
                    </div>
                  </td>
                  <td className="admin-shell-athletes-program-cell">{athlete.program}</td>
                  <td>
                    <div className="admin-shell-athletes-workouts-cell">
                      <span className="admin-shell-athletes-workouts-label">{athlete.workoutsLabel}</span>
                      <span className="admin-shell-athletes-progress-track" aria-hidden="true">
                        <span className="admin-shell-athletes-progress-fill" style={{ width: `${athlete.workoutsProgress}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className="admin-shell-athletes-last-active-cell">{athlete.lastActive}</td>
                  <td>
                    <span className="admin-shell-athletes-status-badge">
                      <span className="admin-shell-athletes-status-dot" aria-hidden="true" />
                      {athlete.status}
                    </span>
                  </td>
                  <td className="admin-shell-athletes-actions-cell">
                    <button type="button" className="admin-shell-athletes-row-menu" aria-label={`Open actions for ${athlete.name}`}>
                      <MoreHorizontal className="admin-shell-athletes-row-menu-icon" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-shell-athletes-pagination">
        <span className="admin-shell-athletes-pagination-count">1 - 10 of 256</span>

        <div className="admin-shell-athletes-pagination-controls">
          <span className="admin-shell-athletes-pagination-label">Rows per page:</span>
          <button type="button" className="admin-shell-athletes-rows-button">
            <span>10</span>
            <ChevronDown className="admin-shell-athletes-rows-button-icon" aria-hidden="true" />
          </button>
          <button type="button" className="admin-shell-athletes-pagination-arrow" aria-label="Previous page">
            <ChevronLeft className="admin-shell-athletes-pagination-arrow-icon" aria-hidden="true" />
          </button>
          <button type="button" className="admin-shell-athletes-pagination-arrow" aria-label="Next page">
            <ChevronRight className="admin-shell-athletes-pagination-arrow-icon" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Dialog
        open={isInviteDialogOpen}
        title="Invite an athlete"
        description="Fill out the information below."
        className="admin-shell-athletes-invite-dialog"
        bodyClassName="admin-shell-athletes-invite-dialog-body"
        headerActions={
          <button
            type="button"
            className="admin-shell-athletes-invite-dialog-close"
            aria-label="Close invite athlete dialog"
            onClick={() => setIsInviteDialogOpen(false)}
          >
            <X className="admin-shell-athletes-invite-dialog-close-icon" aria-hidden="true" />
          </button>
        }
      >
        <InviteAthleteIllustration />
        <label className="admin-shell-athletes-invite-dialog-field">
          <span>Email</span>
          <input type="email" placeholder="eg: johndoe@email.com" />
        </label>
        <AdminButton
          type="button"
          variant="primary"
          size="default"
          className="admin-shell-athletes-invite-dialog-submit"
          leadingIcon={<Send className="admin-shell-athletes-invite-button-icon" aria-hidden="true" />}
        >
          Invite athlete
        </AdminButton>
      </Dialog>
    </section>
  )
}
