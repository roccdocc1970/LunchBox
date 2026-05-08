import { useFundraising } from './hooks/useFundraising'
import {
  CAMPAIGN_TYPES, CAMPAIGN_STATUSES, EVENT_TYPES, PAYMENT_METHODS, DONOR_TYPES, TABS,
  CAMPAIGN_TYPE_COLORS, CAMPAIGN_STATUS_COLORS, DONOR_TYPE_COLORS,
  fmt, getCampaignTotal, getCampaignPct, getEventRevenue, getEventNet,
} from './domain/fundraising'

const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }
const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }

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

  if (loading) return <div style={{ padding: '2rem', color: '#6b7280' }}>Loading fundraising data…</div>

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Fundraising</h2>
        <p style={{ color: '#6b7280', marginTop: '0.25rem', marginBottom: 0 }}>Campaigns, donations, events, and donor relationships</p>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', background: '#f3f4f6', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer', fontSize: '0.875rem',
            fontWeight: activeTab === tab.id ? '600' : '400',
            background: activeTab === tab.id ? primaryColor : 'transparent',
            color: activeTab === tab.id ? 'white' : '#6b7280',
            boxShadow: activeTab === tab.id ? `0 1px 3px ${primaryColor}40` : 'none',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* ── Campaigns Tab ── */}
      {activeTab === 'campaigns' && (
        <>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Raised',      value: fmt(stats.totalRaised),     icon: '💰', color: '#10b981' },
              { label: 'Active Campaigns',  value: stats.activeCampaigns,      icon: '🎯', color: primaryColor },
              { label: 'Total Donors',      value: stats.uniqueDonors,         icon: '👥', color: '#8b5cf6' },
              { label: 'Events',            value: stats.eventCount,           icon: '🎉', color: '#f59e0b' },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* New Campaign Button */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={openNewCampaign}
              style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer' }}>
              {showCampaignForm && !editingCampaign ? 'Cancel' : '+ New Campaign'}
            </button>
          </div>

          {showCampaignForm && (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Campaign Name *</label>
                  <input value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="e.g. Annual Fund 2026" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={campaignForm.type} onChange={e => setCampaignForm({ ...campaignForm, type: e.target.value })} style={inputStyle}>
                    {CAMPAIGN_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={campaignForm.status} onChange={e => setCampaignForm({ ...campaignForm, status: e.target.value })} style={inputStyle}>
                    {CAMPAIGN_STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Goal ($)</label>
                  <input type="number" value={campaignForm.goal} onChange={e => setCampaignForm({ ...campaignForm, goal: e.target.value })} placeholder="10000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Start Date</label>
                  <input type="date" value={campaignForm.start_date} onChange={e => setCampaignForm({ ...campaignForm, start_date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>End Date</label>
                  <input type="date" value={campaignForm.end_date} onChange={e => setCampaignForm({ ...campaignForm, end_date: e.target.value })} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Description</label>
                  <textarea value={campaignForm.description} onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
              <button onClick={saveCampaign} disabled={savingCampaign || !campaignForm.name}
                style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer' }}>
                {savingCampaign ? 'Saving…' : editingCampaign ? 'Save Changes' : 'Create Campaign'}
              </button>
            </div>
          )}

          {/* Campaign Cards */}
          {campaigns.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No campaigns yet. Create your first one above.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {campaigns.map(c => {
                const raised = getCampaignTotal(donations, c.id)
                const pct    = getCampaignPct(raised, c.goal)
                const color  = CAMPAIGN_TYPE_COLORS[c.type] || '#6b7280'
                return (
                  <div key={c.id} onClick={() => setSelectedCampaign(c)}
                    style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${color}`, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '1rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.8rem', color, fontWeight: '600', marginTop: '0.15rem' }}>{c.type}</div>
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', color: CAMPAIGN_STATUS_COLORS[c.status], background: (CAMPAIGN_STATUS_COLORS[c.status] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.2rem 0.6rem', whiteSpace: 'nowrap' }}>{c.status}</span>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>{fmt(raised)}</div>
                    {pct !== null ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.375rem' }}>
                          <span>{pct}% of {fmt(c.goal)} goal</span>
                          <span>{fmt(c.goal - raised)} remaining</span>
                        </div>
                        <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#10b981' : color, borderRadius: '9999px', transition: 'width 0.4s' }} />
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>No goal set</div>
                    )}
                    {(c.start_date || c.end_date) && (
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.625rem' }}>
                        {c.start_date && c.end_date ? `${c.start_date} → ${c.end_date}` : c.start_date || c.end_date}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Campaign Detail Drawer */}
          {selectedCampaign && (
            <div onClick={e => { if (e.target === e.currentTarget) setSelectedCampaign(null) }}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ width: '460px', background: 'white', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>
                <div style={{ background: CAMPAIGN_TYPE_COLORS[selectedCampaign.type] || primaryColor, padding: '1.5rem', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{selectedCampaign.name}</div>
                      <div style={{ fontSize: '0.85rem', opacity: 0.85, marginTop: '0.15rem' }}>{selectedCampaign.type}</div>
                    </div>
                    <button onClick={() => setSelectedCampaign(null)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '0.5rem', padding: '0.25rem 0.75rem', cursor: 'pointer' }}>✕</button>
                  </div>
                  {(() => {
                    const raised = getCampaignTotal(donations, selectedCampaign.id)
                    const pct    = getCampaignPct(raised, selectedCampaign.goal)
                    const count  = donations.filter(d => d.campaign_id === selectedCampaign.id).length
                    return (
                      <>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '1.5rem', marginBottom: pct !== null ? '1rem' : 0 }}>
                          <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{fmt(raised)}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>raised{selectedCampaign.goal ? ` of ${fmt(selectedCampaign.goal)} goal` : ''}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{count}</div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>donations</div>
                          </div>
                          {pct !== null && (
                            <div>
                              <div style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{pct}%</div>
                              <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>of goal</div>
                            </div>
                          )}
                        </div>
                        {pct !== null && (
                          <div>
                            <div style={{ background: 'rgba(255,255,255,0.25)', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#34d399' : 'white', borderRadius: '9999px', transition: 'width 0.4s' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', opacity: 0.75, marginTop: '0.3rem' }}>
                              <span>{fmt(raised)} raised</span>
                              <span>{fmt(Math.max(0, selectedCampaign.goal - raised))} to go</span>
                            </div>
                          </div>
                        )}
                      </>
                    )
                  })()}
                </div>

                <div style={{ padding: '1.5rem' }}>
                  {selectedCampaign.description && <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 0 }}>{selectedCampaign.description}</p>}

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                    <button onClick={() => openEditCampaign(selectedCampaign)}
                      style={{ flex: 1, background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>Edit</button>
                    <button onClick={() => { if (window.confirm('Delete this campaign?')) removeCampaign(selectedCampaign.id) }}
                      style={{ background: 'white', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>Delete</button>
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
                          <div style={{ background: '#f9fafb', borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem', display: 'flex', gap: '1.5rem' }}>
                            {[['Donations', fmt(donationTotal), '#10b981'], ['Events', fmt(eventTotal), '#f59e0b'], ['Total', fmt(donationTotal + eventTotal), '#1f2937']].map(([l, v, c]) => (
                              <div key={l}>
                                <div style={{ fontSize: '0.7rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</div>
                                <div style={{ fontWeight: '700', color: c, fontSize: '1rem' }}>{v}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.75rem' }}>Donations</h4>
                        {campDonations.length === 0 ? (
                          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No donations yet for this campaign.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                            {campDonations.map(d => (
                              <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: '#f9fafb', borderRadius: '0.5rem' }}>
                                <div>
                                  <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1f2937' }}>{d.anonymous ? 'Anonymous' : d.donor_name}</div>
                                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{d.date} · {d.payment_method}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontWeight: '700', color: '#10b981' }}>{fmt(d.amount)}</div>
                                  <span style={{ fontSize: '0.7rem', color: DONOR_TYPE_COLORS[d.donor_type] }}>{d.donor_type}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <h4 style={{ fontSize: '0.875rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.75rem' }}>Linked Events</h4>
                        {campEvents.length === 0 ? (
                          <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No events linked to this campaign.</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {campEvents.map(ev => {
                              const gross = getEventRevenue(ev)
                              const net   = getEventNet(ev)
                              return (
                                <div key={ev.id} style={{ padding: '0.625rem 0.75rem', background: '#fffbeb', borderRadius: '0.5rem', border: '1px solid #fde68a' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                      <div style={{ fontWeight: '600', fontSize: '0.875rem', color: '#1f2937' }}>{ev.name}</div>
                                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{ev.type}{ev.date ? ` · ${ev.date}` : ''}</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontWeight: '700', color: '#f59e0b' }}>{fmt(net)} net</div>
                                      {ev.expenses > 0 && <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{fmt(gross)} gross − {fmt(ev.expenses)} exp</div>}
                                    </div>
                                  </div>
                                  {ev.tickets_sold > 0 && (
                                    <div style={{ fontSize: '0.75rem', color: '#92400e', marginTop: '0.25rem' }}>
                                      {ev.tickets_sold} tickets @ {fmt(ev.ticket_price || 0)}{ev.sponsorship_revenue > 0 ? ` + ${fmt(ev.sponsorship_revenue)} sponsorship` : ''}
                                    </div>
                                  )}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {['all', ...DONOR_TYPES].map(f => (
                <button key={f} onClick={() => setDonationFilter(f)} style={{ padding: '0.375rem 0.875rem', borderRadius: '0.5rem', border: '1px solid', fontSize: '0.85rem', cursor: 'pointer', fontWeight: donationFilter === f ? '600' : '400', background: donationFilter === f ? primaryColor : 'white', color: donationFilter === f ? 'white' : '#6b7280', borderColor: donationFilter === f ? primaryColor : '#d1d5db' }}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
            <button onClick={openDonationForm}
              style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer' }}>
              {showDonationForm ? 'Cancel' : '+ Log Donation'}
            </button>
          </div>

          {showDonationForm && (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>Log Donation</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={labelStyle}>Campaign</label>
                  <select value={donationForm.campaign_id} onChange={e => setDonationForm({ ...donationForm, campaign_id: e.target.value })} style={inputStyle}>
                    <option value="">No campaign</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Donor Type *</label>
                  <select value={donationForm.donor_type} onChange={e => handleDonorTypeChange(e.target.value)} style={inputStyle}>
                    {DONOR_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {donationForm.donor_type !== 'External' ? (
                  <div style={{ position: 'relative' }}>
                    <label style={labelStyle}>Search {donationForm.donor_type} *</label>
                    <input value={donorSearch}
                      onChange={e => handleDonorSearch(e.target.value, donationForm.donor_type)}
                      placeholder={donationForm.donor_id ? donationForm.donor_name : `Search ${donationForm.donor_type.toLowerCase()}s…`}
                      style={{ ...inputStyle, borderColor: donationForm.donor_id ? '#10b981' : '#d1d5db' }} />
                    {donorResults.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #d1d5db', borderRadius: '0.5rem', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        {donorResults.map(r => (
                          <div key={r.id} onClick={() => selectDonor(r)}
                            style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.875rem', borderBottom: '1px solid #f3f4f6' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                            <span style={{ fontWeight: '500' }}>{r.name}</span>
                            {r.sub && <span style={{ color: '#9ca3af', marginLeft: '0.5rem', fontSize: '0.8rem' }}>{r.sub}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <label style={labelStyle}>Donor Name *</label>
                      <input value={donationForm.donor_name} onChange={e => setDonationForm({ ...donationForm, donor_name: e.target.value })} placeholder="Full name or organization" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input value={donationForm.donor_email} onChange={e => setDonationForm({ ...donationForm, donor_email: e.target.value })} placeholder="donor@email.com" style={inputStyle} />
                    </div>
                  </>
                )}

                <div>
                  <label style={labelStyle}>Amount ($) *</label>
                  <input type="number" value={donationForm.amount} onChange={e => setDonationForm({ ...donationForm, amount: e.target.value })} placeholder="500" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={donationForm.date} onChange={e => setDonationForm({ ...donationForm, date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Payment Method</label>
                  <select value={donationForm.payment_method} onChange={e => setDonationForm({ ...donationForm, payment_method: e.target.value })} style={inputStyle}>
                    {PAYMENT_METHODS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {[['anonymous', 'Anonymous gift'], ['receipt_sent', 'Receipt sent'], ['restricted', 'Restricted gift']].map(([field, label]) => (
                    <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                      <input type="checkbox" checked={donationForm[field]} onChange={e => setDonationForm({ ...donationForm, [field]: e.target.checked })} />
                      {label}
                    </label>
                  ))}
                </div>
                {donationForm.restricted && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={labelStyle}>Restriction Note</label>
                    <input value={donationForm.restriction_note} onChange={e => setDonationForm({ ...donationForm, restriction_note: e.target.value })} placeholder="e.g. For library renovation only" style={inputStyle} />
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={donationForm.notes} onChange={e => setDonationForm({ ...donationForm, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
              <button onClick={saveDonation} disabled={savingDonation}
                style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer', opacity: savingDonation ? 0.7 : 1 }}>
                {savingDonation ? 'Saving…' : 'Log Donation'}
              </button>
              {donationError && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem', marginBottom: 0 }}>{donationError}</p>}
            </div>
          )}

          {filteredDonations.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No donations yet.</p>
          ) : (
            <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                    {['Donor', 'Type', 'Campaign', 'Amount', 'Date', 'Method', 'Receipt'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.625rem 1rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredDonations.map(d => {
                    const campaign = campaigns.find(c => c.id === d.campaign_id)
                    return (
                      <tr key={d.id} style={{ borderBottom: '1px solid #f9fafb' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <td style={{ padding: '0.625rem 1rem', fontWeight: '500', color: '#1f2937', whiteSpace: 'nowrap' }}>{d.anonymous ? 'Anonymous' : d.donor_name}</td>
                        <td style={{ padding: '0.625rem 1rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: DONOR_TYPE_COLORS[d.donor_type], background: (DONOR_TYPE_COLORS[d.donor_type] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{d.donor_type}</span>
                        </td>
                        <td style={{ padding: '0.625rem 1rem', color: '#6b7280', fontSize: '0.8rem' }}>{campaign?.name || '—'}</td>
                        <td style={{ padding: '0.625rem 1rem', fontWeight: '700', color: '#10b981', whiteSpace: 'nowrap' }}>{fmt(d.amount)}</td>
                        <td style={{ padding: '0.625rem 1rem', color: '#6b7280', whiteSpace: 'nowrap' }}>{d.date}</td>
                        <td style={{ padding: '0.625rem 1rem', color: '#6b7280' }}>{d.payment_method}</td>
                        <td style={{ padding: '0.625rem 1rem' }}>
                          <button onClick={() => handleToggleReceipt(d.id, d.receipt_sent)} style={{ fontSize: '0.75rem', fontWeight: '600', color: d.receipt_sent ? '#10b981' : '#9ca3af', background: 'none', border: `1px solid ${d.receipt_sent ? '#10b981' : '#d1d5db'}`, borderRadius: '0.375rem', padding: '0.15rem 0.5rem', cursor: 'pointer' }}>
                            {d.receipt_sent ? '✓ Sent' : 'Mark Sent'}
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button onClick={() => setShowEventForm(f => !f)}
              style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer' }}>
              {showEventForm ? 'Cancel' : '+ New Event'}
            </button>
          </div>

          {showEventForm && (
            <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>New Fundraising Event</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={labelStyle}>Event Name *</label>
                  <input value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })} placeholder="e.g. Spring Gala 2026" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Type</label>
                  <select value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value })} style={inputStyle}>
                    {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Linked Campaign</label>
                  <select value={eventForm.campaign_id} onChange={e => setEventForm({ ...eventForm, campaign_id: e.target.value })} style={inputStyle}>
                    <option value="">None</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Date</label>
                  <input type="date" value={eventForm.date} onChange={e => setEventForm({ ...eventForm, date: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Venue</label>
                  <input value={eventForm.venue} onChange={e => setEventForm({ ...eventForm, venue: e.target.value })} placeholder="Location" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Revenue Goal ($)</label>
                  <input type="number" value={eventForm.goal} onChange={e => setEventForm({ ...eventForm, goal: e.target.value })} placeholder="5000" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ticket Price ($)</label>
                  <input type="number" value={eventForm.ticket_price} onChange={e => setEventForm({ ...eventForm, ticket_price: e.target.value })} placeholder="100" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tickets Sold</label>
                  <input type="number" value={eventForm.tickets_sold} onChange={e => setEventForm({ ...eventForm, tickets_sold: parseInt(e.target.value) || 0 })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Sponsorship Revenue ($)</label>
                  <input type="number" value={eventForm.sponsorship_revenue} onChange={e => setEventForm({ ...eventForm, sponsorship_revenue: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Expenses ($)</label>
                  <input type="number" value={eventForm.expenses} onChange={e => setEventForm({ ...eventForm, expenses: parseFloat(e.target.value) || 0 })} style={inputStyle} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Notes</label>
                  <textarea value={eventForm.notes} onChange={e => setEventForm({ ...eventForm, notes: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
              </div>
              <button onClick={saveEvent} disabled={savingEvent || !eventForm.name}
                style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.5rem', fontWeight: '600', cursor: 'pointer' }}>
                {savingEvent ? 'Saving…' : 'Create Event'}
              </button>
            </div>
          )}

          {events.length === 0 ? (
            <p style={{ color: '#9ca3af' }}>No events yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {events.map(ev => {
                const revenue  = getEventRevenue(ev)
                const net      = getEventNet(ev)
                const pct      = getCampaignPct(revenue, ev.goal)
                const campaign = campaigns.find(c => c.id === ev.campaign_id)
                return (
                  <div key={ev.id} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: '3px solid #f59e0b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: '700', color: '#1f2937' }}>{ev.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600' }}>{ev.type}</div>
                      </div>
                      {ev.date && <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{ev.date}</div>}
                    </div>
                    {ev.venue    && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.5rem' }}>📍 {ev.venue}</div>}
                    {campaign    && <div style={{ fontSize: '0.78rem', color: '#6b7280', marginBottom: '0.75rem' }}>🎯 {campaign.name}</div>}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      {[['Gross', fmt(revenue)], ['Expenses', fmt(ev.expenses || 0)], ['Net', fmt(net)]].map(([l, v]) => (
                        <div key={l} style={{ background: '#f9fafb', borderRadius: '0.5rem', padding: '0.5rem', textAlign: 'center' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: '700', color: l === 'Net' ? (net >= 0 ? '#10b981' : '#ef4444') : '#1f2937' }}>{v}</div>
                          <div style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    {pct !== null && (
                      <>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>{pct}% of {fmt(ev.goal)} goal</div>
                        <div style={{ background: '#f3f4f6', borderRadius: '9999px', height: '6px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? '#10b981' : '#f59e0b', borderRadius: '9999px' }} />
                        </div>
                      </>
                    )}
                    {ev.tickets_sold > 0 && <div style={{ fontSize: '0.78rem', color: '#9ca3af', marginTop: '0.5rem' }}>{ev.tickets_sold} tickets × {fmt(ev.ticket_price || 0)}</div>}
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Donors',   value: donorList.length,                                            icon: '👥', color: '#8b5cf6' },
              { label: 'Alumni Donors',  value: donorList.filter(d => d.donor_type === 'Alumni').length,     icon: '🎓', color: '#6366f1' },
              { label: 'LYBUNT',         value: lybunt.length,                                               icon: '⚠️', color: '#f59e0b' },
              { label: 'Prospects',      value: alumniProspects.filter(a => a.donor_status === 'Prospect').length, icon: '🎯', color: primaryColor },
            ].map(s => (
              <div key={s.label} style={{ background: 'white', borderRadius: '1rem', padding: '1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{s.icon}</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#1f2937', lineHeight: 1 }}>{s.value}</div>
                <div style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Top Donors */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: '0 0 1rem' }}>All Donors — Ranked by Total Given</h3>
            {donorList.length === 0 ? <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No donations logged yet.</p> : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                      {['Donor', 'Type', 'Total Given', '# Gifts', 'Last Gift'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {donorList.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                        <td style={{ padding: '0.625rem 0.75rem', fontWeight: '500', color: '#1f2937' }}>{d.donor_name}</td>
                        <td style={{ padding: '0.625rem 0.75rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: '600', color: DONOR_TYPE_COLORS[d.donor_type], background: (DONOR_TYPE_COLORS[d.donor_type] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{d.donor_type}</span>
                        </td>
                        <td style={{ padding: '0.625rem 0.75rem', fontWeight: '700', color: '#10b981' }}>{fmt(d.total)}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{d.count}</td>
                        <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{d.lastDate || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* LYBUNT */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: 0 }}>LYBUNT — Lapsed Donors</h3>
              <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Gave in {lastYear}, not yet in {currentYear}</span>
              {lybunt.length > 0 && <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'white', background: '#f59e0b', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{lybunt.length}</span>}
            </div>
            {lybunt.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No lapsed donors — great retention! 🎉</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lybunt.map((d, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '0.5rem' }}>
                    <div>
                      <div style={{ fontWeight: '500', color: '#1f2937', fontSize: '0.875rem' }}>{d.donor_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{d.donor_type} · Last gift: {d.lastDate}</div>
                    </div>
                    <div style={{ fontWeight: '700', color: '#f59e0b' }}>{fmt(d.total)} lifetime</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Alumni Prospects */}
          <div style={{ background: 'white', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1f2937', margin: '0 0 1rem' }}>Alumni Prospects & Lapsed Donors</h3>
            {alumniProspects.length === 0 ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>No alumni marked as Prospect, Active Donor, or Lapsed. Update donor status in the Alumni module.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                      {['Alumni', 'Class', 'Email', 'Status', 'Total Given'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', color: '#6b7280', fontWeight: '600', fontSize: '0.78rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {alumniProspects.map(a => {
                      const given = getAlumnusGiven(a.id)
                      const statusColors = { Prospect: '#f59e0b', 'Active Donor': '#10b981', Lapsed: '#ef4444' }
                      return (
                        <tr key={a.id} style={{ borderBottom: '1px solid #f9fafb' }}
                          onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                          onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                          <td style={{ padding: '0.625rem 0.75rem', fontWeight: '500', color: '#1f2937' }}>{a.first_name} {a.last_name}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{a.graduation_year ? `Class of ${a.graduation_year}` : '—'}</td>
                          <td style={{ padding: '0.625rem 0.75rem', color: '#6b7280' }}>{a.email || '—'}</td>
                          <td style={{ padding: '0.625rem 0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: statusColors[a.donor_status], background: (statusColors[a.donor_status] || '#6b7280') + '18', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>{a.donor_status}</span>
                          </td>
                          <td style={{ padding: '0.625rem 0.75rem', fontWeight: given > 0 ? '700' : '400', color: given > 0 ? '#10b981' : '#9ca3af' }}>{given > 0 ? fmt(given) : 'No gifts yet'}</td>
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
