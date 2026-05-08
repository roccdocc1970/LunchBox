/**
 * Attendance Service
 *
 * Accepts a Supabase client as the first argument so the same functions work
 * in the React UI (anon client, RLS enforced) and the MCP server
 * (service-role client, admin access).
 */

/**
 * Fetch enrolled students for a grade alongside any existing attendance
 * records for that date, merged into a single attendanceMap.
 *
 * @param {string} grade - Grade string or '__all__' for all grades
 * @returns {{ students: object[], attendanceMap: Record<string, {status, notes}> }}
 */
export async function getStudentsWithAttendance(supabase, schoolId, { date, grade }) {
  const isAll = grade === '__all__'

  let studQ = supabase
    .from('students')
    .select('id, first_name, last_name, grade')
    .eq('school_id', schoolId)
    .eq('status', 'Enrolled')
    .order('grade')
    .order('last_name')
  if (!isAll) studQ = studQ.eq('grade', grade)

  let attQ = supabase
    .from('attendance')
    .select('*')
    .eq('school_id', schoolId)
    .eq('date', date)
  if (!isAll) attQ = attQ.eq('student_grade', grade)

  const [{ data: students, error: studErr }, { data: existing, error: attErr }] = await Promise.all([studQ, attQ])
  if (studErr) throw studErr
  if (attErr) throw attErr

  const attendanceMap = {}
  ;(existing || []).forEach(r => { attendanceMap[r.student_id] = { status: r.status, notes: r.notes || '' } })
  ;(students || []).forEach(s => { if (!attendanceMap[s.id]) attendanceMap[s.id] = { status: 'Present', notes: '' } })

  return { students: students || [], attendanceMap }
}

/**
 * Upsert a full set of attendance records for a given date.
 * Safe to call repeatedly — unique constraint on (school_id, student_id, date).
 */
export async function saveAttendance(supabase, schoolId, { students, attendanceMap, date }) {
  const rows = students.map(s => ({
    school_id: schoolId,
    student_id: s.id,
    student_name: `${s.first_name} ${s.last_name}`,
    student_grade: s.grade,
    date,
    status: attendanceMap[s.id]?.status || 'Present',
    notes: attendanceMap[s.id]?.notes || null,
  }))
  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'school_id,student_id,date' })
  if (error) throw error
}

/**
 * Query attendance history with optional filters.
 * Returns up to 500 records ordered by date desc, student name asc.
 */
export async function getAttendanceHistory(supabase, schoolId, { date, grade, status } = {}) {
  let q = supabase
    .from('attendance')
    .select('*')
    .eq('school_id', schoolId)
    .order('date', { ascending: false })
    .order('student_name', { ascending: true })
    .limit(500)
  if (date) q = q.eq('date', date)
  if (grade) q = q.eq('student_grade', grade)
  if (status) q = q.eq('status', status)
  const { data, error } = await q
  if (error) throw error
  return data || []
}
