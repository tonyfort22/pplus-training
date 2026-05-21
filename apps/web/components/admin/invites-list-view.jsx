'use client'

import InvitesDataTable from './invites-data-table'

export default function InvitesListView({ searchQuery = '' }) {
  return (
    <section className="admin-shell-invites-view" aria-label="Athlete invites admin view">
      <h1 className="admin-shell-invites-page-title">Invites</h1>
      <InvitesDataTable searchQuery={searchQuery} />
    </section>
  )
}
