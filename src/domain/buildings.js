/**
 * Buildings Domain
 *
 * Pure constants and logic for campus building configuration.
 */

export const BUILDING_TYPES = [
  'Academic', 'Administrative', 'Athletic', 'Arts',
  'Science', 'Support', 'Residential', 'Other',
]

export const BUILDING_TYPE_COLORS = {
  Academic:       '#3b82f6',
  Administrative: '#6b7280',
  Athletic:       '#10b981',
  Arts:           '#ec4899',
  Science:        '#8b5cf6',
  Support:        '#f59e0b',
  Residential:    '#0ea5e9',
  Other:          '#9ca3af',
}

export const BLANK_BUILDING = {
  name:   '',
  type:   'Academic',
  floors: [],
  notes:  '',
}

/** Validate a building form — returns error string or null */
export function validateBuilding(form) {
  if (!form.name?.trim()) return 'Building name is required.'
  return null
}

/** Parse floors JSONB — always returns a string array */
export function parseFloors(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try { return JSON.parse(raw) } catch { return [] }
}

/** Given a building, return its floors as an ordered array */
export function getFloorsForBuilding(buildings, buildingName) {
  const b = buildings.find(b => b.name === buildingName)
  return b ? parseFloors(b.floors) : []
}
