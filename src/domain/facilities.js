/**
 * Facilities Domain
 *
 * Pure business logic for the Facilities module.
 * No React. No Supabase. Input → output only.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const CATEGORIES = [
  'Plumbing', 'Electrical', 'HVAC', 'Carpentry',
  'Grounds', 'Custodial', 'Safety', 'Technology', 'Other',
]

export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export const STATUSES = ['Open', 'In Progress', 'On Hold', 'Completed', 'Cancelled']

export const PRIORITY_COLORS = {
  Low: '#10b981', Medium: '#3b82f6', High: '#f59e0b', Urgent: '#ef4444',
}

export const STATUS_COLORS = {
  Open: '#3b82f6', 'In Progress': '#f59e0b', 'On Hold': '#6b7280',
  Completed: '#10b981', Cancelled: '#9ca3af',
}

export const CATEGORY_ICONS = {
  Plumbing: 'Droplets', Electrical: 'Zap', HVAC: 'Wind', Carpentry: 'Hammer',
  Grounds: 'Leaf', Custodial: 'Brush', Safety: 'Shield', Technology: 'Monitor', Other: 'Wrench',
}

export const BLANK_FORM = {
  title: '', description: '', category: 'Other', location: '',
  priority: 'Medium', status: 'Open', submitted_by: '', assigned_to: '',
  due_date: '', estimated_cost: '', actual_cost: '', notes: '',
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Today's date as YYYY-MM-DD. */
export function today() {
  return new Date().toISOString().split('T')[0]
}

/** Current month as YYYY-MM (used to count completions this month). */
export function thisMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Business rules ───────────────────────────────────────────────────────────

/**
 * Returns true if a work order is past its due date and not yet finished.
 */
export function isOverdue(wo) {
  return !!(wo.due_date && wo.due_date < today() && !['Completed', 'Cancelled'].includes(wo.status))
}

/**
 * Calculate dashboard stat counts from a list of work orders.
 * Returns { open, inProgress, urgent, completedThisMonth }.
 */
export function calcFacilitiesStats(workOrders) {
  return {
    open: workOrders.filter(w => w.status === 'Open').length,
    inProgress: workOrders.filter(w => w.status === 'In Progress').length,
    urgent: workOrders.filter(w =>
      w.priority === 'Urgent' && !['Completed', 'Cancelled'].includes(w.status)
    ).length,
    completedThisMonth: workOrders.filter(w =>
      w.status === 'Completed' && w.completed_date?.startsWith(thisMonth())
    ).length,
  }
}

/**
 * Filter a list of work orders by search text, status, category, and priority.
 */
export function filterWorkOrders(workOrders, { search, filterStatus, filterCategory, filterPriority }) {
  return workOrders.filter(wo => {
    if (filterStatus !== 'All' && wo.status !== filterStatus) return false
    if (filterCategory !== 'All' && wo.category !== filterCategory) return false
    if (filterPriority !== 'All' && wo.priority !== filterPriority) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${wo.title} ${wo.location} ${wo.submitted_by} ${wo.assigned_to}`.toLowerCase().includes(q)) return false
    }
    return true
  })
}
