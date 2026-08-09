/**
 * Builds the full UniBlueprint contract suite into ../ as .docx files.
 * Run: node _build/build.js   (from the contracts directory)
 */

const { guide } = require('./c-guide')
const { partner, coach } = require('./c-external')
const { handler, ambassador } = require('./c-delivery')
const { founder, marketing, outreach, legal, finance, teamMember } = require('./c-internal')
const { nda, ipDeed, dpa, safeguarding } = require('./c-cross')

const DOCS = [
  guide, founder, partner, coach, handler, ambassador,
  marketing, outreach, legal, finance, teamMember,
  nda, ipDeed, dpa, safeguarding,
]

;(async () => {
  const written = []
  for (const make of DOCS) {
    try {
      written.push(await make())
    } catch (err) {
      console.error(`FAILED: ${make.name}\n  ${err.message}`)
      process.exitCode = 1
    }
  }
  console.log(`Wrote ${written.length}/${DOCS.length} documents:`)
  written.forEach(f => console.log('  ' + f))
})()
