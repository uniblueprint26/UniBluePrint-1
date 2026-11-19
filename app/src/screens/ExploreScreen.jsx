import { useState, useEffect, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, ChevronRight, X } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import { SectionTitle, GroupCard, RowDivider, PartnerCard, pillarTone } from '../components/explore/ExploreParts'
import { useSocieties } from '../components/explore/societies'
import { PILLARS } from '../constants/pillars'
import { usePillarOrder } from '../hooks/usePillarOrder'
import { EXPLORE_GROUPS, PARTNERS, countLabel } from '../constants/exploreCatalog'
import { fonts } from '../constants/theme'
import { useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabase'

const GOLD = '#B4923A'

// How many published rows each explore_content kind has, for the quiet
// "24 listings" text. Counts stay empty if the query fails: nothing breaks.
function useKindCounts() {
  const [counts, setCounts] = useState({})
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('explore_content')
          .select('kind')
          .eq('status', 'published')
        if (cancelled || error || !data) return
        const next = {}
        data.forEach(r => { next[r.kind] = (next[r.kind] || 0) + 1 })
        setCounts(next)
      } catch { /* counts are optional */ }
    })()
    return () => { cancelled = true }
  }, [])
  return counts
}

export default function ExploreScreen({ navigation }) {
  const { colors, isDark } = useTheme()
  const insets = useSafeAreaInsets()
  const counts = useKindCounts()
  const pillarKeys = usePillarOrder()
  const societies = useSocieties()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const groups = useMemo(() => {
    if (!q) return EXPLORE_GROUPS
    return EXPLORE_GROUPS
      .map(g => ({ ...g, rows: g.rows.filter(r => r.name.toLowerCase().includes(q)) }))
      .filter(g => g.rows.length > 0)
  }, [q])

  function openRow(row) {
    if (row.kind) {
      navigation.navigate('ExploreList', { kind: row.kind })
    } else if (row.adBoardBasket) {
      // The Ad Board is another tab. initial: false keeps its main page under
      // the basket, so Back lands there and not on nothing.
      navigation.getParent()?.navigate('AdBoard', {
        screen: 'AdBoardBasket',
        params: { basket: row.adBoardBasket },
        initial: false,
      })
    } else if (row.route) {
      navigation.navigate(row.route, row.params)
    }
  }

  function openPartner(p) {
    navigation.navigate(p.action.route)
  }

  return (
    <View style={[s.screen, { backgroundColor: colors.background }]}>
      <AppHeader navigation={navigation} showBack />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <PageTitle title="Explore" style={s.title} />

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
            {/* Our partners */}
            <View style={s.block}>
              <SectionTitle>Our partners</SectionTitle>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.partnerRow}
              style={s.partnerScroll}
            >
              {PARTNERS.map(p => (
                <PartnerCard key={p.key} partner={p} onPress={() => openPartner(p)} />
              ))}
            </ScrollView>

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

        {groups.map(g => (
          <View key={g.key} style={s.block}>
            <SectionTitle>{g.title}</SectionTitle>
            <GroupCard>
              {g.rows.map((row, i) => (
                <View key={row.key}>
                  {i > 0 && <RowDivider />}
                  <CatalogRow
                    row={row}
                    count={row.key === 'societies' ? societies.items.length : (row.kind ? counts[row.kind] : 0)}
                    onPress={() => openRow(row)}
                  />
                  {row.key === 'societies' && !q && societies.status === 'ready' && societies.items.length > 0 && (
                    <SocietiesPreview items={societies.items} onOpen={() => openRow(row)} />
                  )}
                </View>
              ))}
            </GroupCard>
          </View>
        ))}

        {!!q && groups.length === 0 && (
          <View style={s.noMatch}>
            <Text style={[s.noMatchTitle, { color: colors.textPrimary }]}>Nothing matches</Text>
            <Text style={[s.noMatchText, { color: colors.textSecondary }]}>Try a different word, like "discounts" or "budget".</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

function CatalogRow({ row, count, onPress }) {
  const { colors } = useTheme()
  const iconColor = row.money ? GOLD : colors.textPrimary
  const tile = row.money ? 'rgba(180,146,58,0.16)' : colors.tabFill
  const right = row.statusText || countLabel(count, row.unit)
  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={row.name}
      style={s.row}
    >
      <View style={[s.rowIcon, { backgroundColor: tile }]}>
        <row.Icon size={18} color={iconColor} strokeWidth={1.7} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowName, { color: colors.textPrimary, fontFamily: fonts.sansSemiBold }]} numberOfLines={1}>{row.name}</Text>
      </View>
      {!!right && <Text style={[s.rowStatus, { color: colors.textSecondary }]}>{right}</Text>}
      <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />
    </TouchableOpacity>
  )
}

// A short sideways peek at the first six societies, under the Societies row.
function SocietiesPreview({ items, onOpen }) {
  const { colors } = useTheme()
  const first = items.slice(0, 6)
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.prevRow}
      style={s.prevScroll}
    >
      {first.map(it => {
        const line = it.institution || it.tags[0] || ''
        return (
          <TouchableOpacity
            key={it.id}
            activeOpacity={0.8}
            onPress={onOpen}
            accessibilityRole="button"
            accessibilityLabel={`${it.name}${line ? `, ${line}` : ''}`}
            style={[s.prevCard, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <View style={[s.prevInitial, { backgroundColor: colors.tabFill }]}>
              <Text style={[s.prevInitialText, { color: colors.textPrimary }]}>{it.name.charAt(0).toUpperCase()}</Text>
            </View>
            <Text style={[s.prevName, { color: colors.textPrimary }]} numberOfLines={2}>{it.name}</Text>
            <Text style={[s.prevLine, { color: colors.textSecondary }]} numberOfLines={1}>{line || ' '}</Text>
            {it.example && (
              <View style={[s.prevTag, { backgroundColor: colors.tabFill }]}>
                <Text style={[s.prevTagText, { color: colors.textSecondary }]}>Example</Text>
              </View>
            )}
          </TouchableOpacity>
        )
      })}
    </ScrollView>
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

  partnerScroll: { marginHorizontal: -16 },
  partnerRow: { paddingHorizontal: 16, gap: 12, paddingVertical: 4 },

  pillarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pillarItem: { width: 56, alignItems: 'center', gap: 6 },
  pillarCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  pillarLabel: { fontFamily: fonts.sansMedium, fontSize: 10.5, lineHeight: 13, textAlign: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 14, minHeight: 56 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontSize: 15 },

  prevScroll: { marginBottom: 14 },
  prevRow: { paddingHorizontal: 14, gap: 10 },
  prevCard: { width: 148, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  prevInitial: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  prevInitialText: { fontFamily: fonts.serif, fontSize: 16 },
  prevName: { fontFamily: fonts.sansSemiBold, fontSize: 13.5, lineHeight: 18, marginTop: 10, minHeight: 36 },
  prevLine: { fontFamily: fonts.sans, fontSize: 12, marginTop: 2 },
  prevTag: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 8 },
  prevTagText: { fontFamily: fonts.sansSemiBold, fontSize: 10.5 },
  rowStatus: { fontFamily: fonts.sans, fontSize: 13 },

  noMatch: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  noMatchTitle: { fontFamily: fonts.serif, fontSize: 22 },
  noMatchText: { fontFamily: fonts.sans, fontSize: 14, marginTop: 8, textAlign: 'center' },
})
