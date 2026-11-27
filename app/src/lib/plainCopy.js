import { NATIVE_NEUTRAL_BILLING } from '../constants/platformPolicy'

// Display copy rules for partner and coach text that comes from data files.
//   plain():      no em dash or en dash anywhere in user facing copy.
//   noMoney():    on iOS and Android drop any sentence that holds a euro amount.
//   cleanCopy():  both, in one go.
// Web keeps euro amounts. Native never shows them (see constants/platformPolicy.js).

export function plain(text) {
  if (!text) return ''
  return String(text).replace(/\s*[–—]\s*/g, ', ')
}

export function noMoney(text) {
  if (!text) return ''
  if (!NATIVE_NEUTRAL_BILLING) return String(text)
  const parts = String(text).match(/[^.!?]+[.!?]*\s*/g) || [String(text)]
  return parts.filter(s => !/[€$]\s*\d|\d\s*(euro|eur)\b/i.test(s)).join('').trim()
}

export function cleanCopy(text) {
  return plain(noMoney(text))
}
