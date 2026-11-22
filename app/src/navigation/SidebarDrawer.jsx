import { useState, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Compass, Wallet, Tag, Search, X } from 'lucide-react-native'
import { PILLARS } from '../constants/pillars'
import SearchResults from '../components/search/SearchResults'
import { searchApp, openSearchResult } from '../constants/searchIndex'
import UBPLogo from '../components/ui/UBPLogo'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { useFoundationEnabled } from '../hooks/useAppFlags'

// The drawer's 8 destinations, in the exact order specified. Everything
// except Ad Board is a screen pushed inside HomeStack, so getting there
// from the drawer (which sits above the Tab.Navigator) means navigating
// two levels down: MainTabs -> Home tab -> the screen itself. Ad Board is
// the root of its own tab/stack, so it only needs one level.
const ITEMS = [
  { key: 'foundation', label: 'Foundation Blueprint', Icon: PILLARS.foundation.Icon, color: PILLARS.foundation.color, tab: 'Home', screen: 'Foundation', group: 1 },
  { key: 'elevation',  label: 'Elevation Blueprint',  Icon: PILLARS.elevation.Icon,  color: PILLARS.elevation.color,  tab: 'Home', screen: 'Elevation', group: 1 },
  { key: 'lifestyle',  label: 'Lifestyle Blueprint',  Icon: PILLARS.lifestyle.Icon,  color: PILLARS.lifestyle.color,  tab: 'Home', screen: 'Lifestyle', group: 1 },
  { key: 'campus',     label: 'Campus Connect',       Icon: PILLARS.campus.Icon,     color: PILLARS.campus.color,     tab: 'Home', screen: 'CampusConnect', group: 2 },
  { key: 'course',     label: 'Course Connect',       Icon: PILLARS.course.Icon,     color: PILLARS.course.color,     tab: 'Home', screen: 'CourseConnect', group: 2 },
  { key: 'compass',    label: 'Course Compass',       Icon: Compass,                 color: null,                     tab: 'Home', screen: 'Compass', group: 3 },
  { key: 'budgeting',  label: 'Budgeting',            Icon: Wallet,                  color: null,                     tab: 'Home', screen: 'Budgeting', group: 3 },
  { key: 'adboard',    label: 'Ad Board',             Icon: Tag,                     color: null,                     tab: 'AdBoard', screen: 'AdBoardMain', group: 3 },
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
  LifestylePartners: 'lifestyle',
  LifestyleFeaturedDeals: 'lifestyle',
  LifestyleWellbeing: 'lifestyle',
  LifestyleBudgetingPreview: 'lifestyle',
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
  const { colors, isDark } = useTheme()
  // The deep navy and purple pillar colours vanish on the dark drawer, so use
  // lighter tints of the same hues there.
  const DARK_TINT = { foundation: '#9DB9E3', elevation: '#B7A3F0' }
  const accent = (isDark && DARK_TINT[item.key]) || item.color || colors.textPrimary
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={[styles.rowOuter, isActive && { backgroundColor: colors.tabFill }]}
    >
      <View style={[styles.tile, { backgroundColor: item.color ? accent + '22' : colors.tabFill }]}>
        <item.Icon size={21} color={accent} strokeWidth={1.8} />
      </View>
      <Text style={[styles.rowLabel, { color: colors.textPrimary }, isActive && { fontFamily: fonts.sansSemiBold }]} numberOfLines={1}>
        {item.label}
      </Text>
    </TouchableOpacity>
  )
}

// Option A side menu: the wordmark, a search field, then the pillars. Typing in
// the search field swaps the list for Google like results with the path to each
// thing, for example CV, then Foundation Blueprint, then CV Optimisation.
export default function SidebarDrawer({ state, navigation }) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { enabled: foundationOpen } = useFoundationEnabled()
  const [q, setQ] = useState('')
  const items = ITEMS.filter(i => foundationOpen || i.key !== 'foundation')
  const mainTabsRoute = state.routes.find(r => r.name === 'MainTabs')
  const activeRouteName = getActiveRouteName(mainTabsRoute?.state)
  const activeKey = ROUTE_TO_KEY[activeRouteName] ?? null
  const results = useMemo(() => searchApp(q, 10), [q])

  function handlePress(item) {
    navigation.navigate('MainTabs', { screen: item.tab, params: { screen: item.screen } })
    navigation.closeDrawer()
  }

  function openResult(entry) {
    openSearchResult(navigation, entry, { fromDrawer: true })
    setQ('')
    navigation.closeDrawer()
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <View style={styles.logoWrap}>
        <UBPLogo height={30} color={colors.textPrimary} />
      </View>

      <View style={[styles.field, { backgroundColor: colors.tabFill }]}>
        <Search size={18} color={colors.textSecondary} strokeWidth={1.9} />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          value={q}
          onChangeText={setQ}
          placeholder="Search"
          placeholderTextColor={colors.textTertiary}
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search UniBlueprint"
        />
        {!!q && (
          <TouchableOpacity onPress={() => setQ('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
            <X size={18} color={colors.textSecondary} strokeWidth={1.9} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.rows}>
        {q.trim() ? (
          <SearchResults query={q} results={results} onOpen={openResult} compact />
        ) : (
          items.map((item, i) => (
            <View key={item.key}>
              {i > 0 && items[i - 1].group !== item.group && <View style={[styles.divider, { backgroundColor: colors.divider }]} />}
              <DrawerRow item={item} isActive={item.key === activeKey} onPress={() => handlePress(item)} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 14 },
  logoWrap: { paddingHorizontal: 6, marginBottom: 18 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 46, borderRadius: 16, paddingHorizontal: 14, marginBottom: 16 },
  input: { flex: 1, fontFamily: fonts.sans, fontSize: 16, paddingVertical: 0 },
  scrollView: { flex: 1 },
  rows: { paddingBottom: 12 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 10, marginHorizontal: 8 },
  rowOuter: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 16 },
  tile: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: fonts.sansMedium, fontSize: 16, flexShrink: 1 },
})
