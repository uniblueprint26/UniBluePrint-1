import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus, Download, CalendarPlus, Info } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import MonthView from '../components/calendar/MonthView'
import WeekView from '../components/calendar/WeekView'
import DayView, { freeWindow } from '../components/calendar/DayView'
import EventSheet from '../components/calendar/EventSheet'
import ImportSheet from '../components/calendar/ImportSheet'
import { Segmented, Chip, EventRow, Sheet, PrimaryButton, SecondaryButton } from '../components/calendar/Parts'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useCalendarData } from '../lib/calendar/useCalendarData'
import {
  addDays, addMonths, startOfDay, startOfWeek, sameDay, onDay, fmtDayShort, ymd, describeWhen, calendarColor, calendarName,
  BUILTIN_CALENDARS, KIND_META, sourceLine,
} from '../lib/calendar/model'
import { saveEvent, deleteEvent, saveManyEvents, saveCalendar, writeDeviceSelection, readDismissed, writeDismissed } from '../lib/calendar/store'

// Calendar: Month, Week and Day behind one switch, with Add and Import as
// sheets. Shows the member's own events, events read from a calendar link,
// this phone's calendar (if allowed), goal dates and reminders, and whatever
// other features add with addCalendarItems (exam slots, Priority tickets,
// study room slots). Every automatic item says where it came from.

const VIEWS = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
]

export default function CalendarScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const userId = user?.id

  const [view, setView] = useState('month')
  const [selected, setSelected] = useState(() => startOfDay(new Date()))
  const [hidden, setHidden] = useState([])
  const [eventSheet, setEventSheet] = useState(null) // { event?, date?, start? }
  const [importOpen, setImportOpen] = useState(false)
  const [detail, setDetail] = useState(null)
  const [banner, setBanner] = useState('')
  const [dismissed, setDismissed] = useState([])
  const bannerTimer = useRef(null)

  const rangeStart = useMemo(() => addDays(new Date(selected.getFullYear(), selected.getMonth(), 1), -7), [selected])
  const rangeEnd = useMemo(() => addDays(new Date(selected.getFullYear(), selected.getMonth() + 1, 0), 8), [selected])
  const { events: allEvents, rows, customCalendars, remote, deviceIds, reload, hasAny, loading } = useCalendarData(userId, rangeStart, rangeEnd)

  useEffect(() => { if (userId) readDismissed(userId).then(setDismissed) }, [userId])
  useEffect(() => () => clearTimeout(bannerTimer.current), [])

  const events = useMemo(
    () => allEvents.filter(e => !((e.kind === 'member' || e.kind === 'ics') && hidden.includes(e.calendar))),
    [allEvents, hidden],
  )

  // Calendars that have at least one event, for the legend.
  const legend = useMemo(() => {
    const keys = []
    allEvents.forEach(e => { if ((e.kind === 'member' || e.kind === 'ics') && !keys.includes(e.calendar)) keys.push(e.calendar) })
    const order = [...BUILTIN_CALENDARS.map(c => c.key), ...customCalendars.map(c => c.id)]
    return order.filter(k => keys.includes(k))
  }, [allEvents, customCalendars])

  const now = new Date()
  const coming = useMemo(() => {
    const t = Date.now()
    const real = events.filter(e => !e.quiet && (e.allDay ? e.end.getTime() > t : e.end.getTime() >= t))
    const quietSeen = new Set()
    const quiet = events.filter(e => e.quiet && e.start.getTime() > t).filter(e => {
      if (quietSeen.has(e.title)) return false
      quietSeen.add(e.title); return true
    }).slice(0, 2)
    return [...real, ...quiet].sort((a, b) => a.start - b.start).slice(0, 6)
  }, [events])

  function showBanner(text) {
    setBanner(text)
    clearTimeout(bannerTimer.current)
    bannerTimer.current = setTimeout(() => setBanner(''), 5000)
  }

  const openEvent = useCallback(ev => {
    if (ev.editable) setEventSheet({ event: ev })
    else setDetail(ev)
  }, [])

  function shiftMonth(n) {
    const m = addMonths(selected, n)
    const t = startOfDay(new Date())
    setSelected(m.getFullYear() === t.getFullYear() && m.getMonth() === t.getMonth() ? t : m)
  }

  async function handleSave(fields) {
    if (!userId) return
    const editing = eventSheet?.event
    const payload = editing ? { ...editing.raw, ...fields } : { ...fields, source: 'member' }
    await saveEvent(userId, payload)
    await reload()
    setSelected(startOfDay(new Date(fields.starts_at)))
    setEventSheet(null)
    showBanner(editing ? 'Event updated.' : 'Event added.')
  }

  async function handleDelete() {
    const ev = eventSheet?.event
    if (!ev || !userId) return
    await deleteEvent(userId, ev.id)
    await reload()
    setEventSheet(null)
    showBanner('Event deleted.')
  }

  async function handleAddCalendar(cal) {
    if (!userId) return null
    const row = await saveCalendar(userId, cal)
    await reload()
    return row
  }

  async function handleSaveLink(list, target) {
    const rows = list.map(e => ({
      title: e.title, location: e.location, event_type: 'other', calendar_key: target,
      starts_at: e.start.toISOString(), ends_at: e.end.toISOString(), all_day: e.allDay,
      source: 'ics', external_uid: String(e.key).slice(0, 300),
    }))
    const res = await saveManyEvents(userId, rows)
    await reload()
    setImportOpen(false)
    if (rows[0]) setSelected(startOfDay(new Date(rows[0].starts_at)))
    showBanner(`${res.saved} ${res.saved === 1 ? 'event' : 'events'} added.`)
  }

  async function handleSaveDevice(ids) {
    await writeDeviceSelection(userId, ids)
    await reload()
    setImportOpen(false)
    showBanner(ids.length ? 'This phone\'s calendar is now showing here.' : 'Stopped reading this phone\'s calendar.')
  }

  const selectedList = useMemo(() => events.filter(e => !e.quiet && onDay(e, selected)).sort((a, b) => (Number(b.allDay) - Number(a.allDay)) || a.start - b.start), [events, selected])

  const dayEvents = useMemo(() => events.filter(e => onDay(e, selected)), [events, selected])
  const rec = useMemo(() => {
    if (view !== 'day') return null
    if (startOfDay(selected) < startOfDay(new Date())) return null
    if (dismissed.includes(ymd(selected))) return null
    return freeWindow(dayEvents, selected)
  }, [view, selected, dayEvents, dismissed])

  function dismissRec() {
    const next = [...dismissed, ymd(selected)]
    setDismissed(next)
    if (userId) writeDismissed(userId, next)
  }

  const cardBorder = { borderColor: colors.border }

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 48 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <PageTitle
          title="Calendar"
          style={s.title}
          right={
            <View style={s.actions}>
              <TouchableOpacity
                onPress={() => setImportOpen(true)}
                style={[s.iconBtn, { backgroundColor: colors.tabFill }]}
                accessibilityRole="button"
                accessibilityLabel="Bring in a calendar"
              >
                <Download size={19} color={colors.textPrimary} strokeWidth={1.9} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setEventSheet({ date: selected })}
                style={[s.addBtn, { backgroundColor: colors.accentBg }]}
                accessibilityRole="button"
                accessibilityLabel="Add event"
              >
                <Plus size={18} color={colors.accentFg} strokeWidth={2.4} />
                <Text style={[s.addText, { color: colors.accentFg }]}>Add</Text>
              </TouchableOpacity>
            </View>
          }
        />

        <View style={s.body}>
          <Segmented value={view} options={VIEWS} onChange={setView} />

          {!!banner && (
            <View style={[s.banner, { backgroundColor: colors.tabFill }]} accessibilityLiveRegion="polite">
              <Info size={16} color={colors.textPrimary} strokeWidth={1.9} />
              <Text style={[s.bannerText, { color: colors.textPrimary }]}>{banner}</Text>
            </View>
          )}

          {!remote && !loading && rows.length > 0 && (
            <Text style={[s.muted, { color: colors.textSecondary, paddingVertical: 0 }]}>Your events are saved on this phone for now.</Text>
          )}

          {view === 'month' && (
            <>
              <MonthView
                month={new Date(selected.getFullYear(), selected.getMonth(), 1)}
                selected={selected}
                events={events}
                customCalendars={customCalendars}
                onSelect={d => setSelected(startOfDay(d))}
                onMonth={shiftMonth}
                onToday={() => setSelected(startOfDay(new Date()))}
              />

              {legend.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.legend}>
                  {legend.map(k => (
                    <Chip
                      key={k}
                      label={calendarName(k, customCalendars)}
                      dot={calendarColor(k, customCalendars, isDark)}
                      soft
                      on={!hidden.includes(k)}
                      onPress={() => setHidden(h => (h.includes(k) ? h.filter(x => x !== k) : [...h, k]))}
                    />
                  ))}
                </ScrollView>
              )}

              {!hasAny && !loading ? (
                <View style={[s.card, s.emptyCard, { backgroundColor: colors.surface }, cardBorder]}>
                  <View style={[s.emptyIcon, { backgroundColor: colors.tabFill }]}>
                    <CalendarPlus size={26} color={colors.textPrimary} strokeWidth={1.6} />
                  </View>
                  <Text style={[s.emptyTitle, { color: colors.textPrimary }]}>Nothing here yet</Text>
                  <Text style={[s.emptySub, { color: colors.textSecondary }]}>Add an event, or bring in a calendar you already use.</Text>
                  <View style={s.emptyBtns}>
                    <PrimaryButton label="Add event" Icon={Plus} onPress={() => setEventSheet({ date: selected })} />
                    <SecondaryButton label="Bring in a calendar" onPress={() => setImportOpen(true)} />
                  </View>
                </View>
              ) : null}

              <View style={[s.card, { backgroundColor: colors.surface }, cardBorder]}>
                <View style={s.cardHead}>
                  <Text style={[s.cardTitle, { color: colors.textPrimary }]}>{sameDay(selected, now) ? 'Today' : fmtDayShort(selected)}</Text>
                  <TouchableOpacity onPress={() => setView('day')} accessibilityRole="button" accessibilityLabel="Open this day">
                    <Text style={[s.link, { color: colors.textPrimary }]}>Open day</Text>
                  </TouchableOpacity>
                </View>
                {selectedList.length === 0 ? (
                  <Text style={[s.muted, { color: colors.textSecondary }]}>Nothing on this day.</Text>
                ) : selectedList.map((e, i) => (
                  <View key={e.id}>
                    {i > 0 && <View style={[s.div, { backgroundColor: colors.border }]} />}
                    <EventRow ev={e} customCalendars={customCalendars} onPress={() => openEvent(e)} />
                  </View>
                ))}
              </View>

              {hasAny ? (
                <View style={[s.card, { backgroundColor: colors.surface }, cardBorder]}>
                  <Text style={[s.cardTitle, { color: colors.textPrimary, marginBottom: 4 }]}>Coming up</Text>
                  {coming.length === 0 ? (
                    <Text style={[s.muted, { color: colors.textSecondary }]}>Nothing coming up.</Text>
                  ) : coming.map((e, i) => (
                    <View key={e.id}>
                      {i > 0 && <View style={[s.div, { backgroundColor: colors.border }]} />}
                      <EventRow ev={e} customCalendars={customCalendars} onPress={() => openEvent(e)} showDate dateText={fmtDayShort(e.start).replace(/^(\w+) (\d+) (\w+)$/, '$1 $2')} />
                    </View>
                  ))}
                  <View style={[s.note, { backgroundColor: colors.tabFill }]}>
                    <Info size={16} color={colors.textPrimary} strokeWidth={1.8} style={{ marginTop: 2 }} />
                    <Text style={[s.noteText, { color: colors.textPrimary }]}>Exam slots, goal dates, Priority tickets and study room slots are added for you. Each one shows where it came from.</Text>
                  </View>
                </View>
              ) : null}
            </>
          )}

          {view === 'week' && (
            <>
              <WeekView
                weekStart={startOfWeek(selected)}
                selected={selected}
                events={events}
                customCalendars={customCalendars}
                onWeek={n => setSelected(addDays(selected, n * 7))}
                onPickDay={d => { setSelected(startOfDay(d)); setView('day') }}
                onOpen={openEvent}
              />
              {!hasAny && !loading && (
                <Text style={[s.muted, { color: colors.textSecondary, paddingHorizontal: 4 }]}>Nothing in your week yet. Tap Add to put something in.</Text>
              )}
            </>
          )}

          {view === 'day' && (
            <DayView
              day={selected}
              events={events}
              customCalendars={customCalendars}
              onDay={d => setSelected(startOfDay(d))}
              onOpen={openEvent}
              onAdd={start => setEventSheet({ date: selected, start })}
              recommendation={rec}
              onDismissRec={dismissRec}
            />
          )}
        </View>
      </ScrollView>

      <EventSheet
        visible={!!eventSheet}
        onClose={() => setEventSheet(null)}
        event={eventSheet?.event || null}
        defaultDate={eventSheet?.date}
        defaultStart={eventSheet?.start}
        customCalendars={customCalendars}
        onSave={handleSave}
        onDelete={handleDelete}
        onAddCalendar={handleAddCalendar}
      />

      <ImportSheet
        visible={importOpen}
        onClose={() => setImportOpen(false)}
        customCalendars={customCalendars}
        deviceIds={deviceIds}
        onSaveLink={handleSaveLink}
        onSaveDevice={handleSaveDevice}
      />

      <Sheet visible={!!detail} onClose={() => setDetail(null)} title={detail?.title || ''} footer={<PrimaryButton label="Done" onPress={() => setDetail(null)} />}>
        {detail && (
          <View style={{ gap: 14 }}>
            <Text style={[s.detailWhen, { color: colors.textPrimary }]}>{describeWhen(detail)}</Text>
            <View style={[s.tag, { backgroundColor: colors.tabFill }]}>
              {KIND_META[detail.kind]?.Icon ? (() => { const I = KIND_META[detail.kind].Icon; return <I size={16} color={colors.textPrimary} strokeWidth={1.9} /> })() : null}
              <Text style={[s.tagText, { color: colors.textPrimary }]}>{sourceLine(detail)}</Text>
            </View>
            {!!detail.location && <Text style={[s.muted, { color: colors.textSecondary }]}>{detail.location}</Text>}
            <Text style={[s.muted, { color: colors.textSecondary }]}>
              {detail.kind === 'phone' ? 'Read from your phone\'s calendar. Change it in your calendar app.' : 'Added for you. To change it, use the place it came from.'}
            </Text>
          </View>
        )}
      </Sheet>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingBottom: 48 },
  title: { paddingBottom: 14 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 4 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  addBtn: { height: 44, borderRadius: 22, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 6 },
  addText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  body: { paddingHorizontal: 16, gap: 16 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14 },
  bannerText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 19 },
  legend: { gap: 8, paddingHorizontal: 2 },
  card: { borderRadius: 24, padding: 18, borderWidth: StyleSheet.hairlineWidth },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  cardTitle: { fontFamily: fonts.serif, fontSize: 22 },
  link: { fontFamily: fonts.sansSemiBold, fontSize: 14, textDecorationLine: 'underline', paddingVertical: 8 },
  muted: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 20, paddingVertical: 8 },
  div: { height: StyleSheet.hairlineWidth },
  note: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, marginTop: 10 },
  noteText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19 },
  emptyCard: { alignItems: 'center', paddingVertical: 28 },
  emptyIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 22 },
  emptySub: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 6, maxWidth: 280 },
  emptyBtns: { alignSelf: 'stretch', gap: 10, marginTop: 20 },
  detailWhen: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14 },
  tagText: { fontFamily: fonts.sansMedium, fontSize: 14 },
})
