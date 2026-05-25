'use client'

import ExercisesDataTable from './exercises-data-table'

export default function ExercisesLibraryView({ searchQuery = '' }) {
  return (
    <section className="admin-shell-exercises-library-view" aria-label="Exercise library admin view">
      <h1 className="admin-shell-athletes-page-title">Exercise library</h1>
      <ExercisesDataTable searchQuery={searchQuery} />
    </section>
  )
}
