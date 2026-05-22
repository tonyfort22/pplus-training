'use client'

import AthletesDataTable from './athletes-data-table'

export default function AthletesListView({ searchQuery = '' }) {
  return (
    <section className="admin-shell-athletes-view" aria-label="All athletes admin view">
      <h1 className="admin-shell-athletes-page-title">All Athletes</h1>
      <AthletesDataTable searchQuery={searchQuery} />
    </section>
  )
}
