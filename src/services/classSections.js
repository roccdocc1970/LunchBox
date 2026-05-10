/**
 * Class Sections Service
 *
 * Supabase CRUD for the class_sections table.
 * A section = one class assigned to one period for a given term + academic year.
 */

export async function getSections(supabase, schoolId, term, academicYear) {
  const { data } = await supabase
    .from('class_sections')
    .select('*')
    .eq('school_id', schoolId)
    .eq('term', term)
    .eq('academic_year', academicYear)
  return data || []
}

export async function saveSection(supabase, schoolId, classId, periodId, term, academicYear) {
  const { data, error } = await supabase
    .from('class_sections')
    .upsert(
      { school_id: schoolId, class_id: classId, period_id: periodId, term, academic_year: academicYear },
      { onConflict: 'school_id,class_id,term,academic_year' }
    )
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteSection(supabase, sectionId) {
  const { error } = await supabase
    .from('class_sections')
    .delete()
    .eq('id', sectionId)
  if (error) throw new Error(error.message)
}

export async function batchSaveSections(supabase, schoolId, sections, term, academicYear) {
  const rows = sections.map(s => ({
    school_id:     schoolId,
    class_id:      s.class_id,
    period_id:     s.period_id,
    term,
    academic_year: academicYear,
  }))
  const { data, error } = await supabase
    .from('class_sections')
    .upsert(rows, { onConflict: 'school_id,class_id,term,academic_year' })
    .select()
  if (error) throw new Error(error.message)
  return data || []
}

export async function clearSections(supabase, schoolId, term, academicYear) {
  const { error } = await supabase
    .from('class_sections')
    .delete()
    .eq('school_id', schoolId)
    .eq('term', term)
    .eq('academic_year', academicYear)
  if (error) throw new Error(error.message)
}
