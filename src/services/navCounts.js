/**
 * Nav Counts Service
 *
 * Fetches lightweight record counts for every nav section in one batch.
 * Used to populate nav badges and the Getting Started checklist.
 */

export async function getNavCounts(supabase, schoolId) {
  const [
    admissions, students, classes, cohorts,
    sections, reportCards, staff, parents,
    alumni, facilities, rooms, campaigns, messages,
  ] = await Promise.all([
    supabase.from('inquiries')       .select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('students')        .select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'Enrolled'),
    supabase.from('classes')         .select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'Active'),
    supabase.from('cohorts')         .select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'Active'),
    supabase.from('class_sections')  .select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('report_cards')    .select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('staff')           .select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'Active'),
    supabase.from('parents')         .select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('alumni')          .select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('work_orders')     .select('*', { count: 'exact', head: true }).eq('school_id', schoolId).in('status', ['Open', 'In Progress']),
    supabase.from('rooms')           .select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
    supabase.from('campaigns')       .select('*', { count: 'exact', head: true }).eq('school_id', schoolId).eq('status', 'Active'),
    supabase.from('messages')        .select('*', { count: 'exact', head: true }).eq('school_id', schoolId),
  ])

  return {
    admissions:  admissions.count   || 0,
    enrollment:  students.count     || 0,
    students:    students.count     || 0,
    classes:     classes.count      || 0,
    cohorts:     cohorts.count      || 0,
    schedule:    sections.count     || 0,
    reportcards: reportCards.count  || 0,
    staff:       staff.count        || 0,
    parents:     parents.count      || 0,
    alumni:      alumni.count       || 0,
    facilities:  facilities.count   || 0,
    rooms:       rooms.count        || 0,
    fundraising: campaigns.count    || 0,
    messages:    messages.count     || 0,
  }
}
