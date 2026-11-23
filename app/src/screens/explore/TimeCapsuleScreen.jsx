import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, ActivityIndicator, StyleSheet } from 'react-native'
import { Lock, LockOpen, Bell, PenLine } from 'lucide-react-native'
import { ToolScreen, Card, Eyebrow, H2, Body, Btn } from '../../components/explore/ToolBits'
import { supabase } from '../../lib/supabase'
import { checkText, GUIDELINES_MESSAGE, moderationMessage } from '../../lib/moderation'
import { scheduleReminders, cancelRemindersWithPrefix } from '../../lib/explore/localReminders'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

// Note to your 2027 self. One short private note, locked until the capsule
// opens (1 January 2027 at 9am Irish time, set by the app_flags key
// capsule_open_at). All reads and writes go through two RPCs, see
// supabase/migrations/20261124100000_time_capsule_notes.sql:
//   my_time_capsule()   -> { has_note, created_at, open_at, body, is_open, can_save, server_now }
//   save_time_capsule() -> writes or replaces the note, before the open moment only
// The note text never leaves the server before it opens. A reminder is
// scheduled on this phone for the open moment (no server push).

const MAX = 1000
const TAKE_MAX = 280
const PREFIX = 'time-capsule-'
const FALLBACK_OPEN = '2027-01-01T09:00:00Z'

function irishParts(iso, opts) {
  try {
    return new Date(iso).toLocaleString('en-IE', { timeZone: 'Europe/Dublin', ...opts })
  } catch {
    return null
  }
}

// "1 January 2027"
function dateLabel(iso) {
  const v = irishParts(iso, { day: 'numeric', month: 'long', year: 'numeric' })
  if (v) return v
  const d = new Date(iso)
  const m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${d.getUTCDate()} ${m[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// "9am" or "9:30am", in Irish time.
function timeLabel(iso) {
  const v = irishParts(iso, { hour: 'numeric', minute: '2-digit', hour12: true })
  if (v) return v.replace(/[\s.]/g, '').replace(':00', '').toLowerCase()
  const d = new Date(iso)
  const h = d.getUTCHours()
  return `${h % 12 || 12}${d.getUTCMinutes() ? ':' + String(d.getUTCMinutes()).padStart(2, '0') : ''}${h >= 12 ? 'pm' : 'am'}`
}

function countdown(ms) {
  const mins = Math.max(0, Math.floor(ms / 60000))
  return { days: Math.floor(mins / 1440), hours: Math.floor((mins % 1440) / 60), mins: mins % 60 }
}

export default function TimeCapsuleScreen({ navigation }) {
  const { colors } = useTheme()
  const [state, setState] = useState({ status: 'loading', capsule: null })
  const [text, setText] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [reminder, setReminder] = useState(null)
  // Offset between the server clock and this phone, so the countdown follows the server.
  const [skew, setSkew] = useState(0)
  const [now, setNow] = useState(Date.now())

  const load = useCallback(async () => {
    setState(s => (s.capsule ? s : { status: 'loading', capsule: null }))
    try {
      const { data, error: err } = await supabase.rpc('my_time_capsule')
      if (err) throw err
      const row = Array.isArray(data) ? data[0] : data
      if (!row) throw new Error('empty')
      setSkew(row.server_now ? new Date(row.server_now).getTime() - Date.now() : 0)
      setState({ status: 'ready', capsule: row })
    } catch {
      setState({ status: 'error', capsule: null })
    }
  }, [])

  useEffect(() => { load() }, [load])

  // Tick every 30 seconds while the note is locked.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(id)
  }, [])

  const c = state.capsule
  const locked = !!c && c.has_note && !c.is_open
  const open = !!c && c.has_note && c.is_open

  // The moment the countdown reaches zero, ask the server for the note.
  const dueAt = locked ? new Date(c.open_at).getTime() : 0
  useEffect(() => {
    if (locked && now + skew >= dueAt) load()
  }, [locked, now, skew, dueAt, load])

  // Keep the phone reminder in step with the saved note.
  useEffect(() => {
    if (!c) return
    if (c.has_note && !c.is_open) {
      scheduleReminders(PREFIX, [{
        id: 'open',
        date: new Date(c.open_at),
        title: 'Your note to 2027 is ready',
        body: 'You wrote it a while ago. Come and read it.',
      }]).then(setReminder)
    } else {
      cancelRemindersWithPrefix(PREFIX)
    }
  }, [c])

  async function seal() {
    const body = text.trim()
    if (!body) { setError('Write a few words first.'); return }
    if (body.length > MAX) { setError(`Keep it to ${MAX} characters.`); return }
    if (!checkText(body).ok) { setError(GUIDELINES_MESSAGE); return }
    setSaving(true)
    setError('')
    try {
      const { error: err } = await supabase.rpc('save_time_capsule', { p_body: body })
      if (err) throw err
      setText('')
      setEditing(false)
      await load()
    } catch (e) {
      const msg = String(e?.message || '')
      setError(
        /closed/.test(msg)
          ? 'The capsule has closed, so this note could not be saved.'
          : moderationMessage(e, 'Could not save your note. Please try again.'),
      )
    } finally {
      setSaving(false)
    }
  }

  function shareTake() {
    navigation.navigate('Composer', { initialTab: 'thread', initialText: (c?.body || '').slice(0, TAKE_MAX) })
  }

  const opensDate = c ? dateLabel(c.open_at || FALLBACK_OPEN) : '1 January 2027'
  const opensTime = c ? timeLabel(c.open_at || FALLBACK_OPEN) : '9am'
  const showForm = !!c && c.can_save && (!c.has_note || editing)

  const subtitle = !c ? 'A private note to future you.'
    : open ? `It opened on ${opensDate}.`
    : locked ? `Sealed until ${opensDate}.`
    : c.can_save ? `Write it now. It opens on ${opensDate}.`
    : 'A private note to future you.'

  return (
    <ToolScreen
      navigation={navigation}
      title="Note to your 2027 self"
      subtitle={subtitle}
    >
      {state.status === 'loading' && (
        <View style={s.center}><ActivityIndicator color={colors.textSecondary} /></View>
      )}

      {state.status === 'error' && (
        <Card>
          <H2>We could not load your note</H2>
          <Body secondary style={{ marginTop: 6 }}>Check your connection and try again.</Body>
          <Btn label="Try again" kind="secondary" onPress={load} style={{ marginTop: 18 }} />
        </Card>
      )}

      {showForm && (
        <Card>
          <Eyebrow>Private to you</Eyebrow>
          <H2 style={{ marginTop: 6 }}>{editing ? 'Write it again' : 'What do you want to tell 2027 you?'}</H2>
          <Body secondary style={{ marginTop: 6 }}>
            {editing
              ? 'This replaces your sealed note. You cannot read the old one first.'
              : 'A hope, a worry, a promise. Only you can read it, and not until it opens.'}
          </Body>
          <TextInput
            value={text}
            onChangeText={t => { setText(t); if (error) setError('') }}
            placeholder="Dear me,"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={MAX}
            accessibilityLabel="Your note"
            style={[s.input, { color: colors.textPrimary, backgroundColor: colors.background, borderColor: colors.border }]}
          />
          <Text style={[s.count, { color: colors.textSecondary }]}>{text.length} of {MAX}</Text>
          {!!error && <Text style={[s.error, { color: colors.destructive }]}>{error}</Text>}
          <Btn label={saving ? 'Sealing' : 'Seal my note'} Icon={Lock} onPress={seal} disabled={saving || !text.trim()} style={{ marginTop: 16 }} />
          {editing && <Btn label="Keep my sealed note" kind="quiet" onPress={() => { setEditing(false); setError(''); setText('') }} style={{ marginTop: 4 }} />}
          <Text style={[s.small, { color: colors.textSecondary }]}>
            It opens on {opensDate} at {opensTime} Irish time.
          </Text>
        </Card>
      )}

      {c && locked && !showForm && (
        <Card>
          <View style={[s.badge, { backgroundColor: colors.tabFill }]}>
            <Lock size={22} color={colors.textPrimary} strokeWidth={1.8} />
          </View>
          <H2 style={{ marginTop: 16 }}>Your note is sealed</H2>
          <Body secondary style={{ marginTop: 6 }}>
            It opens on {opensDate} at {opensTime} Irish time. Not even you can read it before then.
          </Body>
          <CountdownRow ms={new Date(c.open_at).getTime() - (now + skew)} />
          <Text style={[s.small, { color: colors.textSecondary, marginTop: 4 }]}>Written on {dateLabel(c.created_at)}</Text>
          <ReminderLine state={reminder} opensDate={opensDate} />
          {c.can_save && (
            <Btn label="Write it again" kind="quiet" Icon={PenLine} onPress={() => { setEditing(true); setError('') }} style={{ marginTop: 14 }} />
          )}
        </Card>
      )}

      {c && open && !showForm && (
        <Card>
          <View style={[s.badge, { backgroundColor: colors.tabFill }]}>
            <LockOpen size={22} color={colors.textPrimary} strokeWidth={1.8} />
          </View>
          <Eyebrow style={{ marginTop: 16 }}>Written on {dateLabel(c.created_at)}</Eyebrow>
          <Text style={[s.note, { color: colors.textPrimary }]} selectable>{c.body}</Text>
          <Body secondary style={{ marginTop: 18 }}>
            Only you can see this. Share it as a Take if you want to.
          </Body>
          {(c.body || '').length > TAKE_MAX && (
            <Text style={[s.small, { color: colors.textSecondary, marginTop: 6 }]}>
              A Take holds {TAKE_MAX} characters, so the start of your note is added and you can edit it.
            </Text>
          )}
          <Btn label="Share a Take" onPress={shareTake} style={{ marginTop: 16 }} />
        </Card>
      )}

      {c && !c.has_note && !c.can_save && (
        <Card>
          <H2>The capsule has closed</H2>
          <Body secondary style={{ marginTop: 6 }}>
            Notes could only be saved before {opensDate}.
          </Body>
        </Card>
      )}
    </ToolScreen>
  )
}

function CountdownRow({ ms }) {
  const { colors } = useTheme()
  const { days, hours, mins } = countdown(ms)
  const cells = [
    [days, days === 1 ? 'day' : 'days'],
    [hours, hours === 1 ? 'hour' : 'hours'],
    [mins, mins === 1 ? 'minute' : 'minutes'],
  ]
  return (
    <View style={s.countRow} accessible accessibilityLabel={`${days} days, ${hours} hours and ${mins} minutes to go`}>
      {cells.map(([n, label]) => (
        <View key={label} style={[s.countCell, { backgroundColor: colors.tabFill }]}>
          <Text style={[s.countNum, { color: colors.textPrimary }]}>{n}</Text>
          <Text style={[s.countLabel, { color: colors.textSecondary }]}>{label}</Text>
        </View>
      ))}
    </View>
  )
}

// Honest about the phone reminder: it only exists on a phone with notifications on.
function ReminderLine({ state, opensDate }) {
  const { colors } = useTheme()
  let line
  if (state === 'scheduled') line = 'We will remind you on your phone when it opens.'
  else if (state === 'denied') line = `Notifications are off for UniBlueprint, so we cannot remind you. Your note still opens on ${opensDate}.`
  else if (state === 'unavailable') line = `Reminders work in the phone app. Your note still opens on ${opensDate}. Come back then.`
  else return null
  return (
    <View style={s.reminderRow}>
      <Bell size={14} color={colors.textSecondary} strokeWidth={1.8} style={{ marginTop: 3 }} />
      <Text style={[s.small, { color: colors.textSecondary, marginTop: 0, flex: 1 }]}>{line}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  center: { paddingVertical: 48, alignItems: 'center' },
  input: {
    fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, minHeight: 200, marginTop: 18,
    borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 14,
    textAlignVertical: 'top', outlineStyle: 'none',
  },
  count: { fontFamily: fonts.sans, fontSize: 12.5, textAlign: 'right', marginTop: 8 },
  error: { fontFamily: fonts.sansMedium, fontSize: 13, lineHeight: 18, marginTop: 10 },
  small: { fontFamily: fonts.sans, fontSize: 12.5, lineHeight: 18, marginTop: 14 },
  badge: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  countRow: { flexDirection: 'row', gap: 10, marginTop: 22 },
  countCell: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  countNum: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  countLabel: { fontFamily: fonts.sans, fontSize: 12.5, marginTop: 2 },
  reminderRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  note: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 30, marginTop: 8 },
})
