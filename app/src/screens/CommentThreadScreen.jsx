import { useCallback, useState } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Send, Trash2 } from 'lucide-react-native'
import ScreenHeader from '../components/ui/ScreenHeader'
import { fonts, spacing, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { moodDef } from '../constants/moods'
import { timeAgo } from '../components/feed/FeedKit'
import { fetchPostById, fetchComments, createComment, deleteComment } from '../lib/feed'

function initialsOf(name) {
  if (!name) return '?'
  const parts = String(name).trim().split(/\s+/)
  return (parts[0]?.[0] || '').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
}

// Deterministic avatar tint — same idea as FeedKit's avatarBgFor, duplicated
// here rather than exported since it's purely a cosmetic, non-shared detail.
const AVATAR_BG = ['#FFF7ED', '#F0F9FF', '#FDF4FF', '#F0FDF4', '#EFF6FF', '#FEF2F2']
function avatarBgFor(seed) {
  let hash = 0
  for (const ch of String(seed || '')) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_BG.length
  return AVATAR_BG[Math.abs(hash)]
}

// ── Post preview (read-only, compact) ───────────────────────────────────────
// A trimmed-down version of FeedKit's PostHeader + body/photo, just enough
// context for "what am I commenting on" without pulling in the full
// FeedPostCard (which carries its own reaction/comment/save engagement row
// that doesn't belong twice on this screen).

function PostPreview({ post, colors }) {
  const styles = previewStyles(colors)
  if (!post) return null
  const mood = post.mood ? moodDef(post.mood) : null
  const name = post.author_name || 'UniBlueprint member'
  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={[styles.avatar, { backgroundColor: avatarBgFor(post.user_id) }]}>
          <Text style={styles.avatarText}>{initialsOf(name)}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.nameMoodRow}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {mood && (
              <View style={[styles.moodBadge, { backgroundColor: mood.bg }]}>
                <Text style={[styles.moodBadgeText, { color: mood.color }]}>{mood.emoji} {mood.label}</Text>
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>{timeAgo(post.created_at)}</Text>
        </View>
      </View>
      {!!post.body && <Text style={styles.bodyText}>{post.body}</Text>}
      {post.post_type === 'post' && !!post.photo_url && (
        <Image source={{ uri: post.photo_url }} style={styles.photo} resizeMode="cover" />
      )}
    </View>
  )
}

function previewStyles(colors) {
  return StyleSheet.create({
    wrap: {
      padding: spacing.md,
      borderBottomWidth: 1, borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    avatarText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.navy },
    nameMoodRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
    name: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textPrimary },
    moodBadge: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3 },
    moodBadgeText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5 },
    timestamp: { fontFamily: fonts.sans, fontSize: 11, color: colors.light, marginTop: 1 },
    bodyText: { fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary, lineHeight: 22, marginTop: 12 },
    photo: { width: '100%', height: 220, borderRadius: radius.card, marginTop: 12, backgroundColor: colors.border },
  })
}

// ── One comment row ──────────────────────────────────────────────────────────

function CommentRow({ comment, isOwn, onDelete, colors }) {
  const styles = rowStyles(colors)
  const name = comment.author_name || 'UniBlueprint member'
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: avatarBgFor(comment.user_id) }]}>
        <Text style={styles.avatarText}>{initialsOf(name)}</Text>
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.bubble}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.body}>{comment.body}</Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.timestamp}>{timeAgo(comment.created_at)}</Text>
          {isOwn && (
            <TouchableOpacity
              onPress={() => onDelete(comment.id)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Delete comment"
            >
              <Trash2 size={12} color={colors.light} strokeWidth={1.8} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )
}

function rowStyles(colors) {
  return StyleSheet.create({
    row: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.md, paddingVertical: 10 },
    avatar: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
    avatarText: { fontFamily: fonts.sansBold, fontSize: 11, color: colors.navy },
    bubble: {
      backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
      paddingHorizontal: 12, paddingVertical: 9,
    },
    name: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textPrimary, marginBottom: 2 },
    body: { fontFamily: fonts.sans, fontSize: 13.5, color: colors.textPrimary, lineHeight: 19 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, marginLeft: 4 },
    timestamp: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.light },
  })
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function CommentThreadScreen({ navigation, route }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const insets = useSafeAreaInsets()
  const safeGoBack = useSafeGoBack(navigation)
  const { user } = useAuth()
  const postId = route?.params?.postId

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)

  const load = useCallback(() => {
    if (!postId) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    Promise.all([fetchPostById(postId), fetchComments(postId)])
      .then(([postRow, commentRows]) => {
        if (cancelled) return
        setPost(postRow)
        setComments(commentRows)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [postId])

  // Refetch every time this screen regains focus too — e.g. after navigating
  // away and back — so a comment added from elsewhere (unlikely today, but
  // cheap to keep correct) is never stale.
  useFocusEffect(useCallback(() => { return load() }, [load]))

  async function handleSend() {
    const body = draft.trim()
    if (!body || sending || !user?.id || !postId) return
    setSending(true)
    try {
      const inserted = await createComment({ postId, userId: user.id, body })
      setComments(prev => [...prev, {
        ...inserted,
        author_name: inserted.author_name || user.user_metadata?.full_name || user.email?.split('@')[0] || null,
      }])
      setDraft('')
    } catch {
      // Best effort — the draft text stays in the input so nothing is lost.
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(commentId) {
    if (!user?.id) return
    setComments(prev => prev.filter(c => c.id !== commentId))
    try { await deleteComment(commentId, user.id) } catch { load() }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        compact
        onBack={safeGoBack}
        title="Comments"
        subtitle={comments.length > 0 ? `${comments.length} comment${comments.length === 1 ? '' : 's'}` : null}
      />

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={c => c.id}
          ListHeaderComponent={<PostPreview post={post} colors={colors} />}
          renderItem={({ item }) => (
            <CommentRow comment={item} isOwn={item.user_id === user?.id} onDelete={handleDelete} colors={colors} />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No comments yet. Be the first to say something.</Text>
          }
          contentContainerStyle={{ paddingBottom: 12 }}
          style={{ flex: 1 }}
        />
      )}

      <View style={[styles.composerRow, { paddingBottom: insets.bottom + 10 }]}>
        <TextInput
          style={styles.input}
          placeholder="Write a comment…"
          placeholderTextColor={colors.textTertiary}
          value={draft}
          onChangeText={setDraft}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: draft.trim() ? colors.accentBg : colors.border }]}
          onPress={handleSend}
          disabled={!draft.trim() || sending}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Send comment"
        >
          <Send size={16} color={draft.trim() ? colors.accentFg : colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: {
      fontFamily: fonts.sans, fontSize: 13, color: colors.muted,
      textAlign: 'center', paddingVertical: 28, paddingHorizontal: spacing.md,
    },
    composerRow: {
      flexDirection: 'row', alignItems: 'flex-end', gap: 10,
      paddingHorizontal: spacing.md, paddingTop: 10,
      borderTopWidth: 1, borderTopColor: colors.border,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1, maxHeight: 100, minHeight: 40,
      fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
      backgroundColor: colors.surfaceAlt, borderRadius: radius.pill,
      borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 14, paddingVertical: 10,
    },
    sendBtn: {
      width: 38, height: 38, borderRadius: 19,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
  })
}
