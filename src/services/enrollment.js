/**
 * Enrollment Service
 *
 * All enrollment business logic lives here. Accepts a Supabase client as the
 * first argument so the same functions work in both the React UI (anon client,
 * RLS enforced) and the MCP server (service-role client, admin access).
 */

export function getAcademicYear() {
  const now = new Date()
  const year = now.getFullYear()
  return now.getMonth() >= 7 ? `${year}-${year + 1}` : `${year - 1}-${year}`
}

/**
 * Fetch all students for a school, with parent info joined.
 */
export async function getStudents(supabase, schoolId) {
  const { data, error } = await supabase
    .from('students')
    .select('*, parents(first_name, last_name, email, phone)')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Search existing parents by name or email (min 2 chars).
 */
export async function searchParents(supabase, schoolId, query) {
  if (query.length < 2) return []
  const { data, error } = await supabase
    .from('parents')
    .select('id, first_name, last_name, email, phone')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
    .eq('school_id', schoolId)
    .limit(8)
  if (error) throw error
  return data || []
}

/**
 * Enroll a new student.
 *
 * Pass either parentId (existing parent) or parentData (new parent fields).
 * Validates required fields, creates parent if needed, inserts student,
 * and writes the initial grade history entry.
 *
 * @param {object} supabase - Supabase client
 * @param {string} schoolId
 * @param {{ parentId?: string, parentData?: object, studentData: object }} params
 * @returns {object} The newly created student row
 */
export async function enrollStudent(supabase, schoolId, { parentId, parentData, studentData }) {
  if (!studentData.first_name || !studentData.last_name) {
    throw new Error('Student first and last name are required.')
  }
  if (!parentId && (!parentData?.first_name || !parentData?.last_name || !parentData?.email)) {
    throw new Error('Parent first name, last name, and email are required.')
  }

  let resolvedParentId = parentId

  if (!resolvedParentId) {
    const { data: newParent, error: parentError } = await supabase
      .from('parents')
      .insert([{ ...parentData, school_id: schoolId }])
      .select()
      .single()
    if (parentError) throw parentError
    resolvedParentId = newParent.id
  }

  const { data: newStudent, error: studentError } = await supabase
    .from('students')
    .insert([{
      ...studentData,
      parent_id: resolvedParentId,
      school_id: schoolId,
      date_of_birth: studentData.date_of_birth || null,
    }])
    .select()
    .single()
  if (studentError) throw studentError

  if (studentData.grade) {
    await supabase.from('student_grade_history').insert([{
      student_id: newStudent.id,
      grade: studentData.grade,
      academic_year: getAcademicYear(),
      school_id: schoolId,
    }])
  }

  return newStudent
}

/**
 * Update a student's enrollment status (Applied / Enrolled / Waitlisted).
 */
export async function updateStudentStatus(supabase, studentId, status) {
  const { error } = await supabase
    .from('students')
    .update({ status })
    .eq('id', studentId)
  if (error) throw error
}
