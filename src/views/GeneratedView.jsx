import Table from './Table'
import StatRow from './StatRow'
import ChipList from './ChipList'
import MiniTimeline from './MiniTimeline'

const TEMPLATES = {
  table: Table,
  stat_row: StatRow,
  chip_list: ChipList,
  mini_timeline: MiniTimeline,
}

/** Dispatches a chat-generated view spec to its template. Renders nothing (not an error) for an unrecognized template. */
export default function GeneratedView({ view }) {
  if (!view) return null
  const Template = TEMPLATES[view.template]
  if (!Template) return null
  return <Template {...view.data} />
}
