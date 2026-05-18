/**
 * Rooms Domain
 *
 * Pure constants and logic for the Rooms module.
 */

export const ROOM_TYPES = [
  'Classroom', 'Lab', 'Gymnasium', 'Auditorium',
  'Library', 'Art Room', 'Music Room', 'Office', 'Storage', 'Other',
]

export const ROOM_TYPE_COLORS = {
  Classroom:  '#3b82f6',
  Lab:        '#8b5cf6',
  Gymnasium:  '#10b981',
  Auditorium: '#f59e0b',
  Library:    '#0ea5e9',
  'Art Room': '#ec4899',
  'Music Room': '#f97316',
  Office:     '#6b7280',
  Storage:    '#9ca3af',
  Other:      '#6b7280',
}

export const BLANK_ROOM = {
  name:        '',
  type:        'Classroom',
  building_id: null,
  building:    '',
  floor:       '',
  capacity:    '',
  divisions:   [],
  notes:       '',
}

/** Validate a room form — returns error string or null */
export function validateRoom(form) {
  if (!form.name?.trim())    return 'Room name is required.'
  if (!form.building_id)     return 'A building is required.'
  if (form.capacity !== '' && form.capacity !== null && Number(form.capacity) < 1)
    return 'Capacity must be a positive number.'
  return null
}

/** Derive summary stats from a rooms array */
export function calcRoomStats(rooms) {
  const total    = rooms.length
  const capacity = rooms.reduce((sum, r) => sum + (Number(r.capacity) || 0), 0)
  const byType   = ROOM_TYPES.reduce((acc, t) => {
    const count = rooms.filter(r => r.type === t).length
    if (count > 0) acc[t] = count
    return acc
  }, {})
  return { total, capacity, byType }
}

/** Parse divisions JSONB — always returns an array */
export function parseRoomDivisions(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return [] }
}
