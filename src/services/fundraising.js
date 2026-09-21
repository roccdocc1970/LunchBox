/**
 * Fundraising Service
 *
 * All Supabase calls for the Fundraising module.
 * Takes a supabase client as first arg — works with both anon (UI) and service-role (MCP).
 */

/**
 * Fetch all fundraising data in parallel.
 */
export async function getFundraisingData(supabase, schoolId) {
  const [{ data: campaigns }, { data: donations }, { data: events }, { data: prospects }] = await Promise.all([
    supabase.from('campaigns').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }),
    supabase.from('donations').select('*').eq('school_id', schoolId).order('date', { ascending: false }),
    supabase.from('fundraising_events').select('*').eq('school_id', schoolId).order('date', { ascending: false }),
    supabase.from('students').select('id, first_name, last_name, student_alumni_details!inner(email, donor_status, graduation_year)')
      .eq('school_id', schoolId).eq('status', 'Alumni')
      .in('student_alumni_details.donor_status', ['Prospect', 'Active Donor', 'Lapsed']),
  ])
  return {
    campaigns:       campaigns  || [],
    donations:       donations  || [],
    events:          events     || [],
    alumniProspects: (prospects || [])
      .filter(a => a.student_alumni_details)
      .map(a => ({ id: a.id, first_name: a.first_name, last_name: a.last_name, ...a.student_alumni_details })),
  }
}

/**
 * Fetch donation history tied to one student's family — donations made as a
 * parent (donor_id = parent_id) plus, once the student is an alumnus,
 * donations made as themself (donor_id = student id, donor_type 'Alumni').
 * Used by the student timeline.
 */
export async function getDonationsForFamily(supabase, { parentId, studentId }) {
  const queries = []
  if (parentId) {
    queries.push(supabase.from('donations').select('*').eq('donor_type', 'Parent').eq('donor_id', parentId))
  }
  if (studentId) {
    queries.push(supabase.from('donations').select('*').eq('donor_type', 'Alumni').eq('donor_id', studentId))
  }
  if (queries.length === 0) return []
  const results = await Promise.all(queries)
  return results.flatMap(r => r.data || [])
}

/**
 * Create a new campaign.
 */
export async function createCampaign(supabase, schoolId, form) {
  const { error } = await supabase.from('campaigns').insert([{
    ...form,
    goal:      form.goal      || null,
    school_id: schoolId,
  }])
  if (error) throw new Error(error.message)
}

/**
 * Update an existing campaign. Returns the updated row.
 */
export async function updateCampaign(supabase, id, form) {
  const { data, error } = await supabase.from('campaigns').update({
    ...form,
    goal: form.goal || null,
  }).eq('id', id).select().single()
  if (error) throw new Error(error.message)
  return data
}

/**
 * Delete a campaign.
 */
export async function deleteCampaign(supabase, id) {
  const { error } = await supabase.from('campaigns').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Search alumni or parents for the donor search field.
 * Returns normalized { id, name, sub, email } results.
 */
export async function searchDonors(supabase, schoolId, query, type) {
  if (!query || query.length < 1) return []
  if (type === 'Alumni') {
    const { data } = await supabase.from('students')
      .select('id, first_name, last_name, student_alumni_details!inner(email, graduation_year)')
      .eq('school_id', schoolId).eq('status', 'Alumni')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,student_alumni_details.email.ilike.%${query}%`)
      .limit(8)
    return (data || []).map(a => ({
      id:    a.id,
      name:  `${a.first_name} ${a.last_name}`,
      sub:   a.student_alumni_details?.graduation_year ? `Class of ${a.student_alumni_details.graduation_year}` : '',
      email: a.student_alumni_details?.email || '',
    }))
  }
  if (type === 'Parent') {
    const { data } = await supabase.from('parents')
      .select('id, first_name, last_name, email')
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('school_id', schoolId).limit(8)
    return (data || []).map(p => ({
      id:    p.id,
      name:  `${p.first_name} ${p.last_name}`,
      sub:   'Parent',
      email: p.email || '',
    }))
  }
  return []
}

/**
 * Log a new donation.
 */
export async function createDonation(supabase, schoolId, form) {
  const { error } = await supabase.from('donations').insert([{
    ...form,
    amount:    parseFloat(form.amount),
    school_id: schoolId,
  }])
  if (error) throw new Error(error.message)
}

/**
 * Toggle receipt_sent on a donation.
 */
export async function toggleReceipt(supabase, id, current) {
  const { error } = await supabase.from('donations').update({ receipt_sent: !current }).eq('id', id)
  if (error) throw new Error(error.message)
}

/**
 * Create a new fundraising event.
 */
export async function createEvent(supabase, schoolId, form) {
  const { error } = await supabase.from('fundraising_events').insert([{
    ...form,
    goal:         form.goal         || null,
    ticket_price: form.ticket_price || null,
    school_id:    schoolId,
  }])
  if (error) throw new Error(error.message)
}
