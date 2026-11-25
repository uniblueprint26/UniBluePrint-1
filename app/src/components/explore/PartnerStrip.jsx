import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { View, FlatList, AccessibilityInfo, StyleSheet } from 'react-native'
import { PartnerCard } from './ExploreParts'
import { STRIP_PARTNERS, LIFESTYLE_STRIP_IDS } from '../../constants/exploreCatalog'
import { PARTNERS as LIFESTYLE_PARTNERS } from '../../data/lifestylePartners'
import { useTheme } from '../../context/ThemeContext'
import { usePriorityEnabled } from '../../hooks/useAppFlags'
import { useComingSoonEnabled } from '../../constants/comingSoon'

// The partner strip on Explore. It swipes by itself, one card at a time, and
// stops for a while as soon as the member touches it. If the phone is set to
// reduce motion it does not move on its own. Cards: Course Compass, Priority,
// Kobo, ScoutByRohi, Roomy.ie, then the real Lifestyle partners that have a logo.

const CARD = 264
const GAP = 12
const STEP = CARD + GAP
const EVERY_MS = 4500
const PAUSE_MS = 12000

export default function PartnerStrip({ onOpen }) {
  const { colors } = useTheme()
  const listRef = useRef(null)
  const index = useRef(0)
  const pausedUntil = useRef(0)
  const [active, setActive] = useState(0)
  const [reduceMotion, setReduceMotion] = useState(false)

  const priorityOn = usePriorityEnabled()
  // Kobo is a closed beta waitlist, so it is a coming soon item. Hidden unless the flag is on.
  const comingSoonOn = useComingSoonEnabled()
  const items = useMemo(() => {
    const lifestyle = LIFESTYLE_STRIP_IDS
      .map(id => LIFESTYLE_PARTNERS.find(p => p.id === id && p.status === 'live' && p.logo))
      .filter(Boolean)
      .map(p => ({
        key: `lifestyle-${p.id}`,
        name: p.brand,
        blurb: p.tagline || p.category,
        mark: 'image',
        logo: p.logo,
        cta: 'View',
        tag: 'Lifestyle',
        bg: colors.surface,
        fg: colors.textPrimary,
        accent: colors.textSecondary,
        markBg: '#FFFFFF',
        ring: colors.border,
        ctaBg: colors.accentBg,
        ctaFg: colors.accentFg,
        nameFont: 'DMSerifDisplay_400Regular',
        bodyFont: 'DMSans_400Regular',
        ctaFont: 'DMSans_600SemiBold',
        action: { route: 'LifestylePartners', params: { highlightId: p.id } },
      }))
    const base = STRIP_PARTNERS.filter(p => (priorityOn || p.key !== 'priority') && (comingSoonOn || p.key !== 'kobo'))
    return [...base, ...lifestyle]
  }, [colors, priorityOn, comingSoonOn])

  useEffect(() => {
    let alive = true
    AccessibilityInfo.isReduceMotionEnabled?.().then(v => { if (alive) setReduceMotion(!!v) }).catch(() => {})
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (reduceMotion || items.length < 2) return undefined
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return
      const next = (index.current + 1) % items.length
      index.current = next
      setActive(next)
      listRef.current?.scrollToOffset({ offset: next * STEP, animated: true })
    }, EVERY_MS)
    return () => clearInterval(id)
  }, [reduceMotion, items.length])

  const onDrag = useCallback(() => { pausedUntil.current = Date.now() + PAUSE_MS }, [])
  const onSettle = useCallback(e => {
    const i = Math.max(0, Math.min(items.length - 1, Math.round(e.nativeEvent.contentOffset.x / STEP)))
    index.current = i
    setActive(i)
  }, [items.length])

  return (
    <View>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        keyExtractor={p => p.key}
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        disableIntervalMomentum
        onScrollBeginDrag={onDrag}
        onMomentumScrollEnd={onSettle}
        contentContainerStyle={s.row}
        ItemSeparatorComponent={Gap}
        style={s.scroll}
        getItemLayout={(_, i) => ({ length: STEP, offset: STEP * i, index: i })}
        renderItem={({ item }) => <PartnerCard partner={item} onPress={() => onOpen(item)} />}
      />
      <View style={s.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {items.map((p, i) => (
          <View key={p.key} style={[s.dot, { backgroundColor: i === active ? colors.textPrimary : colors.border }, i === active && s.dotOn]} />
        ))}
      </View>
    </View>
  )
}

function Gap() { return <View style={{ width: GAP }} /> }

const s = StyleSheet.create({
  scroll: { marginHorizontal: -16 },
  row: { paddingHorizontal: 16, paddingVertical: 4 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 14 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotOn: { width: 18 },
})
