// Text moderation for anything a person types and posts (Take text,
// Post captions, Clip captions). Pure JS, no dependencies.
//
//   checkText('some text') -> { ok: true, reason: null }
//                          -> { ok: false, reason: 'guidelines' }
//
// The reason is deliberately generic and never echoes the matched word.
//
// What is blocked: slurs and strong profanity (English and common Irish
// usage), matched as whole words (so "Scunthorpe", "class", "assess" and
// "knackered" are fine), including common dodges: leet swaps (f4ck, sh1t, $hit),
// stretched letters (fuuuck), masked letters (f*ck), and letters split by
// spaces or dots (f u c k, f.u.c.k).
//
// What is allowed on purpose: mild words that are normal Irish speech, such as
// "feck", "arse", "arsed", "wrecked", "crap", "piss", "bollocks", "bloody".
//
// The server keeps a shorter mirror of the strongest terms in
// supabase/migrations/20261118121000_feed_text_guard.sql. If you add a strong
// term here, add it there too.

// `noSuffix` stops "-s / -er / -ing" endings being accepted (for words that are
// also the start of a harmless word, e.g. knacker / knackered).
const TERMS = [
  // Strong profanity.
  { w: 'fuck' }, { w: 'motherfucker' }, { w: 'fucker' }, { w: 'fuk' },
  { w: 'shit' }, { w: 'shite' }, { w: 'bullshit' }, { w: 'shithead' },
  { w: 'cunt' }, { w: 'twat' }, { w: 'wanker' }, { w: 'bitch' },
  { w: 'bastard' }, { w: 'whore' }, { w: 'slut' }, { w: 'dickhead' },
  { w: 'asshole' }, { w: 'arsehole' }, { w: 'dumbass' }, { w: 'jackass' },
  { w: 'bellend' }, { w: 'cocksucker' },
  // Slurs.
  { w: 'nigger' }, { w: 'nigga' }, { w: 'faggot' }, { w: 'fagot' },
  { w: 'tranny' }, { w: 'retard' }, { w: 'spastic' }, { w: 'paki' },
  { w: 'chink', noSuffix: true }, { w: 'gook', noSuffix: true }, { w: 'kike' }, { w: 'spic', noSuffix: true },
  { w: 'wetback' }, { w: 'pikey' }, { w: 'gypo' }, { w: 'coon', noSuffix: true },
  { w: 'knacker', noSuffix: true }, // slur for Travellers; "knackered" stays fine.
  // Telling someone to harm themselves.
  { w: 'kill yourself', noSuffix: true }, { w: 'kys', noSuffix: true },
]

const SUFFIX = '(?:e?rs?|ing|in|ed|es|s|y|ie)?'
const SEP = '[\\s._\\-*]'

// Letters people swap for look-alikes. '1' is read both as i and as l.
const LEET_BASE = { '0': 'o', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's', '!': 'i', '+': 't' }
// A few Cyrillic / Greek look-alikes.
const HOMOGLYPH = { 'а': 'a', 'е': 'e', 'о': 'o', 'с': 'c', 'р': 'p', 'х': 'x', 'і': 'i', 'ѕ': 's', 'ν': 'v', 'ο': 'o' }

function esc(c) {
  return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// "fuck" -> f+ u+ c+ k+ ; a doubled letter ("ass") needs at least two. Inner
// letters may also be masked with '*' ("f*ck", "f**k").
function termPattern({ w, noSuffix }) {
  const parts = w.split(' ').map(word => {
    const runs = word.match(/(.)\1*/g) || []
    return runs.map((run, i) => {
      const ch = esc(run[0])
      const inner = i > 0 && i < runs.length - 1
      const cls = inner ? `[${ch}*]` : ch
      return `${cls}{${run.length},}`
    }).join('')
  })
  const body = parts.join(`${SEP}+`)
  return `(?<![a-z])${body}${noSuffix ? '' : SUFFIX}(?![a-z])`
}

const MATCHERS = TERMS.map(t => new RegExp(termPattern(t), 'i'))

function baseNormalise(text, oneAs) {
  let t = String(text)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')           // accents
    .replace(/[​-‏⁠﻿­]/g, '') // zero-width and soft hyphen
    .toLowerCase()
  t = t.replace(/[^\x00-\x7f]/g, c => HOMOGLYPH[c] || c)
  let out = ''
  for (let i = 0; i < t.length; i++) {
    const c = t[i]
    if (oneAs === null) out += c
    else if (c === '1') out += oneAs
    else if (c === '!' || c === '+') {
      // Punctuation only counts as a letter when it sits inside a word ("sh!t"),
      // not at the end of one ("wanker!").
      const inWord = /[a-z0-9]/.test(t[i - 1] || '') && /[a-z0-9]/.test(t[i + 1] || '')
      out += inWord ? LEET_BASE[c] : c
    } else out += LEET_BASE[c] || c
  }
  return out
}

// "f u c k" and "f.u.c.k": a run of three or more single letters joined up.
function joinSpelledOut(t) {
  return t.replace(/(?<![a-z])[a-z](?:[\s._\-*]+[a-z](?![a-z])){2,}/g, m => m.replace(/[\s._\-*]+/g, ''))
}

// "f.u.ck", "f-u-ck": drop dots, dashes and underscores sitting between letters.
function joinInWord(t) {
  return t.replace(/(?<=[a-z])[._\-]+(?=[a-z])/g, '')
}

function variantsOf(text) {
  const seen = new Set()
  for (const oneAs of ['i', 'l']) {
    const n = baseNormalise(text, oneAs)
    seen.add(n)
    seen.add(joinSpelledOut(n))
    seen.add(joinInWord(n))
  }
  // Digits stuck on the end of a word ("fuck1") are not a letter swap.
  seen.add(baseNormalise(text, null).replace(/(?<=[a-z])\d+(?![a-z\d])/g, ''))
  return [...seen]
}

export function checkText(text) {
  if (typeof text !== 'string' || !text.trim()) return { ok: true, reason: null }
  const variants = variantsOf(text)
  for (const v of variants) {
    for (const re of MATCHERS) {
      if (re.test(v)) return { ok: false, reason: 'guidelines' }
    }
  }
  return { ok: true, reason: null }
}

// The one calm line shown to the person.
export const GUIDELINES_MESSAGE = "That doesn't meet our community guidelines. Please reword it."

// Throws an Error carrying the calm line if any of the texts fails the check.
// Use it at the top of any submit path that sends member text to the database.
export function assertTextClean(...texts) {
  for (const t of texts) {
    if (t && !checkText(String(t)).ok) throw new Error(GUIDELINES_MESSAGE)
  }
}

// The line to show for a failed write: the calm guidelines line when either
// this check or the database guard refused the text, otherwise `fallback`.
export function moderationMessage(err, fallback) {
  const msg = String(err?.message || '')
  if (msg === GUIDELINES_MESSAGE || /feed_text_guard/.test(msg)) return GUIDELINES_MESSAGE
  return fallback
}
