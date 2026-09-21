const thCls = 'text-left px-3 py-2 text-gray-500 font-semibold text-xs whitespace-nowrap'
const tdCls = 'px-3 py-2 text-gray-700 text-sm'

/**
 * Generic table renderer — no equivalent existed in the codebase before
 * this (every page hand-rolled its own). Standardizes on the closest
 * existing de facto convention (Reports.jsx's thCls-style header,
 * divide-y body).
 */
export default function Table({ columns = [], rows = [] }) {
  if (rows.length === 0) return <p className="text-sm text-gray-400 mb-2">No results.</p>
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-2">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col, i) => <th key={i} className={thCls}>{col}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => <td key={j} className={tdCls}>{cell ?? '—'}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
