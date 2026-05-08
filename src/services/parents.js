/**
 * Parents Service
 *
 * All Supabase calls for the Parents module.
 * Accepts a Supabase client as the first argument so the same
 * functions work in both the React UI (anon client, RLS enforced)
 * and the MCP server (service-role client, RLS bypassed).
 */

/**
 * Fetch all parents for a school, with their linked students joined.
 * Sorted alphabetically by last name.
 */
export async function getParents(supabase, schoolId) {
  const { data, error } = await supabase
    .from('parents')
    .select('*, students(id, first_name, last_name, grade, status)')
    .eq('school_id', schoolId)
    .order('last_name', { ascending: true })
  if (error) throw error
  return data || []
}

/**
 * Update a parent's contact details.
 * Returns the updated parent row with students joined.
 */
export async function updateParent(supabase, parentId, fields) {
  const { data, error } = await supabase
    .from('parents')
    .update(fields)
    .eq('id', parentId)
    .select('*, students(id, first_name, last_name, grade, status)')
    .single()
  if (error) throw error
  return data
}
