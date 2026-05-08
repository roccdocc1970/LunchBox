/**
 * Parents Domain
 *
 * Pure business logic specific to the Parents module.
 * No React. No Supabase. Input → output only.
 */

/**
 * Generate two-letter initials from a parent object.
 * e.g. { first_name: 'Jane', last_name: 'Doe' } → 'JD'
 */
export function initials(parent) {
  if (!parent) return '?'
  const f = parent.first_name?.[0] || ''
  const l = parent.last_name?.[0] || ''
  return (f + l).toUpperCase() || '?'
}
