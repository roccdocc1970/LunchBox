/**
 * Policy documents — database calls only (service layer). Every function takes `supabase` first:
 * the caller's own client, so RLS decides what is visible and writable. Embedding is injected
 * (`embedTexts`) so this file does not depend on the embedding library.
 */

import { chunkMarkdown } from '../domain/policies.js'

const MAX_CHARS = 300_000
const INSERT_BATCH = 40

export async function listPolicies(supabase) {
  const { data, error } = await supabase
    .from('policy_documents')
    .select('id, title, filename, chunk_count, char_count, created_at')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

/**
 * Chunks, embeds and stores one policy document, replacing any earlier document with the same title.
 * The new version is fully stored BEFORE the old one is removed, so a failure never loses the old version.
 * Returns { documentId, chunks, chars, replaced }.
 */
export async function ingestPolicy(supabase, { schoolId, userId, title, filename = null, text }, embedTexts) {
  const cleanTitle = String(title || '').trim()
  const body = String(text || '')
  if (!cleanTitle) throw new Error('A title is required')
  if (!body.trim()) throw new Error('The document is empty')
  if (body.length > MAX_CHARS) throw new Error(`The document is too long (limit ${MAX_CHARS} characters)`)

  const chunks = chunkMarkdown(body, { title: cleanTitle })
  if (chunks.length === 0) throw new Error('No text could be extracted from the document')
  const vectors = await embedTexts(chunks.map(c => c.content))

  const { data: existing, error: existingError } = await supabase
    .from('policy_documents').select('id').eq('school_id', schoolId).eq('title', cleanTitle)
  if (existingError) throw existingError

  const { data: doc, error: docError } = await supabase
    .from('policy_documents')
    .insert({ school_id: schoolId, title: cleanTitle, filename, uploaded_by: userId, chunk_count: chunks.length, char_count: body.length })
    .select('id').single()
  if (docError) throw docError

  try {
    for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
      const rows = chunks.slice(i, i + INSERT_BATCH).map((c, j) => ({
        document_id: doc.id, school_id: schoolId, chunk_index: c.index,
        heading: c.heading, content: c.content, embedding: vectors[i + j],
      }))
      const { error } = await supabase.from('policy_chunks').insert(rows)
      if (error) throw error
    }
  } catch (err) {
    await supabase.from('policy_documents').delete().eq('id', doc.id) // never leave a half-stored document
    throw err
  }

  const oldIds = (existing || []).map(d => d.id)
  if (oldIds.length) {
    const { error } = await supabase.from('policy_documents').delete().in('id', oldIds)
    if (error) throw error
  }
  return { documentId: doc.id, chunks: chunks.length, chars: body.length, replaced: oldIds.length }
}

export async function deletePolicy(supabase, schoolId, title) {
  const { data, error } = await supabase
    .from('policy_documents').delete().eq('school_id', schoolId).eq('title', title).select('id')
  if (error) throw error
  return (data || []).length
}

/** The passages closest in meaning to a question. `queryEmbedding` must be 384 numbers. RLS-scoped. */
export async function searchPolicies(supabase, queryEmbedding, k = 4) {
  const { data, error } = await supabase.rpc('match_policy_chunks', { query_embedding: queryEmbedding, match_count: k })
  if (error) throw error
  return data || []
}

/**
 * Hybrid search (migration 006): the passages ranking best across BOTH a meaning search (vector) and a
 * keyword search (Postgres full-text), merged by reciprocal rank fusion. Needs the question text as well.
 */
export async function searchPoliciesHybrid(supabase, queryEmbedding, queryText, k = 4) {
  const { data, error } = await supabase.rpc('match_policy_chunks_hybrid', {
    query_embedding: queryEmbedding, query_text: queryText, match_count: k,
  })
  if (error) throw error
  return data || []
}
