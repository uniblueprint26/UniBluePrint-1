import { useCallback, useState } from 'react'
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Share } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Bookmark } from 'lucide-react-native'
import ScreenHeader from '../components/ui/ScreenHeader'
import { fonts, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useSafeGoBack } from '../hooks/useSafeGoBack'
import { FeedPostCard } from '../components/feed/FeedKit'
import {
  fetchSavedPostsWithData, fetchMyReactions, setReaction, clearReaction, unsavePost,
} from '../lib/feed'

// Saved Posts — a private list of every post the signed-in user has
// bookmarked (feed_saved_posts, own-rows-only RLS — see
// supabase/migrations/20261108100000_feed_comments_and_saves.sql). Reuses
// FeedPostCard as-is (same reaction pill, comment/share/save row) so a post
// looks and behaves identically here as it does on Home — unsaving from here
// simply removes it from this list.

export default function SavedPostsScreen({ navigation }) {
  const { colors } = useTheme()
  const styles = __gs_styles(colors)
  const safeGoBack = useSafeGoBack(navigation)
  const { user } = useAuth()

  const [posts, setPosts] = useState([])
  const [myReactions, setMyReactions] = useState({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    if (!user?.id) { setLoading(false); return }
    let cancelled = false
    setLoading(true)
    fetchSavedPostsWithData(user.id)
      .then(async rows => {
        if (cancelled) return
        setPosts(rows)
        const reactions = await fetchMyReactions(rows.map(p => p.id), user.id)
        if (!cancelled) setMyReactions(reactions)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [user?.id])

  // Refetch every time this screen regains focus, so a post unsaved from
  // Home (or saved there for the first time) is reflected here immediately.
  useFocusEffect(useCallback(() => { return load() }, [load]))

  async function handleReact(postId, moodId) {
    if (!user?.id) return
    const prev = myReactions[postId] || null
    setMyReactions(r => ({ ...r, [postId]: moodId }))
    const delta = (moodId ? 1 : 0) - (prev ? 1 : 0)
    if (delta !== 0) {
      setPosts(list => list.map(p => p.id === postId ? { ...p, reaction_count: Math.max(0, p.reaction_count + delta) } : p))
    }
    try {
      if (moodId) await setReaction(postId, user.id, moodId)
      else await clearReaction(postId, user.id)
    } catch {
      setMyReactions(r => ({ ...r, [postId]: prev }))
      if (delta !== 0) {
        setPosts(list => list.map(p => p.id === postId ? { ...p, reaction_count: Math.max(0, p.reaction_count - delta) } : p))
      }
    }
  }

  function handleComment(post) {
    navigation.navigate('CommentThread', { postId: post.id })
  }

  async function handleShare(post) {
    try {
      const text = post.body || 'Check this out on UniBlueprint'
      await Share.share({ message: `${text}\n\nShared from UniBlueprint` })
    } catch { /* cancelled or unavailable — nothing to recover from */ }
  }

  // Unsaving here removes the card from the list outright — there's no
  // "unsaved but still visible" state on a screen whose whole point is
  // "posts I've saved".
  async function handleToggleSave(postId) {
    if (!user?.id) return
    setPosts(list => list.filter(p => p.id !== postId))
    try { await unsavePost(postId, user.id) } catch { load() }
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScreenHeader compact onBack={safeGoBack} title="Saved Posts" />

      {loading ? (
        <View style={styles.centerWrap}>
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={p => p.id}
          renderItem={({ item }) => (
            <FeedPostCard
              post={item}
              myMood={myReactions[item.id] || null}
              onReact={handleReact}
              commentCount={item.comment_count || 0}
              saved
              onComment={() => handleComment(item)}
              onShare={() => handleShare(item)}
              onToggleSave={handleToggleSave}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Bookmark size={28} color={colors.light} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>No saved posts yet</Text>
              <Text style={styles.emptyText}>
                Tap the bookmark icon on any post in your feed to save it here.
              </Text>
            </View>
          }
          contentContainerStyle={{ paddingTop: 14, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

function __gs_styles(colors) {
  return StyleSheet.create({
    screen: { flex: 1 },
    centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyWrap: { alignItems: 'center', paddingTop: 72, paddingHorizontal: spacing.lg, gap: 8 },
    emptyTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.textPrimary, marginTop: 6 },
    emptyText: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 19 },
  })
}
