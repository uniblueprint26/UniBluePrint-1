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
  {
    id: 'portobello',
    name: 'Portobello Institute',
    short: 'Portobello',
    type: 'private',
    city: 'Dublin',
    aliases: ['portobello', 'portobello institute'],
  },
  {
    id: 'lsb',
    name: 'LSB College',
    short: 'LSB',
    type: 'private',
    city: 'Dublin',
    aliases: ['lsb', 'lsb college'],
  },

  // ── Further Education and Training Colleges ───────────────────────────────────
  // ETB-operated and standalone FE colleges offering QQI Level 5 / 6 programmes.
  // Source: ETB Ireland / SOLAS. Verify at etbi.ie before each release cycle.

  // City of Dublin ETB (CDETB)
  {
    id: 'bcfe',
    name: 'Ballsbridge College of Further Education',
    short: 'BCFE',
    type: 'fet',
    city: 'Dublin',
    aliases: ['bcfe', 'ballsbridge cfe', 'ballsbridge college'],
  },
  {
    id: 'coliste_dhulagh',
    name: 'Coláiste Dhúlaigh College of Further Education',
    short: 'CDU',
    type: 'fet',
    city: 'Coolock, Dublin',
    aliases: ['cdu', 'colaiste dhulagh', 'coolock cfe'],
  },
  {
    id: 'coliste_ide',
    name: 'Coláiste Íde College of Further Education',
    short: 'Coláiste Íde',
    type: 'fet',
    city: 'Finglas, Dublin',
    aliases: ['colaiste ide', 'finglas cfe', 'coliste ide'],
  },
  {
    id: 'dundrum_cfe',
    name: 'Dundrum College of Further Education',
    short: 'Dundrum CFE',
    type: 'fet',
    city: 'Dundrum, Dublin',
    aliases: ['dundrum cfe', 'dundrum college'],
  },
  {
    id: 'greenhills_cfe',
    name: 'Greenhills College of Further Education',
    short: 'Greenhills',
    type: 'fet',
    city: 'Walkinstown, Dublin',
    aliases: ['greenhills cfe', 'greenhills college', 'walkinstown cfe'],
  },
  {
    id: 'inchicore_cfe',
    name: 'Inchicore College of Further Education',
    short: 'Inchicore',
    type: 'fet',
    city: 'Dublin',
    aliases: ['inchicore cfe', 'inchicore college'],
  },
  {
    id: 'killester_cfe',
    name: 'Killester College of Further Education',
    short: 'Killester',
    type: 'fet',
    city: 'Killester, Dublin',
    aliases: ['killester cfe', 'killester college'],
  },
  {
    id: 'liberties',
    name: 'Liberties College',
    short: 'Liberties',
    type: 'fet',
    city: 'Dublin 8',
    aliases: ['liberties college', 'the liberties', 'liberties cfe'],
  },
  {
    id: 'marino_cfe',
    name: 'Marino College of Further Education',
    short: 'Marino CFE',
    type: 'fet',
    city: 'Fairview, Dublin',
    aliases: ['marino cfe', 'marino college fairview', 'fairview cfe'],
  },
  {
    id: 'pearse_cfe',
    name: 'Pearse College of Further Education',
    short: 'Pearse CFE',
    type: 'fet',
    city: 'Crumlin, Dublin',
    aliases: ['pearse cfe', 'pearse college', 'crumlin cfe'],
  },
  {
    id: 'plunket',
    name: 'Plunket College',
    short: 'Plunket',
    type: 'fet',
    city: 'Whitehall, Dublin',
    aliases: ['plunket college', 'plunkett', 'plunket whitehall'],
  },
  {
    id: 'rathmines_cfe',
    name: 'Rathmines College of Further Education',
    short: 'Rathmines',
    type: 'fet',
    city: 'Dublin 6',
    aliases: ['rathmines cfe', 'rathmines college'],
  },
  {
    id: 'scb',
    name: 'Senior College Ballyfermot',
    short: 'SCB',
    type: 'fet',
    city: 'Ballyfermot, Dublin',
    aliases: ['scb', 'senior college ballyfermot', 'ballyfermot cfe'],
  },
  {
    id: 'whitehall_cfe',
    name: 'Whitehall College of Further Education',
    short: 'Whitehall CFE',
    type: 'fet',
    city: 'Whitehall, Dublin',
    aliases: ['whitehall cfe', 'whitehall college'],
  },

  // Dublin and Dún Laoghaire ETB (DDLETB)
  {
    id: 'bife',
    name: 'Bray Institute of Further Education',
    short: 'BIFE',
    type: 'fet',
    city: 'Bray, Wicklow',
    aliases: ['bife', 'bray institute', 'bray cfe'],
  },
  {
    id: 'sallynoggin_cfe',
    name: 'Sallynoggin College of Further Education',
    short: 'SCFE (Sallynog.)',
    type: 'fet',
    city: 'Dún Laoghaire',
    aliases: ['sallynoggin', 'sallynoggin cfe', 'sallynoggin college'],
  },
  {
    id: 'scdl',
    name: 'Senior College Dún Laoghaire',
    short: 'SCDL',
    type: 'fet',
    city: 'Dún Laoghaire',
    aliases: ['scdl', 'senior college dun laoghaire'],
  },
  {
    id: 'stillorgan_cfe',
    name: 'Stillorgan College of Further Education',
    short: 'Stillorgan',
    type: 'fet',
    city: 'Stillorgan, Dublin',
    aliases: ['stillorgan cfe', 'stillorgan college'],
  },

  // Kildare and Wicklow ETB (KWETB)
  {
    id: 'newbridge_cfe',
    name: 'Newbridge College of Further Education',
    short: 'Newbridge CFE',
    type: 'fet',
    city: 'Newbridge, Kildare',
    aliases: ['newbridge cfe', 'newbridge college'],
  },
  {
    id: 'wicklow_cfe',
    name: 'Wicklow College of Further Education',
    short: 'Wicklow CFE',
    type: 'fet',
    city: 'Wicklow Town',
    aliases: ['wicklow cfe', 'wicklow college'],
  },

  // Louth and Meath ETB (LMETB)
  {
    id: 'dife',
    name: 'Drogheda Institute of Further Education',
    short: 'DIFE',
    type: 'fet',
    city: 'Drogheda, Louth',
    aliases: ['dife', 'drogheda institute', 'drogheda cfe'],
  },

  // Cork ETB (CETB)
  {
    id: 'csn',
    name: 'Coláiste Stiofáin Naofa',
    short: 'CSN',
    type: 'fet',
    city: 'Cork',
    aliases: ['csn', 'colaiste stiofain naofa', 'cork college of commerce', 'ccc cork'],
  },
  {
    id: 'mallow_cfe',
    name: 'Mallow College of Further Education',
    short: 'Mallow CFE',
    type: 'fet',
    city: 'Mallow, Cork',
    aliases: ['mallow cfe', 'mallow college'],
  },

  // Limerick and Clare ETB (LCETB)
  {
    id: 'lcfe',
    name: 'Limerick College of Further Education',
    short: 'LCFE',
    type: 'fet',
    city: 'Limerick',
    aliases: ['lcfe', 'limerick cfe', 'limerick college of fe'],
  },

  // Galway and Roscommon ETB (GRETB)
  {
    id: 'gti',
    name: 'Galway Technical Institute',
    short: 'GTI',
    type: 'fet',
    city: 'Galway',
    aliases: ['gti', 'galway technical', 'galway tech institute'],
  },

  // Kerry ETB (KETB)
  {
    id: 'kerry_college',
    name: 'Kerry College of Further Education',
    short: 'Kerry College',
    type: 'fet',
    city: 'Tralee, Kerry',
    aliases: ['kerry college', 'kerry cfe', 'tralee cfe'],
  },

  // Tipperary ETB (TETB)
  {
    id: 'tipperary_cfe',
    name: 'Tipperary College of Further Education',
    short: 'Tipp CFE',
    type: 'fet',
    city: 'Thurles · Clonmel',
    aliases: ['tipperary cfe', 'tipperary college', 'thurles cfe', 'tipp cfe'],
  },

  // Waterford and Wexford ETB (WWETB)
  {
    id: 'wcfe',
    name: 'Waterford College of Further Education',
    short: 'WCFE',
    type: 'fet',
    city: 'Waterford',
    aliases: ['wcfe', 'waterford cfe', 'waterford college of fe'],
  },
  {
    id: 'wexford_cfe',
    name: 'Wexford College of Further Education',
    short: 'Wexford CFE',
    type: 'fet',
    city: 'Wexford Town',
    aliases: ['wexford cfe', 'wexford college'],
  },

  // Mayo, Sligo and Leitrim ETB (MSLETB)
  {
    id: 'sligo_cfe',
    name: 'Sligo College of Further Education',
    short: 'SCFE',
    type: 'fet',
    city: 'Sligo',
    aliases: ['scfe', 'sligo cfe', 'sligo college'],
  },

  // Donegal ETB (DETB)
  {
    id: 'donegal_cfe',
    name: 'Donegal College of Further Education',
    short: 'Donegal CFE',
    type: 'fet',
    city: 'Killybegs, Donegal',
    aliases: ['donegal cfe', 'donegal college', 'killybegs cfe'],
  },

  // Cavan and Monaghan ETB (CMETB)
  {
    id: 'cavan_fe',
    name: 'Cavan Institute of Further Education',
    short: 'Cavan FE',
    type: 'fet',
    city: 'Cavan',
    aliases: ['cavan fe', 'cavan institute', 'cavan cfe'],
  },
  {
    id: 'monaghan_cfe',
    name: 'Monaghan College of Further Education',
    short: 'Monaghan CFE',
    type: 'fet',
    city: 'Monaghan',
    aliases: ['monaghan cfe', 'monaghan college'],
  },

  // Kilkenny and Carlow ETB (KCETB)
  {
    id: 'kilkenny_cfe',
    name: 'Kilkenny College of Further Education',
    short: 'Kilkenny CFE',
    type: 'fet',
    city: 'Kilkenny',
    aliases: ['kilkenny cfe', 'kilkenny college'],
  },

  // Laois and Offaly ETB (LOETB)
  {
    id: 'portlaoise_cfe',
    name: 'Portlaoise College of Further Education',
    short: 'Portlaoise CFE',
    type: 'fet',
    city: 'Portlaoise, Laois',
    aliases: ['portlaoise cfe', 'portlaoise college'],
  },

  // Longford and Westmeath ETB (LWETB)
  {
    id: 'longford_cfe',
    name: 'Longford College of Further Education',
    short: 'Longford CFE',
    type: 'fet',
    city: 'Longford',
    aliases: ['longford cfe', 'longford college'],
  },
  {
    id: 'mullingar_cfe',
    name: 'Mullingar College of Further Education',
    short: 'Mullingar CFE',
    type: 'fet',
    city: 'Mullingar, Westmeath',
    aliases: ['mullingar cfe', 'mullingar college'],
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
  fet:         'Further Education Colleges',
  other:       'Other',
}
