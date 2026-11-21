import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { ToolScreen } from '../../components/explore/ToolBits'
import { GroupCard, RowDivider } from '../../components/explore/ExploreParts'
import ComingSoonSheet from '../../components/ui/ComingSoonSheet'
import { EXPLORE_BUNDLES, COMING_SOON_BUNDLE, countLabel } from '../../constants/exploreCatalog'
import { useComingSoonEnabled, COMING_SOON_COPY, COMING_SOON_TITLE } from '../../constants/comingSoon'
import { useKindCounts, openExploreRow } from '../../lib/explore/exploreRows'
import { fonts } from '../../constants/theme'
import { useTheme } from '../../context/ThemeContext'

const GOLD = '#B4923A'

// One Explore bundle on its own page: a short list of rows, each with a one
// line hint. The Coming soon bundle only exists while the remote switch is on.
export default function ExploreBundleScreen({ navigation, route }) {
  const { colors } = useTheme()
  const comingSoonOn = useComingSoonEnabled()
  const counts = useKindCounts()
  const [sheet, setSheet] = useState(null)
  const key = route?.params?.bundleKey
  const bundle = key === COMING_SOON_BUNDLE.key
    ? (comingSoonOn ? COMING_SOON_BUNDLE : null)
    : EXPLORE_BUNDLES.find(b => b.key === key)

  if (!bundle) {
    return (
      <ToolScreen navigation={navigation} title="Explore">
        <Text style={[s.empty, { color: colors.textSecondary }]}>Nothing to show here.</Text>
      </ToolScreen>
    )
  }

  const soon = bundle.key === COMING_SOON_BUNDLE.key

  function press(row) {
    if (row.comingSoon) setSheet(row)
    else openExploreRow(navigation, row)
  }

  return (
    <ToolScreen navigation={navigation} title={bundle.title} subtitle={soon ? undefined : bundle.blurb}>
      <GroupCard>
        {bundle.rows.map((row, i) => {
          const right = row.comingSoon ? null : row.statusText || countLabel(counts[row.kind], row.unit)
          const iconColor = row.money ? GOLD : colors.textPrimary
          const tile = row.money ? 'rgba(180,146,58,0.16)' : colors.tabFill
          return (
            <View key={row.key}>
              {i > 0 && <RowDivider />}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => press(row)}
                accessibilityRole="button"
                accessibilityLabel={`${row.name}. ${row.hint}`}
                style={s.row}
              >
                <View style={[s.icon, { backgroundColor: tile }]}>
                  <row.Icon size={20} color={iconColor} strokeWidth={1.7} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[s.name, { color: colors.textPrimary }]} numberOfLines={2}>{row.name}</Text>
                  {!!row.hint && <Text style={[s.hint, { color: colors.textSecondary }]} numberOfLines={2}>{row.hint}</Text>}
                </View>
                {row.comingSoon ? (
                  <View style={[s.pill, { backgroundColor: colors.tabFill }]}>
                    <Text style={[s.pillText, { color: colors.textPrimary }]}>{COMING_SOON_TITLE}</Text>
                  </View>
                ) : (
                  <>
                    {!!right && <Text style={[s.right, { color: colors.textSecondary }]}>{right}</Text>}
                    <ChevronRight size={18} color={colors.textTertiary} strokeWidth={1.8} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          )
        })}
      </GroupCard>

      {comingSoonOn ? (
        <ComingSoonSheet visible={!!sheet} onClose={() => setSheet(null)} title={sheet?.name || COMING_SOON_TITLE} message={COMING_SOON_COPY} />
      ) : null}
    </ToolScreen>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16, minHeight: 68 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: fonts.sansSemiBold, fontSize: 15.5 },
  hint: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 2 },
  right: { fontFamily: fonts.sans, fontSize: 13 },
  pill: { paddingHorizontal: 12, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  pillText: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  empty: { fontFamily: fonts.sans, fontSize: 15, paddingHorizontal: 4 },
})
