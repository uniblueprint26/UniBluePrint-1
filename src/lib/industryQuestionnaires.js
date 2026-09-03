/**
 * The per-industry supplementary questionnaire, browser side.
 *
 * Every industry gets the same generic profile fields (education, experience,
 * skills), but ~13 of the 23 industries are regulated or phase-based fields
 * where a single specific, checkable fact — a registration status, a licence
 * category, an exam stage, an apprenticeship phase — matters more to the
 * generators than anything a generic form field would surface. A student
 * typing "responsibilities" into the generic Experience block has no reason
 * to think to volunteer "NMBI PIN held" or "Phase 4 Electrical" there.
 *
 * Every question below exists because industry_intelligence already has a
 * verified must_have or wording_convention row saying, in effect, "name this
 * fact precisely" — this questionnaire is what actually collects it, rather
 * than hoping the student thinks to mention it unprompted.
 *
 * Deliberately no backend mirror (unlike src/lib/industries.js, which has to
 * match supabase/functions/_shared/industries.ts exactly because both sides
 * run the same resolution logic). This data flows through as self-describing
 * key/value pairs — the `key` below IS the label the backend renders, so the
 * backend needs no awareness of what the actual questions are. Only the
 * frontend needs to know the question set, to draw the form.
 *
 * Each entry: { key, placeholder }. `key` doubles as the visible question
 * label and the property name stored in career_targets.industry_details.
 */

export const INDUSTRY_QUESTIONNAIRES = {
  'Healthcare and Nursing': [
    { key: 'Registration status', placeholder: 'e.g. "NMBI PIN held" / "CORU registered (Social Workers)" / "Application in progress"' },
    { key: 'Clinical area or specialism', placeholder: 'e.g. general nursing, paediatrics, mental health, radiography' },
  ],
  Law: [
    { key: 'Qualification stage', placeholder: 'e.g. "Studying FE-1s" / "PPC1 completed" / "Training contract, 2nd year" / "Newly qualified solicitor"' },
    { key: 'Training contract or pupillage status', placeholder: 'e.g. firm name and year, or "not yet secured"' },
  ],
  'Education and Teaching': [
    { key: 'Teaching Council registration route', placeholder: 'e.g. "Route 1 (primary)" / "Route 2" / "Route 3" / "not yet registered"' },
    { key: 'Subject specialism and Droichead/Cosán status', placeholder: 'e.g. "History & Geography, Droichead in progress"' },
  ],
  Engineering: [
    { key: 'Engineers Ireland registration stage', placeholder: 'e.g. "Student member" / "working toward Chartered Engineer" / "CEng"' },
    { key: 'Engineering discipline', placeholder: 'e.g. civil, mechanical, electrical, structural' },
  ],
  'Construction and Architecture': [
    { key: 'RIAI or SCSI registration status', placeholder: 'e.g. "architectural graduate, working toward RIAI registration"' },
    { key: 'Highest project stage worked on', placeholder: 'e.g. "RIBA Stage 4" — see the wording convention on naming this precisely' },
  ],
  'Social Work and Community': [
    { key: 'CORU registration status', placeholder: 'e.g. "registered with the Social Workers Registration Board" / "application in progress"' },
    { key: 'Garda vetting status', placeholder: 'e.g. "current, renewed 2025"' },
  ],
  'Real Estate and Property': [
    { key: 'PSRA licence category or pathway', placeholder: 'e.g. "Category C (Letting Agent) held" / "working toward IPAV Higher Cert"' },
    { key: 'IPAV or SCSI qualification', placeholder: 'e.g. "IPAV Higher Certificate in Real Estate, in progress"' },
  ],
  'Agriculture and Veterinary': [
    { key: 'VCI registration or Green Cert status', placeholder: 'e.g. "VCI Register of Veterinary Nurses, in progress" / "Green Cert (QQI Level 6) held"' },
    { key: 'Enterprise type or specialism', placeholder: 'e.g. "spring-calving dairy", "large animal practice"' },
  ],
  'Skilled Trades and Apprenticeships': [
    { key: 'Trade and current phase', placeholder: 'e.g. "Electrical, Phase 4" — see the wording convention on naming this precisely' },
    { key: 'Registration status (Safe Electric / RGII)', placeholder: 'e.g. "not yet applicable, apprentice" / "registered on qualification"' },
  ],
  'Insurance and Actuarial': [
    { key: 'Qualification stage', placeholder: 'e.g. "APA (personal general) held" / "CS1, CS2 exempted, sitting CM1"' },
    { key: 'Product line or practice area', placeholder: 'e.g. "personal lines", "general insurance pricing"' },
  ],
  'Aviation and Logistics': [
    { key: 'Licence or certification stage', placeholder: 'e.g. "PPL(A), 65 hours logged" / "CPC held" / "ADR certified"' },
    { key: 'Training route or employer', placeholder: 'e.g. "self-funded", "Aer Lingus cadetship", employer name' },
  ],
  'Beauty, Hairdressing and Aesthetics': [
    { key: 'Apprenticeship year or diploma held', placeholder: 'e.g. "National Hairdressing Apprenticeship, Year 3" / "CIDESCO diploma"' },
    { key: 'Specialism', placeholder: 'e.g. colour and balayage, barbering, HD brows, skin' },
  ],
  'Finance and Accounting': [
    { key: 'Qualification stage', placeholder: 'e.g. "ACA, CAP2 exemptions held, FAE sitting August 2027"' },
    { key: 'Practice area', placeholder: 'e.g. audit, tax, corporate finance, advisory' },
  ],
  'Human Resources and People Operations': [
    { key: 'CIPD membership grade', placeholder: 'e.g. "Associate member" / "Level 5 Diploma in progress" / "not yet a CIPD member"' },
    { key: 'HR specialism', placeholder: 'e.g. generalist, recruitment, employee relations, learning & development' },
  ],
  'Food and Beverage Manufacturing': [
    { key: 'Food safety qualification held', placeholder: 'e.g. "HACCP Level 2 certified" / "BRCGS internal auditor trained"' },
    { key: 'Production area or specialism', placeholder: 'e.g. dairy processing, QA/QC, brewing' },
  ],
}

/** True when this industry has a supplementary questionnaire at all. */
export const hasIndustryQuestionnaire = (industry) =>
  Object.prototype.hasOwnProperty.call(INDUSTRY_QUESTIONNAIRES, industry)
