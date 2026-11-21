/**
 * Study resources: shared notes, past papers and links, in BOTH Campus Connect
 * (your own campus community) and Course Connect (everyone in Ireland).
 *
 * Route params: scope ('course' default or 'campus'), type ('note' or 'paper'
 * to start on one kind), suggest (true opens the Suggest a resource sheet).
 *
 * Browse, search, filter (college, subject, course, year), open or download
 * with a counter, save, rate, add a file or a link, delete your own, and
 * Report or Block on every item that someone else posted. Items posted by UBP
 * carry the "Posted by UBP" stamp and cannot be edited or deleted.
 */
import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, FileText, Link2, Image as ImageIcon, Flag, UserX, Bookmark, Trash2, Star, ExternalLink, Download, Plus, Lightbulb } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import UbpStamp from '../components/ui/UbpStamp'
import AddResourceSheet from '../components/studyResources/AddResourceSheet'
import { Card, Chip, Pill, EmptyNote, PrimaryButton, useTone } from '../components/campusConnect/CampusKit'
import { useReport } from '../components/safety/ReportProvider'
import { useAuth } from '../context/AuthContext'
import { useCampus } from '../lib/campus'
import { useBlockedIds } from '../lib/reporting'
import { fonts } from '../constants/theme'
import {
  TYPES, fetchResources, fetchMyState, openResource, setSaved, setRating, removeResource,
  isLink, keyOf, fileKindLabel, sourceDomain,
} from '../lib/studyResources'

const KINDS = [
  { key: 'all', label: 'All' },
  { key: 'note', label: 'Notes' },
  { key: 'paper', label: 'Past papers' },
  { key: 'link', label: 'Links' },
  { key: 'saved', label: 'Saved' },
]
const SORTS = [
  { key: 'opened', label: 'Most opened' },
  { key: 'new', label: 'Newest' },
  { key: 'rated', label: 'Top rated' },
]

function checkedLabel(d) {
  if (!d) return ''
  const dt = new Date(`${d}T00:00:00`)
  if (Number.isNaN(dt.getTime())) return ''
  return `Checked ${dt.getDate()} ${dt.toLocaleString('en-IE', { month: 'short' })} ${dt.getFullYear()}`
}

export default function StudyResourcesScreen({ navigation, route }) {
  const params = route?.params || {}
  const [scope, setScope] = useState(params.scope === 'campus' ? 'campus' : 'course')
  const { colors, accent, tint } = useTone(scope === 'campus' ? 'campus' : 'course')
  const insets = useSafeAreaInsets()
  const { user, profile } = useAuth()
  const campus = useCampus()
  const { openReport, openBlock } = useReport()
  const blocked = useBlockedIds(user?.id)
  const hasCampus = !!(profile?.campus_community || campus.institution)

  const [query, setQuery] = useState('')
  const [kind, setKind] = useState(params.type === 'paper' ? 'paper' : params.type === 'note' ? 'note' : 'all')
  const [sort, setSort] = useState('opened')
  const [fInst, setFInst] = useState(null)
  const [fSubject, setFSubject] = useState(null)
  const [fYear, setFYear] = useState(null)
  const [fCourse, setFCourse] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [items, setItems] = useState([])
  const [mine, setMine] = useState({ saved: new Set(), mine: {}, summary: {} })
  const [busyKey, setBusyKey] = useState(null)
  const [notice, setNotice] = useState(null)
  const [addOpen, setAddOpen] = useState(false)
  const [addMode, setAddMode] = useState({ suggest: false })

  const load = useCallback(async () => {
    setLoading(true); setFailed(false)
    const res = await fetchResources(scope)
    if (!res.ok) { setFailed(true); setItems([]); setLoading(false); return }
    setItems(res.items)
    setLoading(false)
    fetchMyState(user?.id, res.items).then(setMine).catch(() => {})
  }, [scope, user?.id])
  useEffect(() => { load() }, [load])
  useEffect(() => { setFInst(null); setFSubject(null); setFYear(null); setFCourse(null) }, [scope])
  useEffect(() => { if (params.suggest) { setAddMode({ suggest: true }); setAddOpen(true) } }, [params.suggest])

  const visible = useMemo(() => items.filter(i => !blocked.has(i.user_id)), [items, blocked])
  const uniq = pick => [...new Set(visible.map(pick).map(v => (v || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)).slice(0, 14)
  const institutions = useMemo(() => uniq(i => i.institution), [visible])
  const subjects = useMemo(() => uniq(i => i.subject), [visible])
  const courses = useMemo(() => uniq(i => i.course), [visible])
  const years = useMemo(() => uniq(i => i.year), [visible])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const score = i => mine.summary[keyOf(i)]?.avg || 0
    return visible
      .filter(i => kind === 'all' || (kind === 'saved' ? mine.saved.has(keyOf(i)) : kind === 'link' ? isLink(i) : i._type === kind))
      .filter(i => !fInst || (i.institution || '').trim() === fInst)
      .filter(i => !fSubject || (i.subject || '').trim() === fSubject)
      .filter(i => !fCourse || (i.course || '').trim() === fCourse)
      .filter(i => !fYear || (i.year || '').trim() === fYear)
      .filter(i => !q || [i._title, i.subject, i.course, i.module, i.institution, i.description, i.year, sourceDomain(i.link_url)]
        .some(v => (v || '').toLowerCase().includes(q)))
      .sort((a, b) => {
        if (sort === 'new') return new Date(b.created_at) - new Date(a.created_at)
        if (sort === 'rated') return score(b) - score(a) || (b.download_count || 0) - (a.download_count || 0)
        return (b.download_count || 0) - (a.download_count || 0) || new Date(b.created_at) - new Date(a.created_at)
      })
  }, [visible, kind, query, sort, fInst, fSubject, fCourse, fYear, mine])

  const activeFilters = [fInst, fSubject, fCourse, fYear].filter(Boolean).length

  async function open(item) {
    const k = keyOf(item)
    setBusyKey(k); setNotice(null)
    const ok = await openResource(item)
    setBusyKey(null)
    if (!ok) { setNotice('Could not open that. Please try again.'); return }
    setItems(prev => prev.map(r => keyOf(r) === k ? { ...r, download_count: (r.download_count || 0) + 1 } : r))
  }

  async function toggleSave(item) {
    const k = keyOf(item)
    const on = !mine.saved.has(k)
    setMine(m => { const s = new Set(m.saved); on ? s.add(k) : s.delete(k); return { ...m, saved: s } })
    const ok = await setSaved(user?.id, item, on)
    if (!ok) {
      setNotice('Could not save that. Please try again.')
      setMine(m => { const s = new Set(m.saved); on ? s.delete(k) : s.add(k); return { ...m, saved: s } })
    }
  }

  async function rate(item, value) {
    const k = keyOf(item)
    const prev = mine.mine[k]
    setMine(m => ({ ...m, mine: { ...m.mine, [k]: value } }))
    const ok = await setRating(user?.id, item, value)
    if (!ok) { setNotice('Could not save your rating.'); setMine(m => ({ ...m, mine: { ...m.mine, [k]: prev } })); return }
    fetchMyState(user?.id, items).then(setMine).catch(() => {})
  }

  function confirmDelete(item) {
    Alert.alert('Delete this?', 'It is removed for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const ok = await removeResource(item)
          if (ok) setItems(prev => prev.filter(r => keyOf(r) !== keyOf(item)))
          else setNotice('Could not delete that. Please try again.')
        },
      },
    ])
  }

  const flag = item => openReport({
    contentType: TYPES[item._type].reportType, contentId: item.id, reportedUserId: item.user_id ?? null,
    userName: item.poster_name || null, noun: isLink(item) ? 'link' : 'file',
  })
  const block = item => openBlock({ reportedUserId: item.user_id, userName: item.poster_name || null, noun: 'file' })

  function openAdd(suggest) { setAddMode({ suggest }); setAddOpen(true) }

  const noCampus = scope === 'campus' && !hasCampus
  const scopeName = scope === 'campus' ? 'Campus Connect' : 'Course Connect'
  const subtitle = scope === 'campus'
    ? 'Notes, past papers and links from your own campus community.'
    : 'Notes, past papers and links shared by members across Ireland.'

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 48 }} keyboardShouldPersistTaps="handled">
        <PageTitle title="Study resources" subtitle={subtitle} />
        <View style={s.body}>
          <View style={s.row}>
            <Chip kind={scope} label="Course Connect" active={scope === 'course'} onPress={() => setScope('course')} />
            <Chip kind={scope} label="Campus Connect" active={scope === 'campus'} onPress={() => setScope('campus')} />
          </View>

          <View style={[s.actions]}>
            <PrimaryButton label="Add a file or link" Icon={Plus} onPress={() => openAdd(false)} style={s.actionBtn} />
            <TouchableOpacity onPress={() => openAdd(true)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Suggest a resource"
              style={[s.ghostBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Lightbulb size={16} color={accent} strokeWidth={1.8} />
              <Text style={[s.ghostText, { color: colors.textPrimary }]}>Suggest a link</Text>
            </TouchableOpacity>
          </View>

          <View style={[s.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Search size={18} color={colors.textSecondary} strokeWidth={1.8} />
            <TextInput value={query} onChangeText={setQuery} placeholder="Search resources" placeholderTextColor={colors.textTertiary}
              style={[s.input, { color: colors.textPrimary }]} accessibilityLabel="Search resources" />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
            {KINDS.map(k => <Chip key={k.key} kind={scope} label={k.label} active={kind === k.key} onPress={() => setKind(k.key)} />)}
          </ScrollView>
          <View style={s.sortRow}>
            <TouchableOpacity onPress={() => setShowFilters(v => !v)} accessibilityRole="button" accessibilityState={{ expanded: showFilters }}>
              <Text style={[s.link, { color: accent }]}>{showFilters ? 'Hide filters' : `Filters${activeFilters ? ` (${activeFilters})` : ''}`}</Text>
            </TouchableOpacity>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingLeft: 16 }}>
              {SORTS.map(o => (
                <TouchableOpacity key={o.key} onPress={() => setSort(o.key)} accessibilityRole="button" accessibilityState={{ selected: sort === o.key }}>
                  <Text style={[s.sort, { color: sort === o.key ? colors.textPrimary : colors.textSecondary, fontFamily: sort === o.key ? fonts.sansBold : fonts.sans }]}>{o.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {showFilters && (
            <View style={s.filters}>
              <FilterRow label="College" values={institutions} value={fInst} onChange={setFInst} scope={scope} colors={colors} />
              <FilterRow label="Subject" values={subjects} value={fSubject} onChange={setFSubject} scope={scope} colors={colors} />
              <FilterRow label="Course" values={courses} value={fCourse} onChange={setFCourse} scope={scope} colors={colors} />
              <FilterRow label="Year" values={years} value={fYear} onChange={setFYear} scope={scope} colors={colors} />
              {activeFilters > 0 && (
                <TouchableOpacity onPress={() => { setFInst(null); setFSubject(null); setFCourse(null); setFYear(null) }} accessibilityRole="button">
                  <Text style={[s.link, { color: accent, marginTop: 4 }]}>Clear filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!!notice && <Text style={[s.notice, { color: colors.destructive }]} accessibilityRole="alert">{notice}</Text>}

          {noCampus ? (
            <EmptyNote kind={scope} Icon={FileText} title="Add your campus first" body="Campus Connect resources come from your own community. Add your campus in Settings to see and share them." />
          ) : loading ? <ActivityIndicator style={{ marginTop: 40 }} color={colors.textPrimary} />
          : failed ? (
            <EmptyNote kind={scope} title="Could not load resources" body="Check your connection and try again.">
              <PrimaryButton label="Try again" onPress={load} />
            </EmptyNote>
          ) : list.length === 0 ? (
            <EmptyNote kind={scope} Icon={FileText}
              title={visible.length ? 'Nothing matches' : 'No resources yet'}
              body={visible.length ? 'Try a different word or filter.' : `Nothing has been shared on ${scopeName} yet. Add the first file or link.`}>
              <PrimaryButton label="Add a file or link" Icon={Plus} onPress={() => openAdd(false)} />
            </EmptyNote>
          ) : (
            list.map(item => {
              const k = keyOf(item)
              const link = isLink(item)
              const own = !!user?.id && item.user_id === user.id
              const sum = mine.summary[k]
              const myRating = mine.mine[k] || 0
              const KindIcon = link ? Link2 : (fileKindLabel(item) === 'Image' ? ImageIcon : FileText)
              const meta = [item.subject, item.course, item.module, item.year, item._type === 'paper' ? item.exam_session : null].filter(Boolean)
              return (
                <Card key={k} style={{ marginTop: 12 }}>
                  <View style={s.cardHead}>
                    <View style={[s.icon, { backgroundColor: tint }]}><KindIcon size={20} color={accent} strokeWidth={1.8} /></View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[s.title, { color: colors.textPrimary }]}>{item._title}</Text>
                      <Text style={[s.small, { color: colors.textSecondary }]} numberOfLines={1}>
                        {link ? `Link · ${sourceDomain(item.link_url)}` : `${TYPES[item._type].label} · ${fileKindLabel(item)}`}
                      </Text>
                    </View>
                  </View>
                  {item.is_ubp && <UbpStamp label="Posted by UBP" style={{ marginTop: 12, marginLeft: 4 }} />}

                  {!!item.description && <Text style={[s.desc, { color: colors.textPrimary }]}>{item.description}</Text>}

                  <View style={s.pills}>
                    {!!item.institution && <Pill kind={scope} tone="accent" label={item.institution} />}
                    {meta.map((m, idx) => <Pill key={idx} label={m} />)}
                  </View>

                  <Text style={[s.small, { color: colors.textSecondary, marginTop: 10 }]}>
                    {item.is_ubp ? checkedLabel(item.checked_on) : `${item.poster_name || 'A member'}`}
                    {`  ·  ${item.download_count || 0} ${link ? 'open' : 'download'}${(item.download_count || 0) === 1 ? '' : 's'}`}
                    {sum ? `  ·  ${sum.avg} from ${sum.count}` : ''}
                  </Text>

                  <View style={s.rateRow} accessibilityLabel="Rate this">
                    <Text style={[s.small, { color: colors.textSecondary, marginRight: 4 }]}>{own ? 'Your item' : 'Rate'}</Text>
                    {!own && [1, 2, 3, 4, 5].map(n => (
                      <TouchableOpacity key={n} onPress={() => rate(item, n)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        accessibilityRole="button" accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`} accessibilityState={{ selected: n <= myRating }}>
                        <Star size={20} color={n <= myRating ? accent : colors.textTertiary} fill={n <= myRating ? accent : 'transparent'} strokeWidth={1.6} />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={s.cardActions}>
                    <PrimaryButton label={busyKey === k ? 'Opening' : (link ? 'Open link' : 'Download')} Icon={link ? ExternalLink : Download}
                      onPress={() => open(item)} disabled={busyKey === k} style={s.dl} />
                    <IconBtn label={mine.saved.has(k) ? 'Remove from saved' : 'Save'} onPress={() => toggleSave(item)}>
                      <Bookmark size={20} color={mine.saved.has(k) ? accent : colors.textSecondary} fill={mine.saved.has(k) ? accent : 'transparent'} strokeWidth={1.8} />
                    </IconBtn>
                    {own ? (
                      <IconBtn label="Delete" onPress={() => confirmDelete(item)}><Trash2 size={20} color={colors.destructive} strokeWidth={1.8} /></IconBtn>
                    ) : (
                      <>
                        <IconBtn label={link ? 'Report this link' : 'Report this file'} onPress={() => flag(item)}><Flag size={20} color={colors.textSecondary} strokeWidth={1.8} /></IconBtn>
                        {!!item.user_id && <IconBtn label={`Block ${item.poster_name || 'this member'}`} onPress={() => block(item)}><UserX size={20} color={colors.textSecondary} strokeWidth={1.8} /></IconBtn>}
                      </>
                    )}
                  </View>
                </Card>
              )
            })
          )}
        </View>
      </ScrollView>

      <AddResourceSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        scope={scope}
        suggest={addMode.suggest}
        initialType={kind === 'paper' ? 'paper' : 'note'}
        onAdded={row => {
          if (row.scope === scope) setItems(prev => [row, ...prev])
          setNotice(null)
        }}
      />
    </View>
  )
}

function IconBtn({ label, onPress, children }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.iconBtn} accessibilityRole="button" accessibilityLabel={label} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
      {children}
    </TouchableOpacity>
  )
}

function FilterRow({ label, values, value, onChange, scope, colors }) {
  if (!values.length) return null
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={[s.filterLabel, { color: colors.textSecondary }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {values.map(v => <Chip key={v} kind={scope} label={v} active={value === v} onPress={() => onChange(value === v ? null : v)} />)}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginBottom: 16, flexWrap: 'wrap' },
  actionBtn: { flex: 1, minWidth: 140, marginTop: 14 },
  ghostBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 13, marginTop: 14 },
  ghostText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, height: 52 },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 16 },
  chips: { gap: 8, paddingVertical: 14 },
  sortRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  link: { fontFamily: fonts.sansSemiBold, fontSize: 14 },
  sort: { fontSize: 14 },
  filters: { marginTop: 10, marginBottom: 6 },
  filterLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, letterSpacing: 0.4, marginBottom: 8 },
  notice: { fontFamily: fonts.sansSemiBold, fontSize: 14, marginTop: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22 },
  small: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19 },
  desc: { fontFamily: fonts.sans, fontSize: 14.5, lineHeight: 21, marginTop: 12 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  rateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dl: { flex: 1, marginRight: 6 },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
})
