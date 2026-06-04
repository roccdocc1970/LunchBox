import { DollarSign, Target, Users, PartyPopper, X, MapPin, GraduationCap, AlertTriangle, HeartHandshake } from 'lucide-react'
import { useFundraising } from './hooks/useFundraising'
import {
  CAMPAIGN_TYPES, CAMPAIGN_STATUSES, EVENT_TYPES, PAYMENT_METHODS, DONOR_TYPES, TABS,
  CAMPAIGN_TYPE_COLORS, CAMPAIGN_STATUS_COLORS, DONOR_TYPE_COLORS,
  fmt, getCampaignTotal, getCampaignPct, getEventRevenue, getEventNet,
} from './domain/fundraising'

const fieldCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none'
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1'

export default function Fundraising({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'

  const {
    campaigns, donations, events, alumniProspects, loading,
    stats, donorList, lybunt, filteredDonations,
    currentYear, lastYear,
    activeTab, setActiveTab,
    showCampaignForm, campaignForm, setCampaignForm,
    selectedCampaign, setSelectedCampaign,
    savingCampaign, editingCampaign,
    openNewCampaign, openEditCampaign, saveCampaign, removeCampaign,
    showDonationForm, donationForm, setDonationForm,
    donorSearch, donorResults,
    savingDonation, donationError,
    donationFilter, setDonationFilter,
    openDonationForm, handleDonorTypeChange, handleDonorSearch, selectDonor,
    saveDonation, handleToggleReceipt,
    showEventForm, setShowEventForm, eventForm, setEventForm,
    savingEvent, saveEvent,
    getAlumnusGiven,
  } = useFundraising(user.id)

  if (loading) return <div className="p-8 text-gray-500">Loading fundraising data…</div>

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 m-0 flex items-center gap-2.5"><HeartHandshake size={22} style={{ color: primaryColor }} />Fundraising</h2>
          <p className="text-gray-500 mt-1 mb-0">Campaigns, donations, events, and donor relationships</p>
        </div>
        {activeTab === 'campaigns' && (
          <button onClick={openNewCampaign} className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
            {showCampaignForm && !editingCampaign ? 'Cancel' : '+ New Campaign'}
          </button>
        )}
        {activeTab === 'events' && (
          <button onClick={() => setShowEventForm(f => !f)} className="text-white border-0 rounded-lg px-5 py-2.5 font-semibold cursor-pointer hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
            {showEventForm ? 'Cancel' : '+ New Event'}
          </button>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-7 bg-gray-100 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 rounded-lg border-0 cursor-pointer text-sm transition-all ${activeTab === tab.id ? 'font-semibold text-white' : 'font-normal text-gray-500'}`}
            style={{ background: activeTab === tab.id ? primaryColor : 'transparent' }}
          >
            {(() => { const Icon = { Target, DollarSign, PartyPopper, Users }[tab.icon]; return Icon ? <Icon size={14} className="inline mr-1.5" /> : null })()}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Campaigns Tab ── */}
      {activeTab === 'campaigns' && (
        <>
          {/* Stats */}
          <div className="flex gap-4 mb-6 flex-wrap">
            {[
              { label: 'Total Raised',     value: fmt(stats.totalRaised),  color: '#10b981' },
              { label: 'Active Campaigns', value: stats.activeCampaigns,   color: primaryColor },
              { label: 'Total Donors',     value: stats.uniqueDonors,      color: '#8b5cf6' },
              { label: 'Events',           value: stats.eventCount,        color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="font-semibold text-gray-800">{s.value}</span>
                <span className="text-gray-500 text-sm">{s.label}</span>
              </div>
            ))}
          </div>

          {showCampaignForm && (
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <h3 className="m-0 mb-5 text-base font-bold text-gray-800">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h3>
              <div className="grid gap-4 mb-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                <div className="col-span-2">
                  <label className={labelCls}>Campaign Name *</label>
                  <input value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="e.g. Annual Fund 2026" className={fieldCls} />
                </div>
                <div><label className={labelCls}>Type</label><select value={campaignForm.type} onChange={e => setCampaignForm({ ...campaignForm, type: e.target.value })} className={fieldCls}>{CAMPAIGN_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className={labelCls}>Status</label><select value={campaignForm.status} onChange={e => setCampaignForm({ ...campaignForm, status: e.target.value })} className={fieldCls}>{CAMPAIGN_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
                <div><label className={labelCls}>Goal ($)</label><input type="number" value={campaignForm.goal} onChange={e => setCampaignForm({ ...campaignForm, goal: e.target.value })} placeholder="10000" className={fieldCls} /></div>
                <div><label className={labelCls}>Start Date</label><input type="date" value={campaignForm.start_date} onChange={e => setCampaignForm({ ...campaignForm, start_date: e.target.value })} className={fieldCls} /></div>
                <div><label className={labelCls}>End Date</label><input type="date" value={campaignForm.end_date} onChange={e => setCampaignForm({ ...campaignForm, end_date: e.target.value })} className={fieldCls} /></div>
                <div className="col-span-full"><label className={labelCls}>Description</label><textarea value={campaignForm.description} onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={2} className={`${fieldCls} resize-y`} /></div>
              </div>
              <button onClick={saveCampaign} disabled={savingCampaign || !campaignForm.name} className="text-white border-0 rounded-lg px-6 py-2.5 font-semibold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                {savingCampaign ? 'Saving…' : editingCampaign ? 'Save Changes' : 'Create Campaign'}
              </button>
            </div>
          )}

          {/* Campaign Cards */}
          {campaigns.length === 0 ? (
            <p className="text-gray-400">No campaigns yet. Create your first one above.</p>
          ) : (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
              {campaigns.map(c => {
                const raised = getCampaignTotal(donations, c.id)
                const pct    = getCampaignPct(raised, c.goal)
                const color  = CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280'
                return (
                  <div key={c.id} onClick={() => setSelectedCampaign(c)}
                    className="bg-white rounded-2xl p-5 shadow-sm border-t-4 cursor-pointer hover:shadow-md transition-shadow"
                    style={{ borderTopColor: color }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-gray-800">{c.name}</div>
                        <div className="text-xs font-semibold mt-0.5" style={{ color }}>{c.type}</div>
                      </div>
                      <span className="text-xs font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap" style={{ color: CAMPAIGN_STATUS_COLORS[c.status], background: (CAMPAIGN_STATUS_COLORS[c.status] || '#6b7280') + '18' }}>{c.status}</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-800 mb-2">{fmt(raised)}</div>
                    {pct !== null ? (
                      <>
                        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                          <span>{pct}% of {fmt(c.goal)} goal</span>
                          <span>{fmt(c.goal - raised)} remaining</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : color }} />
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-400">No goal set</div>
                    )}
                    {(c.start_date || c.end_date) && (
                      <div className="text-xs text-gray-400 mt-2.5">
                        {c.start_date && c.end_date ? `${c.start_date} → ${c.end_date}` : c.start_date || c.end_date}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Campaign Drawer */}
          {selectedCampaign && (
            <div onClick={e => { if (e.target === e.currentTarget) setSelectedCampaign(null) }}
              className="fixed inset-0 bg-black/40 z-50 flex justify-end">
              <div className="w-[460px] bg-white h-full overflow-y-auto shadow-2xl">
                <div className="p-6 text-white" style={{ background: CAMPAIGN_TYPE_COLORS[selectedCampaign.type] || primaryColor }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-lg font-bold">{selectedCampaign.name}</div>
                      <div className="text-sm opacity-85 mt-0.5">{selectedCampaign.type}</div>
                    </div>
                    <button onClick={() => setSelectedCampaign(null)} className="bg-white/20 border-0 text-white rounded-lg px-3 py-1 cursor-pointer hover:bg-white/30 flex items-center"><X size={16} /></button>
                  </div>
                  {(() => {
                    const raised = getCampaignTotal(donations, selectedCampaign.id)
                    const pct    = getCampaignPct(raised, selectedCampaign.goal)
                    const count  = donations.filter(d => d.campaign_id === selectedCampaign.id).length
                    return (
                      <>
                        <div className={`mt-4 flex gap-6 ${pct !== null ? 'mb-4' : ''}`}>
                          <div><div className="text-3xl font-bold">{fmt(raised)}</div><div className="text-xs opacity-80">raised{selectedCampaign.goal ? ` of ${fmt(selectedCampaign.goal)} goal` : ''}</div></div>
                          <div><div className="text-3xl font-bold">{count}</div><div className="text-xs opacity-80">donations</div></div>
                          {pct !== null && <div><div className="text-3xl font-bold">{pct}%</div><div className="text-xs opacity-80">of goal</div></div>}
                        </div>
                        {pct !== null && (
                          <div>
                            <div className="bg-white/25 rounded-full h-2.5 overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 100 ? '#34d399' : 'white' }} />
                            </div>
                            <div className="flex justify-between text-xs opacity-75 mt-1">
                              <span>{fmt(raised)} raised</span>
                              <span>{fmt(Math.max(0, selectedCampaign.goal - raised))} to go</span>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>

                <div className="p-6">
                  {selectedCampaign.description && <p className="text-gray-500 text-sm mt-0">{selectedCampaign.description}</p>}
                  <div className="flex gap-2 mb-5">
                    <button onClick={() => openEditCampaign(selectedCampaign)} className="flex-1 text-white border-0 rounded-lg py-2 font-semibold cursor-pointer text-sm hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>Edit</button>
                    <button onClick={() => { if (window.confirm('Delete this campaign?')) removeCampaign(selectedCampaign.id) }} className="bg-white text-red-500 border border-red-400 rounded-lg px-4 py-2 font-semibold cursor-pointer text-sm hover:bg-red-50">Delete</button>
                  </div>

                  {(() => {
                    const campDonations = donations.filter(d => d.campaign_id === selectedCampaign.id)
                    const campEvents    = events.filter(e => e.campaign_id === selectedCampaign.id)
                    const donationTotal = campDonations.reduce((s, d) => s + (d.amount || 0), 0)
                    const eventTotal    = campEvents.reduce((s, e) => s + getEventRevenue(e), 0)
                    const hasMultiple   = campDonations.length > 0 && campEvents.length > 0
                    return (
                      <>
                        {hasMultiple && (
                          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 flex gap-6">
                            {[['Donations', fmt(donationTotal), '#10b981'], ['Events', fmt(eventTotal), '#f59e0b'], ['Total', fmt(donationTotal + eventTotal), '#1f2937']].map(([l, v, c]) => (
                              <div key={l}>
                                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{l}</div>
                                <div className="font-bold text-base" style={{ color: c }}>{v}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        <h4 className="text-sm font-bold text-gray-800 m-0 mb-3">Donations</h4>
                        {campDonations.length === 0 ? <p className="text-gray-400 text-sm">No donations yet for this campaign.</p> : (
                          <div className="flex flex-col gap-2 mb-5">
                            {campDonations.map(d => (
                              <div key={d.id} className="flex justify-between items-center px-3 py-2.5 bg-gray-50 rounded-lg">
                                <div>
                                  <div className="font-semibold text-sm text-gray-800">{d.anonymous ? 'Anonymous' : d.donor_name}</div>
                                  <div className="text-xs text-gray-400">{d.date} · {d.payment_method}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-green-600">{fmt(d.amount)}</div>
                                  <span className="text-xs" style={{ color: DONOR_TYPE_COLORS[d.donor_type] }}>{d.donor_type}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        <h4 className="text-sm font-bold text-gray-800 m-0 mb-3">Linked Events</h4>
                        {campEvents.length === 0 ? <p className="text-gray-400 text-sm">No events linked to this campaign.</p> : (
                          <div className="flex flex-col gap-2">
                            {campEvents.map(ev => {
                              const net = getEventNet(ev)
                              return (
                                <div key={ev.id} className="px-3 py-2.5 bg-amber-50 rounded-lg border border-amber-200">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-semibold text-sm text-gray-800">{ev.name}</div>
                                      <div className="text-xs text-gray-400">{ev.type}{ev.date ? ` · ${ev.date}` : ''}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-amber-600">{fmt(net)} net</div>
                                      {ev.expenses > 0 && <div className="text-xs text-gray-400">{fmt(getEventRevenue(ev))} gross − {fmt(ev.expenses)} exp</div>}
                                    </div>
                                  </div>
                                  {ev.tickets_sold > 0 && <div className="text-xs text-amber-800 mt-1">{ev.tickets_sold} tickets @ {fmt(ev.ticket_price || 0)}{ev.sponsorship_revenue > 0 ? ` + ${fmt(ev.sponsorship_revenue)} sponsorship` : ''}</div>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Donations Tab ── */}
      {activeTab === 'donations' && (
        <>
          <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
            <div className="flex gap-2">
              {['all', ...DONOR_TYPES].map(f => (
                <button key={f} onClick={() => setDonationFilter(f)}
                  className={`px-3.5 py-1.5 rounded-lg border text-sm cursor-pointer transition-all ${donationFilter === f ? 'font-semibold text-white' : 'font-normal text-gray-500 bg-white border-gray-300'}`}
                  style={donationFilter === f ? { background: primaryColor, borderColor: primaryColor } : undefined}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
            <button onClick={openDonationForm} className="text-white border-0 rounded-lg px-5 py-2 font-semibold cursor-pointer hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
              {showDonationForm ? 'Cancel' : '+ Log Donation'}
            </button>
          </div>

          {showDonationForm && (
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <h3 className="m-0 mb-5 text-base font-bold text-gray-800">Log Donation</h3>
              <div className="grid gap-4 mb-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                <div><label className={labelCls}>Campaign</label><select value={donationForm.campaign_id} onChange={e => setDonationForm({ ...donationForm, campaign_id: e.target.value })} className={fieldCls}><option value="">No campaign</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className={labelCls}>Donor Type *</label><select value={donationForm.donor_type} onChange={e => handleDonorTypeChange(e.target.value)} className={fieldCls}>{DONOR_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>

                {donationForm.donor_type !== 'External' ? (
                  <div className="relative">
                    <label className={labelCls}>Search {donationForm.donor_type} *</label>
                    <input value={donorSearch} onChange={e => handleDonorSearch(e.target.value, donationForm.donor_type)}
                      placeholder={donationForm.donor_id ? donationForm.donor_name : `Search ${donationForm.donor_type.toLowerCase()}s…`}
                      className={`${fieldCls} ${donationForm.donor_id ? 'border-green-500' : 'border-gray-300'}`} />
                    {donorResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-lg z-20 shadow-md">
                        {donorResults.map(r => (
                          <div key={r.id} onClick={() => selectDonor(r)} className="px-3 py-2.5 cursor-pointer text-sm border-b border-gray-100 hover:bg-gray-50 last:border-b-0">
                            <span className="font-medium">{r.name}</span>
                            {r.sub && <span className="text-gray-400 ml-2 text-xs">{r.sub}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div><label className={labelCls}>Donor Name *</label><input value={donationForm.donor_name} onChange={e => setDonationForm({ ...donationForm, donor_name: e.target.value })} placeholder="Full name or organization" className={fieldCls} /></div>
                    <div><label className={labelCls}>Email</label><input value={donationForm.donor_email} onChange={e => setDonationForm({ ...donationForm, donor_email: e.target.value })} placeholder="donor@email.com" className={fieldCls} /></div>
                  </>
                )}

                <div><label className={labelCls}>Amount ($) *</label><input type="number" value={donationForm.amount} onChange={e => setDonationForm({ ...donationForm, amount: e.target.value })} placeholder="500" className={fieldCls} /></div>
                <div><label className={labelCls}>Date</label><input type="date" value={donationForm.date} onChange={e => setDonationForm({ ...donationForm, date: e.target.value })} className={fieldCls} /></div>
                <div><label className={labelCls}>Payment Method</label><select value={donationForm.payment_method} onChange={e => setDonationForm({ ...donationForm, payment_method: e.target.value })} className={fieldCls}>{PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}</select></div>

                <div className="col-span-full flex gap-6 flex-wrap">
                  {[['anonymous', 'Anonymous gift'], ['receipt_sent', 'Receipt sent'], ['restricted', 'Restricted gift']].map(([field, label]) => (
                    <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={donationForm[field]} onChange={e => setDonationForm({ ...donationForm, [field]: e.target.checked })} />
                      {label}
                    </label>
                  ))}
                </div>
                {donationForm.restricted && (
                  <div className="col-span-full"><label className={labelCls}>Restriction Note</label><input value={donationForm.restriction_note} onChange={e => setDonationForm({ ...donationForm, restriction_note: e.target.value })} placeholder="e.g. For library renovation only" className={fieldCls} /></div>
                )}
                <div className="col-span-full"><label className={labelCls}>Notes</label><textarea value={donationForm.notes} onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })} rows={2} className={`${fieldCls} resize-y`} /></div>
              </div>
              <button onClick={saveDonation} disabled={savingDonation} className="text-white border-0 rounded-lg px-6 py-2.5 font-semibold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                {savingDonation ? 'Saving…' : 'Log Donation'}
              </button>
              {donationError && <p className="text-red-500 text-sm mt-2 mb-0">{donationError}</p>}
            </div>
          )}

          {filteredDonations.length === 0 ? (
            <p className="text-gray-400">No donations yet.</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-100">
                    {['Donor', 'Type', 'Campaign', 'Amount', 'Date', 'Method', 'Receipt'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 font-semibold text-xs whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredDonations.map(d => {
                    const campaign = campaigns.find(c => c.id === d.campaign_id)
                    return (
                      <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-2.5 font-medium text-gray-800 whitespace-nowrap">{d.anonymous ? 'Anonymous' : d.donor_name}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: DONOR_TYPE_COLORS[d.donor_type], background: (DONOR_TYPE_COLORS[d.donor_type] || '#6b7280') + '18' }}>{d.donor_type}</span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500 text-xs">{campaign?.name || '—'}</td>
                        <td className="px-4 py-2.5 font-bold text-green-600 whitespace-nowrap">{fmt(d.amount)}</td>
                        <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{d.date}</td>
                        <td className="px-4 py-2.5 text-gray-500">{d.payment_method}</td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => handleToggleReceipt(d.id, d.receipt_sent)}
                            className={`text-xs font-semibold border rounded-md px-2 py-0.5 cursor-pointer transition-colors bg-transparent ${d.receipt_sent ? 'text-green-500 border-green-500' : 'text-gray-400 border-gray-300'}`}>
                            {d.receipt_sent ? <><Check size={11} className="inline mr-0.5" />Sent</> : 'Mark Sent'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Events Tab ── */}
      {activeTab === 'events' && (
        <>
          <div className="hidden">
            <button onClick={() => setShowEventForm(f => !f)}>
              {showEventForm ? 'Cancel' : '+ New Event'}
            </button>
          </div>

          {showEventForm && (
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <h3 className="m-0 mb-5 text-base font-bold text-gray-800">New Fundraising Event</h3>
              <div className="grid gap-4 mb-4 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                <div className="col-span-2"><label className={labelCls}>Event Name *</label><input value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} placeholder="e.g. Spring Gala 2026" className={fieldCls} /></div>
                <div><label className={labelCls}>Type</label><select value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })} className={fieldCls}>{EVENT_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
                <div><label className={labelCls}>Linked Campaign</label><select value={eventForm.campaign_id} onChange={e => setEventForm({ ...eventForm, campaign_id: e.target.value })} className={fieldCls}><option value="">None</option>{campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                <div><label className={labelCls}>Date</label><input type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} className={fieldCls} /></div>
                <div><label className={labelCls}>Venue</label><input value={eventForm.venue} onChange={e => setEventForm({ ...eventForm, venue: e.target.value })} placeholder="Location" className={fieldCls} /></div>
                <div><label className={labelCls}>Revenue Goal ($)</label><input type="number" value={eventForm.goal} onChange={e => setEventForm({ ...eventForm, goal: e.target.value })} placeholder="5000" className={fieldCls} /></div>
                <div><label className={labelCls}>Ticket Price ($)</label><input type="number" value={eventForm.ticket_price} onChange={e => setEventForm({ ...eventForm, ticket_price: e.target.value })} placeholder="100" className={fieldCls} /></div>
                <div><label className={labelCls}>Tickets Sold</label><input type="number" value={eventForm.tickets_sold} onChange={e => setEventForm({ ...eventForm, tickets_sold: parseInt(e.target.value) || 0 })} className={fieldCls} /></div>
                <div><label className={labelCls}>Sponsorship Revenue ($)</label><input type="number" value={eventForm.sponsorship_revenue} onChange={e => setEventForm({ ...eventForm, sponsorship_revenue: parseFloat(e.target.value) || 0 })} className={fieldCls} /></div>
                <div><label className={labelCls}>Expenses ($)</label><input type="number" value={eventForm.expenses} onChange={e => setEventForm({ ...eventForm, expenses: parseFloat(e.target.value) || 0 })} className={fieldCls} /></div>
                <div className="col-span-full"><label className={labelCls}>Notes</label><textarea value={eventForm.notes} onChange={e => setEventForm({ ...eventForm, notes: e.target.value })} rows={2} className={`${fieldCls} resize-y`} /></div>
              </div>
              <button onClick={saveEvent} disabled={savingEvent || !eventForm.name} className="text-white border-0 rounded-lg px-6 py-2.5 font-semibold cursor-pointer disabled:opacity-70 hover:opacity-90 transition-opacity" style={{ background: primaryColor }}>
                {savingEvent ? 'Saving…' : 'Create Event'}
              </button>
            </div>
          )}

          {events.length === 0 ? (
            <p className="text-gray-400">No events yet.</p>
          ) : (
            <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
              {events.map(ev => {
                const revenue  = getEventRevenue(ev)
                const net      = getEventNet(ev)
                const pct      = getCampaignPct(revenue, ev.goal)
                const campaign = campaigns.find(c => c.id === ev.campaign_id)
                return (
                  <div key={ev.id} className="bg-white rounded-2xl p-5 shadow-sm border-t-4 border-t-amber-400">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-gray-800">{ev.name}</div>
                        <div className="text-xs text-amber-500 font-semibold">{ev.type}</div>
                      </div>
                      {ev.date && <div className="text-xs text-gray-400">{ev.date}</div>}
                    </div>
                    {ev.venue   && <div className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin size={11} />{ev.venue}</div>}
                    {campaign   && <div className="text-xs text-gray-500 mb-3 flex items-center gap-1"><Target size={11} />{campaign.name}</div>}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[['Gross', revenue, false], ['Expenses', ev.expenses || 0, false], ['Net', net, true]].map(([l, v, isNet]) => (
                        <div key={l} className="bg-gray-50 rounded-lg p-2 text-center">
                          <div className="text-sm font-bold" style={{ color: isNet ? (net >= 0 ? '#10b981' : '#ef4444') : '#1f2937' }}>{fmt(v)}</div>
                          <div className="text-xs text-gray-400">{l}</div>
                        </div>
                      ))}
                    </div>
                    {pct !== null && (
                      <>
                        <div className="text-xs text-gray-500 mb-1">{pct}% of {fmt(ev.goal)} goal</div>
                        <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? '#10b981' : '#f59e0b' }} />
                        </div>
                      </>
                    )}
                    {ev.tickets_sold > 0 && <div className="text-xs text-gray-400 mt-2">{ev.tickets_sold} tickets × {fmt(ev.ticket_price || 0)}</div>}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── Donors Tab ── */}
      {activeTab === 'donors' && (
        <>
          <div className="flex gap-4 mb-6 flex-wrap">
            {[
              { label: 'Total Donors',  value: donorList.length,                                                    color: '#8b5cf6' },
              { label: 'Alumni Donors', value: donorList.filter(d => d.donor_type === 'Alumni').length,             color: '#6366f1' },
              { label: 'LYBUNT',        value: lybunt.length,                                                       color: '#f59e0b' },
              { label: 'Prospects',     value: alumniProspects.filter(a => a.donor_status === 'Prospect').length,   color: primaryColor },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl px-5 py-3 shadow-sm flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="font-semibold text-gray-800">{s.value}</span>
                <span className="text-gray-500 text-sm">{s.label}</span>
              </div>
            ))}
          </div>

          {/* All Donors */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <h3 className="text-base font-bold text-gray-800 m-0 mb-4">All Donors — Ranked by Total Given</h3>
            {donorList.length === 0 ? <p className="text-gray-400 text-sm">No donations logged yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Donor', 'Type', 'Total Given', '# Gifts', 'Last Gift'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-gray-500 font-semibold text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {donorList.map((d, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 font-medium text-gray-800">{d.donor_name}</td>
                        <td className="px-3 py-2.5"><span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: DONOR_TYPE_COLORS[d.donor_type], background: (DONOR_TYPE_COLORS[d.donor_type] || '#6b7280') + '18' }}>{d.donor_type}</span></td>
                        <td className="px-3 py-2.5 font-bold text-green-600">{fmt(d.total)}</td>
                        <td className="px-3 py-2.5 text-gray-500">{d.count}</td>
                        <td className="px-3 py-2.5 text-gray-500">{d.lastDate || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* LYBUNT */}
          <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="text-base font-bold text-gray-800 m-0">LYBUNT — Lapsed Donors</h3>
              <span className="text-xs text-gray-500">Gave in {lastYear}, not yet in {currentYear}</span>
              {lybunt.length > 0 && <span className="text-xs font-semibold text-white bg-amber-400 rounded-full px-2 py-0.5">{lybunt.length}</span>}
            </div>
            {lybunt.length === 0 ? (
              <p className="text-gray-400 text-sm">No lapsed donors — great retention! 🎉</p>
            ) : (
              <div className="flex flex-col gap-2">
                {lybunt.map((d, i) => (
                  <div key={i} className="flex justify-between items-center px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800 text-sm">{d.donor_name}</div>
                      <div className="text-xs text-gray-400">{d.donor_type} · Last gift: {d.lastDate}</div>
                    </div>
                    <div className="font-bold text-amber-600">{fmt(d.total)} lifetime</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alumni Prospects */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 m-0 mb-4">Alumni Prospects & Lapsed Donors</h3>
            {alumniProspects.length === 0 ? (
              <p className="text-gray-400 text-sm">No alumni marked as Prospect, Active Donor, or Lapsed. Update donor status in the Alumni module.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-100">
                      {['Alumni', 'Class', 'Email', 'Status', 'Total Given'].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-gray-500 font-semibold text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {alumniProspects.map(a => {
                      const given = getAlumnusGiven(a.id)
                      const statusColors = { Prospect: '#f59e0b', 'Active Donor': '#10b981', Lapsed: '#ef4444' }
                      return (
                        <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2.5 font-medium text-gray-800">{a.first_name} {a.last_name}</td>
                          <td className="px-3 py-2.5 text-gray-500">{a.graduation_year ? `Class of ${a.graduation_year}` : '—'}</td>
                          <td className="px-3 py-2.5 text-gray-500">{a.email || '—'}</td>
                          <td className="px-3 py-2.5"><span className="text-xs font-semibold rounded-full px-2 py-0.5" style={{ color: statusColors[a.donor_status], background: (statusColors[a.donor_status] || '#6b7280') + '18' }}>{a.donor_status}</span></td>
                          <td className={`px-3 py-2.5 ${given > 0 ? 'font-bold text-green-500' : 'font-normal text-gray-400'}`}>{given > 0 ? fmt(given) : 'No gifts yet'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
