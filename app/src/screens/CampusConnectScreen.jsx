import { useState, useEffect } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Armchair, Car, CalendarDays, GraduationCap, Search, Users, Plus, Ticket, ChevronRight,
  Building2, MapPin, DoorOpen, Footprints, CloudSun, Bus, Trophy, MessageCircle, FileText,
} from 'lucide-react-native'

import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import BoardPickerModal from '../components/campusConnect/BoardPickerModal'
import PulseQuestions from '../components/campusConnect/PulseQuestions'
import { Card, SectionRow, TileGrid, useTone } from '../components/campusConnect/CampusKit'
import LiveRail from '../components/live/LiveRail'
import { MoodPulse } from '../components/feed/FeedKit'
import { fetchMoodPulse, DEFAULT_BUZZ_WINDOW } from '../lib/feed'
import { useCampus, useBoardCounts, countLine, useCampusMemberCount } from '../lib/campus'
import { useUserType } from '../hooks/useUserType'
import { fonts } from '../constants/theme'
import { priorityColors, priorityFonts } from '../constants/priorityTheme'

// Campus Connect hub (founder pick r3-11 A). Your own community in the same
// situation: for college students that is their campus, for apprentices and
// workers it is their own group. The weekly Pulse comes first, then the boards,
// then the campus toolkit.

const PRIORITY_GOLD = priorityColors.gold
const PRIORITY_BG = priorityColors.bg

const HUB_BOARDS = [
  { key: 'accommodation', title: 'Accommodation', Icon: Armchair },
  { key: 'carpool', title: 'Ride shares', Icon: Car },
  { key: 'events', title: 'Events', Icon: CalendarDays },
  { key: 'study-groups', title: 'Study groups', Icon: GraduationCap },
  { key: 'lost-found', title: 'Lost and found', Icon: Search },
  { key: 'clubs', title: 'Clubs and societies', Icon: Users },
]

const TOOLKIT = [
  { key: 'busy', title: 'Busy spots', sub: 'Where is quiet right now', Icon: MapPin, route: 'BusySpots' },
  { key: 'rooms', title: 'Study rooms', sub: 'Share a booked slot', Icon: DoorOpen, route: 'StudyRooms' },
  { key: 'buddy', title: 'Commute buddy', sub: 'Travel with someone', Icon: Footprints, route: 'CommuteBuddy' },
  { key: 'weather', title: 'Weather', sub: 'And what to wear', Icon: CloudSun, route: 'CampusToolkit', params: { view: 'weather' } },
  { key: 'transport', title: 'Transport', sub: 'Official links', Icon: Bus, route: 'CampusToolkit', params: { view: 'transport' } },
  { key: 'ranked', title: 'Campus ranked', sub: 'Colleges compared', Icon: Trophy, route: 'CampusRanked' },
]

export default function CampusConnectScreen({ navigation }) {
  const { colors, accent, tint } = useTone('campus')
  const insets = useSafeAreaInsets()
  const campus = useCampus()
  const { userType } = useUserType()
  const counts = useBoardCounts()
  const members = useCampusMemberCount(campus.institution)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [moodPulse, setMoodPulse] = useState({ total: 0, counts: {} })
  useEffect(() => {
    fetchMoodPulse(DEFAULT_BUZZ_WINDOW).then(setMoodPulse).catch(() => {})
  }, [])

  // The wording never assumes everyone is in college.
  const isCollege = userType === 'student' || userType === 'gap_year'
  const communityName = isCollege
    ? (campus.short || null)
    : (userType === 'apprentice' ? 'Your apprentice group' : 'Your industry group')

  const boardTiles = HUB_BOARDS.map(b => ({ ...b, sub: countLine(counts[b.key]) }))

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageTitle title="Campus Connect" subtitle="Everyone in the same situation as you." />

        <View style={s.community}>
          <Building2 size={16} color={colors.textSecondary} strokeWidth={1.8} />
          {communityName ? (
            <Text style={[s.communityText, { color: colors.textSecondary }]}>
              <Text style={{ color: accent, fontFamily: fonts.sansBold }}>{communityName}</Text>
              {members ? `  ·  ${members.toLocaleString('en-IE')} member${members === 1 ? '' : 's'} here` : ''}
            </Text>
          ) : (
            <Text style={[s.communityText, { color: colors.textSecondary }]}>Add your campus in Settings to see your community.</Text>
          )}
        </View>

        <LiveRail audience="campus" navigation={navigation} />

        <View style={s.body}>
          <PulseQuestions navigation={navigation} audience="campus" />

          <Card onPress={() => navigation.navigate('StudyResources', { scope: 'campus' })} accessibilityLabel="Open Study resources" style={s.resCard}>
            <View style={[s.resIcon, { backgroundColor: tint }]}><FileText size={20} color={accent} strokeWidth={1.8} /></View>
            <View style={{ flex: 1 }}>
              <Text style={[s.resTitle, { color: colors.textPrimary }]}>Study resources</Text>
              <Text style={[s.resSub, { color: colors.textSecondary }]}>Notes, past papers and links. Add your own.</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={1.8} />
          </Card>

          <SectionRow title="Boards" action="All 14" onAction={() => navigation.navigate('CampusBoards')} />
          <TileGrid items={boardTiles} onPress={t => navigation.navigate('BoardDetail', { boardKey: t.key })} />

          <TouchableOpacity
            style={[s.postBar, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setPickerOpen(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Post to a board"
          >
            <View style={[s.postAvatar, { backgroundColor: colors.accentBg }]}>
              <Text style={[s.postAvatarText, { color: colors.accentFg }]}>You</Text>
            </View>
            <Text style={[s.postText, { color: colors.textSecondary }]}>Post to a board</Text>
            <Plus size={22} color={colors.textPrimary} strokeWidth={1.8} />
          </TouchableOpacity>

          <SectionRow title="Campus toolkit" />
          <TileGrid items={TOOLKIT} onPress={t => navigation.navigate(t.route, t.params)} />

          <View style={{ marginTop: 24 }}>
            <MoodPulse pulse={moodPulse} title="Campus Mood" />
          </View>

          <TouchableOpacity
            style={pc.card}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('Priorities')}
            accessibilityRole="button"
            accessibilityLabel="Open Priority events"
          >
            <View style={pc.topRow}>
              <View style={pc.iconBox}><Ticket size={20} color={PRIORITY_GOLD} strokeWidth={2} /></View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={pc.label}>PRIORITY EVENTS</Text>
                <Text style={pc.count}>by UniBlueprint</Text>
              </View>
              <ChevronRight size={18} color={PRIORITY_GOLD} />
            </View>
            <Text style={pc.headline}>House, Afrobeats and Folk nights</Text>
            <Text style={pc.sub}>Campus nightlife and live music across Ireland.</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <BoardPickerModal
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={board => {
          setPickerOpen(false)
          navigation.navigate('BoardDetail', { boardKey: board.key, openPostForm: true })
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  resCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 },
  resIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 22 },
  resSub: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, marginTop: 2 },
  community: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12 },
  communityText: { fontFamily: fonts.sans, fontSize: 14, flexShrink: 1 },
  body: { paddingHorizontal: 16 },
  postBar: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14, borderRadius: 999, borderWidth: 1, paddingVertical: 10, paddingLeft: 10, paddingRight: 18 },
  postAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  postAvatarText: { fontFamily: fonts.sansBold, fontSize: 12 },
  postText: { flex: 1, fontFamily: fonts.sans, fontSize: 16 },
})

// Priority keeps its own black and silver look.
const pc = StyleSheet.create({
  card: { marginTop: 24, borderRadius: 18, padding: 18, backgroundColor: priorityColors.bg, borderWidth: 1, borderColor: priorityColors.borderStrong },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(185,185,180,0.14)' },
  label: { fontFamily: priorityFonts.sansSemiBold, fontSize: 11, letterSpacing: 0.8, color: PRIORITY_GOLD, marginBottom: 3 },
  count: { fontFamily: priorityFonts.sans, fontSize: 12, color: priorityColors.textMuted },
  headline: { fontFamily: priorityFonts.serif, fontSize: 20, marginTop: 14, lineHeight: 26, color: priorityColors.textPrimary },
  sub: { fontFamily: priorityFonts.sans, fontSize: 13, marginTop: 4, lineHeight: 19, color: priorityColors.textMuted },
})
