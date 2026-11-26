// Checks an Ireland 2026 issue file against the real page cleaner in app/src/lib/wrapped.js.
//
//   node docs/release/weekly-issue-1/validate-issue.mjs docs/release/weekly-issue-1/issue-1-locked.json
//   node docs/release/weekly-issue-1/validate-issue.mjs docs/release/weekly-issue-1/preview-edition.json
//   node docs/release/weekly-issue-1/validate-issue.mjs docs/release/weekly-issue-1/issue-1-locked.json --fix-timeline
//
// It checks: every page is a kind the app supports and survives cleanPage, no dashes in
// reader facing text, every story and month page has a source, Top 10 items have sources,
// recap rows (6 to 9, 14 words), timeline page numbers point at the right month page, and
// it prints pages per section against the 100 page plan. Exit code 1 means a problem.
// Nothing is written unless you pass --fix-timeline, which renumbers the timeline rows.

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const file = process.argv[2]
const fix = process.argv.includes('--fix-timeline')
if (!file) { console.error('Give the path to an issue JSON file.'); process.exit(2) }

// Load wrapped.js without its React Native import.
const wrappedSrc = fs.readFileSync(path.resolve(here, '../../../app/src/lib/wrapped.js'), 'utf8')
  .replace(/^import \{ linking \} from .*$/m, 'const linking = {}')
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'wrapped-')), 'wrapped.mjs')
fs.writeFileSync(tmp, wrappedSrc)
const { cleanPage, normaliseWrapped, WRAPPED_KINDS } = await import(pathToFileURL(tmp).href)

// The 100 page plan, by section key (from the issue planner). front and close pages are partly
// drawn by the app (cover, contents, founder note, closer), so only the data pages are listed.
const PLAN = {
  front: [3, 'cover, contents and welcome note (app drawn or standard pages)'],
  ubp: [8, 'UBP promo pages, one per feature'],
  months: [7, 'timeline plus six two month pages'],
  sport: [10, 'On the Pitch'],
  culture: [9, 'Culture, music and film'],
  u30: [4, 'Under 30'],
  ahead: [5, 'Getting Ahead'],
  wallet: [4, 'Home and Wallet'],
  body: [4, 'Body and Mind'],
  mind: [4, 'Mind Matters'],
  give: [3, 'Giving Back'],
  made: [5, 'Made in Ireland'],
  life: [4, 'Campus life and then and now'],
  abroad: [2, 'Irish abroad'],
  nums: [3, 'Ireland in numbers'],
  awards: [10, 'UBP Awards (awards pages are added at launch)'],
  county: [6, 'County by county'],
  quiz: [2, 'Quiz'],
  mem: [1, 'In memory'],
  next: [1, 'Looking ahead'],
  fin: [2, 'Finale'],
  close: [3, 'Closing (standard pages)'],
}

const problems = []
const warn = (m) => problems.push(m)
const data = JSON.parse(fs.readFileSync(file, 'utf8'))
const pages = Array.isArray(data.pages) ? data.pages : []
const sectionKeys = new Set((data.sections || []).map(s => s.key))

const DASH = /[‒–—―−]|\s-\s|--/
const words = (t) => (String(t || '').trim().match(/\S+/g) || []).length
const checkText = (label, t) => { if (typeof t === 'string' && DASH.test(t)) warn(`${label}: dash found in "${t.slice(0, 60)}"`) }

function textFields(p) {
  const out = []
  for (const k of ['kicker', 'heading', 'body', 'stat', 'statLabel', 'gaeilge']) if (p[k]) out.push([k, p[k]])
  for (const b of p.bullets || []) out.push(['bullet', b])
  for (const it of p.items || []) {
    if (typeof it === 'string') { out.push(['item', it]); continue }
    for (const k of ['kicker', 'heading', 'body', 'date', 'text', 'title', 'blurb', 'line', 'question', 'note', 'section']) if (it[k]) out.push([`item.${k}`, it[k]])
    for (const o of it.options || []) out.push(['option', o])
  }
  for (const c of p.categories || []) {
    out.push(['category', c.title])
    for (const n of c.nominees || []) { out.push(['nominee', n.name]); out.push(['nominee.why', n.why]) }
  }
  return out
}

const counts = {}
pages.forEach((p, i) => {
  const label = `page ${i + 3} (${p.section || 'no section'} ${p.kind})`
  if (!WRAPPED_KINDS.includes(p.kind)) warn(`${label}: kind not supported by the app`)
  if (!p.section || !sectionKeys.has(p.section)) warn(`${label}: section "${p.section}" is not in sections`)
  let cleaned = null
  try { cleaned = cleanPage(p) } catch { cleaned = null }
  if (!cleaned) warn(`${label}: the app would skip this page`)
  counts[p.section] = (counts[p.section] || 0) + 1
  textFields(p).forEach(([k, t]) => checkText(`${label} ${k}`, t))

  if (p.kind === 'story') {
    const n = words(p.body)
    if (n < 40 || n > 70) warn(`${label}: story body is ${n} words (aim for 40 to 70)`)
    if (!p.source) warn(`${label}: story has no source`)
    if (!p.sourceUrl) warn(`${label}: story has no sourceUrl`)
  }
  if (p.kind === 'month') {
    if (Array.isArray(p.items) && p.items.length) {
      if (p.items.length > 3) warn(`${label}: more than 3 stacked items`)
      p.items.forEach((it, j) => {
        if (!it.source) warn(`${label} item ${j + 1}: no source`)
        if (!it.sourceUrl) warn(`${label} item ${j + 1}: no sourceUrl`)
        if (words(it.body) < 35 || words(it.body) > 75) warn(`${label} item ${j + 1}: body is ${words(it.body)} words`)
      })
    } else {
      if (!p.source) warn(`${label}: month page has no source`)
    }
  }
  if (p.kind === 'top10') {
    if ((p.items || []).length !== 10) warn(`${label}: Top 10 has ${(p.items || []).length} items`)
    ;(p.items || []).forEach((it, j) => {
      if (!it.source) warn(`${label} item ${j + 1}: no source`)
      if (!it.sourceUrl) warn(`${label} item ${j + 1}: no sourceUrl`)
      if (words(it.blurb) > 15) warn(`${label} item ${j + 1}: blurb is ${words(it.blurb)} words (max 15)`)
    })
  }
  if (p.kind === 'recap') {
    const n = (p.items || []).length
    if (n < 6 || n > 9) warn(`${label}: recap has ${n} rows (aim for 6 to 9)`)
    ;(p.items || []).forEach((it, j) => { if (words(it.text) > 14) warn(`${label} row ${j + 1}: ${words(it.text)} words (max 14)`) })
    if (Array.isArray(p.rowSources) && p.rowSources.length !== n) warn(`${label}: rowSources has ${p.rowSources.length} entries for ${n} rows`)
    if (!p.rowSources) warn(`${label}: no rowSources (write where each row comes from)`)
  }
  if (p.kind === 'list') {
    if (!p.source && !(p.bulletSources || []).length) warn(`${label}: list has no source`)
  }
  if (p.kind === 'section' && !p.heading) warn(`${label}: divider has no heading`)
})

// Timeline jumps: each row should point at the month page that holds that month.
for (const [i, p] of pages.entries()) {
  if (p.kind !== 'timeline') continue
  for (const row of p.items || []) {
    const idx = pages.findIndex(q => q.kind === 'month' && (q.items || []).some(it => String(it.kicker).toLowerCase().startsWith(String(row.date).toLowerCase())))
    if (idx < 0) continue
    const want = idx + 3
    if (row.page !== undefined && row.page !== want) {
      if (fix) row.page = want
      else warn(`timeline row ${row.date}: page is ${row.page}, should be ${want} (run with --fix-timeline)`)
    }
  }
}
if (fix) { fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n'); console.log('Timeline page numbers updated in ' + file) }

// The whole file through the app normaliser.
const norm = normaliseWrapped(data)
if (!norm) warn('the app would show nothing from this file')
else if (norm.pages.length !== pages.length) warn(`the app keeps ${norm.pages.length} of ${pages.length} pages`)

console.log(`File: ${file}`)
console.log(`Pages: ${pages.length}\n`)
console.log('Section        written / planned')
let short = []
for (const [k, [planned, note]] of Object.entries(PLAN)) {
  const n = counts[k] || 0
  if (!n && !['front', 'close'].includes(k) && !planned) continue
  console.log(`${k.padEnd(14)} ${String(n).padStart(3)} / ${String(planned).padEnd(3)} ${n < planned ? '(short ' + (planned - n) + ')' : ''}  ${note}`)
  if (n < planned) short.push(`${k} (${n} of ${planned})`)
}
for (const k of Object.keys(counts)) if (!PLAN[k]) console.log(`${k.padEnd(14)} ${String(counts[k]).padStart(3)} / not in plan`)
console.log('\nSections with fewer pages than the plan: ' + (short.join(', ') || 'none'))
console.log('\n' + (problems.length ? `PROBLEMS (${problems.length}):\n- ` + problems.join('\n- ') : 'No problems found. No dashes, every story has a source, every page survives the app cleaner.'))
process.exit(problems.length ? 1 : 0)
