/**
 * Messages Service
 *
 * All Supabase calls for the Messages module.
 * Accepts a Supabase client as the first argument so the same
 * functions work in both the React UI (anon client, RLS enforced)
 * and the MCP server (service-role client, RLS bypassed).
 */

/**
 * Fetch all messages for a school, newest first.
 */
export async function getMessages(supabase, schoolId) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Fetch all parent email addresses for a school.
 * Filters out parents with no email set.
 */
export async function getParentEmails(supabase, schoolId) {
  const { data, error } = await supabase
    .from('parents')
    .select('email, first_name, last_name')
    .eq('school_id', schoolId)
    .not('email', 'is', null)
  if (error) throw error
  return (data || []).filter(p => p.email)
}

/**
 * Save a sent message record to the database.
 */
export async function saveMessage(supabase, schoolId, { subject, body, recipientCount }) {
  const { error } = await supabase
    .from('messages')
    .insert([{
      subject,
      body,
      recipient_count: recipientCount,
      school_id: schoolId,
      status: 'Sent',
    }])
  if (error) throw error
}
