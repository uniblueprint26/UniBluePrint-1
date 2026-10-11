// Turns the structured JSON a generate-* Edge Function writes — cv_documents.
// generated, cover_letters.generated, ... job_search_sessions.student_strategy
// — into one readable plain-text block for OutputDetailScreen. Deliberately
// generic rather than one hand-built template per service: every Foundation
// Blueprint service's OUTPUT_SCHEMA shape differs (CV has experience_section/
// education_section objects, LinkedIn has headline/about_section strings,
// Job Search Support has nested day-by-day plans...), and OutputDetailScreen
// is intentionally scoped to plain text + share, not per-service formatting.
//
// Keys that exist in that JSON for the reviewing Campus Handler/Coach only —
// never meant for the student to read — are dropped. These match each
// generate-* function's own OUTPUT_SCHEMA (see supabase/functions/generate-*/
// index.ts): handler_notes, handler_mock_rubric and handler_guide are
// explicitly Handler-facing; section_order and benchmarked_against are
// rendering/provenance metadata, not content; compatibility_flag is an
// internal routing flag Job Search Support's own handler_guide already acts on.
const INTERNAL_KEYS = new Set([
  'handler_notes', 'handler_note', 'handler_mock_rubric', 'handler_guide',
  'section_order', 'benchmarked_against', 'compatibility_flag',
])

function titleCase(key) {
  return key
    .replace(/_section$/, '')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function indentLines(text, depth) {
  if (!text) return ''
  const prefix = '  '.repeat(depth)
  return text.split('\n').map(line => `${prefix}${line}`).join('\n')
}

// One entry inside an array of objects (an experience_section job, a
// five_channel_plan channel, an education entry...). These usually have one
// natural "header" field (job_title, channel, name, day_range...) plus a
// few supporting fields/arrays — print the header as the bullet itself and
// the rest as a small indented block under it, rather than a flat dump.
function renderObjectEntry(obj, depth) {
  const entries = Object.entries(obj || {}).filter(([k, v]) => !INTERNAL_KEYS.has(k) && !isEmpty(v))
  if (entries.length === 0) return ''
  const headerEntry = entries.find(([, v]) => typeof v === 'string')
  const rest = entries.filter(e => e !== headerEntry)
  const lines = [`${'  '.repeat(depth)}• ${headerEntry ? headerEntry[1].trim() : titleCase(entries[0][0])}`]
  for (const [k, v] of rest) {
    const rendered = renderSubsection(k, v, depth + 1)
    if (rendered) lines.push(rendered)
  }
  return lines.join('\n')
}

function isEmpty(value) {
  if (value == null) return true
  if (typeof value === 'string') return value.trim().length === 0
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

function renderValue(value, depth) {
  if (isEmpty(value)) return ''
  if (typeof value === 'string') return indentLines(value.trim(), depth)
  if (typeof value === 'number' || typeof value === 'boolean') return indentLines(String(value), depth)
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (isEmpty(item)) return ''
        if (typeof item === 'string') return `${'  '.repeat(depth)}• ${item.trim()}`
        if (typeof item === 'object') return renderObjectEntry(item, depth)
        return `${'  '.repeat(depth)}• ${item}`
      })
      .filter(Boolean)
      .join('\n')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([k, v]) => !INTERNAL_KEYS.has(k) && !isEmpty(v))
      .map(([k, v]) => renderSubsection(k, v, depth))
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

function renderSubsection(key, value, depth) {
  const body = renderValue(value, depth)
  if (!body) return ''
  if (typeof value === 'string') return `${'  '.repeat(depth)}${titleCase(key)}: ${value.trim()}`
  if (typeof value === 'number' || typeof value === 'boolean') return `${'  '.repeat(depth)}${titleCase(key)}: ${value}`
  return `${'  '.repeat(depth)}${titleCase(key)}:\n${body}`
}

function renderSection(key, value) {
  const body = renderValue(value, 0)
  if (!body) return ''
  return `${titleCase(key).toUpperCase()}\n${body}`
}

/**
 * @param {unknown} generated - the jsonb column's parsed value (an object),
 *   or null/undefined if nothing's been generated yet.
 * @returns {string} plain text, sections separated by a blank line, empty
 *   string if there's nothing renderable.
 */
export function formatGeneratedDocument(generated) {
  if (!generated || typeof generated !== 'object' || Array.isArray(generated)) return ''

  const orderHint = Array.isArray(generated.section_order) ? generated.section_order : null
  const keys = Object.keys(generated).filter(k => !INTERNAL_KEYS.has(k))
  const ordered = orderHint
    ? [...orderHint.filter(k => keys.includes(k)), ...keys.filter(k => !orderHint.includes(k))]
    : keys

  return ordered
    .map(k => renderSection(k, generated[k]))
    .filter(Boolean)
    .join('\n\n')
    .trim()
}
