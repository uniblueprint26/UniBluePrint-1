import { memo, useRef } from 'react'
import { View, Text, Image, Pressable, ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import { fonts } from '../../../constants/theme'
import { useTheme } from '../../../context/ThemeContext'
import { maskComingSoonName } from '../../../data/lifestylePartners'
import { endsTag, withAlpha } from '../../../data/partnerCards'
import { cleanCopy } from '../../../lib/plainCopy'
import BankCard, { cardSize } from './BankCard'

// The deal wallet: a vertical stack of overlapping bank card shaped cards. Each card
// overlaps the next so you see its top strip (logo, name, UBP Discount pill, slogan).
// Tapping a card opens it (see OpenCard).

export function useCardWidth() {
  const { width } = useWindowDimensions()
  return Math.min(width - 32, 440)
}

const StackCard = memo(function StackCard({ partner, cfg, width, first, hidden, fav, regular, onOpen, onToggleFav }) {
  const ref = useRef(null)
  const { h, strip } = cardSize(width)
  return (
    <View
      ref={ref}
      collapsable={false}
      style={{ marginTop: first ? 0 : -(h - strip), opacity: hidden ? 0 : 1, alignSelf: 'center' }}
    >
      <Pressable
        onPress={() => onOpen(partner, ref)}
        accessibilityRole="button"
        accessibilityLabel={`${partner.brand}, ${cfg.discountLabel}, ${cleanCopy(partner.category)}. Open the card`}
        style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}
      >
        <BankCard
          partner={partner}
          cfg={cfg}
          width={width}
          variant="stack"
          favorited={fav}
          onToggleFav={() => onToggleFav(partner.id)}
          regular={regular}
          tag={endsTag(cfg.endsOn)}
        />
      </Pressable>
    </View>
  )
})

// A greyed Coming soon card. Same bank card shape. Only shown when the remote flag
// coming_soon_tiles is on.
const SoonCard = memo(function SoonCard({ partner, width, first }) {
  const { colors } = useTheme()
  const { h, strip, radius, s } = cardSize(width)
  return (
    <View
      style={{
        marginTop: first ? 0 : -(h - strip), width, height: h, borderRadius: radius, alignSelf: 'center',
        backgroundColor: colors.surfaceSunk, borderWidth: 1, borderColor: colors.border, padding: Math.round(14 * s),
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: -3 }, elevation: 2,
      }}
      accessible
      accessibilityLabel="A partner that is coming soon"
    >
      <Text style={{ fontFamily: fonts.serif, fontSize: 21, color: colors.textSecondary }} numberOfLines={1}>{maskComingSoonName(partner.brand)}</Text>
      <View style={[styles.soonPill, { borderColor: colors.border }]}>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 11, color: colors.textSecondary }}>Coming soon</Text>
      </View>
      <Text style={{ fontFamily: fonts.sansMedium, fontSize: 12, color: colors.textTertiary, marginTop: 6 }} numberOfLines={1}>
        {[partner.county, cleanCopy(partner.category)].filter(Boolean).join(' · ')}
      </Text>
    </View>
  )
})

function Stack({ items, getCfg, width, hiddenId, wallet, onOpen }) {
  return (
    <View>
      {items.map((p, i) => (
        <StackCard
          key={p.id}
          partner={p}
          cfg={getCfg(p)}
          width={width}
          first={i === 0}
          hidden={hiddenId === p.id}
          fav={wallet.isFav(p.id)}
          regular={wallet.isRegular(p.id)}
          onOpen={onOpen}
          onToggleFav={wallet.toggleFav}
        />
      ))}
    </View>
  )
}

export default function PartnerWallet({ partners, soon = [], getCfg, wallet, hiddenId, onOpen }) {
  const { colors } = useTheme()
  const width = useCardWidth()
  const favs = partners.filter(p => wallet.isFav(p.id)).sort((a, b) => wallet.favs.indexOf(a.id) - wallet.favs.indexOf(b.id))
  const rest = partners.filter(p => !wallet.isFav(p.id))
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {favs.length > 0 && (
        <View style={{ marginBottom: 22 }}>
          <Text style={[styles.group, { color: colors.textPrimary }]} accessibilityRole="header">Favourites</Text>
          <Stack items={favs} getCfg={getCfg} width={width} hiddenId={hiddenId} wallet={wallet} onOpen={onOpen} />
        </View>
      )}
      {rest.length > 0 && (
        <View>
          {favs.length > 0 && <Text style={[styles.group, { color: colors.textPrimary }]} accessibilityRole="header">All partners</Text>}
          <Stack items={rest} getCfg={getCfg} width={width} hiddenId={hiddenId} wallet={wallet} onOpen={onOpen} />
        </View>
      )}
      {soon.length > 0 && (
        <View style={{ marginTop: 28 }}>
          <Text style={[styles.group, { color: colors.textPrimary }]} accessibilityRole="header">Coming soon</Text>
          {soon.map((p, i) => <SoonCard key={p.id} partner={p} width={width} first={i === 0} />)}
        </View>
      )}
    </View>
  )
}

// ─── Partner Spotlight strip ─────────────────────────────────────────────────
// Story style circles, one per partner with a new update. Renders nothing at all
// when there are no updates (no empty strip). There is no data yet.
export function PartnerSpotlightStrip({ updates, getCfg, onOpen }) {
  const { colors } = useTheme()
  if (!updates || updates.length === 0) return null
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingHorizontal: 16, paddingBottom: 14 }} accessibilityLabel="Partner updates">
      {updates.map(u => {
        const cfg = getCfg(u.partner)
        return (
          <Pressable key={u.partnerId} onPress={() => onOpen(u.partner, null)} accessibilityRole="button" accessibilityLabel={`${u.partner.brand}, new update`} style={styles.story}>
            <View style={[styles.storyRing, { borderColor: cfg.brandColor }]}>
              <View style={[styles.storyIn, { backgroundColor: cfg.logo ? cfg.logoBg : cfg.brandColor }]}>
                {cfg.logo
                  ? <Image source={cfg.logo} resizeMode="contain" style={{ width: 44, height: 44 }} />
                  : <Text style={{ fontFamily: fonts.serif, fontSize: 20, color: cfg.textColor }}>{cfg.initials}</Text>}
              </View>
            </View>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 11.5, color: colors.textPrimary, marginTop: 4, maxWidth: 70 }} numberOfLines={1}>{u.partner.brand}</Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  group: { fontFamily: fonts.serif, fontSize: 22, marginBottom: 10 },
  soonPill: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 3, marginTop: 8 },
  story: { alignItems: 'center', minWidth: 64, minHeight: 44 },
  storyRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  storyIn: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
})
