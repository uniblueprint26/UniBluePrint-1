// Turns the structured JSON a generate-* Edge Function writes — cv_documents.
// generated, cover_letters.generated, ... job_search_sessions.student_strategy
// — into one readable plain-text block. Originally built for
// OutputDetailScreen (student-facing, see formatGeneratedDocument below);
// TicketDetailScreen (Handler-facing) reuses the same generic renderer via
// formatDocumentContent({ forHandler: true }) so a Handler actually sees the
// handler_notes/handler_guide content the generator wrote for them, instead
// of the student-safe version that strips it.
//
// Deliberately generic rather than one hand-built template per service:
// every Foundation Blueprint service's OUTPUT_SCHEMA shape differs (CV has
// experience_section/education_section objects, LinkedIn has headline/
// about_section strings, Job Search Support has nested day-by-day plans...),
// and neither consumer is scoped to per-service formatting.
//
// Two different key sets get filtered out, for two different reasons:
//   - STRUCTURAL_KEYS are rendering/provenance metadata, never real content
//     for anyone (section_order, benchmarked_against, compatibility_flag —
//     the latter's own has_issue/explanation already gets folded into
//     student_strategy.compatibility_warning by generate-job-search-support).
//     Always dropped, for both audiences.
//   - HANDLER_ONLY_KEYS (handler_notes, handler_mock_rubric, handler_guide)
//     are explicitly Handler-facing per each generate-* function's own
//     OUTPUT_SCHEMA description — never meant for the student to read, but
//     exactly what a Handler reviewing the draft needs. Dropped only for the
//     student-facing format.
const STRUCTURAL_KEYS = new Set(['section_order', 'benchmarked_against', 'compatibility_flag'])
const HANDLER_ONLY_KEYS = new Set(['handler_notes', 'handler_note', 'handler_mock_rubric', 'handler_guide'])
const INTERNAL_KEYS = new Set([...STRUCTURAL_KEYS, ...HANDLER_ONLY_KEYS])

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

function isDropped(key, forHandler) {
  return forHandler ? STRUCTURAL_KEYS.has(key) : INTERNAL_KEYS.has(key)
}

// One entry inside an array of objects (an experience_section job, a
// five_channel_plan channel, an education entry...). These usually have one
// natural "header" field (job_title, channel, name, day_range...) plus a
// few supporting fields/arrays — print the header as the bullet itself and
// the rest as a small indented block under it, rather than a flat dump.
function renderObjectEntry(obj, depth, forHandler) {
  const entries = Object.entries(obj || {}).filter(([k, v]) => !isDropped(k, forHandler) && !isEmpty(v))
  if (entries.length === 0) return ''
  const headerEntry = entries.find(([, v]) => typeof v === 'string')
  const rest = entries.filter(e => e !== headerEntry)
  const lines = [`${'  '.repeat(depth)}• ${headerEntry ? headerEntry[1].trim() : titleCase(entries[0][0])}`]
  for (const [k, v] of rest) {
    const rendered = renderSubsection(k, v, depth + 1, forHandler)
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

function renderValue(value, depth, forHandler) {
  if (isEmpty(value)) return ''
  if (typeof value === 'string') return indentLines(value.trim(), depth)
  if (typeof value === 'number' || typeof value === 'boolean') return indentLines(String(value), depth)
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (isEmpty(item)) return ''
        if (typeof item === 'string') return `${'  '.repeat(depth)}• ${item.trim()}`
        if (typeof item === 'object') return renderObjectEntry(item, depth, forHandler)
        return `${'  '.repeat(depth)}• ${item}`
      })
      .filter(Boolean)
      .join('\n')
  }
  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([k, v]) => !isDropped(k, forHandler) && !isEmpty(v))
      .map(([k, v]) => renderSubsection(k, v, depth, forHandler))
      .filter(Boolean)
      .join('\n')
  }
  return ''
}

function renderSubsection(key, value, depth, forHandler) {
  const body = renderValue(value, depth, forHandler)
  if (!body) return ''
  if (typeof value === 'string') return `${'  '.repeat(depth)}${titleCase(key)}: ${value.trim()}`
  if (typeof value === 'number' || typeof value === 'boolean') return `${'  '.repeat(depth)}${titleCase(key)}: ${value}`
  return `${'  '.repeat(depth)}${titleCase(key)}:\n${body}`
}

function renderSection(key, value, forHandler) {
  const body = renderValue(value, 0, forHandler)
  if (!body) return ''
  return `${titleCase(key).toUpperCase()}\n${body}`
}

/**
 * @param {unknown} content - a generate-* function's output jsonb (or any
 *   similarly-shaped plain object), or null/undefined if nothing's there yet.
 * @param {{forHandler?: boolean}} [opts] - forHandler:true keeps
 *   handler_notes/handler_guide/handler_mock_rubric in the output (for a
 *   Campus Handler reviewing a draft); false (the default) strips them, for
 *   a student-facing view.
 * @returns {string} plain text, sections separated by a blank line, empty
 *   string if there's nothing renderable.
 */
export function formatDocumentContent(content, opts = {}) {
  const forHandler = !!opts.forHandler
  if (isEmpty(content)) return ''

  // A top-level array (e.g. application_forms.questions — a plain list of
  // Q&A pairs, not a keyed object of named sections) or a bare scalar has no
  // section headings to render — fall back to the same generic value
  // renderer every section body already uses.
  if (Array.isArray(content) || typeof content !== 'object') {
    return renderValue(content, 0, forHandler)
  }

  const orderHint = Array.isArray(content.section_order) ? content.section_order : null
  const keys = Object.keys(content).filter(k => !isDropped(k, forHandler))
  const ordered = orderHint
    ? [...orderHint.filter(k => keys.includes(k)), ...keys.filter(k => !orderHint.includes(k))]
    : keys

  return ordered
    .map(k => renderSection(k, content[k], forHandler))
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

// Student-facing format — unchanged behaviour from before this file grew a
// Handler-facing sibling. Used by OutputDetailScreen.
export function formatGeneratedDocument(generated) {
  return formatDocumentContent(generated, { forHandler: false })
}
