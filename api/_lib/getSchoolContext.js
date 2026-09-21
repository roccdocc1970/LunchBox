/**
 * Resolves the calling user's schoolId from their own session — mirrors
 * useSchool.js's fetchSchool() logic (admin first, then linked staff).
 * Every tool handler passes this schoolId into the existing service
 * functions exactly like the browser UI and the MCP server already do.
 */

export async function getSchoolContext(supabase) {
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    const err = new Error('Not authenticated')
    err.status = 401
    throw err
  }

  const { data: school } = await supabase
    .from('schools')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (school) return { userId: user.id, schoolId: school.user_id, isStaff: false, role: null }

  const { data: staff } = await supabase
    .from('staff')
    .select('school_id, role')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (staff) return { userId: user.id, schoolId: staff.school_id, isStaff: true, role: staff.role }

  const err = new Error('No school found for this account')
  err.status = 403
  throw err
}
