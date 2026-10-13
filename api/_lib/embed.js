/**
 * Text embeddings for policy search (roadmap Step 7 / ID 4).
 *
 * An embedding turns a passage of text into a vector — a list of numbers capturing its meaning —
 * so passages with similar meaning end up close together. This module is the ONLY place that knows
 * which embedding model is used, so it can be swapped (for a hosted API, say) without touching the
 * rest of the code.
 *
 * Current choice: a small model running locally via @huggingface/transformers (free, no account or
 * API key; the model — roughly 25 MB — is downloaded once and cached on first use).
 * Production note: a local model needs a server able to run it; a hosted embedding API is the likelier
 * choice if/when chat goes live on serverless hosting.
 *
 * IMPORTANT: the database column that stores these vectors has a fixed size (EMBEDDING_DIM). Changing
 * the model — even to another of the same size — means re-embedding every stored document.
 */

export const EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'
export const EMBEDDING_DIM = 384

let extractorPromise = null

// Loaded lazily so that importing this file (for example when the chat backend starts) costs nothing.
function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = import('@huggingface/transformers').then(({ pipeline }) =>
      pipeline('feature-extraction', EMBEDDING_MODEL, { dtype: 'q8' }))
  }
  return extractorPromise
}

/** Embeds an array of strings; returns an array of vectors (each EMBEDDING_DIM numbers, length-normalized). */
export async function embedTexts(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return []
  const extractor = await getExtractor()
  const vectors = []
  const BATCH = 16
  for (let i = 0; i < texts.length; i += BATCH) {
    const output = await extractor(texts.slice(i, i + BATCH), { pooling: 'mean', normalize: true })
    vectors.push(...output.tolist())
  }
  for (const v of vectors) {
    if (v.length !== EMBEDDING_DIM) throw new Error(`Expected ${EMBEDDING_DIM}-dimension vectors, got ${v.length}`)
  }
  return vectors
}

/** Embeds one string. */
export async function embedText(text) {
  const [vector] = await embedTexts([text])
  return vector
}
