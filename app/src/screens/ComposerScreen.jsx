import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  Image, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, Modal, Pressable,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { X, Camera, RefreshCw, Video, Play, ChevronLeft, ChevronDown, ChevronUp } from 'lucide-react-native'
import { fonts, radius, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { MOOD_GROUPS, COMPOSER_MOODS, MOODS_VISIBLE_PER_GROUP, moodDef } from '../constants/moods'
import { DEFAULT_AUDIENCE } from '../constants/pillars'
import { checkText, GUIDELINES_MESSAGE } from '../lib/moderation'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { createThread, createPost, createClip, AUDIENCE_KEYS } from '../lib/feed'
import AudiencePicker, { AudienceChip } from '../components/feed/AudiencePicker'
import PostTypeTiles from '../components/feed/PostTypeTiles'
import ComingSoonSheet from '../components/ui/ComingSoonSheet'

// Composer — two steps, all writing to public.feed_posts.
//
//   Step 1 "Post sheet" → pick what to make (Mood Board, Post, Clip or Live)
//                   and where it goes (Course Connect, Campus Connect or
//                   Friends only), then Continue. Course Connect is listed
//                   first and is the default. The last audience is
//                   remembered per user in AsyncStorage.
//   Step 2 compose  → the existing compose UI for the chosen type:
//     Mood Board → post_type = 'thread': pick a mood (grouped good, in
//                  between, not great), write a short text post.
//     Post       → post_type = 'post': a photo (required) + optional caption.
//     Clip       → post_type = 'clip': a short video (required) + optional
//                  caption.
//     Live       → opens the LiveCapture route when it is registered,
//                  otherwise a "coming soon" sheet. Nothing is faked.
//   A small audience chip at the top of step 2 changes the audience.
//
// The header says "Post" on both steps. Every insert carries `audience`
// ('campus' | 'course' | 'friends'). The word "Thread" is never shown to a
// user: the Mood Board type is stored as post_type 'thread'.
//
// Anything typed (Mood Board text and both captions) goes through
// lib/moderation.js checkText before it is submitted; the database repeats a
// shorter check (20261118121000_feed_text_guard.sql).
//
// Clips upload to the feed-clips bucket and save as post_type 'clip' with
// video_url (supabase/migrations/20261116233209_feed_clips.sql).
//
// route.params (all optional) support the contextual share-prompt flow:
//   initialTab   — 'thread' (Mood Board) | 'post' | 'clip'. When set, the
//                  Post sheet is skipped and step 2 opens directly.
//   initialText  — pre-filled body text
//   initialMood  — pre-selected mood id (thread tab only)

const MAX_BYTES = 10 * 1024 * 1024 // 10MB, per the Snapshot/Post dropzone copy
const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50MB — a short clip, not a full video upload
const CLIP_TYPES = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' }
const MAX_DIM = 1600
const MAX_CLIP_SECONDS = 60
const AUDIENCE_KEY_PREFIX = 'ubp_post_audience_'

// Is a LiveCapture screen registered anywhere above this one?
function hasRoute(navigation, name) {
  let nav = navigation
  for (let i = 0; nav && i < 5; i += 1) {
    try {
      if (nav.getState?.()?.routeNames?.includes(name)) return true
    } catch {}
    nav = nav.getParent?.()
  }
  return false
}

function initialsOf(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] || '').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
}

export default function ComposerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const s = composerStyles(colors)
  const { user } = useAuth()
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'
  const initials = initialsOf(fullName)

  const initialTabParam = route?.params?.initialTab
  const hasInitialTab = ['thread', 'post', 'clip'].includes(initialTabParam)
  const [step, setStep] = useState(hasInitialTab ? 'compose' : 'pick')
  const [tab, setTab] = useState(hasInitialTab ? initialTabParam : 'thread')
  const [audience, setAudience] = useState(DEFAULT_AUDIENCE)
  const [moreMoods, setMoreMoods] = useState(false)
  const [audienceSheetOpen, setAudienceSheetOpen] = useState(false)
  const [liveSoonOpen, setLiveSoonOpen] = useState(false)
  const initialMood = COMPOSER_MOODS.some(m => m.id === route?.params?.initialMood) ? route.params.initialMood : 'flying_it'
  const [mood, setMood] = useState(initialMood)
  const [threadText, setThreadText] = useState(route?.params?.initialText || '')
  const [caption, setCaption] = useState(initialTabParam === 'post' ? (route?.params?.initialText || '') : '')
  const [clipCaption, setClipCaption] = useState('')
  const [localPhotoUri, setLocalPhotoUri] = useState(null)
  const [localVideoUri, setLocalVideoUri] = useState(null)
  const [posting, setPosting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const activeMood = moodDef(mood) || COMPOSER_MOODS[0]
  const isThread = tab === 'thread'
  const isPost   = tab === 'post'
  const isClip   = tab === 'clip'
  const isLive   = tab === 'live'
  const canPost = isThread
    ? threadText.trim().length > 0
    : isPost
      ? !!localPhotoUri
      : !!localVideoUri

  // Remember the last audience per user. Reads once; a first-time user stays on
  // Course Connect.
  useEffect(() => {
    if (!user?.id) return undefined
    let cancelled = false
    AsyncStorage.getItem(AUDIENCE_KEY_PREFIX + user.id)
      .then(v => { if (!cancelled && AUDIENCE_KEYS.includes(v)) setAudience(v) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user?.id])

  function chooseAudience(key) {
    setAudience(key)
    if (user?.id) AsyncStorage.setItem(AUDIENCE_KEY_PREFIX + user.id, key).catch(() => {})
  }

  function onContinue() {
    if (isLive) {
      if (hasRoute(navigation, 'LiveCapture')) {
        try { navigation.navigate('LiveCapture', { audience }); return } catch {}
      }
      setLiveSoonOpen(true)
      return
    }
    setErrorMsg(null)
    setStep('compose')
  }

  function onBack() {
    if (step === 'compose') { setStep('pick'); setErrorMsg(null) } else navigation.goBack()
  }

  async function pickPhoto() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library in Settings to add a photo.', [{ text: 'OK' }])
        return
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.9,
    })
    if (result.canceled || !result.assets?.length) return
    const asset = result.assets[0]

    if (asset.fileSize && asset.fileSize > MAX_BYTES) {
      Alert.alert('File too large', 'Please choose an image under 10 MB.')
      return
    }
    const mime = (asset.mimeType || '').toLowerCase()
    const uri = (asset.uri || '').toLowerCase()
    const validType =
      mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp') ||
      uri.endsWith('.jpg') || uri.endsWith('.jpeg') || uri.endsWith('.png') || uri.endsWith('.webp')
    if (!validType) {
      Alert.alert('Unsupported format', 'Please choose a JPG, PNG, or WebP image.')
      return
    }
    setLocalPhotoUri(asset.uri)
    setErrorMsg(null)
  }

  async function pickVideo() {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library in Settings to add a clip.', [{ text: 'OK' }])
        return
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 1,
      videoMaxDuration: MAX_CLIP_SECONDS, // best-effort — honoured on iOS, ignored on Android/web
    })
    if (result.canceled || !result.assets?.length) return
    const asset = result.assets[0]

    if (asset.fileSize && asset.fileSize > MAX_VIDEO_BYTES) {
      Alert.alert('File too large', 'Please choose a clip under 50 MB.')
      return
    }
    if (asset.duration && asset.duration / 1000 > MAX_CLIP_SECONDS + 2) {
      Alert.alert('Clip too long', `Please choose a clip under ${MAX_CLIP_SECONDS} seconds.`)
      return
    }
    setLocalVideoUri(asset.uri)
    setErrorMsg(null)
  }

  async function uploadPhoto() {
    const processed = await manipulateAsync(
      localPhotoUri,
      [{ resize: { width: MAX_DIM } }],
      { compress: 0.85, format: SaveFormat.JPEG },
    )
    const response = await fetch(processed.uri)
    const blob = await response.blob()
    if (blob.size > MAX_BYTES) {
      throw new Error('Image is still over 10 MB after compression. Please choose a smaller image.')
    }
    const storagePath = `${user.id}/${Date.now()}.jpg`
    const { error: uploadErr } = await supabase.storage
      .from('feed-photos')
      .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: false })
    if (uploadErr) throw uploadErr
    const { data: { publicUrl } } = supabase.storage.from('feed-photos').getPublicUrl(storagePath)
    return publicUrl
  }

  async function uploadVideo() {
    const response = await fetch(localVideoUri)
    const blob = await response.blob()
    if (blob.size > MAX_VIDEO_BYTES) {
      throw new Error('Clip is over 50 MB. Please choose a shorter clip.')
    }
    const contentType = CLIP_TYPES[blob.type] ? blob.type : 'video/mp4'
    const storagePath = `${user.id}/${Date.now()}.${CLIP_TYPES[contentType]}`
    const { error: uploadErr } = await supabase.storage
      .from('feed-clips')
      .upload(storagePath, blob, { contentType, upsert: false })
    if (uploadErr) throw uploadErr
    const { data: { publicUrl } } = supabase.storage.from('feed-clips').getPublicUrl(storagePath)
    return publicUrl
  }

  async function submit() {
    if (!canPost || posting) return
    const text = isThread ? threadText : isPost ? caption : clipCaption
    if (!checkText(text).ok) {
      setErrorMsg(GUIDELINES_MESSAGE)
      return
    }
    setPosting(true)
    setErrorMsg(null)
    try {
      if (isThread) {
        await createThread({ userId: user.id, mood, body: threadText.trim(), audience })
      } else if (isPost) {
        const photoUrl = await uploadPhoto()
        await createPost({ userId: user.id, photoUrl, caption: caption.trim(), audience })
      } else {
        const videoUrl = await uploadVideo()
        await createClip({ userId: user.id, videoUrl, caption: clipCaption.trim(), audience })
      }
      navigation.goBack()
    } catch (e) {
      // The database repeats the guideline check; show the same calm line.
      setErrorMsg(/feed_text_guard/.test(e?.message || '') ? GUIDELINES_MESSAGE : (e?.message || 'Could not post. Please try again.'))
    } finally {
      setPosting(false)
    }
  }

  if (step === 'pick') {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <View style={{ paddingTop: insets.top }}>
          <View style={s.sheetHandle} />
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Post</Text>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={() => navigation.goBack()}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <X size={14} color={colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 8, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          <PostTypeTiles value={tab} onChange={setTab} />

          <Text style={s.pickLabel}>Post to</Text>
          <AudiencePicker value={audience} onChange={chooseAudience} />
        </ScrollView>

        <View style={[s.continueBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={s.postBtn} onPress={onContinue} activeOpacity={0.85} accessibilityRole="button">
            <Text style={s.postBtnText}>Continue</Text>
          </TouchableOpacity>
        </View>

        <ComingSoonSheet
          visible={liveSoonOpen}
          onClose={() => setLiveSoonOpen(false)}
          title="Live is coming soon"
          message="Two-minute Live captures are on their way. For now, share a Mood Board, a Post or a Clip."
        />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top }}>
        <View style={s.header}>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={onBack}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <ChevronLeft size={16} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Post</Text>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={14} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled">
        <View style={s.postingAs}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <Text style={s.postingAsText} numberOfLines={1}>{fullName}</Text>
          <AudienceChip value={audience} onPress={() => setAudienceSheetOpen(true)} />
        </View>

        <View style={s.body}>
          {isThread ? (
            <>
              <Text style={s.sectionLabel}>Pick a mood</Text>
              {MOOD_GROUPS.map(group => {
                const hasMore = group.moods.length > MOODS_VISIBLE_PER_GROUP
                const selectedHidden = group.moods.slice(MOODS_VISIBLE_PER_GROUP).some(m => m.id === mood)
                const shown = hasMore && !moreMoods && !selectedHidden
                  ? group.moods.slice(0, MOODS_VISIBLE_PER_GROUP)
                  : group.moods
                return (
                  <View key={group.key} style={s.moodGroup}>
                    {!!group.title && <Text style={s.moodGroupTitle}>{group.title}</Text>}
                    <View style={s.moodGrid}>
                      {shown.map(m => {
                        const selected = m.id === mood
                        return (
                          <TouchableOpacity
                            key={m.id}
                            style={[
                              s.moodChip,
                              selected
                                ? { backgroundColor: m.bg, borderColor: m.color }
                                : { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
                            onPress={() => setMood(m.id)}
                            activeOpacity={0.8}
                            accessibilityRole="radio"
                            accessibilityState={{ selected }}
                            accessibilityLabel={m.label}
                          >
                            <Text style={s.moodEmoji}>{m.emoji}</Text>
                            <Text style={[s.moodLabel, { color: colors.textPrimary }]} numberOfLines={1}>{m.label}</Text>
                          </TouchableOpacity>
                        )
                      })}
                    </View>
                  </View>
                )
              })}
              {MOOD_GROUPS.some(g => g.moods.length > MOODS_VISIBLE_PER_GROUP) && (
                <TouchableOpacity
                  style={s.moreBtn}
                  onPress={() => setMoreMoods(v => !v)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={moreMoods ? 'Show fewer words' : 'Show more words'}
                >
                  <Text style={s.moreBtnText}>{moreMoods ? 'Fewer words' : 'More words'}</Text>
                  {moreMoods
                    ? <ChevronUp size={14} color={colors.textSecondary} strokeWidth={2} />
                    : <ChevronDown size={14} color={colors.textSecondary} strokeWidth={2} />}
                </TouchableOpacity>
              )}

              <Text style={s.sectionLabel}>Share what's on your mind</Text>
              <TextInput
                multiline
                numberOfLines={4}
                maxLength={280}
                value={threadText}
                onChangeText={t => { setThreadText(t); if (errorMsg === GUIDELINES_MESSAGE) setErrorMsg(null) }}
                placeholder={`What's got you feeling ${activeMood.label.toLowerCase()} today?`}
                placeholderTextColor={colors.textTertiary}
                style={s.textArea}
              />
              <Text style={s.charCount}>{threadText.length}/280</Text>
            </>
          ) : isPost ? (
            <>
              {localPhotoUri ? (
                <View style={s.photoPreviewWrap}>
                  <Image source={{ uri: localPhotoUri }} style={s.photoPreview} resizeMode="cover" />
                  <TouchableOpacity style={s.changePhotoBtn} onPress={pickPhoto} activeOpacity={0.85}>
                    <RefreshCw size={12} color={colors.textPrimary} strokeWidth={2} />
                    <Text style={s.changePhotoBtnText}>Change photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.dropzone} onPress={pickPhoto} activeOpacity={0.8}>
                  <Camera size={26} color={colors.textTertiary} strokeWidth={1.6} />
                  <Text style={s.dropzoneTitle}>Add a photo</Text>
                  <Text style={s.dropzoneSub}>PNG or JPG, up to 10MB</Text>
                </TouchableOpacity>
              )}

              <Text style={s.sectionLabel}>Caption</Text>
              <TextInput
                multiline
                numberOfLines={3}
                maxLength={500}
                value={caption}
                onChangeText={t => { setCaption(t); if (errorMsg === GUIDELINES_MESSAGE) setErrorMsg(null) }}
                placeholder="Write a caption…"
                placeholderTextColor={colors.textTertiary}
                style={s.textArea}
              />
            </>
          ) : (
            <>
              {localVideoUri ? (
                <View style={s.photoPreviewWrap}>
                  <View style={s.clipPreview}>
                    <View style={s.clipPlayBadge}>
                      <Play size={20} color="#fff" strokeWidth={1.8} />
                    </View>
                    <Text style={s.clipPreviewText}>Clip selected</Text>
                  </View>
                  <TouchableOpacity style={s.changePhotoBtn} onPress={pickVideo} activeOpacity={0.85}>
                    <RefreshCw size={12} color={colors.textPrimary} strokeWidth={2} />
                    <Text style={s.changePhotoBtnText}>Change clip</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.dropzone} onPress={pickVideo} activeOpacity={0.8}>
                  <Video size={26} color={colors.textTertiary} strokeWidth={1.6} />
                  <Text style={s.dropzoneTitle}>Add a clip</Text>
                  <Text style={s.dropzoneSub}>Up to {MAX_CLIP_SECONDS}s, 50MB</Text>
                </TouchableOpacity>
              )}

              <Text style={s.sectionLabel}>Caption</Text>
              <TextInput
                multiline
                numberOfLines={3}
                maxLength={500}
                value={clipCaption}
                onChangeText={t => { setClipCaption(t); if (errorMsg === GUIDELINES_MESSAGE) setErrorMsg(null) }}
                placeholder="Write a caption…"
                placeholderTextColor={colors.textTertiary}
                style={s.textArea}
              />
            </>
          )}
        </View>

        {!!errorMsg && <Text style={s.errorText}>{errorMsg}</Text>}

        <View style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
          <TouchableOpacity
            style={[s.postBtn, !canPost && s.postBtnDisabled]}
            onPress={submit}
            disabled={!canPost || posting}
            activeOpacity={0.85}
          >
            {posting
              ? <ActivityIndicator size="small" color={colors.accentFg} />
              : <Text style={s.postBtnText}>Post</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={audienceSheetOpen} transparent animationType="fade" onRequestClose={() => setAudienceSheetOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setAudienceSheetOpen(false)}>
          <Pressable style={[s.audienceSheet, { paddingBottom: insets.bottom + 24 }]} onPress={e => e.stopPropagation?.()}>
            <View style={s.sheetHandleInline} />
            <Text style={s.audienceSheetTitle}>Post to</Text>
            <AudiencePicker
              value={audience}
              onChange={key => { chooseAudience(key); setAudienceSheetOpen(false) }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  )
}

function composerStyles(colors) {
  return StyleSheet.create({
    header: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.md, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.textPrimary },
    closeBtn: {
      width: 30, height: 30, borderRadius: 15,
      backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
    },

    sheetHandle: {
      alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
      backgroundColor: colors.border, marginTop: 10,
    },
    sheetHeader: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 22, paddingTop: 14, paddingBottom: 22,
    },
    sheetTitle: { fontFamily: fonts.serif, fontSize: 32, color: colors.textPrimary },
    pickLabel: {
      fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 1, marginTop: 34, marginBottom: 14,
    },
    continueBar: {
      paddingHorizontal: 22, paddingTop: 14,
      borderTopWidth: 1, borderTopColor: colors.divider, backgroundColor: colors.surface,
    },
    backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    audienceSheet: {
      backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 22, paddingTop: 12,
    },
    sheetHandleInline: {
      alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
      backgroundColor: colors.border, marginBottom: 16,
    },
    audienceSheetTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary, marginBottom: 16 },

    postingAs: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      paddingHorizontal: spacing.md, paddingTop: 16, paddingBottom: 4,
    },
    avatar: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: colors.accentBg, alignItems: 'center', justifyContent: 'center',
    },
    avatarText: { fontFamily: fonts.sansBold, fontSize: 9.5, color: colors.accentFg },
    postingAsText: { flex: 1, fontFamily: fonts.sans, fontSize: 12, color: colors.textSecondary },

    body: { paddingHorizontal: spacing.md, paddingTop: 20 },
    sectionLabel: {
      fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
    },

    moodGroup: { marginBottom: 14 },
    moodGroupTitle: {
      fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textSecondary, marginBottom: 8,
    },
    moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    moreBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 14, marginBottom: 14,
    },
    moreBtnText: { fontFamily: fonts.sansMedium, fontSize: 12.5, color: colors.textSecondary },
    moodChip: {
      width: '31.2%', borderRadius: 12, borderWidth: 1.5,
      paddingVertical: 11, paddingHorizontal: 4,
      alignItems: 'center', gap: 4,
    },
    moodEmoji: { fontSize: 20, lineHeight: 22 },
    moodLabel: { fontFamily: fonts.sansSemiBold, fontSize: 11, textAlign: 'center' },

    textArea: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      padding: 12, fontFamily: fonts.sans, fontSize: 14, color: colors.textPrimary,
      backgroundColor: colors.surface, minHeight: 90, textAlignVertical: 'top',
    },
    charCount: { fontFamily: fonts.sans, fontSize: 10, color: colors.textTertiary, textAlign: 'right', marginTop: 4 },

    dropzone: {
      borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
      borderRadius: 12, paddingVertical: 30, paddingHorizontal: 16,
      alignItems: 'center', gap: 8, marginBottom: 16,
    },
    dropzoneTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
    dropzoneSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.textTertiary },

    photoPreviewWrap: { marginBottom: 16, alignItems: 'center', gap: 10 },
    photoPreview: { width: '100%', height: 240, borderRadius: 12, backgroundColor: colors.border },
    // Clip has no inline video playback (no video-player dependency pulled
    // in for this build) — a dark placeholder with a centered play glyph
    // stands in for the preview, same visual language as the feed's own
    // Clip badge (see components/feed/FeedKit.jsx's planned Clip card).
    clipPreview: {
      width: '100%', height: 240, borderRadius: 12,
      backgroundColor: colors.surfaceSunk,
      alignItems: 'center', justifyContent: 'center', gap: 10,
    },
    clipPlayBadge: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: 'rgba(0,0,0,0.45)',
      alignItems: 'center', justifyContent: 'center',
    },
    clipPreviewText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textSecondary },
    changePhotoBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 14, paddingVertical: 8,
    },
    changePhotoBtnText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textPrimary },

    errorText: {
      fontFamily: fonts.sans, fontSize: 12, color: colors.destructive,
      textAlign: 'center', marginTop: 10, marginHorizontal: spacing.md,
    },

    postBtn: {
      backgroundColor: colors.accentBg, borderRadius: radius.pill,
      paddingVertical: 14, alignItems: 'center',
    },
    postBtnDisabled: { opacity: 0.45 },
    postBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.accentFg },
  })
}
