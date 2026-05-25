'use client'

import RankingsDataTable from './rankings-data-table'

export default function RankingsListView({ searchQuery = '' }) {
  return (
    <section className="admin-shell-rankings-view" aria-label="Athlete rankings admin view">
      <h1 className="admin-shell-rankings-page-title">Rankings</h1>
      <RankingsDataTable searchQuery={searchQuery} />
    </section>
  )
}
