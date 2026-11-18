import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

// Local reminders for a goal, honouring what the person chose: how often, what
// the reminder says, and whether they are OK with notifications at all.
// Nothing is scheduled unless remind_ok is true and remind_every is set. If the
// person has not yet allowed notifications on the phone we ask once here, right
// after they said yes to this goal, never cold. Best effort: a failure here must
// never block saving the goal.

const PREFIX = 'ubp-goal-'
const REMIND_HOUR = 9 // 9am local time

export const REMIND_OPTIONS = [
  { key: 'daily',   label: 'Daily' },
  { key: 'weekly',  label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'never',   label: 'Never' },
]

async function cancelFor(goalId) {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync()
    const mine = all.filter(n => String(n.identifier || '').startsWith(`${PREFIX}${goalId}-`))
    await Promise.all(mine.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)))
  } catch {}
}

export async function cancelGoalReminder(goalId) {
  if (Platform.OS === 'web' || !goalId) return
  await cancelFor(goalId)
}

// Returns 'scheduled' | 'off' | 'denied' | 'unavailable'.
export async function syncGoalReminder(goal) {
  if (Platform.OS === 'web' || !goal?.id) return 'unavailable'
  try {
    await cancelFor(goal.id)
    if (!goal.remind_ok || !goal.remind_every || goal.done) return 'off'

    let perm = await Notifications.getPermissionsAsync()
    if (!perm.granted) perm = await Notifications.requestPermissionsAsync()
    if (!perm.granted) return 'denied'

    const T = Notifications.SchedulableTriggerInputTypes
    const trigger =
      goal.remind_every === 'daily'   ? { type: T.DAILY, hour: REMIND_HOUR, minute: 0 }
      : goal.remind_every === 'weekly'  ? { type: T.WEEKLY, weekday: 2, hour: REMIND_HOUR, minute: 0 }
      : goal.remind_every === 'monthly' ? { type: T.MONTHLY, day: 1, hour: REMIND_HOUR, minute: 0 }
      : null
    if (!trigger) return 'off'

    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${goal.id}-0`,
      content: {
        title: goal.title,
        body: (goal.remind_message || '').trim() || 'A nudge about your goal.',
      },
      trigger,
    })
    return 'scheduled'
  } catch {
    return 'unavailable'
  }
}
