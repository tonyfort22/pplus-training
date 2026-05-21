'use client'

export default function Pagination({
  onPageChange,
  page = 1,
  totalPages = 1,
}) {
  return (
    <nav className="ui-pagination" aria-label="Pagination">
      <button type="button" className="ui-pagination-button" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>
        Previous
      </button>
      <span className="ui-pagination-status">Page {page} of {totalPages}</span>
      <button type="button" className="ui-pagination-button" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>
        Next
      </button>
    </nav>
  )
}
