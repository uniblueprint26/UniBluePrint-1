import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, X, Menu } from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { fonts, spacing, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { goToHome, openMenu } from '../navigation/helpers'
import { supabase } from '../lib/supabase'
import { INTERESTS } from '../data/interests'
import { useAuth } from '../context/AuthContext'
import { useInterests } from '../hooks/useInterests'
import { STATUS_LABEL_BY_KEY } from '../constants/directory'
import { rankDirectoryCandidates } from '../lib/directoryRanking'
import { startDirectChat, fetchRoomContextId } from '../lib/directMessaging'

// ── Real Directory candidate feed ────────────────────────────────────────────
// Replaces the fully-fabricated STUDENTS array this screen used to render.
// Candidates come from get_directory_profiles() (see the
// 20261012110000_directory_discovery migration) — a security-definer RPC
// that is the ONLY path to another user's Directory data. It already
// enforces, at the database level, every privacy rule this screen must
// respect: only discoverable = true profiles, never the caller themselves,
// and never anyone in a mutual block relationship with the caller (either
// direction). This screen does not — and cannot — loosen any of that; it
// only ranks and displays whatever rows the function hands back.
async function fetchDirectoryCandidates() {
  const { data, error } = await supabase.rpc('get_directory_profiles')
  return { candidates: data || [], error }
}

// ── Status config ─────────────────────────────────────────────────────────────
// Keyed by the same STATUS_OPTIONS keys collected at sign-up and editable
// later from Profile > Directory Profile (see constants/directory.js).

const STATUS_STYLES = {
  open:   { color: '#166534', bg: 'rgba(22,101,52,0.08)',   border: 'rgba(22,101,52,0.14)' },
  study:  { color: '#1d4ed8', bg: 'rgba(29,78,216,0.07)',   border: 'rgba(29,78,216,0.14)' },
  mentor: { color: '#6d28d9', bg: 'rgba(109,40,217,0.07)', border: 'rgba(109,40,217,0.14)' },
}

// ── Avatar colour ─────────────────────────────────────────────────────────────
// Real profiles have no per-user colour the way the old mock roster did —
// derive a stable one from the person's id so the same person always gets
// the same colour across renders/sessions, without needing a stored field.
const AVATAR_COLORS = [
  '#1E3A5F', '#0369A1', '#B45309', '#7C3AED', '#0F766E',
  '#15803D', '#9D174D', '#C2410C',
]

function avatarColorFor(id) {
  const str = String(id || '')
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

function initialsFor(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts.slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Dynamic tag filter pills (Task #12) ────────────────────────────────────
// Filter pills are no longer a fixed list. The SET of interest tags shown is
// generated from real usage: get_popular_interests() (see migration
// 20260915120000_popular_interests_rpc.sql) aggregates the real
// `profiles.interests` column — added by the shared interest-tag system
// (data/interests.js + hooks/useInterests.js) — across every real profile
// and hands back only (label, usage_count), no per-user data, so this can
// run without loosening that table's own-row-only read policy. Whatever
// tags real users have actually picked or typed, most-used first, is what
// shows here — the list genuinely grows and reorders as more people set
// interests through Course Connect, Profile Settings, or Sign-Up.
const POPULAR_TAG_LIMIT = 8
const RPC_FETCH_LIMIT = 24 // fetched pre-merge, so case-variant merging (below) rarely leaves fewer than POPULAR_TAG_LIMIT

// Case-insensitive label -> canonical predefined casing, so a custom-typed
// "software dev" and the predefined "Software Dev" count as the same tag and
// display with the vocabulary's real label.
const PREDEFINED_LABEL_BY_LOWER = new Map(INTERESTS.map(i => [i.label.toLowerCase(), i.label]))

function mergePopularityRows(rows) {
  const counts = new Map() // canonical label -> summed usage_count
  for (const row of rows) {
    const raw = String(row?.label || '').trim()
    if (!raw) continue
    const canonical = PREDEFINED_LABEL_BY_LOWER.get(raw.toLowerCase()) || raw
    counts.set(canonical, (counts.get(canonical) || 0) + Number(row?.usage_count || 0))
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, POPULAR_TAG_LIMIT)
    .map(([label]) => label)
}

// Cold-start fallback ONLY — used while get_popular_interests() usage is
// still zero across the whole user base. Derived from the tags actually
// present on the real candidates this screen just fetched, not a separate
// hardcoded vocabulary, and stops being used the instant real popularity
// usage exists.
function topTagsFromCandidates(candidates, limit) {
  const counts = new Map()
  for (const c of candidates) {
    for (const tag of (c.interests || [])) counts.set(tag, (counts.get(tag) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag)
}

// ── StudentCard ───────────────────────────────────────────────────────────────

function StudentCard({ student, searchQuery, onConnect, connecting }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const q = searchQuery.trim().toLowerCase()
  const tags = student.interests || []
  const statuses = student.statuses || []

  return (
    <Card style={styles.studentCard}>
      <View style={styles.cardHead}>
        <View style={[styles.avatar, { backgroundColor: avatarColorFor(student.id) }]}>
          <Text style={styles.avatarText}>{initialsFor(student.full_name)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardName}>{student.full_name || 'UniBlueprint Student'}</Text>
          {!!student.course && <Text style={styles.cardCourse} numberOfLines={1}>{student.course}</Text>}
          {!!student.institution && <Text style={styles.cardUni} numberOfLines={1}>{student.institution}</Text>}
        </View>
      </View>

      {!!student.bio && <Text style={styles.cardBio}>{student.bio}</Text>}

      {/* Status badges — show all statuses the user is available for */}
      {statuses.length > 0 && (
        <View style={styles.statusRow}>
          {statuses.map(s => {
            const st = STATUS_STYLES[s]
            if (!st) return null
            return (
              <View key={s} style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}>
                <Text style={[styles.statusText, { color: st.color }]}>{STATUS_LABEL_BY_KEY[s] || s}</Text>
              </View>
            )
          })}
        </View>
      )}

      {/* Interest tags — highlighted when matched by search */}
      {tags.length > 0 && (
        <View style={styles.tagRow}>
          {tags.map(tag => {
            const matched = q && tag.toLowerCase().includes(q)
            return (
              <View key={tag} style={[styles.tag, matched && styles.tagMatched]}>
                <Text style={[styles.tagText, matched && styles.tagTextMatched]}>{tag}</Text>
              </View>
            )
          })}
        </View>
      )}

      {/* Match reasons — a short, human-readable breakdown of why this
          candidate was ranked where it was (see lib/directoryRanking.js).
          Keeps the relevance ranking auditable rather than an opaque order. */}
      {student._matchReasons?.length > 0 && (
        <Text style={styles.matchReasons}>{student._matchReasons.join(' · ')}</Text>
      )}

      <Button
        label={connecting ? 'Connecting…' : 'Connect'}
        onPress={() => onConnect(student)}
        variant="primary"
        loading={connecting}
        disabled={connecting}
        style={styles.connectBtn}
      />
    </Card>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function DirectoryScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { profile } = useAuth()
  const { interests: viewerInterests } = useInterests()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [connectingId, setConnectingId] = useState(null)

  // Real candidate feed — see fetchDirectoryCandidates() above.
  const [candidates, setCandidates] = useState([])
  const [candidatesLoading, setCandidatesLoading] = useState(true)
  const [candidatesError, setCandidatesError] = useState(false)

  // Real, dynamic tag popularity — see the block above FILTERS constants.
  const [popularTags, setPopularTags] = useState([])
  const [tagsLoading, setTagsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCandidatesLoading(true)
      setCandidatesError(false)
      const { candidates: rows, error } = await fetchDirectoryCandidates()
      if (cancelled) return
      if (error) setCandidatesError(true)
      setCandidates(rows)
      setCandidatesLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase.rpc('get_popular_interests', { limit_count: RPC_FETCH_LIMIT })
        if (error) throw error
        if (!cancelled) setPopularTags(mergePopularityRows(data || []))
      } catch {
        // Network/RPC failure — fall through to the candidate-derived fallback
        // below rather than showing broken/empty pills.
        if (!cancelled) setPopularTags([])
      } finally {
        if (!cancelled) setTagsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const fallbackTags = useMemo(
    () => topTagsFromCandidates(candidates, POPULAR_TAG_LIMIT),
    [candidates]
  )

  // While the real query is in flight, show only "All" — never a flash of
  // empty or fake-looking pills. Once it resolves: real popular tags if any
  // exist, otherwise the candidate-derived cold-start fallback.
  const tagFilters = tagsLoading ? [] : (popularTags.length > 0 ? popularTags : fallbackTags)
  const FILTERS = useMemo(
    () => [{ key: 'All', label: 'All' }, ...tagFilters.map(t => ({ key: t, label: t }))],
    [tagFilters]
  )

  // Viewer's own profile fields — read via the normal own-row profiles
  // policy (AuthContext.profile / useInterests), never the Directory RPC.
  // Used ONLY to score relevance client-side; the privacy boundary is
  // get_directory_profiles() on the server, not this.
  const viewer = useMemo(() => ({
    interests:     viewerInterests,
    course:        profile?.course || '',
    year_of_study: profile?.year_of_study || '',
    institution:   profile?.institution || '',
  }), [viewerInterests, profile?.course, profile?.year_of_study, profile?.institution])

  const ranked = useMemo(
    () => rankDirectoryCandidates(viewer, candidates),
    [viewer, candidates]
  )

  const q = search.trim().toLowerCase()

  const filtered = ranked.filter(s => {
    const tags = s.interests || []
    // Filter pill: check if the candidate has the selected interest tag
    // (case-insensitive — custom-typed interests can differ in casing from
    // the predefined vocabulary).
    const matchFilter =
      filter === 'All' ||
      tags.some(tag => tag.toLowerCase() === filter.toLowerCase())

    // Search: match name, course, institution, OR any interest tag
    const matchSearch =
      !q ||
      String(s.full_name || '').toLowerCase().includes(q) ||
      String(s.course || '').toLowerCase().includes(q) ||
      String(s.institution || '').toLowerCase().includes(q) ||
      tags.some(tag => tag.toLowerCase().includes(q))

    return matchFilter && matchSearch
  })

  async function handleConnect(student) {
    if (connectingId) return
    setConnectingId(student.id)
    try {
      const { roomId, blocked, error } = await startDirectChat(student.id, student.full_name)
      if (blocked) {
        Alert.alert("Can't start this conversation", "This conversation isn't available right now.")
        return
      }
      if (error || !roomId) throw error || new Error('No room id returned')

      const { contextId } = await fetchRoomContextId(roomId)
      if (!contextId) throw new Error('Could not resolve the new conversation.')

      navigation.getParent()?.navigate('Messages', {
        screen: 'ChatRoom',
        params: {
          contextType: 'direct',
          contextId,
          roomName:    student.full_name || 'Chat',
          subtitle:    null,
          posterId:    student.id,
          posterName:  student.full_name,
        },
      })
    } catch {
      Alert.alert('Something went wrong', 'Could not start the conversation. Please try again.')
    } finally {
      setConnectingId(null)
    }
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <UBPLogo height={33} color={colors.chromeFg} onPress={() => goToHome(navigation)} />
        <TouchableOpacity
          onPress={() => openMenu(navigation)}
          style={styles.menuBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Menu size={20} color={colors.chromeFg} />
        </TouchableOpacity>
      </View>

      <View style={styles.headingWrap}>
        <Text style={styles.screenTitle}>Directory</Text>
        <Text style={styles.screenSub}>
          Search by name, course, or any interest area
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchWrap}>
        <Search size={15} color={colors.muted} strokeWidth={2} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Try 'marketing', 'nursing', 'software'..."
          placeholderTextColor={colors.light}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {search.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearch('')}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <X size={14} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        style={{ flexGrow: 0 }}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            activeOpacity={0.75}
            onPress={() => setFilter(f.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: filter === f.key }}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {candidatesLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.textPrimary} />
          </View>
        ) : candidatesError ? (
          <View style={styles.resultMeta}>
            <Text style={styles.noResultSub}>
              Could not load the Directory right now. Please try again shortly.
            </Text>
          </View>
        ) : (
          <>
            {/* Result count + search context */}
            <View style={styles.resultMeta}>
              <Text style={styles.resultCount}>
                {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
                {q ? ` matching "${search}"` : ''}
              </Text>
              {filtered.length === 0 && (
                <Text style={styles.noResultSub}>
                  {candidates.length === 0
                    ? 'No one is discoverable in the Directory yet. More people join every week.'
                    : q
                      ? 'No one matches that search yet. More people join every week.'
                      : 'No one has that interest set yet. More people join every week.'}
                </Text>
              )}
            </View>

            {filtered.map(s => (
              <StudentCard
                key={s.id}
                student={s}
                searchQuery={search}
                onConnect={handleConnect}
                connecting={connectingId === s.id}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  topBar: {
    backgroundColor: colors.chromeBg,
    paddingHorizontal: spacing.md,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  headingWrap: { paddingHorizontal: spacing.md, paddingTop: 18, paddingBottom: 10 },
  screenTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.textPrimary },
  screenSub:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md, marginBottom: 10,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, padding: 0 },

  filterRow: { paddingHorizontal: spacing.md, paddingBottom: 14, gap: 8 },
  filterPill: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
  },
  filterPillActive: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  filterText:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textPrimary },
  filterTextActive: { color: colors.accentFg },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed header on native.
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: 4 },

  loadingWrap: { paddingVertical: 48, alignItems: 'center' },

  resultMeta: { marginBottom: 12 },
  resultCount: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },
  noResultSub: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
    marginTop: 6, lineHeight: 19,
  },

  studentCard:  { padding: 18, marginBottom: 12 },
  cardHead:     { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarText: { fontFamily: fonts.serif, fontSize: 18, color: '#fff' },
  cardName:   { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
  cardCourse: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  cardUni:    { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 1 },
  cardBio:    { fontFamily: fonts.sans, fontSize: 13, color: colors.textPrimary, lineHeight: 18, marginBottom: 12 },

  // Status badges (row, multi-value)
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  statusBadge: {
    borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusText: { fontFamily: fonts.sansMedium, fontSize: 12 },

  // Interest tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  tag: {
    backgroundColor: colors.surfaceAlt, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  tagMatched: {
    backgroundColor: colors.accentBg, borderColor: colors.accentBg,
  },
  tagText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  tagTextMatched: { color: colors.accentFg },

  matchReasons: {
    fontFamily: fonts.sans, fontSize: 11, color: colors.light,
    marginBottom: 12,
  },

  connectBtn: { marginTop: 2 },
  })
}
