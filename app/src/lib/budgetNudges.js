import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import { readBudgetLeft } from '../components/home/personalStats'

const formatEuro = n => `€${Number(n).toLocaleString('en-IE')}`

// Budget nudges: a short, funny line on the evenings the member has said they
// go out, using the budget they saved in Budgeting. They are scheduled on the
// phone, so the budget never leaves the device. Nothing is scheduled unless
// the member switched nudges on and allowed notifications, and the time never
// falls inside their quiet hours. Best effort: a failure never blocks saving.

const PREFIX = 'ubp-nudge-'
const SEND_HOUR = 18 // early evening, before the night starts

// Returns the hour to send at: 6pm, or the end of quiet hours if 6pm is quiet.
export function nudgeHour(prefs) {
  if (!prefs.quiet_enabled || prefs.quiet_start === prefs.quiet_end) return SEND_HOUR
  const s = prefs.quiet_start, e = prefs.quiet_end
  const quiet = s < e ? (SEND_HOUR >= s && SEND_HOUR < e) : (SEND_HOUR >= s || SEND_HOUR < e)
  return quiet ? e : SEND_HOUR
}

// The line itself. `left` is euro left this month from the saved budget, or null.
export function nudgeCopy(left) {
  if (left === null) {
    return { title: 'Going out tonight?', body: 'Set a budget first, so the night does not set one for you.' }
  }
  const amount = formatEuro(Math.abs(Math.round(left)))
  if (left < 0) {
    return { title: 'Your budget is in the red', body: `You are ${amount} over this month. That drink can stay on the shelf tonight.` }
  }
  if (left < 100) {
    return { title: 'Money is tight', body: `${amount} left this month. Tonight, tap water is a very good option.` }
  }
  return { title: 'Night out?', body: `You have ${amount} left this month. Pick a number before you leave and stick to it.` }
}

async function cancelAll() {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync()
    await Promise.all(
      all.filter(n => String(n.identifier || '').startsWith(PREFIX))
        .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    )
  } catch {}
}

// Returns 'scheduled' | 'off' | 'denied' | 'unavailable'.
export async function syncBudgetNudges(userId, prefs) {
  if (Platform.OS === 'web' || !userId) return 'unavailable'
  try {
    await cancelAll()
    const days = Array.isArray(prefs.night_out_days) ? prefs.night_out_days : []
    if (!prefs.budget_nudges || days.length === 0) return 'off'

    let perm = await Notifications.getPermissionsAsync()
    if (!perm.granted) perm = await Notifications.requestPermissionsAsync()
    if (!perm.granted) return 'denied'

    const left = await readBudgetLeft(userId)
    const { title, body } = nudgeCopy(left)
    const hour = nudgeHour(prefs)
    const T = Notifications.SchedulableTriggerInputTypes
    await Promise.all(days.map(d => Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${d}`,
      content: { title, body },
      // expo weekday: 1 is Sunday, so day 0 (Sunday) maps to 1.
      trigger: { type: T.WEEKLY, weekday: Number(d) + 1, hour, minute: 0 },
    })))
    return 'scheduled'
  } catch {
    return 'unavailable'
  }
}
