/**
 * Schedule Service
 *
 * Supabase CRUD for periods (bell schedule).
 */

export async function getPeriods(supabase, schoolId) {
  const { data } = await supabase
    .from('periods')
    .select('*')
    .eq('school_id', schoolId)
    .order('start_time', { ascending: true })
    .order('sort_order', { ascending: true })
  return data || []
}

export async function savePeriod(supabase, schoolId, period) {
  const payload = {
    school_id:    schoolId,
    name:         period.name.trim(),
    start_time:   period.start_time,
    end_time:     period.end_time,
    days_of_week: period.days_of_week,
    type:         period.type,
    sort_order:   period.sort_order || 0,
  }

  if (period.id) {
    const { data, error } = await supabase
      .from('periods')
      .update(payload)
      .eq('id', period.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  } else {
    const { data, error } = await supabase
      .from('periods')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return data
  }
}

export async function deletePeriod(supabase, periodId) {
  const { error } = await supabase
    .from('periods')
    .delete()
    .eq('id', periodId)
  if (error) throw new Error(error.message)
}
