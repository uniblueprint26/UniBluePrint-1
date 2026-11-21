import { useCallback, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Image } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { Lock, Camera } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { AudienceGlyph } from '../components/feed/AudiencePicker'
import { fonts, radius } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { AUDIENCES } from '../constants/pillars'
import { fetchMyLives, signLivePaths, timeLeftLabel } from '../lib/live'

// Your Live archive. Private: only you can see these. A Live leaves everyone
// else's view after 24 hours and stays here. The one that is still on shows at
// the top. Read from the database (your own feed_posts rows of kind live), so
// it is empty until you have posted one.

const COLS = 3
const GAP = 8

const DAY_FMT = { weekday: 'short', day: 'numeric', month: 'short' }
function dayLabel(iso) {
  try { return new Date(iso).toLocaleDateString('en-IE', DAY_FMT).replace(',', '') } catch { return '' }
}

export default function LiveArchiveScreen({ navigation }) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { user } = useAuth()
  const s = styles(colors)
  const [state, setState] = useState({ loading: true, current: null, archive: [], urls: {} })

  const load = useCallback(async () => {
    if (!user?.id) { setState(p => ({ ...p, loading: false })); return }
    try {
      const { current, archive } = await fetchMyLives(user.id)
      const urls = await signLivePaths([current, ...archive].filter(Boolean).map(p => p.live_path))
      setState({ loading: false, current, archive, urls })
    } catch {
      setState({ loading: false, current: null, archive: [], urls: {} })
    }
  }, [user?.id])

  useFocusEffect(useCallback(() => { load() }, [load]))

  const open = post => navigation.navigate('LiveViewer', { postId: post.id })
  const { loading, current, archive, urls } = state

  return (
    <View style={s.screen}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32 }} showsVerticalScrollIndicator={false}>
        <PageTitle title="Live archive" style={{ paddingTop: 18, paddingBottom: 14, paddingHorizontal: 0 }} />

        <View style={s.note}>
          <Lock size={17} color={colors.textSecondary} strokeWidth={1.8} style={{ marginTop: 1 }} />
          <Text style={s.noteText}>
            <Text style={s.noteBold}>Only you can see these. </Text>
            A Live leaves everyone else's view after 24 hours and stays here.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.textPrimary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {!!current && (
              <TouchableOpacity style={s.currentCard} onPress={() => open(current)} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel="Open your Live that is on now">
                <View style={s.currentThumb}>
                  {urls[current.live_path] ? <Image source={{ uri: urls[current.live_path] }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={s.currentTitle}>On now</Text>
                  <Text style={s.currentSub} numberOfLines={1}>
                    {AUDIENCES[current.audience]?.label || 'Course Connect'} {'·'} {timeLeftLabel(current)}
                  </Text>
                </View>
                <View style={s.livePill}><Text style={s.livePillText}>Live</Text></View>
              </TouchableOpacity>
            )}

            {archive.length > 0 ? (
              <>
                <Text style={s.label}>Archived</Text>
                <View style={s.grid}>
                  {archive.map(p => (
                    <TouchableOpacity
                      key={p.id}
                      style={s.cell}
                      onPress={() => open(p)}
                      activeOpacity={0.85}
                      accessibilityRole="button"
                      accessibilityLabel={`Live from ${dayLabel(p.created_at)}`}
                    >
                      {urls[p.live_path] ? <Image source={{ uri: urls[p.live_path] }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
                      <View style={s.cellScrim} />
                      <View style={s.cellGlyph}><AudienceGlyph audience={p.audience} size={13} color="#fff" /></View>
                      <Text style={s.cellDay} numberOfLines={1}>{dayLabel(p.created_at)}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : !current && (
              <View style={s.empty}>
                <View style={s.emptyIcon}><Camera size={26} color={colors.textPrimary} strokeWidth={1.5} /></View>
                <Text style={s.emptyTitle}>Nothing here yet</Text>
                <Text style={s.emptySub}>Live moments you post move here after 24 hours, and only you can see them.</Text>
                <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('LiveCapture')} accessibilityRole="button">
                  <Text style={s.emptyBtnText}>Post a Live</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

function styles(colors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    note: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, backgroundColor: colors.tabFill },
    noteText: { flex: 1, fontFamily: fonts.sans, fontSize: 13.5, lineHeight: 20, color: colors.textSecondary },
    noteBold: { fontFamily: fonts.sansSemiBold, color: colors.textPrimary },
    currentCard: {
      flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 18, padding: 12,
      borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    },
    currentThumb: { width: 54, height: 64, borderRadius: 10, backgroundColor: colors.border, overflow: 'hidden' },
    currentTitle: { fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.textPrimary },
    currentSub: { fontFamily: fonts.sans, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    livePill: { backgroundColor: colors.accentBg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
    livePillText: { fontFamily: fonts.sansBold, fontSize: 12, color: colors.accentFg },
    label: {
      fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.textSecondary,
      textTransform: 'uppercase', letterSpacing: 1, marginTop: 26, marginBottom: 12,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    cell: {
      width: `${(100 - (COLS - 1) * 2.5) / COLS}%`, aspectRatio: 3 / 4, borderRadius: 12,
      overflow: 'hidden', backgroundColor: colors.border, justifyContent: 'flex-end',
    },
    cellScrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '38%', backgroundColor: 'rgba(0,0,0,0.38)' },
    cellGlyph: {
      position: 'absolute', top: 7, right: 7, width: 24, height: 24, borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center',
    },
    cellDay: { fontFamily: fonts.sansSemiBold, fontSize: 11.5, color: '#fff', paddingHorizontal: 8, paddingBottom: 7 },
    empty: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24, gap: 10 },
    emptyIcon: {
      width: 64, height: 64, borderRadius: 18, backgroundColor: colors.tabFill,
      alignItems: 'center', justifyContent: 'center', marginBottom: 4,
    },
    emptyTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.textPrimary },
    emptySub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.textSecondary, textAlign: 'center' },
    emptyBtn: { marginTop: 10, backgroundColor: colors.accentBg, borderRadius: radius.pill, paddingHorizontal: 26, paddingVertical: 13 },
    emptyBtnText: { fontFamily: fonts.sansBold, fontSize: 14.5, color: colors.accentFg },
  })
}
