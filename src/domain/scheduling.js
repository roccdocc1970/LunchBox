/**
 * Scheduling Domain
 *
 * Pure logic for the Schedule module.
 * No React. No Supabase. Input → output only.
 */

/** Derive term labels from the school's grading period setting */
export function getTerms(gradingPeriod) {
  switch (gradingPeriod) {
    case 'Quarters':   return ['Q1', 'Q2', 'Q3', 'Q4']
    case 'Trimesters': return ['T1', 'T2', 'T3']
    case 'Semesters':  return ['S1', 'S2']
    case 'Annual':     return ['Annual']
    default:           return ['Q1', 'Q2', 'Q3', 'Q4']
  }
}

/**
 * Check whether placing classId into periodId would cause a conflict.
 * Returns a human-readable error string, or null if clear.
 */
export function detectConflict(classId, periodId, classes, sections) {
  const cls = classes.find(c => c.id === classId)
  if (!cls) return null

  const siblings = sections.filter(s => s.period_id === periodId && s.class_id !== classId)

  for (const s of siblings) {
    const other = classes.find(c => c.id === s.class_id)
    if (!other) continue

    if (cls.teacher_id && cls.teacher_id === other.teacher_id) {
      return `${cls.teacher_name || 'This teacher'} is already teaching another class in this period.`
    }
    if (cls.room_id && cls.room_id === other.room_id) {
      return `${cls.room_name || 'This room'} is already in use during this period.`
    }
  }
  return null
}

/**
 * Greedy constraint solver — assigns unscheduled active classes to available
 * Class-type periods. Most-constrained classes (both teacher + room set) go first.
 *
 * Returns { sections: [{ class_id, period_id }], unplaceable: [className] }
 */
export function autoSchedule(classes, periods, existingSections) {
  const slots = periods.filter(p => p.type === 'Class')
  if (slots.length === 0) return { sections: [], unplaceable: [] }

  // Build conflict maps from already-scheduled classes
  const teacherMap = {}  // teacher_id → Set<period_id>
  const roomMap    = {}  // room_id    → Set<period_id>

  existingSections.forEach(s => {
    const cls = classes.find(c => c.id === s.class_id)
    if (!cls) return
    if (cls.teacher_id) {
      if (!teacherMap[cls.teacher_id]) teacherMap[cls.teacher_id] = new Set()
      teacherMap[cls.teacher_id].add(s.period_id)
    }
    if (cls.room_id) {
      if (!roomMap[cls.room_id]) roomMap[cls.room_id] = new Set()
      roomMap[cls.room_id].add(s.period_id)
    }
  })

  const scheduledIds = new Set(existingSections.map(s => s.class_id))
  const unscheduled  = classes.filter(c => c.status === 'Active' && !scheduledIds.has(c.id))

  // Most-constrained first (has teacher AND room → hardest to place)
  const sorted = [...unscheduled].sort((a, b) => {
    const aScore = (a.teacher_id ? 1 : 0) + (a.room_id ? 1 : 0)
    const bScore = (b.teacher_id ? 1 : 0) + (b.room_id ? 1 : 0)
    return bScore - aScore
  })

  const sections    = []
  const unplaceable = []

  for (const cls of sorted) {
    let placed = false
    for (const slot of slots) {
      const teacherFree = !cls.teacher_id || !teacherMap[cls.teacher_id]?.has(slot.id)
      const roomFree    = !cls.room_id    || !roomMap[cls.room_id]?.has(slot.id)

      if (teacherFree && roomFree) {
        sections.push({ class_id: cls.id, period_id: slot.id })

        if (cls.teacher_id) {
          if (!teacherMap[cls.teacher_id]) teacherMap[cls.teacher_id] = new Set()
          teacherMap[cls.teacher_id].add(slot.id)
        }
        if (cls.room_id) {
          if (!roomMap[cls.room_id]) roomMap[cls.room_id] = new Set()
          roomMap[cls.room_id].add(slot.id)
        }
        placed = true
        break
      }
    }
    if (!placed) unplaceable.push(cls.name)
  }

  return { sections, unplaceable }
}

/** Summary counts for the schedule header */
export function calcScheduleStats(classes, sections) {
  const active      = classes.filter(c => c.status === 'Active')
  const scheduled   = sections.length
  const unscheduled = active.length - scheduled
  return { total: active.length, scheduled, unscheduled }
}
