/**
 * useSchool Hook
 *
 * Handles school detection, staff login linking, stats fetching,
 * and wizard visibility.
 */

import { useState } from 'react'
import { supabase } from '../supabase'

export function useSchool() {
  const [school,         setSchool]         = useState(null)
  const [staffMember,    setStaffMember]    = useState(null)
  const [stats,          setStats]          = useState({ students: 0, pending: 0, messages: 0, staff: 0 })
  const [checkingSchool, setCheckingSchool] = useState(false)
  const [showWizard,     setShowWizard]     = useState(false)

  const fetchStats = async (userId) => {
    const [
      { count: students },
      { count: pending  },
      { count: messages },
      { count: staff    },
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', userId),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', userId).eq('status', 'Applied'),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('school_id', userId),
      supabase.from('staff').select('*', { count: 'exact', head: true }).eq('school_id', userId).eq('status', 'Active'),
    ])
    setStats({
      students: students || 0,
      pending:  pending  || 0,
      messages: messages || 0,
      staff:    staff    || 0,
    })
  }

  const fetchSchool = async (userId, userEmail) => {
    setCheckingSchool(true)
    setSchool(null)
    setStaffMember(null)

    // 1. Check if this user is a school admin
    const { data: schoolData } = await supabase
      .from('schools')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (schoolData) {
      setSchool(schoolData)
      if (!localStorage.getItem(`wizard_complete_${userId}`)) setShowWizard(true)
      setCheckingSchool(false)
      return
    }

    // 2. Check if this user is a staff member (already linked)
    const { data: byId } = await supabase
      .from('staff')
      .select('*')
      .eq('auth_user_id', userId)
      .maybeSingle()

    let foundStaff = byId

    // 3. First-time staff login — find by email and link auth_user_id
    if (!foundStaff && userEmail) {
      const { data: byEmail } = await supabase
        .from('staff')
        .select('*')
        .eq('email', userEmail)
        .is('auth_user_id', null)
        .maybeSingle()

      if (byEmail) {
        await supabase.from('staff').update({ auth_user_id: userId }).eq('id', byEmail.id)
        foundStaff = { ...byEmail, auth_user_id: userId }
      }
    }

    if (foundStaff) {
      setStaffMember(foundStaff)
      // Fetch school record for branding (RLS allows staff to read this)
      const { data: staffSchool } = await supabase
        .from('schools')
        .select('*')
        .eq('user_id', foundStaff.school_id)
        .single()
      if (staffSchool) setSchool(staffSchool)
    }

    setCheckingSchool(false)
  }

  const completeWizard = (userId, updatedSchool) => {
    localStorage.setItem(`wizard_complete_${userId}`, '1')
    setShowWizard(false)
    if (updatedSchool) setSchool(updatedSchool)
  }

  return {
    school, setSchool,
    staffMember,
    stats,
    checkingSchool,
    showWizard, setShowWizard,
    fetchSchool,
    fetchStats,
    completeWizard,
  }
}
