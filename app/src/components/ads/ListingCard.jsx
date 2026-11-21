import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { fonts, shadows } from '../../constants/theme'
import { useAdTokens } from './adTheme'
import { UbpTag, QuietTag, ExampleTag, Chip, ReviewedMark } from './OriginTag'

// One listing: type tile, a type chip with who posted it, title, "From ..." and
// one meta line, price on the right. Calm, one line each.
//
// Optional fields on `item`:
//   from       who it is from (organisation, partner or poster)
//   byStudent  Jobs only: show "Posted by a student" when UBP did not post it
//   tagLabel   overrides the UBP tag text (e.g. "POSTED BY UBP")
//   example    makes the card an obvious, non-tappable example. It shows the
//              industry `chip`, an `exampleLine` and a price with a `tag`
//   hint       a small line at the foot ("Opens Foundation")
export default function ListingCard({ item, onPress }) {
  const t = useAdTokens()
  const { colors } = t
  const v = t.visual(item.visual)
  const TileIcon = v.Icon
  const logo = item.partner?.logoUrl
  const tappable = !item.example && !!onPress

  const body = (
    <>
      <View style={[s.tile, { backgroundColor: v.bg }]}>
        {logo
          ? <Image source={{ uri: logo }} style={s.logo} resizeMode="contain" />
          : <TileIcon size={24} color={v.fg} strokeWidth={1.8} />}
      </View>

      <View style={s.body}>
        <View style={s.topLine}>
          {item.chip
            ? <Chip label={item.chip} />
            : <Text style={[s.type, { color: v.text }]}>{item.typeLabel}</Text>}
          {item.example
            ? <ExampleTag />
            : item.origin === 'ubp'
              ? <UbpTag label={item.tagLabel} />
              : item.byStudent ? <QuietTag label="POSTED BY A STUDENT" /> : null}
          {item.reviewed && <ReviewedMark />}
        </View>
        <Text style={[s.title, { color: colors.textPrimary }]} numberOfLines={2}>{item.title}</Text>
        {!!item.from && (
          <Text style={[s.from, { color: colors.textPrimary }]} numberOfLines={1}>{`From ${item.from}`}</Text>
        )}
        {item.meta?.length > 0 && (
          <Text style={[s.meta, { color: colors.textSecondary }]} numberOfLines={2}>{item.meta.join(' · ')}</Text>
        )}
        {!!item.exampleLine && <Text style={[s.exampleLine, { color: colors.textSecondary }]}>{item.exampleLine}</Text>}
        {!!item.hint && <Text style={[s.hint, { color: t.accentText }]}>{item.hint}</Text>}
      </View>

      {item.price && (
        <View style={s.price}>
          <Text style={[s.priceMain, { color: colors.textPrimary }]} numberOfLines={1}>{item.price.main}</Text>
          {!!item.price.sub && <Text style={[s.priceSub, { color: colors.textSecondary }]} numberOfLines={1}>{item.price.sub}</Text>}
        </View>
      )}
    </>
  )

  const cardStyle = [
    s.card,
    { backgroundColor: colors.surface },
    item.example ? { borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border } : (t.isDark ? t.cardBorder : shadows.card),
  ]

  if (!tappable) return <View style={cardStyle} accessibilityLabel={`${item.typeLabel}: ${item.title}`}>{body}</View>
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.typeLabel}: ${item.title}`}
      style={cardStyle}
    >
      {body}
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, padding: 16, borderRadius: 20 },
  tile: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 36, height: 36 },
  body: { flex: 1, minWidth: 0 },
  topLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', columnGap: 8, rowGap: 4 },
  type: { fontFamily: fonts.sansSemiBold, fontSize: 12 },
  title: { fontFamily: fonts.sansSemiBold, fontSize: 16, lineHeight: 21, marginTop: 6 },
  from: { fontFamily: fonts.sansMedium, fontSize: 13.5, marginTop: 3 },
  meta: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, marginTop: 3 },
  exampleLine: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginTop: 8 },
  priceTag: { marginTop: 6 },
  hint: { fontFamily: fonts.sansMedium, fontSize: 12.5, marginTop: 8 },
  price: { alignItems: 'flex-end', maxWidth: 96 },
  priceMain: { fontFamily: fonts.serif, fontSize: 20 },
  priceSub: { fontFamily: fonts.sans, fontSize: 11.5, marginTop: 1 },
})
