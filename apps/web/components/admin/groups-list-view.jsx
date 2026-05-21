'use client'

import GroupsDataTable from './groups-data-table'

export default function GroupsListView({ searchQuery = '' }) {
  return (
    <section className="admin-shell-groups-view" aria-label="Athlete groups admin view">
      <h1 className="admin-shell-groups-page-title">Groups</h1>
      <GroupsDataTable searchQuery={searchQuery} />
    </section>
  )
}
