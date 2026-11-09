import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Linking, Alert,
  Platform, useWindowDimensions, Share, ActivityIndicator, Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Menu, CheckCircle2,
  Bell, Building2, Calculator, Compass, Globe, Heart, BookOpen, FileText, TrendingUp, User, LayoutGrid,
} from 'lucide-react-native'
import { useFocusEffect } from '@react-navigation/native'
import PortalSwitcher from '../components/ui/PortalSwitcher'
import ActiveMemberBadge from '../components/ui/ActiveMemberBadge'
import UBPLogo from '../components/ui/UBPLogo'
import {
  ComposerEntryBar, BuzzStrip,
  FeedPostCard, BuzzingHighlightCard, AdCard, SuggestedProfilesCard, AvatarRing,
} from '../components/feed/FeedKit'
import { SHUFFLED_LIVE_PARTNERS } from '../data/lifestylePartners'
import {
  fetchFeedPage, fetchBuzzingHighlight, fetchActivePlacement,
  fetchMyReactions, setReaction, clearReaction, buildFeedRenderList,
  fetchSuggestedProfiles, fetchSavedPostIds, savePost, unsavePost, DEFAULT_BUZZ_WINDOW,
} from '../lib/feed'
import { fonts, spacing, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { openMenu } from '../navigation/helpers'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { startDirectChat, fetchRoomContextId } from '../lib/directMessaging'

// How many posts a single feed page fetches — both the first load and every
// onEndReached page after it. Real pagination via fetchFeedPage's `before`
// cursor: when a page comes back shorter than this, there's nothing older
// left and the list stops asking, showing a calm "you're all caught up"
// footer instead of ever fabricating more content.
const FEED_PAGE_SIZE = 20

// ── Constants ────────────────────────────────────────────────────────────────

// The 8 app pillars as story rings — fixed, not user-customisable (replaces
// the old editable Quick Access shortcuts entirely). Same action/tabName
// shape handleNav already understands, same destinations as NAV_GROUPS'
// Blueprints/Connect/Tools sections below, just one more presentation of
// them. `grad` is this pillar's own two-stop gradient for its ring/color
// block, since a plain gold ring on every single one would stop reading as
// "special" by the third pillar — gold stays reserved for the brand stories.
const PILLARS = [
  { key: 'foundation', label: 'Foundation', Icon: FileText,   action: 'foundation' },
  { key: 'elevation',  label: 'Elevation',   Icon: TrendingUp, action: 'elevation' },
  { key: 'lifestyle',  label: 'Lifestyle',   Icon: Heart,      action: 'lifestyle' },
  { key: 'campus',     label: 'Campus',      Icon: Building2,  action: 'campus_connect' },
  { key: 'course',     label: 'Course',      Icon: Globe,      action: 'course_connect' },
  { key: 'compass',    label: 'Compass',     Icon: Compass,    action: 'compass' },
  { key: 'budgeting',  label: 'Budgeting',   Icon: Calculator, action: 'budgeting' },
  { key: 'adboard',    label: 'Ad Board',    Icon: BookOpen,  action: 'tab', tabName: 'AdBoard' },
]

// A handful of live Lifestyle partners with real photos on file, shown
// alongside the pillars so the story rail isn't just internal nav — mirrors
// how real story rails mix people/brands. Picked from the same shuffled
// live-partner order "The Collection" uses, filtered to ones with an actual
// hero/logo image (no generic-placeholder rings). Tapping one forwards to
// Lifestyle's existing highlightId deep-link (see LifestyleScreen.jsx),
// same path Elevation's coach cross-links already use — nothing new wired.
const BRAND_STORIES = SHUFFLED_LIVE_PARTNERS
  .filter(p => p.hero || p.logo)
  .slice(0, 6)
  .map(p => ({ key: p.id, label: p.brand, image: p.hero || p.logo, partnerId: p.id }))

// Sidebar nav items — same 8 destinations as before (plus Dashboard),
// grouped into sections (a hairline divider + a tiny group label between
// each) instead of one flat list.
const NAV_GROUPS = [
  {
    label: null, // Dashboard sits alone, above the first divider
    items: [
      { key: 'dashboard', label: 'Dashboard', Icon: LayoutGrid, action: 'home' },
    ],
  },
  {
    label: 'Blueprints',
    items: [
      { key: 'foundation', label: 'Foundation\nBlueprint', Icon: FileText,   action: 'foundation' },
      { key: 'elevation',  label: 'Elevation\nBlueprint',  Icon: TrendingUp, action: 'elevation'  },
      { key: 'lifestyle',  label: 'Lifestyle\nBlueprint',  Icon: Heart,      action: 'lifestyle'  },
    ],
  },
  {
    label: 'Connect',
    items: [
      { key: 'campus', label: 'Campus\nConnect', Icon: Building2, action: 'campus_connect' },
      { key: 'course', label: 'Course\nConnect', Icon: Globe,     action: 'course_connect' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { key: 'compass',   label: 'Compass',   Icon: Compass,    action: 'compass'   },
      { key: 'budgeting', label: 'Budgeting', Icon: Calculator, action: 'budgeting' },
      { key: 'adboard',   label: 'Ad Board',  Icon: BookOpen,  action: 'tab', tabName: 'AdBoard' },
    ],
  },
]

// Flattened — handleNav and anything else that looked items up by key still
// works unchanged against this.
const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items)

// ── Helpers ──────────────────────────────────────────────────────────────────

function getFirstName(displayName) {
  if (!displayName) return 'there'
  return displayName.split(' ')[0]
}

// 05:00–11:59 morning · 12:00–16:59 afternoon · 17:00–22:59 evening · 23:00–04:59 night
function getGreetingWord(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 12)  return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 23) return 'Good evening'
  return 'Good night'
}

// ── Story rail — pillar + brand story rings ─────────────────────────────────
// Replaces the old editable Quick Access row entirely. Fixed set (the 8 app
// pillars, always, plus a few featured partner brands) rather than a
// per-user customisable shortcut list — this is instant nav + a taste of
// what's on the platform, not a second dashboard.
//
// A pillar with no photo gets a bold gradient color-block + icon instead of
// a flat tinted square — every ring has real visual weight whether or not a
// photo exists behind it, the same answer used for Elevation's coaches
// without a headshot. A brand ring shows the partner's actual photo inside
// the same gold "special" ring FeedKit's avatars use — brands are the one
// place on this rail that genuinely earns the premium gold treatment.

function StoryRail({ navigation, onNavigate, colors, isDark }) {
  const styles = storyStyles(colors, isDark)
  // One consistent navy/cream ring for every pillar — no per-pillar
  // rainbow gradient. Brand story rings (below) keep their own gold
  // AvatarRing treatment; that's the one place on this rail gold still
  // earns its "genuinely special" keep.
  const pillarGrad = [colors.surface, colors.surfaceSunk || colors.surfaceAlt]
  function openBrand(partnerId) {
    navigation.navigate('Lifestyle', { highlightId: partnerId })
  }
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {PILLARS.map(item => (
        <TouchableOpacity
          key={item.key}
          style={styles.ringWrap}
          activeOpacity={0.85}
          onPress={() => onNavigate(item)}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <LinearGradient colors={pillarGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pillarRing}>
            <item.Icon size={22} color={colors.textPrimary} strokeWidth={1.9} />
          </LinearGradient>
          <Text style={styles.ringLabel} numberOfLines={1}>{item.label}</Text>
        </TouchableOpacity>
      ))}
      {BRAND_STORIES.map(item => (
        <TouchableOpacity
          key={item.key}
          style={styles.ringWrap}
          activeOpacity={0.85}
          onPress={() => openBrand(item.partnerId)}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <AvatarRing size={60}>
            <Image source={item.image} style={styles.brandImage} resizeMode="cover" />
          </AvatarRing>
          <Text style={styles.ringLabel} numberOfLines={1}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  )
}

function storyStyles(colors, isDark) {
  return StyleSheet.create({
    row: { gap: 14, paddingRight: 4 },
    ringWrap: { alignItems: 'center', width: 64 },
    pillarRing: {
      width: 60, height: 60, borderRadius: 30,
      alignItems: 'center', justifyContent: 'center',
      ...(isDark ? shadows.glowDark : shadows.glow),
    },
    brandImage: { width: 60, height: 60 },
    ringLabel: { fontFamily: fonts.sansMedium, fontSize: 10.5, color: colors.textSecondary, marginTop: 6, textAlign: 'center' },
  })
}

// ── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  // The full-navigation sidebar rail below is a desktop-web-only
  // convenience (a wide browser window has the horizontal room for a
  // persistent nav rail alongside the dashboard content). It duplicates
  // the bottom tab bar, which is the only navigation surface on native —
  // every real phone (Expo Go, dev/prod builds) is Platform.OS !== 'web',
  // so `showSidebar` is always false there regardless of screen width, and
  // on the web build it only appears once the viewport is wide enough to
  // actually be a desktop layout, never at phone width in a mobile browser.
  const { width: windowWidth } = useWindowDimensions()
  const showSidebar = Platform.OS === 'web' && windowWidth >= 900
  const {
    user, isAnyPortalEligible, isHandler, isFounder, isOperations, isBusiness, isFinance,
    studioLabel, isComplimentaryPro, portalMode, setPortalMode,
  } = useAuth()

  // Profile row — full_name (canonical source of truth).
  const [profileRow, setProfileRow] = useState(null)
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (!cancelled) setProfileRow(data || null) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user?.id])

  const fullName  = profileRow?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || ''
  const firstName = getFirstName(fullName)
  const greeting  = getGreetingWord()

  // Dual portal — one tap in the top nav switches My Blueprint <-> the
  // internal-team professional workspace. Landing screen depends on role;
  // a user can only hold one of these at a time in practice, so the first
  // match wins.
  function handlePortalSwitch(mode) {
    setPortalMode(mode)
    if (mode === 'studio') {
      const landing = isHandler ? 'StudioQueue'
        : isFounder ? 'FounderPortal'
        : isOperations ? 'OperationsPortal'
        : isBusiness ? 'PartnerPortalApp'
        : isFinance ? 'FinancePortal'
        : 'CoachStudio'
      // popTo, not navigate: React Navigation v7's navigate() pushes a new
      // instance even if the landing screen is already in the stack (e.g.
      // switching to Studio, back to My Blueprint, then to Studio again),
      // growing the stack every time. popTo pops back to it when present,
      // and pushes it when it isn't — the pre-v7 navigate() behaviour.
      navigation.popTo(landing)
    }
  }

  // Sidebar active key — reset to dashboard whenever this screen regains focus
  const [activeNavKey, setActiveNavKey] = useState('dashboard')
  useFocusEffect(useCallback(() => {
    setActiveNavKey('dashboard')
  }, []))

  // ── Home feed state ────────────────────────────────────────────────────
  // feedPosts grows via real cursor pagination (fetchFeedPage's `before`),
  // never by repeating what's already loaded — see FEED_PAGE_SIZE above and
  // loadMoreFeed below. This replaces the old feedCycles/MAX_FEED_CYCLES
  // re-looping mechanism, which grew the rendered list unboundedly inside a
  // plain ScrollView and was the root cause of the out-of-memory crash after
  // a minute or two of scrolling.
  const [feedPosts, setFeedPosts]           = useState([])
  const [loadingFeed, setLoadingFeed]       = useState(true)
  const [loadingMore, setLoadingMore]       = useState(false)
  const [hasMoreFeed, setHasMoreFeed]       = useState(true)
  const loadingMoreRef = useRef(false)
  const [buzzWindow, setBuzzWindow]         = useState(DEFAULT_BUZZ_WINDOW)
  const [buzzingHighlight, setBuzzingHighlight] = useState(null)
  const [placement, setPlacement]           = useState(null)
  const [myReactions, setMyReactions]       = useState({})
  const [savedPostIds, setSavedPostIds]     = useState(() => new Set())
  const [suggestedProfiles, setSuggestedProfiles] = useState([])
  const [suggestedConnectingId, setSuggestedConnectingId] = useState(null)

  // Load the feed + the one-off placement on mount, and again whenever Home
  // regains focus (so a post made in the Composer, a comment added, or a
  // save toggled elsewhere shows up on return).
  useFocusEffect(useCallback(() => {
    if (!user?.id) { setLoadingFeed(false); return }
    loadFeed()
    fetchActivePlacement().then(setPlacement).catch(() => {})
    fetchSuggestedProfiles(4).then(setSuggestedProfiles).catch(() => {})
  }, [user?.id]))

  // Buzz window changes drive the Buzzing highlight + Campus Pulse only —
  // the main feed itself stays reverse-chronological regardless of window.
  useEffect(() => {
    if (!user?.id) return
    loadBuzzContext(buzzWindow)
  }, [user?.id, buzzWindow])

  async function loadFeed() {
    setLoadingFeed(true)
    setHasMoreFeed(true)
    try {
      const posts = await fetchFeedPage({ limit: FEED_PAGE_SIZE })
      setFeedPosts(posts)
      setHasMoreFeed(posts.length === FEED_PAGE_SIZE)
      const [reactions, savedIds] = await Promise.all([
        fetchMyReactions(posts.map(p => p.id), user.id),
        fetchSavedPostIds(user.id),
      ])
      setMyReactions(reactions)
      setSavedPostIds(new Set(savedIds))
    } catch {}
    finally { setLoadingFeed(false) }
  }

  // Real onEndReached pagination — fetches posts strictly older than the
  // oldest post currently loaded (feed_posts.created_at, via fetchFeedPage's
  // `before`). Never re-shows anything already on screen.
  async function loadMoreFeed() {
    if (loadingMoreRef.current || !hasMoreFeed || loadingFeed || feedPosts.length === 0) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const oldest = feedPosts[feedPosts.length - 1]
      const nextPosts = await fetchFeedPage({ before: oldest.created_at, limit: FEED_PAGE_SIZE })
      if (nextPosts.length === 0) {
        setHasMoreFeed(false)
      } else {
        setFeedPosts(prev => [...prev, ...nextPosts])
        if (nextPosts.length < FEED_PAGE_SIZE) setHasMoreFeed(false)
        const moreReactions = await fetchMyReactions(nextPosts.map(p => p.id), user.id)
        setMyReactions(r => ({ ...r, ...moreReactions }))
      }
    } catch {
      // Leave hasMoreFeed as-is — a transient failure shouldn't permanently
      // show "you're all caught up"; the next onEndReached dwell retries.
    } finally {
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }

  // Suggested profiles' Connect re-plays DirectoryScreen's own "start a
  // direct chat" flow (same RPC/room-context lookup, same nav target), so a
  // connect made from Home lands the person in the exact same place one made
  // from the Directory would.
  async function handleSuggestedConnect(profile) {
    if (suggestedConnectingId) return
    setSuggestedConnectingId(profile.id)
    try {
      const { roomId, blocked, error } = await startDirectChat(profile.id, profile.full_name)
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
          roomName:    profile.full_name || 'Chat',
          subtitle:    null,
          posterId:    profile.id,
          posterName:  profile.full_name,
        },
      })
    } catch {
      Alert.alert('Something went wrong', 'Could not start the conversation. Please try again.')
    } finally {
      setSuggestedConnectingId(null)
    }
  }

  function handleViewSuggestedProfile(profile) {
    navigation.navigate('StudentProfile', { student: profile })
  }

  async function loadBuzzContext(windowId) {
    try {
      const highlight = await fetchBuzzingHighlight(windowId)
      setBuzzingHighlight(highlight)
    } catch {}
  }

  async function handleReact(postId, moodId) {
    if (!user?.id) return
    const prev = myReactions[postId] || null
    setMyReactions(r => ({ ...r, [postId]: moodId }))
    // Optimistic local count bump so the pill updates instantly.
    const delta = (moodId ? 1 : 0) - (prev ? 1 : 0)
    if (delta !== 0) {
      setFeedPosts(posts => posts.map(p => p.id === postId ? { ...p, reaction_count: Math.max(0, p.reaction_count + delta) } : p))
      setBuzzingHighlight(h => h && h.id === postId ? { ...h, reaction_count: Math.max(0, h.reaction_count + delta) } : h)
    }
    try {
      if (moodId) await setReaction(postId, user.id, moodId)
      else await clearReaction(postId, user.id)
    } catch {
      // Best-effort revert on failure
      setMyReactions(r => ({ ...r, [postId]: prev }))
      if (delta !== 0) {
        setFeedPosts(posts => posts.map(p => p.id === postId ? { ...p, reaction_count: Math.max(0, p.reaction_count - delta) } : p))
      }
    }
  }

  function handleCommentPost(post) {
    navigation.navigate('CommentThread', { postId: post.id })
  }

  async function handleSharePost(post) {
    try {
      const text = post.body || 'Check this out on UniBlueprint'
      await Share.share({ message: `${text}\n\nShared from UniBlueprint` })
    } catch { /* cancelled or unavailable — nothing to recover from */ }
  }

  async function handleToggleSave(postId) {
    if (!user?.id) return
    const isSaved = savedPostIds.has(postId)
    setSavedPostIds(prev => {
      const next = new Set(prev)
      if (isSaved) next.delete(postId); else next.add(postId)
      return next
    })
    try {
      if (isSaved) await unsavePost(postId, user.id)
      else await savePost(postId, user.id)
    } catch {
      // Best-effort revert on failure
      setSavedPostIds(prev => {
        const next = new Set(prev)
        if (isSaved) next.add(postId); else next.delete(postId)
        return next
      })
    }
  }

  const feedRenderItems = useMemo(
    () => buildFeedRenderList(feedPosts, { buzzingHighlight, placement, suggestedProfiles }),
    [feedPosts, buzzingHighlight, placement, suggestedProfiles],
  )

  // Unread notification count for the bell badge, kept live via realtime so
  // it clears the moment a notification is read elsewhere and increments the
  // moment a new one lands, without needing to revisit this screen.
  const [unreadCount, setUnreadCount] = useState(0)
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    let channel = null

    async function fetchUnread() {
      const { count } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('read', false)
      if (!cancelled) setUnreadCount(count || 0)
    }

    async function setup() {
      // `supabase.channel(topic)` reuses an existing channel object with the
      // same topic if one is still registered on the client — and
      // `removeChannel()` is async (it awaits a real unsubscribe round trip
      // before deregistering), so a fast unmount/remount of this screen
      // (e.g. tapping the UBP logo, or the tutorial mounting HomeScreen
      // again) can call `.channel()` again before the previous mount's
      // `removeChannel` has actually finished. That returns the OLD,
      // already-subscribed channel instead of a fresh one, and calling
      // `.on('postgres_changes', ...)` on an already-subscribed channel is
      // exactly what throws "cannot add postgres_changes callbacks ...
      // after subscribe()". Defensively finish removing any stale channel
      // with this topic first, so `.channel()` below is guaranteed to
      // create a brand-new, not-yet-subscribed instance — only then do we
      // register `.on()` and call `.subscribe()`.
      const topic = `realtime:unread-badge-${user.id}`
      const stale = supabase.getChannels().find(c => c.topic === topic)
      if (stale) await supabase.removeChannel(stale)
      if (cancelled) return

      await fetchUnread()
      if (cancelled) return

      channel = supabase
        .channel(`unread-badge-${user.id}`)
        .on('postgres_changes', {
          event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`,
        }, fetchUnread)
        .subscribe()
    }
    setup()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [user?.id])

  function handleNav(item) {
    if (!item) return
    if (item.action === 'home') { setActiveNavKey('dashboard'); return }
    setActiveNavKey(item.key)
    if      (item.action === 'foundation')     navigation.navigate('Foundation')
    else if (item.action === 'elevation')      navigation.navigate('Elevation')
    else if (item.action === 'campus_connect') navigation.navigate('CampusConnect')
    else if (item.action === 'course_connect') navigation.navigate('CourseConnect')
    else if (item.action === 'lifestyle')      navigation.navigate('Lifestyle')
    else if (item.action === 'compass')        navigation.navigate('Compass')
    else if (item.action === 'budgeting')      navigation.navigate('Budgeting')
    else if (item.action === 'my_outputs')     navigation.navigate('MyOutputs')
    else if (item.action === 'notifications')  navigation.navigate('Notifications')
    else if (item.action === 'tab')            navigation.getParent()?.navigate(item.tabName)
    else if (item.action === 'external')       Linking.openURL(item.url)
  }

  function renderFeedItem({ item }) {
    if (item.kind === 'post') {
      return (
        <FeedPostCard
          post={item.post}
          myMood={myReactions[item.post.id] || null}
          onReact={handleReact}
          commentCount={item.post.comment_count || 0}
          saved={savedPostIds.has(item.post.id)}
          onComment={handleCommentPost}
          onShare={handleSharePost}
          onToggleSave={handleToggleSave}
        />
      )
    }
    if (item.kind === 'buzzing') {
      return (
        <BuzzingHighlightCard
          post={item.post}
          myMood={myReactions[item.post.id] || null}
          onReact={handleReact}
          commentCount={item.post.comment_count || 0}
          saved={savedPostIds.has(item.post.id)}
          onComment={handleCommentPost}
          onShare={handleSharePost}
          onToggleSave={handleToggleSave}
        />
      )
    }
    if (item.kind === 'ad') {
      return <AdCard placement={item.placement} />
    }
    if (item.kind === 'suggested') {
      return (
        <SuggestedProfilesCard
          profiles={item.profiles}
          connectingId={suggestedConnectingId}
          onConnect={handleSuggestedConnect}
          onViewProfile={handleViewSuggestedProfile}
        />
      )
    }
    return null
  }

  // Header content above the virtualized feed list: Quick Access's slim
  // row, the composer entry bar, This Week's Buzz, and Campus Pulse. All of
  // this scrolls away with the feed (it's FlatList's ListHeaderComponent,
  // not a fixed block), same as it did inside the old ScrollView.
  //
  // Built as a plain element (not a nested function component) and passed
  // to ListHeaderComponent/ListFooterComponent as such: a function defined
  // in the render body gets a new identity every render, and FlatList
  // mounts/unmounts a ListHeaderComponent whose identity changes — which
  // would reset the Quick Access row's own horizontal scroll position on
  // every unrelated re-render (e.g. a single reaction tap). A plain element
  // reconciles normally instead.
  const feedListHeader = (
    <View>
      <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.xl }}>
        <View style={{ marginBottom: 24 }}>
          <StoryRail navigation={navigation} onNavigate={handleNav} colors={colors} isDark={isDark} />
        </View>

        <ComposerEntryBar name={firstName} onPress={() => navigation.navigate('Composer')} />
      </View>

      {/* BuzzStrip carries its own spacing.md horizontal padding internally
          already (see FeedKit.jsx), so it sits directly here without an
          extra wrapper. The old Campus Pulse mood bar that used to live
          here moved to Campus Connect/Course Connect as "Campus Mood"/
          "Course Mood" — see FeedKit's MoodPulse. */}
      <View style={{ paddingHorizontal: spacing.md }}>
        <BuzzStrip selected={buzzWindow} onSelect={setBuzzWindow} />
      </View>

      <View style={{ height: 22 }} />
    </View>
  )

  let feedListFooter = null
  if (loadingMore) {
    feedListFooter = (
      <View style={styles.feedFooterWrap}>
        <ActivityIndicator color={colors.muted} size="small" />
      </View>
    )
  } else if (!hasMoreFeed && feedPosts.length > 0) {
    feedListFooter = (
      <View style={styles.feedFooterWrap}>
        <CheckCircle2 size={15} color={colors.light} strokeWidth={1.8} />
        <Text style={styles.feedFooterText}>You're all caught up</Text>
      </View>
    )
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.layout}>

        {/* ── SIDEBAR RAIL ──
            Desktop-web only (`showSidebar`, defined above) — distinct from
            the wide icon+label drawer opened by the ☰ hamburger
            (SidebarDrawer.jsx, unchanged). Grouped into sections (a hairline
            divider + a tiny group label between each) instead of one flat
            icon stack, same 8 destinations as before — grouping is
            presentation only, nothing added/removed/reordered. */}
        {showSidebar && (
          <View style={styles.sidebar}>
            <View style={styles.sidebarLogoWrap}>
              <UBPLogo height={30} color={colors.cream} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {NAV_GROUPS.map((group, gi) => (
                <View key={group.label || 'top'} style={gi > 0 && styles.navGroupDivider}>
                  {!!group.label && <Text style={styles.navGroupLabel}>{group.label}</Text>}
                  {group.items.map(item => {
                    const isActive = item.key === activeNavKey
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={styles.navItemOuter}
                        activeOpacity={0.65}
                        onPress={() => handleNav(item)}
                      >
                        {isActive && <View style={styles.navHighlight} />}
                        {isActive && <View style={styles.navAccentBar} />}
                        <item.Icon
                          size={20}
                          color={isActive ? colors.cream : 'rgba(245,240,232,0.58)'}
                          strokeWidth={isActive ? 2 : 1.6}
                        />
                        <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── MAIN ── */}
        <View style={styles.main}>

          {/* Topbar */}
          <View style={styles.mainTopBar}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.topTitle} numberOfLines={2}>
                {fullName ? `${firstName}'s Dashboard` : 'Your Dashboard'}
              </Text>
              <Text style={styles.topGreeting} numberOfLines={1}>
                {greeting}, {firstName}
              </Text>
              {isComplimentaryPro && <ActiveMemberBadge style={{ marginTop: 6 }} />}
            </View>
            <View style={styles.topActions}>
              <TouchableOpacity
                style={styles.menuBtn}
                activeOpacity={0.7}
                onPress={() => openMenu(navigation)}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
              >
                <Menu size={19} color={colors.textPrimary} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.bellBtn}
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Notifications')}
                accessibilityRole="button"
                accessibilityLabel={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              >
                <Bell size={19} color={colors.textPrimary} strokeWidth={1.8} />
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.avatarBtn}
                activeOpacity={0.7}
                onPress={() => navigation.getParent()?.navigate('Profile')}
                accessibilityRole="button"
                accessibilityLabel="Open profile"
              >
                <User size={16} color={colors.textPrimary} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Dual portal switcher — Handlers and Coaches only. My Blueprint
              is this screen; switching to Studio hands off to the
              professional workspace, which contains no student-facing
              submission forms. */}
          {isAnyPortalEligible && (
            <View style={styles.portalSwitchRow}>
              <PortalSwitcher
                active={portalMode}
                onSwitch={handlePortalSwitch}
                studioLabel={studioLabel}
              />
            </View>
          )}

          {/* A real virtualized FlatList, not a ScrollView re-looping a
              fixed post array — see FEED_PAGE_SIZE/loadMoreFeed above. Wrapped
              in an extra plain View with an explicit flex:1 as a defensive
              measure against a Fabric/New-Architecture initial-layout race
              (documented pattern already used elsewhere in this app — see
              DirectoryScreen's own scrollView style comment). */}
          <View style={styles.mainScroll}>
            {loadingFeed ? (
              <View style={styles.centerWrap}>
                <ActivityIndicator color={colors.textPrimary} />
              </View>
            ) : (
              <FlatList
                data={feedRenderItems}
                keyExtractor={item => item.key}
                renderItem={renderFeedItem}
                ListHeaderComponent={feedListHeader}
                ListFooterComponent={feedListFooter}
                ListEmptyComponent={
                  <Text style={styles.feedStatusText}>
                    No posts yet. Be the first to share a mood or a snapshot.
                  </Text>
                }
                onEndReached={loadMoreFeed}
                onEndReachedThreshold={0.4}
                contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={Platform.OS !== 'web'}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────

function __gs_styles(colors) {
  return StyleSheet.create({
  screen:  { flex: 1, backgroundColor: colors.chromeBg },
  layout:  { flex: 1, flexDirection: 'row' },

  // Sidebar
  sidebar: {
    width: 84,
    backgroundColor: colors.navy,
    borderRightWidth: 1,
    borderRightColor: 'rgba(245,240,232,0.09)',
  },
  sidebarLogoWrap: {
    paddingTop: 16, paddingBottom: 16, paddingHorizontal: 10,
    alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: 'rgba(245,240,232,0.09)',
  },
  // Grouped sections — a hairline divider + a tiny uppercase group label
  // between each, instead of one flat run of icons.
  navGroupDivider: {
    marginTop: 10, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(245,240,232,0.09)',
  },
  navGroupLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 7.5,
    color: 'rgba(245,240,232,0.32)', letterSpacing: 0.6,
    textTransform: 'uppercase', textAlign: 'center',
    marginBottom: 2,
  },
  navItemOuter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 6,
    position: 'relative',
  },
  navHighlight: {
    position: 'absolute',
    top: 4, left: 8, right: 5, bottom: 4,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  // A gold accent bar on the active item's leading edge — brand-matching,
  // richer than the translucent box alone.
  navAccentBar: {
    position: 'absolute',
    top: 10, bottom: 10, left: 0,
    width: 3, borderRadius: 2,
    backgroundColor: '#C9A24B',
  },
  navLabel: {
    fontFamily: fonts.sans,
    fontSize: 9,
    color: 'rgba(245,240,232,0.5)',
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 12,
  },
  navLabelActive: { color: 'rgba(245,240,232,0.92)' },

  // Main
  main: { flex: 1, backgroundColor: colors.background },
  // The header block below is a normal in-flow sibling ABOVE the feed list,
  // not an absolutely-positioned overlay — so on a correctly measured
  // screen it never needs to fight the list for space. The explicit
  // zIndex/elevation here is defensive, not the primary fix: it guarantees
  // the header still paints above scrolled content on Android even during
  // the brief window before layout has fully resolved (first frame,
  // safe-area insets arriving late, etc.).
  mainTopBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 14,
    backgroundColor: colors.surface,
    // Was a hardcoded light-mode-only navy rgba — invisible against a dark
    // surface, which is why the header had no visible edge in dark mode.
    // colors.divider is theme-aware (cream-tinted in dark, navy-tinted in
    // light) so the header reads as its own distinct zone in both.
    borderBottomWidth: 1, borderBottomColor: colors.divider,
    zIndex: 10, elevation: 10,
  },
  topTitle:    { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary, lineHeight: 27 },
  topGreeting: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted, marginTop: 3 },

  portalSwitchRow: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
    alignItems: 'flex-start',
    zIndex: 9, elevation: 9,
  },

  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  bellBtn: { position: 'relative', width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 3, right: 3,
    minWidth: 15, height: 15, borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { fontFamily: fonts.sansBold, fontSize: 8, color: '#fff' },
  avatarBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.background,
    borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },

  // THE fix for the header floating/overlapping content on native: a
  // FlatList's own `style` sizes its outer, clipped viewport — separate
  // from `contentContainerStyle`. Without an explicit flex (or fixed
  // height) on `style`, native's Yoga layout has no constraint to size the
  // list's own frame against. Always pair contentContainerStyle with an
  // explicit `style={{flex:1}}` (or equivalent) on every scrollable view
  // sitting below a fixed header — see DirectoryScreen.jsx's own
  // `scrollView` for the same note.
  mainScroll: { flex: 1 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },


  // Feed status (loading / empty / "caught up")
  feedStatusText: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
    textAlign: 'center', paddingVertical: 20, paddingHorizontal: spacing.md,
  },
  feedFooterWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 22,
  },
  feedFooterText: { fontFamily: fonts.sans, fontSize: 12, color: colors.light },
  })
}
