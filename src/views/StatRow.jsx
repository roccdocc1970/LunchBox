import { UNKNOWN_COLOR } from '../domain/colors'

/** Matches the app's stat-pill convention (CLAUDE.md's Stat Card Convention). */
export default function StatRow({ items = [] }) {
  if (items.length === 0) return null
  return (
    <div className="flex gap-4 mb-2 flex-wrap">
      {items.map((item, i) => (
        <div key={i} className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color || UNKNOWN_COLOR }} />
          <span className="font-semibold text-gray-800">{item.value}</span>
          <span className="text-gray-500 text-sm">{item.label}</span>
        </div>
      ))}
    </div>
  )
}
