// Comma-formats a number for display (2400 -> "2,400"). Numbers below 1000
// are returned unchanged (as a string) so callers can use this unconditionally
// on any stat/count without a separate "is it big enough to matter" check.
//
// Deliberately hand-rolled rather than `toLocaleString('en-US')` — Hermes on
// some older/embedded runtimes ships without full ICU data, so `toLocaleString`
// can silently no-op there. A manual regex works identically everywhere
// (iOS, Android, web) with no Intl dependency.
export function formatNumber(value, { decimals } = {}) {
  if (value === null || value === undefined) return value
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return String(value)

  const abs = Math.abs(num)
  const fixed = decimals != null ? abs.toFixed(decimals) : String(abs)
  const [intPart, decPart] = fixed.split('.')
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const sign = num < 0 ? '-' : ''
  return sign + withCommas + (decPart !== undefined ? '.' + decPart : '')
}
