/**
 * Shared rendering helpers for the UniBlueprint contract suite.
 *
 * Every document is A4 (docx-js default), Calibri 11pt body, with manually
 * numbered clauses. Manual numbering is deliberate: legal documents are
 * cross-referenced by clause number, so the numbers must be stable text
 * rather than a rendered list counter that shifts if a clause is inserted.
 */

const {
  Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  Header, Footer, PageNumber, TabStopType, LevelFormat, convertInchesToTwip,
} = require('docx')

const NAVY = '1E3A5F'
const GREY = '595959'
const RULE = 'BFBFBF'

// ── Text blocks ──────────────────────────────────────────────────────────────

/** Document title. */
function Title(text) {
  return new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text, bold: true, size: 32, color: NAVY, font: 'Calibri' })],
  })
}

/** Sub-title under the document title (e.g. the role name). */
function Subtitle(text) {
  return new Paragraph({
    spacing: { after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 8 } },
    children: [new TextRun({ text, size: 22, color: GREY, font: 'Calibri' })],
  })
}

/** Numbered top-level clause heading, e.g. CL('1', 'Definitions'). */
function CL(num, text) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    keepNext: true,
    children: [new TextRun({ text: `${num}.  ${text}`, bold: true, size: 24, color: NAVY, font: 'Calibri' })],
  })
}

/** Un-numbered section heading (recitals, schedules). */
function H(text) {
  return new Paragraph({
    spacing: { before: 280, after: 120 },
    keepNext: true,
    children: [new TextRun({ text, bold: true, size: 24, color: NAVY, font: 'Calibri' })],
  })
}

/**
 * Numbered sub-clause, e.g. S('1.1', 'text').
 * Hanging indent keeps wrapped lines aligned under the text, not the number.
 */
function S(num, text) {
  return new Paragraph({
    spacing: { after: 120 },
    indent: { left: 720, hanging: 720 },
    children: [
      new TextRun({ text: `${num}`, size: 22, font: 'Calibri' }),
      new TextRun({ text: `\t${text}`, size: 22, font: 'Calibri' }),
    ],
    tabStops: [{ type: TabStopType.LEFT, position: 720 }],
  })
}

/** Plain body paragraph. */
function P(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    indent: opts.indent ? { left: opts.indent } : undefined,
    alignment: opts.center ? AlignmentType.CENTER : undefined,
    children: [new TextRun({
      text,
      size: 22,
      font: 'Calibri',
      bold: opts.bold || false,
      italics: opts.italic || false,
      color: opts.grey ? GREY : undefined,
    })],
  })
}

/** Bulleted item, indented under a sub-clause. */
function B(text, level = 0) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 1080 + level * 360, hanging: 360 },
    children: [
      new TextRun({ text: '•', size: 22, font: 'Calibri' }),
      new TextRun({ text: `\t${text}`, size: 22, font: 'Calibri' }),
    ],
    tabStops: [{ type: TabStopType.LEFT, position: 1080 + level * 360 }],
  })
}

/** Lettered sub-item, e.g. L('a', 'text'). */
function L(letter, text, level = 0) {
  return new Paragraph({
    spacing: { after: 80 },
    indent: { left: 1440 + level * 360, hanging: 360 },
    children: [
      new TextRun({ text: `(${letter})`, size: 22, font: 'Calibri' }),
      new TextRun({ text: `\t${text}`, size: 22, font: 'Calibri' }),
    ],
    tabStops: [{ type: TabStopType.LEFT, position: 1440 + level * 360 }],
  })
}

/** A field the signer must complete before execution. Rendered as a highlighted blank. */
function FILL(label) {
  return `[${label}]`
}

/** Spacer. */
function GAP(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun({ text: '', size: 22 })] }))
}

// ── Tables ───────────────────────────────────────────────────────────────────

const TOTAL_W = 9360 // usable width inside A4 with 1in margins, in DXA

function cell(text, { bold = false, shade = null, width, align } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: shade ? { type: ShadingType.CLEAR, fill: shade, color: 'auto' } : undefined,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({
      alignment: align === 'right' ? AlignmentType.RIGHT : undefined,
      children: [new TextRun({
        text, bold, size: 20, font: 'Calibri',
        color: shade === NAVY ? 'FFFFFF' : undefined,
      })],
    })],
  })
}

/**
 * Fee / schedule table.
 * `cols` are relative weights; they are normalised to the full text width so
 * the table always spans the page and never overflows.
 */
function TABLE(headers, rows, cols) {
  const weights = cols || headers.map(() => 1)
  const sum = weights.reduce((a, b) => a + b, 0)
  const widths = weights.map(w => Math.round((w / sum) * TOTAL_W))
  // Absorb any rounding drift into the last column so widths sum exactly.
  widths[widths.length - 1] += TOTAL_W - widths.reduce((a, b) => a + b, 0)

  return new Table({
    columnWidths: widths,
    width: { size: TOTAL_W, type: WidthType.DXA },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => cell(h, { bold: true, shade: NAVY, width: widths[i] })),
      }),
      ...rows.map((r, ri) => new TableRow({
        children: r.map((c, i) => cell(c, {
          width: widths[i],
          shade: ri % 2 === 1 ? 'F2F2F2' : null,
          align: i > 0 && /^[€\d]/.test(c) ? 'right' : undefined,
        })),
      })),
    ],
  })
}

// ── Execution blocks ─────────────────────────────────────────────────────────

/** Signature block for one party. `role` is the descriptor under the line. */
function SIG(partyLabel, nameLabel, opts = {}) {
  const out = [
    new Paragraph({
      spacing: { before: 240, after: 160 },
      children: [new TextRun({ text: partyLabel, bold: true, size: 22, font: 'Calibri' })],
    }),
  ]

  const line = (label, width = 5400) => new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({
      text: ' '.repeat(Math.round(width / 60)),
      size: 22, font: 'Calibri',
      underline: { type: 'single' },
    })],
  })

  const caption = t => new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text: t, size: 18, color: GREY, font: 'Calibri' })],
  })

  out.push(line(), caption('Signature'))
  out.push(line(), caption(nameLabel || 'Print name'))

  if (opts.position) {
    out.push(line(), caption('Position / title'))
  }

  out.push(line(3000), caption('Date'))

  if (opts.witness) {
    out.push(new Paragraph({
      spacing: { before: 200, after: 120 },
      children: [new TextRun({ text: 'In the presence of (witness):', bold: true, size: 22, font: 'Calibri' })],
    }))
    out.push(line(), caption('Witness signature'))
    out.push(line(), caption('Witness name'))
    out.push(line(), caption('Witness address'))
    out.push(line(3000), caption('Date'))
  }

  return out
}

/** Standard "executed as an agreement" lead-in. */
function EXECUTION(text) {
  return [
    new Paragraph({
      spacing: { before: 400, after: 200 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: RULE, space: 12 } },
      children: [new TextRun({
        text: text || 'Signed by the parties on the date first written above.',
        size: 22, font: 'Calibri', italics: true,
      })],
    }),
  ]
}

// ── Callout box ──────────────────────────────────────────────────────────────

/** Amber-shaded note box for items that must be completed or checked. */
function NOTE(title, body) {
  return new Table({
    columnWidths: [TOTAL_W],
    width: { size: TOTAL_W, type: WidthType.DXA },
    rows: [new TableRow({
      children: [new TableCell({
        width: { size: TOTAL_W, type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: 'FFF4E5', color: 'auto' },
        margins: { top: 140, bottom: 140, left: 180, right: 180 },
        borders: {
          left: { style: BorderStyle.SINGLE, size: 18, color: 'F59E0B' },
          top: { style: BorderStyle.NIL }, bottom: { style: BorderStyle.NIL }, right: { style: BorderStyle.NIL },
        },
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [new TextRun({ text: title, bold: true, size: 20, font: 'Calibri', color: '92400E' })],
          }),
          new Paragraph({
            children: [new TextRun({ text: body, size: 20, font: 'Calibri', color: '78350F' })],
          }),
        ],
      })],
    })],
  })
}

// ── Document assembly ────────────────────────────────────────────────────────

/**
 * Build and write one .docx.
 * `ref` appears in the footer alongside the page number so a printed contract
 * can always be traced back to its template version.
 */
async function build({ file, title, ref, children }) {
  const fs = require('fs')
  const path = require('path')

  const doc = new Document({
    creator: 'UniBlueprint',
    title,
    description: title,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22 } },
      },
    },
    sections: [{
      properties: {
        page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { after: 120 },
            children: [new TextRun({ text: 'UniBlueprint', bold: true, size: 18, color: NAVY, font: 'Calibri' })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 8 } },
            children: [
              new TextRun({ text: `${ref}  ·  Page `, size: 16, color: GREY, font: 'Calibri' }),
              new TextRun({ children: [PageNumber.CURRENT], size: 16, color: GREY, font: 'Calibri' }),
              new TextRun({ text: ' of ', size: 16, color: GREY, font: 'Calibri' }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: GREY, font: 'Calibri' }),
            ],
          })],
        }),
      },
      children: children.flat(),
    }],
  })

  const outDir = path.join(__dirname, '..')
  const buf = await Packer.toBuffer(doc)
  fs.writeFileSync(path.join(outDir, file), buf)
  return file
}

module.exports = {
  Title, Subtitle, CL, H, S, P, B, L, GAP, TABLE, SIG, EXECUTION, NOTE, FILL, build,
  NAVY, GREY,
}
