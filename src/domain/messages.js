/**
 * Messages Domain
 *
 * Pure business logic for the Messages module.
 * No React. No Supabase. Input → output only.
 */

/**
 * Validate a compose form before sending.
 * Throws an Error with a user-facing message if invalid.
 */
export function validateMessage(form) {
  if (!form.subject || !form.subject.trim()) {
    throw new Error('Please fill in a subject.')
  }
  if (!form.body || !form.body.trim()) {
    throw new Error('Please fill in a message body.')
  }
}

/**
 * Format a UTC timestamp into a readable short date.
 * e.g. "Apr 26, 2026"
 */
export function formatMessageDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
