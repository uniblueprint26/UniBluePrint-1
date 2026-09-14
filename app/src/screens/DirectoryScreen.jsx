import { useEffect, useMemo, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, X, Menu } from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius } from '../constants/theme'
import { goToHome, openMenu } from '../navigation/helpers'
import { supabase } from '../lib/supabase'
import { INTERESTS } from '../data/interests'

// ── Mock student data ─────────────────────────────────────────────────────────
// `statuses` is a multi-value array — matches what is now collected at sign-up.
// `tags` are interest labels from interests.js — the primary search AND filter
// target (see FILTER PILLS below). Replace with a live Supabase query when
// user profiles themselves are wired to the DB — a separate, bigger call than
// Task #12: it needs its own RLS/visibility decision (today `profiles` only
// allows a user to read their own row; there's no "listed in Directory" or
// real connect-status column yet). This mock roster already uses the same
// interests.js vocabulary as real profiles, so the tag-based filter pills
// below work correctly against it either way.

const STUDENTS = [
  {
    initials: 'AB', avatarBg: '#1E3A5F',
    name: 'Abdullah', course: 'Business and Management', uni: 'ATU Galway',
    statuses: ['open'],
    tags: ['Entrepreneurship', 'Marketing', 'Finance'],
  },
  {
    initials: 'EM', avatarBg: '#0369A1',
    name: 'Eman', course: 'Civil Engineering', uni: 'UCD',
    statuses: ['study'],
    tags: ['Civil Engineering', 'Structural Engineering', 'Construction'],
  },
  {
    initials: 'EP', avatarBg: '#B45309',
    name: 'Emily', course: 'Accounting and Finance', uni: 'DCU',
    statuses: ['open', 'mentor'],
    tags: ['Accounting', 'Finance', 'Economics'],
  },
  {
    initials: 'SO', avatarBg: '#7C3AED',
    name: 'Siofra', course: 'History and Politics', uni: 'UCC',
    statuses: ['mentor'],
    tags: ['Politics', 'Writing', 'Law'],
  },
  {
    initials: 'CL', avatarBg: '#0F766E',
    name: 'Ciarán', course: 'Computer Science', uni: 'UL',
    statuses: ['study'],
    tags: ['Software Dev', 'Web Development', 'AI & Machine Learning'],
  },
  {
    initials: 'NM', avatarBg: '#15803D',
    name: 'Nicole', course: 'Nursing', uni: 'Maynooth University',
    statuses: ['open'],
    tags: ['Nursing', 'Mental Health', 'Physiology'],
  },
  {
    initials: 'SB', avatarBg: '#9D174D',
    name: 'Sienna', course: 'Nursing', uni: 'SETU Waterford',
    statuses: ['study'],
    tags: ['Nursing', 'Physiology', 'Healthcare'],
  },
  {
    initials: 'BA', avatarBg: '#1E3A5F',
    name: 'Basmali', course: 'Computing', uni: 'MTU Cork',
    statuses: ['open'],
    tags: ['Cloud & Infra', 'Networking (IT)', 'Cybersecurity'],
  },
  {
    initials: 'EH', avatarBg: '#C2410C',
    name: 'Ethan', course: 'Sports Science', uni: 'TU Dublin',
    statuses: ['mentor'],
    tags: ['Sports Science', 'Fitness', 'Coaching'],
  },
  {
    initials: 'FO', avatarBg: '#0369A1',
    name: 'Fola', course: 'Marketing and Digital Media', uni: 'DCU',
    statuses: ['open', 'study'],
    tags: ['Marketing', 'UX & Design', 'Entrepreneurship'],
  },
  {
    initials: 'RK', avatarBg: '#15803D',
    name: 'Róisín', course: 'Psychology', uni: 'UCD',
    statuses: ['study'],
    tags: ['Psychology', 'Mental Health', 'Social Work'],
  },
  {
    initials: 'JS', avatarBg: '#7C3AED',
    name: 'James', course: 'Electrical Engineering', uni: 'TU Dublin',
    statuses: ['open'],
    tags: ['Electrical Engineering', 'Electrical', 'Software Dev'],
  },
  {
    initials: 'AO', avatarBg: '#B45309',
    name: 'Aoife', course: 'Law', uni: 'TCD',
    statuses: ['mentor'],
    tags: ['Law', 'Politics', 'Sociology'],
  },
  {
    initials: 'KN', avatarBg: '#C2410C',
    name: 'Kofi', course: 'Data Science and Analytics', uni: 'UCC',
    statuses: ['open', 'study'],
    tags: ['Data Science', 'AI & Machine Learning', 'Economics'],
  },
]

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  open:   { color: '#166534', bg: 'rgba(22,101,52,0.08)',   border: 'rgba(22,101,52,0.14)',   label: 'Open to Connect' },
  study:  { color: '#1d4ed8', bg: 'rgba(29,78,216,0.07)',   border: 'rgba(29,78,216,0.14)',   label: 'Looking for Study Group' },
  mentor: { color: '#6d28d9', bg: 'rgba(109,40,217,0.07)', border: 'rgba(109,40,217,0.14)',  label: 'Happy to Mentor' },
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

// Cold-start fallback ONLY — used while real `profiles.interests` usage is
// still zero across the whole user base (a brand new product has no
// popularity signal yet, same situation Course Connect's own tool-ranking
// falls back to a fixed order for when its activity counts are 0). Derived
// from the tags actually present on this screen's own listed people, not a
// separate hardcoded vocabulary, and stops being used the instant real
// get_popular_interests() usage exists.
function topTagsFromRoster(students, limit) {
  const counts = new Map()
  for (const s of students) {
    for (const tag of s.tags) counts.set(tag, (counts.get(tag) || 0) + 1)
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([tag]) => tag)
}

// ── StudentCard ───────────────────────────────────────────────────────────────

function StudentCard({ student, searchQuery }) {
  const q = searchQuery.trim().toLowerCase()

  return (
    <Card style={styles.studentCard}>
      <View style={styles.cardHead}>
        <View style={[styles.avatar, { backgroundColor: student.avatarBg }]}>
          <Text style={styles.avatarText}>{student.initials}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.cardName}>{student.name}</Text>
          <Text style={styles.cardCourse} numberOfLines={1}>{student.course}</Text>
          <Text style={styles.cardUni} numberOfLines={1}>{student.uni}</Text>
        </View>
      </View>

      {/* Status badges — show all statuses the user is available for */}
      <View style={styles.statusRow}>
        {student.statuses.map(s => {
          const st = STATUS_STYLES[s]
          return (
            <View
              key={s}
              style={[styles.statusBadge, { backgroundColor: st.bg, borderColor: st.border }]}
            >
              <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
            </View>
          )
        })}
      </View>

      {/* Interest tags — highlighted when matched by search */}
      <View style={styles.tagRow}>
        {student.tags.map(tag => {
          const matched = q && tag.toLowerCase().includes(q)
          return (
            <View key={tag} style={[styles.tag, matched && styles.tagMatched]}>
              <Text style={[styles.tagText, matched && styles.tagTextMatched]}>{tag}</Text>
            </View>
          )
        })}
      </View>

      <TouchableOpacity
        style={styles.connectBtn}
        activeOpacity={0.8}
        onPress={() => Alert.alert(
          student.name,
          `Full profiles and direct connections are coming soon. You will be able to connect with ${student.name} through the app.`,
          [{ text: 'Got it' }]
        )}
      >
        <Text style={styles.connectBtnText}>View Profile</Text>
      </TouchableOpacity>
    </Card>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function DirectoryScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')

  // Real, dynamic tag popularity — see the block above FILTERS constants.
  const [popularTags, setPopularTags] = useState([])
  const [tagsLoading, setTagsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase.rpc('get_popular_interests', { limit_count: RPC_FETCH_LIMIT })
        if (error) throw error
        if (!cancelled) setPopularTags(mergePopularityRows(data || []))
      } catch {
        // Network/RPC failure — fall through to the roster-derived fallback below
        // rather than showing broken/empty pills.
        if (!cancelled) setPopularTags([])
      } finally {
        if (!cancelled) setTagsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const fallbackTags = useMemo(() => topTagsFromRoster(STUDENTS, POPULAR_TAG_LIMIT), [])

  // While the real query is in flight, show only "All" — never a flash of
  // empty or fake-looking pills. Once it resolves: real popular tags if any
  // exist, otherwise the roster-derived cold-start fallback.
  const tagFilters = tagsLoading ? [] : (popularTags.length > 0 ? popularTags : fallbackTags)
  const FILTERS = useMemo(
    () => [{ key: 'All', label: 'All' }, ...tagFilters.map(t => ({ key: t, label: t }))],
    [tagFilters]
  )

  const q = search.trim().toLowerCase()

  const filtered = STUDENTS.filter(s => {
    // Filter pill: check if the student has the selected interest tag
    // (case-insensitive — custom-typed interests can differ in casing from
    // the predefined vocabulary).
    const matchFilter =
      filter === 'All' ||
      s.tags.some(tag => tag.toLowerCase() === filter.toLowerCase())

    // Search: match name, course, university, OR any interest tag
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.course.toLowerCase().includes(q) ||
      s.uni.toLowerCase().includes(q) ||
      s.tags.some(tag => tag.toLowerCase().includes(q))

    return matchFilter && matchSearch
  })

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <UBPLogo height={33} color={colors.cream} onPress={() => goToHome(navigation)} />
        <TouchableOpacity
          onPress={() => openMenu(navigation)}
          style={styles.menuBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Menu size={20} color={colors.cream} />
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
        {/* Result count + search context */}
        <View style={styles.resultMeta}>
          <Text style={styles.resultCount}>
            {filtered.length} {filtered.length === 1 ? 'person' : 'people'}
            {q ? ` matching "${search}"` : ''}
          </Text>
          {filtered.length === 0 && (
            <Text style={styles.noResultSub}>
              {q
                ? 'No one matches that search yet. More people join every week.'
                : 'No one has that interest set yet. More people join every week.'}
            </Text>
          )}
        </View>

        {filtered.map((s, i) => (
          <StudentCard key={i} student={s} searchQuery={search} />
        ))}
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  topBar: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },

  headingWrap: { paddingHorizontal: spacing.md, paddingTop: 18, paddingBottom: 10 },
  screenTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy },
  screenSub:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 4, lineHeight: 19 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md, marginBottom: 10,
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.navy, padding: 0 },

  filterRow: { paddingHorizontal: spacing.md, paddingBottom: 14, gap: 8 },
  filterPill: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: colors.white,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
  },
  filterPillActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  filterText:       { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.navy },
  filterTextActive: { color: colors.cream },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed header on native.
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: spacing.md, paddingTop: 4 },

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
  cardName:   { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  cardCourse: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2 },
  cardUni:    { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 1 },

  // Status badges (row, multi-value)
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  statusBadge: {
    borderRadius: 6, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusText: { fontFamily: fonts.sansMedium, fontSize: 12 },

  // Interest tags
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  tag: {
    backgroundColor: colors.cream, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)',
  },
  tagMatched: {
    backgroundColor: colors.navy, borderColor: colors.navy,
  },
  tagText: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  tagTextMatched: { color: colors.cream },

  connectBtn: {
    backgroundColor: colors.navy, borderRadius: 8,
    paddingVertical: 10, alignItems: 'center',
  },
  connectBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.cream },
})
