import { resolveIcon } from '../domain/icons'
import { UNKNOWN_COLOR } from '../domain/colors'

const chipCls = 'text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1'

/** Reuses StudentTimeline.jsx's chip styling verbatim. */
export default function ChipList({ items = [] }) {
  if (items.length === 0) return null
  return (
    <div className="flex gap-1.5 flex-wrap mb-2">
      {items.map((item, i) => {
        const Icon = item.icon ? resolveIcon(item.icon) : null
        return (
          <span
            key={i}
            className={chipCls}
            style={{ background: (item.color || UNKNOWN_COLOR) + '20', color: item.color || UNKNOWN_COLOR }}
          >
            {Icon && <Icon size={11} />}{item.label}
          </span>
        )
      })}
    </div>
  )
}
