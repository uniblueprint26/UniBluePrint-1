/**
 * HTML renderer exposing the same API as lib.js.
 *
 * build-html.js swaps this into the require cache in place of ./lib, so the
 * c-*.js content modules render to HTML without any change to their source.
 * One set of contract text, two output formats.
 */

const REGISTRY = []

// ── Escaping and placeholder marking ─────────────────────────────────────────

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Escape, then wrap [BRACKETED] fields in a chip so every value that must be
 * completed before signature is visible at a glance. This is the page's main
 * review affordance, so it runs on every piece of text.
 */
function txt(s) {
  return esc(s).replace(/\[([^\]]+)\]/g, (_, inner) => `<span class="fill">[${inner}]</span>`)
}

// ── Text blocks ──────────────────────────────────────────────────────────────

const Title    = t => `<h2 class="doc-title">${txt(t)}</h2>`
const Subtitle = t => `<p class="doc-sub">${txt(t)}</p>`

const CL = (num, t) =>
  `<h3 class="cl" id="__ANCHOR__-${String(num).replace(/\W/g, '')}">` +
  `<span class="cl-n">${esc(num)}.</span><span class="cl-t">${txt(t)}</span></h3>`

const H = t => `<h4 class="h">${txt(t)}</h4>`

const S = (num, t) =>
  `<div class="s"><span class="s-n">${esc(num)}</span><span class="s-t">${txt(t)}</span></div>`

function P(t, opts = {}) {
  const cls = ['p']
  if (opts.bold)   cls.push('b')
  if (opts.italic) cls.push('i')
  if (opts.grey)   cls.push('g')
  return `<p class="${cls.join(' ')}">${txt(t)}</p>`
}

const B = (t, level = 0) =>
  `<div class="li" style="--lvl:${level}"><span class="li-m">&bull;</span><span>${txt(t)}</span></div>`

const L = (letter, t, level = 0) =>
  `<div class="li lt" style="--lvl:${level}"><span class="li-m">(${esc(letter)})</span><span>${txt(t)}</span></div>`

const GAP = (n = 1) => Array.from({ length: n }, () => '<div class="gap"></div>')

const FILL = label => `[${label}]`

// ── Tables ───────────────────────────────────────────────────────────────────

function TABLE(headers, rows, cols) {
  const weights = cols || headers.map(() => 1)
  const sum = weights.reduce((a, b) => a + b, 0)
  const pct = weights.map(w => ((w / sum) * 100).toFixed(3) + '%')

  const head = headers.map((h, i) => `<th style="width:${pct[i]}">${txt(h)}</th>`).join('')
  const body = rows.map(r =>
    `<tr>${r.map(c => {
      // Right-align numeric and currency cells so figures line up in a column.
      const num = /^[€\d]/.test(c) && !/^€\[/.test(c)
      return `<td${num ? ' class="num"' : ''}>${txt(c)}</td>`
    }).join('')}</tr>`
  ).join('')

  return `<div class="tw"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
}

// ── Callout ──────────────────────────────────────────────────────────────────

const NOTE = (title, body) =>
  `<aside class="note"><p class="note-t">${txt(title)}</p><p class="note-b">${txt(body)}</p></aside>`

// ── Execution blocks ─────────────────────────────────────────────────────────

function SIG(partyLabel, nameLabel, opts = {}) {
  // Each field is one grid child so the caption sits under its own rule,
  // rather than the rule and caption landing in adjacent columns.
  const line = cap =>
    `<div class="sig-f"><div class="sig-l"></div><div class="sig-c">${esc(cap)}</div></div>`
  const out = [`<p class="sig-p">${txt(partyLabel)}</p>`, '<div class="sig-grid">']
  out.push(line('Signature'))
  out.push(line(nameLabel || 'Print name'))
  if (opts.position) out.push(line('Position / title'))
  out.push(line('Date'))
  out.push('</div>')
  if (opts.witness) {
    out.push('<p class="sig-p sig-w">In the presence of (witness):</p><div class="sig-grid">')
    out.push(line('Witness signature'))
    out.push(line('Witness name'))
    out.push(line('Witness address'))
    out.push(line('Date'))
    out.push('</div>')
  }
  return out
}

const EXECUTION = t =>
  `<p class="exec">${txt(t || 'Signed by the parties on the date first written above.')}</p>`

// ── Collection ───────────────────────────────────────────────────────────────

async function build({ file, title, ref, children }) {
  const num = file.slice(0, 2)
  const slug = 'doc-' + num
  // CL() emits a placeholder anchor token so clause ids stay unique per document.
  const html = children.flat().join('\n').replace(/__ANCHOR__/g, slug)
  REGISTRY.push({
    file, title, ref, num, slug, html,
    fills: (html.match(/class="fill"/g) || []).length,
  })
  return file
}

module.exports = {
  Title, Subtitle, CL, H, S, P, B, L, GAP, TABLE, SIG, EXECUTION, NOTE, FILL, build,
  NAVY: '1E3A5F', GREY: '595959',
  __registry: REGISTRY,
}
