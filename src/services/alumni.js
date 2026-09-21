/**
 * Alumni Service
 *
 * Alumni are students.status = 'Alumni' rows in the unified `students` table —
 * graduation is a status change, not a move to a separate table. Graduation-
 * and donor-specific fields live in student_alumni_details (1:1, only
 * populated once a student reaches alumni status).
 *
 * Takes a supabase client as first arg — works with both anon (UI) and service-role (MCP).
 */

const flattenAlumnus = (row) => {
  const { student_alumni_details, ...student } = row
  return { ...student, ...(student_alumni_details || {}) }
}

const STUDENT_FIELDS = ['first_name', 'last_name']

/**
 * Fetch all alumni (status = 'Alumni') for a school, newest graduation year first.
 */
export async function getAlumni(supabase, schoolId) {
  const { data, error } = await supabase
    .from('students')
    .select('*, student_alumni_details(*)')
    .eq('school_id', schoolId)
    .eq('status', 'Alumni')
  if (error) throw error
  return (data || [])
    .map(flattenAlumnus)
    .sort((a, b) => (b.graduation_year || 0) - (a.graduation_year || 0))
}

/**
 * Update an alumnus record — splits the flat edit payload across `students`
 * (name) and `student_alumni_details` (everything graduation/donor-related).
 * Returns the updated, re-flattened row.
 */
export async function updateAlumnus(supabase, schoolId, studentId, payload) {
  const studentPayload = {}
  const detailsPayload = {}
  for (const [key, value] of Object.entries(payload)) {
    if (STUDENT_FIELDS.includes(key)) studentPayload[key] = value
    else detailsPayload[key] = value
  }

  if (Object.keys(studentPayload).length > 0) {
    const { error } = await supabase.from('students').update(studentPayload).eq('id', studentId)
    if (error) throw new Error(error.message)
  }

  const { error: detailsError } = await supabase
    .from('student_alumni_details')
    .upsert([{ ...detailsPayload, student_id: studentId, school_id: schoolId }])
  if (detailsError) throw new Error(detailsError.message)

  const { data, error } = await supabase
    .from('students')
    .select('*, student_alumni_details(*)')
    .eq('id', studentId)
    .single()
  if (error) throw new Error(error.message)
  return flattenAlumnus(data)
}

/**
 * Permanently delete an alumnus record (not a status change).
 */
export async function deleteAlumnus(supabase, studentId) {
  const { error } = await supabase.from('students').delete().eq('id', studentId)
  if (error) throw new Error(error.message)
}

/**
 * Move an alumnus back to the student roster — a status change on the same
 * permanent record. Incidents, health, grade history, and report cards were
 * never touched by graduation, so nothing needs to be re-linked.
 */
export async function reenrollAsStudent(supabase, alumnus) {
  const { data, error } = await supabase
    .from('students')
    .update({ status: 'Applied' })
    .eq('id', alumnus.id)
    .select('*, parents(id, first_name, last_name, email, phone, address)')
    .single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Fetch donation history for a specific alumnus.
 */
export async function getAlumnusGivingHistory(supabase, studentId) {
  const { data } = await supabase
    .from('donations')
    .select('amount, date, campaign_id, payment_method, anonymous, notes')
    .eq('donor_id', studentId)
    .eq('donor_type', 'Alumni')
    .order('date', { ascending: false })
  return data || []
}
