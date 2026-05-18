/**
 * Classes Service
 *
 * Supabase CRUD for the classes table.
 */

export async function getClasses(supabase, schoolId) {
  const { data } = await supabase
    .from('classes')
    .select('*')
    .eq('school_id', schoolId)
    .order('name', { ascending: true })
  return data || []
}

export async function saveClass(supabase, schoolId, cls) {
  const payload = {
    school_id:       schoolId,
    name:            cls.name.trim(),
    subject:         cls.subject         || null,
    division:        cls.division        || null,
    teacher_id:      cls.teacher_id      || null,
    teacher_name:    cls.teacher_name    || null,
    room_id:         cls.room_id         || null,
    room_name:       cls.room_name       || null,
    class_size:      cls.class_size      ? parseInt(cls.class_size, 10) : null,
    enrollment_mode: cls.enrollment_mode || 'open',
    description:     cls.description?.trim() || null,
    notes:           cls.notes?.trim()        || null,
    status:          cls.status || 'Active',
  }

  if (cls.id) {
    const { data, error } = await supabase
      .from('classes').update(payload).eq('id', cls.id).select().single()
    if (error) throw new Error(error.message)
    return data
  } else {
    const { data, error } = await supabase
      .from('classes').insert(payload).select().single()
    if (error) throw new Error(error.message)
    return data
  }
}

export async function deleteClass(supabase, classId) {
  const { error } = await supabase.from('classes').delete().eq('id', classId)
  if (error) throw new Error(error.message)
}
