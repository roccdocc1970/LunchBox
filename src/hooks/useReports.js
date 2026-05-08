/**
 * useReports Hook
 *
 * Loads all report data and computes per-tab stats via domain functions.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getReportData } from '../services/reports'
import {
  getLastNMonths,
  calcEnrollmentStats,
  calcDivisionEnrollmentStats,
  calcAttendanceStats,
  calcIncidentReportStats,
  calcCommReportStats,
  calcStaffReportStats,
  calcFundraisingReportStats,
  calcFacilitiesReportStats,
} from '../domain/reports'

export function useReports(user, school) {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('enrollment')
  const [data, setData] = useState({
    students: [], messages: [], incidents: [], staff: [],
    campaigns: [], donations: [], fundEvents: [], workOrders: [], attendanceRecords: [],
  })

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const result = await getReportData(supabase, user.id)
    setData(result)
    setLoading(false)
  }

  // Pre-compute shared month arrays (stable reference per render is fine here)
  const months6  = getLastNMonths(6)

  // Per-tab computed stats (only used when tab is active, but cheap enough to always compute)
  const enrollment  = calcEnrollmentStats(data.students, school)
  const divEnroll   = calcDivisionEnrollmentStats(data.students, school?.divisions)
  const enrollMonths = {
    counts: getLastNMonths(6).map(m => ({
      ...m,
      count: data.students.filter(s => {
        const d = new Date(s.created_at)
        return d.getFullYear() === m.year && d.getMonth() === m.month
      }).length,
    })),
  }
  enrollMonths.max = Math.max(...enrollMonths.counts.map(m => m.count), 1)

  const attendance  = calcAttendanceStats(data.attendanceRecords, months6)
  const incidents   = calcIncidentReportStats(data.incidents, months6)
  const comms       = calcCommReportStats(data.messages, months6)
  const staffStats  = calcStaffReportStats(data.staff, school?.divisions)
  const fundraising = calcFundraisingReportStats(data.campaigns, data.donations, data.fundEvents)
  const facilities  = calcFacilitiesReportStats(data.workOrders, months6)

  return {
    loading,
    activeTab, setActiveTab,
    // raw data (needed for some inline rendering)
    students: data.students,
    messages: data.messages,
    staff:    data.staff,
    workOrders: data.workOrders,
    // computed per-tab
    enrollment, divEnroll, enrollMonths,
    attendance,
    incidents,
    comms,
    staffStats,
    fundraising,
    facilities,
  }
}
