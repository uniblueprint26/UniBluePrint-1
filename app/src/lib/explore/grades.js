// Grade maths for the grade calculator. Pure functions, no storage.
//
// A calculator is { id, name, totalCredits, target, bands, modules }.
// A module is { id, name, credits, grade } where grade is a percent or null.
// A module can also be waiting on an exam: { pending: true, cwWeight, cwScore }
// where cwWeight is the coursework share of the module (percent) and cwScore
// is the percent scored on it so far.

// Typical Irish honours bands. Colleges differ, so every threshold is editable.
export const DEFAULT_BANDS = { third: 40, h22: 50, h21: 60, first: 70 }

export const BAND_ORDER = [
  { key: 'fail', label: 'Fail', long: 'Below pass' },
  { key: 'third', label: 'Third', long: 'Third class honours' },
  { key: 'h22', label: '2:2', long: 'Second class honours, grade 2' },
  { key: 'h21', label: '2:1', long: 'Second class honours, grade 1' },
  { key: 'first', label: 'First', long: 'First class honours' },
]

export function bandFor(avg, bands = DEFAULT_BANDS) {
  if (avg == null || Number.isNaN(avg)) return null
  if (avg >= bands.first) return 'first'
  if (avg >= bands.h21) return 'h21'
  if (avg >= bands.h22) return 'h22'
  if (avg >= bands.third) return 'third'
  return 'fail'
}

export function bandMeta(key) {
  return BAND_ORDER.find(b => b.key === key) || null
}

export function num(v) {
  if (v === '' || v == null) return null
  const n = Number(String(v).replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

// Overall weighted average over the modules that have a grade.
export function overall(modules) {
  let credits = 0
  let points = 0
  for (const m of modules) {
    const c = num(m.credits)
    const g = num(m.grade)
    if (m.pending || c == null || c <= 0 || g == null) continue
    credits += c
    points += c * g
  }
  return { credits, avg: credits > 0 ? points / credits : null }
}

export function pendingModules(modules) {
  return modules.filter(m => m.pending && num(m.credits) > 0)
}

// What the module needs to finish on so that the average over the counted
// credits plus this module reaches `target` percent. Then, if the module has a
// coursework share, what the exam alone must score.
export function neededFor(modules, pendingModule, target) {
  const { credits, avg } = overall(modules)
  const c = num(pendingModule.credits)
  if (!(c > 0) || target == null) return null
  const sum = (avg || 0) * credits
  const needFinal = (target * (credits + c) - sum) / c
  const cwW = num(pendingModule.cwWeight)
  const cwS = num(pendingModule.cwScore)
  let needExam = null
  if (cwW != null && cwW >= 0 && cwW < 100 && cwS != null) {
    const examW = 100 - cwW
    needExam = (needFinal - (cwW * cwS) / 100) / (examW / 100)
  }
  return { needFinal, needExam }
}

export function round1(n) {
  return Math.round(n * 10) / 10
}

// Words for a needed score: honest at both ends.
export function neededWords(n) {
  if (n == null) return null
  if (n <= 0) return { tone: 'safe', text: 'You are already there, whatever you score.' }
  if (n > 100) return { tone: 'out', text: 'Out of reach with this module alone.' }
  return { tone: 'ok', text: `${Math.ceil(n)}%` }
}
