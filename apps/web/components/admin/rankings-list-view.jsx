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
} from 'lucide-react'

import Avatar from '../ui/avatar'

const rankingRows = [
  { id: 'ranking-1', checked: true, rank: 1, badgeSrc: '/admin/gold_badge.svg', name: 'Thomas Thibault', dobAgeLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsLabel: '34 / 40', workoutsProgress: 85, lastActive: '5/17/2026', status: 'Active' },
  { id: 'ranking-2', checked: false, rank: 2, badgeSrc: '/admin/silver_badge.svg', name: 'Thomas Thibault', dobAgeLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsLabel: '29 / 40', workoutsProgress: 72.5, lastActive: '5/17/2026', status: 'Active' },
  { id: 'ranking-3', checked: false, rank: 3, badgeSrc: '/admin/bronze_badget.svg', name: 'Thomas Thibault', dobAgeLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsLabel: '28 / 40', workoutsProgress: 70, lastActive: '5/17/2026', status: 'Active' },
  { id: 'ranking-4', checked: true, rank: 4, name: 'Thomas Thibault', dobAgeLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsLabel: '26 / 40', workoutsProgress: 65, lastActive: '5/17/2026', status: 'Active' },
  { id: 'ranking-5', checked: false, rank: 5, name: 'Thomas Thibault', dobAgeLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsLabel: '25 / 40', workoutsProgress: 62.5, lastActive: '5/17/2026', status: 'Active' },
  { id: 'ranking-6', checked: true, rank: 6, name: 'Thomas Thibault', dobAgeLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsLabel: '21 / 40', workoutsProgress: 52.5, lastActive: '5/17/2026', status: 'Active' },
  { id: 'ranking-7', checked: false, rank: 7, name: 'Thomas Thibault', dobAgeLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsLabel: '20 / 40', workoutsProgress: 50, lastActive: '5/17/2026', status: 'Active' },
  { id: 'ranking-8', checked: true, rank: 8, name: 'Thomas Thibault', dobAgeLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsLabel: '20 / 40', workoutsProgress: 50, lastActive: '5/17/2026', status: 'Active' },
  { id: 'ranking-9', checked: false, rank: 9, name: 'Thomas Thibault', dobAgeLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsLabel: '18 / 40', workoutsProgress: 45, lastActive: '5/17/2026', status: 'Active' },
  { id: 'ranking-10', checked: false, rank: 10, name: 'Thomas Thibault', dobAgeLabel: '1/01/2011 (15 year old)', program: 'Training Program', workoutsLabel: '16 / 40', workoutsProgress: 40, lastActive: '5/17/2026', status: 'Active' },
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
    <span className="admin-shell-rankings-sort-label">
      <button type="button" className="admin-shell-rankings-sort-button" aria-label={`Sort ${children} ${sortDirection}`} onClick={toggleSortDirection}>
        <span>{children}</span>
        <SortIcon className="admin-shell-rankings-sort-icon" aria-hidden="true" />
      </button>
    </span>
  )
}

function RankBadge({ badgeSrc = '', rank }) {
  if (badgeSrc) {
    return <img src={badgeSrc} alt={`Rank ${rank} badge`} className="admin-shell-rankings-rank-badge-image" />
  }

  return <span className="admin-shell-rankings-rank-number">{rank}</span>
}

export default function RankingsListView() {
  return (
    <section className="admin-shell-rankings-view" aria-label="Athlete rankings admin view">
      <div className="admin-shell-rankings-toolbar">
        <h1 className="admin-shell-rankings-page-title">Rankings</h1>

        <div className="admin-shell-rankings-toolbar-actions">
          <label className="admin-shell-rankings-top-search" aria-label="Search for an athlete by name">
            <Search className="admin-shell-rankings-top-search-icon" aria-hidden="true" />
            <input type="text" readOnly value="" placeholder="Search for an athlete by name..." />
          </label>
        </div>
      </div>

      <section className="admin-shell-rankings-table-card" aria-label="Rankings table card">
        <div className="admin-shell-rankings-table-shell">
          <table className="admin-shell-rankings-table">
            <thead>
              <tr>
                <th className="admin-shell-rankings-checkbox-cell">
                  <input type="checkbox" readOnly aria-label="Select all athletes" />
                </th>
                <th className="admin-shell-rankings-rank-cell" aria-label="Rank" />
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
                <th className="admin-shell-rankings-actions-cell" aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {rankingRows.map((athlete, index) => (
                <tr key={athlete.id} className={index % 2 === 0 ? 'admin-shell-rankings-row-even' : 'admin-shell-rankings-row-odd'}>
                  <td className="admin-shell-rankings-checkbox-cell">
                    <input type="checkbox" readOnly checked={athlete.checked} aria-label={`Select ${athlete.name}`} />
                  </td>
                  <td className="admin-shell-rankings-rank-cell">
                    <RankBadge badgeSrc={athlete.badgeSrc} rank={athlete.rank} />
                  </td>
                  <td>
                    <div className="admin-shell-rankings-name-cell">
                      <Avatar src="/admin/logo_pplus_training.svg" alt={athlete.name} className="admin-shell-rankings-avatar" />
                      <span className="admin-shell-rankings-name-copy">
                        <span className="admin-shell-rankings-name-text">{athlete.name}</span>
                        <span className="admin-shell-rankings-name-meta">{athlete.dobAgeLabel}</span>
                      </span>
                    </div>
                  </td>
                  <td className="admin-shell-rankings-program-cell">{athlete.program}</td>
                  <td>
                    <div className="admin-shell-rankings-workouts-cell">
                      <span className="admin-shell-rankings-workouts-label">{athlete.workoutsLabel}</span>
                      <span className="admin-shell-rankings-progress-track" aria-hidden="true">
                        <span className="admin-shell-rankings-progress-fill" style={{ width: `${athlete.workoutsProgress}%` }} />
                      </span>
                    </div>
                  </td>
                  <td className="admin-shell-rankings-last-active-cell">{athlete.lastActive}</td>
                  <td>
                    <span className="admin-shell-rankings-status-badge">
                      <span className="admin-shell-rankings-status-dot" aria-hidden="true" />
                      {athlete.status}
                    </span>
                  </td>
                  <td className="admin-shell-rankings-actions-cell">
                    <button type="button" className="admin-shell-rankings-row-menu" aria-label={`Open actions for ${athlete.name}`}>
                      <MoreHorizontal className="admin-shell-rankings-row-menu-icon" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="admin-shell-rankings-pagination">
        <span className="admin-shell-rankings-pagination-count">1 - 10 of 256</span>

        <div className="admin-shell-rankings-pagination-controls">
          <span className="admin-shell-rankings-pagination-label">Rows per page:</span>
          <button type="button" className="admin-shell-rankings-rows-button">
            <span>10</span>
            <ChevronDown className="admin-shell-rankings-rows-button-icon" aria-hidden="true" />
          </button>
          <button type="button" className="admin-shell-rankings-pagination-arrow" aria-label="Previous page">
            <ChevronLeft className="admin-shell-rankings-pagination-arrow-icon" aria-hidden="true" />
          </button>
          <button type="button" className="admin-shell-rankings-pagination-arrow" aria-label="Next page">
            <ChevronRight className="admin-shell-rankings-pagination-arrow-icon" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  )
}
