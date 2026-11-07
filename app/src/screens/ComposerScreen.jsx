import { useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput,
  Image, Alert, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator'
import { X, Camera, RefreshCw } from 'lucide-react-native'
import { colors, fonts, radius, spacing } from '../constants/theme'
import { MOODS } from '../constants/moods'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

// Composer — one screen, two tabs, both writing to public.feed_posts.
//
//   "Thread" tab  → post_type = 'thread': pick a mood in the Mood Board
//                   picker below, write a short text post.
//   "Post" tab    → post_type = 'post': a photo (required) + optional
//                   caption, Instagram-style. Video is out of scope here —
//                   a deliberate fast-follow, not an oversight.
//
// "Mood Board" names the mood-picker UI only, never the Thread post type
// itself (that distinction is locked by spec — keep it in code/comments).
//
// route.params (all optional) support the contextual share-prompt flow:
//   initialTab   — 'thread' | 'post' (default 'thread')
//   initialText  — pre-filled body text
//   initialMood  — pre-selected mood id (thread tab only)

const MAX_BYTES = 10 * 1024 * 1024 // 10MB, per the Snapshot/Post dropzone copy
const MAX_DIM = 1600

function initialsOf(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts[0]?.[0] || '').toUpperCase() + (parts[1]?.[0] || '').toUpperCase()
}

export default function ComposerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const { user } = useAuth()
  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'
  const initials = initialsOf(fullName)

  const [tab, setTab] = useState(route?.params?.initialTab === 'post' ? 'post' : 'thread')
  const [mood, setMood] = useState(route?.params?.initialMood || 'flying_it')
  const [threadText, setThreadText] = useState(route?.params?.initialText || '')
  const [caption, setCaption] = useState(route?.params?.initialTab === 'post' ? (route?.params?.initialText || '') : '')
  const [localPhotoUri, setLocalPhotoUri] = useState(null)
  const [posting, setPosting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  const activeMood = MOODS.find(m => m.id === mood) || MOODS[0]
  const isThread = tab === 'thread'
  const canPost = isThread ? threadText.trim().length > 0 : !!localPhotoUri

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

  async function submit() {
    if (!canPost || posting) return
    setPosting(true)
    setErrorMsg(null)
    try {
      if (isThread) {
        const { error } = await supabase.from('feed_posts').insert({
          user_id: user.id,
          post_type: 'thread',
          mood,
          body: threadText.trim(),
        })
        if (error) throw error
      } else {
        const photoUrl = await uploadPhoto()
        const { error } = await supabase.from('feed_posts').insert({
          user_id: user.id,
          post_type: 'post',
          photo_url: photoUrl,
          body: caption.trim() || null,
        })
        if (error) throw error
      }
      navigation.goBack()
    } catch (e) {
      setErrorMsg(e?.message || 'Could not post. Please try again.')
    } finally {
      setPosting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.cream }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={{ paddingTop: insets.top }}>
        <View style={s.header}>
          <Text style={s.headerTitle}>New Post</Text>
          <TouchableOpacity
            style={s.closeBtn}
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={14} color={colors.navy} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled">
        <View style={s.postingAs}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials}</Text></View>
          <Text style={s.postingAsText}>Posting as {fullName}</Text>
        </View>

        <View style={s.tabs}>
          <TouchableOpacity
            style={[s.tabBtn, isThread && s.tabBtnActive]}
            onPress={() => setTab('thread')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabLabel, isThread && s.tabLabelActive]}>Thread</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tabBtn, !isThread && s.tabBtnActive]}
            onPress={() => setTab('post')}
            activeOpacity={0.8}
          >
            <Text style={[s.tabLabel, !isThread && s.tabLabelActive]}>Post</Text>
          </TouchableOpacity>
        </View>

        <View style={s.body}>
          {isThread ? (
            <>
              <Text style={s.sectionLabel}>Mood Board — pick a mood</Text>
              <View style={s.moodGrid}>
                {MOODS.map(m => {
                  const selected = m.id === mood
                  return (
                    <TouchableOpacity
                      key={m.id}
                      style={[
                        s.moodChip,
                        selected
                          ? { backgroundColor: m.bg, borderColor: m.color }
                          : { backgroundColor: colors.white, borderColor: 'rgba(30,58,95,0.12)' },
                      ]}
                      onPress={() => setMood(m.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.moodEmoji}>{m.emoji}</Text>
                      <Text style={[s.moodLabel, { color: selected ? m.color : colors.navy }]}>{m.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>

              <Text style={s.sectionLabel}>Share what's on your mind</Text>
              <TextInput
                multiline
                numberOfLines={4}
                maxLength={280}
                value={threadText}
                onChangeText={setThreadText}
                placeholder={`What's got you feeling ${activeMood.label.toLowerCase()} today?`}
                placeholderTextColor={colors.light}
                style={s.textArea}
              />
              <Text style={s.charCount}>{threadText.length}/280</Text>
            </>
          ) : (
            <>
              {localPhotoUri ? (
                <View style={s.photoPreviewWrap}>
                  <Image source={{ uri: localPhotoUri }} style={s.photoPreview} resizeMode="cover" />
                  <TouchableOpacity style={s.changePhotoBtn} onPress={pickPhoto} activeOpacity={0.85}>
                    <RefreshCw size={12} color={colors.navy} strokeWidth={2} />
                    <Text style={s.changePhotoBtnText}>Change photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.dropzone} onPress={pickPhoto} activeOpacity={0.8}>
                  <Camera size={26} color={colors.light} strokeWidth={1.6} />
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
                onChangeText={setCaption}
                placeholder="Write a caption…"
                placeholderTextColor={colors.light}
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
              ? <ActivityIndicator size="small" color={colors.cream} />
              : <Text style={s.postBtnText}>Post</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: 1, borderBottomColor: 'rgba(30,58,95,0.08)',
  },
  headerTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.navy },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center',
  },

  postingAs: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 2,
  },
  avatar: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.sansBold, fontSize: 9.5, color: colors.cream },
  postingAsText: { fontFamily: fonts.sans, fontSize: 12, color: colors.muted },

  tabs: {
    marginHorizontal: spacing.md, marginTop: 14,
    backgroundColor: colors.white, borderRadius: radius.pill, padding: 4,
    flexDirection: 'row', gap: 4,
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.08)',
  },
  tabBtn: { flex: 1, borderRadius: 20, paddingVertical: 10, alignItems: 'center' },
  tabBtnActive: { backgroundColor: colors.navy },
  tabLabel: { fontFamily: fonts.sansBold, fontSize: 13, color: colors.muted },
  tabLabelActive: { color: colors.cream },

  body: { paddingHorizontal: spacing.md, paddingTop: 18 },
  sectionLabel: {
    fontFamily: fonts.sansSemiBold, fontSize: 10, color: colors.muted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10,
  },

  moodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18 },
  moodChip: {
    width: '31%', borderRadius: 12, borderWidth: 1.5,
    paddingVertical: 11, paddingHorizontal: 4,
    alignItems: 'center', gap: 4,
  },
  moodEmoji: { fontSize: 20, lineHeight: 22 },
  moodLabel: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, textAlign: 'center' },

  textArea: {
    borderWidth: 1, borderColor: 'rgba(30,58,95,0.14)', borderRadius: 12,
    padding: 12, fontFamily: fonts.sans, fontSize: 14, color: colors.navy,
    backgroundColor: colors.white, minHeight: 90, textAlignVertical: 'top',
  },
  charCount: { fontFamily: fonts.sans, fontSize: 10, color: colors.light, textAlign: 'right', marginTop: 4 },

  dropzone: {
    borderWidth: 2, borderColor: 'rgba(30,58,95,0.18)', borderStyle: 'dashed',
    borderRadius: 12, paddingVertical: 30, paddingHorizontal: 16,
    alignItems: 'center', gap: 8, marginBottom: 16,
  },
  dropzoneTitle: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.navy },
  dropzoneSub: { fontFamily: fonts.sans, fontSize: 11, color: colors.light },

  photoPreviewWrap: { marginBottom: 16, alignItems: 'center', gap: 10 },
  photoPreview: { width: '100%', height: 240, borderRadius: 12, backgroundColor: colors.border },
  changePhotoBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: radius.pill, borderWidth: 1, borderColor: 'rgba(30,58,95,0.15)',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  changePhotoBtnText: { fontFamily: fonts.sansMedium, fontSize: 12, color: colors.navy },

  errorText: {
    fontFamily: fonts.sans, fontSize: 12, color: colors.destructive,
    textAlign: 'center', marginTop: 10, marginHorizontal: spacing.md,
  },

  postBtn: {
    backgroundColor: colors.navy, borderRadius: radius.pill,
    paddingVertical: 14, alignItems: 'center',
  },
  postBtnDisabled: { opacity: 0.45 },
  postBtnText: { fontFamily: fonts.sansBold, fontSize: 15, color: colors.cream },
})
