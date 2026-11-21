import { useState, useEffect, useCallback, useMemo } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Bell, Users, BookOpen, Wallet, MessageCircle, Tag, Flame, SlidersHorizontal, UserPlus } from 'lucide-react-native'
import { PILLARS } from '../constants/pillars'
import NotificationPrefsSheet from '../components/notifications/NotificationPrefsSheet'
import { useNotificationPrefs } from '../lib/notificationPrefs'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { goToRelatedEntity } from '../lib/notificationRouting'
import { useFoundationEnabled } from '../hooks/useAppFlags'

// ── Notification categories ─────────────────────────────────────────────────
// public.notifications.category holds many fine-grained keys (welcome,
// chat_message, subscription, ...). For display they fold into four colour
// coded groups: Social, Academic, Financial and System. Anything unknown is
// System.

// Each category has its own icon, colour and label. Pillars use the same icon
// and colour as everywhere else in the app (constants/pillars.jsx). Gold is
// only for money. Anything unknown falls back to System.
const GOLD = '#B4923A'
const P = PILLARS
const CATEGORY_META = {
  // Messages and people
  chat_message:        { label: 'MESSAGES',   Icon: MessageCircle, tone: 'social' },
  connection_request:  { label: 'PEOPLE',     Icon: UserPlus,      tone: 'social' },
  connection_accepted: { label: 'PEOPLE',     Icon: UserPlus,      tone: 'social' },
  followed_post:       { label: 'FOLLOWING',  Icon: Users,         tone: 'social' },
  board_reply:         { label: 'CAMPUS',     Icon: P.campus.Icon, pillar: 'campus' },
  // Course Connect
  trending_post:       { label: 'TRENDING',   Icon: Flame,         pillar: 'course' },
  // Campus Connect
  campus_event:        { label: 'CAMPUS',     Icon: P.campus.Icon, pillar: 'campus' },
  study_room:          { label: 'CAMPUS',     Icon: P.campus.Icon, pillar: 'campus' },
  // Elevation
  coach_enquiry:       { label: 'ELEVATION',  Icon: P.elevation.Icon, pillar: 'elevation' },
  coach_booking:       { label: 'ELEVATION',  Icon: P.elevation.Icon, pillar: 'elevation' },
  coach_match:         { label: 'ELEVATION',  Icon: P.elevation.Icon, pillar: 'elevation' },
  coach_update:        { label: 'ELEVATION',  Icon: P.elevation.Icon, pillar: 'elevation' },
  // Lifestyle
  partner_deal:        { label: 'LIFESTYLE',  Icon: P.lifestyle.Icon, pillar: 'lifestyle' },
  partner_update:      { label: 'LIFESTYLE',  Icon: P.lifestyle.Icon, pillar: 'lifestyle' },
  interest_deal:       { label: 'LIFESTYLE',  Icon: P.lifestyle.Icon, pillar: 'lifestyle' },
  // Foundation
  document:               { label: 'FOUNDATION', Icon: P.foundation.Icon, pillar: 'foundation' },
  session:                { label: 'FOUNDATION', Icon: P.foundation.Icon, pillar: 'foundation' },
  foundation_blueprint:   { label: 'FOUNDATION', Icon: P.foundation.Icon, pillar: 'foundation' },
  foundation_open:        { label: 'FOUNDATION', Icon: P.foundation.Icon, pillar: 'foundation' },
  job_application_reminder: { label: 'FOUNDATION', Icon: P.foundation.Icon, pillar: 'foundation' },
  checkin_reminder:       { label: 'FOUNDATION', Icon: P.foundation.Icon, pillar: 'foundation' },
  weekly_summary:         { label: 'WEEKLY',     Icon: BookOpen, tone: 'neutral' },
  // Ad Board
  weekly_blueprint:    { label: 'AD BOARD',   Icon: Tag,           tone: 'adboard' },
  // Money
  budget_goal:         { label: 'MONEY',      Icon: Wallet,        tone: 'money' },
  subscription:        { label: 'MONEY',      Icon: Wallet,        tone: 'money' },
  wallet:              { label: 'MONEY',      Icon: Wallet,        tone: 'money' },
}

function lift(hex, amt) {
  const n = parseInt(hex.slice(1), 16)
  const mix = c => Math.round(c + (255 - c) * amt)
  return '#' + [mix((n >> 16) & 255), mix((n >> 8) & 255), mix(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('')
}

function metaFor(category, colors, isDark) {
  const m = CATEGORY_META[category] || { label: 'UBP', Icon: Bell, tone: 'neutral' }
  let color
  if (m.pillar) {
    const base = P[m.pillar].color
    color = isDark ? (m.pillar === 'foundation' ? colors.textPrimary : lift(base, 0.35)) : base
  } else if (m.tone === 'money') color = isDark ? '#D4B766' : GOLD
  else if (m.tone === 'social') color = colors.newBadge
  else if (m.tone === 'adboard') color = isDark ? '#E3A64A' : '#C98A1D'
  else color = colors.textSecondary
  return { ...m, color }
}

// Notifications that open Foundation. They are hidden while Foundation is
// closed on iOS and Android.
const FOUNDATION_CATEGORIES = new Set(['foundation_blueprint', 'job_application_reminder'])
const FOUNDATION_ENTITIES = new Set(['submission', 'job_application'])
function isFoundationNotification(n) {
  return FOUNDATION_CATEGORIES.has(n.category) || FOUNDATION_ENTITIES.has(n.related_entity_type)
}

function isToday(dateStr) {
  const d = new Date(dateStr)
  const n = new Date()
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate()
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)} min`
  if (diff < 86400 && isToday(dateStr)) return `${Math.floor(diff / 3600)} h`
  if (diff < 172800) return 'Yesterday'
  if (diff < 7 * 86400) return new Date(dateStr).toLocaleDateString('en-IE', { weekday: 'short' })
  return new Date(dateStr).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

// ── Notification row ─────────────────────────────────────────────────────────

function NotifRow({ notif, onPress }) {
  const { colors, isDark } = useTheme()
  const styles = __gs_styles(colors)
  const cfg = metaFor(notif.category, colors, isDark)
  return (
    <TouchableOpacity
      style={[styles.card, !notif.read && { borderColor: cfg.color }]}
      activeOpacity={0.8}
      onPress={() => onPress(notif)}
      accessibilityRole="button"
      accessibilityLabel={`${cfg.label.toLowerCase()}. ${notif.title}. ${notif.read ? '' : 'Unread.'}`}
    >
      {!notif.read && <View style={[styles.accentBar, { backgroundColor: cfg.color }]} />}
      <View style={[styles.notifIcon, { backgroundColor: cfg.color + (isDark ? '2E' : '1A') }]}>
        <cfg.Icon size={20} color={cfg.color} strokeWidth={1.8} />
      </View>
      <View style={styles.notifContent}>
        <View style={styles.metaRow}>
          <Text style={[styles.notifCategory, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={styles.notifTime}>{timeAgo(notif.created_at)}</Text>
        </View>
        <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]} numberOfLines={2}>
          {notif.title}
        </Text>
        {notif.message ? (
          <Text style={styles.notifBody} numberOfLines={2}>{notif.message}</Text>
        ) : null}
      </View>
      {!notif.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  )
}

function Group({ title, items, onPress }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  if (items.length === 0) return null
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      <View style={styles.cards}>
        {items.map(n => <NotifRow key={n.id} notif={n} onPress={onPress} />)}
      </View>
    </View>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <Bell size={34} color={colors.textPrimary} strokeWidth={1.4} />
      </View>
      <Text style={styles.emptyTitle}>All caught up</Text>
      <Text style={styles.emptySub}>
        Notifications from UniBlueprint, your Campus Handler, and your coaches will appear here.
      </Text>
    </View>
  )
}

export default function NotificationsScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const { prefs, save: savePrefs, failed: prefsFailed } = useNotificationPrefs(user?.id)
  const [prefsOpen, setPrefsOpen] = useState(false)
  const [onlyUnread, setOnlyUnread] = useState(false)
  const [allNotifications, setNotifications] = useState([])
  const { enabled: foundationOpen } = useFoundationEnabled()
  const notifications = useMemo(
    () => (foundationOpen ? allNotifications : allNotifications.filter(n => !isFoundationNotification(n))),
    [allNotifications, foundationOpen],
  )
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchNotifications() {
    if (!user?.id) { setLoading(false); return }
    const { data, error } = await supabase
      .from('notifications')
      .select('id, category, title, message, read, created_at, related_entity_type, related_entity_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error && data) setNotifications(data)
    setLoading(false)
    setRefreshing(false)
  }

  useFocusEffect(useCallback(() => { fetchNotifications() }, [user?.id]))

  // Realtime: new notifications (check-in reminders, Ghost Handler welfare
  // checks, Sunday flock, ticket reassignment, subscription changes) appear the moment they're inserted, not just on next
  // screen focus.
  useEffect(() => {
    if (!user?.id) return
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}`,
      }, payload => {
        setNotifications(prev => [payload.new, ...prev])
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user?.id])

  async function handlePress(notif) {
    if (!notif.read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))
      await supabase.from('notifications').update({ read: true }).eq('id', notif.id)
    }
    await goToRelatedEntity(navigation, notif, user?.id)
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const hasUnread = unreadCount > 0

  async function markAllRead() {
    if (!user?.id || !hasUnread) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    await supabase.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false)
  }

  function onRefresh() {
    setRefreshing(true)
    fetchNotifications()
  }

  const shown = useMemo(() => (onlyUnread ? notifications.filter(n => !n.read) : notifications), [notifications, onlyUnread])
  const { today, earlier } = useMemo(() => ({
    today: shown.filter(n => isToday(n.created_at)),
    earlier: shown.filter(n => !isToday(n.created_at)),
  }), [shown])

  return (
    <View style={styles.screen}>
      <AppHeader navigation={navigation} showBack unreadCount={unreadCount} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.textPrimary} />}
      >
        <PageTitle
          title="Notifications"
          style={styles.pageTitle}
          right={(
            <TouchableOpacity onPress={() => setPrefsOpen(true)} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Notification choices" style={styles.choicesBtn} hitSlop={8}>
              <SlidersHorizontal size={15} color={colors.textPrimary} strokeWidth={1.9} />
              <Text style={styles.markAllText}>Choices</Text>
            </TouchableOpacity>
          )}
        />

        <View style={styles.filterRow}>
          <TouchableOpacity onPress={() => setOnlyUnread(false)} style={[styles.pill, !onlyUnread && styles.pillOn]} accessibilityRole="button" accessibilityState={{ selected: !onlyUnread }}>
            <Text style={[styles.pillText, !onlyUnread && styles.pillTextOn]}>All</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setOnlyUnread(true)} style={[styles.pill, onlyUnread && styles.pillOn]} accessibilityRole="button" accessibilityState={{ selected: onlyUnread }}>
            <Text style={[styles.pillText, onlyUnread && styles.pillTextOn]}>{hasUnread ? `Unread ${unreadCount}` : 'Unread'}</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          {hasUnread ? (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Mark all as read" style={styles.markAll}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.textPrimary} size="small" />
          </View>
        ) : notifications.length > 0 ? (
          shown.length > 0 ? (
            <>
              <Group title="Today" items={today} onPress={handlePress} />
              <Group title="Earlier" items={earlier} onPress={handlePress} />
            </>
          ) : (
            <Text style={styles.noUnread}>Nothing unread. You are all caught up.</Text>
          )
        ) : (
          <EmptyState />
        )}
      </ScrollView>

      <NotificationPrefsSheet
        visible={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        userId={user?.id}
        prefs={prefs}
        save={savePrefs}
        failed={prefsFailed}
      />
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed header on native.
  scrollView: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  pageTitle: { paddingHorizontal: 2, paddingTop: 18, paddingBottom: 4 },
  markAll: { paddingVertical: 8, paddingLeft: 8 },
  markAllText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  loadingWrap: { alignItems: 'center', paddingVertical: 48 },

  choicesBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: 6 },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  pill: { paddingHorizontal: 16, height: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  pillOn: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
  pillTextOn: { color: colors.accentFg },
  noUnread: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, textAlign: 'center', paddingVertical: 40 },

  group: { marginTop: 26 },
  groupTitle: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: colors.textPrimary, marginBottom: 12, paddingHorizontal: 2 },
  cards: { gap: 12 },

  card: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, overflow: 'hidden',
    backgroundColor: colors.surface, borderRadius: 18, borderWidth: 1.5, borderColor: colors.border,
  },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  notifIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1, minWidth: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  notifTitle: { fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, lineHeight: 21, marginTop: 5 },
  notifTitleUnread: { fontFamily: fonts.sansSemiBold },
  notifBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 19 },
  notifCategory: { fontFamily: fonts.sansBold, fontSize: 10.5, letterSpacing: 0.9 },
  notifTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary },
  unreadDot: { position: 'absolute', right: 14, bottom: 14, width: 9, height: 9, borderRadius: 4.5, backgroundColor: '#E5484D' },

  emptyWrap: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 48 },
  emptyIconBox: {
    width: 76, height: 76, borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1, borderColor: colors.border,
  },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.textPrimary, marginBottom: 12, textAlign: 'center' },
  emptySub: { fontFamily: fonts.sans, fontSize: 14, color: colors.textSecondary, lineHeight: 22, textAlign: 'center' },
  })
}
