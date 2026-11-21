import { useState, useEffect, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Plus, CalendarDays, AlertTriangle, Clock, Trash2, Check } from 'lucide-react-native'
import { ToolScreen, Card, Eyebrow, H2, Body, Btn, Chip, Field } from '../../components/explore/ToolBits'
import { useLocalList, newId } from '../../lib/explore/localStore'
import { parseDate, parseTime, toKey, prettyDate, formatMinutes, keyToLocalDate } from '../../lib/explore/dates'
import { sortExams, checkSlot, flagAll, toCalendarItems, TIGHT_GAP_MIN } from '../../lib/explore/exams'
import { addCalendarItems } from '../../lib/calendar/items'
import { scheduleReminders } from '../../lib/explore/localReminders'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Exam clash checker. Add each exam with its date and times. The new exam is
// checked against the others while the member types, before it is saved. Saved
// exams are listed by date with clashes and tight gaps flagged where they
// happen, and they also show on the Calendar. Kept on this phone only.

const REMIND_PREFIX = 'exam-remind-'

export default function ExamClashScreen({ navigation }) {
  const { colors } = useTheme()
  const [exams, setExams, loaded] = useLocalList('exams')
  const [form, setForm] = useState({ module: '', date: '', start: '', end: '', room: '', remind: true })
  const [remindState, setRemindState] = useState(null)

  // Keep the Calendar and the reminders in step with the saved list.
  useEffect(() => {
    if (!loaded) return
    addCalendarItems('exams', toCalendarItems(exams)).catch(() => {})
    const reminders = exams
      .filter(e => e.remind)
      .map(e => {
        const d = keyToLocalDate(e.date, 19 * 60)
        if (d) d.setDate(d.getDate() - 1)
        return { id: e.id, date: d, title: `Exam tomorrow: ${e.module}`, body: `${formatMinutes(e.start)} to ${formatMinutes(e.end)}${e.room ? `, ${e.room}` : ''}. Good luck.` }
      })
    scheduleReminders(REMIND_PREFIX, reminders).then(setRemindState)
  }, [exams, loaded])

  const parsed = useMemo(() => {
    const d = parseDate(form.date)
    const st = parseTime(form.start)
    const en = parseTime(form.end)
    if (!d || st == null || en == null) return null
    return { date: toKey(d), start: st, end: en, ok: en > st }
  }, [form.date, form.start, form.end])

  const live = useMemo(() => {
    if (!parsed || !parsed.ok) return null
    const slot = { id: '__new', module: form.module || 'This exam', ...parsed }
    return { slot, ...checkSlot(slot, exams) }
  }, [parsed, exams, form.module])

  const sorted = useMemo(() => sortExams(exams), [exams])
  const { flags, clashCount, tightCount } = useMemo(() => flagAll(exams), [exams])
  const canSave = form.module.trim().length > 0 && parsed && parsed.ok

  function save() {
    if (!canSave) return
    setExams(list => [...list, { id: newId('exam'), module: form.module.trim(), date: parsed.date, start: parsed.start, end: parsed.end, room: form.room.trim(), remind: form.remind }])
    setForm({ module: '', date: '', start: '', end: '', room: '', remind: form.remind })
  }

  function remove(id) {
    setExams(list => list.filter(e => e.id !== id))
  }

  // Group by date.
  const groups = []
  sorted.forEach(e => {
    const last = groups[groups.length - 1]
    if (last && last.date === e.date) last.items.push(e)
    else groups.push({ date: e.date, items: [e] })
  })

  return (
    <ToolScreen navigation={navigation} title="Exam clash checker" subtitle="Exams also show in your Calendar.">
      {/* Add form with live check */}
      <Card>
        <H2>Add an exam</H2>
        <Field label="Module" value={form.module} onChangeText={t => setForm({ ...form, module: t })} placeholder="Module name" maxLength={60} style={{ marginTop: 12 }} />
        <Field label="Date" value={form.date} onChangeText={t => setForm({ ...form, date: t })} placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" maxLength={10} />
        <View style={s.twoCol}>
          <Field label="Starts" value={form.start} onChangeText={t => setForm({ ...form, start: t })} placeholder="09:30" keyboardType="numbers-and-punctuation" maxLength={5} style={s.col} />
          <Field label="Ends" value={form.end} onChangeText={t => setForm({ ...form, end: t })} placeholder="11:30" keyboardType="numbers-and-punctuation" maxLength={5} style={s.col} />
        </View>
        <Field label="Room (optional)" value={form.room} onChangeText={t => setForm({ ...form, room: t })} placeholder="Room" maxLength={40} />

        {parsed && !parsed.ok && (
          <Text style={[s.warnText, { color: colors.destructive }]}>The end time needs to be after the start time.</Text>
        )}
        {live && <LiveCheck live={live} others={exams} />}

        <TouchableOpacity
          onPress={() => setForm({ ...form, remind: !form.remind })}
          activeOpacity={0.8}
          accessibilityRole="switch"
          accessibilityState={{ checked: form.remind }}
          accessibilityLabel="Remind me the evening before"
          style={s.remindRow}
        >
          <View style={[s.box, { borderColor: colors.border, backgroundColor: form.remind ? colors.accentBg : 'transparent' }]}>
            {form.remind && <Check size={14} color={colors.accentFg} strokeWidth={3} />}
          </View>
          <Text style={[s.remindText, { color: colors.textPrimary }]}>Remind me the evening before</Text>
        </TouchableOpacity>
        {remindState === 'denied' && (
          <Text style={[s.small, { color: colors.textSecondary }]}>Notifications are off for UniBlueprint, so reminders will not show. You can turn them on in your phone settings.</Text>
        )}

        <Btn label="Save exam" Icon={Plus} onPress={save} disabled={!canSave} style={{ marginTop: 18 }} />
      </Card>

      {/* Summary */}
      {exams.length > 0 && (
        <>
          <Card style={{ marginTop: 16 }}>
            <Eyebrow>Your exams</Eyebrow>
            <Text style={[s.summary, { color: colors.textPrimary }]}>
              {exams.length} {exams.length === 1 ? 'exam' : 'exams'}
              {clashCount > 0 ? `, ${clashCount} ${clashCount === 1 ? 'clash' : 'clashes'}` : ', no clashes'}
              {tightCount > 0 ? `, ${tightCount} tight ${tightCount === 1 ? 'gap' : 'gaps'}` : ''}
            </Text>
            <View style={s.calNote}>
              <CalendarDays size={15} color={colors.textSecondary} strokeWidth={1.8} />
              <Text style={[s.small, { color: colors.textSecondary, marginTop: 0 }]}>Also shown in your Calendar.</Text>
            </View>
          </Card>

          {groups.map(g => (
            <View key={g.date} style={{ marginTop: 22 }}>
              <Text style={[s.dateHead, { color: colors.textPrimary }]}>{prettyDate(g.date)}</Text>
              <View style={[s.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {g.items.map((e, i) => {
                  const f = flags[e.id] || { clashes: [], tight: [] }
                  return (
                    <View key={e.id} style={[s.examRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[s.examName, { color: colors.textPrimary }]} numberOfLines={2}>{e.module}</Text>
                        <Text style={[s.examTime, { color: colors.textSecondary }]}>
                          {formatMinutes(e.start)} to {formatMinutes(e.end)}{e.room ? `, ${e.room}` : ''}
                        </Text>
                        {f.clashes.map(c => (
                          <Flag key={c.other.id} kind="clash" text={`Clashes with ${c.other.module} by ${c.overlap} min`} />
                        ))}
                        {f.tight.map(t => (
                          <Flag key={t.other.id} kind="tight" text={`${t.gap} min gap to ${t.other.module}`} />
                        ))}
                      </View>
                      <TouchableOpacity onPress={() => remove(e.id)} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Delete ${e.module}`} style={s.trash}>
                        <Trash2 size={18} color={colors.textTertiary} strokeWidth={1.8} />
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </View>
            </View>
          ))}
        </>
      )}

      {loaded && exams.length === 0 && (
        <Body secondary style={{ marginTop: 20, paddingHorizontal: 4 }}>
          No exams yet. Add your first one above. Tight gaps are flagged when two exams are under {TIGHT_GAP_MIN} minutes apart.
        </Body>
      )}
    </ToolScreen>
  )
}

function Flag({ kind, text }) {
  const { colors } = useTheme()
  const Icon = kind === 'clash' ? AlertTriangle : Clock
  const tone = kind === 'clash' ? colors.destructive : colors.warning
  return (
    <View style={s.flag}>
      <Icon size={14} color={tone} strokeWidth={2} style={{ marginTop: 2 }} />
      <Text style={[s.flagText, { color: tone }]}>{text}</Text>
    </View>
  )
}

function LiveCheck({ live, others }) {
  const { colors, isDark } = useTheme()
  const { slot, clashes, tight } = live
  const same = others.filter(o => o.date === slot.date)
  const clash = clashes.length > 0
  const tone = clash ? colors.destructive : tight.length ? colors.warning : colors.success
  const bg = isDark ? 'rgba(255,255,255,0.05)' : clash ? 'rgba(220,38,38,0.07)' : tight.length ? colors.warningBg : colors.successBg
  const lo = Math.min(slot.start, ...same.map(o => o.start)) - 30
  const hi = Math.max(slot.end, ...same.map(o => o.end)) + 30
  const span = Math.max(hi - lo, 60)
  const pos = (a, b) => ({ left: `${((a - lo) / span) * 100}%`, width: `${Math.max(((b - a) / span) * 100, 3)}%` })
  return (
    <View style={[s.live, { backgroundColor: bg, borderColor: tone }]} accessibilityLiveRegion="polite">
      <View style={s.flag}>
        {clash ? <AlertTriangle size={16} color={tone} strokeWidth={2} /> : tight.length ? <Clock size={16} color={tone} strokeWidth={2} /> : <Check size={16} color={tone} strokeWidth={2.4} />}
        <Text style={[s.liveText, { color: colors.textPrimary }]}>
          {clash
            ? `Clashes with ${clashes[0].other.module} by ${clashes[0].overlap} min`
            : tight.length
              ? `Only ${tight[0].gap} min from ${tight[0].other.module}`
              : 'No clash with your other exams'}
        </Text>
      </View>
      {same.length > 0 && (
        <>
          <View style={[s.track, { backgroundColor: colors.tabFill }]}>
            {same.map(o => (
              <View key={o.id} style={[s.bar, pos(o.start, o.end), { backgroundColor: colors.textSecondary, top: 4 }]} />
            ))}
            <View style={[s.bar, pos(slot.start, slot.end), { backgroundColor: tone, top: 22 }]} />
          </View>
          <View style={s.trackLabels}>
            <Text style={[s.small, { color: colors.textSecondary, marginTop: 0 }]}>{formatMinutes(Math.max(lo, 0))}</Text>
            <Text style={[s.small, { color: colors.textSecondary, marginTop: 0 }]}>{formatMinutes(Math.min(hi, 1439))}</Text>
          </View>
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  twoCol: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  warnText: { fontFamily: fonts.sansMedium, fontSize: 13, marginTop: 12 },
  live: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 16 },
  liveText: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, lineHeight: 20 },
  track: { height: 42, borderRadius: 10, marginTop: 14, overflow: 'hidden' },
  bar: { position: 'absolute', height: 14, borderRadius: 7 },
  trackLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  remindRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, minHeight: 44 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  remindText: { fontFamily: fonts.sansMedium, fontSize: 14.5, flex: 1 },
  small: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, marginTop: 8 },
  summary: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, marginTop: 8 },
  calNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  dateHead: { fontFamily: fonts.sansBold, fontSize: 14, marginBottom: 10, paddingHorizontal: 4 },
  list: { borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  examRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16 },
  examName: { fontFamily: fonts.sansSemiBold, fontSize: 15.5 },
  examTime: { fontFamily: fonts.sans, fontSize: 13.5, marginTop: 3 },
  flag: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  flagText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18 },
  trash: { padding: 4, marginTop: 2 },
})
