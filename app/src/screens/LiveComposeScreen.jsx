import { useEffect, useState } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, Switch,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { RefreshCw, Clock, Radio, Check } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import LiveMoment from '../components/live/LiveMoment'
import { AudienceGlyph } from '../components/feed/AudiencePicker'
import { fonts, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { AUDIENCES, AUDIENCE_ORDER, DEFAULT_AUDIENCE } from '../constants/pillars'
import { checkText, GUIDELINES_MESSAGE } from '../lib/moderation'
import { AUDIENCE_KEYS } from '../lib/feed'
import { uploadLiveShot, createLive, removeLivePaths, LIVE_CAPTION_MAX } from '../lib/live'

// Live, step 2: the shot, a caption and who sees it.
//
// Post to: Course Connect (the default), Campus Connect or Friends only. When
// it is not going to Course Connect, a switch can also show it publicly on
// Course Connect so people across Ireland see it. Others see it for 24 hours,
// then only the poster does, in the Live archive.
//
// route.params: { backUri, frontUri | null } (local files from LiveCapture).
// The caption goes through lib/moderation.js; the database repeats a check.

const AUDIENCE_KEY_PREFIX = 'ubp_post_audience_'

export default function LiveComposeScreen({ navigation, route }) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { user } = useAuth()
  const s = styles(colors)
  const backUri = route?.params?.backUri
  const frontUri = route?.params?.frontUri || null

  const [caption, setCaption] = useState('')
  const [audience, setAudience] = useState(DEFAULT_AUDIENCE)
  const [alsoCourse, setAlsoCourse] = useState(false)
  const [posting, setPosting] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  // Start on the audience this member used last, like the other post types.
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
    if (key === 'course') setAlsoCourse(false)
    if (user?.id) AsyncStorage.setItem(AUDIENCE_KEY_PREFIX + user.id, key).catch(() => {})
  }

  async function post() {
    if (posting || !backUri || !user?.id) return
    if (!checkText(caption).ok) { setErrorMsg(GUIDELINES_MESSAGE); return }
    setPosting(true)
    setErrorMsg(null)
    const uploaded = []
    try {
      uploaded.push(await uploadLiveShot(user.id, backUri, 'back'))
      if (frontUri) uploaded.push(await uploadLiveShot(user.id, frontUri, 'front'))
      await createLive({
        userId: user.id,
        backPath: uploaded[0],
        frontPath: uploaded[1] || null,
        caption: caption.trim(),
        audience,
        alsoCourse,
      })
      navigation.popToTop()
    } catch (e) {
      removeLivePaths(uploaded)
      const msg = e?.message || ''
      setErrorMsg(
        /feed_text_guard/.test(msg) ? GUIDELINES_MESSAGE
          : /live_limit/.test(msg) ? 'You have posted a lot of Live moments today. Try again tomorrow.'
          : 'Could not post your Live. Please try again.',
      )
      setPosting(false)
    }
  }

  const showAlso = audience !== 'course'

  return (
    <KeyboardAvoidingView style={[s.screen]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <PageTitle
          title="Your Live"
          right={(
            <TouchableOpacity
              style={s.retake}
              onPress={() => navigation.goBack()}
              disabled={posting}
              accessibilityRole="button"
              accessibilityLabel="Retake"
            >
              <RefreshCw size={14} color={colors.textPrimary} strokeWidth={2} />
              <Text style={s.retakeText}>Retake</Text>
            </TouchableOpacity>
          )}
          style={{ paddingTop: 18, paddingBottom: 14, paddingHorizontal: 0 }}
        />

        <LiveMoment backUrl={backUri} frontUrl={frontUri} style={s.preview} />
        {!frontUri && (
          <Text style={s.fine}>Only the back camera shot was taken. You can still post it.</Text>
        )}

        <TextInput
          value={caption}
          onChangeText={t => { setCaption(t); if (errorMsg === GUIDELINES_MESSAGE) setErrorMsg(null) }}
          maxLength={LIVE_CAPTION_MAX}
          placeholder="Add a caption"
          placeholderTextColor={colors.textTertiary}
          style={s.caption}
          editable={!posting}
          accessibilityLabel="Caption"
        />

        <Text style={s.label}>Post to</Text>
        <View style={s.chips}>
          {AUDIENCE_ORDER.map(key => {
            const on = key === audience
            return (
              <TouchableOpacity
                key={key}
                style={[s.chip, on && s.chipOn]}
                onPress={() => chooseAudience(key)}
                disabled={posting}
                activeOpacity={0.85}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={AUDIENCES[key].label}
              >
                {on
                  ? <Check size={14} color={colors.accentFg} strokeWidth={2.6} />
                  : <AudienceGlyph audience={key} size={14} />}
                <Text style={[s.chipText, on && { color: colors.accentFg }]}>{AUDIENCES[key].label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {showAlso && (
          <View style={s.alsoRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.alsoTitle}>Also post publicly to Course Connect</Text>
              <Text style={s.alsoSub}>Everyone across Ireland can see it too.</Text>
            </View>
            <Switch
              value={alsoCourse}
              onValueChange={setAlsoCourse}
              disabled={posting}
              accessibilityLabel="Also post publicly to Course Connect"
              trackColor={{ true: colors.accentBg, false: colors.border }}
            />
          </View>
        )}

        <View style={s.note}>
          <Clock size={17} color={colors.textSecondary} strokeWidth={1.8} style={{ marginTop: 1 }} />
          <Text style={s.noteText}>Others can see it for 24 hours. After that only you can see it, in your archive.</Text>
        </View>

        {!!errorMsg && <Text style={s.error}>{errorMsg}</Text>}

        <TouchableOpacity
          style={[s.postBtn, (posting || !backUri) && { opacity: 0.6 }]}
          onPress={post}
          disabled={posting || !backUri}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          {posting
            ? <ActivityIndicator color={colors.accentFg} />
            : (
              <>
                <Radio size={18} color={colors.accentFg} strokeWidth={1.9} />
                <Text style={s.postBtnText}>Post Live</Text>
              </>
            )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function styles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    retake: {
      flexDirection: 'row', alignItems: 'center', gap: 7,
      backgroundColor: colors.tabFill, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9,
    },
    retakeText: { fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.textPrimary },
    preview: { width: '100%', aspectRatio: 1 },
    fine: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary, marginTop: 10 },
    caption: {
      marginTop: 16, borderWidth: 1, borderColor: colors.border, borderRadius: 14,
      backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 14,
      fontFamily: fonts.sans, fontSize: 15, color: colors.textPrimary,
    },
    label: {
      fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 1, marginTop: 26, marginBottom: 12,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 10, paddingHorizontal: 16, borderRadius: radius.pill,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    chipOn: { backgroundColor: colors.accentBg, borderColor: colors.accentBg },
    chipText: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, color: colors.textPrimary },
    alsoRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18,
      padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface,
    },
    alsoTitle: { fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.textPrimary },
    alsoSub: { fontFamily: fonts.sans, fontSize: 12.5, color: colors.textSecondary, marginTop: 2 },
    note: {
      flexDirection: 'row', gap: 12, marginTop: 20, padding: 14, borderRadius: 14,
      backgroundColor: colors.tabFill,
    },
    noteText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
    error: { fontFamily: fonts.sans, fontSize: 13, color: colors.destructive, textAlign: 'center', marginTop: 14 },
    postBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
      backgroundColor: colors.accentBg, borderRadius: radius.pill, paddingVertical: 16, marginTop: 24,
    },
    postBtnText: { fontFamily: fonts.sansBold, fontSize: 16, color: colors.accentFg },
  })
}
