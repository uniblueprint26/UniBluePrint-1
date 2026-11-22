import { useState, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, ChevronRight, X } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import ComingSoonSheet from '../components/ui/ComingSoonSheet'
import { SectionTitle, GroupCard, RowDivider, pillarTone } from '../components/explore/ExploreParts'
import PartnerStrip from '../components/explore/PartnerStrip'
import { PILLARS } from '../constants/pillars'
import { usePillarOrder } from '../hooks/usePillarOrder'
import { EXPLORE_BUNDLES, COMING_SOON_BUNDLE, countLabel } from '../constants/exploreCatalog'
import { useComingSoonEnabled, COMING_SOON_COPY, COMING_SOON_TITLE } from '../constants/comingSoon'
import { useKindCounts, openExploreRow } from '../lib/explore/exploreRows'
import ErrorState from '../components/ui/ErrorState'
import SlowLoad from '../components/ui/SlowLoad'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'

const GOLD = '#B4923A'

// Explore: a partner strip that swipes by itself, the pillars, and a handful of
// bundle tiles. Each bundle opens its own page, so no list here is long.
export default function ExploreScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const counts = useKindCounts()
  const pillarKeys = usePillarOrder()
  const comingSoonOn = useComingSoonEnabled()
  const [query, setQuery] = useState('')
  const [sheet, setSheet] = useState(null)

  const bundles = useMemo(
    () => (comingSoonOn ? [...EXPLORE_BUNDLES, COMING_SOON_BUNDLE] : EXPLORE_BUNDLES),
    [comingSoonOn],
  )

  const q = query.trim().toLowerCase()
  const matches = useMemo(() => {
    if (!q) return []
    const out = []
    bundles.forEach(b => b.rows.forEach(r => {
      if (`${r.name} ${r.hint || ''}`.toLowerCase().includes(q)) out.push({ ...r, bundle: b.title })
    }))
    return out
  }, [q, bundles])

  function openBundle(b) {
    navigation.navigate('ExploreBundle', { bundleKey: b.key })
  }

  function openPartner(p) {
    navigation.navigate(p.action.route, p.action.params)
  }

  function openRow(row) {
    if (row.comingSoon) setSheet(row)
    else openExploreRow(navigation, row)
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <SlowLoad loading={counts.__loading} />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageTitle title="Explore" style={s.title} />

        {counts.__failed && (
          <ErrorState title="Could not load Explore" body="Counts and offers may be missing. Check your connection and try again." onRetry={counts.__reload} style={{ paddingVertical: 8 }} />
        )}

        <View style={[s.search, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Search size={18} color={colors.textSecondary} strokeWidth={1.8} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search tools, offers and societies"
            placeholderTextColor={colors.textTertiary}
            style={[s.searchInput, { color: colors.textPrimary }]}
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Search Explore"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button" accessibilityLabel="Clear search">
              <X size={16} color={colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {!q && (
          <>
            {/* Our partners: swipes by itself */}
            <View style={s.block}>
              <SectionTitle>Our partners</SectionTitle>
              <PartnerStrip onOpen={openPartner} />
            </View>

            {/* Bundles */}
            <View style={s.block}>
              <SectionTitle>Explore</SectionTitle>
              <View style={s.grid}>
                {bundles.map(b => (
                  <TouchableOpacity
                    key={b.key}
                    activeOpacity={0.8}
                    onPress={() => openBundle(b)}
                    accessibilityRole="button"
                    accessibilityLabel={`${b.title}. ${b.blurb}`}
                    style={[s.tile, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    <View style={[s.tileIcon, { backgroundColor: colors.tabFill }]}>
                      <b.Icon size={22} color={colors.textPrimary} strokeWidth={1.7} />
                    </View>
                    <Text style={[s.tileTitle, { color: colors.textPrimary }]} numberOfLines={2}>{b.title}</Text>
                    <Text style={[s.tileBlurb, { color: colors.textSecondary }]} numberOfLines={2}>{b.blurb}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Pillars */}
            <View style={s.block}>
              <SectionTitle>Pillars</SectionTitle>
              <View style={s.pillarRow}>
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
                      style={s.pillarItem}
                    >
                      <View style={[s.pillarCircle, { backgroundColor: tone.tint }]}>
                        <p.Icon size={20} color={tone.fg} strokeWidth={1.8} />
                      </View>
                      <Text style={[s.pillarLabel, { color: colors.textPrimary }]} numberOfLines={2}>{p.label}</Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            </View>
          </>
        )}

        {!!q && matches.length > 0 && (
          <View style={s.block}>
            <GroupCard>
              {matches.map((row, i) => (
                <View key={row.key}>
                  {i > 0 && <RowDivider />}
                  <SearchRow row={row} count={countLabel(counts[row.kind], row.unit)} onPress={() => openRow(row)} />
                </View>
              ))}
            </GroupCard>
          </View>
        )}

        {!!q && matches.length === 0 && (
          <View style={s.noMatch}>
            <Text style={[s.noMatchTitle, { color: colors.textPrimary }]}>Nothing matches</Text>
            <Text style={[s.noMatchText, { color: colors.textSecondary }]}>Try a different word, like "discounts" or "budget".</Text>
          </View>
        )}
      </ScrollView>

      {comingSoonOn ? (
        <ComingSoonSheet visible={!!sheet} onClose={() => setSheet(null)} title={sheet?.name || COMING_SOON_TITLE} message={COMING_SOON_COPY} />
      ) : null}
    </View>
  )
}

function SearchRow({ row, count, onPress }) {
  const { colors } = useTheme()
  const iconColor = row.money ? GOLD : colors.textPrimary
  const tile = row.money ? 'rgba(180,146,58,0.16)' : colors.tabFill
  return (
    <TouchableOpacity activeOpacity={0.75} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${row.name}, in ${row.bundle}`} style={s.row}>
      <View style={[s.rowIcon, { backgroundColor: tile }]}>
        <row.Icon size={18} color={iconColor} strokeWidth={1.7} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowName, { color: colors.textPrimary }]} numberOfLines={1}>{row.name}</Text>
        <Text style={[s.rowHint, { color: colors.textSecondary }]} numberOfLines={1}>{row.bundle}</Text>
      </View>
      {!!count && <Text style={[s.rowStatus, { color: colors.textSecondary }]}>{count}</Text>}
      <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  title: { paddingHorizontal: 2, paddingTop: 18 },
  block: { marginTop: 32 },

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
    height: 48, borderRadius: 16, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, height: 48, outlineStyle: 'none' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { width: '47.8%', flexGrow: 1, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, minHeight: 148 },
  tileIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontFamily: fonts.serif, fontSize: 20, lineHeight: 25, marginTop: 14 },
  tileBlurb: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 4 },

  pillarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pillarItem: { width: 56, alignItems: 'center', gap: 6 },
  pillarCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  pillarLabel: { fontFamily: fonts.sansMedium, fontSize: 10.5, lineHeight: 13, textAlign: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 14, minHeight: 56 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontFamily: fonts.sansSemiBold, fontSize: 15 },
  rowHint: { fontFamily: fonts.sans, fontSize: 12.5, marginTop: 1 },
  rowStatus: { fontFamily: fonts.sans, fontSize: 13 },

  noMatch: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  noMatchTitle: { fontFamily: fonts.serif, fontSize: 22 },
  noMatchText: { fontFamily: fonts.sans, fontSize: 14, marginTop: 8, textAlign: 'center' },
})
