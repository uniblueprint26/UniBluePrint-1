import { useState, useCallback, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { DoorOpen, Plus, Flag, UserX, Clock } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import Sheet, { FieldLabel } from '../components/campusConnect/Sheet'
import CampusRequired from '../components/campusConnect/CampusRequired'
import { Card, Chip, Pill, EmptyNote, PrimaryButton, useTone } from '../components/campusConnect/CampusKit'
import { useReport } from '../components/safety/ReportProvider'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBlockedIds } from '../lib/reporting'
import { checkText, GUIDELINES_MESSAGE } from '../lib/moderation'
import { useCampus, nextSevenDays } from '../lib/campus'
import { fonts } from '../constants/theme'

// Study room sharer. A member who booked a study room posts the slot for their
// own campus. Others on that campus can claim it and the poster confirms the
// hand over or declines. Both sides are notified by the database. UBP does not
// book rooms or move money: the hand over happens in the campus booking system.

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
const hourLabel = h => `${h > 12 ? h - 12 : h}${h >= 12 ? 'pm' : 'am'}`
const slotDay = iso => new Date(iso).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'short' })
const slotTime = (a, b) => `${new Date(a).toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit', hour12: true })} to ${new Date(b).toLocaleTimeString('en-IE', { hour: 'numeric', minute: '2-digit', hour12: true })}`
const STATE = { open: 'Open', claimed: 'Claimed', handed_over: 'Handed over', withdrawn: 'Taken down' }

function ask(title, message, okLabel) {
  return new Promise(resolve => {
    if (Platform.OS === 'web') { resolve(typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : true); return }
    Alert.alert(title, message, [{ text: 'Cancel', style: 'cancel', onPress: () => resolve(false) }, { text: okLabel, onPress: () => resolve(true) }])
  })
}

export default function StudyRoomsScreen({ navigation }) {
  const { colors, accent, tint } = useTone('campus')
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const campus = useCampus()
  const { openReport, openBlock } = useReport()
  const blocked = useBlockedIds(user?.id)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [filter, setFilter] = useState('week')
  const [shareOpen, setShareOpen] = useState(false)
  const [room, setRoom] = useState('')
  const [note, setNote] = useState('')
  const [day, setDay] = useState(0)
  const [startH, setStartH] = useState(14)
  const [endH, setEndH] = useState(16)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)
  const days = useMemo(nextSevenDays, [])

  const load = useCallback(async () => {
    if (!campus.hasCampus) { setLoading(false); return }
    setFailed(false)
    const { data, error } = await supabase.from('study_room_shares').select('*').order('starts_at', { ascending: true })
    if (error) setFailed(true)
    else setRows(data || [])
    setLoading(false)
  }, [campus.hasCampus])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const now = Date.now()
  const mine = rows.filter(r => r.user_id === user?.id)
  const myClaims = rows.filter(r => r.claimed_by === user?.id && r.user_id !== user?.id)
  const board = rows
    .filter(r => r.status === 'open' && r.user_id !== user?.id && new Date(r.ends_at).getTime() > now && !blocked.has(r.user_id))
    .filter(r => {
      if (filter === 'all') return true
      const d = new Date(r.starts_at)
      const edge = new Date(); edge.setHours(23, 59, 59, 999)
      if (filter === 'today') return d <= edge
      return d.getTime() < now + 7 * 86400000
    })

  async function rpc(name, args, okMsg) {
    const { error } = await supabase.rpc(name, args)
    if (error) {
      const m = String(error.message)
      Alert.alert('Not done', m.includes('not_open') ? 'That slot is no longer open.' : 'Something went wrong. Please try again.')
    } else if (okMsg) {
      Alert.alert('Done', okMsg)
    }
    load()
  }

  async function claim(r) {
    if (await ask('Claim this slot?', `${r.room}, ${slotDay(r.starts_at)}, ${slotTime(r.starts_at, r.ends_at)}. The person who shared it confirms the hand over. UBP does not book rooms or take payments.`, 'Claim')) {
      rpc('claim_study_room_share', { p_id: r.id })
    }
  }
  async function withdraw(r) {
    if (await ask('I no longer need this', r.claimed_by ? 'This takes the slot down and tells the person who claimed it.' : 'This takes the slot down.', 'Take down')) {
      rpc('withdraw_study_room_share', { p_id: r.id })
    }
  }

  async function share() {
    const t = `${room} ${note}`
    if (room.trim().length < 2 || busy) return
    if (!checkText(t).ok) { setMsg(GUIDELINES_MESSAGE); return }
    if (endH <= startH) { setMsg('The end time must be after the start time.'); return }
    const [y, m, d] = days[day].key.split('-').map(Number)
    const starts = new Date(y, m - 1, d, startH, 0, 0)
    const ends = new Date(y, m - 1, d, endH, 0, 0)
    if (ends.getTime() <= Date.now()) { setMsg('That time has already passed.'); return }
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('study_room_shares').insert({
      room: room.trim(), note: note.trim() || null, starts_at: starts.toISOString(), ends_at: ends.toISOString(),
    })
    setBusy(false)
    if (error) {
      const em = String(error.message)
      setMsg(em.includes('feed_text_guard') ? GUIDELINES_MESSAGE : em.includes('campus_required') ? 'Choose your campus, training provider or industry first.' : 'Could not share that. Please try again.')
      return
    }
    setShareOpen(false); setRoom(''); setNote('')
    load()
  }

  const SlotCard = ({ r, children, who }) => (
    <Card style={{ marginTop: 12 }}>
      <View style={s.row}>
        <View style={[s.icon, { backgroundColor: tint }]}><DoorOpen size={20} color={accent} strokeWidth={1.8} /></View>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.textPrimary }]}>{r.room}</Text>
          <Text style={[s.meta, { color: colors.textSecondary }]}>{slotDay(r.starts_at)}</Text>
        </View>
        {who && <Pill label={STATE[r.status]} tone={r.status === 'handed_over' ? 'good' : 'accent'} />}
      </View>
      <View style={[s.row, { marginTop: 10, gap: 6 }]}>
        <Clock size={14} color={colors.textSecondary} strokeWidth={1.8} />
        <Text style={[s.meta, { color: colors.textPrimary }]}>{slotTime(r.starts_at, r.ends_at)}</Text>
      </View>
      {!!r.note && <Text style={[s.meta, { color: colors.textSecondary, marginTop: 6 }]}>{r.note}</Text>}
      {children}
    </Card>
  )

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <PageTitle title="Study rooms" subtitle="Share a booked slot you no longer need." />
        <View style={s.body}>
          {!campus.hasCampus ? <CampusRequired what="Study rooms" onChosen={load} />
            : loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.textPrimary} />
            : failed ? (
              <EmptyNote title="Could not load slots" body="Check your connection and try again.">
                <PrimaryButton label="Try again" onPress={load} />
              </EmptyNote>
            ) : (
              <>
                <View style={s.chips}>
                  {[['today', 'Today'], ['week', 'This week'], ['all', 'All']].map(([k, l]) => <Chip key={k} label={l} active={filter === k} onPress={() => setFilter(k)} />)}
                </View>

                {mine.filter(r => r.status !== 'withdrawn' && new Date(r.ends_at).getTime() > now - 86400000).length > 0 && (
                  <Text style={[s.section, { color: colors.textPrimary }]}>My slots</Text>
                )}
                {mine.filter(r => r.status !== 'withdrawn' && new Date(r.ends_at).getTime() > now - 86400000).map(r => (
                  <SlotCard key={r.id} r={r} who>
                    {r.status === 'claimed' && (
                      <View style={s.actions}>
                        <PrimaryButton label="Confirm hand over" onPress={() => rpc('respond_study_room_share', { p_id: r.id, p_accept: true })} style={s.act} />
                        <TouchableOpacity onPress={() => rpc('respond_study_room_share', { p_id: r.id, p_accept: false })} style={s.ghost} accessibilityRole="button">
                          <Text style={[s.ghostText, { color: colors.textPrimary }]}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {(r.status === 'open' || r.status === 'claimed') && (
                      <TouchableOpacity onPress={() => withdraw(r)} style={{ marginTop: 12 }} accessibilityRole="button">
                        <Text style={[s.link, { color: accent }]}>I no longer need this</Text>
                      </TouchableOpacity>
                    )}
                  </SlotCard>
                ))}

                {myClaims.length > 0 && <Text style={[s.section, { color: colors.textPrimary }]}>Slots I claimed</Text>}
                {myClaims.map(r => (
                  <SlotCard key={r.id} r={r} who>
                    <Text style={[s.meta, { color: colors.textSecondary, marginTop: 8 }]}>
                      {r.status === 'handed_over' ? 'The hand over is confirmed. Finish it in the campus booking system.' : 'Waiting for the person who shared it to confirm.'}
                    </Text>
                  </SlotCard>
                ))}

                <Text style={[s.section, { color: colors.textPrimary }]}>On the board</Text>
                {board.length === 0 ? (
                  <EmptyNote Icon={DoorOpen} title="No slots shared yet" body="When someone on your campus shares a booked room, it shows here. Booked a room you will not use? Share it.">
                    <PrimaryButton label="Share a slot" Icon={Plus} onPress={() => { setMsg(null); setShareOpen(true) }} />
                  </EmptyNote>
                ) : board.map(r => (
                  <SlotCard key={r.id} r={r}>
                    <View style={s.actions}>
                      <PrimaryButton label="Claim" onPress={() => claim(r)} style={s.act} />
                      <TouchableOpacity onPress={() => openReport({ contentType: 'study_room_share', contentId: r.id, reportedUserId: r.user_id, userName: 'this member', noun: 'slot' })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Report this slot">
                        <Flag size={18} color={colors.textSecondary} strokeWidth={1.8} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openBlock({ contentType: 'study_room_share', contentId: r.id, reportedUserId: r.user_id, userName: 'this member' })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Block the member who shared this">
                        <UserX size={18} color={colors.textSecondary} strokeWidth={1.8} />
                      </TouchableOpacity>
                    </View>
                  </SlotCard>
                ))}
                <Text style={[s.help, { color: colors.textSecondary }]}>No payments. UBP does not book rooms. The hand over happens in the campus booking system.</Text>
              </>
            )}
        </View>
      </ScrollView>

      {campus.hasCampus && !failed && !loading && board.length > 0 && (
        <View style={[s.fabWrap, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
          <PrimaryButton label="Share a slot" Icon={Plus} onPress={() => { setMsg(null); setShareOpen(true) }} style={{ marginTop: 0 }} />
        </View>
      )}

      <Sheet visible={shareOpen} onClose={() => setShareOpen(false)} title="Share a slot" subtitle={campus.short}>
        <FieldLabel>Room</FieldLabel>
        <TextInput value={room} onChangeText={setRoom} maxLength={60} placeholder="For example, Library room 3" placeholderTextColor={colors.textTertiary}
          style={[s.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} accessibilityLabel="Room" />
        <FieldLabel>Day</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
          {days.map((d, i) => <Chip key={d.key} label={`${d.label} ${d.day}`} active={day === i} onPress={() => setDay(i)} />)}
        </ScrollView>
        <FieldLabel>Starts</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
          {HOURS.map(h => <Chip key={h} label={hourLabel(h)} active={startH === h} onPress={() => { setStartH(h); if (endH <= h) setEndH(h + 1) }} />)}
        </ScrollView>
        <FieldLabel>Ends</FieldLabel>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
          {HOURS.concat([23]).filter(h => h > startH).map(h => <Chip key={h} label={hourLabel(h)} active={endH === h} onPress={() => setEndH(h)} />)}
        </ScrollView>
        <FieldLabel>Note (optional)</FieldLabel>
        <TextInput value={note} onChangeText={setNote} maxLength={140} placeholder="Anything useful, for example fits six" placeholderTextColor={colors.textTertiary}
          style={[s.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} accessibilityLabel="Note" />
        <Text style={[s.help, { color: colors.textSecondary }]}>Only people on your campus see this. There are no payments. The text is checked first.</Text>
        {!!msg && <Text style={[s.err, { color: colors.destructive }]}>{msg}</Text>}
        <PrimaryButton label={busy ? 'Sharing' : 'Share slot'} onPress={share} disabled={busy || room.trim().length < 2} />
      </Sheet>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  chips: { flexDirection: 'row', gap: 8 },
  chipsRow: { gap: 8, paddingBottom: 2 },
  section: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, marginTop: 26 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
  meta: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  act: { marginTop: 0, flex: 1 },
  ghost: { paddingHorizontal: 16, paddingVertical: 13 },
  ghostText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  iconBtn: { padding: 10 },
  link: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  help: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 14 },
  err: { fontFamily: fonts.sans, fontSize: 13, marginTop: 10 },
  fabWrap: { position: 'absolute', left: 16, right: 16, bottom: 0, alignItems: 'flex-end' },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 52, fontFamily: fonts.sans, fontSize: 16 },
})
