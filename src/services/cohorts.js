/**
 * Cohorts Service
 *
 * Supabase CRUD for the cohorts, cohort_students, and cohort_classes tables.
 */

import { enrollStudent } from './classEnrollments.js'

// ── Cohorts ───────────────────────────────────────────────────────────────────

export async function getCohorts(supabase, schoolId) {
  const { data } = await supabase
    .from('cohorts')
    .select('*')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })
  return data || []
}

export async function saveCohort(supabase, schoolId, form) {
  const payload = {
    school_id:     schoolId,
    name:          form.name.trim(),
    division:      form.division      || null,
    academic_year: form.academic_year || null,
    description:   form.description?.trim() || null,
    status:        form.status || 'Active',
  }

  if (form.id) {
    const { data, error } = await supabase
      .from('cohorts').update(payload).eq('id', form.id).select().single()
    if (error) throw new Error(error.message)
    return data
  } else {
    const { data, error } = await supabase
      .from('cohorts').insert(payload).select().single()
    if (error) throw new Error(error.message)
    return data
  }
}

export async function deleteCohort(supabase, cohortId) {
  const { error } = await supabase.from('cohorts').delete().eq('id', cohortId)
  if (error) throw new Error(error.message)
}

// ── Cohort Students ───────────────────────────────────────────────────────────

export async function getCohortStudents(supabase, cohortId) {
  const { data } = await supabase
    .from('cohort_students')
    .select('id, student_id, students(id, first_name, last_name, grade)')
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: true })
  return data || []
}

export async function addCohortStudent(supabase, schoolId, cohortId, studentId) {
  const { data, error } = await supabase
    .from('cohort_students')
    .insert({ school_id: schoolId, cohort_id: cohortId, student_id: studentId })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function removeCohortStudent(supabase, memberRowId) {
  const { error } = await supabase
    .from('cohort_students')
    .delete()
    .eq('id', memberRowId)
  if (error) throw new Error(error.message)
}

// ── Cohort Classes ────────────────────────────────────────────────────────────

export async function getCohortClasses(supabase, cohortId) {
  const { data } = await supabase
    .from('cohort_classes')
    .select('id, class_id, auto_enroll, classes(id, name, subject, division, teacher_name, room_name, class_size, status)')
    .eq('cohort_id', cohortId)
    .order('created_at', { ascending: true })
  return data || []
}

/** Query cohort_classes by class_id — used by the Classes module */
export async function getClassCohorts(supabase, classId) {
  const { data } = await supabase
    .from('cohort_classes')
    .select('id, cohort_id, auto_enroll, cohorts(id, name, division, status)')
    .eq('class_id', classId)
    .order('created_at', { ascending: true })
  return data || []
}

/** All cohort_classes for a school — used by the Schedule conflict detector */
export async function getAllCohortClasses(supabase, schoolId) {
  const { data } = await supabase
    .from('cohort_classes')
    .select('id, cohort_id, class_id, auto_enroll')
    .eq('school_id', schoolId)
  return data || []
}

/** All cohort_students for a school — used by the Schedule conflict detector */
export async function getAllCohortStudents(supabase, schoolId) {
  const { data } = await supabase
    .from('cohort_students')
    .select('id, cohort_id, student_id')
    .eq('school_id', schoolId)
  return data || []
}

export async function addCohortClass(supabase, schoolId, cohortId, classId, autoEnroll = true) {
  const { data, error } = await supabase
    .from('cohort_classes')
    .insert({ school_id: schoolId, cohort_id: cohortId, class_id: classId, auto_enroll: autoEnroll })
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function removeCohortClass(supabase, cohortClassId) {
  const { error } = await supabase
    .from('cohort_classes')
    .delete()
    .eq('id', cohortClassId)
  if (error) throw new Error(error.message)
}

export async function toggleCohortClassAutoEnroll(supabase, cohortClassId, autoEnroll) {
  const { data, error } = await supabase
    .from('cohort_classes')
    .update({ auto_enroll: autoEnroll })
    .eq('id', cohortClassId)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Bulk-enroll all cohort members into a class.
 * Skips students already enrolled (duplicate insert is ignored via try/catch).
 * Respects class_size cap — stops and reports how many were skipped.
 * Returns { enrolled, skipped }.
 */
export async function bulkEnrollCohort(supabase, schoolId, cohortId, classId) {
  // Load members + current enrollment count
  const members = await getCohortStudents(supabase, cohortId)

  // Get current class_enrollments for this class
  const { data: existing } = await supabase
    .from('class_enrollments')
    .select('student_id')
    .eq('school_id', schoolId)
    .eq('class_id', classId)
  const alreadyEnrolled = new Set((existing || []).map(e => e.student_id))

  // Get class cap
  const { data: cls } = await supabase
    .from('classes')
    .select('class_size')
    .eq('id', classId)
    .single()
  const cap = cls?.class_size ? parseInt(cls.class_size, 10) : null

  let enrolled = 0
  let skipped  = 0

  for (const member of members) {
    const studentId = member.student_id
    if (alreadyEnrolled.has(studentId)) { skipped++; continue }

    if (cap !== null && (alreadyEnrolled.size + enrolled) >= cap) {
      skipped++
      continue
    }

    try {
      await enrollStudent(supabase, schoolId, classId, studentId)
      enrolled++
    } catch {
      skipped++
    }
  }

  return { enrolled, skipped }
}
