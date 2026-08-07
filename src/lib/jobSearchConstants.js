// Shared between JobSearchSupportPage (the full form) and CareerProfilePage's
// Quick Generate panel (the one-field version). Lives here rather than being
// exported from JobSearchSupportPage itself, since that page is lazy-loaded —
// a static import from another page would pull it into an eager bundle instead
// of its own split chunk.
export const OPPORTUNITY_TYPES = [
  ['graduate_scheme', 'Graduate scheme'],
  ['internship', 'Internship'],
  ['part_time', 'Part-time job'],
  ['placement_year', 'Placement year'],
  ['work_experience', 'Work experience'],
]
