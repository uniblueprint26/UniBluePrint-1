/**
 * Resource finder (founder pick r3-20 merge): search and filter chips, the most
 * downloaded file big at the top, then the rest in a tidy list. It reads shared
 * notes and past papers that members uploaded, so each college's own resources
 * show up by themselves. An institution chip narrows the list to one college.
 * Every file has Report (and Block through the same sheet).
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator, Platform, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, Download, FileText, Image as ImageIcon, Flag } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { Card, Chip, Pill, EmptyNote, PrimaryButton, useTone } from '../components/campusConnect/CampusKit'
import { useReport } from '../components/safety/ReportProvider'
import { useAuth } from '../context/AuthContext'
import { useBlockedIds } from '../lib/reporting'
import { fonts } from '../constants/theme'
import { supabase } from '../lib/supabase'
import { fileTypeLabel } from './BoardDetailScreen'

export default function ResourceFinderScreen({ navigation }) {
  const { colors, accent, tint } = useTone('course')
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { openReport } = useReport()
  const blocked = useBlockedIds(user?.id)
  const [query, setQuery] = useState('')
  const [kind, setKind] = useState('all')
  const [inst, setInst] = useState(null)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [items, setItems] = useState([])
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true); setFailed(false)
    const [n, p] = await Promise.all([supabase.from('shared_notes').select('*'), supabase.from('past_papers').select('*')])
    if (n.error && p.error) { setFailed(true); setLoading(false); return }
    setItems([
      ...(n.data || []).map(x => ({ ...x, _kind: 'notes', _title: x.title, _table: 'shared_notes' })),
      ...(p.data || []).map(x => ({ ...x, _kind: 'papers', _title: `${x.subject}, ${x.exam_session} ${x.year}`, _table: 'past_papers' })),
    ])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const institutions = useMemo(() => [...new Set(items.map(i => (i.institution || '').trim()).filter(Boolean))].slice(0, 20), [items])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return items
      .filter(i => !blocked.has(i.user_id))
      .filter(i => kind === 'all' || i._kind === kind)
      .filter(i => !inst || (i.institution || '').trim() === inst)
      .filter(i => !q || [i.subject, i.course, i._title, i.institution].some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => (b.download_count || 0) - (a.download_count || 0) || new Date(b.created_at) - new Date(a.created_at))
  }, [items, blocked, kind, inst, query])

  const top = list.length && (list[0].download_count || 0) > 0 ? list[0] : null
  const rest = top ? list.slice(1) : list

  async function download(item) {
    setBusyId(item.id)
    const rpcName = item._kind === 'notes' ? 'increment_shared_note_downloads' : 'increment_past_paper_downloads'
    const rpcArg = item._kind === 'notes' ? { note_id: item.id } : { paper_id: item.id }
    await supabase.rpc(rpcName, rpcArg)
    setItems(prev => prev.map(r => r.id === item.id && r._kind === item._kind ? { ...r, download_count: (r.download_count || 0) + 1 } : r))
    setBusyId(null)
    if (Platform.OS === 'web') window.open(item.file_url, '_blank', 'noopener')
    else Linking.openURL(item.file_url)
  }

  const flag = item => openReport({ contentType: item._table, contentId: item.id, reportedUserId: item.user_id ?? null, userName: item.poster_name || null, noun: 'file' })

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <PageTitle title="Resource finder" subtitle="Notes and past papers shared by members." />
        <View style={s.body}>
          <View style={[s.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={18} color={colors.textSecondary} strokeWidth={1.8} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search by subject, course or keyword" placeholderTextColor={colors.textTertiary}
              style={[s.input, { color: colors.textPrimary }]} accessibilityLabel="Search resources" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            <Chip kind="course" label="All" active={kind === 'all'} onPress={() => setKind('all')} />
            <Chip kind="course" label="Shared notes" active={kind === 'notes'} onPress={() => setKind('notes')} />
            <Chip kind="course" label="Past papers" active={kind === 'papers'} onPress={() => setKind('papers')} />
          </ScrollView>
          {institutions.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[s.chips, { paddingTop: 0 }]}>
              {institutions.map(i => <Chip kind="course" key={i} label={i} active={inst === i} onPress={() => setInst(inst === i ? null : i)} />)}
            </ScrollView>
          )}

          {loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.textPrimary} />
          : failed ? (
            <EmptyNote title="Could not load resources" body="Check your connection and try again.">
              <PrimaryButton label="Try again" onPress={load} />
            </EmptyNote>
          ) : list.length === 0 ? (
            <EmptyNote Icon={FileText} title={items.length ? 'Nothing matches' : 'No resources yet'} body={items.length ? 'Try a different word or filter.' : 'Members add notes and past papers from the Notes and Exam resources boards. They show up here.'}>
              <PrimaryButton label="Open Notes" onPress={() => navigation.navigate('BoardDetail', { boardKey: 'notes', registry: 'course' })} />
            </EmptyNote>
          ) : (
            <>
              {top && (
                <Card style={{ marginTop: 6 }}>
                  <Text style={[s.eyebrow, { color: accent }]}>MOST DOWNLOADED</Text>
                  <Text style={[s.title, { color: colors.textPrimary }]}>{top._title}</Text>
                  <View style={s.pills}>
                    {!!top.institution && <Pill kind="course" tone="accent" label={top.institution} />}
                    {!!top.course && <Pill label={top.course} />}
                    <Pill label={`${top.download_count} download${top.download_count === 1 ? '' : 's'}`} />
                  </View>
                  <View style={s.topActions}>
                    <PrimaryButton label={busyId === top.id ? 'Opening' : 'Download'} Icon={Download} onPress={() => download(top)} disabled={busyId === top.id} style={s.dl} />
                    <TouchableOpacity onPress={() => flag(top)} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Report this file">
                      <Flag size={18} color={colors.textSecondary} strokeWidth={1.8} />
                    </TouchableOpacity>
                  </View>
                </Card>
              )}
              {rest.length > 0 && <Text style={[s.section, { color: colors.textPrimary }]}>{top ? 'More resources' : 'Resources'}</Text>}
              {rest.map(r => {
                const Icon = fileTypeLabel(r) === 'PDF' ? FileText : ImageIcon
                return (
                  <Card key={`${r._kind}-${r.id}`} style={{ marginBottom: 10 }}>
                    <View style={s.row}>
                      <View style={[s.icon, { backgroundColor: tint }]}><Icon size={20} color={accent} strokeWidth={1.8} /></View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.rowTitle, { color: colors.textPrimary }]} numberOfLines={2}>{r._title}</Text>
                        <Text style={[s.small, { color: colors.textSecondary }]} numberOfLines={1}>{[r.institution, r.course].filter(Boolean).join(', ')}</Text>
                        <Text style={[s.small, { color: colors.textSecondary }]}>{r.download_count || 0} downloads</Text>
                      </View>
                      <TouchableOpacity onPress={() => flag(r)} style={s.iconBtn} accessibilityRole="button" accessibilityLabel="Report this file">
                        <Flag size={16} color={colors.textSecondary} strokeWidth={1.8} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => download(r)} disabled={busyId === r.id} accessibilityRole="button" accessibilityLabel={`Download ${r._title}`}
                        style={[s.round, { backgroundColor: colors.accentBg, opacity: busyId === r.id ? 0.5 : 1 }]}>
                        <Download size={18} color={colors.accentFg} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </Card>
                )
              })}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, height: 52 },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 16 },
  chips: { gap: 8, paddingVertical: 14 },
  eyebrow: { fontFamily: fonts.sansBold, fontSize: 12, letterSpacing: 1 },
  title: { fontFamily: fonts.serif, fontSize: 24, lineHeight: 31, marginTop: 8 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dl: { flex: 1 },
  section: { fontFamily: fonts.serif, fontSize: 22, marginTop: 24, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15.5, lineHeight: 21 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { padding: 8 },
})
