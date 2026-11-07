import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronLeft, CalendarDays, GraduationCap, Tag, MessageCircle } from 'lucide-react-native'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { supabase } from '../lib/supabase'

// ── Account Overview ──────────────────────────────────────────────────────────
// DirectoryScreen's roster is still mock data (STUDENTS, no real auth.users
// id), so there is no real profiles row to join against for most people
// opened from Directory today. This screen is written to use the real
// profiles row (created_at, user_type, university_or_field) whenever a real
// id is ever passed in — e.g. once Directory is wired to live profiles — and
// falls back to the mock student's own course/uni/status fields otherwise,
// clearly labelled either way rather than inventing a join date or stats
// that don't exist.

function formatJoinDate(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('en-IE', { month: 'long', year: 'numeric' })
  } catch {
    return null
  }
}

function AccountOverview({ student, profile, statsLoading, postCount }) {
  const joinDate = profile?.created_at ? formatJoinDate(profile.created_at) : null

  return (
    <View style={styles.overviewCard}>
      <Text style={styles.sectionLabel}>Account Overview</Text>

      <View style={styles.overviewRow}>
        <View style={styles.overviewIcon}><CalendarDays size={15} color={colors.navy} strokeWidth={1.8} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overviewLabel}>Member since</Text>
          <Text style={styles.overviewValue}>
            {joinDate || 'Not available yet — this profile isn\'t linked to a live account'}
          </Text>
        </View>
      </View>

      <View style={styles.overviewRow}>
        <View style={styles.overviewIcon}><GraduationCap size={15} color={colors.navy} strokeWidth={1.8} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overviewLabel}>Programme</Text>
          <Text style={styles.overviewValue}>
            {profile?.university_or_field || `${student.course} · ${student.uni}`}
          </Text>
        </View>
      </View>

      <View style={styles.overviewRow}>
        <View style={styles.overviewIcon}><Tag size={15} color={colors.navy} strokeWidth={1.8} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.overviewLabel}>Status</Text>
          <Text style={styles.overviewValue}>{student.statuses.map(s => STATUS_LABEL[s] || s).join(' · ')}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{statsLoading ? '—' : postCount}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statTile}>
          <Text style={styles.statValue}>{student.tags.length}</Text>
          <Text style={styles.statLabel}>Interests</Text>
        </View>
      </View>
    </View>
  )
}

const STATUS_LABEL = {
  open: 'Open to Connect',
  study: 'Looking for Study Group',
  mentor: 'Happy to Mentor',
}

// ── Their Posts ───────────────────────────────────────────────────────────────
// Reads the real `posts` table (board_id, user_id, content, created_at —
// see supabase/migrations/..._4eb046fc..., the Campus Connect boards table).
// A separate, parallel "Home Feed" build may introduce its own
// threads/posts table around the same time as this one ships; either way,
// this is queried defensively (try/catch, check for data) so a missing
// table, a renamed column, or simply zero rows all land on the same clean
// "No posts yet" empty state rather than an error.
function PostsSection({ userId }) {
  const [state, setState] = useState({ loading: true, posts: [], unavailable: false })

  useEffect(() => {
    let cancelled = false
    async function load() {
      if (!userId) { if (!cancelled) setState({ loading: false, posts: [], unavailable: false }); return }
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('id, content, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        if (cancelled) return
        if (error) { setState({ loading: false, posts: [], unavailable: true }); return }
        setState({ loading: false, posts: data || [], unavailable: false })
      } catch {
        if (!cancelled) setState({ loading: false, posts: [], unavailable: true })
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>Their Posts</Text>
      {state.loading ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator color={colors.navy} />
        </View>
      ) : state.posts.length === 0 ? (
        <View style={styles.emptyPostsCard}>
          <MessageCircle size={20} color={colors.light} strokeWidth={1.6} />
          <Text style={styles.emptyPostsText}>No posts yet</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {state.posts.map(p => (
            <View key={p.id} style={styles.postCard}>
              <Text style={styles.postContent} numberOfLines={4}>{p.content}</Text>
              <Text style={styles.postDate}>{formatJoinDate(p.created_at)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}

export default function StudentProfileScreen({ route, navigation }) {
  const insets = useSafeAreaInsets()
  const { student } = route.params
  // DirectoryScreen's current roster is mock data with no real auth user id;
  // `student.userId`, if ever present, is where a real one would be passed.
  const userId = student.userId || null

  const [profile, setProfile] = useState(null)
  const [statsLoading, setStatsLoading] = useState(!!userId)
  const [postCount, setPostCount] = useState(0)

  useEffect(() => {
    if (!userId) { setStatsLoading(false); return }
    let cancelled = false
    async function load() {
      const [profileRes, postsRes] = await Promise.allSettled([
        supabase.from('profiles').select('created_at, university_or_field').eq('id', userId).maybeSingle(),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      ])
      if (cancelled) return
      if (profileRes.status === 'fulfilled' && profileRes.value.data) setProfile(profileRes.value.data)
      if (postsRes.status === 'fulfilled' && typeof postsRes.value.count === 'number') setPostCount(postsRes.value.count)
      setStatsLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
          <Text style={styles.backBtnText}>Directory</Text>
        </TouchableOpacity>
        <View style={[styles.avatar, { backgroundColor: student.avatarBg }]}>
          <Text style={styles.avatarText}>{student.initials}</Text>
        </View>
        <Text style={styles.headerName}>{student.name}</Text>
        <Text style={styles.headerSub}>Studying {student.course} at {student.uni}</Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>
        <AccountOverview student={student} profile={profile} statsLoading={statsLoading} postCount={postCount} />

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Interests</Text>
          <View style={styles.tagRow}>
            {student.tags.map(tag => (
              <View key={tag} style={styles.tag}><Text style={styles.tagText}>{tag}</Text></View>
            ))}
          </View>
        </View>

        <PostsSection userId={userId} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },
  header: { backgroundColor: colors.navy, paddingHorizontal: spacing.md, paddingBottom: 28, alignItems: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', marginBottom: 20 },
  backBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(245,240,232,0.2)' },
  avatarText: { fontFamily: fonts.serif, fontSize: 26, color: '#fff' },
  headerName: { fontFamily: fonts.serif, fontSize: 24, color: colors.cream, marginTop: 14 },
  headerSub: { fontFamily: fonts.sans, fontSize: 12.5, color: 'rgba(245,240,232,0.72)', marginTop: 4, textAlign: 'center' },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  section: { marginTop: spacing.xl },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },

  overviewCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: 18, borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)', ...shadows.card },
  overviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  overviewIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(30,58,95,0.06)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  overviewLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.muted },
  overviewValue: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.navy, marginTop: 2, lineHeight: 18 },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  statTile: { flex: 1, backgroundColor: colors.cream, borderRadius: radius.button, paddingVertical: 12, alignItems: 'center' },
  statValue: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy },
  statLabel: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted, marginTop: 2 },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { backgroundColor: colors.white, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(30,58,95,0.1)' },
  tagText: { fontFamily: fonts.sans, fontSize: 12, color: colors.navy },

  emptyPostsCard: {
    backgroundColor: colors.white, borderRadius: radius.card, padding: 28,
    alignItems: 'center', gap: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(30,58,95,0.12)',
  },
  emptyPostsText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },

  postCard: { backgroundColor: colors.white, borderRadius: radius.card, padding: 14, borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)', ...shadows.card },
  postContent: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.navy, lineHeight: 20 },
  postDate: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.light, marginTop: 8 },
})
