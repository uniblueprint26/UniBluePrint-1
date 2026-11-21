import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform, StyleSheet } from 'react-native'
import { Link2, Smartphone, Lock, Check } from 'lucide-react-native'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { BUILTIN_CALENDARS, calendarColor, fmtDayShort, fmtTime } from '../../lib/calendar/model'
import { fetchIcs, parseIcs } from '../../lib/calendar/ics'
import { deviceCalendarAvailable, requestDeviceCalendar, listDeviceCalendars } from '../../lib/calendar/device'
import { Sheet, Chip, PrimaryButton, SecondaryButton } from './Parts'

// Bring in a calendar. Two options only:
//   1. Paste a public calendar link (.ics). We fetch and read it on the phone,
//      show a preview, and save only when the member says so.
//   2. Read this phone's calendar. A plain explainer comes first. The member
//      picks which calendars to read. Read only, nothing is copied to UBP.
// Signing in with Google, Outlook or Apple is not part of the launch.

export default function ImportSheet({ visible, onClose, customCalendars = [], deviceIds = [], onSaveLink, onSaveDevice }) {
  const { colors, isDark } = useTheme()
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null) // { events, partial, skipped, truncated }
  const [target, setTarget] = useState('college')
  const [phoneStep, setPhoneStep] = useState('intro') // intro | choose
  const [phoneCals, setPhoneCals] = useState([])
  const [picked, setPicked] = useState([])
  const [phoneMsg, setPhoneMsg] = useState('')
  const webOnly = Platform.OS === 'web' || !deviceCalendarAvailable()

  useEffect(() => {
    if (!visible) return
    setUrl(''); setBusy(false); setError(''); setPreview(null); setTarget('college')
    setPhoneStep('intro'); setPhoneCals([]); setPicked(deviceIds); setPhoneMsg('')
  }, [visible])

  async function readLink() {
    setError(''); setBusy(true)
    try {
      const text = await fetchIcs(url)
      const res = parseIcs(text)
      if (!res.events.length) { setError('We found no events in that calendar for the coming months.'); return }
      setPreview({ ...res, url })
    } catch (e) {
      setError(e?.message || 'Something went wrong. Try again.')
    } finally { setBusy(false) }
  }

  async function saveLink() {
    setBusy(true); setError('')
    try {
      await onSaveLink(preview.events, target)
    } catch { setError('We could not save those events. Try again.'); setBusy(false) }
  }

  async function allowPhone() {
    setBusy(true); setPhoneMsg('')
    const res = await requestDeviceCalendar()
    if (res === 'granted') {
      const list = await listDeviceCalendars()
      setPhoneCals(list)
      setPhoneStep('choose')
      if (!list.length) setPhoneMsg('No calendars were found on this phone.')
    } else if (res === 'denied') {
      setPhoneMsg('Calendar access is off. You can turn it on in your phone settings.')
    } else setPhoneMsg('Reading this phone\'s calendar is not available here.')
    setBusy(false)
  }

  async function savePhone() {
    setBusy(true)
    try { await onSaveDevice(picked) } finally { setBusy(false) }
  }

  const toggle = id => setPicked(p => (p.includes(id) ? p.filter(x => x !== id) : [...p, id]))

  // ── preview step ──
  if (preview) {
    const first = preview.events.slice(0, 6)
    return (
      <Sheet
        visible={visible}
        onClose={onClose}
        title="Check before saving"
        footer={
          <View style={{ gap: 10 }}>
            {!!error && <Text style={[s.error, { color: colors.destructive }]}>{error}</Text>}
            <PrimaryButton label={busy ? 'Saving' : `Save ${preview.events.length} ${preview.events.length === 1 ? 'event' : 'events'}`} onPress={saveLink} disabled={busy} />
            <SecondaryButton label="Back" onPress={() => { setPreview(null); setError('') }} disabled={busy} />
          </View>
        }
      >
        <Text style={[s.sub, { color: colors.textSecondary }]}>
          {`We found ${preview.events.length} ${preview.events.length === 1 ? 'event' : 'events'}. Here are the first ${first.length}.`}
        </Text>
        <View style={[s.card, { borderColor: colors.border, backgroundColor: colors.background }]}>
          {first.map((e, i) => (
            <View key={e.key} style={[s.prevRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }]}>
              <Text style={[s.prevTitle, { color: colors.textPrimary }]} numberOfLines={2}>{e.title}</Text>
              <Text style={[s.prevWhen, { color: colors.textSecondary }]}>{`${fmtDayShort(e.start)}${e.allDay ? ', all day' : `, ${fmtTime(e.start)}`}`}</Text>
            </View>
          ))}
        </View>
        {preview.partial > 0 && <Text style={[s.note, { color: colors.textSecondary }]}>Some repeating events use a rule we cannot read, so they show once.</Text>}
        {preview.truncated && <Text style={[s.note, { color: colors.textSecondary }]}>That is a big calendar. We bring in the first 1000 events.</Text>}
        <Text style={[s.label, { color: colors.textSecondary }]}>Put them in</Text>
        <View style={s.wrap}>
          {BUILTIN_CALENDARS.map(c => <Chip key={c.key} label={c.name} dot={calendarColor(c.key, customCalendars, isDark)} on={target === c.key} onPress={() => setTarget(c.key)} />)}
          {customCalendars.map(c => <Chip key={c.id} label={c.name} dot={calendarColor(c.id, customCalendars, isDark)} on={target === c.id} onPress={() => setTarget(c.id)} />)}
        </View>
        <Text style={[s.note, { color: colors.textSecondary, marginTop: 14 }]}>We copy these events once. If the calendar changes, bring it in again and we update them.</Text>
      </Sheet>
    )
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Bring in a calendar">
      {/* paste a link */}
      <View style={[s.card, s.cardPad, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <View style={s.cardHead}>
          <View style={[s.tile, { backgroundColor: colors.tabFill }]}><Link2 size={20} color={colors.textPrimary} strokeWidth={1.8} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Paste a calendar link</Text>
            <Text style={[s.cardSub, { color: colors.textSecondary }]}>A web address that ends in .ics</Text>
          </View>
        </View>
        <TextInput
          value={url}
          onChangeText={t => { setUrl(t); setError('') }}
          placeholder="https://"
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          style={[s.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }]}
          accessibilityLabel="Calendar link"
        />
        {!!error && <Text style={[s.error, { color: colors.destructive }]} accessibilityLiveRegion="polite">{error}</Text>}
        <PrimaryButton label={busy ? 'Reading' : 'Import'} onPress={readLink} disabled={busy || !url.trim()} />
        {busy && <ActivityIndicator color={colors.textPrimary} />}
      </View>

      {/* this phone's calendar */}
      <View style={[s.card, s.cardPad, { borderColor: colors.border, backgroundColor: colors.background, marginTop: 14 }]}>
        <View style={s.cardHead}>
          <View style={[s.tile, { backgroundColor: colors.tabFill }]}><Smartphone size={20} color={colors.textPrimary} strokeWidth={1.8} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: colors.textPrimary }]}>Read this phone's calendar</Text>
            <Text style={[s.cardSub, { color: colors.textSecondary }]}>Choose which calendars to bring in</Text>
          </View>
        </View>

        {webOnly ? (
          <Text style={[s.note, { color: colors.textSecondary }]}>This works in the UBP app on your phone.</Text>
        ) : phoneStep === 'intro' ? (
          <>
            <View style={[s.explain, { backgroundColor: colors.tabFill }]}>
              <Lock size={18} color={colors.textPrimary} strokeWidth={1.8} style={{ marginTop: 2 }} />
              <Text style={[s.explainText, { color: colors.textPrimary }]}>
                UBP asks to read your calendar. It only reads events to show them here, never changes them, and you pick the calendars. They stay on your phone. You can turn it off any time.
              </Text>
            </View>
            {!!phoneMsg && <Text style={[s.error, { color: colors.destructive }]}>{phoneMsg}</Text>}
            <SecondaryButton label={busy ? 'Asking' : deviceIds.length ? 'Change calendars' : 'Allow and choose calendars'} onPress={allowPhone} disabled={busy} />
            {deviceIds.length > 0 && <SecondaryButton label="Stop reading this phone" onPress={() => onSaveDevice([])} />}
          </>
        ) : (
          <>
            {!!phoneMsg && <Text style={[s.note, { color: colors.textSecondary }]}>{phoneMsg}</Text>}
            <View style={s.wrap}>
              {phoneCals.map(c => (
                <Chip key={c.id} label={c.source ? `${c.title} (${c.source})` : c.title} dot={c.color || undefined} on={picked.includes(c.id)} onPress={() => toggle(c.id)} />
              ))}
            </View>
            <PrimaryButton label={busy ? 'Saving' : picked.length ? 'Show these calendars' : 'Save choice'} Icon={Check} onPress={savePhone} disabled={busy} />
          </>
        )}
      </View>
      <View style={{ height: 16 }} />
    </Sheet>
  )
}

const s = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth },
  cardPad: { padding: 14, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tile: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16 },
  cardSub: { fontFamily: fonts.sans, fontSize: 13.5, marginTop: 2 },
  input: { fontFamily: fonts.sans, fontSize: 16, minHeight: 50, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14 },
  explain: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16 },
  explainText: { flex: 1, fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  error: { fontFamily: fonts.sansMedium, fontSize: 14, lineHeight: 20 },
  note: { fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 19 },
  sub: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 21, marginBottom: 12 },
  label: { fontFamily: fonts.sansSemiBold, fontSize: 13, marginTop: 16, marginBottom: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prevRow: { paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  prevTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  prevWhen: { fontFamily: fonts.sans, fontSize: 13 },
})
