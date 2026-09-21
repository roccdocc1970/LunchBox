/** Reuses StudentTimeline.jsx's node-and-connector row skeleton for chronological results. */
export default function MiniTimeline({ rows = [] }) {
  if (rows.length === 0) return null
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-2">
      {rows.map((row, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-300 mt-1.5" />
            {i < rows.length - 1 && <div className="w-px flex-1 bg-gray-200 my-0.5" />}
          </div>
          <div className={i < rows.length - 1 ? 'pb-3' : ''}>
            <p className="text-sm font-medium text-gray-800 m-0">{row.label}</p>
            {row.sublabel && <p className="text-xs text-gray-400 m-0">{row.sublabel}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
