/**
 * ResourceFinderScreen — search across Shared Notes + Past Papers.
 *
 * Bespoke rather than a generic board because it reads from two tables at
 * once and has no post form of its own — purely a cross-table search over
 * resources other students already uploaded via the Shared Notes and Past
 * Papers boards.
 */
import { useState, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator, Platform, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, Search, Download, FileText, Image as ImageIcon } from 'lucide-react-native'

import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { supabase } from '../lib/supabase'
import { fileTypeLabel } from './BoardDetailScreen'

function formatDate(dateStr) {
  try {
    return new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return ''
  }
}

export default function ResourceFinderScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])
  const [busyId, setBusyId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [{ data: notes }, { data: papers }] = await Promise.all([
      supabase.from('shared_notes').select('*'),
      supabase.from('past_papers').select('*'),
    ])
    const combined = [
      ...(notes || []).map(n => ({ ...n, _kind: 'notes', _title: n.title, _label: 'Shared Notes' })),
      ...(papers || []).map(p => ({ ...p, _kind: 'papers', _title: `${p.subject} — ${p.exam_session} ${p.year}`, _label: 'Past Paper' })),
    ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    setItems(combined)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = items.filter(i => {
    if (!query.trim()) return true
    const q = query.trim().toLowerCase()
    return [i.subject, i.course, i._title].some(v => (v || '').toLowerCase().includes(q))
  })

  async function download(item) {
    setBusyId(item.id)
    const rpcName = item._kind === 'notes' ? 'increment_shared_note_downloads' : 'increment_past_paper_downloads'
    const rpcArg = item._kind === 'notes' ? { note_id: item.id } : { paper_id: item.id }
    await supabase.rpc(rpcName, rpcArg)
    setItems(prev => prev.map(r => r.id === item.id && r._kind === item._kind ? { ...r, download_count: (r.download_count || 0) + 1 } : r))
    setBusyId(null)
    if (Platform.OS === 'web') window.open(item.file_url, '_blank')
    else Linking.openURL(item.file_url)
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: insets.bottom + 80 }} keyboardShouldPersistTaps="handled">
        <View style={[styles.heroBlock, { paddingTop: insets.top + 8 }]}>
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Go back">
              <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
              <Text style={styles.backBtnText}>Course Connect</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroIcon}>🔎</Text>
          <Text style={styles.heroTitle}>Resource Finder</Text>
          <Text style={styles.heroSub}>Search shared notes and past papers from every Irish college by subject, course, or keyword.</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.searchWrap}>
            <Search size={16} color={colors.muted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by subject, course, or keyword..."
              placeholderTextColor={colors.light}
              value={query}
              onChangeText={setQuery}
              autoFocus={Platform.OS === 'web'}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={colors.navy} style={{ marginTop: spacing.xl }} />
          ) : filtered.length === 0 ? (
            <Text style={styles.emptyText}>
              {items.length === 0 ? 'No resources uploaded yet — check back once students start sharing.' : 'No resources match that search.'}
            </Text>
          ) : (
            <View style={{ gap: 10, marginTop: spacing.md }}>
              {filtered.map(item => {
                const isPdf = fileTypeLabel(item) === 'PDF'
                return (
                  <Card key={`${item._kind}-${item.id}`} style={styles.card}>
                    <View style={styles.metaRow}>
                      <View style={styles.metaPill}><Text style={styles.metaPillText}>{item._label}</Text></View>
                      <View style={styles.metaPill}>
                        {isPdf ? <FileText size={11} color={colors.navy} /> : <ImageIcon size={11} color={colors.navy} />}
                        <Text style={styles.metaPillText}> {fileTypeLabel(item)}</Text>
                      </View>
                      {!!item.institution && <View style={styles.metaPill}><Text style={styles.metaPillText}>{item.institution}</Text></View>}
                    </View>
                    <Text style={styles.cardTitle}>{item._title}</Text>
                    <View style={styles.metaRow}>
                      {[item.subject, item.course].filter(Boolean).map((m, i) => (
                        <View key={i} style={styles.metaPill}><Text style={styles.metaPillText}>{m}</Text></View>
                      ))}
                    </View>
                    <Text style={styles.posterLine}>
                      Uploaded {formatDate(item.created_at)} · {item.download_count || 0} download{(item.download_count || 0) !== 1 ? 's' : ''}
                    </Text>
                    <TouchableOpacity style={styles.downloadBtn} activeOpacity={0.85} disabled={busyId === item.id} onPress={() => download(item)}>
                      <Download size={13} color={colors.cream} strokeWidth={2} />
                      <Text style={styles.downloadBtnText}>Download</Text>
                    </TouchableOpacity>
                  </Card>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  heroBlock: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: spacing.lg },
  navRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingRight: 10 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  heroIcon: { fontSize: 30, marginBottom: 4 },
  heroTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.cream, lineHeight: 32 },
  heroSub: { fontFamily: fonts.sans, fontSize: 13.5, color: 'rgba(245,240,232,0.72)', marginTop: 6, lineHeight: 20 },

  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.white, borderRadius: radius.card,
    paddingHorizontal: 14, height: 48, ...shadows.card,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.navy },

  emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, fontStyle: 'italic', marginTop: spacing.lg, textAlign: 'center' },

  card: { padding: 16 },
  cardTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy, lineHeight: 21, marginTop: 8 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8, alignItems: 'center' },
  metaPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cream, borderRadius: radius.badge, paddingHorizontal: 9, paddingVertical: 4 },
  metaPillText: { fontFamily: fonts.sansMedium, fontSize: 11, color: colors.navy },
  posterLine: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 10 },

  downloadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.navy, borderRadius: radius.button, paddingVertical: 10, marginTop: 12,
  },
  downloadBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
})
