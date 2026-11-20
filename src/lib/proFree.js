// Pro is free for every account until the end of 31 January 2027. The app
// reads the same date from app_flags.pro_free_until. This constant is the
// website's copy of it: change both together if the date ever moves.
export const PRO_FREE_UNTIL = '2027-01-31'
export const PRO_FREE_LINE = 'Pro is free for everyone until 31 January'

// True up to the end of the day (UTC, which is Irish time in January).
export function isProFreeNow(now = Date.now()) {
  return now <= Date.parse(`${PRO_FREE_UNTIL}T23:59:59.999Z`)
}
