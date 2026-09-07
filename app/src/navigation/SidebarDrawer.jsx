import { useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  FileText, TrendingUp, Heart, Building2, Globe, Compass, Calculator, Megaphone,
} from 'lucide-react-native'
import UBPLogo from '../components/ui/UBPLogo'
import { colors, fonts } from '../constants/theme'

// The drawer's 8 destinations, in the exact order specified. Everything
// except Ad Board is a screen pushed inside HomeStack, so getting there
// from the drawer (which sits above the Tab.Navigator) means navigating
// two levels down: MainTabs -> Home tab -> the screen itself. Ad Board is
// the root of its own tab/stack, so it only needs one level.
const ITEMS = [
  { key: 'foundation', label: 'Foundation Blueprint', Icon: FileText,   tab: 'Home',    screen: 'Foundation' },
  { key: 'elevation',  label: 'Elevation Blueprint',  Icon: TrendingUp, tab: 'Home',    screen: 'Elevation' },
  { key: 'lifestyle',  label: 'Lifestyle Blueprint',  Icon: Heart,      tab: 'Home',    screen: 'Lifestyle' },
  { key: 'campus',     label: 'Campus Connect',       Icon: Building2,  tab: 'Home',    screen: 'CampusConnect' },
  { key: 'course',     label: 'Course Connect',       Icon: Globe,      tab: 'Home',    screen: 'CourseConnect' },
  { key: 'compass',    label: 'Course Compass',       Icon: Compass,    tab: 'Home',    screen: 'Compass' },
  { key: 'budgeting',  label: 'Budgeting',            Icon: Calculator, tab: 'Home',    screen: 'Budgeting' },
  { key: 'adboard',    label: 'Ad Board',             Icon: Megaphone,  tab: 'AdBoard', screen: 'AdBoardMain' },
]

// Route name (the deepest currently-focused leaf screen, anywhere in the
// nested Drawer > Tab > Stack tree) -> the drawer item key it corresponds
// to, so the right row lights up regardless of how the user got there
// (drawer tap, Quick Access, bottom tab, deep link...).
// Keyed by both the leaf screen name (once the Ad Board tab's own nested
// stack has reported its state upward) and the tab's own route name
// ('AdBoard') — freshly switching to a tab for the first time can briefly
// leave that tab's route without a nested `.state` yet (its stack hasn't
// finished mounting/reporting up), and since AdBoardMain is that tab's only
// real destination anyway, the tab-level name is just as correct a match.
const ROUTE_TO_KEY = {
  Foundation: 'foundation',
  Elevation: 'elevation',
  Lifestyle: 'lifestyle',
  CampusConnect: 'campus',
  CourseConnect: 'course',
  Compass: 'compass',
  Budgeting: 'budgeting',
  AdBoardMain: 'adboard',
  AdBoard: 'adboard',
  WeeklyBlueprint: 'adboard',
  Blog: 'adboard',
  Marketplace: 'adboard',
}

function getActiveRouteName(state) {
  if (!state || state.index == null) return null
  const route = state.routes[state.index]
  if (route.state) return getActiveRouteName(route.state)
  return route.name
}

function DrawerRow({ item, isActive, onPress }) {
  const highlight = useRef(new Animated.Value(isActive ? 1 : 0)).current

  useEffect(() => {
    Animated.timing(highlight, {
      toValue: isActive ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [isActive])

  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.rowOuter}>
      <Animated.View style={[styles.rowHighlight, { opacity: highlight }]} />
      <item.Icon
        size={19}
        color={isActive ? colors.cream : 'rgba(245,240,232,0.6)'}
        strokeWidth={isActive ? 2.1 : 1.7}
        style={styles.rowIcon}
      />
      <Text style={[styles.rowLabel, isActive && styles.rowLabelActive]} numberOfLines={1}>
        {item.label}
      </Text>
    </TouchableOpacity>
  )
}

// Custom Drawer content — React Navigation hands this `state`/`navigation`
// for the Drawer navigator itself; we walk into the nested Tab/Stack state
// to find what's really on screen so the correct row highlights.
export default function SidebarDrawer({ state, navigation }) {
  const insets = useSafeAreaInsets()
  const mainTabsRoute = state.routes.find(r => r.name === 'MainTabs')
  const activeRouteName = getActiveRouteName(mainTabsRoute?.state)
  const activeKey = ROUTE_TO_KEY[activeRouteName] ?? null

  function handlePress(item) {
    navigation.navigate('MainTabs', { screen: item.tab, params: { screen: item.screen } })
    navigation.closeDrawer()
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.logoWrap}>
        <UBPLogo height={30} color={colors.cream} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.rows}>
        {ITEMS.map(item => (
          <DrawerRow
            key={item.key}
            item={item}
            isActive={item.key === activeKey}
            onPress={() => handlePress(item)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.navy, paddingHorizontal: 14 },
  logoWrap: { paddingHorizontal: 6, marginBottom: 24 },
  rows: { gap: 4, paddingBottom: 12 },
  rowOuter: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 12,
    borderRadius: 8, overflow: 'hidden',
  },
  rowHighlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 8,
  },
  rowIcon: { marginRight: 13 },
  rowLabel: {
    fontFamily: fonts.sansMedium, fontSize: 14.5,
    color: 'rgba(245,240,232,0.75)', flexShrink: 1,
  },
  rowLabelActive: { color: colors.cream, fontFamily: fonts.sansSemiBold },
})
