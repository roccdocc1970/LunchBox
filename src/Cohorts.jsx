import { useState, useEffect } from 'react'
import { useCohorts } from './hooks/useCohorts'
import { COHORT_STATUS } from './domain/cohorts'
import { DIVISION_COLORS, parseDivisions } from './domain/school'

export default function Cohorts({ user, school }) {
  const primaryColor = school?.primary_color || '#f97316'
  const c = useCohorts(user, school)

  const allDivs     = parseDivisions(school?.divisions)
  const divColorMap = Object.fromEntries(allDivs.map((d, i) => [d.name, DIVISION_COLORS[i % DIVISION_COLORS.length]]))
  const divisions   = allDivs.filter(d => d.grades?.length > 0)

  // Detail tab — local UI only
  const [detailTab, setDetailTab] = useState('info')

  // Reset to info whenever edit opens
  useEffect(() => {
    if (c.editing) setDetailTab('info')
  }, [c.editing])

  const inputStyle = { width: '100%', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', boxSizing: 'border-box', fontSize: '0.9rem' }
  const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: '500', color: '#6b7280', marginBottom: '0.25rem' }

  // ── Derived grid stats ────────────────────────────────────────────────────────
  const total    = c.cohorts.length
  const active   = c.cohorts.filter(x => x.status === 'Active').length
  const archived = c.cohorts.filter(x => x.status === 'Archived').length
  const byDiv    = c.cohorts.reduce((acc, x) => {
    if (x.division) acc[x.division] = (acc[x.division] || 0) + 1
    return acc
  }, {})

  // ── Full-screen edit / detail view ───────────────────────────────────────────
  if (c.editing) {
    const memberCount = c.members.length
    const classCount  = c.cohortClasses.length

    return (
      <div style={{ padding: '2rem', maxWidth: '900px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              onClick={c.cancelEdit}
              style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.25rem 0' }}
            >← Cohorts</button>
            <span style={{ color: '#d1d5db' }}>|</span>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#1f2937' }}>
              {c.selected ? c.selected.name : 'New Cohort'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
            <button
              onClick={c.handleSave}
              disabled={c.saving}
              style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1.5rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
            >{c.saving ? 'Saving…' : c.selected ? 'Save Changes' : 'Create Cohort'}</button>
            <button
              onClick={c.cancelEdit}
              style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
            >Cancel</button>
            {c.selected && (
              c.deleteId === c.selected.id ? (
                <>
                  <span style={{ fontSize: '0.8rem', color: '#b91c1c', fontWeight: '500' }}>Delete this cohort?</span>
                  <button onClick={() => c.handleDelete(c.selected.id)} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}>Yes, Delete</button>
                  <button onClick={() => c.setDeleteId(null)} style={{ background: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', fontSize: '0.875rem' }}>Cancel</button>
                </>
              ) : (
                <button
                  onClick={() => c.setDeleteId(c.selected.id)}
                  style={{ background: 'white', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '0.5rem', padding: '0.5rem 1rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.875rem' }}
                >Delete</button>
              )
            )}
          </div>
        </div>

        {c.error   && <p style={{ color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>⚠ {c.error}</p>}
        {c.success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>✓ {c.success}</p>}

        {/* Tab bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.25rem', background: '#f3f4f6', borderRadius: '0.75rem', padding: '0.25rem', width: 'fit-content' }}>
            {[
              { id: 'info',    label: '📋 Cohort Info' },
              { id: 'members', label: memberCount > 0 ? `👥 Members (${memberCount})` : '👥 Members' },
              { id: 'classes', label: classCount  > 0 ? `📚 Classes (${classCount})`  : '📚 Classes'  },
            ].map(tab => {
              const isActive   = detailTab === tab.id
              const isDisabled = tab.id !== 'info' && !c.selected
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setDetailTab(tab.id)}
                  style={{
                    padding: '0.5rem 1.25rem', borderRadius: '0.625rem', border: 'none',
                    cursor: isDisabled ? 'not-allowed' : 'pointer', fontSize: '0.875rem',
                    fontWeight: isActive ? '600' : '400',
                    background: isActive ? primaryColor : 'transparent',
                    color: isActive ? 'white' : isDisabled ? '#d1d5db' : '#6b7280',
                    boxShadow: isActive ? `0 1px 3px ${primaryColor}40` : 'none',
                    transition: 'all 0.15s',
                  }}
                >{tab.label}</button>
              )
            })}
          </div>
          {!c.selected && (
            <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>
              Save the cohort first to manage members and classes
            </span>
          )}
        </div>

        {/* ── Tab: Cohort Info ── */}
        {detailTab === 'info' && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.75rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>

              <div>
                <label style={labelStyle}>Cohort Name *</label>
                <input
                  value={c.form.name}
                  onChange={e => c.setForm({ ...c.form, name: e.target.value })}
                  placeholder="e.g. Class of 2028, Blue Track"
                  style={inputStyle}
                />
              </div>

              {c.divisions.length > 0 && (
                <div>
                  <label style={labelStyle}>Division</label>
                  <select value={c.form.division || ''} onChange={e => c.setForm({ ...c.form, division: e.target.value })} style={inputStyle}>
                    <option value="">— None —</option>
                    {c.divisions.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label style={labelStyle}>Academic Year</label>
                <input
                  value={c.form.academic_year || ''}
                  onChange={e => c.setForm({ ...c.form, academic_year: e.target.value })}
                  placeholder="e.g. 2025-2026"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Status</label>
                <select value={c.form.status} onChange={e => c.setForm({ ...c.form, status: e.target.value })} style={inputStyle}>
                  {COHORT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={c.form.description || ''}
                  onChange={e => c.setForm({ ...c.form, description: e.target.value })}
                  placeholder="Optional notes about this cohort…"
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

            </div>
          </div>
        )}

        {/* ── Tab: Members ── */}
        {detailTab === 'members' && c.selected && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>

              {/* Left — available students */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Available ({c.availableStudents.length})
                </div>
                <input
                  type="text"
                  placeholder="Filter by name or grade…"
                  value={c.memberSearch}
                  onChange={e => c.setMemberSearch(e.target.value)}
                  style={{ ...inputStyle, marginBottom: '0.5rem', fontSize: '0.8rem', padding: '0.375rem 0.625rem' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', maxHeight: '280px', overflowY: 'auto', padding: '0.25rem 0' }}>
                  {c.availableStudents.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#d1d5db', fontStyle: 'italic', margin: 0 }}>
                      {c.memberSearch ? 'No matches.' : 'All enrolled students are in this cohort.'}
                    </p>
                  ) : c.availableStudents.map(s => (
                    <button
                      key={s.id}
                      onClick={() => c.handleAddMember(s.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.3rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '500',
                        border: `1.5px solid ${primaryColor}`, background: 'white', color: primaryColor,
                        cursor: 'pointer', transition: 'all 0.12s',
                      }}
                      onMouseEnter={ev => { ev.currentTarget.style.background = primaryColor; ev.currentTarget.style.color = 'white' }}
                      onMouseLeave={ev => { ev.currentTarget.style.background = 'white'; ev.currentTarget.style.color = primaryColor }}
                    >
                      {s.first_name} {s.last_name}
                      <span style={{ fontSize: '0.68rem', opacity: 0.65 }}>{s.grade}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right — cohort members */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Cohort Members ({c.members.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', maxHeight: '320px', overflowY: 'auto', padding: '0.25rem 0' }}>
                  {c.members.length === 0 ? (
                    <p style={{ fontSize: '0.8rem', color: '#d1d5db', fontStyle: 'italic', margin: 0 }}>No members yet. Add students from the left.</p>
                  ) : c.members.map(m => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.375rem',
                        padding: '0.3rem 0.5rem 0.3rem 0.625rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '500',
                        background: '#f0fdf4', border: '1.5px solid #86efac', color: '#15803d',
                      }}
                    >
                      {m.students?.first_name} {m.students?.last_name}
                      <span style={{ fontSize: '0.68rem', opacity: 0.65 }}>{m.students?.grade}</span>
                      <button
                        onClick={() => c.handleRemoveMember(m.id)}
                        title="Remove from cohort"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86efac', fontSize: '0.75rem', lineHeight: 1, padding: '0 0 0 0.125rem', display: 'flex', alignItems: 'center' }}
                        onMouseEnter={ev => ev.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={ev => ev.currentTarget.style.color = '#86efac'}
                      >✕</button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── Tab: Classes (read-only) ── */}
        {detailTab === 'classes' && c.selected && (
          <div style={{ background: 'white', borderRadius: '1rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', padding: '1.5rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0 0 1rem' }}>
              Classes are assigned to cohorts from the <strong>Classes</strong> module. Open a class, go to the Class Enrollment tab, and assign this cohort there.
            </p>
            {c.cohortClasses.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: '#d1d5db', fontStyle: 'italic', margin: 0 }}>No classes assigned to this cohort yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {c.cohortClasses.map(cc => {
                  const cls      = cc.classes
                  const divColor = cls?.division ? (divColorMap[cls.division] || '#6b7280') : '#6b7280'
                  return (
                    <div key={cc.id} style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '0.625rem 0.875rem', borderRadius: '0.625rem', fontSize: '0.85rem',
                      background: '#f0fdf4', border: '1.5px solid #86efac',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#1f2937' }}>{cls?.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.1rem' }}>
                          {[cls?.subject, cls?.division].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                      {cls?.teacher_name && (
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>👩‍🏫 {cls.teacher_name}</span>
                      )}
                      {cls?.division && (
                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: '600', background: divColor + '18', color: divColor, border: `1px solid ${divColor}40` }}>
                          {cls.division}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    )
  }

  // ── Card grid view ────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Cohorts</h2>
          <p style={{ color: '#6b7280', marginTop: '0.25rem', fontSize: '0.875rem' }}>Group students for shared academic journeys — assign cohorts to classes for automatic enrollment</p>
        </div>
        <button onClick={c.startAdd} style={{ background: primaryColor, color: 'white', border: 'none', borderRadius: '0.5rem', padding: '0.625rem 1.25rem', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' }}>
          + New Cohort
        </button>
      </div>

      {c.success && <p style={{ color: '#15803d', fontSize: '0.875rem', marginBottom: '1rem', fontWeight: '500' }}>✓ {c.success}</p>}

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <StatCard label="Total Cohorts" value={total}    icon="👥" />
        <StatCard label="Active"        value={active}   color="#10b981" />
        <StatCard label="Archived"      value={archived} color="#9ca3af" />
        {Object.entries(byDiv).map(([div, count]) => (
          <StatCard key={div} label={div} value={count} color={divColorMap[div] || '#6b7280'} />
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search by name, division, or year…"
          value={c.search}
          onChange={e => c.setSearch(e.target.value)}
          style={{ flex: 1, minWidth: '220px', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', fontSize: '0.875rem' }}
        />
        {divisions.length > 0 && (
          <select
            value={c.filterStatus}
            onChange={e => c.setFilterStatus(e.target.value)}
            style={{ border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', outline: 'none', fontSize: '0.875rem', background: 'white', minWidth: '130px' }}
          >
            <option value="">All Statuses</option>
            {COHORT_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        {(c.search || c.filterStatus) && (
          <button
            onClick={() => { c.setSearch(''); c.setFilterStatus('') }}
            style={{ background: 'transparent', border: '1px solid #d1d5db', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: 'pointer', color: '#6b7280', fontSize: '0.9rem' }}
          >Clear</button>
        )}
      </div>

      {/* Cohort cards */}
      {c.loading ? (
        <p style={{ color: '#9ca3af' }}>Loading cohorts…</p>
      ) : c.filtered.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
            {c.cohorts.length === 0 ? 'No cohorts yet. Click + New Cohort to get started.' : 'No cohorts match your filters.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {c.filtered.map(cohort => {
            const divColor = cohort.division ? (divColorMap[cohort.division] || primaryColor) : primaryColor
            const isActive = cohort.status === 'Active'

            return (
              <div
                key={cohort.id}
                onClick={() => { c.openCohort(cohort); c.startEdit(cohort) }}
                style={{
                  background: 'white', borderRadius: '1rem',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  overflow: 'hidden', transition: 'box-shadow 0.15s', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.08)'}
              >
                <div style={{ height: '4px', background: divColor }} />

                <div style={{ padding: '1.25rem' }}>
                  {/* Name + status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                    <div style={{ fontWeight: '700', color: '#1f2937', fontSize: '1rem', flex: 1, paddingRight: '0.5rem' }}>{cohort.name}</div>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: '700', borderRadius: '9999px', padding: '0.2rem 0.625rem', whiteSpace: 'nowrap',
                      background: isActive ? '#f0fdf4' : '#f3f4f6',
                      color:      isActive ? '#15803d' : '#9ca3af',
                    }}>{cohort.status}</span>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
                    {cohort.division && (
                      <span style={{ fontSize: '0.72rem', fontWeight: '600', color: divColor, background: divColor + '15', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>
                        {cohort.division}
                      </span>
                    )}
                    {cohort.academic_year && (
                      <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#6b7280', background: '#f3f4f6', borderRadius: '9999px', padding: '0.15rem 0.5rem' }}>
                        {cohort.academic_year}
                      </span>
                    )}
                  </div>

                  {cohort.description && (
                    <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: '0 0 0.625rem', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {cohort.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: 'white', borderRadius: '0.75rem', padding: '0.875rem 1.25rem', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      {icon  && <span style={{ fontSize: '1.25rem' }}>{icon}</span>}
      {color && <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />}
      <span style={{ fontWeight: '700', color: '#1f2937' }}>{value}</span>
      <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>{label}</span>
    </div>
  )
}
