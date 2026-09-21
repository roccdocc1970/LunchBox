import {
  Mail, Flag, Star, GraduationCap, Users, BookOpen, FileText,
  AlertTriangle, ClipboardCheck, Heart, HeartHandshake, Repeat, ChevronDown, ChevronRight,
} from 'lucide-react'

const chipCls = 'text-xs font-semibold px-2.5 py-1 rounded-full inline-flex items-center gap-1 cursor-pointer hover:opacity-80'
const milestoneCls = 'text-xs text-gray-500 flex items-center gap-1'

export default function StudentTimeline({ t, student, primaryColor, onNavigateToCohort, onNavigateToClass, onNavigate }) {
  if (t.loading || !t.timeline) {
    return <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 text-sm text-gray-400">Loading timeline…</div>
  }

  const { bookends, years } = t.timeline

  if (years.length === 0 && !bookends.inquiryDate) return null

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Student Evolution</div>

      {bookends.inquiryDate && (
        <TimelineRow icon={<Mail size={12} />} muted dashed={false}>
          <p className="text-xs text-gray-400 m-0">Inquiry · {bookends.inquiryDate}</p>
        </TimelineRow>
      )}

      {years.map((year, i) => {
        const expanded = t.expandedYears.has(year.academicYear)
        const isLast = i === years.length - 1

        if (!expanded) {
          return (
            <TimelineRow key={year.academicYear} icon={<ChevronRight size={12} />} muted last={isLast && bookends.status !== 'Alumni' ? false : isLast}>
              <button
                onClick={() => t.toggleYear(year.academicYear)}
                className="bg-transparent border-0 p-0 cursor-pointer text-left text-xs text-gray-500 hover:text-gray-700"
              >
                {year.academicYear} — {year.grade || 'no grade recorded'}
              </button>
            </TimelineRow>
          )
        }

        const nodeStyle = year.isCurrent
          ? { background: '#EEEDFE', border: `2px solid ${primaryColor}` }
          : { background: '#EEEDFE', border: '0.5px solid #7F77DD' }

        return (
          <TimelineRow
            key={year.academicYear}
            icon={<ChevronDown size={12} color="#3C3489" />}
            iconStyle={nodeStyle}
            last={isLast && bookends.status !== 'Alumni' ? false : isLast}
          >
            <div
              onClick={() => t.toggleYear(year.academicYear)}
              className={`rounded-lg px-3.5 py-3 cursor-pointer ${year.isCurrent ? 'bg-gray-50' : ''}`}
              style={year.isCurrent ? { border: `2px solid ${primaryColor}` } : { border: '1px solid #f3f4f6' }}
            >
              <p className="text-sm font-semibold text-gray-800 m-0 flex items-center gap-2">
                {year.grade || year.academicYear}
                <span className="font-normal text-gray-400">· {year.academicYear}</span>
                {year.isCurrent && <span className="text-xs font-semibold" style={{ color: primaryColor }}>current</span>}
                {year.isRepeat && <span className="text-xs font-medium text-amber-500">repeated</span>}
                {year.isSkip && <span className="text-xs font-medium text-purple-500">skipped</span>}
              </p>

              {year.cohortChanged && (
                <div className="flex items-center gap-1 text-xs font-medium text-amber-600 mt-1.5">
                  <Repeat size={11} />Cohort changed this year
                </div>
              )}

              <div className="flex gap-1.5 flex-wrap mt-2">
                {year.cohorts.map(c => (
                  <span
                    key={c.id}
                    onClick={e => { e.stopPropagation(); onNavigateToCohort?.(c.id) }}
                    className={chipCls}
                    style={{ background: '#E1F5EE', color: '#085041' }}
                  ><Users size={11} />{c.name}</span>
                ))}
                {year.classes.map(cl => (
                  <span
                    key={cl.id}
                    onClick={e => { e.stopPropagation(); onNavigateToClass?.(cl.id) }}
                    className={chipCls}
                    style={{ background: '#FAECE7', color: '#712B13' }}
                  ><BookOpen size={11} />{cl.name}</span>
                ))}
              </div>

              <div className="flex gap-3 flex-wrap mt-2.5">
                {year.reportCardCount > 0 && (
                  <span onClick={e => { e.stopPropagation(); onNavigate?.('reportcards') }} className={`${milestoneCls} hover:text-gray-700 cursor-pointer`}>
                    <FileText size={12} />{year.reportCardCount} report card{year.reportCardCount !== 1 ? 's' : ''}
                  </span>
                )}
                {year.incidentCount > 0 && (
                  <span className={`${milestoneCls} text-amber-600`}>
                    <AlertTriangle size={12} />{year.incidentCount} incident{year.incidentCount !== 1 ? 's' : ''}
                  </span>
                )}
                {year.attendanceRate !== null && (
                  <span onClick={e => { e.stopPropagation(); onNavigate?.('attendance') }} className={`${milestoneCls} hover:text-gray-700 cursor-pointer`}>
                    <ClipboardCheck size={12} />{year.attendanceRate}% attendance
                  </span>
                )}
                {year.healthFlagCount > 0 && (
                  <span className={milestoneCls}>
                    <Heart size={12} />{year.healthFlagCount} health note{year.healthFlagCount !== 1 ? 's' : ''}
                  </span>
                )}
                {year.donationTotal > 0 && (
                  <span onClick={e => { e.stopPropagation(); onNavigate?.('fundraising') }} className={`${milestoneCls} hover:text-gray-700 cursor-pointer`}>
                    <HeartHandshake size={12} />${year.donationTotal.toLocaleString()} given
                  </span>
                )}
              </div>
            </div>
          </TimelineRow>
        )
      })}

      {bookends.status === 'Alumni' ? (
        <TimelineRow icon={<GraduationCap size={12} color={primaryColor} />} last>
          <p className="text-xs font-medium m-0" style={{ color: primaryColor }}>
            Graduated{bookends.graduationYear ? ` · Class of ${bookends.graduationYear}` : ''}
          </p>
        </TimelineRow>
      ) : years.length > 0 && (
        <TimelineRow icon={<Star size={12} />} muted dashedNode last>
          <p className="text-xs text-gray-400 m-0">Continues through graduation → alumni</p>
        </TimelineRow>
      )}
    </div>
  )
}

function TimelineRow({ icon, iconStyle, muted, dashedNode, last, children }) {
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center ${muted ? 'bg-gray-50 border border-gray-200' : ''} ${dashedNode ? 'border border-dashed border-gray-300' : ''}`}
          style={iconStyle}
        >
          {icon}
        </div>
        {!last && <div className="w-px flex-1 bg-gray-200 my-0.5" />}
      </div>
      <div className={`flex-1 ${last ? 'pb-0' : 'pb-3'}`}>{children}</div>
    </div>
  )
}
