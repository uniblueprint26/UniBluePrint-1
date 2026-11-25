// Ireland Wrapped helpers: clean up the data, pick colours, find routes, build
// share text. Pure JS, no React, so it can be checked on its own.
//
// The Wrapped pages live in the existing jsonb row weekly_issue_content with
// page_key 'wrapped' (returned as issue.content.wrapped). Shape is written up
// in docs/release/weekly-issue-1/wrapped-schema.md. Everything here is
// defensive: bad pages are skipped, text is capped, unknown kinds are ignored.

import { linking } from '../navigation/linking'

export const WRAPPED_TAG = 'Ireland Wrapped 2026'
export const WRAPPED_SITE = 'uniblueprint.ie'

export const WRAPPED_KINDS = [
  'section', 'story', 'stat', 'list', 'quote', 'collage', 'tribute', 'credits',
  'top10', 'month', 'quiz', 'county', 'awards', 'playlist', 'ubp', 'moment', 'capsule',
  'recap', 'timeline', 'finale',
]

// Names a `ubp` page may use in its `screenshot` key instead of an https URL.
// Each name maps to a picture bundled with the app (see SCREENSHOT_SOURCES in
// components/wrapped/WrappedPages.jsx). A name that is not on this list is
// ignored, so a typo shows the clean illustration instead of a broken picture.
// New bundled pictures need a new build, so most screenshots should be https URLs.
export const SCREENSHOT_ASSETS = ['ubp-logo', 'app-icon']

const MAX_PAGES = 200
const MAX_SECTIONS = 40

// Mid tone accents. None of them is gold (gold is only for money). White or
// dark text is picked per colour by onColor(), so every one reads in both modes.
export const DEFAULT_ACCENTS = [
  '#2E7D5B', '#C96A42', '#5B4B8A', '#D9596B', '#2E8FA3',
  '#3F6FB5', '#8A5A9E', '#B5543C', '#4A8B3F', '#3C7F8C',
]

export function cap(v, n) {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : (typeof v === 'number' ? String(v) : '')
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= n) return t
  return `${t.slice(0, Math.max(0, n - 1)).trimEnd()}…`
}

// Body text keeps paragraph breaks.
function capBody(v, n) {
  if (typeof v !== 'string') return ''
  const t = v.replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  if (t.length <= n) return t
  return `${t.slice(0, Math.max(0, n - 1)).trimEnd()}…`
}

function isHex(v) { return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) }
function isHttp(v) { return typeof v === 'string' && /^https?:\/\//i.test(v.trim()) }
function arr(v) { return Array.isArray(v) ? v : [] }

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbToHex(r, g, b) {
  const c = x => Math.max(0, Math.min(255, Math.round(x)))
  return `#${(0x1000000 + c(r) * 0x10000 + c(g) * 0x100 + c(b)).toString(16).slice(1)}`
}

// Mix a hex colour towards white (t > 0) or black (t < 0).
export function mixHex(hex, t) {
  if (!isHex(hex)) return hex
  const [r, g, b] = hexToRgb(hex)
  const target = t >= 0 ? 255 : 0
  const k = Math.abs(t)
  return rgbToHex(r + (target - r) * k, g + (target - g) * k, b + (target - b) * k)
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Readable text colour on top of a fill.
export function onColor(hex) {
  if (!isHex(hex)) return '#FFFFFF'
  const l = luminance(hex)
  // Whichever of white or dark ink has the better contrast on this fill.
  const withWhite = 1.05 / (l + 0.05)
  const withDark = (l + 0.05) / (luminance('#10213A') + 0.05)
  return withDark > withWhite ? '#10213A' : '#FFFFFF'
}

// The fill used for a section accent in the current mode. Lighter in dark mode
// so it stands out from the navy page.
export function accentFill(hex, isDark) {
  const base = isHex(hex) ? hex : DEFAULT_ACCENTS[0]
  return isDark ? mixHex(base, 0.22) : base
}

function cleanImage(img) {
  if (!img || typeof img !== 'object' || !isHttp(img.url)) return null
  return {
    url: img.url.trim(),
    credit: cap(img.credit, 140),
    licence: cap(img.licence || img.license, 40),
  }
}

function cleanCta(c) {
  if (!c || typeof c !== 'object') return null
  const label = cap(c.label, 40)
  if (!label) return null
  const route = typeof c.route === 'string' && /^[A-Za-z][A-Za-z0-9]{0,40}$/.test(c.route) ? c.route : null
  const url = isHttp(c.url) ? c.url.trim() : null
  if (!route && !url) return null
  return { label, route, url }
}

function isHttps(v) { return typeof v === 'string' && /^https:\/\//i.test(v.trim()) }

// A ubp page screenshot: { uri } for an https URL, { asset } for an allowed
// bundled name, or null.
function cleanScreenshot(v) {
  if (typeof v !== 'string') return null
  const t = v.trim()
  if (!t || t.length > 600) return null
  if (isHttps(t)) return { uri: t }
  return SCREENSHOT_ASSETS.includes(t) ? { asset: t } : null
}

// A page number to jump to: the number shown at the top right of the magazine
// (the cover is page 1). Anything else gives null, so the row is not tappable.
function cleanJump(v) {
  const n = Number(v)
  return Number.isInteger(n) && n >= 1 && n <= 999 ? n : null
}

function strList(v, max, len) {
  return arr(v).map(x => cap(typeof x === 'object' && x ? (x.text || x.title || '') : x, len)).filter(Boolean).slice(0, max)
}

function cleanItems(kind, page) {
  const items = arr(page.items)
  switch (kind) {
    case 'top10':
      return items.map((it, i) => (it && typeof it === 'object') ? ({
        rank: Number.isFinite(Number(it.rank)) && Number(it.rank) > 0 ? Math.min(99, Math.floor(Number(it.rank))) : i + 1,
        title: cap(it.title, 90),
        blurb: cap(it.blurb, 140),
        source: cap(it.source, 60),
      }) : null).filter(it => it && it.title).slice(0, 10)
    case 'quiz':
      return items.map(it => {
        if (!it || typeof it !== 'object') return null
        const options = arr(it.options).map(o => cap(o, 80)).filter(Boolean).slice(0, 4)
        const answerIndex = Number(it.answerIndex)
        const question = cap(it.question, 200)
        if (!question || options.length < 2 || !Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= options.length) return null
        return { question, options, answerIndex, note: cap(it.note, 240) }
      }).filter(Boolean).slice(0, 6)
    case 'month':
      return items.map(it => (it && typeof it === 'object') ? ({
        kicker: cap(it.kicker, 40),
        heading: cap(it.heading, 140),
        body: capBody(it.body, 600),
        source: cap(it.source, 80),
        sourceUrl: isHttp(it.sourceUrl) ? it.sourceUrl.trim() : null,
      }) : null).filter(it => it && it.kicker && it.heading).slice(0, 3)
    case 'recap':
      return items.map(it => (it && typeof it === 'object') ? ({
        date: cap(it.date, 24),
        text: cap(it.text, 150),
      }) : null).filter(it => it && it.text).slice(0, 12)
    case 'timeline':
      return items.map(it => (it && typeof it === 'object') ? ({
        date: cap(it.date, 20),
        text: cap(it.text, 110),
        page: cleanJump(it.page),
      }) : null).filter(it => it && it.date && it.text).slice(0, 12)
    case 'finale':
      return items.map(it => (it && typeof it === 'object') ? ({
        section: cap(it.section, 30),
        title: cap(it.title, 70),
        text: cap(it.text, 110),
        page: cleanJump(it.page),
      }) : null).filter(it => it && (it.title || it.text)).slice(0, 12)
    case 'county':
      return items.map(it => (it && typeof it === 'object') ? ({
        county: cap(it.county, 40),
        line: cap(it.line, 200),
        source: cap(it.source, 60),
      }) : null).filter(it => it && it.county && it.line).slice(0, 2)
    case 'playlist':
      return items.map(it => (it && typeof it === 'object') ? ({
        title: cap(it.title, 90),
        artist: cap(it.artist, 70),
        url: isHttp(it.url) ? it.url.trim() : null,
      }) : null).filter(it => it && it.title).slice(0, 30)
    case 'collage':
      return items.map(it => {
        if (typeof it === 'string') return { text: cap(it, 60), label: '' }
        if (!it || typeof it !== 'object') return null
        return { text: cap(it.text || it.title, 60), label: cap(it.label || it.kicker, 24), image: cleanImage(it.image) }
      }).filter(it => it && it.text).slice(0, 12)
    case 'list':
    case 'credits':
      return items.map(it => cap(typeof it === 'object' && it ? (it.text || it.title) : it, 160)).filter(Boolean).slice(0, 40)
    default:
      return []
  }
}

function cleanCategories(page) {
  return arr(page.categories).map((c, ci) => {
    if (!c || typeof c !== 'object') return null
    const nominees = arr(c.nominees).map(n => (n && typeof n === 'object') ? ({
      name: cap(n.name, 70), why: cap(n.why, 110), source: cap(n.source, 60),
    }) : null).filter(n => n && n.name).slice(0, 8)
    const title = cap(c.title, 70)
    if (!title || nominees.length === 0) return null
    return { key: cap(c.key, 40) || `cat${ci}`, title, nominees }
  }).filter(Boolean).slice(0, 12)
}

// Clean one page, or return null to skip it.
export function cleanPage(raw) {
  if (!raw || typeof raw !== 'object') return null
  const kind = typeof raw.kind === 'string' ? raw.kind.trim().toLowerCase() : ''
  if (!WRAPPED_KINDS.includes(kind)) return null
  const page = {
    kind,
    section: cap(raw.section, 40),
    kicker: cap(raw.kicker, 60),
    heading: cap(raw.heading, 140),
    body: capBody(raw.body, 1200),
    stat: cap(raw.stat, 14),
    statLabel: cap(raw.statLabel, 100),
    bullets: strList(raw.bullets, 14, 160),
    source: cap(raw.source, 80),
    sourceUrl: isHttp(raw.sourceUrl) ? raw.sourceUrl.trim() : null,
    gaeilge: cap(raw.gaeilge, 60),
    image: cleanImage(raw.image),
    screenshot: kind === 'ubp' ? cleanScreenshot(raw.screenshot) : null,
    cta: cleanCta(raw.cta),
    items: cleanItems(kind, raw),
    categories: kind === 'awards' ? cleanCategories(raw) : [],
  }
  // Pages that would be empty are skipped.
  switch (kind) {
    case 'section': if (!page.heading) return null; break
    case 'story': if (!page.heading && !page.body) return null; break
    case 'stat': if (!page.stat) return null; break
    case 'list': if (!page.heading && page.items.length + page.bullets.length === 0) return null; break
    case 'quote': if (!page.body) return null; break
    case 'collage': if (page.items.length === 0 && page.bullets.length === 0) return null; break
    case 'tribute': if (!page.heading && !page.body) return null; break
    case 'credits': break
    case 'top10': if (page.items.length === 0) return null; break
    case 'month': if (page.items.length === 0 && (!page.kicker || !page.heading)) return null; break
    case 'recap': if (page.items.length === 0) return null; break
    case 'timeline': if (page.items.length === 0) return null; break
    case 'finale': if (page.items.length === 0) return null; break
    case 'quiz': if (page.items.length === 0) return null; break
    case 'county': if (page.items.length === 0) return null; break
    case 'awards': if (page.categories.length === 0) return null; break
    case 'playlist': if (page.items.length === 0) return null; break
    case 'ubp': if (!page.heading) return null; break
    case 'moment': case 'capsule': if (!page.heading) return null; break
    default: break
  }
  return page
}

// Clean the whole wrapped block. Returns null when there is nothing to show,
// so the magazine behaves exactly as before.
export function normaliseWrapped(raw) {
  try { return normaliseWrappedUnsafe(raw) } catch { return null }
}

function normaliseWrappedUnsafe(raw) {
  if (!raw || typeof raw !== 'object') return null
  // One bad page never takes the others with it.
  const safeClean = p => { try { return cleanPage(p) } catch { return null } }
  const pages = arr(raw.pages).slice(0, MAX_PAGES).map(safeClean).filter(Boolean)
  if (pages.length === 0) return null

  const declared = arr(raw.sections).map(s => (s && typeof s === 'object' && typeof s.key === 'string' && s.key.trim()) ? ({
    key: cap(s.key, 40),
    title: cap(s.title, 40) || cap(s.key, 40),
    accent: isHex(s.accent) ? s.accent : null,
  }) : null).filter(Boolean).slice(0, MAX_SECTIONS)

  // Order of first appearance in the pages; sections never declared get a
  // title made from their key.
  const seen = []
  pages.forEach(p => { if (p.section && !seen.includes(p.section)) seen.push(p.section) })
  const sections = seen.map((key, i) => {
    const d = declared.find(s => s.key === key)
    return {
      key,
      title: d ? d.title : key.charAt(0).toUpperCase() + key.slice(1).replace(/[-_]+/g, ' '),
      accent: (d && d.accent) || DEFAULT_ACCENTS[i % DEFAULT_ACCENTS.length],
    }
  })
  const c = raw.cover && typeof raw.cover === 'object' ? raw.cover : {}
  const cover = { title: cap(c.title, 40), byline: cap(c.byline, 40) }
  return { sections, pages, cover }
}

// A short snippet per section for the cover collage.
export function coverSnippets(wrapped, max = 6) {
  if (!wrapped) return []
  const out = []
  for (const s of wrapped.sections) {
    const own = wrapped.pages.filter(p => p.section === s.key)
    const stat = own.find(p => p.kind === 'stat')
    const story = own.find(p => p.kind === 'story' || p.kind === 'month' || p.kind === 'quote' || p.kind === 'tribute')
    if (stat) out.push({ key: s.key, label: s.title, big: stat.stat, text: stat.statLabel, accent: s.accent })
    else if (story) {
      const first = story.kind === 'month' && story.items.length ? story.items[0] : null
      const line = story.kind === 'quote' ? story.body : (story.heading || (first && first.heading) || story.body)
      if (line) out.push({ key: s.key, label: s.title, big: '', text: cap(line, 60), accent: s.accent })
    }
    if (out.length >= max) break
  }
  return out
}

// Picture credits from every page, for the credits page.
export function pictureCredits(wrapped) {
  if (!wrapped) return []
  const seen = new Set()
  const out = []
  const add = img => {
    if (!img || !img.credit) return
    const line = img.licence ? `${img.credit}, ${img.licence}` : img.credit
    if (!seen.has(line)) { seen.add(line); out.push(line) }
  }
  wrapped.pages.forEach(p => { add(p.image); p.items.forEach(it => it && it.image && add(it.image)) })
  return out
}

export function issueCode(n) {
  const num = Number(n)
  return String(Number.isFinite(num) && num > 0 ? Math.floor(num) : 1).padStart(3, '0')
}

// Text for the share sheet. Kept short and always ends with the site name.
export function shareText(title, line) {
  const parts = [cap(title, 120)]
  if (line) parts.push(cap(line, 140))
  parts.push(`${WRAPPED_TAG}. From UBP, ${WRAPPED_SITE}`)
  return parts.filter(Boolean).join('\n\n')
}

// Prefilled text for the Take composer (it allows 280 characters).
export function takeText(title) {
  const t = cap(title, 200)
  return t ? `${t}\n\n${WRAPPED_TAG}` : WRAPPED_TAG
}

// ── Route lookup ────────────────────────────────────────────────────────────
// Find out whether a route name exists in the navigation tree and, if so, how
// to reach it. Used so the Vote and Time capsule buttons only show when another
// builder's screen is really registered. Two sources: the live navigation
// state (only knows navigators that have been opened) and the deep link config
// in navigation/linking.js, which lists every registered screen with a path.
// Returns the path from the root navigator, for example
// ['MainTabs', 'Home', 'AwardsVoting'], or null.

function findInState(state, name, trail = []) {
  if (!state) return null
  const routes = Array.isArray(state.routes) ? state.routes : []
  for (const r of routes) {
    if (r.name === name) return [...trail, r.name]
  }
  for (const r of routes) {
    const child = r.state ? findInState(r.state, name, [...trail, r.name]) : null
    if (child) return child
  }
  const names = Array.isArray(state.routeNames) ? state.routeNames : []
  if (names.includes(name)) return [...trail, name]
  return null
}

function findInLinking(screens, name, trail = []) {
  if (!screens || typeof screens !== 'object') return null
  for (const key of Object.keys(screens)) {
    if (key === name) return [...trail, key]
  }
  for (const key of Object.keys(screens)) {
    const v = screens[key]
    const child = v && typeof v === 'object' ? findInLinking(v.screens, name, [...trail, key]) : null
    if (child) return child
  }
  return null
}

function rootOf(navigation) {
  let nav = navigation
  for (let i = 0; i < 8 && nav && typeof nav.getParent === 'function' && nav.getParent(); i += 1) nav = nav.getParent()
  return nav
}

export function routePath(navigation, name) {
  try {
    const root = rootOf(navigation)
    const fromState = findInState(root?.getState?.(), name)
    if (fromState) return fromState
    return findInLinking(linking?.config?.screens, name)
  } catch { return null }
}

export function hasRoute(navigation, name) {
  return !!routePath(navigation, name)
}

export function goToRoute(navigation, name, params) {
  try {
    const path = routePath(navigation, name)
    if (!path) return false
    const root = rootOf(navigation)
    // Build the nested { screen, params } object from the leaf upwards.
    let nested = params
    for (let i = path.length - 1; i >= 1; i -= 1) nested = { screen: path[i], params: nested }
    root.navigate(path[0], nested)
    return true
  } catch { return false }
}

// Open the Take composer in the Home stack with the Wrapped tag prefilled.
export function openTakeComposer(navigation, title) {
  const params = { initialTab: 'thread', initialText: takeText(title) }
  try {
    const parent = navigation?.getParent?.()
    ;(parent || navigation).navigate('Home', { screen: 'Composer', params })
    return true
  } catch { return false }
}
