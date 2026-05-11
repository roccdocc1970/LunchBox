/**
 * Class Enrollments Service
 *
 * Supabase CRUD for the class_enrollments table.
 */

export async function getEnrollments(supabase, schoolId, classId) {
  const { data } = await supabase
    .from('class_enrollments')
    .select('id, student_id, students(id, first_name, last_name, grade)')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function enrollStudent(supabase, schoolId, classId, studentId) {
  const { data, error } = await supabase
    .from('class_enrollments')
    .insert({ school_id: schoolId, class_id: classId, student_id: studentId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function unenrollStudent(supabase, enrollmentId) {
  const { error } = await supabase
    .from('class_enrollments')
    .delete()
    .eq('id', enrollmentId)
  if (error) throw new Error(error.message)
}
