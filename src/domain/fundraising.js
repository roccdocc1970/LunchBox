/**
 * Fundraising Domain
 *
 * Pure business logic for the Fundraising module.
 * No React. No Supabase. Input → output only.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

export const CAMPAIGN_TYPES = [
  'Annual Fund', 'Capital Campaign', 'Event', 'Emergency Appeal', 'Grant', 'Scholarship', 'Other',
]

export const CAMPAIGN_STATUSES = ['Active', 'Completed', 'Paused']

export const EVENT_TYPES = [
  'Gala', 'Auction', 'Walkathon', 'Golf Tournament', 'Bake Sale', 'Raffle', 'Dinner', 'Other',
]

export const PAYMENT_METHODS = [
  'Check', 'Cash', 'Credit Card', 'Online', 'Stock', 'Wire Transfer', 'In-Kind', 'Other',
]

export const DONOR_TYPES = ['Alumni', 'Parent', 'External']

export const TABS = [
  { id: 'campaigns', label: 'Campaigns', icon: 'Target' },
  { id: 'donations', label: 'Donations', icon: 'DollarSign' },
  { id: 'events',    label: 'Events',    icon: 'PartyPopper' },
  { id: 'donors',    label: 'Donors',    icon: 'Users' },
]

export const CAMPAIGN_TYPE_COLORS = {
  'Annual Fund':      '#3b82f6',
  'Capital Campaign': '#8b5cf6',
  'Event':            '#f97316',
  'Emergency Appeal': '#ef4444',
  'Grant':            '#10b981',
  'Scholarship':      '#f59e0b',
  'Other':            '#6b7280',
}

export const CAMPAIGN_STATUS_COLORS = {
  Active:    '#10b981',
  Completed: '#3b82f6',
  Paused:    '#f59e0b',
}

export const DONOR_TYPE_COLORS = {
  Alumni:   '#8b5cf6',
  Parent:   '#3b82f6',
  External: '#6b7280',
}

export const BLANK_CAMPAIGN = {
  name: '', type: 'Annual Fund', goal: '', start_date: '', end_date: '',
  status: 'Active', description: '', notes: '',
}

export const BLANK_DONATION = {
  campaign_id: '', donor_type: 'Alumni', donor_id: '', donor_name: '', donor_email: '',
  amount: '', date: new Date().toISOString().split('T')[0],
  payment_method: 'Check', anonymous: false, receipt_sent: false,
  restricted: false, restriction_note: '', notes: '',
}

export const BLANK_EVENT = {
  campaign_id: '', name: '', type: 'Gala', date: '', venue: '', goal: '',
  ticket_price: '', tickets_sold: 0, sponsorship_revenue: 0, expenses: 0, notes: '',
}

// ─── Pure functions ───────────────────────────────────────────────────────────

/**
 * Format a number as a USD currency string.
 */
export function fmt(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/**
 * Total donations raised for a specific campaign.
 */
export function getCampaignTotal(donations, campaignId) {
  return donations.filter(d => d.campaign_id === campaignId).reduce((s, d) => s + (d.amount || 0), 0)
}

/**
 * Gross revenue for a fundraising event (tickets + sponsorship).
 */
export function getEventRevenue(ev) {
  return (ev.ticket_price || 0) * (ev.tickets_sold || 0) + (ev.sponsorship_revenue || 0)
}

/**
 * Net revenue for a fundraising event (gross minus expenses).
 */
export function getEventNet(ev) {
  return getEventRevenue(ev) - (ev.expenses || 0)
}

/**
 * Campaign progress percentage (0–100), or null if no goal set.
 */
export function getCampaignPct(raised, goal) {
  if (!goal || goal <= 0) return null
  return Math.min(100, Math.round((raised / goal) * 100))
}

/**
 * Build a unified donor map from the donations list.
 * Returns an array sorted by total given descending.
 */
export function buildDonorMap(donations) {
  const map = {}
  donations.forEach(d => {
    const key = d.donor_id || `ext:${d.donor_name}`
    if (!map[key]) {
      map[key] = {
        donor_type:  d.donor_type,
        donor_id:    d.donor_id,
        donor_name:  d.donor_name,
        donor_email: d.donor_email,
        total:       0,
        count:       0,
        lastDate:    null,
      }
    }
    map[key].total += d.amount || 0
    map[key].count++
    if (!map[key].lastDate || d.date > map[key].lastDate) map[key].lastDate = d.date
  })
  return Object.values(map).sort((a, b) => b.total - a.total)
}

/**
 * LYBUNT: donors who gave last year but not yet this year.
 */
export function calcLybunt(donorList, donations) {
  const currentYear = new Date().getFullYear()
  const lastYear    = currentYear - 1
  const thisYearKeys = new Set(
    donations.filter(d => new Date(d.date).getFullYear() === currentYear)
      .map(d => d.donor_id || `ext:${d.donor_name}`)
  )
  const lastYearKeys = new Set(
    donations.filter(d => new Date(d.date).getFullYear() === lastYear)
      .map(d => d.donor_id || `ext:${d.donor_name}`)
  )
  return donorList.filter(d => {
    const key = d.donor_id || `ext:${d.donor_name}`
    return lastYearKeys.has(key) && !thisYearKeys.has(key)
  })
}

/**
 * Summary stats for the Campaigns tab header cards.
 */
export function calcFundraisingStats(campaigns, donations, events) {
  const totalRaised     = donations.reduce((s, d) => s + (d.amount || 0), 0)
  const activeCampaigns = campaigns.filter(c => c.status === 'Active').length
  const uniqueDonors    = new Set(donations.map(d => d.donor_id || d.donor_name)).size
  return { totalRaised, activeCampaigns, uniqueDonors, eventCount: events.length }
}

/**
 * Filter donations by donor type ('all' returns everything).
 */
export function filterDonations(donations, filter) {
  if (!filter || filter === 'all') return donations
  return donations.filter(d => d.donor_type === filter)
}

/**
 * Total giving for a specific alumni ID from the donations list.
 */
export function getAlumnusTotal(donations, alumnusId) {
  return donations.filter(d => d.donor_id === alumnusId).reduce((s, d) => s + (d.amount || 0), 0)
}
