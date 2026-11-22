import { useState, useEffect, useCallback, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { BookOpen, Utensils, Dumbbell, MoreHorizontal, MapPin, Plus, Flag, UserX } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import Sheet, { FieldLabel } from '../components/campusConnect/Sheet'
import CampusRequired from '../components/campusConnect/CampusRequired'
import { Card, Chip, Pill, Stamp, EmptyNote, PrimaryButton, STATUS, statusColor, useTone } from '../components/campusConnect/CampusKit'
import { useReport } from '../components/safety/ReportProvider'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBlockedIds } from '../lib/reporting'
import { checkText, GUIDELINES_MESSAGE } from '../lib/moderation'
import { useCampus, timeAgo } from '../lib/campus'
import { fonts } from '../constants/theme'

// Busy spots: a heatmap of the campus built only from member reports. A spot
// shows Quiet, Busy or Packed from the latest report in the last 2 hours and
// says how many reports fed it. No Wi Fi counting, no live location. UBP and
// members add spots for their own campus.

const KINDS = [
  { key: 'study', label: 'Study area', Icon: BookOpen },
  { key: 'food', label: 'Canteen', Icon: Utensils },
  { key: 'gym', label: 'Gym', Icon: Dumbbell },
  { key: 'other', label: 'Other', Icon: MoreHorizontal },
]
const FILTERS = [{ key: 'all', label: 'All' }, { key: 'study', label: 'Study' }, { key: 'food', label: 'Food' }, { key: 'gym', label: 'Gym' }, { key: 'other', label: 'Other' }]
const kindIcon = k => (KINDS.find(x => x.key === k) || KINDS[3]).Icon
const kindWord = k => ({ study: 'Study', food: 'Food', gym: 'Gym', other: 'Other' }[k] || 'Other')
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

function Meter({ level, isDark }) {
  const steps = STATUS[level]?.steps || 0
  const c = statusColor(level, isDark)
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3].map(i => (
        <View key={i} style={{ width: 16, height: 5, borderRadius: 3, backgroundColor: i <= steps ? c : (isDark ? 'rgba(251,246,232,0.18)' : 'rgba(30,58,95,0.12)') }} />
      ))}
    </View>
  )
}

// One cell per hour from 8am to 7pm, coloured by the busiest report that hour.
function HourStrip({ reports, isDark }) {
  const byHour = {}
  reports.forEach(r => {
    const h = new Date(r.created_at).getHours()
    const rank = { quiet: 1, busy: 2, packed: 3 }[r.level] || 0
    if (rank > (byHour[h] || 0)) byHour[h] = rank
  })
  const lv = ['', 'quiet', 'busy', 'packed']
  return (
    <View style={{ flexDirection: 'row', gap: 3, marginTop: 12 }} accessibilityLabel="Reports in the last day, hour by hour">
      {HOURS.map(h => {
        const r = byHour[h]
        return (
          <View key={h} style={{ flex: 1, height: 14, borderRadius: 4, backgroundColor: r ? statusColor(lv[r], isDark) : (isDark ? 'rgba(251,246,232,0.1)' : 'rgba(30,58,95,0.07)'), opacity: r ? 0.9 : 1 }} />
        )
      })}
    </View>
  )
}

export default function BusySpotsScreen({ navigation }) {
  const { colors, isDark, accent, tint } = useTone('campus')
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const campus = useCampus()
  const { openReport, openBlock } = useReport()
  const blocked = useBlockedIds(user?.id)

  const [spots, setSpots] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [filter, setFilter] = useState('all')
  const [open, setOpen] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [kind, setKind] = useState('study')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = useCallback(async () => {
    if (!campus.hasCampus) { setLoading(false); return }
    setFailed(false)
    try {
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
      const [a, b] = await Promise.all([
        supabase.from('busy_spot_status').select('*').order('name'),
        supabase.from('busy_spot_reports').select('spot_id, level, created_at').gte('created_at', since).order('created_at', { ascending: false }),
      ])
      if (a.error) throw a.error
      setSpots(a.data || [])
      setReports(b.data || [])
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [campus.hasCampus])
  useFocusEffect(useCallback(() => { load() }, [load]))

  const shown = useMemo(() => {
    const rank = { packed: 0, busy: 1, quiet: 2 }
    return spots
      .filter(sp => !(sp.created_by && blocked.has(sp.created_by)))
      .filter(sp => filter === 'all' || sp.kind === filter)
      .sort((a, b) => (rank[a.latest_level] ?? 3) - (rank[b.latest_level] ?? 3) || a.name.localeCompare(b.name))
  }, [spots, blocked, filter])

  const spotReports = id => reports.filter(r => r.spot_id === id)

  async function sendReport(spot, level) {
    if (busy) return
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('busy_spot_reports').insert({ spot_id: spot.id, level })
    setBusy(false)
    if (error) {
      setMsg(String(error.message).includes('rate_limited') ? 'You just reported this spot. Try again in a few minutes.' : 'Could not send that. Please try again.')
      return
    }
    setOpen(null)
    load()
  }

  async function addSpot() {
    const n = name.trim()
    if (n.length < 2 || busy) return
    if (!checkText(n).ok) { setMsg(GUIDELINES_MESSAGE); return }
    setBusy(true); setMsg(null)
    const { error } = await supabase.from('busy_spots').insert({ name: n, kind })
    setBusy(false)
    if (error) {
      const m = String(error.message)
      setMsg(m.includes('feed_text_guard') ? GUIDELINES_MESSAGE : m.includes('campus_required') ? 'Choose your campus, training provider or industry first.' : m.includes('duplicate') ? 'That spot is already on the list.' : 'Could not add that. Please try again.')
      return
    }
    setAddOpen(false); setName(''); setKind('study')
    load()
  }

  const openSpot = open ? spots.find(x => x.id === open) : null

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.textPrimary} />}
      >
        <PageTitle title="Busy spots" subtitle={campus.short ? campus.short : 'Your campus'} />
        <View style={s.body}>
          {!campus.hasCampus ? (
            <CampusRequired what="Busy spots" onChosen={load} />
          ) : loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={colors.textPrimary} />
          ) : failed ? (
            <EmptyNote title="Could not load spots" body="Check your connection and pull down to try again.">
              <PrimaryButton label="Try again" onPress={load} />
            </EmptyNote>
          ) : spots.length === 0 ? (
            <EmptyNote Icon={MapPin} title={`No spots on ${campus.short || 'your campus'} yet`} body="Spots are added by members, and the UBP team adds ones they know. A spot shows Quiet, Busy or Packed only when members report it.">
              <PrimaryButton label="Add a spot" Icon={Plus} onPress={() => setAddOpen(true)} />
            </EmptyNote>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
                {FILTERS.map(f => <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />)}
              </ScrollView>
              <Text style={[s.legend, { color: colors.textSecondary }]}>Strip: reports in the last day, 8am to 7pm.</Text>
              {shown.length === 0 && <Text style={[s.none, { color: colors.textSecondary }]}>No spots in this group yet.</Text>}
              {shown.map(sp => {
                const Icon = kindIcon(sp.kind)
                const lvl = sp.latest_level
                return (
                  <Card key={sp.id} style={{ marginTop: 12 }} onPress={() => { setMsg(null); setOpen(sp.id) }} accessibilityLabel={`${sp.name}, ${lvl ? STATUS[lvl].label : 'no recent reports'}`}>
                    <View style={s.row}>
                      <View style={[s.icon, { backgroundColor: tint }]}><Icon size={20} color={accent} strokeWidth={1.8} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.name, { color: colors.textPrimary }]}>{sp.name}</Text>
                        <Text style={[s.meta, { color: colors.textSecondary }]}>{kindWord(sp.kind)}{sp.is_ubp ? '' : '  ·  Added by a member'}</Text>
                      </View>
                      {lvl ? (
                        <View style={[s.status, { borderColor: statusColor(lvl, isDark) }]}>
                          <Text style={[s.statusText, { color: statusColor(lvl, isDark) }]}>{STATUS[lvl].label}</Text>
                        </View>
                      ) : (
                        <Text style={[s.meta, { color: colors.textSecondary }]}>No reports</Text>
                      )}
                    </View>
                    {sp.is_ubp && <Stamp label="From UBP" style={{ marginTop: 10 }} />}
                    <HourStrip reports={spotReports(sp.id)} isDark={isDark} />
                    <View style={[s.foot, { borderTopColor: colors.divider }]}>
                      <Meter level={lvl} isDark={isDark} />
                      <Text style={[s.meta, { color: colors.textSecondary, flex: 1, marginLeft: 10 }]} numberOfLines={1}>
                        {lvl ? `${sp.report_count} report${sp.report_count === 1 ? '' : 's'}, latest ${timeAgo(sp.latest_at)}` : 'Be the first to report'}
                      </Text>
                      <Text style={[s.report, { color: accent }]}>Report</Text>
                    </View>
                  </Card>
                )
              })}
            </>
          )}
        </View>
      </ScrollView>

      {campus.hasCampus && !failed && spots.length > 0 && (
        <View style={[s.fabWrap, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
          <PrimaryButton label="Add a spot" Icon={Plus} onPress={() => { setMsg(null); setAddOpen(true) }} style={s.fab} />
        </View>
      )}

      <Sheet visible={!!openSpot} onClose={() => setOpen(null)} title={openSpot?.name || ''} subtitle={campus.short}>
        {openSpot && (
          <View>
            <Card style={{ marginBottom: 6 }}>
              <Text style={[s.eyebrow, { color: colors.textSecondary }]}>RIGHT NOW</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <Text style={[s.big, { color: openSpot.latest_level ? statusColor(openSpot.latest_level, isDark) : colors.textPrimary }]}>
                  {openSpot.latest_level ? STATUS[openSpot.latest_level].label : 'No reports'}
                </Text>
                <Meter level={openSpot.latest_level} isDark={isDark} />
              </View>
              <Text style={[s.meta, { color: colors.textSecondary, marginTop: 6 }]}>
                {openSpot.latest_level
                  ? `Latest report ${timeAgo(openSpot.latest_at)}. Based on ${openSpot.report_count} report${openSpot.report_count === 1 ? '' : 's'} in the last 2 hours.`
                  : 'Nobody has reported this spot in the last 2 hours.'}
              </Text>
            </Card>
            <FieldLabel>How is it right now?</FieldLabel>
            <View style={s.levels}>
              {['quiet', 'busy', 'packed'].map(l => (
                <TouchableOpacity
                  key={l}
                  onPress={() => sendReport(openSpot, l)}
                  disabled={busy}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Report ${STATUS[l].label}`}
                  style={[s.levelBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <Meter level={l} isDark={isDark} />
                  <Text style={[s.levelText, { color: colors.textPrimary }]}>{STATUS[l].label}</Text>
                  <Text style={[s.levelSub, { color: colors.textSecondary }]}>{l === 'quiet' ? 'Seats free' : l === 'busy' ? 'Some seats' : 'No seats'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[s.help, { color: colors.textSecondary }]}>Only report a spot you are at. Reports are not shown with your name.</Text>
            {!!msg && <Text style={[s.err, { color: colors.destructive }]}>{msg}</Text>}
            {!openSpot.is_ubp && !!openSpot.created_by && openSpot.created_by !== user?.id && (
              <View style={s.safety}>
                <TouchableOpacity style={s.safetyBtn} onPress={() => { setOpen(null); openReport({ contentType: 'busy_spot', contentId: openSpot.id, reportedUserId: openSpot.created_by, userName: 'the member who added it', noun: 'spot' }) }} accessibilityRole="button">
                  <Flag size={15} color={colors.textSecondary} strokeWidth={1.8} />
                  <Text style={[s.safetyText, { color: colors.textSecondary }]}>Report this spot</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.safetyBtn} onPress={() => { setOpen(null); openBlock({ contentType: 'busy_spot', contentId: openSpot.id, reportedUserId: openSpot.created_by, userName: 'the member who added it' }) }} accessibilityRole="button">
                  <UserX size={15} color={colors.textSecondary} strokeWidth={1.8} />
                  <Text style={[s.safetyText, { color: colors.textSecondary }]}>Block who added it</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </Sheet>

      <Sheet visible={addOpen} onClose={() => setAddOpen(false)} title="Add a spot">
        <FieldLabel>Name</FieldLabel>
        <TextInput
          value={name}
          onChangeText={setName}
          maxLength={60}
          placeholder="For example, Library level 2"
          placeholderTextColor={colors.textTertiary}
          style={[s.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
          accessibilityLabel="Spot name"
        />
        <FieldLabel>What kind of place?</FieldLabel>
        <View style={s.kinds}>
          {KINDS.map(k => <Chip key={k.key} label={k.label} active={kind === k.key} onPress={() => setKind(k.key)} />)}
        </View>
        <FieldLabel>Campus</FieldLabel>
        <View style={[s.input, { backgroundColor: colors.surfaceSunk, borderColor: colors.border, justifyContent: 'center' }]}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary }}>{campus.short}</Text>
        </View>
        <Text style={[s.help, { color: colors.textSecondary, marginTop: 14 }]}>It shows to everyone on this campus straight away. The text is checked first, and the UBP team can remove a spot.</Text>
        {!!msg && <Text style={[s.err, { color: colors.destructive }]}>{msg}</Text>}
        <PrimaryButton label={busy ? 'Adding' : 'Add spot'} onPress={addSpot} disabled={busy || name.trim().length < 2} />
      </Sheet>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  chips: { gap: 8, paddingBottom: 4 },
  legend: { fontFamily: fonts.sans, fontSize: 12.5, marginTop: 10 },
  none: { fontFamily: fonts.sans, fontSize: 14, marginTop: 20, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 17, lineHeight: 22 },
  meta: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  status: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  statusText: { fontFamily: fonts.sansBold, fontSize: 13 },
  foot: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  report: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  fabWrap: { position: 'absolute', left: 16, right: 16, bottom: 0, alignItems: 'flex-end' },
  fab: { marginTop: 0 },
  eyebrow: { fontFamily: fonts.sansBold, fontSize: 11, letterSpacing: 1 },
  big: { fontFamily: fonts.serif, fontSize: 34, lineHeight: 40 },
  levels: { flexDirection: 'row', gap: 10 },
  levelBtn: { flex: 1, alignItems: 'center', gap: 8, borderRadius: 16, borderWidth: 1, paddingVertical: 14 },
  levelText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  levelSub: { fontFamily: fonts.sans, fontSize: 12 },
  help: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 12 },
  err: { fontFamily: fonts.sans, fontSize: 13, marginTop: 10 },
  safety: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, marginTop: 20 },
  safetyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 },
  safetyText: { fontFamily: fonts.sansMedium, fontSize: 14 },
  input: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, height: 52, fontFamily: fonts.sans, fontSize: 16 },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
})
