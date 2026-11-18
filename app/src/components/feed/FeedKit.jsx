import { memo, useState, useRef, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Modal, Linking, ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Smile, ExternalLink, Users, MessageCircle, Send, Bookmark, Play, Plus, Video, Image as ImageIcon, Flame, WifiOff, RotateCcw } from 'lucide-react-native'
import { fonts, radius, spacing, shadows, sheen } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'
import { MOODS, moodDef } from '../../constants/moods'
import { BUZZ_WINDOWS, CAMPUS_PULSE_MIN_THREADS } from '../../lib/feed'
import { PILLARS, AUDIENCES } from '../../constants/pillars'
import { avatarColorFor, initialsFor } from '../../screens/DirectoryScreen'
import UbpLoader from '../brand/UbpLoader'

// ── shared helpers ───────────────────────────────────────────────────────────

export function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

function initialsOf(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] || '').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
}

// A thin gradient "ring" behind an avatar circle — the one place gold earns
// its keep as a genuinely special accent (an identity frame), not a
// workhorse color. Renders the gradient as a slightly larger circle behind
// the real avatar, with a small gap so the ring actually reads as a ring
// rather than a glow bleeding into the avatar itself.
export function AvatarRing({ size, children }) {
  const ringSize = size + 5
  return (
    <View style={{ width: ringSize, height: ringSize, alignItems: 'center', justifyContent: 'center' }}>
      <LinearGradient
        colors={['#E4C77E', '#C9A24B', '#A5813B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', width: ringSize, height: ringSize, borderRadius: ringSize / 2 }}
      />
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  )
}

// A soft glossy highlight along the top edge of an elevated surface — real
// light-catching depth instead of a flat color with a border drawn around
// it. Absolutely positioned over whatever it wraps; pointerEvents 'none' so
// it never intercepts taps.
function Sheen({ isDark, radius: r }) {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={isDark ? sheen.dark : sheen.light}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '55%', borderTopLeftRadius: r, borderTopRightRadius: r }}
    />
  )
}

// ── Composer entry bar ───────────────────────────────────────────────────────
// One quiet line: your initial, a prompt, and a plain "+" at the right. No
// camera or smiley buttons; the Composer itself offers every post type.

export function ComposerEntryBar({ name, onPress }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  return (
    <TouchableOpacity style={k.composerBar} onPress={onPress} activeOpacity={0.88} accessibilityRole="button" accessibilityLabel="Share something">
      <View style={k.composerAvatar}><Text style={k.composerAvatarText}>{initialsOf(name).slice(0, 1) || 'Y'}</Text></View>
      <Text style={k.composerPlaceholder} numberOfLines={1}>Share something</Text>
      <Plus size={24} color={colors.textPrimary} strokeWidth={1.9} />
    </TouchableOpacity>
  )
}

// ── Buzz strip (filter chips) ────────────────────────────────────────────────

export function BuzzStrip({ selected, onSelect }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  return (
    <View style={k.buzzRow}>
      <Text style={k.buzzEyebrow}>This week's buzz</Text>
      <View style={k.buzzChipsRow}>
        {BUZZ_WINDOWS.map(w => {
          const active = w.id === selected
          return (
            <TouchableOpacity
              key={w.id}
              onPress={() => onSelect(w.id)}
              style={[k.buzzChip, active && k.buzzChipActive]}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`${w.label} buzz window`}
              accessibilityState={{ selected: active }}
            >
              <Text style={[k.buzzChipText, active && k.buzzChipTextActive]}>{w.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

// ── Mood Pulse ───────────────────────────────────────────────────────────────
// Named "Mood Pulse" (not "Campus Pulse") deliberately — Campus Connect
// already has its own real "Campus Pulse" feature (a weekly rotating prompt
// + replies, see components/campusConnect/CampusPulseCard.jsx), a wholly
// different thing. This widget aggregates mood tags across Mood Board posts
// app-wide, not scoped to campus specifically, so neither the name nor the
// data pretends otherwise. Reused with a `title` override per screen
// ("Campus Mood" / "Course Mood") so it reads as that screen's own flavour
// of the same signal rather than one more "Pulse"-branded thing.
//
// Given its own quiet card rather than floating loose on the page — the six
// mood colors are a real, useful signal, but showing them all at full
// strength with nothing containing them was competing with the navy/cream
// identity. A composed card reads as "here's a considered data point," not
// a stray rainbow strip.

export function MoodPulse({ pulse, title = 'Mood Pulse' }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  const total = pulse?.total || 0
  const hasEnoughData = total >= CAMPUS_PULSE_MIN_THREADS

  return (
    <View style={k.pulseWrap}>
      <Text style={k.buzzEyebrow}>{title}</Text>
      <View style={k.pulseCard}>
        {hasEnoughData ? (
          <>
            <View style={k.pulseBar}>
              {MOODS.map(m => {
                const count = pulse.counts[m.id] || 0
                const share = count / total
                if (share <= 0) return null
                return <View key={m.id} style={{ flex: share, backgroundColor: m.color, opacity: 0.88 }} />
              })}
            </View>
            <View style={k.pulseLegend}>
              {MOODS.map(m => (
                <View key={m.id} style={k.pulseLegendItem}>
                  <View style={[k.pulseLegendDot, { backgroundColor: m.color }]} />
                  <Text style={k.pulseLegendText}>{m.emoji} {m.label}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={k.pulsePlaceholder}>
            <Text style={k.pulsePlaceholderText}>This is where your Campus Pulse will show</Text>
          </View>
        )}
      </View>
    </View>
  )
}

// ── Mood reaction picker (bottom sheet) ─────────────────────────────────────

export function MoodPickerSheet({ visible, currentMood, onPick, onClose }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={k.sheetBackdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={k.sheet} onPress={() => {}}>
          <Text style={k.sheetTitle}>React with a mood</Text>
          <View style={k.sheetGrid}>
            {MOODS.map(m => {
              const selected = m.id === currentMood
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    k.sheetChip,
                    selected ? { backgroundColor: m.bg, borderColor: m.color } : { backgroundColor: colors.surfaceAlt, borderColor: 'transparent' },
                  ]}
                  onPress={() => onPick(m.id)}
                  activeOpacity={0.8}
                >
                  <Text style={k.sheetEmoji}>{m.emoji}</Text>
                  <Text style={[k.sheetLabel, { color: selected ? m.color : colors.textPrimary }]}>{m.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  )
}

// ── Reaction pill (shared by post + highlight cards) ────────────────────────
// Icon-only when there's nothing to react with yet — no "React" text label.
// Real apps never caption the action, just show the icon; a count only
// appears once there's a real count to show.

function ReactionPill({ myMood, count, onPress, colors, k }) {
  const def = myMood ? moodDef(myMood) : null
  return (
    <TouchableOpacity
      style={[k.reactPill, def ? { backgroundColor: def.bg } : null]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={def ? `Reacted ${def.label}, ${count || 0}` : `React with a mood, ${count || 0}`}
    >
      {def ? <Text style={k.reactPillEmoji}>{def.emoji}</Text> : <Smile size={17} color={colors.textPrimary} strokeWidth={1.8} />}
      {count > 0 && (
        <Text style={[k.reactPillText, def ? { color: def.color } : null]}>{count}</Text>
      )}
    </TouchableOpacity>
  )
}

// ── Engagement row (reaction pill, comment, share, save) ───────────────────
// The reaction pill (a mood) IS the "Like" mechanic, never a second plain
// heart alongside it. Comment and Share sit beside it; Save is pushed to the
// far right.

function EngagementRow({ post, myMood, onReact, commentCount, saved, onComment, onShare, onToggleSave, colors, k }) {
  const [sheetOpen, setSheetOpen] = useState(false)

  function handlePick(moodId) {
    setSheetOpen(false)
    onReact(post.id, moodId === myMood ? null : moodId)
  }

  return (
    <>
      <View style={k.engagementRow}>
        <ReactionPill myMood={myMood} count={post.reaction_count} onPress={() => setSheetOpen(true)} colors={colors} k={k} />
        <TouchableOpacity
          style={k.engageBtn}
          onPress={() => onComment?.(post)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Comment, ${commentCount || 0}`}
        >
          <MessageCircle size={19} color={colors.textSecondary} strokeWidth={1.8} />
          {commentCount > 0 && <Text style={k.engageBtnText}>{commentCount}</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={k.engageBtn}
          onPress={() => onShare?.(post)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Share"
        >
          <Send size={18} color={colors.textSecondary} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          style={k.engageBtn}
          onPress={() => onToggleSave?.(post.id)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={saved ? 'Remove from Saved Posts' : 'Save post'}
          accessibilityState={{ selected: !!saved }}
        >
          <Bookmark
            size={19}
            color={saved ? colors.textPrimary : colors.textSecondary}
            fill={saved ? colors.textPrimary : 'transparent'}
            strokeWidth={1.8}
          />
        </TouchableOpacity>
      </View>
      <MoodPickerSheet visible={sheetOpen} currentMood={myMood} onPick={handlePick} onClose={() => setSheetOpen(false)} />
    </>
  )
}

// ── Chips ────────────────────────────────────────────────────────────────────

function Chip({ icon, label, color, k, colors, tinted }) {
  return (
    <View style={[k.chip, tinted && color ? { backgroundColor: color + '1F', borderColor: color + '55' } : null]}>
      {icon}
      <Text style={k.chipText} numberOfLines={1}>{label}</Text>
    </View>
  )
}

// Where this post goes. Missing audience means Course Connect (the default,
// public across Ireland).
function AudienceChip({ audience, k, colors }) {
  const key = AUDIENCES[audience] ? audience : 'course'
  const def = AUDIENCES[key]
  if (def.pillar) {
    const p = PILLARS[def.pillar]
    const Icon = p.Icon
    return <Chip tinted color={p.color} label={def.label} k={k} colors={colors} icon={<Icon size={15} color={p.color} strokeWidth={1.8} />} />
  }
  return <Chip label={def.label} k={k} colors={colors} icon={<Users size={14} color={colors.textSecondary} strokeWidth={1.9} />} />
}

// Post type tag for the two shapes that are not a Mood Board.
function TypeChip({ post, k, colors }) {
  if (post.post_type === 'clip') {
    return <Chip label="Clip" k={k} colors={colors} icon={<Video size={14} color={colors.textSecondary} strokeWidth={1.9} />} />
  }
  if (post.post_type === 'post') {
    return <Chip label="Post" k={k} colors={colors} icon={<ImageIcon size={14} color={colors.textSecondary} strokeWidth={1.9} />} />
  }
  return null
}

// UBP-written content has no author. Real student posts never get the tag.
function isFromUBP(post) {
  return !post.user_id
}

function PostChips({ post, highlight, colors, k }) {
  const mood = post.mood ? moodDef(post.mood) : null
  return (
    <View style={k.chipsRow}>
      {highlight && (
        <Chip label="Buzzing" k={k} colors={colors} icon={<Flame size={14} color={colors.textPrimary} strokeWidth={1.9} />} />
      )}
      {mood && (
        <View style={[k.chip, { backgroundColor: mood.bg, borderColor: 'transparent' }]}>
          <Text style={k.chipEmoji}>{mood.emoji}</Text>
          <Text style={k.chipText} numberOfLines={1}>{mood.label}</Text>
        </View>
      )}
      <AudienceChip audience={post.audience} k={k} colors={colors} />
      <TypeChip post={post} k={k} colors={colors} />
    </View>
  )
}

// ── Post header (avatar, name, handle, timestamp) ───────────────────────────

function PostHeader({ post, k }) {
  const ubp = isFromUBP(post)
  const name = post.author_name || (ubp ? 'UniBlueprint' : 'UniBlueprint member')
  const handle = post.author_handle ? `@${String(post.author_handle).replace(/^@/, '')}` : null
  return (
    <View style={k.cardHeaderRow}>
      <View style={[k.avatar, { backgroundColor: ubp ? '#1E3A5F' : avatarColorFor(post.user_id || name) }]}>
        <Text style={k.avatarText}>{ubp && !post.author_name ? 'UBP' : initialsOf(name)}</Text>
      </View>
      <View style={k.nameRow}>
        <Text style={k.name} numberOfLines={1}>{name}</Text>
        {!!handle && <Text style={k.handle} numberOfLines={1}>{handle}</Text>}
        <Text style={k.timestamp}>{timeAgo(post.created_at)}</Text>
      </View>
      {ubp && (
        <View style={k.ubpTag}><Text style={k.ubpTagText}>From UBP</Text></View>
      )}
    </View>
  )
}

// ── Memoization comparator (shared by FeedPostCard/BuzzingHighlightCard) ───
// Deliberately omits onReact/onComment/onShare/onToggleSave: HomeScreen
// recreates all four on every render (they're plain function declarations,
// not useCallback-wrapped), so comparing them would make this memoization a
// no-op. That's safe to ignore, not just convenient, because of how
// HomeScreen's handlers are written:
//   - handleReact/handleToggleSave mutate state only through React's
//     functional setState form (`setMyReactions(r => ...)`, `setFeedPosts(
//     posts => ...)`, `setSavedPostIds(prev => ...)`), which always applies
//     against the LATEST state at call time, never a closure snapshot — so a
//     stale closure can't write stale data.
//   - Their one direct (non-functional) reads — `myReactions[postId]` in
//     handleReact, `savedPostIds.has(postId)` in handleToggleSave — are keyed
//     by THIS card's own post id. The only way that specific value could
//     differ between the stale closure and current state is if THIS post's
//     own myMood/saved status changed — and that's exactly the condition the
//     comparator below checks, which forces a fresh render (and a fresh
//     closure) before that could happen. A stale closure only exists while
//     this post's own myMood/saved value hasn't moved, so the read is always
//     current when it matters.
//   - handleCommentPost/handleSharePost read no per-post mutable state at
//     all, so staleness isn't a concern for them either.
// `post` is compared by reference, not deep-equality: HomeScreen's
// handleReact updates feedPosts via `posts.map(p => p.id === postId ? {
// ...p, reaction_count } : p)`, which hands back the exact same object
// reference for every post that wasn't the one just reacted to — so
// reference equality already correctly detects "this post's own data
// changed" without a manual field-by-field diff.
function arePostCardPropsEqual(prevProps, nextProps) {
  return (
    prevProps.post === nextProps.post &&
    prevProps.myMood === nextProps.myMood &&
    prevProps.commentCount === nextProps.commentCount &&
    prevProps.saved === nextProps.saved
  )
}

// No in-app video player is installed, so a Clip renders as a tile that opens
// the video itself. The tile shows the clip's cover image when the post has one
// (cover_url, or thumbnail_url), otherwise a branded dark tile with the UBP
// mark. While the cover loads or the clip is opening it shows the UBP loader,
// and if the clip cannot be opened (no connection, or the link fails) it shows
// an error with Try again.
//
// Connectivity: there is no network-info package installed, so the tile only
// knows the connection is down on web (navigator.onLine). On a phone it finds
// out when opening the clip fails.
const OPENING_MIN_MS = 900

function isOffline() {
  try {
    return typeof navigator !== 'undefined' && navigator.onLine === false
  } catch { return false }
}

function ClipTile({ post, k, colors }) {
  const cover = post.cover_url || post.thumbnail_url || null
  const [coverState, setCoverState] = useState(cover ? 'loading' : 'none') // loading | ready | failed | none
  const [phase, setPhase] = useState('idle') // idle | opening | error
  const [errorKind, setErrorKind] = useState('failed') // offline | failed
  const timer = useRef(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  if (post.post_type !== 'clip' || !post.video_url) return null

  async function open() {
    if (phase === 'opening') return
    if (isOffline()) { setErrorKind('offline'); setPhase('error'); return }
    setPhase('opening')
    const started = Date.now()
    let ok = true
    try { await Linking.openURL(post.video_url) } catch { ok = false }
    const wait = Math.max(0, OPENING_MIN_MS - (Date.now() - started))
    timer.current = setTimeout(() => {
      if (ok) { setPhase('idle') } else { setErrorKind(isOffline() ? 'offline' : 'failed'); setPhase('error') }
    }, wait)
  }

  const showCover = !!cover && coverState !== 'failed'
  const coverLoading = showCover && coverState === 'loading'

  return (
    <TouchableOpacity
      style={[k.photo, k.clipTile]}
      onPress={open}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={phase === 'error' ? 'Clip could not load. Try again' : 'Play clip'}
    >
      {showCover && (
        <Image
          source={{ uri: cover }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onLoad={() => setCoverState('ready')}
          onError={() => setCoverState('failed')}
        />
      )}
      {showCover && coverState === 'ready' && <View style={k.clipScrim} pointerEvents="none" />}
      {!showCover && phase === 'idle' && (
        <View style={k.clipBrand} pointerEvents="none">
          <Text style={k.clipBrandText}>UBP</Text>
          <View style={k.clipBrandLine} />
        </View>
      )}

      {phase === 'idle' && !coverLoading && (
        <View style={k.clipPlay}>
          <Play size={26} color="#FBF6E8" fill="#FBF6E8" strokeWidth={1.6} />
        </View>
      )}
      {(phase === 'opening' || (phase === 'idle' && coverLoading)) && (
        <View style={[StyleSheet.absoluteFill, k.clipOverlay]} pointerEvents="none">
          <UbpLoader size={30} label={phase === 'opening' ? 'Opening clip' : undefined} />
        </View>
      )}
      {phase === 'error' && (
        <View style={[StyleSheet.absoluteFill, k.clipOverlay, k.clipError]}>
          <WifiOff size={24} color="#FBF6E8" strokeWidth={1.7} />
          <Text style={k.clipErrorTitle}>{errorKind === 'offline' ? 'No connection' : "Couldn't load this clip"}</Text>
          <Text style={k.clipErrorSub}>{errorKind === 'offline' ? 'Check your connection and try again.' : 'Please try again in a moment.'}</Text>
          <View style={k.clipRetry}>
            <RotateCcw size={14} color="#0F1720" strokeWidth={2.2} />
            <Text style={k.clipRetryText}>Try again</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  )
}

// ── The expanded post card (Mood Board, Post or Clip) ───────────────────────
// Avatar, name and time; a row of chips (mood, where it goes, post type); the
// words; a photo or clip; then the engagement row.

function PostCardBody({ post, myMood, onReact, commentCount, saved, onComment, onShare, onToggleSave, highlight }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  return (
    <View style={k.postCard}>
      <PostHeader post={post} k={k} />
      <PostChips post={post} highlight={highlight} colors={colors} k={k} />
      {!!post.body && <Text style={k.bodyText}>{post.body}</Text>}
      {post.post_type === 'post' && !!post.photo_url && (
        <Image source={{ uri: post.photo_url }} style={k.photo} resizeMode="cover" />
      )}
      <ClipTile post={post} k={k} colors={colors} />
      <EngagementRow
        post={post}
        myMood={myMood}
        onReact={onReact}
        commentCount={commentCount}
        saved={saved}
        onComment={onComment}
        onShare={onShare}
        onToggleSave={onToggleSave}
        colors={colors}
        k={k}
      />
    </View>
  )
}

export const FeedPostCard = memo(function FeedPostCard(props) {
  return <PostCardBody {...props} />
}, arePostCardPropsEqual)

// ── Buzzing highlight card ───────────────────────────────────────────────────
// Same card, with a "Buzzing" chip at the front of the chip row.

export const BuzzingHighlightCard = memo(function BuzzingHighlightCard(props) {
  return <PostCardBody {...props} highlight />
}, arePostCardPropsEqual)

// ── Promoted placement ("Ad") card ───────────────────────────────────────────

export function AdCard({ placement }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  const hasCta = !!placement.cta_label && !!placement.cta_url
  return (
    <View style={[k.card, k.adCard]}>
      <Sheen isDark={isDark} radius={radius.card} />
      <View style={k.adLabelRow}>
        <View style={k.adLabel}><Text style={k.adLabelText}>Ad</Text></View>
        <Text style={k.adSponsor} numberOfLines={1}>{placement.sponsor_name}</Text>
      </View>
      <Text style={k.adTitle}>{placement.title}</Text>
      {!!placement.body && <Text style={k.adBody}>{placement.body}</Text>}
      {!!placement.image_url && (
        <Image source={{ uri: placement.image_url }} style={k.adImage} resizeMode="cover" />
      )}
      {hasCta && (
        <TouchableOpacity style={k.adCtaBtn} onPress={() => Linking.openURL(placement.cta_url)} activeOpacity={0.85}>
          <Text style={k.adCtaText}>{placement.cta_label}</Text>
          <ExternalLink size={13} color={colors.accentFg} strokeWidth={2} />
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Suggested profiles card ──────────────────────────────────────────────────
// Reuses DirectoryScreen's get_directory_profiles() candidates (already
// discoverable/block-filtered) and its own avatarColorFor/initialsFor, so a
// person renders identically here and in the Directory. Connect re-plays
// DirectoryScreen's own "start a direct chat" flow via the handlers passed
// down from HomeScreen.

export function SuggestedProfilesCard({ profiles, connectingId, onConnect, onViewProfile }) {
  const { colors, isDark } = useTheme()
  const k = getStyles(colors, isDark)
  if (!profiles?.length) return null
  return (
    <View style={[k.card, k.suggestedCard]}>
      <Sheen isDark={isDark} radius={radius.card} />
      <View style={k.suggestedEyebrowRow}>
        <Users size={13} color={colors.muted} strokeWidth={1.9} />
        <Text style={k.suggestedEyebrow}>Suggested for you</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={k.suggestedRow}>
        {profiles.map(p => (
          <View key={p.id} style={k.suggestedChip}>
            <TouchableOpacity activeOpacity={0.75} onPress={() => onViewProfile?.(p)}>
              <AvatarRing size={44}>
                <View style={[k.suggestedAvatar, { backgroundColor: avatarColorFor(p.id) }]}>
                  <Text style={k.suggestedAvatarText}>{initialsFor(p.full_name)}</Text>
                </View>
              </AvatarRing>
              <Text style={k.suggestedName} numberOfLines={1}>{p.full_name || 'UniBlueprint member'}</Text>
              {!!p.course && <Text style={k.suggestedMeta} numberOfLines={1}>{p.course}</Text>}
            </TouchableOpacity>
            <TouchableOpacity
              style={k.suggestedConnectBtn}
              activeOpacity={0.85}
              disabled={connectingId === p.id}
              onPress={() => onConnect?.(p)}
            >
              <Text style={k.suggestedConnectText}>{connectingId === p.id ? 'Connecting…' : 'Connect'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────────────────────
// Theme-aware (light/dark) — every FeedKit component calls useTheme() itself
// and builds its own copy of these via getStyles(colors, isDark). Cards lean
// on `shadows.glow`/`glowDark` for elevation instead of a border fighting a
// shadow — see theme.js's comment on why that read as "blocky."

function getStyles(colors, isDark) {
  const cardShadow = isDark ? shadows.glowDark : shadows.glow
  return StyleSheet.create({
  composerBar: {
    backgroundColor: colors.surface, borderRadius: radius.pill + 8,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    paddingVertical: 11, paddingLeft: 11, paddingRight: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  composerAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: colors.navy,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    borderWidth: isDark ? 1 : 0, borderColor: colors.border,
  },
  composerAvatarText: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.cream },
  composerPlaceholder: { flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.textSecondary },

  buzzRow: { marginTop: 8 },
  buzzEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 12,
  },
  buzzChipsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  buzzChip: {
    borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 7,
    backgroundColor: colors.surfaceAlt,
  },
  buzzChipActive: { backgroundColor: colors.accentBg },
  buzzChipText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.muted },
  buzzChipTextActive: { color: colors.accentFg },

  pulseWrap: { marginTop: 20 },
  pulseCard: {
    backgroundColor: colors.surface, borderRadius: radius.card,
    padding: spacing.md, ...cardShadow,
  },
  pulseBar: {
    flexDirection: 'row', height: 9, borderRadius: 4.5, overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  pulseLegend: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  pulseLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  pulseLegendDot: { width: 7, height: 7, borderRadius: 3.5 },
  pulseLegendText: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted },
  pulsePlaceholder: {
    height: 9, borderRadius: 4.5, borderWidth: 1.5, borderColor: colors.border,
    borderStyle: 'dashed', backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8,
  },
  pulsePlaceholderText: {
    fontFamily: fonts.sans, fontSize: 9, color: colors.light,
    position: 'absolute', top: 13,
  },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(11,22,35,0.55)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.md, paddingBottom: 28,
  },
  sheetTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary, marginBottom: 14, textAlign: 'center' },
  sheetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sheetChip: {
    width: '31%', borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 12, alignItems: 'center', gap: 4,
  },
  sheetEmoji: { fontSize: 22, lineHeight: 24 },
  sheetLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, textAlign: 'center' },

  card: {
    marginHorizontal: spacing.md, marginBottom: 16,
    backgroundColor: colors.surface, borderRadius: radius.card,
    overflow: 'hidden',
    ...cardShadow,
  },
  postCard: {
    marginHorizontal: spacing.md, marginBottom: 16,
    backgroundColor: colors.surface, borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    padding: 16,
    ...cardShadow,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontFamily: fonts.sansBold, fontSize: 14, color: '#FBF6E8' },
  nameRow: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  name: { fontFamily: fonts.sansBold, fontSize: 15.5, color: colors.textPrimary, flexShrink: 1 },
  handle: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, flexShrink: 2 },
  timestamp: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, flexShrink: 0 },

  ubpTag: {
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 9, paddingVertical: 3, flexShrink: 0,
  },
  ubpTagText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textSecondary },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surfaceAlt, paddingHorizontal: 11, paddingVertical: 6,
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, color: colors.textPrimary },

  bodyText: { fontFamily: fonts.sans, fontSize: 16, color: colors.textPrimary, lineHeight: 24, marginTop: 14 },
  photo: {
    height: 220, backgroundColor: colors.surfaceAlt, marginTop: 14,
    borderRadius: 12, overflow: 'hidden',
  },
  clipTile: {
    backgroundColor: '#0F1720', alignItems: 'center', justifyContent: 'center',
  },
  clipScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9,14,22,0.28)' },
  clipBrand: { position: 'absolute', left: 16, bottom: 14, alignItems: 'flex-start', opacity: 0.55 },
  clipBrandText: { fontFamily: fonts.serif, fontSize: 24, color: '#F5F0E8', includeFontPadding: false },
  clipBrandLine: { width: 44, height: 2, backgroundColor: '#F5F0E8', marginTop: 4 },
  clipOverlay: { alignItems: 'center', justifyContent: 'center' },
  clipError: { backgroundColor: 'rgba(9,14,22,0.82)', gap: 6, paddingHorizontal: 24 },
  clipErrorTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: '#FBF6E8', marginTop: 6 },
  clipErrorSub: { fontFamily: fonts.sans, fontSize: 13, color: 'rgba(251,246,232,0.75)', textAlign: 'center' },
  clipRetry: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10,
    backgroundColor: '#FBF6E8', borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8,
  },
  clipRetryText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: '#0F1720' },
  clipPlay: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center', justifyContent: 'center', paddingLeft: 3,
  },
  engagementRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14 },

  reactPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill,
    paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.surfaceAlt,
    borderWidth: 1, borderColor: colors.border,
  },
  reactPillEmoji: { fontSize: 15 },
  reactPillText: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textPrimary },

  engageBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 4 },
  engageBtnText: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.textSecondary },

  adCard: { backgroundColor: colors.surfaceAlt },
  adLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: spacing.md, paddingBottom: 6 },
  adLabel: { backgroundColor: colors.surface, borderRadius: 5, paddingHorizontal: 7, paddingVertical: 2 },
  adLabelText: { fontFamily: fonts.sansBold, fontSize: 9.5, color: colors.muted, letterSpacing: 0.5 },
  adSponsor: { fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.muted, flex: 1 },
  adTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14.5, color: colors.textPrimary, paddingHorizontal: spacing.md },
  adBody: { fontFamily: fonts.sans, fontSize: 13, color: colors.muted, lineHeight: 18, paddingHorizontal: spacing.md, marginTop: 4 },
  adImage: { width: '100%', height: 160, marginTop: 10, backgroundColor: colors.border },
  adCtaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: colors.accentBg, borderRadius: radius.pill,
    marginHorizontal: spacing.md, marginTop: 12, marginBottom: spacing.md,
    paddingVertical: 10,
  },
  adCtaText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.accentFg },

  suggestedCard: { paddingVertical: spacing.md },
  suggestedEyebrowRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: spacing.md, marginBottom: 12 },
  suggestedEyebrow: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  suggestedRow: { paddingHorizontal: spacing.md, gap: 12 },
  suggestedChip: {
    width: 128, alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.card,
    paddingVertical: 14, paddingHorizontal: 8,
  },
  suggestedAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  suggestedAvatarText: { fontFamily: fonts.sansBold, fontSize: 14, color: colors.cream },
  suggestedName: { fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.textPrimary, textAlign: 'center' },
  suggestedMeta: { fontFamily: fonts.sans, fontSize: 10.5, color: colors.muted, textAlign: 'center' },
  suggestedConnectBtn: {
    borderRadius: radius.pill, backgroundColor: colors.surface,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 2,
  },
  suggestedConnectText: { fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textPrimary },
  })
}
