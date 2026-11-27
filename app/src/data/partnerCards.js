// ─── Lifestyle deal card settings ────────────────────────────────────────────
// One place for how each partner's discount card looks and what the open card
// shows. The partner roster itself stays in data/lifestylePartners.js. This file
// only holds card settings, keyed by the partner `id`.
//
// HOW TO ADD OR CHANGE THINGS (each is one line in PARTNER_CARD_OVERRIDES):
//
//   A logo and brand colour (the one line job):
//     myid: { logo: require('../../assets/partners/myid/logo.png'), brandColor: '#1A73E8' },
//     Copy the file to app/assets/partners/<id>/logo.<ext> first. The text colour
//     (white or near black, contrast 4.5 or better) is worked out for you.
//     Until a partner has a logo and a brandColor it keeps its old `initBg` colour
//     and shows its initials.
//
//   A real percentage:        discountLabel: '15% off'   (default is "UBP Discount")
//   An end date:              endsOn: '2026-12-24'       (ISO date, hidden when past)
//   Opening hours:            hours: 'Mon to Fri 9am to 6pm'
//   Today's special:          todaySpecial: 'Free protein shake with every sign up'
//   How to claim:             claimText: 'Show your student ID at the till.'
//   Where they are:           address: '12 Main Street, Dundalk'
//   A slogan:                 slogan: 'Short line under the name'  (default is the tagline, then the category)
//   Extra blocks on the open card:
//     openCardBlocks: ['links', 'claim', 'where', 'showAtTill']
//       links       website, Instagram and Get in touch
//       claim       the claim text
//       where       county, address and hours
//       showAtTill  a button that opens a full screen version of the card
//     The default for every partner is ['links'].
//   Photos for the open card strip:
//     photos: [require('../../assets/partners/myid/photo-1.jpg')]
//     (Partners with a hero or gallery in lifestylePartners.js already get a strip.)
//   Card look:
//     cardStyle: 'brand' (default, tiled logo pattern) or 'mono' (no pattern)
//     logoBg: '#FFFFFF' (the tile behind the logo, default white)
//
// Never put an email, phone number or social handle in this file. They come
// from hooks/usePartnerContact.js.

export const CARD_DEFAULTS = {
  cardStyle: 'brand',
  discountLabel: 'UBP Discount',
  claimText: 'Show your student ID.',
  openCardBlocks: ['links'],
  logoBg: '#FFFFFF',
}

export const PARTNER_CARD_OVERRIDES = {
  energie:        { brandColor: '#6FAE4A', hours: 'Mon to Fri 6am to 10pm, Sat to Sun 9am to 5pm' },
  whipwizardz:    { brandColor: '#0A6B2F', logoBg: '#111111' },
  saiemsent:      { brandColor: '#0D0D0D', logoBg: '#000000' },
  elect:          { brandColor: '#0D0D0D' },
  jordanskitchen: { brandColor: '#F3E3B4' },
  roomy:          { brandColor: '#54676B', logoBg: '#54676B' },
  zvisionapparel: { brandColor: '#14110D' },
  pouvoirs:       { brandColor: '#E2217A' },
  // The JMC Fitness logo came with the coach photos. Same logo, same blue.
  jmc:            { brandColor: '#394875', cardStyle: 'mono' },
}

// ─── Colour helpers ──────────────────────────────────────────────────────────
function channel(v) {
  const x = v / 255
  return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
}

export function luminance(hex) {
  const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16)
  if (Number.isNaN(n)) return 0
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
}

export function contrastRatio(a, b) {
  const x = luminance(a)
  const y = luminance(b)
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// White, then near black, whichever reads at 4.5 or better. If neither does
// (a few mid colours), pure black or white, whichever is stronger.
export function pickTextColor(bg) {
  const white = contrastRatio(bg, '#FFFFFF')
  const ink = contrastRatio(bg, '#111111')
  if (white >= 4.5 && white >= ink) return '#FFFFFF'
  if (ink >= 4.5) return '#111111'
  if (white >= 4.5) return '#FFFFFF'
  return contrastRatio(bg, '#000000') > white ? '#000000' : '#FFFFFF'
}

// Mix a hex colour toward white (t > 0) or black (t < 0). t is -1 to 1.
export function tint(hex, t) {
  const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16)
  if (Number.isNaN(n)) return hex
  const mix = v => Math.round(t >= 0 ? v + (255 - v) * t : v * (1 + t))
  const r = mix((n >> 16) & 255)
  const g = mix((n >> 8) & 255)
  const b = mix(n & 255)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

export function withAlpha(hex, a) {
  const n = parseInt(String(hex).replace('#', '').slice(0, 6), 16)
  if (Number.isNaN(n)) return hex
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

// Shared blend rules for the faint pattern and watermark: multiply on light
// and mid cards, invert plus screen on dark cards, so a logo with a white
// background never shows as a white box.
export function blendKind(bg) {
  return luminance(bg) < 0.05 ? 'dark' : 'light'
}

// ─── Resolver ────────────────────────────────────────────────────────────────
// Returns everything a card needs, merged from defaults, overrides and the
// partner record. Safe to call for any partner.
export function getCardConfig(partner) {
  const o = PARTNER_CARD_OVERRIDES[partner.id] || {}
  const logo = o.logo ?? partner.logo ?? null
  const brandColor = o.brandColor || partner.initBg || '#1E3A5F'
  const hero = partner.hero && partner.hero !== logo ? partner.hero : null
  const photos = o.photos || [hero, ...(partner.gallery || [])].filter(Boolean)
  return {
    ...CARD_DEFAULTS,
    ...o,
    logo,
    initials: partner.initials || String(partner.brand || '?').slice(0, 2).toUpperCase(),
    brandColor,
    textColor: o.textColor || pickTextColor(brandColor),
    slogan: o.slogan || partner.tagline || partner.category || '',
    photos,
    // True when the partner has a chosen brand colour (the properly branded ones).
    branded: !!o.brandColor,
    hours: o.hours || partner.hours || null,
    address: o.address || partner.address || null,
  }
}

// ─── Ends soon tag ───────────────────────────────────────────────────────────
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// "Ends Sunday" within 7 days, otherwise "Ends 12 Dec". null when absent or past.
export function endsTag(endsOn, now = new Date()) {
  if (!endsOn) return null
  const end = new Date(`${String(endsOn).slice(0, 10)}T23:59:59`)
  if (Number.isNaN(end.getTime()) || end.getTime() < now.getTime()) return null
  const days = Math.ceil((end.getTime() - now.getTime()) / 86400000)
  if (days <= 7) return `Ends ${DAYS[end.getDay()]}`
  return `Ends ${end.getDate()} ${MONTHS[end.getMonth()]}`
}
