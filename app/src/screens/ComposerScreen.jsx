import { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  Image, Alert, ActivityIndicator, Platform, KeyboardAvoidingView, Modal, Pressable,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { X, Camera, RefreshCw, Video, Play, ChevronLeft, ChevronDown, ChevronUp, Radio, Archive } from 'lucide-react-native'
import { fonts, radius, spacing } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { MOOD_FIRST_GROUPS, MOOD_MORE_GROUPS, COMPOSER_MOODS, moodDef, isFirstMood } from '../constants/moods'
import { DEFAULT_AUDIENCE } from '../constants/pillars'
import { checkText, GUIDELINES_MESSAGE } from '../lib/moderation'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { createThread, createPost, createClip, AUDIENCE_KEYS, MAX_POST_IMAGES } from '../lib/feed'
import AudiencePicker, { AudienceChip } from '../components/feed/AudiencePicker'
import PostTypeTiles from '../components/feed/PostTypeTiles'
import ImageStrip from '../components/feed/ImageStrip'

// Composer: two steps, all writing to public.feed_posts.
//
//   Step 1 "Post sheet": pick what to make (Take, Post, Clip or Live) and where
//                  it goes (Course Connect, Campus Connect or Friends only),
//                  then Continue. Course Connect is listed first and is the
//                  default. The last audience is remembered per user in
//                  AsyncStorage. Live opens the camera instead: its audience
//                  is chosen after the shot.
//   Step 2 compose: the compose UI for the chosen type:
//     Take  -> post_type = 'thread': the Mood Board (nine words first: three
//              happy, three in between, three bad, then "More feelings" for
//              the rest), then a short text.
//     Post  -> post_type = 'post': one to six pictures (required) + optional
//              caption. Pictures can be reordered and removed. The first is
//              the cover (photo_url); all are saved in image_urls.
//     Clip  -> post_type = 'clip': a short video (required) + optional caption.
//     Live  -> LiveCapture, then LiveCompose (see screens/Live*Screen.jsx).
//   A small audience chip at the top of step 2 changes the audience.
//
// "Mood Board" now means only the mood picker. The word "Thread" is never
// shown to a user: a Take is stored as post_type 'thread'.
//
// Anything typed (Take text and both captions) goes through lib/moderation.js
// checkText before it is submitted; the database repeats a shorter check
// (20261118121000_feed_text_guard.sql).
//
// Pictures upload to the feed-photos bucket under the member's own folder, 10MB
// a picture. Clips upload to feed-clips (20261116233209_feed_clips.sql).
//
// route.params (all optional) support the contextual share-prompt flow:
//   initialTab   - 'thread' (Take) | 'post' | 'clip'. When set, the Post sheet
//                  is skipped and step 2 opens directly.
//   initialText  - pre-filled body text
//   initialMood  - pre-selected mood id (Take only)

const MAX_BYTES = 10 * 1024 * 1024 // 10MB, per the Snapshot/Post dropzone copy
const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50MB — a short clip, not a full video upload
const CLIP_TYPES = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' }
const MAX_DIM = 1600
const MAX_CLIP_SECONDS = 60
const AUDIENCE_KEY_PREFIX = 'ubp_post_audience_'

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
  const [uploadNote, setUploadNote] = useState(null)
  const initialMood = COMPOSER_MOODS.some(m => m.id === route?.params?.initialMood) ? route.params.initialMood : 'flying_it'
  const [mood, setMood] = useState(initialMood)
  const [threadText, setThreadText] = useState(route?.params?.initialText || '')
  const [caption, setCaption] = useState(initialTabParam === 'post' ? (route?.params?.initialText || '') : '')
  const [clipCaption, setClipCaption] = useState('')
  const [photos, setPhotos] = useState([]) // [{ key, uri, width }] in the member's order
  const [localVideoUri, setLocalVideoUri] = useState(null)
  const [posting, setPosting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const activeMood = moodDef(mood) || COMPOSER_MOODS[0]
  const isThread = tab === 'thread'
  const isPost   = tab === 'post'
  const isClip   = tab === 'clip'
  const isLive   = tab === 'live'
  const moreOpenByPick = !isFirstMood(mood)
  const canPost = isThread
    ? threadText.trim().length > 0
    : isPost
      ? photos.length > 0
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
      navigation.navigate('LiveCapture')
      return
    }
    setErrorMsg(null)
    setStep('compose')
  }

  function onBack() {
    if (step === 'compose') { setStep('pick'); setErrorMsg(null) } else navigation.goBack()
  }

  async function pickPhotos() {
    const room = MAX_POST_IMAGES - photos.length
    if (room <= 0) {
      Alert.alert('That is six pictures', 'A post can have up to 6 pictures. Remove one to add another.')
      return
    }
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow access to your photo library in Settings to add pictures.', [{ text: 'OK' }])
        return
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: room,
      orderedSelection: true,
      quality: 0.9,
    })
    if (result.canceled || !result.assets?.length) return

    const added = []
    let skipped = 0
    for (const asset of result.assets.slice(0, room)) {
      const mime = (asset.mimeType || '').toLowerCase()
      const uri = (asset.uri || '').toLowerCase()
      const validType =
        mime.startsWith('image/jpeg') || mime.startsWith('image/png') || mime.startsWith('image/webp') ||
        uri.endsWith('.jpg') || uri.endsWith('.jpeg') || uri.endsWith('.png') || uri.endsWith('.webp') ||
        uri.startsWith('blob:') || uri.startsWith('data:image') || uri.startsWith('ph://') || uri.startsWith('content://')
      if ((asset.fileSize && asset.fileSize > MAX_BYTES) || !validType) { skipped += 1; continue }
      added.push({ key: `${Date.now()}-${added.length}-${Math.random().toString(36).slice(2, 6)}`, uri: asset.uri, width: asset.width || 0 })
    }
    if (skipped > 0) {
      Alert.alert(
        skipped === 1 ? 'One picture skipped' : `${skipped} pictures skipped`,
        'Pictures must be a JPG, PNG or WebP under 10 MB.',
      )
    }
    if (added.length) {
      setPhotos(prev => [...prev, ...added].slice(0, MAX_POST_IMAGES))
      setErrorMsg(null)
    }
  }

  function removePhoto(key) {
    setPhotos(prev => prev.filter(p => p.key !== key))
  }

  function movePhoto(key, dir) {
    setPhotos(prev => {
      const i = prev.findIndex(p => p.key === key)
      const j = i + dir
      if (i < 0 || j < 0 || j >= prev.length) return prev
      const next = prev.slice()
      ;[next[i], next[j]] = [next[j], next[i]]
      return next
    })
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

  // Uploads one picture to the member's own folder. Large pictures are resized
  // to MAX_DIM wide and every picture is saved as JPEG. Returns { url, path }.
  async function uploadPhoto(photo, index) {
    const actions = !photo.width || photo.width > MAX_DIM ? [{ resize: { width: MAX_DIM } }] : []
    const processed = await manipulateAsync(photo.uri, actions, { compress: 0.85, format: SaveFormat.JPEG })
    const response = await fetch(processed.uri)
    const blob = await response.blob()
    if (blob.size > MAX_BYTES) {
      throw new Error('A picture is still over 10 MB after compression. Please choose a smaller one.')
    }
    const storagePath = `${user.id}/${Date.now()}-${index}.jpg`
    const { error: uploadErr } = await supabase.storage
      .from('feed-photos')
      .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: false })
    if (uploadErr) throw uploadErr
    const { data: { publicUrl } } = supabase.storage.from('feed-photos').getPublicUrl(storagePath)
    return { url: publicUrl, path: storagePath }
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
        const uploaded = []
        try {
          for (let i = 0; i < photos.length; i += 1) {
            setUploadNote(photos.length > 1 ? `Uploading ${i + 1} of ${photos.length}` : null)
            uploaded.push(await uploadPhoto(photos[i], i))
          }
          await createPost({ userId: user.id, photoUrls: uploaded.map(u => u.url), caption: caption.trim(), audience })
        } catch (e) {
          // Do not leave half a post's pictures in storage.
          if (uploaded.length) supabase.storage.from('feed-photos').remove(uploaded.map(u => u.path)).catch(() => {})
          throw e
        }
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
      setUploadNote(null)
    }
  }

  function renderMoodGrid(moods) {
    return (
      <View style={s.moodGrid}>
        {moods.map(m => {
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
              <Text style={[s.moodLabel, { color: colors.textPrimary }]} numberOfLines={2}>{m.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    )
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

          {isLive ? (
            <View style={s.liveNote}>
              <View style={s.liveNoteRow}>
                <Camera size={18} color={colors.textPrimary} strokeWidth={1.8} style={{ marginTop: 2 }} />
                <Text style={s.liveNoteText}>
                  <Text style={s.liveNoteBold}>Live uses both cameras at once. </Text>
                  You can post it at any time. There is no gallery, only what is in front of you. Others see it for 24 hours. You choose who sees it after the shot.
                </Text>
              </View>
              <TouchableOpacity
                style={s.archiveLink}
                onPress={() => navigation.navigate('LiveArchive')}
                accessibilityRole="button"
                accessibilityLabel="Your Live archive"
              >
                <Archive size={14} color={colors.textSecondary} strokeWidth={1.9} />
                <Text style={s.archiveLinkText}>Your Live archive</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={s.pickLabel}>Post to</Text>
              <AudiencePicker value={audience} onChange={chooseAudience} />
            </>
          )}
        </ScrollView>

        <View style={[s.continueBar, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity style={[s.postBtn, s.postBtnRow]} onPress={onContinue} activeOpacity={0.85} accessibilityRole="button">
            {isLive && <Camera size={18} color={colors.accentFg} strokeWidth={1.9} />}
            <Text style={s.postBtnText}>{isLive ? 'Open camera' : 'Continue'}</Text>
          </TouchableOpacity>
        </View>
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
              <Text style={s.sectionLabel}>Mood Board</Text>
              <Text style={s.sectionHint}>Pick how you feel. It goes with your take.</Text>
              {MOOD_FIRST_GROUPS.map(group => (
                <View key={group.key} style={s.moodGroup}>
                  <Text style={s.moodGroupTitle}>{group.title}</Text>
                  {renderMoodGrid(group.moods)}
                </View>
              ))}
              <TouchableOpacity
                style={s.moreBtn}
                onPress={() => setMoreMoods(v => !v)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ expanded: moreMoods || moreOpenByPick }}
                accessibilityLabel={(moreMoods || moreOpenByPick) ? 'Show fewer feelings' : 'Show more feelings'}
              >
                <Text style={s.moreBtnText}>{(moreMoods || moreOpenByPick) ? 'Fewer feelings' : 'More feelings'}</Text>
                {(moreMoods || moreOpenByPick)
                  ? <ChevronUp size={14} color={colors.textSecondary} strokeWidth={2} />
                  : <ChevronDown size={14} color={colors.textSecondary} strokeWidth={2} />}
              </TouchableOpacity>
              {(moreMoods || moreOpenByPick) && MOOD_MORE_GROUPS.map(group => (
                <View key={group.key} style={s.moodGroup}>
                  <Text style={s.moodGroupTitle}>{group.title}</Text>
                  {renderMoodGrid(group.moods)}
                </View>
              ))}

              <Text style={s.sectionLabel}>Your take</Text>
              <TextInput
                multiline
                numberOfLines={4}
                maxLength={280}
                value={threadText}
                onChangeText={t => { setThreadText(t); if (errorMsg === GUIDELINES_MESSAGE) setErrorMsg(null) }}
                placeholder={`What's your take? You are feeling ${activeMood.label.toLowerCase()}.`}
                placeholderTextColor={colors.textTertiary}
                style={s.textArea}
              />
              <Text style={s.charCount}>{threadText.length}/280</Text>
            </>
          ) : isPost ? (
            <>
              {photos.length > 0 ? (
                <ImageStrip photos={photos} max={MAX_POST_IMAGES} onAdd={pickPhotos} onRemove={removePhoto} onMove={movePhoto} />
              ) : (
                <TouchableOpacity style={s.dropzone} onPress={pickPhotos} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="Add pictures">
                  <Camera size={26} color={colors.textTertiary} strokeWidth={1.6} />
                  <Text style={s.dropzoneTitle}>Add pictures</Text>
                  <Text style={s.dropzoneSub}>Up to {MAX_POST_IMAGES} pictures, JPG, PNG or WebP, 10MB each</Text>
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
              ? (
                <View style={s.postingRow}>
                  <ActivityIndicator size="small" color={colors.accentFg} />
                  {!!uploadNote && <Text style={s.postBtnText}>{uploadNote}</Text>}
                </View>
              )
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

    moodGroup: { marginBottom: 20 },
    moodGroupTitle: {
      fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary, marginBottom: 10,
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
    postBtnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    postingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },

    sectionHint: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: -2, marginBottom: 16 },
    liveNote: {
      marginTop: 28, padding: 16, borderRadius: 16,
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, gap: 14,
    },
    liveNoteRow: { flexDirection: 'row', gap: 12 },
    liveNoteText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
    liveNoteBold: { fontFamily: fonts.sansSemiBold, color: colors.textPrimary },
    archiveLink: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 4 },
    archiveLinkText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textSecondary },
    postBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.accentFg },
  })
}
