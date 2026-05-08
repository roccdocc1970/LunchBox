/**
 * Facilities Service
 */

const today = () => new Date().toISOString().split('T')[0]

const parseCosts = (form) => ({
  estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
  actual_cost: form.actual_cost ? parseFloat(form.actual_cost) : null,
  due_date: form.due_date || null,
})

export async function getWorkOrders(supabase, schoolId) {
  const { data, error } = await supabase
    .from('work_orders')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Fetch active Facilities and Maintenance staff for the assignee dropdown.
 */
export async function getFacilitiesStaff(supabase, schoolId) {
  const { data, error } = await supabase
    .from('staff')
    .select('id, first_name, last_name, role')
    .eq('school_id', schoolId)
    .eq('status', 'Active')
    .in('role', ['Facilities', 'Maintenance'])
    .order('last_name')
  if (error) throw error
  return data || []
}

/**
 * Create a new work order. Requires a non-empty title.
 * Automatically sets completed_date when status is Completed.
 */
export async function createWorkOrder(supabase, schoolId, form) {
  if (!form.title?.trim()) throw new Error('Title is required.')
  const { error } = await supabase.from('work_orders').insert([{
    ...form,
    school_id: schoolId,
    ...parseCosts(form),
    completed_date: form.status === 'Completed' ? today() : null,
  }])
  if (error) throw error
}

/**
 * Update an existing work order.
 * Auto-sets completed_date on first transition to Completed.
 * Returns the updated payload (merged for optimistic UI update).
 */
/**
 * Quick-update just the status field (and completed_date) without a full edit form.
 */
export async function updateWorkOrderStatus(supabase, workOrderId, status) {
  const completed_date = status === 'Completed' ? today() : null
  const { error } = await supabase
    .from('work_orders')
    .update({ status, completed_date })
    .eq('id', workOrderId)
  if (error) throw error
  return { status, completed_date }
}

export async function updateWorkOrder(supabase, workOrderId, editForm) {
  const payload = {
    ...editForm,
    ...parseCosts(editForm),
    completed_date:
      editForm.status === 'Completed' && !editForm.completed_date
        ? today()
        : editForm.completed_date || null,
  }
  const { error } = await supabase.from('work_orders').update(payload).eq('id', workOrderId)
  if (error) throw error
  return payload
}
