/**
 * Reports Service
 *
 * Single parallel fetch for all report tab data.
 */

export async function getReportData(supabase, schoolId) {
  const [
    { data: students },
    { data: messages },
    { data: incidents },
    { data: staff },
    { data: campaigns },
    { data: donations },
    { data: fundEvents },
    { data: workOrders },
    { data: attendanceRecords },
  ] = await Promise.all([
    supabase.from('students').select('*').eq('school_id', schoolId).order('created_at', { ascending: true }),
    supabase.from('messages').select('*').eq('school_id', schoolId).order('created_at', { ascending: true }),
    supabase.from('incidents').select('*').eq('school_id', schoolId).order('date', { ascending: false }),
    supabase.from('staff').select('*').eq('school_id', schoolId).order('last_name', { ascending: true }),
    supabase.from('campaigns').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }),
    supabase.from('donations').select('*').eq('school_id', schoolId).order('date', { ascending: false }),
    supabase.from('fundraising_events').select('*').eq('school_id', schoolId).order('date', { ascending: false }),
    supabase.from('work_orders').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }),
    supabase.from('attendance').select('*').eq('school_id', schoolId).order('date', { ascending: false }),
  ])

  return {
    students:         students         || [],
    messages:         messages         || [],
    incidents:        incidents        || [],
    staff:            staff            || [],
    campaigns:        campaigns        || [],
    donations:        donations        || [],
    fundEvents:       fundEvents       || [],
    workOrders:       workOrders       || [],
    attendanceRecords: attendanceRecords || [],
  }
}
