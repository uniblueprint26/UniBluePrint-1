#!/usr/bin/env node
/**
 * Fails if a per-industry lookup object has silently fallen out of sync with
 * the controlled INDUSTRIES vocabulary.
 *
 * This exists because of a real bug: ATS_KEYWORD_BANKS in
 * supabase/functions/_shared/atsKeywords.ts is typed as
 * `Record<Industry | typeof GENERAL, string[]>` — a TypeScript promise that
 * every industry has a bank — but the object literal was never updated across
 * three separate industry-expansion passes this session, so 12 of 27
 * industries had no entry at all. bankForResolvedIndustry() has no fallback
 * for a missing key (`[...ATS_KEYWORD_BANKS[industry], ...]`), so calling it
 * for any of those 12 industries threw a runtime TypeError — inside
 * generate-cv and review-cv, two of the highest-traffic tools in the product.
 * `node --experimental-strip-types --check` (the syntax check used elsewhere
 * in this repo's verification pass) does not catch this, because it only
 * strips types — it never actually type-checks the Record against the
 * Industry union the way a real `tsc` pass would.
 *
 * Two tiers:
 *   CRITICAL — a missing key is a runtime crash risk (the code has no
 *     fallback for an absent entry). Currently just ATS_KEYWORD_BANKS.
 *   EXPECTED-COMPLETE — a missing key degrades output quality silently (no
 *     crash — these objects are read as `obj[key] || fallback`) but was
 *     never meant to be partial. CHANNELS_BY_INDUSTRY and
 *     INTERVIEW_FORMAT_BY_INDUSTRY are both meant to cover every industry.
 *   Reported only, not failed: FRAMEWORK_BY_INDUSTRY and
 *     PORTFOLIO_BY_INDUSTRY are deliberately partial by design — only
 *     industries with a genuinely distinct formal framework or visual
 *     portfolio convention get an entry — so an incomplete list there is not
 *     a bug and this script does not flag it as one.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function extractIndustries() {
  const src = readFileSync(join(root, 'supabase/functions/_shared/industries.ts'), 'utf8')
  const match = src.match(/export const INDUSTRIES = \[([\s\S]*?)\]/)
  if (!match) throw new Error('could not find INDUSTRIES array in industries.ts')
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
}

/** Extracts the top-level keys of `export const NAME: ... = { ... }` or `const NAME: ... = { ... }`. */
function extractObjectKeys(path, varName) {
  const src = readFileSync(join(root, path), 'utf8')
  const declIdx = src.search(new RegExp(`(?:export )?const ${varName}\\b`))
  if (declIdx === -1) throw new Error(`could not find ${varName} in ${path}`)
  const objStart = src.indexOf('{', declIdx)
  let depth = 0
  let end = -1
  for (let i = objStart; i < src.length; i++) {
    if (src[i] === '{') depth++
    if (src[i] === '}') { depth--; if (depth === 0) { end = i; break } }
  }
  const body = src.slice(objStart + 1, end)
  // Keys are either 'Quoted Name' or a bare identifier, always followed by ':'
  // at the start of a line (ignoring leading whitespace) — this deliberately
  // does not try to parse nested objects/arrays as keys.
  const re = /^\s*(?:'([^']+)'|([A-Za-z][A-Za-z ]*?)):/gm
  const keys = []
  let m
  while ((m = re.exec(body))) keys.push((m[1] ?? m[2]).trim())
  return keys
}

const industries = extractIndustries()
let hasCritical = false
let hasExpectedGap = false

function reportMissing(label, path, varName, tier) {
  const keys = extractObjectKeys(path, varName)
  const missing = industries.filter((i) => !keys.includes(i))
  if (missing.length === 0) {
    console.log(`OK: ${label} covers all ${industries.length} industries.`)
    return
  }
  const tag = tier === 'critical' ? 'CRITICAL (runtime crash risk)' : 'GAP (silent quality degradation)'
  console.error(`${tag}: ${label} is missing ${missing.length} industr${missing.length === 1 ? 'y' : 'ies'}:`)
  for (const i of missing) console.error(`  - ${i}`)
  if (tier === 'critical') hasCritical = true
  else hasExpectedGap = true
}

reportMissing('ATS_KEYWORD_BANKS', 'supabase/functions/_shared/atsKeywords.ts', 'ATS_KEYWORD_BANKS', 'critical')
reportMissing('CHANNELS_BY_INDUSTRY', 'supabase/functions/generate-job-search-support/index.ts', 'CHANNELS_BY_INDUSTRY', 'expected-complete')
reportMissing('INTERVIEW_FORMAT_BY_INDUSTRY', 'supabase/functions/generate-interview-prep/index.ts', 'INTERVIEW_FORMAT_BY_INDUSTRY', 'expected-complete')

// Reported for visibility only — these two are deliberately partial by
// design, so an incomplete list is not treated as a failure.
for (const [label, path, varName] of [
  ['FRAMEWORK_BY_INDUSTRY', 'supabase/functions/generate-application-answers/index.ts', 'FRAMEWORK_BY_INDUSTRY'],
  ['PORTFOLIO_BY_INDUSTRY', 'supabase/functions/generate-portfolio-plan/index.ts', 'PORTFOLIO_BY_INDUSTRY'],
]) {
  const keys = extractObjectKeys(path, varName)
  console.log(`INFO: ${label} covers ${keys.length}/${industries.length} industries (deliberately partial by design).`)
}

if (hasCritical) {
  console.error('\nFAIL: at least one CRITICAL gap found — this will crash at runtime for the missing industries.')
  process.exit(1)
}
if (hasExpectedGap) {
  console.error('\nFAIL: at least one expected-complete object has a gap — fix before this drifts further.')
  process.exit(1)
}
console.log('\nAll per-industry lookup objects are in sync with the controlled vocabulary.')
