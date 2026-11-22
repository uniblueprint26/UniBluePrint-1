import { useState, useEffect, useRef } from 'react'
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Copy, Check } from 'lucide-react-native'
import { fonts, shadows } from '../../constants/theme'
import { useAdTokens } from './adTheme'
import { UbpTag, QuietTag, ExampleTag, Chip, ReviewedMark } from './OriginTag'

// A deal code with a Copy button. Used by partner deals.
function CodeRow({ code, t }) {
  const { colors } = t
  const [copied, setCopied] = useState(false)
  const timer = useRef(null)
  useEffect(() => () => clearTimeout(timer.current), [])
  async function copy() {
    try { await Clipboard.setStringAsync(code) } catch { return }
    setCopied(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1800)
  }
  return (
    <View style={s.codeRow}>
      <View style={[s.codeBox, { backgroundColor: colors.tabFill, borderColor: colors.border }]}>
        <Text style={[s.codeLabel, { color: colors.textSecondary }]}>Code</Text>
        <Text style={[s.codeText, { color: colors.textPrimary }]} numberOfLines={1} selectable>{code}</Text>
      </View>
      <TouchableOpacity
        onPress={copy}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={copied ? 'Code copied' : `Copy code ${code}`}
        style={[s.copyBtn, { backgroundColor: t.accent }]}
      >
        {copied ? <Check size={14} color={t.accentInk} strokeWidth={2.6} /> : <Copy size={14} color={t.accentInk} strokeWidth={2.2} />}
        <Text style={[s.copyText, { color: t.accentInk }]}>{copied ? 'Copied' : 'Copy'}</Text>
      </TouchableOpacity>
    </View>
  )
}

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
  const logoSource = item.partner?.logo || null
  const monogram = !logo && !logoSource && item.partner?.initials ? item.partner : null
  const tappable = !item.example && !!onPress

  const body = (
    <>
      <View style={[s.tile, { backgroundColor: logoSource ? '#FFFFFF' : monogram ? monogram.initBg : v.bg }]}>
        {logoSource
          ? <Image source={typeof logoSource === 'string' ? { uri: logoSource } : logoSource} style={s.logoFill} resizeMode="contain" />
          : logo
            ? <Image source={{ uri: logo }} style={s.logo} resizeMode="contain" />
            : monogram
              ? <Text style={s.monogram}>{monogram.initials}</Text>
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
        {!!item.code && <CodeRow code={item.code} t={t} />}
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
  logoFill: { width: 46, height: 46 },
  monogram: { fontFamily: fonts.sansBold, fontSize: 15, color: '#FFFFFF', letterSpacing: 0.4 },
  codeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  codeBox: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, height: 34, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth },
  codeLabel: { fontFamily: fonts.sansMedium, fontSize: 11.5 },
  codeText: { flexShrink: 1, fontFamily: fonts.sansSemiBold, fontSize: 13, letterSpacing: 0.3 },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, height: 34, paddingHorizontal: 12, borderRadius: 17 },
  copyText: { fontFamily: fonts.sansSemiBold, fontSize: 12.5 },
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
