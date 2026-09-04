/**
 * Combines all 15 contracts into one .docx for sending to the legal team.
 *
 * Each contract becomes its own Word section: its own page break, its own
 * footer showing its own ref code, but continuous page numbering across the
 * whole file. A small grey "DOCUMENT NN · REF" divider is inserted above
 * each contract's own title, tagged as a real Word Heading 1 — that's what
 * makes all 15 show up in Word's Navigation Pane, so legal can jump straight
 * to any one of them instead of scrolling.
 *
 * Run: node _build/build-merged.js   (from the contracts directory)
 */

const fs = require('fs')
const path = require('path')

const libPath     = require.resolve('./lib')
const collectLib  = require('./lib-collect')

require.cache[libPath] = {
  id: libPath, filename: libPath, loaded: true, exports: collectLib, children: [], paths: [],
}

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
  for (const make of DOCS) {
    try {
      await make()
    } catch (err) {
      console.error(`FAILED collecting: ${make.name}\n  ${err.message}`)
      process.exitCode = 1
    }
  }

  const {
    Document, Packer, Paragraph, TextRun, Header, Footer,
    AlignmentType, PageNumber, BorderStyle, SectionType, HeadingLevel,
  } = require('docx')

  const NAVY = '1E3A5F'
  const GREY = '595959'
  const RULE = 'BFBFBF'

  const registry = collectLib.__registry

  const sections = registry.map(doc => {
    const num = doc.file.slice(0, 2)

    // Real Word Heading 1 (so it lands in the Navigation Pane), styled small
    // and grey so it reads as a divider, not a second competing title.
    const divider = new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 0, after: 40 },
      children: [new TextRun({
        text: `DOCUMENT ${num}  ·  ${doc.ref}`,
        bold: true, size: 18, color: GREY, font: 'Calibri',
      })],
    })

    return {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 120 },
            children: [new TextRun({ text: 'UniBlueprint Contract Suite', bold: true, size: 18, color: NAVY, font: 'Calibri' })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 8 } },
            children: [
              new TextRun({ text: `${doc.ref}  ·  Page `, size: 16, color: GREY, font: 'Calibri' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY, font: 'Calibri' }),
              new TextRun({ text: ' of ', size: 16, color: GREY, font: 'Calibri' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GREY, font: 'Calibri' }),
            ],
          })],
        }),
      },
      children: [divider, ...doc.children],
    }
  })

  const finalDoc = new Document({
    creator: 'UniBlueprint',
    title: 'UniBlueprint Contract Suite — Complete',
    description: 'All 15 UniBlueprint contract templates combined into one document for legal review.',
    styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
    sections,
  })

  const buf = await Packer.toBuffer(finalDoc)
  const out = path.join(__dirname, '..', 'UniBlueprint-Contract-Suite-Combined.docx')
  fs.writeFileSync(out, buf)

  console.log(`Wrote ${out}`)
  console.log(`${registry.length} documents merged, ${(buf.length / 1024).toFixed(0)} KB`)
})()
