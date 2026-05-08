/**
 * Buildings Service
 *
 * Supabase CRUD for the buildings table.
 */

export async function getBuildings(supabase, schoolId) {
  const { data } = await supabase
    .from('buildings')
    .select('*')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })
  return data || []
}

export async function saveBuilding(supabase, schoolId, building) {
  const payload = {
    school_id: schoolId,
    name:      building.name.trim(),
    type:      building.type,
    floors:    building.floors || [],
    notes:     building.notes?.trim() || null,
  }

  if (building.id) {
    const { data, error } = await supabase
      .from('buildings').update(payload).eq('id', building.id).select().single()
    if (error) throw new Error(error.message)
    return data
  } else {
    const { data, error } = await supabase
      .from('buildings').insert(payload).select().single()
    if (error) throw new Error(error.message)
    return data
  }
}

export async function deleteBuilding(supabase, buildingId) {
  const { error } = await supabase.from('buildings').delete().eq('id', buildingId)
  if (error) throw new Error(error.message)
}
