import { useState, useEffect, useMemo } from 'react'
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Search, ChevronRight, X } from 'lucide-react-native'
import AppHeader, { PageTitle } from '../components/ui/AppHeader'
import ComingSoonSheet from '../components/ui/ComingSoonSheet'
import { SectionTitle, GroupCard, RowDivider, PartnerMark, pillarTone } from '../components/explore/ExploreParts'
import { PILLARS, PILLAR_ORDER } from '../constants/pillars'
import { EXPLORE_GROUPS, PARTNERS, countLabel } from '../constants/exploreCatalog'
import { fonts, shadows } from '../constants/theme'
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
  const [query, setQuery] = useState('')
  const [sheet, setSheet] = useState(null)

  const q = query.trim().toLowerCase()
  const groups = useMemo(() => {
    if (!q) return EXPLORE_GROUPS
    return EXPLORE_GROUPS
      .map(g => ({ ...g, rows: g.rows.filter(r => r.name.toLowerCase().includes(q)) }))
      .filter(g => g.rows.length > 0)
  }, [q])

  function openRow(row) {
    if (row.status === 'soon') {
      setSheet({ name: row.name, soonText: `${row.name} is coming soon. We will let you know when it is ready.` })
    } else if (row.kind) {
      navigation.navigate('ExploreList', { kind: row.kind })
    } else if (row.route) {
      navigation.navigate(row.route)
    }
  }

  function openPartner(p) {
    if (p.action.route) navigation.navigate(p.action.route)
    else setSheet({ name: p.name, soonText: p.soonText })
  }

  const cardShadow = isDark ? { borderWidth: 1, borderColor: colors.border } : shadows.card

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
                <TouchableOpacity
                  key={p.key}
                  activeOpacity={0.85}
                  onPress={() => openPartner(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`${p.name}. ${p.blurb}`}
                  style={[s.partnerCard, { backgroundColor: colors.surface }, cardShadow]}
                >
                  <View style={s.partnerTop}>
                    <PartnerMark partner={p} size={44} />
                    <View style={[s.cta, { backgroundColor: colors.tabFill }]}>
                      <Text style={[s.ctaText, { color: p.soon ? colors.textSecondary : colors.textPrimary }]}>{p.cta}</Text>
                      {!p.soon && <ChevronRight size={14} color={colors.textPrimary} strokeWidth={2.2} />}
                    </View>
                  </View>
                  <Text style={[s.partnerName, { color: colors.textPrimary }]}>{p.name}</Text>
                  <Text style={[s.partnerBlurb, { color: colors.textSecondary }]} numberOfLines={2}>{p.blurb}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Pillars */}
            <View style={s.block}>
              <SectionTitle>Pillars</SectionTitle>
              <View style={s.pillarRow}>
                {PILLAR_ORDER.map(key => {
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
                  <CatalogRow row={row} count={row.kind ? counts[row.kind] : 0} onPress={() => openRow(row)} />
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

      <ComingSoonSheet
        visible={!!sheet}
        onClose={() => setSheet(null)}
        title={sheet?.name || 'Coming soon'}
        message={sheet?.soonText || ''}
      />
    </View>
  )
}

function CatalogRow({ row, count, onPress }) {
  const { colors } = useTheme()
  const soon = row.status === 'soon'
  const iconColor = row.money ? GOLD : soon ? colors.textTertiary : colors.textPrimary
  const tile = row.money ? 'rgba(180,146,58,0.16)' : colors.tabFill
  const right = soon ? null : (row.statusText || countLabel(count, row.unit))
  return (
    <TouchableOpacity
      activeOpacity={soon ? 0.7 : 0.75}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={soon ? `${row.name}, coming soon` : row.name}
      style={s.row}
    >
      <View style={[s.rowIcon, { backgroundColor: tile }]}>
        <row.Icon size={18} color={iconColor} strokeWidth={1.7} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[s.rowName, { color: soon ? colors.textSecondary : colors.textPrimary, fontFamily: soon ? fonts.sansMedium : fonts.sansSemiBold }]} numberOfLines={1}>{row.name}</Text>
        {!soon && row.fromUbp && <Text style={[s.rowSub, { color: colors.textSecondary }]}>From UBP</Text>}
      </View>
      {soon ? (
        <View style={[s.soonTag, { backgroundColor: colors.tabFill }]}>
          <Text style={[s.soonText, { color: colors.textSecondary }]}>SOON</Text>
        </View>
      ) : (
        <>
          {!!right && <Text style={[s.rowStatus, { color: colors.textSecondary }]}>{right}</Text>}
          <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />
        </>
      )}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 16 },
  title: { paddingHorizontal: 2, paddingTop: 18 },
  block: { marginTop: 28 },

  search: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12,
    height: 48, borderRadius: 16, paddingHorizontal: 14, borderWidth: StyleSheet.hairlineWidth,
  },
  searchInput: { flex: 1, fontFamily: fonts.sans, fontSize: 15, height: 48, outlineStyle: 'none' },

  partnerScroll: { marginHorizontal: -16 },
  partnerRow: { paddingHorizontal: 16, gap: 12, paddingVertical: 4 },
  partnerCard: { width: 244, borderRadius: 16, padding: 16 },
  partnerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cta: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 12, height: 28, borderRadius: 14 },
  ctaText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5 },
  partnerName: { fontFamily: fonts.serif, fontSize: 20, marginTop: 14 },
  partnerBlurb: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 3, minHeight: 36 },

  pillarRow: { flexDirection: 'row', justifyContent: 'space-between' },
  pillarItem: { width: 56, alignItems: 'center', gap: 6 },
  pillarCircle: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  pillarLabel: { fontFamily: fonts.sansMedium, fontSize: 10.5, lineHeight: 13, textAlign: 'center' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, paddingHorizontal: 14, minHeight: 56 },
  rowIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowName: { fontSize: 15 },
  rowSub: { fontFamily: fonts.sans, fontSize: 11.5, marginTop: 1 },
  rowStatus: { fontFamily: fonts.sans, fontSize: 13 },
  soonTag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 10 },
  soonText: { fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.8 },

  noMatch: { alignItems: 'center', paddingTop: 48, paddingHorizontal: 24 },
  noMatchTitle: { fontFamily: fonts.serif, fontSize: 22 },
  noMatchText: { fontFamily: fonts.sans, fontSize: 14, marginTop: 8, textAlign: 'center' },
})
