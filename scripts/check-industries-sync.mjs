#!/usr/bin/env node
/**
 * Fails if the browser copy of the industry vocabulary has drifted from the
 * edge-function copy.
 *
 * The two lists cannot be a single module — one is a Deno `.ts` bundled by the
 * Supabase CLI, the other is imported by Vite from src/ — so this check is what
 * stops them silently disagreeing. A drifted list is not a cosmetic problem: a
 * student could pick an option the server's normaliser has never heard of, and
 * their whole industry layer would fall to `general` with no error anywhere.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function extractList(path, label) {
  const src = readFileSync(join(root, path), 'utf8')
  const match = src.match(/export const INDUSTRIES = \[([\s\S]*?)\]/)
  if (!match) {
    console.error(`FAIL: could not find an INDUSTRIES array in ${label} (${path})`)
    process.exit(1)
  }
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
}

const deno = extractList('supabase/functions/_shared/industries.ts', 'edge functions')
const web = extractList('src/lib/industries.js', 'browser')

const onlyInDeno = deno.filter((i) => !web.includes(i))
const onlyInWeb = web.filter((i) => !deno.includes(i))

if (onlyInDeno.length || onlyInWeb.length) {
  console.error('FAIL: industry vocabulary has drifted between runtimes.')
  if (onlyInDeno.length) console.error('  only in supabase/functions/_shared/industries.ts:', onlyInDeno)
  if (onlyInWeb.length) console.error('  only in src/lib/industries.js:', onlyInWeb)
  process.exit(1)
}

if (deno.join('|') !== web.join('|')) {
  console.error('FAIL: same industries, different order — keep the lists identical so the dropdown matches the server.')
  console.error('  edge:', deno)
  console.error('  web: ', web)
  process.exit(1)
}

console.log(`OK: industry vocabulary in sync across both runtimes (${deno.length} industries).`)
