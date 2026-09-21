/**
 * Admissions Service
 *
 * Manages the inquiry pipeline and the convert-to-student flow. An "inquiry"
 * is simply a students.status IN ('New Inquiry','Toured') row in the unified
 * `students` table — this service maps between that unified shape and the
 * flat inquiry-shaped fields (student_first_name, parent_first_name,
 * grade_applying_for, etc.) the Admissions UI already expects, so the
 * permanent identity unification stays contained to this layer.
 */

import { getAcademicYear } from './enrollment.js'

const toInquiryShape = (row) => ({
  id: row.id,
  school_id: row.school_id,
  created_at: row.created_at,
  parent_id: row.parent_id,
  status: row.status,
  source: row.source,
  inquiry_date: row.inquiry_date,
  tour_date: row.tour_date,
  notes: row.notes,
  grade_applying_for: row.grade,
  student_first_name: row.first_name,
  student_last_name: row.last_name,
  parent_first_name: row.parents?.first_name || '',
  parent_last_name: row.parents?.last_name || '',
  email: row.parents?.email || '',
  phone: row.parents?.phone || '',
})

async function resolveParentId(supabase, schoolId, { email, parent_first_name, parent_last_name, phone }) {
  if (email) {
    const { data: existing } = await supabase
      .from('parents')
      .select('id')
      .eq('email', email)
      .eq('school_id', schoolId)
      .maybeSingle()
    if (existing) return existing.id
  }
  const { data: newParent, error } = await supabase
    .from('parents')
    .insert([{ school_id: schoolId, first_name: parent_first_name, last_name: parent_last_name, email: email || null, phone: phone || null }])
    .select()
    .single()
  if (error) throw error
  return newParent.id
}

export async function getInquiries(supabase, schoolId) {
  const { data, error } = await supabase
    .from('students')
    .select('*, parents(first_name, last_name, email, phone)')
    .eq('school_id', schoolId)
    .in('status', ['New Inquiry', 'Toured', 'Withdrawn'])
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(toInquiryShape)
}

/**
 * Create a new inquiry. Requires parent name + student name.
 */
export async function createInquiry(supabase, schoolId, form) {
  if (!form.parent_first_name || !form.parent_last_name || !form.student_first_name || !form.student_last_name) {
    throw new Error('Parent name and student name are required.')
  }
  const parentId = await resolveParentId(supabase, schoolId, form)
  const { error } = await supabase.from('students').insert([{
    school_id: schoolId,
    parent_id: parentId,
    first_name: form.student_first_name,
    last_name: form.student_last_name,
    grade: form.grade_applying_for || null,
    status: form.status || 'New Inquiry',
    source: form.source || null,
    inquiry_date: form.inquiry_date || null,
    tour_date: form.tour_date || null,
    notes: form.notes || null,
  }])
  if (error) throw error
}

/**
 * Update an inquiry's parent contact info and admissions fields.
 * Updates the already-linked parent row rather than creating a new one.
 */
export async function updateInquiry(supabase, inquiryId, editForm) {
  if (editForm.parent_id) {
    const { error: parentError } = await supabase
      .from('parents')
      .update({
        first_name: editForm.parent_first_name,
        last_name: editForm.parent_last_name,
        email: editForm.email || null,
        phone: editForm.phone || null,
      })
      .eq('id', editForm.parent_id)
    if (parentError) throw parentError
  }

  const { data, error } = await supabase
    .from('students')
    .update({
      first_name: editForm.student_first_name,
      last_name: editForm.student_last_name,
      grade: editForm.grade_applying_for || null,
      status: editForm.status,
      source: editForm.source,
      inquiry_date: editForm.inquiry_date || null,
      tour_date: editForm.tour_date || null,
      notes: editForm.notes || null,
    })
    .eq('id', inquiryId)
    .select('*, parents(first_name, last_name, email, phone)')
    .single()
  if (error) throw error
  return toInquiryShape(data)
}

/**
 * Convert an inquiry to an applicant — a status change on the same permanent
 * record (parent + student already exist since inquiry creation).
 */
export async function convertInquiryToStudent(supabase, schoolId, inquiry) {
  const { error } = await supabase.from('students').update({ status: 'Applied' }).eq('id', inquiry.id)
  if (error) throw error

  if (inquiry.grade_applying_for) {
    await supabase.from('student_grade_history').insert([{
      student_id: inquiry.id,
      grade: inquiry.grade_applying_for,
      academic_year: getAcademicYear(),
      school_id: schoolId,
    }])
  }
}
