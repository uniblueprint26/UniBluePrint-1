import { useState, useEffect, useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { Plus, Bell, Trash2, Pencil } from 'lucide-react-native'
import { ToolScreen, Card, Eyebrow, H2, Body, Btn, Chip, Field, FormSheet } from '../../components/explore/ToolBits'
import { useLocalList, newId } from '../../lib/explore/localStore'
import { parseDate, toKey, formatDate, fromKey, prettyDate, daysUntil, daysBetween, todayKey, keyToLocalDate } from '../../lib/explore/dates'
import { addCalendarItems } from '../../lib/calendar/items'
import { scheduleReminders } from '../../lib/explore/localReminders'
import { useAuth } from '../../context/AuthContext'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Goal countdown. The member chooses what the countdown is for: a graduation,
// an exam, a trip, the end of an apprenticeship, anything. Each goal counts the
// days left, shows a ring, shows on the Calendar, and can send gentle nudges at
// 200, 100, 50, 30 and 7 days to go. Kept on this phone only.

const NUDGE_DAYS = [200, 100, 50, 30, 7]
const PREFIX = 'goal-nudge-'

const KINDS = ['Graduation', 'Exam', 'Trip', 'Event', 'Other']

// A starting suggestion that fits who the member is. They can change it.
function suggestions(userType) {
  if (userType === 'apprentice') return ['End of my apprenticeship', 'My next exam', 'A trip']
  if (userType === 'worker') return ['My next big date', 'A trip', 'An event']
  if (userType === 'gap_year') return ['My next step', 'A trip', 'An event']
  return ['My graduation', 'My next exam', 'A trip']
}

const blank = userType => ({ title: suggestions(userType)[0], kind: 'Graduation', start: '', end: '', nudges: true })

export default function GoalCountdownScreen({ navigation }) {
  const { colors } = useTheme()
  const { profile } = useAuth()
  const userType = profile?.user_type
  const [goals, setGoals, loaded] = useLocalList('goals')
  const [draft, setDraft] = useState(null)
  const [nudgeState, setNudgeState] = useState(null)
  const [error, setError] = useState('')

  // Keep the Calendar and the nudges in step with the saved goals.
  useEffect(() => {
    if (!loaded) return
    addCalendarItems(
      'countdown',
      goals.map(g => ({ id: `goal-${g.id}`, title: g.title, start: g.end, allDay: true, kind: 'goal', label: 'Countdown', from: 'Added by you' })),
    ).catch(() => {})
    const reminders = []
    goals.filter(g => g.nudges).forEach(g => {
      NUDGE_DAYS.forEach(n => {
        const d = keyToLocalDate(g.end, 9 * 60)
        if (!d) return
        d.setDate(d.getDate() - n)
        reminders.push({ id: `${g.id}-${n}`, date: d, title: g.title, body: n === 7 ? 'One week to go.' : `${n} days to go.` })
      })
    })
    scheduleReminders(PREFIX, reminders).then(setNudgeState)
  }, [goals, loaded])

  const sorted = useMemo(() => [...goals].sort((a, b) => (a.end < b.end ? -1 : 1)), [goals])

  function openNew() {
    setError('')
    setDraft(blank(userType))
  }

  function openEdit(g) {
    setError('')
    setDraft({ id: g.id, title: g.title, kind: g.kind, start: formatDate(fromKey(g.start)), end: formatDate(fromKey(g.end)), nudges: !!g.nudges })
  }

  function save() {
    const end = parseDate(draft.end)
    const start = draft.start.trim() ? parseDate(draft.start) : null
    if (!draft.title.trim()) { setError('Say what this is for.'); return }
    if (!end) { setError('Add the date as DD/MM/YYYY.'); return }
    if (draft.start.trim() && !start) { setError('The start date needs to be DD/MM/YYYY, or leave it empty.'); return }
    if (start && toKey(start) >= toKey(end)) { setError('The start date needs to be before the date you are counting to.'); return }
    const g = { id: draft.id || newId('goal'), title: draft.title.trim(), kind: draft.kind, start: start ? toKey(start) : null, end: toKey(end), nudges: draft.nudges }
    setGoals(list => (draft.id ? list.map(x => (x.id === draft.id ? g : x)) : [...list, g]))
    setDraft(null)
  }

  function remove(id) {
    setGoals(list => list.filter(g => g.id !== id))
    setDraft(null)
  }

  return (
    <ToolScreen navigation={navigation} title="Goal countdown" subtitle="Count down to anything that matters to you.">
      {loaded && goals.length === 0 && (
        <Card>
          <H2>What are you counting down to?</H2>
          <Body secondary style={{ marginTop: 6 }}>
            A graduation, an exam, a trip, the end of your apprenticeship. You choose. It also shows on your Calendar.
          </Body>
          <Btn label="Add a countdown" Icon={Plus} onPress={openNew} style={{ marginTop: 18 }} />
        </Card>
      )}

      {sorted.map(g => <GoalCard key={g.id} goal={g} onEdit={() => openEdit(g)} />)}

      {goals.length > 0 && (
        <Btn label="Add another countdown" kind="secondary" Icon={Plus} onPress={openNew} style={{ marginTop: 20 }} />
      )}

      {nudgeState === 'denied' && goals.some(g => g.nudges) && (
        <Text style={[s.small, { color: colors.textSecondary }]}>Notifications are off for UniBlueprint, so nudges will not show. You can turn them on in your phone settings.</Text>
      )}

      <FormSheet visible={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit countdown' : 'New countdown'}>
        {!!draft && (
          <View>
            <Text style={[s.label, { color: colors.textSecondary }]}>What is it for?</Text>
            <View style={s.chips}>
              {KINDS.map(k => (
                <Chip key={k} label={k} active={draft.kind === k} onPress={() => setDraft({ ...draft, kind: k })} />
              ))}
            </View>
            <Field label="Name" value={draft.title} onChangeText={t => setDraft({ ...draft, title: t })} maxLength={50} />
            <View style={s.chips}>
              {suggestions(userType).map(t => (
                <Chip key={t} label={t} active={draft.title === t} onPress={() => setDraft({ ...draft, title: t })} style={{ marginTop: 10 }} />
              ))}
            </View>
            <Field label="Date you are counting to" value={draft.end} onChangeText={t => setDraft({ ...draft, end: t })} placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" maxLength={10} />
            <Field label="Start date (optional)" value={draft.start} onChangeText={t => setDraft({ ...draft, start: t })} placeholder="DD/MM/YYYY" keyboardType="numbers-and-punctuation" maxLength={10} hint="Add one to see how far through you are." />
            <TouchableOpacity
              onPress={() => setDraft({ ...draft, nudges: !draft.nudges })}
              activeOpacity={0.8}
              accessibilityRole="switch"
              accessibilityState={{ checked: draft.nudges }}
              style={s.nudgeRow}
            >
              <Bell size={18} color={colors.textPrimary} strokeWidth={1.8} />
              <Text style={[s.nudgeText, { color: colors.textPrimary }]}>Gentle nudges at 200, 100, 50, 30 and 7 days to go</Text>
              <View style={[s.switchTrack, { backgroundColor: draft.nudges ? colors.accentBg : colors.tabFill }]}>
                <View style={[s.switchKnob, { backgroundColor: draft.nudges ? colors.accentFg : colors.textTertiary, alignSelf: draft.nudges ? 'flex-end' : 'flex-start' }]} />
              </View>
            </TouchableOpacity>
            {!!error && <Text style={[s.error, { color: colors.destructive }]}>{error}</Text>}
            <Btn label="Save countdown" onPress={save} style={{ marginTop: 18 }} />
            {!!draft.id && <Btn label="Delete countdown" kind="quiet" Icon={Trash2} onPress={() => remove(draft.id)} style={{ marginTop: 4 }} />}
          </View>
        )}
      </FormSheet>
    </ToolScreen>
  )
}

function GoalCard({ goal, onEdit }) {
  const { colors } = useTheme()
  const left = daysUntil(goal.end)
  const past = left != null && left < 0
  const total = goal.start ? daysBetween(goal.start, goal.end) : null
  const done = goal.start && total > 0 ? Math.min(1, Math.max(0, (total - Math.max(left, 0)) / total)) : null
  const weeks = left != null && left > 0 ? Math.round(left / 7) : 0
  const R = 62
  const C = 2 * Math.PI * R
  const label = left == null ? '' : past ? 'Done' : left === 0 ? 'Today' : String(left)
  const unit = left == null || past || left === 0 ? '' : left === 1 ? 'day left' : 'days left'
  return (
    <Card style={{ marginTop: 14 }}>
      <View style={s.cardHead}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Eyebrow>{goal.kind}</Eyebrow>
          <Text style={[s.goalTitle, { color: colors.textPrimary }]}>{goal.title}</Text>
        </View>
        <TouchableOpacity onPress={onEdit} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Edit ${goal.title}`} style={[s.editBtn, { backgroundColor: colors.tabFill }]}>
          <Pencil size={16} color={colors.textPrimary} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      <View style={s.ringWrap} accessible accessibilityLabel={`${goal.title}. ${past ? 'This date has passed' : `${left} days left`}`}>
        <Svg width={156} height={156} viewBox="0 0 156 156">
          <Circle cx={78} cy={78} r={R} stroke={colors.tabFill} strokeWidth={10} fill="none" />
          {(done != null || past) && (
            <Circle
              cx={78} cy={78} r={R} stroke={colors.textPrimary} strokeWidth={10} fill="none" strokeLinecap="round"
              strokeDasharray={`${C * (past ? 1 : done)} ${C}`} transform="rotate(-90 78 78)"
            />
          )}
        </Svg>
        <View style={s.ringCenter} pointerEvents="none">
          <Text style={[s.ringNum, { color: colors.textPrimary }]}>{label}</Text>
          {!!unit && <Text style={[s.ringUnit, { color: colors.textSecondary }]}>{unit}</Text>}
        </View>
      </View>

      <Text style={[s.dateLine, { color: colors.textSecondary }]}>
        {prettyDate(goal.end)}
        {weeks > 0 ? `, about ${weeks} ${weeks === 1 ? 'week' : 'weeks'}` : ''}
        {done != null && !past ? `, ${Math.round(done * 100)}% of the way` : ''}
      </Text>
      {goal.nudges && !past && (
        <View style={s.nudgeLine}>
          <Bell size={14} color={colors.textSecondary} strokeWidth={1.8} />
          <Text style={[s.small, { color: colors.textSecondary, marginTop: 0 }]}>Nudges at 200, 100, 50, 30 and 7 days to go</Text>
        </View>
      )}
    </Card>
  )
}

const s = StyleSheet.create({
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  goalTitle: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 30, marginTop: 4 },
  editBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ringWrap: { alignSelf: 'center', width: 156, height: 156, marginTop: 20, alignItems: 'center', justifyContent: 'center' },
  ringCenter: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  ringNum: { fontFamily: fonts.serif, fontSize: 40, lineHeight: 46 },
  ringUnit: { fontFamily: fonts.sans, fontSize: 13 },
  dateLine: { fontFamily: fonts.sans, fontSize: 14, textAlign: 'center', marginTop: 16, lineHeight: 20 },
  nudgeLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  small: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, marginTop: 14 },
  label: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nudgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20, minHeight: 48 },
  nudgeText: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 20 },
  switchTrack: { width: 46, height: 28, borderRadius: 14, padding: 3, justifyContent: 'center' },
  switchKnob: { width: 22, height: 22, borderRadius: 11 },
  error: { fontFamily: fonts.sansMedium, fontSize: 13, marginTop: 12 },
})
