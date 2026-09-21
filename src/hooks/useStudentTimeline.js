/**
 * useStudentTimeline Hook
 *
 * Fetches and aggregates one student's full lifecycle timeline.
 * Also owns the collapse/expand-older-years UI state.
 */

import { useState, useEffect } from 'react'
import { getStudentTimelineData } from '../services/timeline'
import { buildStudentTimeline } from '../domain/timeline'

const RECENT_YEARS_EXPANDED = 3

export function useStudentTimeline(supabase, schoolId, student) {
  const [timeline, setTimeline] = useState(null)
  const [loading, setLoading] = useState(!!student)
  const [expandedYears, setExpandedYears] = useState(new Set())

  useEffect(() => {
    if (!student) { setTimeline(null); setLoading(false); return }
    let cancelled = false
    setLoading(true)
    getStudentTimelineData(supabase, schoolId, student).then(data => {
      if (cancelled) return
      const built = buildStudentTimeline({ student, ...data })
      setTimeline(built)
      setExpandedYears(new Set(built.years.slice(-RECENT_YEARS_EXPANDED).map(y => y.academicYear)))
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [student?.id])

  const toggleYear = (academicYear) => {
    setExpandedYears(prev => {
      const next = new Set(prev)
      if (next.has(academicYear)) next.delete(academicYear)
      else next.add(academicYear)
      return next
    })
  }

  return { timeline, loading, expandedYears, toggleYear }
}
