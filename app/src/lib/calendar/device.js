import { Platform } from 'react-native'

// Read this phone's calendar with expo-calendar. Read only: the app never
// creates, changes or deletes anything on the phone. Events are read on the
// phone each time the calendar opens and are NOT copied to a UBP server.
// Permission is asked only after the member taps "Allow and choose calendars"
// in the import sheet, which explains it first.

let mod
function load() {
  if (Platform.OS === 'web') return null
  if (mod !== undefined) return mod
  try { mod = require('expo-calendar/legacy') } catch { mod = null }
  return mod
}

export const deviceCalendarAvailable = () => !!load()

export async function deviceCalendarPermission() {
  const C = load()
  if (!C) return 'unavailable'
  try {
    const p = await C.getCalendarPermissionsAsync()
    return p.granted ? 'granted' : p.canAskAgain === false ? 'denied' : 'undetermined'
  } catch { return 'unavailable' }
}

// Returns 'granted' | 'denied' | 'unavailable'
export async function requestDeviceCalendar() {
  const C = load()
  if (!C) return 'unavailable'
  try {
    const p = await C.requestCalendarPermissionsAsync()
    return p.granted ? 'granted' : 'denied'
  } catch { return 'unavailable' }
}

// [{ id, title, color, source }]
export async function listDeviceCalendars() {
  const C = load()
  if (!C) return []
  try {
    const list = await C.getCalendarsAsync(C.EntityTypes.EVENT)
    return (list || []).map(c => ({ id: c.id, title: c.title || 'Calendar', color: c.color || null, source: c.source?.name || c.ownerAccount || '' }))
  } catch { return [] }
}

// Events in a window as plain objects the screen turns into calendar items.
export async function readDeviceEvents(calendarIds, start, end) {
  const C = load()
  if (!C || !calendarIds?.length) return []
  try {
    const list = await C.getEventsAsync(calendarIds, start, end)
    return (list || []).slice(0, 1500).map(e => ({
      id: String(e.id) + '|' + String(e.startDate),
      title: e.title || 'Busy',
      start: new Date(e.startDate),
      end: new Date(e.endDate || e.startDate),
      allDay: !!e.allDay,
      location: e.location || null,
      calendarId: e.calendarId,
    }))
  } catch { return [] }
}
