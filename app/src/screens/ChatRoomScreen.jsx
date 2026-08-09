/**
 * ChatRoomScreen — the single reusable chat room used across the platform.
 *
 * Route params:
 *   contextType  'ad' | 'carpool' | 'board' | 'direct'
 *   contextId    stable string id for the parent context
 *   roomName     display title (shown in header)
 *   subtitle     secondary header line (optional)
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, KeyboardAvoidingView, Platform,
  ActivityIndicator, Modal, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import {
  ChevronLeft, MoreVertical, Send, MessageSquare,
  Flag, UserX,
} from 'lucide-react-native'

import { colors, fonts, spacing, radius, shadows } from '../constants/theme'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../hooks/useChat'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChatTime(dateStr) {
  if (!dateStr) return ''
  const d       = new Date(dateStr)
  const hours   = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm    = hours < 12 ? 'am' : 'pm'
  return `${hours % 12 || 12}:${minutes}${ampm}`
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatRoomScreen({ navigation, route }) {
  const { contextType, contextId, roomName, subtitle } = route.params ?? {}
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const userId          = user?.id
  const userDisplayName = user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || 'Anonymous'

  const [input,       setInput]       = useState('')
  const [moreVisible, setMoreVisible] = useState(false)
  const [sending,     setSending]     = useState(false)
  const scrollRef = useRef(null)

  const { messages, isLoading, error, sendMessage, markRead } = useChat({
    contextType,
    contextId,
    roomName,
    userId,
    userDisplayName,
  })

  // Mark messages as read whenever this screen is focused
  useFocusEffect(useCallback(() => {
    markRead()
  }, [markRead]))

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true })
      }, 80)
      return () => clearTimeout(timer)
    }
  }, [messages.length])

  async function handleSend() {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setSending(true)
    try {
      await sendMessage(text)
    } catch {
      setInput(text) // restore on failure so the user doesn't lose their message
    } finally {
      setSending(false)
    }
  }

  function handleReport() {
    setMoreVisible(false)
    Alert.alert(
      'Report Content',
      'This room and its messages will be reviewed by the UniBlueprint moderation team. Thank you for helping keep the community safe.',
      [{ text: 'OK' }]
    )
  }

  function handleBlock() {
    setMoreVisible(false)
    Alert.alert(
      'Block a User',
      'Full block and moderation tools are coming soon. For urgent issues, contact the team at uniblueprintoperations@gmail.com.',
      [{ text: 'OK' }]
    )
  }

  // Group messages: annotate each with display metadata
  const grouped = messages.map((msg, i) => {
    const isOwn = msg.user_id === userId
    const showName = !isOwn && (i === 0 || messages[i - 1].user_id !== msg.user_id)
    const showTime = i === messages.length - 1 || messages[i + 1].user_id !== msg.user_id
    return { ...msg, isOwn, showName, showTime }
  })

  return (
    <KeyboardAvoidingView
      style={s.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >

      {/* ── Header ── */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ChevronLeft size={20} color={colors.cream} strokeWidth={2} />
          <Text style={s.backBtnText}>Back</Text>
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle} numberOfLines={1}>{roomName || 'Chat'}</Text>
          {!!subtitle && <Text style={s.headerSub} numberOfLines={1}>{subtitle}</Text>}
        </View>
        <TouchableOpacity
          style={s.moreBtn}
          onPress={() => setMoreVisible(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <MoreVertical size={18} color="rgba(245,240,232,0.65)" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* ── Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={s.messagesScroll}
        contentContainerStyle={s.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
      >

        {isLoading && (
          <View style={s.centerState}>
            <ActivityIndicator color={colors.navy} size="small" />
          </View>
        )}

        {!isLoading && !!error && (
          <View style={s.centerState}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        {!isLoading && !error && messages.length === 0 && (
          <View style={s.centerState}>
            <View style={s.emptyIconBox}>
              <MessageSquare size={28} color={colors.navy} strokeWidth={1.4} />
            </View>
            <Text style={s.emptyTitle}>No messages yet</Text>
            <Text style={s.emptySub}>Be the first to say something.</Text>
          </View>
        )}

        {grouped.map((msg) => (
          <View
            key={msg.id}
            style={[s.bubbleWrap, msg.isOwn ? s.bubbleWrapOwn : s.bubbleWrapOther]}
          >
            {msg.showName && (
              <Text style={s.senderName}>{msg.author_name}</Text>
            )}
            <View style={[s.bubble, msg.isOwn ? s.bubbleOwn : s.bubbleOther]}>
              <Text style={[s.bubbleText, msg.isOwn ? s.bubbleTextOwn : s.bubbleTextOther]}>
                {msg.content}
              </Text>
            </View>
            {msg.showTime && (
              <Text style={[s.bubbleTime, msg.isOwn ? s.bubbleTimeOwn : {}]}>
                {formatChatTime(msg.created_at)}
              </Text>
            )}
          </View>
        ))}

        {/* Bottom padding so last message clears the input bar */}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* ── Input bar ── */}
      <View style={[s.inputBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 4 : 16 }]}>
        <TextInput
          style={s.input}
          placeholder="Write a message..."
          placeholderTextColor={colors.light}
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          returnKeyType="default"
          scrollEnabled
        />
        <TouchableOpacity
          style={[s.sendBtn, (!input.trim() || sending) && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
          activeOpacity={0.8}
        >
          {sending
            ? <ActivityIndicator size="small" color={colors.cream} />
            : <Send size={16} color={input.trim() ? colors.cream : colors.light} strokeWidth={2} />
          }
        </TouchableOpacity>
      </View>

      {/* ── Block / Report modal stub ── */}
      <Modal
        visible={moreVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setMoreVisible(false)}
      >
        <View style={s.moreSheet}>
          <View style={s.moreHandle} />

          <TouchableOpacity style={s.moreRow} onPress={handleReport} activeOpacity={0.75}>
            <View style={[s.moreIcon, { backgroundColor: '#FEF3C7' }]}>
              <Flag size={16} color="#92400E" strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.moreRowTitle}>Report content</Text>
              <Text style={s.moreRowSub}>
                Flag this room for review by our moderation team.
              </Text>
            </View>
          </TouchableOpacity>

          <View style={s.moreDivider} />

          <TouchableOpacity style={s.moreRow} onPress={handleBlock} activeOpacity={0.75}>
            <View style={[s.moreIcon, { backgroundColor: '#FEF2F2' }]}>
              <UserX size={16} color="#DC2626" strokeWidth={1.8} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.moreRowTitle, { color: colors.destructive }]}>
                Block a user
              </Text>
              <Text style={s.moreRowSub}>
                Coming soon. Contact uniblueprintoperations@gmail.com for urgent issues.
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.moreCancelBtn}
            onPress={() => setMoreVisible(false)}
            activeOpacity={0.8}
          >
            <Text style={s.moreCancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.cream },

  // Header
  header: {
    backgroundColor: colors.navy,
    paddingHorizontal: spacing.md,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingBottom: 2, flexShrink: 0,
  },
  backBtnText:  { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.cream },
  headerCenter: { flex: 1, alignItems: 'center', paddingBottom: 2 },
  headerTitle:  { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.cream, textAlign: 'center' },
  headerSub:    { fontFamily: fonts.sans, fontSize: 11, color: 'rgba(245,240,232,0.55)', marginTop: 2, textAlign: 'center' },
  moreBtn:      { width: 28, alignItems: 'flex-end', flexShrink: 0, paddingBottom: 2 },

  // Message area
  messagesScroll:  { flex: 1 },
  messagesContent: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },

  centerState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  errorText:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  emptyIconBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.card,
  },
  emptyTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.navy },
  emptySub:   { fontFamily: fonts.sans, fontSize: 13, color: colors.muted },

  // Bubbles
  bubbleWrap:      { marginBottom: 2, maxWidth: '78%' },
  bubbleWrapOwn:   { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapOther: { alignSelf: 'flex-start', alignItems: 'flex-start' },

  senderName: {
    fontFamily: fonts.sansSemiBold, fontSize: 11,
    color: colors.muted, marginBottom: 3, marginLeft: 4,
  },

  bubble:      { borderRadius: 14, paddingHorizontal: 13, paddingVertical: 9, maxWidth: '100%' },
  bubbleOwn:   { backgroundColor: colors.navy, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.white, borderBottomLeftRadius: 4, ...shadows.card },

  bubbleText:      { fontFamily: fonts.sans, fontSize: 14, lineHeight: 20 },
  bubbleTextOwn:   { color: colors.cream },
  bubbleTextOther: { color: colors.navy },

  bubbleTime:    { fontFamily: fonts.sans, fontSize: 10, color: colors.light, marginTop: 3, marginBottom: 10, marginLeft: 4 },
  bubbleTimeOwn: { marginLeft: 0, marginRight: 4, textAlign: 'right' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(30,58,95,0.08)',
  },
  input: {
    flex: 1,
    fontFamily: fonts.sans, fontSize: 14,
    color: colors.navy,
    backgroundColor: colors.cream,
    borderRadius: radius.button,
    paddingHorizontal: 14,
    paddingTop: 10, paddingBottom: 10,
    maxHeight: 120,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.12)',
    lineHeight: 20,
  },
  sendBtn:         {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  sendBtnDisabled: { backgroundColor: 'rgba(30,58,95,0.18)' },

  // More / block-report sheet
  moreSheet: {
    flex: 1, backgroundColor: colors.white,
    paddingHorizontal: spacing.md, paddingTop: 16, paddingBottom: 32,
  },
  moreHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: 'rgba(30,58,95,0.14)',
    alignSelf: 'center', marginBottom: 24,
  },
  moreRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14,
  },
  moreIcon: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  moreRowTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
  moreRowSub:   { fontFamily: fonts.sans, fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
  moreDivider:  { height: 1, backgroundColor: 'rgba(30,58,95,0.07)' },
  moreCancelBtn: {
    marginTop: 24, alignItems: 'center', paddingVertical: 14,
    backgroundColor: colors.cream, borderRadius: radius.button,
  },
  moreCancelText: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.navy },
})
