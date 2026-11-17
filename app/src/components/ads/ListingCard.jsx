import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { fonts, shadows } from '../../constants/theme'
import { useAdTokens } from './adTheme'
import { UbpTag, PillarLabel, ReviewedMark } from './OriginTag'

// One listing: type tile, small type label, title, one meta line, price on the
// right. Calm, single line each, nothing else.
export default function ListingCard({ item, onPress }) {
  const t = useAdTokens()
  const { colors } = t
  const pillar = item.origin === 'campus' || item.origin === 'course' ? t.pillar(item.origin) : null
  const v = t.visual(item.visual)

  const TileIcon = pillar ? pillar.Icon : v.Icon
  const tileBg = pillar ? pillar.tileBg : v.bg
  const tileFg = pillar ? pillar.iconColor : v.fg
  const logo = item.partner?.logoUrl

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.typeLabel}: ${item.title}`}
      style={[s.card, { backgroundColor: colors.surface }, t.isDark ? t.cardBorder : shadows.card]}
    >
      <View style={[s.tile, { backgroundColor: tileBg }]}>
        {logo
          ? <Image source={{ uri: logo }} style={s.logo} resizeMode="contain" />
          : <TileIcon size={24} color={tileFg} strokeWidth={1.8} />}
      </View>

      <View style={s.body}>
        <View style={s.topLine}>
          {pillar
            ? <PillarLabel origin={item.origin} extra={item.typeLabel} />
            : <Text style={[s.type, { color: colors.textSecondary }]}>{item.typeLabel}</Text>}
          {item.origin === 'ubp' && <UbpTag />}
          {item.reviewed && <ReviewedMark />}
        </View>
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={2}>{item.title}</Text>
        {item.meta.length > 0 && (
          <Text style={[s.meta, { color: colors.textSecondary }]} numberOfLines={1}>{item.meta.join(' · ')}</Text>
        )}
      </View>

      {item.price && (
        <View style={s.price}>
          <Text style={[s.priceMain, { color: colors.textPrimary }]} numberOfLines={1}>{item.price.main}</Text>
          {!!item.price.sub && <Text style={[s.priceSub, { color: colors.textSecondary }]} numberOfLines={1}>{item.price.sub}</Text>}
        </View>
      )}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 18 },
  tile: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 36, height: 36 },
  body: { flex: 1, minWidth: 0 },
  topLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 2 },
  type: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 21, marginTop: 3 },
  meta: { fontFamily: fonts.sans, fontSize: 13, marginTop: 3 },
  price: { alignItems: 'flex-end', maxWidth: 96 },
  priceMain: { fontFamily: fonts.serif, fontSize: 20 },
  priceSub: { fontFamily: fonts.sans, fontSize: 11.5, marginTop: 1 },
})
