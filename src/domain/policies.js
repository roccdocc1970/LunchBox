/**
 * Policy chunking — pure functions, no React, no database (domain layer).
 *
 * RAG searches by CHUNK, so how a document is cut decides how well retrieval works:
 *  - cut on headings and paragraphs, never mid-sentence where it can be avoided;
 *  - keep a short overlap between neighbouring chunks of the same section, so a rule and the
 *    exception that follows it are not separated;
 *  - put the section path (e.g. "Parent Handbook > Late pickup") at the top of every chunk, so a chunk
 *    is never an anonymous fragment ("the fee is $12" — for what?);
 *  - keep lists together, and split an over-long paragraph on sentence boundaries.
 */

const HEADING = /^(#{1,6})\s+(.*\S)\s*$/

function splitLong(paragraph, maxChars) {
  if (paragraph.length <= maxChars) return [paragraph]
  const sentences = paragraph.split(/(?<=[.!?])\s+/)
  const pieces = []
  let buf = ''
  for (const sentence of sentences) {
    if (sentence.length > maxChars) {
      if (buf) { pieces.push(buf); buf = '' }
      for (let i = 0; i < sentence.length; i += maxChars) pieces.push(sentence.slice(i, i + maxChars))
    } else if (buf && buf.length + sentence.length + 1 > maxChars) {
      pieces.push(buf)
      buf = sentence
    } else {
      buf = buf ? `${buf} ${sentence}` : sentence
    }
  }
  if (buf) pieces.push(buf)
  return pieces
}

function overlapTail(text, overlapChars) {
  if (!overlapChars) return ''
  const tail = text.slice(-overlapChars)
  const firstSpace = tail.search(/\s/)
  return (firstSpace > 0 && firstSpace < 40 ? tail.slice(firstSpace) : tail).trim()
}

/**
 * Splits Markdown (or plain text) into chunks: [{ index, heading, content }].
 * `content` always starts with the section path so the chunk stands on its own.
 */
export function chunkMarkdown(text, { maxChars = 1100, overlapChars = 120, title = '' } = {}) {
  const lines = String(text ?? '').replace(/\r\n?/g, '\n').split('\n')
  const sections = []
  const stack = []
  let current = { heading: title, paragraphs: [] }
  let para = []

  const flushPara = () => {
    if (para.length) { current.paragraphs.push(para.join('\n').trim()); para = [] }
  }
  const flushSection = () => {
    flushPara()
    if (current.paragraphs.length) sections.push(current)
  }

  for (const line of lines) {
    const m = HEADING.exec(line)
    if (m) {
      flushSection()
      const level = m[1].length
      while (stack.length && stack[stack.length - 1].level >= level) stack.pop()
      stack.push({ level, text: m[2] })
      current = { heading: stack.map(s => s.text).join(' > '), paragraphs: [] }
    } else if (line.trim() === '') {
      flushPara()
    } else {
      para.push(line)
    }
  }
  flushSection()

  const chunks = []
  for (const section of sections) {
    const pieces = section.paragraphs.flatMap(p => splitLong(p, maxChars))
    let buf = ''
    let tail = ''
    const emit = () => {
      if (buf.trim()) {
        chunks.push({ heading: section.heading, body: buf.trim() })
        tail = overlapTail(buf, overlapChars)
        buf = ''
      }
    }
    for (const piece of pieces) {
      if (buf && buf.length + piece.length + 2 > maxChars) {
        emit()
        buf = tail ? `${tail}\n\n` : ''
      }
      buf = buf ? `${buf}\n\n${piece}` : piece
    }
    emit()
  }

  return chunks.map((c, i) => ({
    index: i,
    heading: c.heading,
    content: c.heading ? `${c.heading}\n\n${c.body}` : c.body,
  }))
}
