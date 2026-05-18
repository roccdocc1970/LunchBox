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
 * Skips placement if the class's room capacity is less than the class size.
 *
 * Returns { sections: [{ class_id, period_id }], unplaceable: [{ name, reason }] }
 */
export function autoSchedule(classes, periods, existingSections, rooms = []) {
  const slots   = periods.filter(p => p.type === 'Class')
  const roomMap = Object.fromEntries(rooms.map(r => [r.id, r]))
  if (slots.length === 0) return { sections: [], unplaceable: [] }

  // Build conflict maps from already-scheduled classes
  const teacherBusy = {}  // teacher_id → Set<period_id>
  const roomBusy    = {}  // room_id    → Set<period_id>

  existingSections.forEach(s => {
    const cls = classes.find(c => c.id === s.class_id)
    if (!cls) return
    if (cls.teacher_id) {
      if (!teacherBusy[cls.teacher_id]) teacherBusy[cls.teacher_id] = new Set()
      teacherBusy[cls.teacher_id].add(s.period_id)
    }
    if (cls.room_id) {
      if (!roomBusy[cls.room_id]) roomBusy[cls.room_id] = new Set()
      roomBusy[cls.room_id].add(s.period_id)
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
    // Capacity pre-check — fail fast before trying any slot
    if (cls.room_id && cls.class_size) {
      const room = roomMap[cls.room_id]
      if (room && room.capacity && room.capacity < cls.class_size) {
        unplaceable.push(`${cls.name} (class size ${cls.class_size} exceeds ${room.name} capacity of ${room.capacity})`)
        continue
      }
    }

    let placed = false
    for (const slot of slots) {
      const teacherFree = !cls.teacher_id || !teacherBusy[cls.teacher_id]?.has(slot.id)
      const roomFree    = !cls.room_id    || !roomBusy[cls.room_id]?.has(slot.id)

      if (teacherFree && roomFree) {
        sections.push({ class_id: cls.id, period_id: slot.id })

        if (cls.teacher_id) {
          if (!teacherBusy[cls.teacher_id]) teacherBusy[cls.teacher_id] = new Set()
          teacherBusy[cls.teacher_id].add(slot.id)
        }
        if (cls.room_id) {
          if (!roomBusy[cls.room_id]) roomBusy[cls.room_id] = new Set()
          roomBusy[cls.room_id].add(slot.id)
        }
        placed = true
        break
      }
    }
    if (!placed) unplaceable.push(cls.name)
  }

  return { sections, unplaceable }
}

/**
 * Check whether placing classId into periodId would create a cohort student conflict.
 *
 * A conflict exists when a student is auto-enrolled in classId via a cohort AND
 * is also auto-enrolled in another class already scheduled at periodId.
 *
 * @param {string}   classId        - class being placed
 * @param {string}   periodId       - target period
 * @param {object[]} cohortClasses  - all cohort_classes rows { cohort_id, class_id, auto_enroll }
 * @param {object[]} cohortStudents - all cohort_students rows { cohort_id, student_id }
 * @param {object[]} sections       - existing class_sections { class_id, period_id }
 * @returns {string|null} human-readable conflict message, or null if clear
 */
export function detectCohortConflict(classId, periodId, cohortClasses, cohortStudents, sections) {
  // 1. Cohorts that auto-enroll into classId
  const myCohortIds = cohortClasses
    .filter(cc => cc.class_id === classId && cc.auto_enroll)
    .map(cc => cc.cohort_id)

  if (myCohortIds.length === 0) return null  // class has no auto-enroll cohorts

  // 2. Students who will be auto-enrolled into classId
  const myStudentIds = new Set(
    cohortStudents
      .filter(cs => myCohortIds.includes(cs.cohort_id))
      .map(cs => cs.student_id)
  )

  if (myStudentIds.size === 0) return null  // cohorts have no members

  // 3. Other classes already at periodId
  const otherClassIds = sections
    .filter(s => s.period_id === periodId && s.class_id !== classId)
    .map(s => s.class_id)

  if (otherClassIds.length === 0) return null

  // 4. Check each competing class for cohort student overlap
  for (const otherClassId of otherClassIds) {
    const otherCohortIds = cohortClasses
      .filter(cc => cc.class_id === otherClassId && cc.auto_enroll)
      .map(cc => cc.cohort_id)

    if (otherCohortIds.length === 0) continue

    const overlap = cohortStudents
      .filter(cs => otherCohortIds.includes(cs.cohort_id) && myStudentIds.has(cs.student_id))

    if (overlap.length > 0) {
      return `${overlap.length} cohort student${overlap.length !== 1 ? 's' : ''} ${overlap.length !== 1 ? 'are' : 'is'} already auto-enrolled in another class at this period.`
    }
  }

  return null
}

/** Summary counts for the schedule header */
export function calcScheduleStats(classes, sections) {
  const active      = classes.filter(c => c.status === 'Active')
  const scheduled   = sections.length
  const unscheduled = active.length - scheduled
  return { total: active.length, scheduled, unscheduled }
}
