/**
 * Class Enrollments Service
 *
 * Supabase CRUD for the class_enrollments table.
 */

import { getAcademicYear } from './enrollment.js'

export async function getEnrollments(supabase, schoolId, classId) {
  const { data } = await supabase
    .from('class_enrollments')
    .select('id, student_id, students(id, first_name, last_name, grade)')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
    .order('created_at', { ascending: true })
  return data || []
}

/** All class enrollments for one student, with class names — used by the student timeline. */
export async function getClassEnrollmentsForStudent(supabase, studentId) {
  const { data } = await supabase
    .from('class_enrollments')
    .select('id, class_id, academic_year, classes(name)')
    .eq('student_id', studentId)
  return data || []
}

export async function enrollStudent(supabase, schoolId, classId, studentId) {
  const { data, error } = await supabase
    .from('class_enrollments')
    .insert({ school_id: schoolId, class_id: classId, student_id: studentId, academic_year: getAcademicYear() })
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
