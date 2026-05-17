export default function Table({ columns = [], rows = [] }) {
  return (
    <div className="ui-table-shell">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="ui-table-heading">{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="ui-table-row">
              {columns.map((column) => (
                <td key={`${row.id}-${column.key}`} className="ui-table-cell">{row[column.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
