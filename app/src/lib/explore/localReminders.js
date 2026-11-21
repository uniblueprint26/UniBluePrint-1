import { Platform } from 'react-native'
import * as Notifications from 'expo-notifications'

// Reminders that are scheduled on the phone itself (no server). Every id starts
// with a prefix so one feature can clear its own reminders. All calls are safe:
// on the web, or when notifications are not allowed, they quietly do nothing
// and return 'unavailable' or 'denied'.

async function ensurePermission() {
  let perm = await Notifications.getPermissionsAsync()
  if (!perm.granted) perm = await Notifications.requestPermissionsAsync()
  return perm.granted
}

export async function cancelRemindersWithPrefix(prefix) {
  if (Platform.OS === 'web') return
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync()
    await Promise.all(
      all
        .filter(n => (n.identifier || '').startsWith(prefix))
        .map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    )
  } catch { /* nothing to cancel */ }
}

// reminders: [{ id, date: Date, title, body }]. Past dates are skipped.
// Returns 'scheduled' | 'denied' | 'unavailable'.
export async function scheduleReminders(prefix, reminders) {
  if (Platform.OS === 'web') return 'unavailable'
  try {
    await cancelRemindersWithPrefix(prefix)
    const future = reminders.filter(r => r.date && r.date.getTime() > Date.now())
    if (future.length === 0) return 'scheduled'
    if (!(await ensurePermission())) return 'denied'
    const T = Notifications.SchedulableTriggerInputTypes
    for (const r of future) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${prefix}${r.id}`,
        content: { title: r.title, body: r.body },
        trigger: { type: T.DATE, date: r.date },
      })
    }
    return 'scheduled'
  } catch {
    return 'unavailable'
  }
}
