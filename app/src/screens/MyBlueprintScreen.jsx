import { useState } from 'react'
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CalendarDays, Wallet, Play, ChevronRight } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import ComingSoonSheet from '../components/ui/ComingSoonSheet'
import { SectionTitle, GroupCard, RowDivider, PartnerMark, pillarTone } from '../components/explore/ExploreParts'
import { PILLARS } from '../constants/pillars'
import { usePillarOrder } from '../hooks/usePillarOrder'
import { PARTNERS } from '../constants/exploreCatalog'
import { fonts, shadows } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { openInHomeStack } from '../navigation/helpers'
import { useComingSoonEnabled, COMING_SOON_COPY, COMING_SOON_TITLE } from '../constants/comingSoon'
import ProFreeNotice from '../components/ui/ProFreeNotice'
import { useAuth } from '../context/AuthContext'
import { useCalendarSummary } from '../lib/calendar/useCalendarData'

// My Blueprint: everything the app does, in one calm page. Four blocks:
// Your day, Your pillars, Your tools, Our partners.
const GOLD = '#B4923A'

export default function MyBlueprintScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const [sheet, setSheet] = useState(null)
  const pillarKeys = usePillarOrder()
  const comingSoonOn = useComingSoonEnabled()

  // The next real event from the Calendar, or nothing. Never invented.
  const { user } = useAuth()
  const { nextUp } = useCalendarSummary(user?.id)

  const cardShadow = isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card

  function openPartner(p) {
    if (p.action.route) navigation.navigate(p.action.route)
    else if (comingSoonOn) setSheet(p)
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <PageTitle title="My Blueprint" subtitle="Everything you need, in one place" style={s.title} />

        {/* Your day */}
        <View style={s.block}>
          <SectionTitle>Your day</SectionTitle>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => openInHomeStack(navigation, 'Calendar')}
            accessibilityRole="button"
            accessibilityLabel="Open Calendar"
            style={[s.dayCard, { backgroundColor: colors.surface }, cardShadow]}
          >
            <View style={[s.dayIcon, { backgroundColor: colors.tabFill }]}>
              <CalendarDays size={22} color={colors.textPrimary} strokeWidth={1.7} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              {nextUp ? (
                <>
                  <Text style={[s.eyebrow, { color: colors.textSecondary }]}>NEXT UP</Text>
                  <Text style={[s.dayTitle, { color: colors.textPrimary }]} numberOfLines={1}>{nextUp.title}</Text>
                  <Text style={[s.daySub, { color: colors.textSecondary }]} numberOfLines={1}>{nextUp.time} {nextUp.relative}</Text>
                </>
              ) : (
                <>
                  <Text style={[s.dayTitle, { color: colors.textPrimary }]}>Nothing on today</Text>
                  <Text style={[s.daySub, { color: colors.textSecondary }]}>Your day will show here</Text>
                </>
              )}
            </View>
            <View style={s.linkRow}>
              <Text style={[s.linkText, { color: colors.textPrimary }]}>Calendar</Text>
              <ChevronRight size={16} color={colors.textPrimary} strokeWidth={2} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Your plan */}
        <View style={s.block}>
          <SectionTitle>Your plan</SectionTitle>
          <ProFreeNotice />
        </View>

        {/* Your pillars */}
        <View style={s.block}>
          <SectionTitle>Your pillars</SectionTitle>
          <View style={s.grid}>
            {pillarKeys.map(key => {
              const p = PILLARS[key]
              const tone = pillarTone(p.color, isDark)
              return (
                <TouchableOpacity
                  key={key}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate(p.route)}
                  accessibilityRole="button"
                  accessibilityLabel={p.label}
                  style={[s.pillar, { backgroundColor: colors.surface }, cardShadow]}
                >
                  <View style={[s.pillarIcon, { backgroundColor: tone.tint }]}>
                    <p.Icon size={18} color={tone.fg} strokeWidth={1.8} />
                  </View>
                  <Text style={[s.pillarLabel, { color: colors.textPrimary }]} numberOfLines={2}>{p.label}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Your tools */}
        <View style={s.block}>
          <SectionTitle>Your tools</SectionTitle>
          <GroupCard>
            <ToolRow
              label="Calendar"
              Icon={CalendarDays}
              onPress={() => openInHomeStack(navigation, 'Calendar')}
            />
            <RowDivider />
            <ToolRow
              label="Budgeting"
              Icon={Wallet}
              gold
              onPress={() => navigation.navigate('Budgeting')}
            />
            {comingSoonOn ? (
              <>
                <RowDivider />
                <ToolRow
                  label="Live archive"
                  Icon={Play}
                  soon
                  onPress={() => setSheet({ name: 'Live archive', soonText: COMING_SOON_COPY })}
                />
              </>
            ) : null}
          </GroupCard>
        </View>

        {/* Our partners */}
        <View style={s.block}>
          <SectionTitle>Our partners</SectionTitle>
          <GroupCard style={s.partnerStrip}>
            {PARTNERS.map(p => (
              <TouchableOpacity
                key={p.key}
                activeOpacity={0.8}
                onPress={() => openPartner(p)}
                accessibilityRole="button"
                accessibilityLabel={p.name}
                style={s.partner}
              >
                <PartnerMark partner={p} size={44} />
                <Text style={[s.partnerName, { color: colors.textPrimary }]} numberOfLines={1}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </GroupCard>
        </View>
      </ScrollView>

      {comingSoonOn ? (
        <ComingSoonSheet
          visible={!!sheet}
          onClose={() => setSheet(null)}
          title={sheet?.name || COMING_SOON_TITLE}
          message={COMING_SOON_COPY}
        />
      ) : null}
    </View>
  )
}

function ToolRow({ label, Icon, onPress, gold, soon }) {
  const { colors } = useTheme()
  const iconColor = gold ? GOLD : soon ? colors.textTertiary : colors.textPrimary
  const tile = gold ? 'rgba(180,146,58,0.16)' : colors.tabFill
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={soon ? `${label}, coming soon` : label}
      style={s.toolRow}
    >
      <View style={[s.toolIcon, { backgroundColor: tile }]}>
        <Icon size={18} color={iconColor} strokeWidth={1.7} />
      </View>
      <Text style={[s.toolLabel, { color: soon ? colors.textSecondary : colors.textPrimary }]}>{label}</Text>
      {soon ? (
        <View style={[s.soonTag, { backgroundColor: colors.tabFill }]}>
          <Text style={[s.soonText, { color: colors.textSecondary }]}>SOON</Text>
        </View>
      ) : (
        <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />
      )}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  title: { paddingHorizontal: 2, paddingTop: 18 },
  block: { marginTop: 32 },

  dayCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 16 },
  dayIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontFamily: fonts.sansSemiBold, fontSize: 10.5, letterSpacing: 0.8 },
  dayTitle: { fontFamily: fonts.sansSemiBold, fontSize: 16, marginTop: 1 },
  daySub: { fontFamily: fonts.sans, fontSize: 13, marginTop: 2 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontFamily: fonts.sansSemiBold, fontSize: 13 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  pillar: { width: '30.5%', flexGrow: 1, borderRadius: 16, padding: 14, minHeight: 108, justifyContent: 'flex-start' },
  pillarIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  pillarLabel: { fontFamily: fonts.sansSemiBold, fontSize: 13, lineHeight: 17, marginTop: 12 },

  toolRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, paddingHorizontal: 14, minHeight: 60 },
  toolIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 15 },
  soonTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  soonText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.8 },

  partnerStrip: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 22, paddingHorizontal: 8 },
  partner: { alignItems: 'center', gap: 8, flex: 1 },
  partnerName: { fontFamily: fonts.sansSemiBold, fontSize: 12.5, textAlign: 'center' },
})
