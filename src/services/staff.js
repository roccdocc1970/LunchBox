/**
 * Staff Service
 */

export async function getStaff(supabase, schoolId) {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('school_id', schoolId)
    .order('last_name', { ascending: true })
  if (error) throw error
  return data || []
}

/**
 * Add a new staff member. Requires first name, last name, and role.
 */
export async function createStaffMember(supabase, schoolId, form) {
  if (!form.first_name || !form.last_name || !form.role) {
    throw new Error('First name, last name, and role are required.')
  }
  const { grade_assignments, ...rest } = form
  const payload = {
    ...rest,
    grade_assignments,
    school_id: schoolId,
    hire_date: form.hire_date || null,
  }
  const { error } = await supabase.from('staff').insert([payload])
  if (error) throw error
}

/**
 * Update a staff member's profile and grade assignments.
 * Returns the updated staff row.
 */
export async function updateStaffMember(supabase, staffId, { editForm, editGrades }) {
  const { first_name, last_name, email, phone, role, hire_date, status, notes } = editForm
  const { data, error } = await supabase
    .from('staff')
    .update({
      first_name, last_name, email, phone, role,
      grade_assignments: editGrades,
      hire_date: hire_date || null,
      status, notes,
    })
    .eq('id', staffId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteStaffMember(supabase, staffId) {
  const { error } = await supabase.from('staff').delete().eq('id', staffId)
  if (error) throw error
}
