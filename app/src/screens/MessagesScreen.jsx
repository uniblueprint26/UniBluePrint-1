import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { MessageSquare, Users, ChevronRight, Pencil } from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60)     return 'Just now'
  if (diff < 3600)   return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)  return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short' })
}

function roomInitials(name) {
  if (!name) return '?'
  const words = name.trim().split(' ').filter(Boolean)
  if (words.length === 1) return words[0][0].toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function roomAvatarColor(contextType) {
  switch (contextType) {
    case 'board':   return '#7C3AED'
    case 'carpool': return '#15803D'
    case 'direct':  return '#0369A1'
    case 'ad':      return colors.navy
    default:        return colors.navy
  }
}

// ── Conversation row ──────────────────────────────────────────────────────────

function ConversationRow({ room, isLast, onPress }) {
  const initBg   = roomAvatarColor(room.contextType)
  const initials = roomInitials(room.name)
  const unread   = room.unreadCount > 0

  return (
    <TouchableOpacity
      style={[styles.convRow, !isLast && styles.convDivider]}
      activeOpacity={0.72}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={styles.convAvatarWrap}>
        <View style={[styles.convAvatar, { backgroundColor: initBg }]}>
          <Text style={styles.convAvatarText}>{initials}</Text>
        </View>
        {unread && <View style={styles.unreadDot} />}
      </View>

      {/* Content */}
      <View style={styles.convContent}>
        <View style={styles.convNameRow}>
          <Text
            style={[styles.convName, unread && styles.convNameUnread]}
            numberOfLines={1}
          >
            {room.name}
          </Text>
          <Text style={[styles.convTime, unread && styles.convTimeUnread]}>
            {timeAgo(room.lastMessageAt)}
          </Text>
        </View>
        <View style={styles.convPreviewRow}>
          {room.lastMessage ? (
            <Text
              style={[styles.convPreview, unread && styles.convPreviewUnread]}
              numberOfLines={1}
            >
              {room.lastAuthor ? `${room.lastAuthor}: ` : ''}{room.lastMessage}
            </Text>
          ) : (
            <Text style={styles.convPreview} numberOfLines={1}>No messages yet</Text>
          )}
          {unread && room.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>
                {room.unreadCount > 9 ? '9+' : room.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      <ChevronRight size={14} color={colors.light} style={{ flexShrink: 0 }} />
    </TouchableOpacity>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onDirectoryPress, onConnectPress }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <MessageSquare size={34} color={colors.navy} strokeWidth={1.4} />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySub}>
        Start by joining a campus board, a carpool route, or connecting with another young person via the Directory.
      </Text>
      <TouchableOpacity
        style={styles.emptyPrimaryBtn}
        onPress={onDirectoryPress}
        activeOpacity={0.8}
      >
        <Users size={16} color={colors.cream} strokeWidth={1.8} />
        <Text style={styles.emptyPrimaryBtnText}>Browse the Directory</Text>
        <ChevronRight size={14} color={colors.cream} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.emptySecondaryBtn}
        onPress={onConnectPress}
        activeOpacity={0.8}
      >
        <Text style={styles.emptySecondaryBtnText}>Explore Campus Connect</Text>
      </TouchableOpacity>
    </View>
  )
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function MessagesScreen({ navigation }) {
  const insets      = useSafeAreaInsets()
  const { user }    = useAuth()
  const userId      = user?.id

  const [rooms,   setRooms]   = useState([])
  const [loading, setLoading] = useState(true)

  // Reload the room list every time this screen comes into focus
  useFocusEffect(useCallback(() => {
    loadRooms()
  }, [userId]))

  async function loadRooms() {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    try {
      // Step 1: rooms where the current user is a participant
      const { data: participantRows, error: partErr } = await supabase
        .from('chat_participants')
        .select('room_id, last_read_at, chat_rooms(id, name, context_type, context_id, created_at)')
        .eq('user_id', userId)

      if (partErr || !participantRows?.length) {
        setRooms([])
        return
      }

      const roomIds = participantRows.map(p => p.room_id)

      // Step 2: recent messages across all those rooms (one query)
      const { data: recentMsgs } = await supabase
        .from('chat_messages')
        .select('id, room_id, content, author_name, created_at, user_id')
        .in('room_id', roomIds)
        .order('created_at', { ascending: false })
        .limit(Math.max(60, roomIds.length * 5))

      // Step 3: build per-room metadata from the batched message list
      const lastMsgMap = {}
      for (const msg of recentMsgs || []) {
        if (!lastMsgMap[msg.room_id]) lastMsgMap[msg.room_id] = msg
        // Short-circuit once we have every room covered
        if (Object.keys(lastMsgMap).length === roomIds.length) break
      }

      const unreadCounts = {}
      for (const p of participantRows) {
        const lastRead = new Date(p.last_read_at || 0)
        unreadCounts[p.room_id] = (recentMsgs || []).filter(
          m => m.room_id === p.room_id
            && new Date(m.created_at) > lastRead
            && m.user_id !== userId
        ).length
      }

      // Step 4: assemble and sort rooms
      const roomList = participantRows
        .map(p => {
          const room   = p.chat_rooms
          if (!room) return null
          const lastMsg = lastMsgMap[p.room_id]
          return {
            id:             p.room_id,
            name:           room.name || 'Chat Room',
            contextType:    room.context_type,
            contextId:      room.context_id,
            lastMessage:    lastMsg?.content     ?? null,
            lastAuthor:     lastMsg?.author_name ?? null,
            lastMessageAt:  lastMsg?.created_at  ?? room.created_at,
            unreadCount:    unreadCounts[p.room_id] || 0,
          }
        })
        .filter(Boolean)
        .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))

      setRooms(roomList)
    } catch {
      setRooms([])
    } finally {
      setLoading(false)
    }
  }

  function openRoom(room) {
    navigation.navigate('ChatRoom', {
      contextType: room.contextType,
      contextId:   room.contextId,
      roomName:    room.name,
      subtitle:    null,
    })
  }

  function goToDirectory()  { navigation.getParent()?.navigate('Directory') }
  function goToConnect()    { navigation.getParent()?.navigate('Home')      }

  const hasRooms = rooms.length > 0
  const unreadTotal = rooms.reduce((n, r) => n + r.unreadCount, 0)

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <UBPLogo height={28} color={colors.cream} />
        <TouchableOpacity
          style={styles.composeBtn}
          activeOpacity={0.8}
          onPress={() => Alert.alert(
            'Start a Conversation',
            'Open a campus board, a carpool route, or a course discussion to start a group chat. One-to-one direct messages are coming soon.',
            [{ text: 'OK' }]
          )}
        >
          <Pencil size={16} color={colors.cream} strokeWidth={1.8} />
        </TouchableOpacity>
      </View>

      {/* Heading */}
      <View style={styles.headingWrap}>
        <Text style={styles.screenTitle}>Messages</Text>
        <Text style={styles.screenSub}>
          {loading
            ? 'Loading...'
            : hasRooms
              ? unreadTotal > 0
                ? `${unreadTotal} unread`
                : `${rooms.length} conversation${rooms.length !== 1 ? 's' : ''}`
              : 'Join a board or carpool route to start chatting'}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.navy} size="small" />
          </View>
        ) : hasRooms ? (
          <Card style={styles.convList}>
            {rooms.map((room, i) => (
              <ConversationRow
                key={room.id}
                room={room}
                isLast={i === rooms.length - 1}
                onPress={() => openRoom(room)}
              />
            ))}
          </Card>
        ) : (
          <EmptyState
            onDirectoryPress={goToDirectory}
            onConnectPress={goToConnect}
          />
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
    paddingTop: 14, paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,240,232,0.12)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  headingWrap: { paddingHorizontal: spacing.md, paddingTop: 18, paddingBottom: 10 },
  screenTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy },
  screenSub:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 4 },

  scroll: { paddingHorizontal: spacing.md, paddingTop: 4 },

  loadingWrap: { alignItems: 'center', paddingVertical: 48 },

  // Conversation list
  convList: { padding: 0 },

  convRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, paddingHorizontal: 16,
  },
  convDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)' },

  convAvatarWrap: { position: 'relative', flexShrink: 0 },
  convAvatar: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  convAvatarText: { fontFamily: fonts.serif, fontSize: 16, color: colors.cream },
  unreadDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#F59E0B',
    borderWidth: 2, borderColor: colors.white,
  },

  convContent: { flex: 1, minWidth: 0 },
  convNameRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  convName:        { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.navy, flex: 1, marginRight: 8 },
  convNameUnread:  { fontFamily: fonts.sansSemiBold },
  convTime:        { fontFamily: fonts.sans, fontSize: 11, color: colors.light, flexShrink: 0 },
  convTimeUnread:  { color: colors.muted },

  convPreviewRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  convPreview: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.light,
    flex: 1, lineHeight: 18,
  },
  convPreviewUnread: { color: colors.muted },

  unreadBadge: {
    backgroundColor: colors.navy, borderRadius: 9999,
    minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5, flexShrink: 0,
  },
  unreadBadgeText: { fontFamily: fonts.sansBold, fontSize: 10, color: colors.cream },

  // Empty state
  emptyWrap: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 48 },
  emptyIconBox: {
    width: 76, height: 76, borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24, ...shadows.card,
  },
  emptyTitle: {
    fontFamily: fonts.serif, fontSize: 24, color: colors.navy,
    marginBottom: 12, textAlign: 'center',
  },
  emptySub: {
    fontFamily: fonts.sans, fontSize: 14, color: colors.muted,
    lineHeight: 22, textAlign: 'center', marginBottom: 32,
  },
  emptyPrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.navy, borderRadius: radius.button,
    paddingHorizontal: 22, paddingVertical: 14,
    marginBottom: 12, width: '100%', justifyContent: 'center',
  },
  emptyPrimaryBtnText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream },
  emptySecondaryBtn:   { paddingVertical: 12 },
  emptySecondaryBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted },
})
