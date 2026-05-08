/**
 * Admissions Service
 *
 * Manages the inquiry pipeline and the convert-to-student flow.
 */

import { getAcademicYear } from './enrollment.js'

export async function getInquiries(supabase, schoolId) {
  const { data, error } = await supabase
    .from('inquiries')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Create a new inquiry. Requires parent name + student name.
 */
export async function createInquiry(supabase, schoolId, form) {
  if (!form.parent_first_name || !form.parent_last_name || !form.student_first_name || !form.student_last_name) {
    throw new Error('Parent name and student name are required.')
  }
  const payload = { ...form, school_id: schoolId, tour_date: form.tour_date || null }
  const { error } = await supabase.from('inquiries').insert([payload])
  if (error) throw error
}

export async function updateInquiry(supabase, inquiryId, editForm) {
  const payload = { ...editForm, tour_date: editForm.tour_date || null }
  const { data, error } = await supabase
    .from('inquiries')
    .update(payload)
    .eq('id', inquiryId)
    .select()
    .single()
  if (error) throw error
  return data
}

/**
 * Convert an inquiry to a student record.
 * - Deduplicates parent by email
 * - Creates parent + student
 * - Writes grade history entry if grade is set
 * - Marks the inquiry as Applied
 *
 * Returns the new student row.
 */
export async function convertInquiryToStudent(supabase, schoolId, inquiry) {
  let parentId = null

  if (inquiry.email) {
    const { data: existing } = await supabase
      .from('parents')
      .select('id')
      .eq('email', inquiry.email)
      .eq('school_id', schoolId)
      .maybeSingle()
    if (existing) parentId = existing.id
  }

  if (!parentId) {
    const { data: newParent, error: pErr } = await supabase
      .from('parents')
      .insert([{
        school_id: schoolId,
        first_name: inquiry.parent_first_name,
        last_name: inquiry.parent_last_name,
        email: inquiry.email || null,
        phone: inquiry.phone || null,
      }])
      .select()
      .single()
    if (pErr) throw pErr
    parentId = newParent.id
  }

  const { data: newStudent, error: sErr } = await supabase
    .from('students')
    .insert([{
      school_id: schoolId,
      first_name: inquiry.student_first_name,
      last_name: inquiry.student_last_name,
      grade: inquiry.grade_applying_for || null,
      parent_id: parentId,
      status: 'Applied',
    }])
    .select()
    .single()
  if (sErr) throw sErr

  if (inquiry.grade_applying_for) {
    await supabase.from('student_grade_history').insert([{
      student_id: newStudent.id,
      grade: inquiry.grade_applying_for,
      academic_year: getAcademicYear(),
      school_id: schoolId,
    }])
  }

  await supabase.from('inquiries').update({ status: 'Applied' }).eq('id', inquiry.id)

  return newStudent
}
