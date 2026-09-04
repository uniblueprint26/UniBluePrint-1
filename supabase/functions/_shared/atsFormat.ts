// Deterministic ATS-parseability scoring for generated CVs.
//
// Replaces what used to be a hardcoded `formattingScore = 95` justified only by
// a comment. Two kinds of check live here, reported separately and honestly:
//
// 1. TEMPLATE GUARANTEES — structural properties that are true by construction
//    of CvPreview.jsx for BOTH style variants (classic_ats and modern): a single
//    flow-layout column, no <table> elements, no CSS multi-column, and contact
//    info rendered as plain body text under the name — never isolated in a page
//    header/footer, which some ATS parsers strip (the "70% of ATS rejections are
//    formatting" research finding). These can't vary per-generation, so they're
//    reported as fixed passing checks rather than silently inflating the number.
//    If the render template ever changes structurally, this file must be updated
//    with it — that coupling is the honest cost of a static template guarantee.
//
// 2. CONTENT CHECKS — properties that genuinely vary with each generation and
//    are measured, not assumed: contact-field completeness (ATS field extraction
//    pipelines pull name/email/phone into structured fields — a missing field is
//    an extraction failure), standard section naming (parsers map sections by
//    recognised headings), bullet length (Law Society of Ireland guidance: a
//    statement running over several lines is too long), and bullet presence.

export interface FormatCheck {
  check: string
  passed: boolean
  detail: string
}

interface GeneratedCv {
  section_order?: string[]
  experience_section?: { job_title?: string; bullets?: string[] }[]
  projects_section?: string[]
  achievements_section?: string[]
  education_section?: { details?: string[] }[]
}

interface PersonalInfo {
  full_name?: string
  email?: string
  phone?: string
  location?: string
}

const STANDARD_SECTIONS = new Set(['summary', 'experience', 'education', 'projects', 'skills', 'achievements'])
const MAX_BULLET_CHARS = 300

export function computeFormattingScore(
  generated: GeneratedCv,
  personalInfo: PersonalInfo,
): { score: number; checks: FormatCheck[] } {
  const checks: FormatCheck[] = [
    { check: 'single_column_layout', passed: true, detail: 'Template renders one flow-layout column — no tables, text boxes, or CSS multi-column (guaranteed by template, both styles).' },
    { check: 'contact_in_body_text', passed: true, detail: 'Contact details render as plain body text under the name, never in a page header/footer that ATS parsers can strip (guaranteed by template, both styles).' },
  ]
  let score = 100

  // Contact-field completeness — ATS field extraction needs each of these.
  const contactFields: [string, string | undefined][] = [
    ['full_name', personalInfo.full_name],
    ['email', personalInfo.email],
    ['phone', personalInfo.phone],
    ['location', personalInfo.location],
  ]
  const missingContact = contactFields.filter(([, v]) => !v || !String(v).trim()).map(([k]) => k)
  score -= missingContact.length * 8
  checks.push({
    check: 'contact_fields_complete',
    passed: missingContact.length === 0,
    detail: missingContact.length === 0
      ? 'Name, email, phone, and location all present for ATS field extraction.'
      : `Missing contact field(s): ${missingContact.join(', ')} — ATS field extraction will have gaps.`,
  })

  // Standard section names — parsers map content by recognised headings.
  const sectionOrder = generated.section_order || []
  const unknownSections = sectionOrder.filter(s => !STANDARD_SECTIONS.has(s))
  score -= unknownSections.length * 10
  checks.push({
    check: 'standard_section_names',
    passed: unknownSections.length === 0,
    detail: unknownSections.length === 0
      ? 'All sections use standard, parser-recognised names.'
      : `Non-standard section name(s): ${unknownSections.join(', ')} — ATS parsers may fail to map these.`,
  })

  // Bullet length — anything running over several lines reads badly and parses worse.
  const allBullets: string[] = [
    ...(generated.experience_section || []).flatMap(r => r.bullets || []),
    ...(generated.projects_section || []),
    ...(generated.achievements_section || []),
    ...(generated.education_section || []).flatMap(e => e.details || []),
  ]
  const overlong = allBullets.filter(b => b.length > MAX_BULLET_CHARS)
  score -= Math.min(overlong.length * 3, 15)
  checks.push({
    check: 'bullet_length',
    passed: overlong.length === 0,
    detail: overlong.length === 0
      ? `All ${allBullets.length} bullets within the ${MAX_BULLET_CHARS}-character readability limit.`
      : `${overlong.length} bullet(s) exceed ${MAX_BULLET_CHARS} characters — a statement running over several lines is too long.`,
  })

  // Every listed role should carry at least one bullet — a bare title/company
  // line gives both the parser and the recruiter nothing to extract.
  const emptyRoles = (generated.experience_section || []).filter(r => !(r.bullets || []).length)
  score -= Math.min(emptyRoles.length * 5, 15)
  checks.push({
    check: 'roles_have_bullets',
    passed: emptyRoles.length === 0,
    detail: emptyRoles.length === 0
      ? 'Every experience entry carries at least one achievement bullet.'
      : `${emptyRoles.length} experience entr${emptyRoles.length === 1 ? 'y' : 'ies'} with no bullets.`,
  })

  return { score: Math.max(0, score), checks }
}
