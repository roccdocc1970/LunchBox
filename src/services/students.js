/**
 * Students Service
 *
 * Covers the full student lifecycle: roster, profile edits, grade progression,
 * health records, incidents, and alumni graduation.
 *
 * Accepts a Supabase client as the first argument so the same functions work
 * in the React UI (anon client, RLS enforced) and the MCP server
 * (service-role client, admin access).
 */

import { getAcademicYear } from './enrollment.js'

const ALL_GRADES = [
  'Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade',
  '4th Grade', '5th Grade', '6th Grade', '7th Grade', '8th Grade',
  '9th Grade', '10th Grade', '11th Grade', '12th Grade',
]

const nullify = (obj) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, v === '' ? null : v]))

// ─── Roster ──────────────────────────────────────────────────────────────────

/**
 * Fetch all students for a school with full parent info joined.
 * Ordered by last name ascending.
 */
export async function getStudents(supabase, schoolId) {
  const { data, error } = await supabase
    .from('students')
    .select('*, parents(id, first_name, last_name, email, phone, address)')
    .eq('school_id', schoolId)
    .order('last_name', { ascending: true })
  if (error) throw error
  return data || []
}

/**
 * Update a student's editable fields and optionally record a grade progression.
 *
 * Grade progression rules (preserved from original):
 * - Grade changes require Enrolled status
 * - Backward grade moves are blocked
 * - Skipping grades requires explicit skipGrade flag
 * - Repeating the same grade requires explicit repeatGrade flag
 *
 * Returns the updated student row with parent join.
 */
export async function updateStudent(supabase, schoolId, studentId, {
  editForm,
  currentGrade,
  repeatGrade = false,
  skipGrade = false,
}) {
  const { first_name, last_name, grade, date_of_birth, notes, status, parent_id } = editForm

  const { data, error } = await supabase
    .from('students')
    .update({ first_name, last_name, grade, date_of_birth, notes, status, parent_id })
    .eq('id', studentId)
    .select('*, parents(id, first_name, last_name, email, phone, address)')
    .single()
  if (error) throw error

  const gradeChanged = grade && grade !== currentGrade
  const gradeRepeated = grade && grade === currentGrade && repeatGrade

  if ((gradeChanged || gradeRepeated) && status !== 'Enrolled') {
    throw new Error('Grade progression is locked until the student has Enrolled status.')
  }

  if (gradeChanged) {
    const currentIdx = ALL_GRADES.indexOf(currentGrade)
    const newIdx = ALL_GRADES.indexOf(grade)
    if (currentIdx !== -1 && newIdx !== -1 && newIdx < currentIdx) {
      throw new Error(`Cannot move a student back from ${currentGrade} to ${grade}. Grade changes must move forward.`)
    }
    if (currentIdx !== -1 && newIdx !== -1 && newIdx > currentIdx + 1 && !skipGrade) {
      throw new Error(`${grade} skips one or more grades. Check "Student is skipping a grade" to confirm.`)
    }
  }

  if (gradeChanged || gradeRepeated) {
    const currentIdx = ALL_GRADES.indexOf(currentGrade)
    const newIdx = ALL_GRADES.indexOf(grade)
    const isSkip = gradeChanged && currentIdx !== -1 && newIdx !== -1 && newIdx > currentIdx + 1
    await supabase.from('student_grade_history').insert([{
      student_id: studentId,
      grade,
      academic_year: getAcademicYear(),
      is_repeat: gradeRepeated,
      is_skip: isSkip,
      school_id: schoolId,
    }])
  }

  return data
}

/**
 * Permanently delete a student record.
 */
export async function deleteStudent(supabase, studentId) {
  const { error } = await supabase.from('students').delete().eq('id', studentId)
  if (error) throw error
}

/**
 * Graduate a student to alumni: inserts into alumni table, deletes from students.
 */
export async function graduateStudentToAlumni(supabase, schoolId, student, { graduationYear, gradeCompleted }) {
  const { error: insertError } = await supabase.from('alumni').insert([{
    first_name: student.first_name,
    last_name: student.last_name,
    email: student.parents?.email || null,
    phone: student.parents?.phone || null,
    address: student.parents?.address || null,
    graduation_year: graduationYear || null,
    grade_completed: gradeCompleted || student.grade || null,
    donor_status: 'Never',
    relationship: 'None',
    opt_in: true,
    original_student_id: student.id,
    school_id: schoolId,
  }])
  if (insertError) throw insertError
  await supabase.from('students').delete().eq('id', student.id)
}

// ─── Grade History ────────────────────────────────────────────────────────────

export async function getGradeHistory(supabase, studentId) {
  const { data, error } = await supabase
    .from('student_grade_history')
    .select('*')
    .eq('student_id', studentId)
    .order('recorded_at', { ascending: true })
  if (error) throw error
  return data || []
}

// ─── Report Cards ─────────────────────────────────────────────────────────────

export async function getReportCardCount(supabase, studentId) {
  const { count, error } = await supabase
    .from('report_cards')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
  if (error) throw error
  return count || 0
}

// ─── Health Records ───────────────────────────────────────────────────────────

/**
 * Fetch a student's health profile and all health entries in parallel.
 * Returns { profile, entries }.
 */
export async function getStudentHealth(supabase, studentId) {
  const [{ data: profile, error: pErr }, { data: entries, error: eErr }] = await Promise.all([
    supabase.from('student_health').select('*').eq('student_id', studentId).maybeSingle(),
    supabase.from('student_health_entries').select('*').eq('student_id', studentId).order('date', { ascending: false }),
  ])
  if (pErr) throw pErr
  if (eErr) throw eErr
  return { profile: profile || null, entries: entries || [] }
}

/**
 * Upsert a student health profile. Inserts if no existingProfileId, updates otherwise.
 */
export async function saveHealthProfile(supabase, studentId, schoolId, { existingProfileId, profileData }) {
  const payload = nullify(profileData)
  if (existingProfileId) {
    const { error } = await supabase.from('student_health').update(payload).eq('id', existingProfileId)
    if (error) throw error
  } else {
    const { error } = await supabase.from('student_health').insert([{ ...payload, student_id: studentId, school_id: schoolId }])
    if (error) throw error
  }
}

/**
 * Add a new health entry. Requires entry.name to be non-empty.
 */
export async function addHealthEntry(supabase, studentId, schoolId, entryData) {
  if (!entryData.name?.trim()) throw new Error('Entry name is required.')
  const payload = nullify(entryData)
  const { error } = await supabase.from('student_health_entries').insert([{
    ...payload,
    student_id: studentId,
    school_id: schoolId,
  }])
  if (error) throw error
}

export async function updateHealthEntry(supabase, entryId, entryData) {
  const payload = nullify(entryData)
  const { error } = await supabase.from('student_health_entries').update(payload).eq('id', entryId)
  if (error) throw error
}

export async function deleteHealthEntry(supabase, entryId) {
  const { error } = await supabase.from('student_health_entries').delete().eq('id', entryId)
  if (error) throw error
}

export async function deleteHealthProfile(supabase, profileId) {
  const { error } = await supabase.from('student_health').delete().eq('id', profileId)
  if (error) throw error
}

// ─── Incidents ────────────────────────────────────────────────────────────────

export async function getIncidents(supabase, studentId) {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Fetch all incidents for a school (used by StaffDashboard incidents page).
 */
export async function getSchoolIncidents(supabase, schoolId) {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('school_id', schoolId)
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Fetch students with parent join, optionally filtered to specific grades.
 */
export async function getStudentsWithParents(supabase, schoolId, gradeFilter = []) {
  let q = supabase
    .from('students')
    .select('*, parents(first_name, last_name, email, phone)')
    .eq('school_id', schoolId)
    .order('last_name')
  if (gradeFilter.length > 0) q = q.in('grade', gradeFilter)
  const { data, error } = await q
  if (error) throw error
  return data || []
}

/**
 * Log a new incident. Requires incidentData.description to be non-empty.
 */
export async function logIncident(supabase, schoolId, { studentId, studentName, type, description, reported_by, resolution, status }) {
  if (!description) throw new Error('Incident description is required.')
  const { error } = await supabase.from('incidents').insert([{
    school_id: schoolId,
    student_id: studentId,
    student_name: studentName,
    type: type || 'Other',
    description,
    reported_by: reported_by || null,
    resolution: resolution || null,
    status: status || 'Open',
    date: new Date().toISOString().split('T')[0],
  }])
  if (error) throw error
}

export async function updateIncident(supabase, incidentId, data) {
  const { error } = await supabase.from('incidents').update(data).eq('id', incidentId)
  if (error) throw error
}

export async function resolveIncident(supabase, incidentId) {
  const { error } = await supabase.from('incidents').update({ status: 'Resolved' }).eq('id', incidentId)
  if (error) throw error
}

// ─── Staff Search ─────────────────────────────────────────────────────────────

/**
 * Search active staff by name (min 1 char). Used for incident "reported by" field.
 */
export async function searchStaff(supabase, schoolId, query) {
  if (query.length < 1) return []
  const { data, error } = await supabase
    .from('staff')
    .select('id, first_name, last_name, role')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
    .eq('school_id', schoolId)
    .eq('status', 'Active')
    .limit(8)
  if (error) throw error
  return data || []
}
