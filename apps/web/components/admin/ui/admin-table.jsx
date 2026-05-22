export default function AdminTable({ columns = [], rows = [] }) {
  return (
    <div className="admin-table-shell">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="admin-table-heading">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="admin-table-row">
              {columns.map((column) => (
                <td key={`${row.id}-${column.key}`} className="admin-table-cell">{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
