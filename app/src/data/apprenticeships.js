/**
 * SOLAS Apprenticeship Directory
 *
 * Trades: SOLAS-recognised craft and consortium apprenticeships.
 * Providers: the 16 Education and Training Boards plus TU delivery partners.
 *
 * Source: solas.ie apprenticeship programmes list.
 * Verify trade list at solas.ie/apprenticeship before each release cycle.
 * Verification roadmap: Phase 3 will add SOLAS registration number format check.
 */

// ── Trades ───────────────────────────────────────────────────────────────────
// `category` — 'Craft' (traditional SOLAS craft routes) | 'Consortium' (industry-led)

export const TRADES = [
  // ── Craft apprenticeships ─────────────────────────────────────────────────
  { id: 'electrical',        name: 'Electrical',                       category: 'Craft' },
  { id: 'plumbing',          name: 'Plumbing',                         category: 'Craft' },
  { id: 'carpentry',         name: 'Carpentry and Joinery',            category: 'Craft' },
  { id: 'bricklaying',       name: 'Bricklaying',                      category: 'Craft' },
  { id: 'plastering',        name: 'Plastering',                       category: 'Craft' },
  { id: 'painting',          name: 'Painting and Decorating',          category: 'Craft' },
  { id: 'floor_tiling',      name: 'Floor and Wall Tiling',            category: 'Craft' },
  { id: 'stonemasonry',      name: 'Stonecutting and Stonemasonry',    category: 'Craft' },
  { id: 'metal_fab',         name: 'Metal Fabrication',                category: 'Craft' },
  { id: 'toolmaking',        name: 'Toolmaking',                       category: 'Craft' },
  { id: 'sheet_metal',       name: 'Sheet Metalwork',                  category: 'Craft' },
  { id: 'ag_mechanics',      name: 'Agricultural Mechanics',           category: 'Craft' },
  { id: 'motor_vehicle',     name: 'Motor Mechanics',                  category: 'Craft' },
  { id: 'panelbeating',      name: 'Panelbeating',                     category: 'Craft' },
  { id: 'vehicle_body',      name: 'Vehicle Body Repairs',             category: 'Craft' },
  { id: 'autoelectrics',     name: 'Autoelectrics',                    category: 'Craft' },
  { id: 'security_systems',  name: 'Electronic Security Systems',      category: 'Craft' },
  { id: 'instrumentation',   name: 'Instrumentation',                  category: 'Craft' },
  { id: 'refrigeration',     name: 'Refrigeration and Air Conditioning', category: 'Craft' },
  { id: 'pipefitting',       name: 'Pipefitting',                      category: 'Craft' },
  { id: 'fitting',           name: 'Mechanical Fitting',               category: 'Craft' },
  { id: 'welding',           name: 'Welding',                          category: 'Craft' },
  { id: 'scaffolding',       name: 'Scaffolding',                      category: 'Craft' },
  { id: 'insulation',        name: 'Industrial Insulation',            category: 'Craft' },
  { id: 'groundworks',       name: 'Groundworks',                      category: 'Craft' },
  { id: 'shopfitting',       name: 'Shopfitting',                      category: 'Craft' },
  { id: 'lift_escalator',    name: 'Lift and Escalator Technician',    category: 'Craft' },

  // ── Consortium apprenticeships ────────────────────────────────────────────
  { id: 'accounting_tech',   name: 'Accounting Technician',            category: 'Consortium' },
  { id: 'aircraft_mech',     name: 'Aircraft Mechanics',               category: 'Consortium' },
  { id: 'aviation_mech',     name: 'Aviation Mechanics',               category: 'Consortium' },
  { id: 'bar_management',    name: 'Bar Management and Supervision',   category: 'Consortium' },
  { id: 'biopharma',         name: 'Biopharma Engineering Technician', category: 'Consortium' },
  { id: 'commis_chef',       name: 'Commis Chef',                      category: 'Consortium' },
  { id: 'cybersecurity',     name: 'Cybersecurity Technician',         category: 'Consortium' },
  { id: 'elec_inst',         name: 'Electrical Instrumentation',       category: 'Consortium' },
  { id: 'insurance',         name: 'Insurance Practitioner',           category: 'Consortium' },
  { id: 'hairdressing',      name: 'Hairdressing',                     category: 'Consortium' },
  { id: 'ict_assoc',         name: 'ICT Associate Professional',       category: 'Consortium' },
  { id: 'ict_network',       name: 'ICT Network Engineer',             category: 'Consortium' },
  { id: 'lab_analyst',       name: 'Laboratory Analyst',               category: 'Consortium' },
  { id: 'lean_sigma',        name: 'Lean Sigma Technician',            category: 'Consortium' },
  { id: 'manufacturing_eng', name: 'Manufacturing Engineer',           category: 'Consortium' },
  { id: 'property_survey',   name: 'Property Services Surveying Technician', category: 'Consortium' },
  { id: 'recruitment',       name: 'Recruitment Practice',             category: 'Consortium' },
  { id: 'sales_mgmt',        name: 'Sales Management',                 category: 'Consortium' },
  { id: 'software_dev',      name: 'Software Developer',               category: 'Consortium' },
  { id: 'solar_pv',          name: 'Sustainable Energy Engineering (Solar PV)', category: 'Consortium' },
  { id: 'tourism_hosp',      name: 'Tourism and Hospitality Management', category: 'Consortium' },
]

// ── ETB Training Providers ────────────────────────────────────────────────────
// The 16 ETBs are the primary off-the-job training providers for craft apprenticeships.
// Some consortium programmes are delivered through TUs or industry partners.

export const ETB_PROVIDERS = [
  { id: 'cdetb',  name: 'City of Dublin ETB',           short: 'CDETB',  city: 'Dublin' },
  { id: 'cetb',   name: 'Cork ETB',                     short: 'CETB',   city: 'Cork' },
  { id: 'cmetb',  name: 'Cavan and Monaghan ETB',       short: 'CMETB',  city: 'Cavan · Monaghan' },
  { id: 'detb',   name: 'Donegal ETB',                  short: 'DETB',   city: 'Donegal' },
  { id: 'ddletb', name: 'Dublin and Dún Laoghaire ETB', short: 'DDLETB', city: 'Dublin' },
  { id: 'gretb',  name: 'Galway and Roscommon ETB',     short: 'GRETB',  city: 'Galway · Roscommon' },
  { id: 'ketb',   name: 'Kerry ETB',                    short: 'KETB',   city: 'Kerry' },
  { id: 'kwetb',  name: 'Kildare and Wicklow ETB',      short: 'KWETB',  city: 'Kildare · Wicklow' },
  { id: 'kcetb',  name: 'Kilkenny and Carlow ETB',      short: 'KCETB',  city: 'Kilkenny · Carlow' },
  { id: 'loetb',  name: 'Laois and Offaly ETB',         short: 'LOETB',  city: 'Laois · Offaly' },
  { id: 'lcetb',  name: 'Limerick and Clare ETB',       short: 'LCETB',  city: 'Limerick · Clare' },
  { id: 'lwetb',  name: 'Longford and Westmeath ETB',   short: 'LWETB',  city: 'Longford · Westmeath' },
  { id: 'lmetb',  name: 'Louth and Meath ETB',          short: 'LMETB',  city: 'Louth · Meath' },
  { id: 'msletb', name: 'Mayo, Sligo and Leitrim ETB',  short: 'MSLETB', city: 'Mayo · Sligo · Leitrim' },
  { id: 'tetb',   name: 'Tipperary ETB',                short: 'TETB',   city: 'Tipperary' },
  { id: 'wwetb',  name: 'Waterford and Wexford ETB',    short: 'WWETB',  city: 'Waterford · Wexford' },
  // TU delivery partners (consortium programmes, phase 6/7)
  { id: 'tu_dublin_ap', name: 'TU Dublin',              short: 'TU Dublin', city: 'Dublin' },
  { id: 'mtu_ap',       name: 'MTU Cork',               short: 'MTU Cork',  city: 'Cork' },
  { id: 'atu_ap',       name: 'Atlantic TU',            short: 'ATU',       city: 'Galway · Sligo · Donegal' },
  { id: 'setu_ap',      name: 'South East TU',          short: 'SETU',      city: 'Waterford · Carlow' },
]

/** Search trades by name or category */
export function searchTrades(query) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return TRADES.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.category.toLowerCase().includes(q) ||
    t.id.replace(/_/g, ' ').includes(q)
  )
}

/** Search ETB providers by name, short form, or city */
export function searchProviders(query) {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return ETB_PROVIDERS.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.short.toLowerCase().includes(q) ||
    p.city.toLowerCase().includes(q)
  )
}
