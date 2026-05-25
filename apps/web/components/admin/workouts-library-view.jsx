'use client'

import WorkoutsDataTable from './workouts-data-table'

export default function WorkoutsLibraryView({ searchQuery = '' }) {
  return (
    <section className="admin-shell-workouts-library-view" aria-label="Workout library admin view">
      <h1 className="admin-shell-athletes-page-title">Workout Library</h1>
      <WorkoutsDataTable searchQuery={searchQuery} />
    </section>
  )
}
