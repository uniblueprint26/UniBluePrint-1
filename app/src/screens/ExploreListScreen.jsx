import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Linking,
  Modal, Pressable, KeyboardAvoidingView, Platform,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { ChevronDown, ChevronRight, ExternalLink, Check, Library, WifiOff, X } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import EmptyState from '../components/ui/EmptyState'
import { GroupCard, RowDivider } from '../components/explore/ExploreParts'
import { useSocieties } from '../components/explore/societies'
import SocietySheet from '../components/explore/SocietySheet'
import UbpStamp from '../components/ui/UbpStamp'
import { EXPLORE_KINDS } from '../constants/exploreCatalog'
import { fonts, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const TICKS_KEY_PREFIX = 'ubp_freshers_ticks_'

function openUrl(url) {
  if (!url) return
  const href = /^(https?|mailto):/i.test(url) ? url : `https://${url}`
  Linking.openURL(href).catch(() => {})
}

// Generic list for the Explore "From UBP" lists: scholarships, discounts,
// support, societies, volunteering and the freshers checklist. Reads
// published rows of one `kind` from the explore_content table.
export default function ExploreListScreen(props) {
  // Societies read two tables and merge them, so they get their own screen body.
  return props.route?.params?.kind === 'societies'
    ? <SocietiesListScreen {...props} />
    : <GenericListScreen {...props} />
}

function GenericListScreen({ navigation, route }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const kind = route?.params?.kind
  const meta = EXPLORE_KINDS[kind] || { title: 'Explore', subtitle: '', emptyTitle: 'Nothing here yet', empty: 'Check back soon.' }

  const [rows, setRows] = useState([])
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [suggestOpen, setSuggestOpen] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const { data, error } = await supabase
        .from('explore_content')
        .select('id, kind, title, subtitle, body, url, tags, institution, sort, source, status')
        .eq('kind', kind)
        .eq('status', 'published')
        .order('sort', { ascending: true })
      if (error) throw error
      setRows(data || [])
      setStatus('ready')
    } catch {
      setRows([])
      setStatus('error')
    }
  }, [kind])

  useEffect(() => { load() }, [load])

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle title={meta.title} subtitle={meta.subtitle} style={s.title} />

        {status === 'loading' && (
          <View style={s.center}><ActivityIndicator color={colors.textPrimary} /></View>
        )}

        {status === 'error' && (
          <EmptyState
            icon={WifiOff}
            title="Could not load this"
            subtitle="Check your connection and try again."
            ctaLabel="Try again"
            onCtaPress={load}
          />
        )}

        {status === 'ready' && rows.length === 0 && (
          <EmptyState icon={Library} title={meta.emptyTitle} subtitle={meta.empty} />
        )}

        {status === 'ready' && rows.length > 0 && (
          kind === 'freshers'
            ? <FreshersChecklist rows={rows} userId={user?.id} />
            : (
              <View style={s.listWrap}>
                <GroupCard>
                  {rows.map((row, i) => (
                    <View key={row.id}>
                      {i > 0 && <RowDivider inset={16} />}
                      <ContentRow row={row} />
                    </View>
                  ))}
                </GroupCard>
              </View>
            )
        )}

        {status !== 'loading' && (
          <TouchableOpacity
            onPress={() => setSuggestOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            style={s.suggestBtn}
          >
            <Text style={[s.suggestText, { color: colors.textSecondary }]}>Suggest one</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <SuggestSheet visible={suggestOpen} kind={kind} userId={user?.id} onClose={() => setSuggestOpen(false)} />
    </View>
  )
}

// Societies directory: signed-up societies (clubs_societies) and UBP seeded
// ones (explore_content) merged into one list, de-duped by name.
function SocietiesListScreen({ navigation }) {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { items, status, reload } = useSocieties()
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const meta = EXPLORE_KINDS.societies

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle title={meta.title} subtitle={meta.subtitle} style={s.title} />

        {status === 'loading' && (
          <View style={s.center}><ActivityIndicator color={colors.textPrimary} /></View>
        )}

        {status === 'error' && (
          <EmptyState
            icon={WifiOff}
            title="Could not load this"
            subtitle="Check your connection and try again."
            ctaLabel="Try again"
            onCtaPress={reload}
          />
        )}

        {status === 'ready' && items.length === 0 && (
          <EmptyState icon={Library} title={meta.emptyTitle} subtitle={meta.empty} />
        )}

        {status === 'ready' && items.length > 0 && (
          <View style={s.listWrap}>
            <Text style={[s.countLine, { color: colors.textSecondary }]}>
              {items.length} {items.length === 1 ? 'society' : 'societies'}
            </Text>
            <GroupCard>
              {items.map((it, i) => (
                <View key={it.id}>
                  {i > 0 && <RowDivider inset={16} />}
                  <SocietyRow item={it} onPress={() => setSelected(it)} />
                </View>
              ))}
            </GroupCard>
          </View>
        )}

        {status !== 'loading' && (
          <TouchableOpacity
            onPress={() => setSuggestOpen(true)}
            activeOpacity={0.7}
            accessibilityRole="button"
            style={s.suggestBtn}
          >
            <Text style={[s.suggestText, { color: colors.textSecondary }]}>Suggest one</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <SuggestSheet visible={suggestOpen} kind="societies" userId={user?.id} onClose={() => setSuggestOpen(false)} />
      <SocietySheet item={selected} onClose={() => setSelected(null)} />
    </View>
  )
}

function SocietyRow({ item, onPress }) {
  const { colors } = useTheme()
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${item.example ? ', example' : ''}. How to join and message`}
      style={s.contentRow}
    >
      <View style={s.contentHead}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.contentTitle, { color: colors.textPrimary }]}>{item.name}</Text>
          {!!item.institution && <Text style={[s.contentSub, { color: colors.textSecondary }]}>{item.institution}</Text>}
        </View>
        <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />
      </View>
      {(item.example || item.ubp || item.tags.length > 0) && (
        <View style={s.tagRow}>
          {item.example && <UbpStamp example />}
          {!item.example && item.ubp && <Tag label="From UBP" ubp />}
          {item.tags.map(t => <Tag key={t} label={t} />)}
        </View>
      )}
    </TouchableOpacity>
  )
}

function Tag({ label, ubp }) {
  const { colors } = useTheme()
  return (
    <View style={[s.tag, { backgroundColor: ubp ? colors.accentBg : colors.tabFill }]}>
      <Text style={[s.tagText, { color: ubp ? colors.accentFg : colors.textSecondary }]}>{label}</Text>
    </View>
  )
}

function ContentRow({ row }) {
  const { colors } = useTheme()
  const [open, setOpen] = useState(false)
  const hasBody = !!row.body
  const tags = Array.isArray(row.tags) ? row.tags : []

  function onPress() {
    if (hasBody) setOpen(o => !o)
    else if (row.url) openUrl(row.url)
  }
  const tappable = hasBody || !!row.url

  return (
    <TouchableOpacity
      activeOpacity={tappable ? 0.75 : 1}
      onPress={tappable ? onPress : undefined}
      accessibilityRole={tappable ? 'button' : undefined}
      accessibilityLabel={row.title}
      accessibilityState={hasBody ? { expanded: open } : undefined}
      style={s.contentRow}
    >
      <View style={s.contentHead}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[s.contentTitle, { color: colors.textPrimary }]}>{row.title}</Text>
          {!!row.subtitle && <Text style={[s.contentSub, { color: colors.textSecondary }]}>{row.subtitle}</Text>}
        </View>
        {hasBody ? (
          <ChevronDown size={18} color={colors.textTertiary} strokeWidth={1.8} style={open ? { transform: [{ rotate: '180deg' }] } : null} />
        ) : row.url ? (
          <ExternalLink size={16} color={colors.textTertiary} strokeWidth={1.8} />
        ) : null}
      </View>
      {(row.source === 'ubp' || tags.length > 0 || !!row.institution) && (
        <View style={s.tagRow}>
          {row.source === 'ubp' && <Tag label="From UBP" ubp />}
          {!!row.institution && <Tag label={row.institution} />}
          {tags.map(t => <Tag key={t} label={t} />)}
        </View>
      )}
      {hasBody && open && (
        <View style={s.bodyWrap}>
          <Text style={[s.body, { color: colors.textPrimary }]}>{row.body}</Text>
          {!!row.url && (
            <TouchableOpacity onPress={() => openUrl(row.url)} activeOpacity={0.75} style={s.linkBtn} accessibilityRole="link">
              <Text style={[s.linkText, { color: colors.textPrimary }]}>Open link</Text>
              <ExternalLink size={14} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  )
}

// Freshers guide: tick things off, grouped by the first tag. Ticks are kept
// on the device, per user.
function FreshersChecklist({ rows, userId }) {
  const { colors } = useTheme()
  const key = TICKS_KEY_PREFIX + (userId || 'anon')
  const [ticks, setTicks] = useState({})
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(key)
      .then(raw => { if (!cancelled && raw) { try { setTicks(JSON.parse(raw) || {}) } catch {} } })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [key])

  function toggle(id) {
    setTicks(prev => {
      const next = { ...prev }
      if (next[id]) delete next[id]; else next[id] = true
      AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {})
      return next
    })
  }

  const groups = useMemo(() => {
    const order = []
    const map = {}
    rows.forEach(r => {
      const g = (Array.isArray(r.tags) && r.tags[0]) || 'More'
      if (!map[g]) { map[g] = []; order.push(g) }
      map[g].push(r)
    })
    return order.map(g => ({ name: g, rows: map[g] }))
  }, [rows])

  const done = rows.filter(r => ticks[r.id]).length

  return (
    <View style={s.listWrap}>
      <Text style={[s.progress, { color: colors.textSecondary }]}>
        {loaded ? `${done} of ${rows.length} done` : ' '}
      </Text>
      {groups.map(g => (
        <View key={g.name} style={{ marginTop: 14 }}>
          <Text style={[s.groupName, { color: colors.textPrimary }]}>{g.name}</Text>
          <GroupCard>
            {g.rows.map((r, i) => {
              const checked = !!ticks[r.id]
              return (
                <View key={r.id}>
                  {i > 0 && <RowDivider inset={54} />}
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => toggle(r.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    accessibilityLabel={r.title}
                    style={s.checkRow}
                  >
                    <View style={[s.box, checked ? { backgroundColor: colors.accentBg, borderColor: colors.accentBg } : { borderColor: colors.textTertiary }]}>
                      {checked && <Check size={14} color={colors.accentFg} strokeWidth={3} />}
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[s.checkTitle, { color: checked ? colors.textSecondary : colors.textPrimary, textDecorationLine: checked ? 'line-through' : 'none' }]}>{r.title}</Text>
                      {!!r.subtitle && <Text style={[s.contentSub, { color: colors.textSecondary }]}>{r.subtitle}</Text>}
                    </View>
                    {!!r.url && (
                      <TouchableOpacity onPress={() => openUrl(r.url)} hitSlop={10} accessibilityRole="link" accessibilityLabel={`Open link for ${r.title}`}>
                        <ExternalLink size={16} color={colors.textTertiary} strokeWidth={1.8} />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>
              )
            })}
          </GroupCard>
        </View>
      ))}
    </View>
  )
}

// "Suggest one": a student sends a row for review. It is saved as pending
// and never shows to anyone until UBP publishes it.
function SuggestSheet({ visible, kind, userId, onClose }) {
  const { colors } = useTheme()
  const [title, setTitle] = useState('')
  const [note, setNote] = useState('')
  const [url, setUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (visible) { setTitle(''); setNote(''); setUrl(''); setDone(false); setError(''); setSending(false) }
  }, [visible])

  async function send() {
    if (!title.trim() || sending) return
    if (!userId) { setError('Sign in to suggest one.'); return }
    setSending(true); setError('')
    try {
      const { error: err } = await supabase.from('explore_content').insert({
        kind,
        title: title.trim(),
        body: note.trim() || null,
        url: url.trim() || null,
        tags: [],
        source: 'student',
        status: 'pending',
        created_by: userId,
      })
      if (err) throw err
      setDone(true)
    } catch {
      setError('Could not send that. Try again.')
    } finally {
      setSending(false)
    }
  }

  const inputStyle = [s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.textPrimary }]

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={[s.backdrop, { backgroundColor: colors.overlay }]} onPress={onClose}>
          <Pressable style={[s.sheet, { backgroundColor: colors.surface }]} onPress={e => e.stopPropagation?.()}>
            <TouchableOpacity onPress={onClose} style={[s.close, { backgroundColor: colors.background }]} accessibilityRole="button" accessibilityLabel="Close">
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            {done ? (
              <View style={s.doneWrap}>
                <Text style={[s.sheetTitle, { color: colors.textPrimary }]}>Thanks, we'll review it</Text>
                <Text style={[s.sheetSub, { color: colors.textSecondary }]}>If it fits, it will show up here soon.</Text>
                <TouchableOpacity onPress={onClose} style={[s.primary, { backgroundColor: colors.accentBg }]} activeOpacity={0.85}>
                  <Text style={[s.primaryText, { color: colors.accentFg }]}>Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[s.sheetTitle, { color: colors.textPrimary }]}>Suggest one</Text>
                <Text style={[s.sheetSub, { color: colors.textSecondary }]}>Know something that belongs here? Tell us and we will take a look.</Text>
                <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={colors.textTertiary} style={inputStyle} maxLength={120} accessibilityLabel="Title" />
                <TextInput value={note} onChangeText={setNote} placeholder="A short note" placeholderTextColor={colors.textTertiary} style={[...inputStyle, s.inputMulti]} multiline maxLength={500} accessibilityLabel="Short note" />
                <TextInput value={url} onChangeText={setUrl} placeholder="Link (optional)" placeholderTextColor={colors.textTertiary} style={inputStyle} autoCapitalize="none" autoCorrect={false} keyboardType="url" accessibilityLabel="Link" />
                {!!error && <Text style={[s.error, { color: colors.destructive }]}>{error}</Text>}
                <TouchableOpacity
                  onPress={send}
                  disabled={!title.trim() || sending}
                  activeOpacity={0.85}
                  style={[s.primary, { backgroundColor: colors.accentBg, opacity: !title.trim() || sending ? 0.45 : 1 }]}
                  accessibilityRole="button"
                >
                  {sending ? <ActivityIndicator color={colors.accentFg} /> : <Text style={[s.primaryText, { color: colors.accentFg }]}>Send</Text>}
                </TouchableOpacity>
              </>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  title: { paddingHorizontal: 2, paddingTop: 18 },
  center: { paddingVertical: 56, alignItems: 'center' },
  listWrap: { marginTop: 18 },
  countLine: { fontFamily: fonts.sansMedium, fontSize: 13, paddingHorizontal: 2, marginBottom: 10 },
  societyBody: { marginTop: 10 },
  societyLink: { marginTop: 8 },

  contentRow: { paddingVertical: 14, paddingHorizontal: 16 },
  contentHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  contentTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 21 },
  contentSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  tag: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 10 },
  tagText: { fontFamily: fonts.sansSemiBold, fontSize: 11 },
  bodyWrap: { marginTop: 12 },
  body: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, alignSelf: 'flex-start' },
  linkText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5 },

  progress: { fontFamily: fonts.sansMedium, fontSize: 13, paddingHorizontal: 2, minHeight: 18 },
  groupName: { fontFamily: fonts.serif, fontSize: 20, marginBottom: 8, paddingHorizontal: 2 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 13, paddingHorizontal: 16 },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.6, alignItems: 'center', justifyContent: 'center' },
  checkTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, lineHeight: 21 },

  suggestBtn: { alignSelf: 'center', marginTop: 28, paddingVertical: 10, paddingHorizontal: 16 },
  suggestText: { fontFamily: fonts.sansMedium, fontSize: 14, textDecorationLine: 'underline' },

  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: radius.card + 8, borderTopRightRadius: radius.card + 8, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 34 },
  close: { position: 'absolute', top: 14, right: 14, zIndex: 2, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 24, paddingRight: 36 },
  sheetSub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 16 },
  input: { fontFamily: fonts.sans, fontSize: 15, borderWidth: StyleSheet.hairlineWidth, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 10 },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  error: { fontFamily: fonts.sans, fontSize: 13, marginBottom: 8 },
  primary: { height: 48, borderRadius: radius.button + 4, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  primaryText: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  doneWrap: { paddingTop: 4 },
})
