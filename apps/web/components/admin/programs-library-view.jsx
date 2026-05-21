'use client'

import ProgramsDataTable from './programs-data-table'

export default function ProgramsLibraryView({ searchQuery = '' }) {
  return (
    <section className="admin-shell-programs-library-view" aria-label="Programs library admin view">
      <h1 className="admin-shell-athletes-page-title">Programs Library</h1>
      <ProgramsDataTable searchQuery={searchQuery} />
    </section>
  )
}
