import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, Linking, Alert,
  Platform, useWindowDimensions, Share, ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import {
  MessageSquare, Users, Menu, CheckCircle, LayoutGrid,
  FileText, Plus, X, CheckCircle2,
  Bell, Building2, Calculator, Compass, Globe, Heart, Megaphone, TrendingUp, User,
} from 'lucide-react-native'
import { useFocusEffect } from '@react-navigation/native'
import PortalSwitcher from '../components/ui/PortalSwitcher'
import ActiveMemberBadge from '../components/ui/ActiveMemberBadge'
import DestinationPickerModal from '../components/home/DestinationPickerModal'
import UBPLogo from '../components/ui/UBPLogo'
import {
  ComposerEntryBar, BuzzStrip, CampusPulse,
  FeedPostCard, BuzzingHighlightCard, AdCard, SuggestedProfilesCard,
} from '../components/feed/FeedKit'
import {
  fetchFeedPage, fetchBuzzingHighlight, fetchCampusPulse, fetchActivePlacement,
  fetchMyReactions, setReaction, clearReaction, buildFeedRenderList,
  fetchSuggestedProfiles, fetchSavedPostIds, savePost, unsavePost, DEFAULT_BUZZ_WINDOW,
} from '../lib/feed'
import { fonts, spacing } from '../constants/theme'
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

const DEFAULT_SHORTCUTS = ['foundation', 'my_outputs', 'find_coach', 'campus']
const MAX_SHORTCUTS = 4

// Every destination the Quick Access "+" picker can offer. `label` is the
// canonical name shown in the picker; `homeLabel`/`homeSub`/`homeIcon` let a
// destination present differently as a Quick Access card (e.g. Foundation
// Blueprint shows as "Submit a Service" there) without being a separate,
// confusing entry in the picker itself.
const ALL_SHORTCUTS = [
  { key: 'foundation',    label: 'Foundation Blueprint', sub: 'CVs, cover letters, statements', Icon: FileText,      bg: '#EFF6FF', action: 'foundation',
    homeLabel: 'Submit a Service', homeSub: 'Order a Foundation Blueprint service' },
  { key: 'elevation',     label: 'Elevation Blueprint',  sub: 'Coaching and mentorship',        Icon: TrendingUp,    bg: '#F0FDF4', action: 'elevation' },
  { key: 'lifestyle',     label: 'Lifestyle Blueprint',  sub: 'Deals and mental health',        Icon: Heart,         bg: '#FDF4FF', action: 'lifestyle' },
  { key: 'campus',        label: 'Campus Connect',       sub: 'Boards, events, carpooling',     Icon: MessageSquare, bg: '#FFF7ED', action: 'campus_connect',
    homeLabel: 'Campus Board', homeSub: 'See what campus is talking about' },
  { key: 'course',        label: 'Course Connect',       sub: 'Notes and study groups',         Icon: Globe,         bg: '#F0F9FF', action: 'course_connect' },
  { key: 'compass',       label: 'Course Compass',       sub: 'Course guidance tools',          Icon: Compass,       bg: '#F5F0E8', action: 'compass' },
  { key: 'budgeting',     label: 'Budgeting',            sub: 'Budget tools and SUSI guide',    Icon: Calculator,    bg: '#F0FDF4', action: 'budgeting' },
  { key: 'adboard',       label: 'Ad Board',             sub: 'Weekly magazine, blog, and marketplace', Icon: Megaphone, bg: '#FFF7ED', action: 'tab', tabName: 'AdBoard' },
  { key: 'my_outputs',    label: 'My Outputs',           sub: 'Your completed documents',       Icon: CheckCircle,   bg: '#ECFDF5', action: 'my_outputs' },
  { key: 'find_coach',    label: 'Find a Coach',         sub: 'Book time with a coach',         Icon: Users,         bg: '#EFF6FF', action: 'elevation' },
  { key: 'messages',      label: 'Messages',             sub: 'Direct messages',                Icon: MessageSquare, bg: '#F0F9FF', action: 'tab', tabName: 'Messages' },
  { key: 'directory',     label: 'Directory',            sub: 'People directory',               Icon: Users,         bg: '#EFF6FF', action: 'tab', tabName: 'Directory' },
  { key: 'profile',       label: 'Profile',              sub: 'Your profile and settings',      Icon: User,          bg: '#FDF4FF', action: 'tab', tabName: 'Profile' },
  { key: 'notifications', label: 'Notifications',        sub: 'Everything that needs your attention', Icon: Bell,    bg: '#FEF3C7', action: 'notifications' },
]

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
      { key: 'adboard',   label: 'Ad Board',  Icon: Megaphone,  action: 'tab', tabName: 'AdBoard' },
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

// ── Quick Access — slim horizontal row ──────────────────────────────────────
// Phase 21: condensed from the old 2x2 drag-reorder grid (+ the Overview
// toggle that used to live in its header) into one pinned strip above the
// feed — a utility rail, not a second dashboard. Press-and-hold any chip to
// reveal a remove "x"; a trailing "+" chip opens the same destination picker
// the old grid used. No drag-reorder here — order is just whatever order the
// shortcuts were added in; reordering four small chips in a single row
// wasn't worth carrying the grid's gesture-handler machinery over for.

function QuickAccessRow({ items, editing, onNavigate, onRemove, onAddPress, onLongPressToggle, colors }) {
  const styles = qaStyles(colors)
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map(item => {
        const Icon = item.homeIcon || item.Icon
        return (
          <View key={item.key} style={styles.chipWrap}>
            <TouchableOpacity
              style={[styles.chip, { backgroundColor: item.bg }]}
              activeOpacity={0.8}
              onPress={() => { if (!editing) onNavigate(item) }}
              onLongPress={onLongPressToggle}
              delayLongPress={420}
              accessibilityRole="button"
              accessibilityLabel={item.homeLabel || item.label}
            >
              <Icon size={16} color={colors.navy} strokeWidth={1.8} />
              <Text style={styles.chipLabel} numberOfLines={1}>{item.homeLabel || item.label}</Text>
            </TouchableOpacity>
            {editing && (
              <TouchableOpacity
                style={styles.removeBadge}
                onPress={() => onRemove(item.key)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.homeLabel || item.label} from Quick Access`}
              >
                <X size={10} color="#fff" strokeWidth={3} />
              </TouchableOpacity>
            )}
          </View>
        )
      })}
      {items.length < MAX_SHORTCUTS && !editing && (
        <TouchableOpacity
          style={styles.addChip}
          onPress={onAddPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Add a Quick Access shortcut"
        >
          <Plus size={16} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </ScrollView>
  )
}

function qaStyles(colors) {
  return StyleSheet.create({
    row: { gap: 8, paddingRight: 4 },
    chipWrap: { position: 'relative' },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      borderRadius: 20, paddingHorizontal: 13, paddingVertical: 9,
      borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
    },
    chipLabel: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.navy, maxWidth: 140 },
    removeBadge: {
      position: 'absolute', top: -5, right: -5,
      width: 17, height: 17, borderRadius: 9,
      backgroundColor: '#DC2626', borderWidth: 1.5, borderColor: colors.background,
      alignItems: 'center', justifyContent: 'center',
    },
    addChip: {
      width: 38, height: 38, borderRadius: 19,
      borderWidth: 1.5, borderColor: 'rgba(30,58,95,0.18)', borderStyle: 'dashed',
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(30,58,95,0.03)',
    },
  })
}

// ── Home Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }) {
  const { colors } = useTheme()
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

  // Profile row — full_name (canonical source of truth) and this student's
  // persisted Quick Access selection.
  const [profileRow, setProfileRow] = useState(null)
  useEffect(() => {
    if (!user?.id) return
    let cancelled = false
    supabase.from('profiles').select('full_name, quick_access_preferences').eq('id', user.id).maybeSingle()
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

  // ── Quick Access ────────────────────────────────────────────────────────
  const [shortcutKeys, setShortcutKeys] = useState(DEFAULT_SHORTCUTS)
  const [editingQA, setEditingQA]       = useState(false)
  const [pickerOpen, setPickerOpen]     = useState(false)

  useEffect(() => {
    if (!profileRow) return
    const stored = Array.isArray(profileRow.quick_access_preferences) ? profileRow.quick_access_preferences : null
    const valid = (stored || []).filter(k => ALL_SHORTCUTS.some(s => s.key === k)).slice(0, MAX_SHORTCUTS)
    setShortcutKeys(valid.length > 0 ? valid : DEFAULT_SHORTCUTS)
  }, [profileRow])

  async function persistShortcuts(keys) {
    setShortcutKeys(keys)
    if (!user?.id) return
    try {
      await supabase.from('profiles').update({ quick_access_preferences: keys }).eq('id', user.id)
    } catch { /* best effort — local state already reflects the change */ }
  }

  function toggleEditMode() {
    if (editingQA) { setEditingQA(false); return }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {})
    setEditingQA(true)
  }

  function handlePick(key) {
    setPickerOpen(false)
    if (shortcutKeys.length >= MAX_SHORTCUTS || shortcutKeys.includes(key)) return
    persistShortcuts([...shortcutKeys, key])
  }

  const shortcutItems = shortcutKeys.map(k => ALL_SHORTCUTS.find(s => s.key === k)).filter(Boolean)
  const pickerOptions = ALL_SHORTCUTS.filter(s => !shortcutKeys.includes(s.key))

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
  const [campusPulse, setCampusPulse]       = useState({ total: 0, counts: {} })
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
      const [highlight, pulse] = await Promise.all([
        fetchBuzzingHighlight(windowId),
        fetchCampusPulse(windowId),
      ])
      setBuzzingHighlight(highlight)
      setCampusPulse(pulse)
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
      <View style={{ paddingHorizontal: spacing.md, paddingTop: 18 }}>
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.eyebrow}>Quick Access</Text>
            <Text style={styles.sectionCaption}>Your own shortcuts — press &amp; hold to edit</Text>
          </View>
          {editingQA && (
            <TouchableOpacity
              onPress={toggleEditMode}
              style={styles.doneBtn}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Done editing Quick Access"
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ marginBottom: 22 }}>
          <QuickAccessRow
            items={shortcutItems}
            editing={editingQA}
            onNavigate={handleNav}
            onRemove={key => persistShortcuts(shortcutKeys.filter(k => k !== key))}
            onAddPress={() => setPickerOpen(true)}
            onLongPressToggle={toggleEditMode}
            colors={colors}
          />
        </View>

        <ComposerEntryBar name={firstName} onPress={() => navigation.navigate('Composer')} />
      </View>

      {/* BuzzStrip/CampusPulse carry their own spacing.md horizontal
          padding internally already (see FeedKit.jsx), so they sit
          directly here without an extra wrapper. */}
      <View style={{ paddingHorizontal: spacing.md }}>
        <BuzzStrip selected={buzzWindow} onSelect={setBuzzWindow} />
        <CampusPulse pulse={campusPulse} />
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

      <DestinationPickerModal
        visible={pickerOpen}
        options={pickerOptions}
        slotsLeft={MAX_SHORTCUTS - shortcutKeys.length}
        onPick={handlePick}
        onClose={() => setPickerOpen(false)}
      />
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
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)',
    zIndex: 10, elevation: 10,
  },
  topTitle:    { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary, lineHeight: 27 },
  topGreeting: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted, marginTop: 3 },

  portalSwitchRow: {
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)',
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

  eyebrow: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  sectionCaption: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    color: colors.light,
    marginTop: 2,
  },

  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, marginBottom: 10,
  },
  doneBtn: {
    backgroundColor: colors.accentBg, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  doneBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.accentFg },

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
