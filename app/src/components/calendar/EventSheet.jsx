import { useState, useEffect, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, Switch, ScrollView, StyleSheet } from 'react-native'
import { CalendarDays, Clock, Plus, Trash2 } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import {
  EVENT_TYPES, BUILTIN_CALENDARS, CUSTOM_COLOURS, calendarColor, fmtDayShort, startOfDay, addDays, pad, addMonths,
} from '../../lib/calendar/model'
import { Sheet, Chip, PrimaryButton } from './Parts'
import MonthView from './MonthView'

// Add event and Edit event. One sheet: title, type, calendar colour, date,
// start and end (or all day), then Save. Date and time open inline below
// their field, so no extra pop up is needed and it works the same on every
// phone and on the web.

const DEFAULT_CAL_FOR_TYPE = { class: 'college', work: 'work', personal: 'personal', other: 'personal' }
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

function timeOf(d) { return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
function withTime(day, hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), h, m)
}
function nextHour(from) {
  const d = new Date(from)
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 1)
  return d
}

export default function EventSheet({ visible, onClose, event, defaultDate, defaultStart, customCalendars = [], onSave, onDelete, onAddCalendar }) {
  const { colors, isDark } = useTheme()
  const editing = !!event
  const [title, setTitle] = useState('')
  const [type, setType] = useState('class')
  const [calendar, setCalendar] = useState('college')
  const [calTouched, setCalTouched] = useState(false)
  const [allDay, setAllDay] = useState(false)
  const [date, setDate] = useState(startOfDay(new Date()))
  const [pickMonth, setPickMonth] = useState(startOfDay(new Date()))
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('10:00')
  const [open, setOpen] = useState(null) // 'date' | 'start' | 'end' | null
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [newCal, setNewCal] = useState(false)
  const [calName, setCalName] = useState('')
  const [calColour, setCalColour] = useState(CUSTOM_COLOURS[0])
  const bodyRef = useRef(null)

  // An opened date or time picker sits at the bottom, so scroll it into view.
  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => bodyRef.current?.scrollToEnd?.({ animated: true }), 80)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!visible) return
    setError(''); setSaving(false); setConfirmDelete(false); setOpen(null); setNewCal(false); setCalName('')
    if (event) {
      setTitle(event.title); setType(event.type || 'other'); setCalendar(event.calendar || 'personal'); setCalTouched(true)
      setAllDay(!!event.allDay)
      const d = startOfDay(event.start)
      setDate(d); setPickMonth(d)
      setStart(timeOf(event.start))
      setEnd(timeOf(event.allDay || event.end <= event.start ? new Date(event.start.getTime() + 3600000) : event.end))
    } else {
      const base = defaultStart ? new Date(defaultStart) : nextHour(new Date())
      const d = startOfDay(defaultDate || base)
      setTitle(''); setType('class'); setCalendar('college'); setCalTouched(false); setAllDay(false)
      setDate(d); setPickMonth(d)
      const st = defaultStart ? new Date(defaultStart) : (defaultDate && !isSameDay(defaultDate, new Date()) ? withTime(d, '09:00') : base)
      setStart(timeOf(st)); setEnd(timeOf(new Date(st.getTime() + 3600000)))
    }
  }, [visible, event, defaultDate, defaultStart])

  function pickType(k) {
    setType(k)
    if (!calTouched) setCalendar(DEFAULT_CAL_FOR_TYPE[k] || 'personal')
  }

  async function addCal() {
    const name = calName.trim()
    if (!name) { setError('Give your calendar a name.'); return }
    const made = await onAddCalendar?.({ name: name.slice(0, 24), color: calColour })
    if (made) { setCalendar(made.id); setCalTouched(true); setNewCal(false); setCalName(''); setError('') }
  }

  async function save() {
    const t = title.trim()
    if (!t) { setError('Add a title.'); return }
    let starts, ends
    if (allDay) {
      starts = startOfDay(date); ends = addDays(starts, 1)
    } else {
      starts = withTime(date, start); ends = withTime(date, end)
      if (ends <= starts) { setError('The end must be after the start.'); return }
    }
    setError(''); setSaving(true)
    try {
      await onSave({
        title: t.slice(0, 120), event_type: type, calendar_key: calendar,
        starts_at: starts.toISOString(), ends_at: ends.toISOString(), all_day: allDay,
      })
    } finally { setSaving(false) }
  }

  const field = [s.field, { backgroundColor: colors.background, borderColor: colors.border }]

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={editing ? 'Edit event' : 'Add event'}
      bodyRef={bodyRef}
      footer={
        <View style={{ gap: 10 }}>
          {!!error && <Text style={[s.error, { color: colors.destructive }]} accessibilityLiveRegion="polite">{error}</Text>}
          <PrimaryButton label={saving ? 'Saving' : 'Save event'} onPress={save} disabled={saving} />
          {editing && (
            <TouchableOpacity
              onPress={() => (confirmDelete ? onDelete?.() : setConfirmDelete(true))}
              style={s.delete}
              accessibilityRole="button"
            >
              <Trash2 size={16} color={colors.destructive} strokeWidth={2} />
              <Text style={[s.deleteText, { color: colors.destructive }]}>{confirmDelete ? 'Tap again to delete' : 'Delete event'}</Text>
            </TouchableOpacity>
          )}
        </View>
      }
    >
      <Text style={[s.label, { color: colors.textSecondary }]}>Title</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="What is it?"
        placeholderTextColor={colors.textTertiary}
        maxLength={120}
        style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
        accessibilityLabel="Event title"
      />

      <Text style={[s.label, { color: colors.textSecondary }]}>Type</Text>
      <View style={s.wrap}>
        {EVENT_TYPES.map(t => <Chip key={t.key} label={t.label} Icon={t.Icon} on={type === t.key} onPress={() => pickType(t.key)} />)}
      </View>

      <Text style={[s.label, { color: colors.textSecondary }]}>Calendar</Text>
      <View style={s.wrap}>
        {BUILTIN_CALENDARS.map(c => (
          <Chip key={c.key} label={c.name} dot={calendarColor(c.key, customCalendars, isDark)} on={calendar === c.key} onPress={() => { setCalendar(c.key); setCalTouched(true) }} />
        ))}
        {customCalendars.map(c => (
          <Chip key={c.id} label={c.name} dot={calendarColor(c.id, customCalendars, isDark)} on={calendar === c.id} onPress={() => { setCalendar(c.id); setCalTouched(true) }} />
        ))}
        <Chip label="New" Icon={Plus} on={newCal} onPress={() => setNewCal(v => !v)} />
      </View>
      {newCal && (
        <View style={[s.newCal, { borderColor: colors.border }]}>
          <TextInput
            value={calName}
            onChangeText={setCalName}
            placeholder="Calendar name"
            placeholderTextColor={colors.textTertiary}
            maxLength={24}
            style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]}
            accessibilityLabel="New calendar name"
          />
          <View style={s.swatches}>
            {CUSTOM_COLOURS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => setCalColour(c)}
                accessibilityRole="button"
                accessibilityLabel={`Colour ${c}`}
                accessibilityState={{ selected: calColour === c }}
                style={[s.swatch, { backgroundColor: calendarColor('x', [{ id: 'x', color: c }], isDark) }, calColour === c && { borderColor: colors.textPrimary, borderWidth: 3 }]}
              />
            ))}
          </View>
          <PrimaryButton label="Add calendar" onPress={addCal} style={{ minHeight: 44 }} />
        </View>
      )}

      <View style={s.switchRow}>
        <Text style={[s.switchLabel, { color: colors.textPrimary }]}>All day</Text>
        <Switch
          value={allDay}
          onValueChange={v => { setAllDay(v); setOpen(null) }}
          trackColor={{ true: colors.accentBg, false: colors.border }}
          thumbColor={isDark ? colors.textPrimary : '#FFFFFF'}
          accessibilityLabel="All day"
        />
      </View>

      <Text style={[s.label, { color: colors.textSecondary }]}>Date</Text>
      <TouchableOpacity style={field} onPress={() => setOpen(open === 'date' ? null : 'date')} accessibilityRole="button" accessibilityLabel={`Date, ${fmtDayShort(date)}`}>
        <CalendarDays size={18} color={colors.textPrimary} strokeWidth={1.8} />
        <Text style={[s.fieldText, { color: colors.textPrimary }]}>{fmtDayShort(date)}</Text>
      </TouchableOpacity>
      {open === 'date' && (
        <View style={[s.picker, { borderColor: colors.border }]}>
          <MonthView picker month={pickMonth} selected={date} onSelect={d => { setDate(startOfDay(d)); setOpen(null) }} onMonth={n => setPickMonth(addMonths(pickMonth, n))} />
        </View>
      )}

      {!allDay && (
        <View style={s.timeRow}>
          <View style={{ flex: 1 }}>
            <Text style={[s.label, { color: colors.textSecondary }]}>Start</Text>
            <TouchableOpacity style={field} onPress={() => setOpen(open === 'start' ? null : 'start')} accessibilityRole="button" accessibilityLabel={`Start time, ${start}`}>
              <Clock size={18} color={colors.textPrimary} strokeWidth={1.8} />
              <Text style={[s.fieldText, { color: colors.textPrimary }]}>{start}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.label, { color: colors.textSecondary }]}>End</Text>
            <TouchableOpacity style={field} onPress={() => setOpen(open === 'end' ? null : 'end')} accessibilityRole="button" accessibilityLabel={`End time, ${end}`}>
              <Clock size={18} color={colors.textPrimary} strokeWidth={1.8} />
              <Text style={[s.fieldText, { color: colors.textPrimary }]}>{end}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {!allDay && (open === 'start' || open === 'end') && (
        <TimePicker
          value={open === 'start' ? start : end}
          onChange={v => {
            if (open === 'start') {
              // Keep the length the same when the start moves.
              const len = Math.max(30, (withTime(date, end) - withTime(date, start)) / 60000)
              setStart(v)
              const ne = new Date(withTime(date, v).getTime() + len * 60000)
              setEnd(ne.getDate() === date.getDate() ? timeOf(ne) : '23:55')
            } else setEnd(v)
          }}
        />
      )}
    </Sheet>
  )
}

function isSameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate() }

function TimePicker({ value, onChange }) {
  const { colors } = useTheme()
  const [h, m] = value.split(':')
  return (
    <View style={[s.picker, { borderColor: colors.border, paddingVertical: 10 }]}>
      <Text style={[s.miniLabel, { color: colors.textSecondary }]}>Hour</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.timeScroll}>
        {Array.from({ length: 24 }, (_, i) => pad(i)).map(x => <Chip key={x} label={x} on={x === h} onPress={() => onChange(`${x}:${m}`)} style={s.timeChip} />)}
      </ScrollView>
      <Text style={[s.miniLabel, { color: colors.textSecondary, marginTop: 8 }]}>Minutes</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.timeScroll}>
        {MINUTES.map(x => <Chip key={x} label={x} on={x === m} onPress={() => onChange(`${h}:${x}`)} style={s.timeChip} />)}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  label: { fontFamily: fonts.sansSemiBold, fontSize: 13, marginTop: 16, marginBottom: 8 },
  input: { fontFamily: fonts.sans, fontSize: 16, minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  fieldText: { fontFamily: fonts.sansMedium, fontSize: 16 },
  timeRow: { flexDirection: 'row', gap: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 18, minHeight: 44 },
  switchLabel: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  picker: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, marginTop: 10, paddingHorizontal: 4 },
  miniLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, paddingHorizontal: 10, marginBottom: 6 },
  timeScroll: { gap: 6, paddingHorizontal: 10 },
  timeChip: { minHeight: 40, paddingHorizontal: 12, minWidth: 48, justifyContent: 'center' },
  newCal: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 12, gap: 12, marginTop: 12 },
  swatches: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  swatch: { width: 34, height: 34, borderRadius: 17, borderWidth: 0 },
  error: { fontFamily: fonts.sansMedium, fontSize: 14, textAlign: 'center' },
  delete: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
})
