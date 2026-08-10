import { useState, useEffect, useCallback } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import {
  Bell, ChevronLeft, FileText, Calendar, Star, Megaphone,
  Clock, AlertTriangle, Sun, CreditCard, Archive, Repeat,
} from 'lucide-react-native'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// ── Notification category config ────────────────────────────────────────────
// Keys match public.notifications.category values. 'welcome' and the four
// generic legacy keys (document/session/update/announcement) are kept for
// backward compatibility with existing rows; everything else maps to a
// category introduced by the portals/operations schema.

const TYPE_CONFIG = {
  welcome:            { Icon: Star,          color: '#15803D', bg: '#F0FDF4' },
  document:           { Icon: FileText,      color: '#1d4ed8', bg: '#EFF6FF' },
  session:            { Icon: Calendar,      color: '#15803D', bg: '#F0FDF4' },
  update:             { Icon: Star,          color: '#B45309', bg: '#FEF3C7' },
  announcement:       { Icon: Megaphone,     color: '#7C3AED', bg: '#F5F3FF' },
  checkin_reminder:   { Icon: Clock,         color: '#1d4ed8', bg: '#EFF6FF' },
  ghost_handler:      { Icon: AlertTriangle, color: '#B45309', bg: '#FEF3C7' },
  sunday_flock:       { Icon: Sun,           color: '#B45309', bg: '#FEF3C7' },
  ticket_reassigned:  { Icon: Repeat,        color: '#7C3AED', bg: '#F5F3FF' },
  subscription:       { Icon: CreditCard,    color: '#15803D', bg: '#F0FDF4' },
  wallet:             { Icon: Archive,       color: '#B45309', bg: '#FEF3C7' },
}

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

// ── Notification row ─────────────────────────────────────────────────────────

function NotifRow({ notif, isLast, onPress }) {
  const cfg = TYPE_CONFIG[notif.category] || TYPE_CONFIG.update
  return (
    <TouchableOpacity
      style={[styles.notifRow, !isLast && styles.notifDivider]}
      activeOpacity={0.75}
      onPress={() => onPress(notif)}
    >
      <View style={[styles.notifIcon, { backgroundColor: cfg.bg }]}>
        <cfg.Icon size={16} color={cfg.color} strokeWidth={1.8} />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, !notif.read && styles.notifTitleUnread]} numberOfLines={2}>
          {notif.title}
        </Text>
        {notif.message ? (
          <Text style={styles.notifBody} numberOfLines={2}>{notif.message}</Text>
        ) : null}
        <Text style={styles.notifTime}>{timeAgo(notif.created_at)}</Text>
      </View>
      {!notif.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <Bell size={34} color={colors.navy} strokeWidth={1.4} />
      </View>
      <Text style={styles.emptyTitle}>All caught up</Text>
      <Text style={styles.emptySub}>
        Notifications from UniBlueprint, your Campus Handler, and your coaches will appear here.
      </Text>
    </View>
  )
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function NotificationsScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function fetchNotifications() {
    if (!user?.id) { setLoading(false); return }
    const { data, error } = await supabase
      .from('notifications')
      .select('id, category, title, message, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error && data) setNotifications(data)
    setLoading(false)
    setRefreshing(false)
  }

  useFocusEffect(useCallback(() => { fetchNotifications() }, [user?.id]))

  // Realtime: new notifications (check-in reminders, Ghost Handler welfare
  // checks, Sunday flock, ticket reassignment, subscription changes) appear
  // the moment they're inserted, not just on next screen focus.
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
  }

  function onRefresh() {
    setRefreshing(true)
    fetchNotifications()
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.topBar, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Notifications</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />}
      >
        {loading ? (
          <Text style={styles.loadingText}>Loading notifications...</Text>
        ) : notifications.length > 0 ? (
          <Card style={styles.notifList}>
            {notifications.map((notif, i) => (
              <NotifRow
                key={notif.id}
                notif={notif}
                isLast={i === notifications.length - 1}
                onPress={handlePress}
              />
            ))}
          </Card>
        ) : (
          <EmptyState />
        )}
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
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,240,232,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  topTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.cream },

  scroll: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
  loadingText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', marginTop: 32 },

  notifList: { padding: 0 },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  notifDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)' },

  notifIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
  },
  notifContent: { flex: 1 },
  notifTitle:   { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy, lineHeight: 20 },
  notifTitleUnread: { fontFamily: fonts.sansSemiBold },
  notifBody:    { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 18 },
  notifTime:    { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 4 },

  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#F59E0B', flexShrink: 0, marginTop: 6,
  },

  emptyWrap: {
    alignItems: 'center', paddingHorizontal: 32, paddingTop: 48,
  },
  emptyIconBox: {
    width: 76, height: 76, borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    ...shadows.card,
  },
  emptyTitle: {
    fontFamily: fonts.serif, fontSize: 24, color: colors.navy,
    marginBottom: 12, textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.muted,
    lineHeight: 22, textAlign: 'center',
  },
})
