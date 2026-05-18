/**
 * useNavCounts Hook
 *
 * Fetches and caches record counts for every nav section.
 * Re-fetches whenever schoolId changes or refresh() is called.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase }       from '../supabase'
import { getNavCounts }   from '../services/navCounts'

export function useNavCounts(schoolId) {
  const [counts, setCounts] = useState({})

  const refresh = useCallback(() => {
    if (!schoolId) return
    getNavCounts(supabase, schoolId).then(setCounts).catch(() => {})
  }, [schoolId])

  useEffect(() => { refresh() }, [refresh])

  return { counts, refresh }
}
