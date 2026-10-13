import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
  ActivityIndicator, Modal,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { MessageSquare, Users, ChevronRight, Pencil, Menu } from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { fonts, spacing, radius, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { formatNumber } from '../utils/formatNumber'
import { goToHome, openMenu } from '../navigation/helpers'
import { useLightBackgroundStatusBar } from '../hooks/useStatusBarStyle'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import {
  startDirectChat, fetchRoomContextId,
  fetchDirectMessageContacts, fetchChatRoomPeerNames,
} from '../lib/directMessaging'

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

function roomAvatarColor(contextType, colors) {
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
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const initBg   = roomAvatarColor(room.contextType, colors)
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
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIconBox}>
        <MessageSquare size={34} color={colors.navy} strokeWidth={1.4} />
      </View>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptySub}>
        Start by joining a campus board, a carpool route, or connecting with another young person via the Directory.
      </Text>
      <Button
        label="Browse the Directory"
        icon={Users}
        onPress={onDirectoryPress}
        variant="primary"
        style={styles.emptyPrimaryBtn}
      />
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
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  // Cream strip under the status bar — the global light icons are invisible
  // here without this (L3).
  useLightBackgroundStatusBar()
  const insets      = useSafeAreaInsets()
  const { user }    = useAuth()
  const userId      = user?.id

  const [rooms,   setRooms]   = useState([])
  const [loading, setLoading] = useState(true)

  // "New message" composer — see openCompose()/handlePickContact() below.
  const [composeVisible,  setComposeVisible]  = useState(false)
  const [contacts,        setContacts]        = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [startingId,      setStartingId]      = useState(null)

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

      // Step 4: resolve the correct display name for 'direct' rooms. A direct
      // room's own `chat_rooms.name` is a single shared value set by
      // whichever side created it (via start_direct_chat's room_name arg),
      // so on its own it is only ever right for one of the two people in
      // it — the other side needs their OWN peer's name, which chat_rooms
      // itself can't tell us. See directMessaging.js's header comment for
      // why this needs a security-definer RPC rather than a plain select.
      const directRoomIds = participantRows
        .filter(p => p.chat_rooms?.context_type === 'direct')
        .map(p => p.room_id)
      const { peersByRoom } = await fetchChatRoomPeerNames(directRoomIds)

      // Step 5: assemble and sort rooms
      const roomList = participantRows
        .map(p => {
          const room   = p.chat_rooms
          if (!room) return null
          const lastMsg = lastMsgMap[p.room_id]
          const peer    = room.context_type === 'direct' ? peersByRoom[p.room_id] : null
          return {
            id:             p.room_id,
            name:           peer?.peer_display_name || room.name || 'Chat Room',
            contextType:    room.context_type,
            contextId:      room.context_id,
            otherUserId:    peer?.peer_user_id || null,
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
      // For a direct room, re-pass the resolved peer so useChat's
      // otherParticipantId upsert still has them even if, for some reason,
      // they were never successfully joined on an earlier attempt.
      posterId:    room.contextType === 'direct' ? room.otherUserId : null,
      posterName:  room.contextType === 'direct' ? room.name        : null,
    })
  }

  function goToDirectory()  { navigation.getParent()?.navigate('Directory') }
  // Used to land on Home instead of Campus Connect.
  function goToConnect()    { navigation.getParent()?.navigate('Home', { screen: 'CampusConnect' }) }

  // ── "New message" composer ──────────────────────────────────────────────
  // There's no general "search any platform user" picker to launch here yet
  // — Directory still renders a static mock roster with no real user ids,
  // and `profiles` stays locked to own-row-only read access (a wider
  // directory/profile-search feature is a bigger product & privacy decision,
  // not made here). So this surfaces real people the user can already see
  // evidence of a connection with: anyone who shares an existing chat room
  // with them, via get_direct_message_contacts() — see directMessaging.js.
  async function openCompose() {
    setComposeVisible(true)
    setContactsLoading(true)
    const { contacts: rows } = await fetchDirectMessageContacts()
    setContacts(rows)
    setContactsLoading(false)
  }

  async function handlePickContact(contact) {
    if (startingId) return
    setStartingId(contact.peer_user_id)
    try {
      const { roomId, blocked, error } = await startDirectChat(contact.peer_user_id, contact.peer_display_name)
      if (blocked) {
        Alert.alert("Can't start this conversation", "This conversation isn't available right now.")
        return
      }
      if (error || !roomId) throw error || new Error('No room id returned')

      const { contextId } = await fetchRoomContextId(roomId)
      if (!contextId) throw new Error('Could not resolve the new conversation.')

      setComposeVisible(false)
      navigation.navigate('ChatRoom', {
        contextType: 'direct',
        contextId,
        roomName:    contact.peer_display_name || 'Chat',
        subtitle:    null,
        posterId:    contact.peer_user_id,
        posterName:  contact.peer_display_name,
      })
    } catch {
      Alert.alert('Something went wrong', 'Could not start the conversation. Please try again.')
    } finally {
      setStartingId(null)
    }
  }

  const hasRooms = rooms.length > 0
  const unreadTotal = rooms.reduce((n, r) => n + r.unreadCount, 0)

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>

      {/* Top bar */}
      <View style={styles.topBar}>
        <UBPLogo height={33} color={colors.cream} onPress={() => goToHome(navigation)} />
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => openMenu(navigation)}
          style={styles.menuBtn}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
        >
          <Menu size={20} color={colors.cream} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.composeBtn}
          activeOpacity={0.8}
          onPress={openCompose}
          accessibilityRole="button"
          accessibilityLabel="Start a new conversation"
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
                ? `${formatNumber(unreadTotal)} unread`
                : `${formatNumber(rooms.length)} conversation${rooms.length !== 1 ? 's' : ''}`
              : 'Join a board or carpool route to start chatting'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
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

      {/* ── "New message" composer ── */}
      <Modal
        visible={composeVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setComposeVisible(false)}
      >
        <View style={[styles.composeSheet, { paddingBottom: insets.bottom + 24 }]}>
          <View style={styles.composeHandle} />
          <Text style={styles.composeTitle}>New Message</Text>
          <Text style={styles.composeSub}>
            Start a direct conversation with someone you already share a chat with.
          </Text>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {contactsLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator color={colors.navy} size="small" />
              </View>
            ) : contacts.length > 0 ? (
              contacts.map((contact) => {
                const name    = contact.peer_display_name || 'Member'
                const busy    = startingId === contact.peer_user_id
                const initBg  = roomAvatarColor('direct', colors)
                return (
                  <TouchableOpacity
                    key={contact.peer_user_id}
                    style={styles.contactRow}
                    activeOpacity={0.72}
                    disabled={!!startingId}
                    onPress={() => handlePickContact(contact)}
                  >
                    <View style={[styles.contactAvatar, { backgroundColor: initBg }]}>
                      <Text style={styles.contactAvatarText}>{roomInitials(name)}</Text>
                    </View>
                    <Text style={styles.contactName} numberOfLines={1}>{name}</Text>
                    {busy
                      ? <ActivityIndicator size="small" color={colors.navy} />
                      : <ChevronRight size={14} color={colors.light} />
                    }
                  </TouchableOpacity>
                )
              })
            ) : (
              <View style={styles.composeEmptyWrap}>
                <Text style={styles.composeEmptyTitle}>No one to message yet</Text>
                <Text style={styles.composeEmptySub}>
                  You'll be able to start a direct message here with anyone you've shared a
                  campus board, carpool, or course chat with.
                </Text>
              </View>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.composeCancelBtn}
            onPress={() => setComposeVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.composeCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

function __gs_styles(colors) {
  return StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  topBar: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingTop: 14, paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: 4 },
  composeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(245,240,232,0.12)',
    borderWidth: 1, borderColor: 'rgba(245,240,232,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },

  headingWrap: { paddingHorizontal: spacing.md, paddingTop: 18, paddingBottom: 10 },
  screenTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy },
  screenSub:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, marginTop: 4 },

  // Explicit flex:1 (not just contentContainerStyle) so the ScrollView reliably
  // fills the space below the fixed header on native.
  scrollView: { flex: 1 },
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
  emptyPrimaryBtn: { marginBottom: 12, width: '100%' },
  emptySecondaryBtn:   { paddingVertical: 12 },
  emptySecondaryBtnText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.muted },

  // "New message" composer sheet
  composeSheet: {
    flex: 1, backgroundColor: colors.white,
    paddingHorizontal: spacing.md, paddingTop: 16,
  },
  composeHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(30,58,95,0.14)',
    alignSelf: 'center', marginBottom: 20,
  },
  composeTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.navy, marginBottom: 6 },
  composeSub: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
    lineHeight: 19, marginBottom: 16,
  },

  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.07)',
  },
  contactAvatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  contactAvatarText: { fontFamily: fonts.serif, fontSize: 14, color: colors.cream },
  contactName: { flex: 1, fontFamily: fonts.sansMedium, fontSize: 14, color: colors.navy },

  composeEmptyWrap: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 12 },
  composeEmptyTitle: {
    fontFamily: fonts.serif, fontSize: 18, color: colors.navy,
    marginBottom: 10, textAlign: 'center',
  },
  composeEmptySub: {
    fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
    lineHeight: 20, textAlign: 'center',
  },

  composeCancelBtn: {
    marginTop: 12, marginBottom: 12, alignItems: 'center', paddingVertical: 14,
    backgroundColor: colors.cream, borderRadius: radius.button,
  },
  composeCancelText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  })
}
