/**
 * Alumni Service
 *
 * All Supabase calls for the Alumni module.
 * Takes a supabase client as first arg — works with both anon (UI) and service-role (MCP).
 */

/**
 * Fetch all alumni for a school, newest graduation year first.
 */
export async function getAlumni(supabase, schoolId) {
  const { data } = await supabase
    .from('alumni')
    .select('*')
    .eq('school_id', schoolId)
    .order('graduation_year', { ascending: false })
  return data || []
}

/**
 * Update an alumnus record. Returns the updated row.
 */
export async function updateAlumnus(supabase, id, payload) {
  const { data, error } = await supabase
    .from('alumni')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Delete an alumnus record.
 */
export async function deleteAlumnus(supabase, id) {
  const { error } = await supabase.from('alumni').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Move an alumnus back to the student roster.
 * Inserts a new student row, reattaches grade history, then deletes the alumni record.
 */
export async function reenrollAsStudent(supabase, schoolId, alumnus) {
  const { data: newStudent, error: insertError } = await supabase
    .from('students')
    .insert([{
      first_name: alumnus.first_name,
      last_name: alumnus.last_name,
      grade: alumnus.grade_completed || '',
      status: 'Applied',
      school_id: schoolId,
      notes: alumnus.notes || null,
    }])
    .select()
    .single()
  if (insertError) throw new Error(insertError.message)

  if (alumnus.original_student_id) {
    await supabase
      .from('student_grade_history')
      .update({ student_id: newStudent.id })
      .eq('student_id', alumnus.original_student_id)
  }

  await supabase.from('alumni').delete().eq('id', alumnus.id)
  return newStudent
}

/**
 * Fetch donation history for a specific alumnus.
 */
export async function getAlumnusGivingHistory(supabase, alumnusId) {
  const { data } = await supabase
    .from('donations')
    .select('amount, date, campaign_id, payment_method, anonymous, notes')
    .eq('donor_id', alumnusId)
    .eq('donor_type', 'Alumni')
    .order('date', { ascending: false })
  return data || []
}

/**
 * Fetch academic grade history for an alumni's original student record.
 */
export async function getAlumnusGradeHistory(supabase, originalStudentId) {
  if (!originalStudentId) return []
  const { data } = await supabase
    .from('student_grade_history')
    .select('*')
    .eq('student_id', originalStudentId)
    .order('recorded_at', { ascending: true })
  return data || []
}
