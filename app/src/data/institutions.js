/**
 * Irish Third-Level Institution Directory
 *
 * Source: HEA (Higher Education Authority) designated institutions list.
 * Last verified: 2025. Verify at hea.ie before each release cycle.
 *
 * `short`  — the display identifier used in "Campus Connect [short]" header
 * `type`   — 'university' | 'tu' | 'iot' | 'specialist' | 'private' | 'other'
 * `city`   — primary campus city (used as secondary label in picker)
 * `aliases`— additional search terms (old names, alternate spellings)
 */

export const INSTITUTIONS = [
  // ── Universities ─────────────────────────────────────────────────────────────
  {
    id: 'ucd',
    name: 'University College Dublin',
    short: 'UCD',
    type: 'university',
    city: 'Dublin',
    aliases: ['ucd'],
  },
  {
    id: 'tcd',
    name: 'Trinity College Dublin',
    short: 'TCD',
    type: 'university',
    city: 'Dublin',
    aliases: ['tcd', 'trinity', 'university of dublin'],
  },
  {
    id: 'ucc',
    name: 'University College Cork',
    short: 'UCC',
    type: 'university',
    city: 'Cork',
    aliases: ['ucc'],
  },
  {
    id: 'ug',
    name: 'University of Galway',
    short: 'UG',
    type: 'university',
    city: 'Galway',
    aliases: ['nuig', 'nui galway', 'galway'],
  },
  {
    id: 'dcu',
    name: 'Dublin City University',
    short: 'DCU',
    type: 'university',
    city: 'Dublin',
    aliases: ['dcu'],
  },
  {
    id: 'ul',
    name: 'University of Limerick',
    short: 'UL',
    type: 'university',
    city: 'Limerick',
    aliases: ['ul'],
  },
  {
    id: 'mu',
    name: 'Maynooth University',
    short: 'MU',
    type: 'university',
    city: 'Maynooth',
    aliases: ['nui maynooth', 'nuim', 'mu'],
  },

  // ── Technological Universities ────────────────────────────────────────────────
  {
    id: 'tu_dublin',
    name: 'TU Dublin',
    short: 'TU Dublin',
    type: 'tu',
    city: 'Dublin',
    aliases: ['tu dublin', 'technological university dublin', 'dit', 'it blanchardstown', 'it tallaght'],
  },
  {
    id: 'tus_athlone',
    name: 'TUS — Athlone',
    short: 'TUS Athlone',
    type: 'tu',
    city: 'Athlone',
    aliases: ['tus athlone', 'ait', 'athlone it', 'athlone institute of technology'],
  },
  {
    id: 'tus_midwest',
    name: 'TUS — Midwest',
    short: 'TUS Midwest',
    type: 'tu',
    city: 'Limerick · Thurles · Clonmel',
    aliases: ['tus midwest', 'lit', 'limerick it', 'limerick institute of technology', 'tipperary it', 'tit'],
  },
  {
    id: 'atu_galway',
    name: 'ATU — Galway',
    short: 'ATU Galway',
    type: 'tu',
    city: 'Galway',
    aliases: ['atu galway', 'gmit', 'galway mayo it'],
  },
  {
    id: 'atu_sligo',
    name: 'ATU — Sligo',
    short: 'ATU Sligo',
    type: 'tu',
    city: 'Sligo',
    aliases: ['atu sligo', 'it sligo'],
  },
  {
    id: 'atu_donegal',
    name: 'ATU — Donegal',
    short: 'ATU Letterkenny',
    type: 'tu',
    city: 'Letterkenny',
    aliases: ['atu donegal', 'atu letterkenny', 'lyit', 'letterkenny it'],
  },
  {
    id: 'atu_mayo',
    name: 'ATU — Mayo',
    short: 'ATU Mayo',
    type: 'tu',
    city: 'Castlebar',
    aliases: ['atu mayo', 'gmit mayo'],
  },
  {
    id: 'setu_waterford',
    name: 'SETU — Waterford',
    short: 'SETU Waterford',
    type: 'tu',
    city: 'Waterford',
    aliases: ['setu waterford', 'wit', 'waterford it', 'waterford institute'],
  },
  {
    id: 'setu_carlow',
    name: 'SETU — Carlow',
    short: 'SETU Carlow',
    type: 'tu',
    city: 'Carlow',
    aliases: ['setu carlow', 'it carlow', 'itcarlow'],
  },
  {
    id: 'mtu_cork',
    name: 'MTU — Cork',
    short: 'MTU Cork',
    type: 'tu',
    city: 'Cork',
    aliases: ['mtu cork', 'cit', 'cork it', 'cork institute of technology'],
  },
  {
    id: 'mtu_kerry',
    name: 'MTU — Kerry',
    short: 'MTU Kerry',
    type: 'tu',
    city: 'Tralee',
    aliases: ['mtu kerry', 'it tralee', 'itkerry'],
  },

  // ── Institutes of Technology ──────────────────────────────────────────────────
  {
    id: 'dkit',
    name: 'Dundalk Institute of Technology',
    short: 'DKIT',
    type: 'iot',
    city: 'Dundalk',
    aliases: ['dkit', 'dundalk it'],
  },

  // ── Specialist / Medical ──────────────────────────────────────────────────────
  {
    id: 'rcsi',
    name: 'RCSI University of Medicine and Health Sciences',
    short: 'RCSI',
    type: 'specialist',
    city: 'Dublin',
    aliases: ['rcsi', 'royal college of surgeons'],
  },
  {
    id: 'ncad',
    name: 'National College of Art and Design',
    short: 'NCAD',
    type: 'specialist',
    city: 'Dublin',
    aliases: ['ncad'],
  },
  {
    id: 'iadt',
    name: 'Institute of Art, Design + Technology',
    short: 'IADT',
    type: 'specialist',
    city: 'Dún Laoghaire',
    aliases: ['iadt', 'dun laoghaire'],
  },
  {
    id: 'nci',
    name: 'National College of Ireland',
    short: 'NCI',
    type: 'specialist',
    city: 'Dublin',
    aliases: ['nci', 'ifsc'],
  },
  {
    id: 'mic',
    name: 'Mary Immaculate College',
    short: 'MIC',
    type: 'specialist',
    city: 'Limerick',
    aliases: ['mic', 'mary immaculate'],
  },
  {
    id: 'marino',
    name: 'Marino Institute of Education',
    short: 'MIE',
    type: 'specialist',
    city: 'Dublin',
    aliases: ['mie', 'marino'],
  },

  // ── Private Colleges ──────────────────────────────────────────────────────────
  {
    id: 'griffith',
    name: 'Griffith College',
    short: 'Griffith',
    type: 'private',
    city: 'Dublin',
    aliases: ['griffith', 'gcc'],
  },
  {
    id: 'dbs',
    name: 'Dublin Business School',
    short: 'DBS',
    type: 'private',
    city: 'Dublin',
    aliases: ['dbs'],
  },

  // ── Other ─────────────────────────────────────────────────────────────────────
  {
    id: 'other',
    name: 'Other / Not listed',
    short: 'Other',
    type: 'other',
    city: '',
    aliases: [],
  },
]

/** Search across name, short, city, and aliases */
export function searchInstitutions(query) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return INSTITUTIONS.filter(inst =>
    inst.name.toLowerCase().includes(q) ||
    inst.short.toLowerCase().includes(q) ||
    inst.city.toLowerCase().includes(q) ||
    inst.aliases.some(a => a.includes(q))
  )
}

/** Group label for picker display */
export const TYPE_LABELS = {
  university:  'Universities',
  tu:          'Technological Universities',
  iot:         'Institutes of Technology',
  specialist:  'Specialist Colleges',
  private:     'Private Colleges',
  other:       'Other',
}
