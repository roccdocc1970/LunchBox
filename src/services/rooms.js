/**
 * Rooms Service
 *
 * Supabase CRUD for the rooms table.
 */

export async function getRooms(supabase, schoolId) {
  const { data } = await supabase
    .from('rooms')
    .select('*')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })
  return data || []
}

export async function saveRoom(supabase, schoolId, room) {
  const payload = {
    school_id: schoolId,
    name:      room.name.trim(),
    type:      room.type,
    building:  room.building?.trim() || null,
    floor:     room.floor?.trim()    || null,
    capacity:  room.capacity !== '' ? Number(room.capacity) : null,
    divisions: room.divisions?.length ? room.divisions : null,
    notes:     room.notes?.trim()    || null,
  }

  if (room.id) {
    const { data, error } = await supabase
      .from('rooms').update(payload).eq('id', room.id).select().single()
    if (error) throw new Error(error.message)
    return data
  } else {
    const { data, error } = await supabase
      .from('rooms').insert(payload).select().single()
    if (error) throw new Error(error.message)
    return data
  }
}

export async function deleteRoom(supabase, roomId) {
  const { error } = await supabase.from('rooms').delete().eq('id', roomId)
  if (error) throw new Error(error.message)
}
