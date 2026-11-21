import { useState, useEffect, useCallback, useMemo } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Bell, Users, BookOpen, Wallet } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { GroupCard, RowDivider } from '../components/explore/ExploreParts'
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

const CATEGORY_OF = {
  chat_message: 'social', board_reply: 'social', coach_enquiry: 'social', study_room: 'social',
  document: 'academic', session: 'academic', coach_booking: 'academic',
  foundation_blueprint: 'academic', job_application_reminder: 'academic',
  checkin_reminder: 'academic', weekly_summary: 'academic',
  subscription: 'financial', wallet: 'financial', partner_deal: 'financial',
}

const GOLD = '#B4923A'

function getGroupConfig(colors) {
  return {
    social:    { label: 'SOCIAL',    Icon: Users,    color: colors.newBadge,      tile: 'rgba(124,58,237,0.12)' },
    academic:  { label: 'ACADEMIC',  Icon: BookOpen, color: colors.textPrimary,   tile: colors.tabFill },
    financial: { label: 'FINANCIAL', Icon: Wallet,   color: GOLD,                 tile: 'rgba(180,146,58,0.16)' },
    system:    { label: 'SYSTEM',    Icon: Bell,     color: colors.textSecondary, tile: colors.tabFill },
  }
}

// Notifications that open Foundation. They are hidden while Foundation is
// closed on iOS and Android.
const FOUNDATION_CATEGORIES = new Set(['foundation_blueprint', 'job_application_reminder'])
const FOUNDATION_ENTITIES = new Set(['submission', 'job_application'])
function isFoundationNotification(n) {
  return FOUNDATION_CATEGORIES.has(n.category) || FOUNDATION_ENTITIES.has(n.related_entity_type)
}

function groupOf(category) {
  return CATEGORY_OF[category] || 'system'
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
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const cfg = getGroupConfig(colors)[groupOf(notif.category)]
  return (
    <TouchableOpacity style={styles.notifRow} activeOpacity={0.75} onPress={() => onPress(notif)}>
      <View style={[styles.notifIcon, { backgroundColor: cfg.tile }]}>
        <cfg.Icon size={17} color={cfg.color} strokeWidth={1.8} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]} numberOfLines={2}>
          {notif.title}
        </Text>
        {notif.message ? (
          <Text style={styles.notifBody} numberOfLines={2}>{notif.message}</Text>
        ) : null}
        <Text style={[styles.notifCategory, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
      <View style={styles.notifSide}>
        <Text style={styles.notifTime}>{timeAgo(notif.created_at)}</Text>
        {!notif.read && <View style={styles.unreadDot} />}
      </View>
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
      <GroupCard>
        {items.map((n, i) => (
          <View key={n.id}>
            {i > 0 && <RowDivider inset={64} />}
            <NotifRow notif={n} onPress={onPress} />
          </View>
        ))}
      </GroupCard>
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

  const { today, earlier } = useMemo(() => ({
    today: notifications.filter(n => isToday(n.created_at)),
    earlier: notifications.filter(n => !isToday(n.created_at)),
  }), [notifications])

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
          right={hasUnread ? (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} accessibilityRole="button" accessibilityLabel="Mark all as read" style={styles.markAll}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          ) : null}
        />

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.textPrimary} size="small" />
          </View>
        ) : notifications.length > 0 ? (
          <>
            <Group title="Today" items={today} onPress={handlePress} />
            <Group title="Earlier" items={earlier} onPress={handlePress} />
          </>
        ) : (
          <EmptyState />
        )}
      </ScrollView>

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

  group: { marginTop: 26 },
  groupTitle: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: colors.textPrimary, marginBottom: 10, paddingHorizontal: 2 },

  notifRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14, paddingHorizontal: 14 },
  notifIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notifContent: { flex: 1, minWidth: 0 },
  notifTitle: { fontFamily: fonts.sans, fontSize: 14.5, color: colors.textPrimary, lineHeight: 20 },
  notifTitleUnread: { fontFamily: fonts.sansSemiBold },
  notifBody: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  notifCategory: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.8, marginTop: 5 },
  notifSide: { alignItems: 'flex-end', gap: 8, paddingTop: 2 },
  notifTime: { fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E5484D' },

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
