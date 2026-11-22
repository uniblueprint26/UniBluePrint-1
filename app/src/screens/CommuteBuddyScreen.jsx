import { useState, useCallback } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Bus, Train, TramFront, Footprints, Bike, Plus, Flag, UserX, MessageCircle, Trash2 } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import Sheet, { FieldLabel } from '../components/campusConnect/Sheet'
import CampusRequired from '../components/campusConnect/CampusRequired'
import { Card, Chip, Pill, EmptyNote, PrimaryButton, useTone } from '../components/campusConnect/CampusKit'
import { useReport } from '../components/safety/ReportProvider'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBlockedIds } from '../lib/reporting'
import { checkText, GUIDELINES_MESSAGE } from '../lib/moderation'
import { useCampus, timeAgo } from '../lib/campus'
import { fonts } from '../constants/theme'

// Commute buddy: find someone on your campus who travels your way. Only a
// general area and a transit line are shared, never an address. The first
// message happens in chat once both sides want to talk.

const MODES = [
  { key: 'bus', label: 'Bus', Icon: Bus },
  { key: 'train', label: 'Train', Icon: Train },
  { key: 'luas_dart', label: 'Luas or DART', Icon: TramFront },
  { key: 'walk', label: 'Walk', Icon: Footprints },
  { key: 'cycle', label: 'Cycle', Icon: Bike },
]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const modeOf = k => MODES.find(m => m.key === k) || MODES[0]

export default function CommuteBuddyScreen({ navigation }) {
  const { colors, accent, tint } = useTone('campus')
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const campus = useCampus()
  const { openReport, openBlock } = useReport()
  const blocked = useBlockedIds(user?.id)

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('bus')
  const [area, setArea] = useState('')
  const [line, setLine] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [days, setDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    if (!campus.hasCampus) { setLoading(false); return }
    setFailed(false)
    const { data, error } = await supabase.from('commute_buddy_posts').select('*').eq('active', true).order('created_at', { ascending: false }).limit(100)
    if (error) setFailed(true)
    else setRows(data || [])
    setLoading(false)
  }, [campus.hasCampus])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const shown = rows.filter(r => !blocked.has(r.user_id) && (filter === 'all' || r.mode === filter))

  async function save() {
    if (area.trim().length < 2 || busy) return
    if (!checkText(`${area} ${line} ${time} ${note}`).ok) { setMsg(GUIDELINES_MESSAGE); return }
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('commute_buddy_posts').insert({
      mode, from_area: area.trim(), line: line.trim() || null, depart_time: time.trim() || null, note: note.trim() || null, days,
    })
    setBusy(false)
    if (error) {
      const m = String(error.message)
      setMsg(m.includes('feed_text_guard') ? GUIDELINES_MESSAGE : m.includes('campus_required') ? 'Choose your campus, training provider or industry first.' : 'Could not post that. Please try again.')
      return
    }
    setOpen(false); setArea(''); setLine(''); setTime(''); setNote('')
    load()
  }

  async function remove(r) {
    const { error } = await supabase.from('commute_buddy_posts').delete().eq('id', r.id)
    if (error) Alert.alert('Not done', 'Please try again.')
    else setRows(p => p.filter(x => x.id !== r.id))
  }

  function chat(r) {
    navigation.navigate('ChatRoom', {
      contextType: 'board', contextId: `commute-${r.id}`, roomName: `Commute: ${r.from_area}`,
      subtitle: modeOf(r.mode).label, posterId: r.user_id, posterName: null,
    })
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        <PageTitle title="Commute buddy" subtitle="Travel to campus with someone going your way." />
        <View style={s.body}>
          {!campus.hasCampus ? <CampusRequired what="Commute buddy" onChosen={load} />
            : loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.textPrimary} />
            : failed ? (
              <EmptyNote title="Could not load buddies" body="Check your connection and try again.">
                <PrimaryButton label="Try again" onPress={load} />
              </EmptyNote>
            ) : (
              <>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                  <Chip label="All" active={filter === 'all'} onPress={() => setFilter('all')} />
                  {MODES.map(m => <Chip key={m.key} label={m.label} active={filter === m.key} onPress={() => setFilter(m.key)} />)}
                </ScrollView>
                <Text style={[s.help, { color: colors.textSecondary }]}>Only a general area and a transit line are shown. No addresses, no live location.</Text>
                {shown.length === 0 ? (
                  <View style={{ marginTop: 16 }}>
                    <EmptyNote Icon={Footprints} title="No buddies yet" body="Post your usual commute and others on your campus can say hello.">
                      <PrimaryButton label="Post my commute" Icon={Plus} onPress={() => { setMsg(null); setOpen(true) }} />
                    </EmptyNote>
                  </View>
                ) : shown.map(r => {
                  const M = modeOf(r.mode)
                  const own = r.user_id === user?.id
                  return (
                    <Card key={r.id} style={{ marginTop: 12 }}>
                      <View style={s.row}>
                        <View style={[s.icon, { backgroundColor: tint }]}><M.Icon size={20} color={accent} strokeWidth={1.8} /></View>
                        <View style={{ flex: 1 }}>
                          <Text style={[s.title, { color: colors.textPrimary }]}>{r.from_area}</Text>
                          <Text style={[s.meta, { color: colors.textSecondary }]}>{M.label}{r.line ? `, ${r.line}` : ''}</Text>
                        </View>
                        <Text style={[s.meta, { color: colors.textSecondary }]}>{timeAgo(r.created_at)}</Text>
                      </View>
                      <View style={s.pills}>
                        {!!r.days?.length && <Pill label={r.days.join(', ')} />}
                        {!!r.depart_time && <Pill label={r.depart_time} tone="accent" />}
                      </View>
                      {!!r.note && <Text style={[s.meta, { color: colors.textPrimary, marginTop: 8 }]}>{r.note}</Text>}
                      <View style={s.actions}>
                        {own ? (
                          <TouchableOpacity onPress={() => remove(r)} style={s.safetyBtn} accessibilityRole="button">
                            <Trash2 size={16} color={colors.textSecondary} strokeWidth={1.8} />
                            <Text style={[s.meta, { color: colors.textSecondary }]}>Remove</Text>
                          </TouchableOpacity>
                        ) : (
                          <>
                            <PrimaryButton label="Message" Icon={MessageCircle} onPress={() => chat(r)} style={s.act} />
                            <TouchableOpacity onPress={() => openReport({ contentType: 'commute_buddy_post', contentId: r.id, reportedUserId: r.user_id, userName: 'this member', noun: 'post' })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Report this post">
                              <Flag size={18} color={colors.textSecondary} strokeWidth={1.8} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => openBlock({ contentType: 'commute_buddy_post', contentId: r.id, reportedUserId: r.user_id, userName: 'this member' })} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Block this member">
                              <UserX size={18} color={colors.textSecondary} strokeWidth={1.8} />
                            </TouchableOpacity>
                          </>
                        )}
                      </View>
                    </Card>
                  )
                })}
              </>
            )}
        </View>
      </ScrollView>

      {campus.hasCampus && !failed && !loading && shown.length > 0 && (
        <View style={[s.fabWrap, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
          <PrimaryButton label="Post my commute" Icon={Plus} onPress={() => { setMsg(null); setOpen(true) }} style={{ marginTop: 0 }} />
        </View>
      )}

      <Sheet visible={open} onClose={() => setOpen(false)} title="Post my commute" subtitle={campus.short}>
        <FieldLabel>How do you travel?</FieldLabel>
        <View style={s.wrap}>{MODES.map(m => <Chip key={m.key} label={m.label} active={mode === m.key} onPress={() => setMode(m.key)} />)}</View>
        <FieldLabel>General area you start from</FieldLabel>
        <TextInput value={area} onChangeText={setArea} maxLength={60} placeholder="For example, Swords or Salthill" placeholderTextColor={colors.textTertiary}
          style={[s.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} accessibilityLabel="Area" />
        <FieldLabel>Line or route (optional)</FieldLabel>
        <TextInput value={line} onChangeText={setLine} maxLength={60} placeholder="For example, route 41 or the Green line" placeholderTextColor={colors.textTertiary}
          style={[s.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} accessibilityLabel="Line" />
        <FieldLabel>Days</FieldLabel>
        <View style={s.wrap}>{DAYS.map(d => <Chip key={d} label={d} active={days.includes(d)} onPress={() => setDays(p => p.includes(d) ? p.filter(x => x !== d) : [...p, d])} />)}</View>
        <FieldLabel>Usual time (optional)</FieldLabel>
        <TextInput value={time} onChangeText={setTime} maxLength={20} placeholder="For example, 8:15am" placeholderTextColor={colors.textTertiary}
          style={[s.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} accessibilityLabel="Time" />
        <FieldLabel>Note (optional)</FieldLabel>
        <TextInput value={note} onChangeText={setNote} maxLength={140} placeholder="Anything useful" placeholderTextColor={colors.textTertiary}
          style={[s.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]} accessibilityLabel="Note" />
        {!!msg && <Text style={[s.err, { color: colors.destructive }]}>{msg}</Text>}
        <PrimaryButton label={busy ? 'Posting' : 'Post'} onPress={save} disabled={busy || area.trim().length < 2} />
      </Sheet>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  chips: { gap: 8, paddingBottom: 4 },
  help: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
  meta: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  act: { marginTop: 0, flex: 1 },
  iconBtn: { padding: 10 },
  safetyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  err: { fontFamily: fonts.sans, fontSize: 13, marginTop: 10 },
  fabWrap: { position: 'absolute', left: 16, right: 16, bottom: 0, alignItems: 'flex-end' },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 52, fontFamily: fonts.sans, fontSize: 16 },
})
