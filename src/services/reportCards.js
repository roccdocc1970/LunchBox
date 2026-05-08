/**
 * Report Cards Service
 */

export async function getReportCards(supabase, schoolId) {
  const { data, error } = await supabase
    .from('report_cards')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Fetch enrolled students for the student picker dropdown.
 */
export async function getEnrolledStudents(supabase, schoolId) {
  const { data, error } = await supabase
    .from('students')
    .select('id, first_name, last_name, grade')
    .eq('school_id', schoolId)
    .eq('status', 'Enrolled')
    .order('last_name')
  if (error) throw error
  return data || []
}

/**
 * Create a new report card. Requires a student to be selected.
 */
export async function createReportCard(supabase, schoolId, form) {
  if (!form.student_id) throw new Error('Please select a student.')
  const { error } = await supabase.from('report_cards').insert([{
    student_id: form.student_id,
    student_name: form.student_name,
    student_grade: form.student_grade,
    academic_year: form.academic_year,
    term: form.term,
    grades: form.grades,
    teacher_notes: form.teacher_notes,
    published: false,
    school_id: schoolId,
  }])
  if (error) throw error
}

/**
 * Toggle a report card between published and draft.
 * Returns the new published value.
 */
export async function setReportCardPublished(supabase, rcId, published) {
  const { error } = await supabase
    .from('report_cards')
    .update({ published })
    .eq('id', rcId)
  if (error) throw error
  return published
}

/**
 * Update an existing report card (used by StaffDashboard).
 */
export async function updateReportCard(supabase, rcId, form) {
  const { error } = await supabase.from('report_cards').update({
    academic_year: form.academic_year,
    term:          form.term,
    grades:        form.grades,
    teacher_notes: form.teacher_notes,
    published:     form.published,
  }).eq('id', rcId)
  if (error) throw error
}

export async function deleteReportCard(supabase, rcId) {
  const { error } = await supabase.from('report_cards').delete().eq('id', rcId)
  if (error) throw error
}
