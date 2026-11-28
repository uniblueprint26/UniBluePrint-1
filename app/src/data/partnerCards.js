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
//   The offer on the card:   discountLabel: '15% off'   (default is "UBP Discount")
//     Percentages or plain words only. Never a euro amount (iOS and Android show no prices).
//   Services chips:           serviceChips: ['Gel extensions', 'Gel overlay', 'BIAB']  (up to 3, about 18 characters)
//     Without it the chips come from the partner services list, then the price list labels.
//   Short about line:         about: 'One short sentence, up to about 110 characters.'
//     Without it, the first sentence of the partner description is used.
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
  energie:        { brandColor: '#6FAE4A', hours: 'Mon to Fri 6am to 10pm, Sat to Sun 9am to 5pm', discountLabel: '50% off joining', serviceChips: ['Gym membership', 'Student rate'], about: 'Full gym access with a student membership. Set up in person at the gym.' },
  whipwizardz:    { brandColor: '#0A6B2F', logoBg: '#111111', discountLabel: 'UBP Deal', serviceChips: ['Car sales', 'Repairs', 'Detailing'] },
  saiemsent:      { brandColor: '#0D0D0D', logoBg: '#000000', serviceChips: ['Streetwear', 'Graphic tees', 'Hoodies'] },
  elect:          { brandColor: '#0D0D0D', discountLabel: '10% off', serviceChips: ['Streetwear', 'Christian brand'] },
  jordanskitchen: { brandColor: '#F3E3B4', discountLabel: 'UBP Deal', serviceChips: ['Overnight oats', 'Protein oats', 'Delivered'] },
  roomy:          { brandColor: '#54676B', logoBg: '#54676B', discountLabel: 'Free listings', serviceChips: ['Room listings', 'Room search', 'Flatmate groups'] },
  zvisionapparel: { logo: require('../../assets/partners/zvisionapparel/logo.png'), brandColor: '#1FAFB1', logoBg: '#000000', serviceChips: ['Embroidery', 'Custom clothing'] },
  pouvoirs:       { brandColor: '#E2217A' },
  // The JMC Fitness logo came with the coach photos. Same logo, same blue.
  jmc:            { brandColor: '#394875', cardStyle: 'mono', discountLabel: 'UBP Deal', serviceChips: ['Sports coaching', 'Online plans', 'Football coaching'] },
  // Logos the partners sent by email. Brand colours are the colours in each logo.
  mpfitness:         { logo: require('../../assets/partners/mpfitness/logo.png'), brandColor: '#2CD5F0', logoBg: '#000000', discountLabel: 'UBP Deal', serviceChips: ['Personal training', 'Nutrition coaching', 'Online calls'] },
  nyz3ditz:          { logo: require('../../assets/partners/nyz3ditz/logo.png'), brandColor: '#111111', logoBg: '#FFFFFF', discountLabel: 'UBP Deal', serviceChips: ['Photography', 'Videography', 'Mentorship'] },
  leva:              { logo: require('../../assets/partners/leva/logo.png'), brandColor: '#111111', logoBg: '#FDFCF8', discountLabel: '1 week free trial', serviceChips: ['Social media', 'Graphic design', 'Paid ads'] },
  henrysisters:      { logo: require('../../assets/partners/henrysisters/logo.png'), brandColor: '#E0BAB2', logoBg: '#FFFFFF', discountLabel: '10% off first booking', serviceChips: ['Photography', 'Videography', 'Reels'] },
  camila:            { logo: require('../../assets/partners/camila/logo.jpg'), brandColor: '#C2A025', logoBg: '#000000', discountLabel: 'UBP Deal', serviceChips: ['Personal training', 'Muay Thai', 'Yoga'] },
  eabakeditt:        { logo: require('../../assets/partners/eabakeditt/logo.png'), brandColor: '#E0B850', logoBg: '#000000', discountLabel: 'Up to 33% off', serviceChips: ['Brownie boxes', 'Cookies', 'Cupcakes'] },
  ilashedbydiya:     { logo: require('../../assets/partners/ilashedbydiya/logo.jpg'), brandColor: '#D4AF37', logoBg: '#111111', discountLabel: '10% off first appointment', serviceChips: ['Classic lashes', 'Volume lashes', 'Lash lifts'] },
  royaltyproductions:{ logo: require('../../assets/partners/royaltyproductions/logo.png'), brandColor: '#111111', logoBg: '#FFFFFF', discountLabel: '10% off', serviceChips: ['Event photos', 'Graduations', 'Headshots'] },
  veeslash:          { logo: require('../../assets/partners/veeslash/logo.png'), brandColor: '#FECDE2', logoBg: '#FECDE2', discountLabel: 'UBP Deal', serviceChips: ['Classic lashes', 'Hybrid lashes', 'Volume lashes'] },
  cutbyire:          { logo: require('../../assets/partners/cutbyire/logo.png'), brandColor: '#99C6EB', logoBg: '#FFFFFF', discountLabel: 'UBP Deal', serviceChips: ['Haircuts', 'Lineups', 'Home service'] },
  poiemadexigns:     { logo: require('../../assets/partners/poiemadexigns/logo.png'), brandColor: '#C6E04B', logoBg: '#000000', discountLabel: 'UBP Deal', serviceChips: ['Web design', 'Logo design', 'Branding'] },
  // Made By Kelan sent a selfie, not a logo. This is a simple UBP made wordmark until he sends his own.
  kelan:             { logo: require('../../assets/partners/kelan/logo.png'), brandColor: '#16313B', logoBg: '#16313B', discountLabel: 'UBP Deal', serviceChips: ['Events', 'Filming', 'Promo content'] },
  // Sent by the founder as screenshots and images, cropped to the logo.
  islandsips:        { logo: require('../../assets/partners/islandsips/logo.png'), brandColor: '#EA6A2A', logoBg: '#FFFFFF' },
  nailnurse:         { logo: require('../../assets/partners/nailnurse/logo.png'), brandColor: '#5A4521', logoBg: '#5A4521', serviceChips: ['Acrylic sets', 'Gel polish', 'Manicures'] },
  styledbybene:      { logo: require('../../assets/partners/styledbybene/logo.png'), brandColor: '#D4A21E', logoBg: '#D4A21E' },
  claras:            { logo: require('../../assets/partners/claras/logo.png'), brandColor: '#D9CEBA', logoBg: '#E4DBCB', discountLabel: 'UBP Deal', serviceChips: ['Gel extensions', 'Gel overlay', 'BIAB'] },
  coded69studios:    { logo: require('../../assets/partners/coded69studios/logo.png'), brandColor: '#113D7D', logoBg: '#FFFFFF', discountLabel: '10% off', serviceChips: ['Photography', 'Printing', 'Studio rental'] },
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
import { CARD_ART } from './partnerCardArt'
import { cleanCopy, plain } from '../lib/plainCopy'
import { NATIVE_NEUTRAL_BILLING } from '../constants/platformPolicy'

// ─── Services chips and the short about line ─────────────────────────────────
// serviceChips: up to three short chips naming what the partner does.
//   1. the `serviceChips` override above, 2. the partner `services` array,
//   3. the `pricelist` labels with prices, deposits and plan words stripped.
// about: one short line for the open card. The `about` override, else the first
//   sentence of the partner description (euro sentences dropped on native).
// Neither ever reads a `deal` string, so a euro amount never reaches a native card.
const CHIP_MAX = 18
const CHIP_DROP = /\b(deposit|joining fee|standard monthly|student monthly|monthly|per session|session|add on|add-on|subscription|from|student|standard)\b/gi

function clipWords(text, max) {
  const t = String(text).trim()
  if (t.length <= max) return t
  const cut = t.slice(0, max + 1)
  const at = cut.lastIndexOf(' ')
  return (at > 6 ? cut.slice(0, at) : t.slice(0, max)).replace(/[\s,&]+$/, '')
}

function cleanChip(raw) {
  const t = plain(String(raw))
    .replace(/\(.*?\)/g, ' ')
    .replace(/[€$]\s*\d[\d.,]*(\s*(to|-)\s*[€$]?\s*\d[\d.,]*)?\+?/g, ' ')
    .replace(/\d+\s*(x|hr|hrs|min|week|weeks)\b\/?\w*/gi, ' ')
    .replace(CHIP_DROP, ' ')
    .replace(/[/·]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s\-+,.]+|[\s\-+,.]+$/g, '')
  if (!t || /[€$]|\d/.test(t)) return ''
  return clipWords(t, CHIP_MAX)
}

export function getServiceChips(partner, o = {}) {
  const source = Array.isArray(o.serviceChips) && o.serviceChips.length
    ? o.serviceChips
    : Array.isArray(partner.services) && partner.services.length
      ? partner.services
      : Array.isArray(partner.pricelist) ? partner.pricelist.map(x => x?.label).filter(Boolean) : []
  const seen = {}
  const out = []
  for (const raw of source) {
    const c = cleanChip(raw)
    const key = c.toLowerCase()
    if (c.length < 2 || seen[key]) continue
    seen[key] = true
    out.push(c)
    if (out.length === 3) break
  }
  return out
}

const ABOUT_MAX = 110
const PLACEHOLDER = /to be confirmed|coming soon|tbc\b/i

export function getAboutLine(partner, o = {}) {
  let text = o.about || partner.description || ''
  if (!text) return ''
  text = cleanCopy(text)
    .replace(/\s*\(@[^)]*\)/g, '')
    .replace(/\bCo\. /g, 'Co\u0001 ')
    .trim()
  if (!o.about) {
    const m = text.match(/^.*?[.!?](?=\s|$)/)
    text = m ? m[0] : text
  }
  text = text.replace(/\u0001/g, '.').replace(/\s+/g, ' ').trim()
  if (!text || PLACEHOLDER.test(text)) return ''
  if (NATIVE_NEUTRAL_BILLING && /[€$]\s*\d|\d\s*(euro|eur)\b/i.test(text)) return ''
  if (text.length <= ABOUT_MAX) return text
  // Prefer to stop at a comma when there is one in the second half, else a word boundary.
  const head = text.slice(0, ABOUT_MAX)
  const comma = head.lastIndexOf(',')
  if (comma > ABOUT_MAX * 0.55) return `${head.slice(0, comma)}.`
  const at = head.lastIndexOf(' ')
  return `${head.slice(0, at > 20 ? at : ABOUT_MAX).replace(/[\s,.;:]+$/, '')}...`
}

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
    art: CARD_ART[partner.id] || null,
    initials: partner.initials || String(partner.brand || '?').slice(0, 2).toUpperCase(),
    brandColor,
    textColor: o.textColor || pickTextColor(brandColor),
    slogan: o.slogan || partner.tagline || partner.category || '',
    photos,
    // True when the partner has a chosen brand colour (the properly branded ones).
    branded: !!o.brandColor,
    hours: o.hours || partner.hours || null,
    address: o.address || partner.address || null,
    serviceChips: getServiceChips(partner, o),
    about: getAboutLine(partner, o),
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
