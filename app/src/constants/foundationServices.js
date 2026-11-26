// The eight Foundation builders in one place: the key used to store answers on
// the device, the title shown to members and the screen that opens the builder.
// The key is also the middle part of the draft key `foundation_draft:<key>:<user id>`
// that useDraftAutosave already writes, so saved answers reopen in the same builder.
export const FOUNDATION_SERVICES = {
  cv:                 { key: 'cv',                 title: 'CV Optimisation',             screen: 'CvBuilder' },
  linkedin:           { key: 'linkedin',           title: 'LinkedIn Optimisation',       screen: 'LinkedinBuilder' },
  cover_letter:       { key: 'cover_letter',       title: 'Cover Letter Assistance',     screen: 'CoverLetterBuilder' },
  application_form:   { key: 'application_form',   title: 'Application Form Assistance', screen: 'ApplicationFormBuilder' },
  interview_prep:     { key: 'interview_prep',     title: 'Interview Preparation',       screen: 'InterviewPrepBuilder' },
  personal_statement: { key: 'personal_statement', title: 'Personal Statement',          screen: 'PersonalStatementBuilder' },
  portfolio_plan:     { key: 'portfolio_plan',     title: 'Portfolio Building',          screen: 'PortfolioPlanBuilder' },
  job_search_support: { key: 'job_search_support', title: 'Job Search Support',          screen: 'JobSearchSupportBuilder' },
}

export const FOUNDATION_SERVICE_KEYS = Object.keys(FOUNDATION_SERVICES)

export function serviceKeyForTitle(title) {
  return FOUNDATION_SERVICE_KEYS.find(k => FOUNDATION_SERVICES[k].title === title) || null
}
